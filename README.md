# 即刻喵

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/gahlkoaglgmbpjoecaahganpccafojaa.svg)](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN)
![rating](https://img.shields.io/chrome-web-store/stars/gahlkoaglgmbpjoecaahganpccafojaa.svg)
![users](https://img.shields.io/chrome-web-store/users/gahlkoaglgmbpjoecaahganpccafojaa.svg)

基于 [vue.js](https://cn.vuejs.org/index.html) 和 [socket.io](https://github.com/socketio/socket.io) 开发。

## 主要功能

* 📦 一键登录 - 为网页端提供一键登录功能
* 📡 未读通知 - 实时显示未读消息数量
* 🚀 消息列表 - 直接查看详细的通知内容
* 😉 保护隐私 - 不收集任何个人信息

## 写在前面

不同于标准的前端开发，Chrome Extensions 拥有完全不同的 API 和底层设计，但这些并不影响你通过 React 或 Vue 类似的框架，来构建一个完整的 Chrome 应用，甚至还能在 GitHub 上找到一些第三方「脚手架」来达到这一目的。前提是你得熟悉项目的结构和基本规范。

这里提供两个我用于参考的文档链接，它们对于这个项目起到了至关重要的作用：

* 官方开发文档：[传送门](https://developer.chrome.com/extensions)
* 非官方中文开发文档：[传送门](https://crxdoc-zh.appspot.com/extensions)

## 通过官方应用商店安装

* 在 [Google Chrome](https://chrome.google.com/webstore/detail/即刻喵/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN) 浏览器上安装
* 在 [Mozilla Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/%E5%8D%B3%E5%88%BB%E5%96%B5/) 浏览器上安装

## 通过源代码安装

- 下载项目源代码并解压缩到任意文件夹中
- 打开 Chrome 浏览器并进入到 Extensions 管理界面
- 点击左上角 Load unpacked 并选择解压缩后的文件夹
- 确认即可完成安装

## 项目结构

* **./images/** 插件的配图及图标
* **./scripts/** 内容脚本和第三方库
* **background.js** 计时器脚本
* **popup.js** 主视图脚本

## F.A.Q

### 为什么不支持点赞、回复功能？

答：这些都是和用户行为有关的特性，需要经过极为严谨的测试才能上线，否则很容易导致不必要的误会。由于这是个第三方插件，对接流程并不走官方渠道，所以暂时不会考虑上线这样的功能。

### 访问不了 Chrome Web Store 有什么办法解决吗？

这是个开源项目，并且与你的隐私信息有关，因此，一个值得信赖的安装渠道是十分重要的，这样不仅能够避免被他人篡改，也可以保护你的隐私，显然 Chrome Web Store 是「唯一」的选择，还请谅解。当然了，作为开发者我可以承诺，绝不收集你的任何隐私信息。

### 接下来的版本还会更新功能吗？

会，只要版本号小数点后一位有变化，就会加入新特性，例如 1.0.0 > 1.1.0 这样。但 1.0.0 > 1.0.1 通常只是维护性的升级。但无论是何种情况，我都希望每一位用户能及时地更新至最新版本。

## 特别感谢

该产品严格按照「即刻」App 的相关功能设计，使用了官方 API、设计风格来实现基本的交互逻辑，并根据 Chrome Extension 的特点进行二次开发，最终实现了较为接近客户端的体验。在此特别感谢即刻 CEO 瓦总（@瓦恁）对于第三方开发者加入的赞成态度，以及晨哥（@复读机复读机复读机）、镇长（@熊猫镇长）对该项目的大力推动，和鸡哥（@糯米鸡）提供的技术支持！❤️

除本项目之外，还有许多优秀的「即刻」第三方项目，统一收录在 [即刻镇](https://jike.town/) 中，欢迎访问。