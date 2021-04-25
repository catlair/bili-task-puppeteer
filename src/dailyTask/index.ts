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
  if (!DailyTask.CUSTOMIZE_UP?.length) {
    return;
  }
  try {
    const browser = page.browser();
    while (!DailyTask.isStopCoin) {
      const uid =
        DailyTask.CUSTOMIZE_UP[_.random(DailyTask.CUSTOMIZE_UP.length - 1)];
      const page = await browser.newPage();
      DailyTask.isStopCoin = await upTask(page, uid);
      await page.util.wt(2, 6);
    }
  } catch {}
}

async function coinByRecommend(page: Page) {
  try {
    while (!DailyTask.isStopCoin) {
      DailyTask.isStopCoin = await videoTask(await homeVideo(page));
      await page.util.wt(2, 7);
    }
  } catch {}
}

async function coinByFollow(page: Page) {
  let followPage: Page,
    errCount = 0;
  try {
    while (!DailyTask.isStopCoin) {
      if (errCount > 3) {
        return;
      }
      followPage = await getFollow(page);
      if (!followPage) {
        errCount++;
        continue;
      }
      DailyTask.isStopCoin = await upTask(followPage);
      await page.util.wt(5, 10);
    }
  } catch {}
}

async function watchAndShare(page: Page, isVideoPage?: boolean) {
  if (DailyTask.isShare) {
    return;
  }
  let videoPage: Page;
  if (isVideoPage) {
    videoPage = page;
  }
  try {
    videoPage || (videoPage = await homeVideo(page));
    await videoPage.util.wt(3, 6);
    await playVideo(videoPage);
    await shareVideo(videoPage);
  } catch {
  } finally {
    if (videoPage && !videoPage.isClosed()) {
      videoPage.close();
    }
  }
}

export { liveTask, coinByUID, coinByRecommend, coinByFollow, watchAndShare };
