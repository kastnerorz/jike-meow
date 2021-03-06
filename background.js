'use strict'

let socket;

chrome.runtime.onMessage.addListener(
  function (request) {
    if (request.logged_in === true) {
      newSocket();
    }
  });

chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
  var url = tab.url;
  if (url !== undefined && changeinfo.status === "complete") {

    chrome.runtime.sendMessage({
      current_url: url
    });

    chrome.storage.local.get(null, (res) => {
      if (res['new-tab-to-login'] && url.indexOf('web.okjike.com') > -1) {
        if (res['refresh-token'] && res['access-token']) {
          chrome.tabs.executeScript(null, { file: "scripts/store-token.js" }, () => {
            chrome.storage.local.set({
              'new-tab-to-login': false
            });
          });
        }
      }
    });
  }
});

let syncReturnToken = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(null, (res) => {
      if (res['access-token']) resolve(res['access-token']); else return;
    });
  });
}

let newSocket = async () => {

  // Disconnect all socket
  if (socket) socket.disconnect();
  socket = io('wss://msgcenter.jike.ruguoapp.com', {
    query: { 'x-jike-access-token': await syncReturnToken() }
  });
  socket.on('message', data => {
    if (data.type === 'NOTIFICATION') {
      chrome.browserAction.setBadgeText({
        text: data.data.unreadCount === 0 ? '' : data.data.unreadCount > 99 ? '99+' : data.data.unreadCount.toString()
      });
    }
  });
  socket.on('error', () => {
    socket.disconnect();
    chrome.browserAction.setBadgeText({ text: 'X' });
  });
  socket.on('disconnect', () => {
    socket.disconnect();
    chrome.browserAction.setBadgeText({ text: 'X' });
  });
}