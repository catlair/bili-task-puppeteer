# bili-task-puppeteer

基于 puppeteer 的 bili 每日任务

## 尝鲜说明

`v0.0.1`版本的配置内容十分简单, 参考`config/config.demo.json`配置`config/config.json`即可,不要填写错误(json 是不允许有注释的,前者只是参考)

### Action 运行

将完整 cookie 保存`github secrets`为`BILI_COOKIE`  
参考/运行`.github/workflows/bilibili-task.yaml`

### docker 运行

除了基本的配置还需要单独配置 cookie,可以使用`--env`添加`BILI_COOKIE`(参考 action 运行)。或者修改 Dockerfile 进行构建(在工作目录添加一个`.env`文件`BILI-COOKIE="cookie"`)等方法
`docker run -it --rm -v $(pwd):/usr/src/app --cap-add=SYS_ADMIN catlair/bilitaskpuppeteer node ./dist/index.js`  
如果出现权限问题请添加`--user root`参数

### 本地直接运行

本地需要安装`Node.js`编译和运行,版本最好 12+  
需要安装 chrome/chromium/chromium-edge 等`chromium`浏览器,版本最好在 79+
配置环境变量`PUPPETEER_EXECUTABLE_PATH=浏览器可执行文件路径`  
例如`PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

### 支持的功能

**所有的模块都在 dailyTask 中,支持的功能可能只是模块的组合方式不同**

- 风纪委员任务
- 给指定 uid 的 up 投币
- 从首页推荐选择投币
- 给关注用户投币
- 直播发送弹幕,headless ~~存在大量问题~~存在偶尔漏过部分的 bug

## 暂时无法解决的问题

- ~~live 在 headless 模式下可能存在多次失败和重试并后续出现卡死的风险~~(修改能运行模式, 目前在观察中,由于某种原因导致测试样本减少,时间将加长)

## 被忽略的问题

- 自定义关注分组请注意分组中的 up 数量(主要是 up 的投稿总数量),过低会导致一直找不到可投币目标,直到无法控制 ( **没必要修改的问题自己避免即可** )

- UP 主的部分视频可能是纪录片或者活动作品,界面不同会导致无法进行操作, 打开此类视频后会 **关闭页面并重新选择内容**

- 环境中不存在开发时依赖`ts-node`, 如需要请自行安装

## 一些设想

- 试图拦截 request 直接修改某些请求,实际上 puppeteer 不支持串行的拦截,导致此行为和第三方的包有所冲突
  <https://github.com/puppeteer/puppeteer/pull/6735>

## 参考项目

- API 参考 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- docker 参考 [Zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome)
