import getFollow from './getFollow';
import homeVideo from './homeVideo';
import liveTask from './liveTask';
import playVideo from './playVideo';
import shareVideo from './shareVideo';
import upTask from './upTask';
import videoTask from './videoTask';
import * as _ from 'lodash';
import { Page } from 'puppeteer-core';
import { DailyTask } from '../config/globalVar';

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
  let videoPage: Page;
  try {
    if (!DailyTask.share) {
      videoPage = await homeVideo(page);
      await page.util.wt(3, 6);
      await playVideo(videoPage);
      await shareVideo(videoPage);
    }
  } catch {
  } finally {
    if (videoPage && videoPage.isClosed()) {
      videoPage.close();
    }
    if (page && page.isClosed()) {
      page.close();
    }
  }
}

export { liveTask, coinByUID, coinByRecommend, coinByFollow, watchAndShare };
