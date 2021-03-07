import { getCookies } from './utils';
import createBrowser from './createbBrowser';
import upTask from './dailyTask/upTask';
import * as _ from 'lodash';
import index from './dailyTask';
import judgement from './dailyTask/judgement';
import * as log4js from 'log4js';
import homeVideo from './dailyTask/homeVideo';
import { DailyTask } from './config/globalVar';
import shareVideo from './dailyTask/shareVideo';

require('dotenv').config();

log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('test');

(async () => {
  const browser = await createBrowser();
  const page = await browser.newPage();
  for (let isRun = 1; ; ) {
    await page.setCookie(
      ...getCookies(process.env.TEST_COOKIE, '.bilibili.com'),
    );

    isRun = await judgement(page);
    logger.debug('关闭浏览器');
    await browser.close();
    // 用于清除extra插件的监听器,避免监听器过多警告
    process.removeAllListeners();
    const temp = _.random(300000, 700000);
    if (isRun === 0) break;
    logger.info(`等待${_.floor(_.divide(temp, 60000), 2)}分重启`);
    while (!(await upTask(await index(page)))) {
      await page.waitForTimeout(_.random(2000, 6000));
    }
    if (!DailyTask.share) {
      const videoPage = await homeVideo(page);
      await page.util.wt(3, 6);
      await shareVideo(videoPage);
    }

    await new Promise(resolve => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        resolve(0);
      }, temp);
    });
  }
})();
