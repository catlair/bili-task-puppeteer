import createbBrowser from '../createbBrowser';
import { getLogger } from 'log4js';
import * as _ from 'lodash';
import { getCookies } from '../utils';
import { OSConfig } from '../config/globalVar';

import judgement from './judgement';
export async function juryTask() {
  const logger = getLogger('juryTask');
  for (let isRun = 1; ; ) {
    const browser = await createbBrowser();
    const page = await browser.newPage();
    await page.setCookie(...getCookies(OSConfig.COOKIE, '.bilibili.com'));
    try {
      isRun = await judgement(page);
    } finally {
      logger.debug('关闭浏览器');
      await browser.close();
    }
    // 用于清除extra插件的监听器,避免监听器过多警告
    process.removeAllListeners();
    const temp = _.random(300000, 700000);
    if (isRun === 0) {
      break;
    }
    logger.info(`等待${_.floor(_.divide(temp, 60000), 2)}分重启`);
    await page.util.wt(temp, 'ms');
  }
}
