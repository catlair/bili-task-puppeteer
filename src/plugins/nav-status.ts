import { HTTPResponse, Page } from 'puppeteer-core';
import { DailyTask } from '../config/globalVar';

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin');

class EvalPlugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts);
  }

  get name() {
    return 'nav-status';
  }

  async onPageCreated(page: Page) {
    page.on('response', async (res: HTTPResponse) => {
      if (res.url().includes('/api.bilibili.com/x/web-interface/nav')) {
        try {
          const {
            code,
            message,
            data: {
              money,
              level_info: { current_level },
            },
          } = await res.json();
          if (code !== 0) {
            const logger = (await import('log4js')).getLogger();
            DailyTask.isRun = false;
            logger.fatal(message);
            process.exit(0);
          }

          // 登录状态存则设置一些内容
          DailyTask.money = money;
          DailyTask.isStopCoin =
            DailyTask.TARGET_LEVEL < current_level ||
            money < 1 ||
            money <= DailyTask.STAY_COINS;
        } catch {}
      }
    });
  }
}

module.exports = function (pluginConfig) {
  return new EvalPlugin(pluginConfig);
};
