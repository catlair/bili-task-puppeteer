import { getCookies } from './utils';
import createBrowser from './createbBrowser';
import upTask from './dailyTask/upTask';
import * as _ from 'lodash';
import getFollow from './dailyTask/getFollow';
import judgement from './dailyTask/judgement';
import * as log4js from 'log4js';
import homeVideo from './dailyTask/homeVideo';
import { DailyTask } from './config/globalVar';
import shareVideo from './dailyTask/shareVideo';
import videoTask from './dailyTask/videoTask';
import liveTask from './dailyTask/liveTask';
require('dotenv').config();

log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('test');

(async () => {
  //风纪委员任务
  // for (let isRun = 1; ; ) {
  const browser = await createBrowser();
  const page = await browser.newPage();
  await page.setCookie(
    ...getCookies(process.env.TEST_COOKIE3, '.bilibili.com'),
  );

  //   isRun = await judgement(page);
  //   logger.debug('关闭浏览器');
  //   await browser.close();
  //   // 用于清除extra插件的监听器,避免监听器过多警告
  //   process.removeAllListeners();
  //   const temp = _.random(300000, 700000);
  //   if (isRun === 0) break;
  //   logger.info(`等待${_.floor(_.divide(temp, 60000), 2)}分重启`);
  //   await new Promise(resolve => {
  //     const timer = setTimeout(() => {
  //       clearTimeout(timer);
  //       resolve(0);
  //     }, temp);
  //   });
  // }

  //给指定uid的up投币
  // while (!(await upTask(page, 456664753))) {
  //   await page.waitForTimeout(_.random(2000, 6000));
  // }

  //从首页推荐选择投币
  // while (!(await videoTask(await homeVideo(page)))) {
  // await page.waitForTimeout(_.random(2000, 6000));
  // }

  //给关注用户投币
  while (!(await upTask(await getFollow(page)))) {
    await page.waitForTimeout(_.random(2000, 6000));
  }
  //分享
  if (!DailyTask.share) {
    const videoPage = await homeVideo(page);
    await page.util.wt(3, 6);
    await shareVideo(videoPage);
  }

  //直播发送弹幕,headless存在大量问题
  await liveTask(page);

  // await page.util.wt(3, 6);
  // await browser.close();
})();
