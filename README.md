# bili-task-puppeteer

基于 puppeteer 的 bili 每日任务

## 说用说明

[获取 Docker 镜像](https://registry.hub.docker.com/repository/docker/catlair/bilitaskpuppeteer) `catlair/bilitaskpuppeteer:latest`

### 支持的功能

**所有的模块都在 dailyTask/juryTask 中，支持的功能可能只是模块的组合方式不同**

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

## 责任声明

1. 本项目旨在学习 Docker 的使用，若存在损害您合法权益的内容，请联系本人处理（hub 主页有邮箱）。
2. bug 是不可避免的，我们尽量减少 bug 所带来得损失，但**这并不意味着我们要为此负责**，选择权在您，望周知。
3. 使用 Bilibili （以下简称 b 站） 进行测试，不会提供的内容包括但不限于 b 站抢辣条、转发抽奖、下载 VIP 视频等内容，请在阅读代码后删除源码及相关工具。
4. 不会以任何方式收集用户 ID、cookie、关注列表、收藏记录等信息。
5. 任何方式的 cookie 泄露都与我无关。**请不要将 cookie 上传到 Github 等开放平台以及其他任何不可信平台**。
6. 除仓库和[本仓库 Docker 镜像](https://registry.hub.docker.com/repository/docker/catlair/bilitaskpuppeteer)，其余皆与本人无关。
7. Docker 中的镜像由 Actions 直接构建，可以查看 Actions 中返回的 `hash` 进行对比。**若 `hash` 值不一致则与本仓库无关**。
8. 本参考只使用 Actions 进行 Docker 构建、项目测试等操作。**请您务必遵守 Github 服务条款，不要滥用 Actions 工作流**。
9. 仓库中不含本人任何 b 站相关信息，**任何您不清楚的投币、充电、打赏都与本仓库无关**。

## 参考项目

- API 参考 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- Docker 参考 [Zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome)

注：部分参考项目为了被方便查找而就进注解
