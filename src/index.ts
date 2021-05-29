require('dotenv').config();
import { FunConfig, OSConfig } from './config/globalVar';
import log4jsConfig from './config/log4js';
import {
  coinByFollow,
  coinByRecommend,
  coinByUID,
  getUser,
  liveTask,
  watchAndShare,
} from './dailyTask';
import { juryTask } from './juryTask';
import { getCookies, getVersion } from './utils';
import createBrowser from './createbBrowser';
import * as log4js from 'log4js';

log4js.configure(log4jsConfig);
const logger = log4js.getLogger('home');
logger.info(`当前版本【 ${getVersion()} 】`);

(async () => {
  if (process.env.BILI_TASK_JURY?.toLowerCase() === 'true') {
    //风纪委员任务
    await juryTask();
    return;
  }

  const browser = await createBrowser();
  const page = await browser.newPage();
  try {
    await page.setCookie(...getCookies(OSConfig.COOKIE, '.bilibili.com'));
    // 基本信息
    await getUser(page, logger);

    //给指定uid的up投币
    if (FunConfig.coinByUID) {
      await coinByUID(page);
    }
    // 给关注用户投币;
    if (FunConfig.coinByFollow) {
      await coinByFollow(page);
    }
    //从首页推荐选择投币
    if (FunConfig.coinByRecommend) {
      await coinByRecommend(page);
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
