# bili-task-puppeteer

基于 puppeteer 的 bili 每日任务

## 说用说明

**玩玩可以，别当真**  
**随便写的，在经过一段时间的使用后发现很多问题，所以决定不再进行更新了**    
**`docker`中运行出现的问题，开发时完全没有遇到过，又难以在开发情况下复现**

[获取 Docker 镜像](https://registry.hub.docker.com/repository/docker/catlair/bilitaskpuppeteer) `catlair/bilitaskpuppeteer:latest`

### 支持的功能

**所有的模块都在 dailyTask/juryTask 中，支持的功能可能只是模块的组合方式不同**

2021-09 风纪，直播可用，其他未知  
**2021-10 风纪委员已经失效了。B 站进行了更新**

- 风纪委员任务（目前考虑到执行时间和周期的问题，此任务和每日任务相互排斥）
- 给指定 uid 的 up 投币
- 视频投币过程会播放和分享（音乐和专分享没有经验）
- 从首页推荐选择投币
- 给关注用户投币
- 直播发送弹幕，headless 存在偶尔漏过部分的 bug
- 直播签到

当三种投币方式都开启时，会按照自定义 -> 关注 -> 推荐的顺序进行投币（前面的完成就不会有后面的进行）  
当投币过程没有遇到视频，则在推荐视频中选取一个进行播放和分享

### 基本配置

- 目前版本的配置内容十分简单， 参考 `config/config.demo.json` 配置 `config/config.json` 或者参考 `.env.example` 配置 `.env` 即可，不要填写错误（如 json 是不允许有注释的，前者只是参考）

### Docker 运行

- 开发测试中使用的 Docker 环境，由于技术有限，用 Docker 的大佬自己发挥吧，最基本的使用详见 `docker-compose.yml` 文件。
- 配置 `crontab` 参考 <https://github.com/catlair/bili-task-puppeteer/tree/main/tools>

### 本地运行

- 本地需要安装 [Node.js](https://nodejs.org/zh-cn/) 编译和运行，版本最好 `12+`

- 需要安装 `chrome/chromium/chromium-edge` 等`chromium`浏览器，版本最好在 `79+`

- 配置环境变量`PUPPETEER_EXECUTABLE_PATH=浏览器可执行文件路径`  
  例如`PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

## 暂时无法解决的问题

- 偶发性问题很多（QvQ）
- 不使用 `puppeteer` 安装 `chromium` 是因为访问 b 站视频存在问题

## 被忽略的问题

- 自定义关注分组请注意分组中的 up 数量(主要是 up 的投稿总数量)，过低会导致一直找不到可投币目标，直到无法控制 ( **没必要修改的问题自己避免即可** )

- 投币数在执行前已经达成， 访问到的稿件投币数也达到， ~~会出现多此一举的再出寻找下一个稿件~~(判断是否投币完成需要点击弹出投币界面，不能投币的已经没有这个页面了)

- 环境中不存在开发时依赖 `ts-node`， 如需要请自行安装

## 其他已知问题

- [ ] [#1 前往随机 up 失败,出现超时错误](https://github.com/catlair/bili-task-puppeteer/issues/1)

## 一些设想

1. 试图拦截 request 直接修改某些请求，实际上 puppeteer 不支持串行的拦截，导致此行为和第三方的包有所冲突
   <https://github.com/puppeteer/puppeteer/pull/6735> `puppeteer@10.0.0` 删除了相关 flag <https://github.com/puppeteer/puppeteer/releases/tag/v10.0.0>

## 参考项目

- API 参考 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- Docker 参考 [Zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome)

注：部分参考项目为了被方便查找而就进注解
