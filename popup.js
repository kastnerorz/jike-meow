// Official Doc: https://developer.chrome.com/extensions
// Unofficial Doc: https://crxdoc-zh.appspot.com/extensions

/*
auth token, Get notification list
refresh token, Cover new token
access token, Socket and other functions
*/

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      isUIEnabled: false,
      isQrCodeLoading: true,
      isQrCodeScanning: false,
      isNotificationError: false,
      isNotificationLoading: false,
      isNotificationCheckingFunctionEnabled: false,
      isEnlargedImageLoading: false, // 图片查看器加载指示
      apiURL: 'https://app.jike.ruguoapp.com', // 全局 API 地址
      currentPageURL: '', // 当前捕捉到的页面地址
      uuid: '',
      authToken: '',
      refreshToken: '',
      accessToken: '',
      notifications: [], // 通知列表
      lastCheckedNotificationId: '', // 通知列表分页显示
      lastNotificationCheckingTime: '', // 最近一次查看通知的时间
      enlargedImage: '' // 图片查看器
    }
  },
  created() {
    let _this = this;
    _this.isQrCodeLoading = false;

    // Get current tab URL
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      _this.currentPageURL = tabs[0].url;
    });

    // chrome.notifications.create(null, {
    //   type: 'basic',
    //   iconUrl: 'https://s3.ifanr.com/wp-content/uploads/2018/01/5-17.jpg!100',
    //   title: '有人 @ 了你',
    //   message: 'Hello'
    // });

    // chrome.notifications.onClicked.addListener(function () { });

    // Get token from chrome storage
    chrome.storage.local.get(null, function (result) {
      if (result['auth-token'] && result['refresh-token'] && result['access-token']) {
        if (result['notification-function']) {
          _this.isNotificationCheckingFunctionEnabled = (result['notification-function'] === 'true');
        }
        _this.authToken = result['auth-token'];
        // Refresh token from chrome storage
        axios({
          url: _this.apiURL + '/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': result['refresh-token']
          }
        })
          .then(response => {
            if (response.status !== 200) {
              alert('系统错误, 若多次刷新均无法获取数据, 建议重新登录');
              return;
            }
            const data = response.data;
            _this.refreshToken = data['x-jike-refresh-token'];
            _this.accessToken = data['x-jike-access-token'];
            _this.isUIEnabled = true;
            chrome.storage.local.set({
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            });
            _this.getNotificationList('refresh');
            chrome.runtime.sendMessage({
              logged_in: true
            });
          })
          .catch(() => {
            alert('网络错误');
            return;
          });
      } else {
        _this.getUuid();
      }
    });

    // Callback from background.js
    // Refresh current_url data
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.current_url) {
        _this.currentPageURL = result.current_url;
      }
    });
  },
  methods: {
    newQRCode(url) {
      let qrElement = this.$refs['login-qrcode'];
      if (!qrElement) return;
      qrElement.innerHTML = '';
      let qrcode = new QRCode(qrElement, {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    },
    enabledUI() {
      return new Promise(resolve => {
        this.isUIEnabled = true;
        resolve();
      });
    },
    getUuid() {
      let _this = this;
      _this.isQrCodeScanning = false;
      _this.isQrCodeLoading = true;

      axios.get(_this.apiURL + '/sessions.create')
        .then(function (response) {
          if (response.status !== 200) {
            _this.isQrCodeLoading = false;
            _this.isUIEnabled = false;
            alert('系统错误');
            return;
          }
          _this.uuid = response.data.uuid;
          _this.isQrCodeLoading = false;
          _this.enabledUI().then(() => {
            _this.newQRCode('jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D' + _this.uuid + '&displayHeader=false&displayFooter=false');
          })
          _this.waitForLogin();
        })
        .catch(function () {
          _this.isQrCodeLoading = false;
          _this.isUIEnabled = false;
          return;
        });
    },
    waitForLogin() {
      let _this = this;

      axios.get(_this.apiURL + '/sessions.wait_for_login', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (response) {
          const data = response.data;
          if (data && data.logged_in === true) {
            _this.isQrCodeScanning = true;
            _this.isQrCodeLoading = true;
            _this.waitForConfirmation();
          } else {
            _this.getUuid();
          }
        })
        .catch(function () {
          _this.getUuid();
        });
    },
    waitForConfirmation() {
      let _this = this;

      axios.get(_this.apiURL + '/sessions.wait_for_confirmation', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          const data = res.data;
          _this.isQrCodeLoading = false;
          _this.isQrCodeScanning = false;
          if (data.confirmed === true) {
            _this.uuid = '';
            _this.authToken = data.token;
            _this.refreshToken = data['x-jike-refresh-token'];
            _this.accessToken = data['x-jike-access-token'];
            chrome.storage.local.set({
              'auth-token': data.token,
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            });
            _this.getNotificationList();
            chrome.runtime.sendMessage({
              logged_in: true
            });
          } else {
            _this.getUuid();
          }
        })
        .catch(function () {
          alert('网络错误');
          return;
        })
    },
    getNotificationList(status) {
      let _this = this;
      _this.isNotificationError = false;
      _this.lastNotificationCheckingTime = '';
      _this.isNotificationLoading = true;

      // If string === "refresh"
      // Means it should refresh new data
      if (status === 'refresh') {
        _this.notifications = [];
        _this.lastCheckedNotificationId = '';
      }

      axios({
        method: 'post',
        url: _this.apiURL + '/1.0/notifications/list',
        data: {
          'loadMoreKey': {
            lastNotificationId: _this.lastCheckedNotificationId
          }
        },
        headers: {
          'x-jike-app-auth-jwt': _this.authToken,
          'app-version': '4.8.0'
        }
      })
        .then(function (response) {
          if (response.status !== 200) {
            _this.isNotificationLoading = false;
            _this.isNotificationError = true;
            alert('系统错误');
            return;
          }
          const res = response.data;
          if (status === 'refresh') chrome.browserAction.setBadgeText({ text: '' });

          if (res.data.length <= 0) {
            _this.isNotificationLoading = false;
            return;
          }
          chrome.storage.local.get(null, function (result) {
            if (result['last-check-notifications-time']) _this.lastNotificationCheckingTime = result['last-check-notifications-time'];
            res.data.map(item => {
              if ((new Date(item.createdAt)).getTime() <= _this.lastNotificationCheckingTime) item.isViewed = true;
              _this.notifications.push(item);
            });

            chrome.storage.local.set({
              'last-check-notifications-time': (new Date(_this.notifications[0].createdAt)).getTime()
            });
            _this.isNotificationLoading = false;
          });
        })
        .catch(function () {
          _this.isNotificationLoading = false;
          _this.isNotificationError = true;
          alert('网络错误');
          return;
        });
    },
    notificationScrolling(e) {
      let _this = this
      let notificationDom = document.getElementById('notification');
      let scrollHeight = notificationDom.scrollHeight;
      let scrollTop = notificationDom.scrollTop;
      if (scrollHeight - scrollTop < 700 && _this.isNotificationLoading === false) {
        _this.lastCheckedNotificationId = _this.notifications[_this.notifications.length - 1].id;
        _this.getNotificationList();
        return;
      }
    },
    reformatTime(updateTime) {
      const oldTimestamp = (new Date(updateTime)).getTime(),
        newTimestamp = (new Date().getTime()),
        lastTime = newTimestamp - oldTimestamp;
      if (lastTime < 0) {
        return '???';
      } else {
        if (lastTime < 60000) {
          return '刚刚'
        } else if (lastTime >= 60000 && lastTime < 3600000) {
          return Math.round(lastTime / 60000) + '分钟前';
        } else if (lastTime >= 3600000 && lastTime < 86400000) {
          return Math.round(lastTime / 3600000) + '小时前';
        } else if (lastTime >= 86400000 && lastTime < 2592000000) {
          return Math.round(lastTime / 86400000) + '天前';
        } else if (lastTime >= 2592000000 && lastTime < 31104000000) {
          return Math.round(lastTime / 2592000000) + '月前';
        } else if (lastTime >= 31104000000) {
          return Math.round(lastTime / 31104000000) + '年前';
        }
      }
    },
    followUser(item) {
      let _this = this;
      axios({
        method: 'post',
        url: _this.apiURL + '/1.0/userRelation/follow',
        headers: { 'x-jike-access-token': _this.accessToken },
        data: { username: item.actionItem.users[0].username }
      })
        .then(function (res) {
          if (res.status !== 200) {
            alert('系统错误');
            return;
          }
          item.actionItem.users[0].following = true;
        })
        .catch(function () {
          alert('网络错误');
          return;
        });
    },
    unfollowUser(item) {
      let _this = this;
      axios({
        method: 'post',
        url: _this.apiURL + '/1.0/userRelation/unfollow',
        headers: { 'x-jike-access-token': _this.accessToken },
        data: { username: item.actionItem.users[0].username }
      })
        .then(function (response) {
          if (response.status !== 200) {
            alert('系统错误');
            return;
          }
          item.actionItem.users[0].following = false;
        })
        .catch(function () {
          alert('网络错误');
          return;
        });
    },
    toggleNotificationFunction(response) {
      chrome.storage.local.set({
        'notification-function': response.toString()
      });
      this.isNotificationCheckingFunctionEnabled = response;
    },
    logIn() {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        if (tabs[0].url.indexOf('web.okjike.com') > -1) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/store-token.js'
          });
        } else {
          window.open('https://web.okjike.com');
          chrome.storage.local.set({
            'new-tab-to-login': true
          });
        }
      });
    },
    logOut() {
      if (confirm('确认退出吗？') === true) {
        chrome.storage.local.clear();
        chrome.runtime.reload();
      }
    },
    previewImage(url) {
      if (url) this.enlargedImage = url;
    },
    openImage() {
      let _this = this;
      _this.isEnlargedImageLoading = true;
      if (_this.enlargedImage) window.open(_this.enlargedImage);
    }
  }
});