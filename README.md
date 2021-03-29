# bili-task-puppeteer

基于 puppeteer 的 bili 每日任务

## 尝鲜说明

### 支持的功能

**所有的模块都在 dailyTask/juryTask 中,支持的功能可能只是模块的组合方式不同**

- 风纪委员任务(目前考虑到执行时间和周期的问题，此任务和每日任务相互排斥)
- 给指定 uid 的 up 投币
- 视频投币过程会播放和分享(音乐和专分享没有经验)
- 从首页推荐选择投币
- 给关注用户投币
- 直播发送弹幕,headless 存在偶尔漏过部分的 bug

当三种投币方式都开启时,会按照自定义 -> 关注 -> 推荐的顺序进行投币(前面的完成就不会有后面的进行)  
当投币过程没有遇到视频,则在推荐视频中选取一个进行播放和分享

### 使用方式

- 目前版本的配置内容十分简单, 参考`config/config.demo.json`配置`config/config.json`即可,不要填写错误(json 是不允许有注释的,前者只是参考)
- 考虑到 action 下配置是文明, 所以所有环境的 `cookie` 采用环境变量`BILI_COOKIE=帐号cookie`的方式进行配置

### Action 运行(不推荐)

- **不推荐理由: 1. github 的服务器地址在国外且众所周知,容易被风控。2. action 参与非开发任务可能存在 github 帐号被限制的风险**

- 配置 `config/config.json`并提交

- 将完整 cookie 保存`github secrets`为`BILI_COOKIE`。参考/运行`.github/workflows/bilibili-task.yaml`

### docker 运行

- 开发测试中使用的 docker 环境, 由于技术有限, 用 docker 的大佬自己发挥吧。基本使用参考`.github/workflows/bilibili-task.yaml`

- 配置 `config/config.json` 并挂载到 `/usr/src/app/config`目录下

- 配置环境变量除了直接使用`--env`也可以挂载`.env`文件到`/usr/src/app/.env`。除了 cookie 外,更多可配置的变量参考`.env.example`

- docker 内置的 chrome 用户没有特殊权限。若需要, docker 运行时添加`--cap-add=SYS_ADMIN`参数

- 如有需要可以 `-v $(pwd)/logs:/usr/src/app/logs`

### 本地运行

- 本地需要安装`Node.js`编译和运行,版本最好 12+

- 需要安装 chrome/chromium/chromium-edge 等`chromium`浏览器,版本最好在 79+

- 配置环境变量`PUPPETEER_EXECUTABLE_PATH=浏览器可执行文件路径`  
  例如`PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

## 暂时无法解决的问题

- ~~live 在 headless 模式下可能存在多次失败和重试并后续出现卡死的风险~~(修改能运行模式, 目前在观察中,由于某种原因导致测试样本减少,时间将加长)

## 被忽略的问题

- 自定义关注分组请注意分组中的 up 数量(主要是 up 的投稿总数量),过低会导致一直找不到可投币目标,直到无法控制 ( **没必要修改的问题自己避免即可** )

- 投币数在执行前已经达成, 访问到的稿件投币数也达到, ~~会出现多此一举的再出寻找下一个稿件~~(判断是否投币完成需要点击弹出投币界面,不能投币的已经没有这个页面了)

- ~~UP 主的部分视频可能是纪录片或者活动作品, 打开此类视频后会 **关闭页面并重新选择内容**~~(`v0.0.4`已经支持)

- 环境中不存在开发时依赖`ts-node`, 如需要请自行安装

## 其他已知问题

- [ ] 关注的 up 列表是动态加载的, 目前存在只抓取到【全部关注】而非指定标签的情况(在延时和判断页面 loading 的情况下极小概率)

## 一些设想

- 试图拦截 request 直接修改某些请求,实际上 puppeteer 不支持串行的拦截,导致此行为和第三方的包有所冲突
  <https://github.com/puppeteer/puppeteer/pull/6735>

## 参考项目

- API 参考 [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
- docker 参考 [Zenika/alpine-chrome](https://github.com/Zenika/alpine-chrome)
