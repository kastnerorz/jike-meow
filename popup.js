// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      url: 'https://app.jike.ruguoapp.com',
      uuid: '',
      token: '',
      access_token: '',
      qr_loading: true,
      qr_scanning: false
    }
  },
  created() {
    var _this = this
    _this.qr_loading = false
    chrome.storage.local.get(null, function (result) {
      chrome.browserAction.setBadgeText({ text: '0' })
      // 判断 Storage 中是否存在 Token 数据
      if (result.token && result['access-token'] && result['refresh-token']) {
        // 刷新 Token
        axios({
          url: _this.url + '/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': result['refresh-token']
          }
        })
          .then(function (response) {
            var res = response.data
            _this.token = res.token
            _this.access_token = res['x-jike-access-token']
            _this.newQRCode('http://t.cn/RsK7PgI')
            // 在 Storage 中存储 Token
            chrome.storage.local.set({
              'token': result.token,
              'access-token': res['x-jike-access-token'],
              'refresh-token': res['x-jike-refresh-token']
            })
            // 部署网页 LocalStorage 数据
            chrome.tabs.executeScript(null, {
              file: 'scripts/store-token.js'
            })
          })
          .catch(function () {
            alert('数据异常')
          })
      } else {
        _this.getUuid()
      }
    })
    // 接收 store-token.js 的判断
    chrome.runtime.onMessage.addListener(function (result) {
      if (!result.access_token) {
        _this.token = ''
        _this.access_token = ''
        chrome.browserAction.setBadgeText({ text: '0' })
        _this.getUuid()
      }
    })
  },
  methods: {
    // 生成二维码
    newQRCode(url) {
      document.getElementById('qrcode').innerHTML = ''
      var qrcode = new QRCode(document.getElementById('qrcode'), {
        text: '',
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      })
      qrcode.makeCode(url)
    },
    newTimestamp() {
      var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function (num) {
          var norm = Math.floor(Math.abs(num))
          return (norm < 10 ? '0' : '') + norm
        }
      return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        'T' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60)
    },
    // 获取二维码
    getUuid() {
      var _this = this
      _this.qr_scanning = false
      _this.qr_loading = true
      axios.get(_this.url + '/sessions.create')
        .then(function (res) {
          var data = res.data
          _this.qr_loading = false
          _this.uuid = data.uuid
          _this.newQRCode('jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D' + _this.uuid + '&displayHeader=false&displayFooter=false')
          _this.waitForLogin()
        })
        .catch(function () {
          _this.qr_loading = false
          return false
        })
    },
    // 等待客户端确认
    waitForLogin() {
      var _this = this
      axios.get(_this.url + '/sessions.wait_for_login', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          var data = res.data
          if (data && data.logged_in === true) {
            _this.qr_scanning = true
            _this.qr_loading = true
            _this.waitForConfirmation()
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          _this.getUuid()
        })
    },
    // 点击确认登录
    waitForConfirmation() {
      var _this = this
      axios.get(_this.url + '/sessions.wait_for_confirmation', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          var data = res.data
          _this.qr_loading = false
          _this.qr_scanning = false
          if (data.confirmed === true) {
            _this.newQRCode('http://t.cn/RsK7PgI')
            _this.token = data.token
            _this.access_token = data['x-jike-access-token']
            chrome.storage.local.set({
              'token': data.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })
            // 部署网页 LocalStorage 数据
            chrome.tabs.executeScript(null, {
              file: 'scripts/store-token.js'
            })
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          alert('验证接口请求异常，请手动刷新二维码')
          return false
        })
    },
    // 登出
    logOut() {
      chrome.tabs.executeScript(null, {
        file: 'scripts/log-out.js'
      })
    }
  }
})