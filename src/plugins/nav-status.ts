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
          const { code, message } = await res.json();
          if (code !== 0) {
            DailyTask.isRun = false;
            console.log(message);
            process.exit(-1);
          }
        } catch {}
      }
    });
  }
}

module.exports = function (pluginConfig) {
  return new EvalPlugin(pluginConfig);
};
