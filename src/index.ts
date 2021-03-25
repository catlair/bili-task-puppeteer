require('dotenv').config();
import { FunConfig, OSConfig } from './config/globalVar';
import {
  coinByFollow,
  coinByRecommend,
  coinByUID,
  liveTask,
  watchAndShare,
} from './dailyTask';
import { juryTask } from './juryTask';
import { getCookies } from './utils';
import createBrowser from './createbBrowser';
import * as path from 'path';
import * as log4js from 'log4js';

log4js.configure(path.resolve(__dirname, './config/log4js.json'));

(async () => {
  if (process.env.BILI_TASK_JURY?.toLowerCase() === 'true') {
    //风纪委员任务
    await juryTask();
    return;
  }

  const browser = await createBrowser();
  let page = await browser.newPage();
  try {
    await page.setCookie(...getCookies(OSConfig.COOKIE, '.bilibili.com'));
    //给指定uid的up投币
    if (FunConfig.coinByUID) {
      await coinByUID(page);
    }
    //从首页推荐选择投币
    if (FunConfig.coinByRecommend) {
      await coinByRecommend(page);
    }
    // 给关注用户投币;
    if (FunConfig.coinByFollow) {
      await coinByFollow(page);
    }
    // 分享;
    if (FunConfig.watchAndShare) {
      await watchAndShare(page);
    }
    // 直播发送弹幕
    if (FunConfig.liveTask) {
      await liveTask(page);
    }
  } finally {
    await page.util.wt(3, 6);
    await browser.close();
  }
})();
