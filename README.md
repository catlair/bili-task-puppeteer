# bili-task-puppeteer

基于 puppeteer 的 bili 每日任务

## 暂时无法解决的问题

- 试图拦截 request 直接修改某些请求,实际上 puppeteer 不支持串行的拦截,导致此行为和第三方的包有所冲突
  <https://github.com/puppeteer/puppeteer/pull/6735>

- live 在 headless 模式下可能存在~~多处卡死~~多次失败和重试并后续出现卡死的风险

## 注意

- ~~暂时上传 log,毕竟除了用户个人信息没其他东西~~

- 为了不同环境的统一,chrome 的路径将由环境变量(`PUPPETEER_EXECUTABLE_PATH`)决定

- 自定义关注分组请注意分组中的 up 数量(主要是 up 的投稿总数量),过低会导致一直找不到可投币目标,直到无法控制 (没必要修改的问题自己避免即可)

## API 参考

- [SocialSisterYi/bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)
