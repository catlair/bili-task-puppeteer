import getFollow from './getFollow';
import homeVideo from './homeVideo';
import liveTask from './liveTask';
import judgement from './judgement';
import playVideo from './playVideo';
import shareVideo from './shareVideo';
import upTask from './upTask';
import videoTask from './videoTask';
import * as _ from 'lodash';
import { Page } from 'puppeteer-core';
import { DailyTask, OSConfig } from '../config/globalVar';
import createbBrowser from '../createbBrowser';
import { getLogger } from 'log4js';
import { getCookies } from '../utils';

async function juryTask() {
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

async function coinByUID(page: Page) {
  try {
    let uid =
      DailyTask.CUSTOMIZE_UP[_.random(DailyTask.CUSTOMIZE_UP.length - 1)];
    if (!uid) {
      return;
    }
    while (!(await upTask(page, uid))) {
      uid = DailyTask.CUSTOMIZE_UP[_.random(DailyTask.CUSTOMIZE_UP.length - 1)];
      await page.waitForTimeout(_.random(2000, 6000));
    }
  } catch {}
}

async function coinByRecommend(page: Page) {
  try {
    while (!(await videoTask(await homeVideo(page)))) {
      await page.util.wt(2, 7);
    }
  } catch {}
}

async function coinByFollow(page: Page) {
  try {
    let followPage: Page, isStopCoin: boolean;
    while (!isStopCoin) {
      followPage = await getFollow(page);
      if (!followPage) {
        return;
      }
      isStopCoin = await upTask(followPage);
      await page.util.wt(2, 7);
    }
  } catch {}
}

async function watchAndShare(page: Page) {
  try {
    if (!DailyTask.share) {
      const videoPage = await homeVideo(page);
      await page.util.wt(3, 6);
      await shareVideo(videoPage);
      await playVideo(videoPage);
    }
  } catch {}
}

export {
  liveTask,
  juryTask,
  coinByUID,
  coinByRecommend,
  coinByFollow,
  watchAndShare,
};
