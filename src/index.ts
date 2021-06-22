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

/**
 * 暂时的超时逻辑，程序中每次页面暂停都保留 ‘下次继续运行时间’（当前时间+暂停时间）
 * 每 30s 检测一下 当前时间是否大于 ‘下次继续运行时间’ + 60s，大于则可能是页面长时间没有响应
 * +60s 是因为可能部分操作需要消耗时间（比如等元素出现的时间默认是 30s ）
 */
const OS_TIMEOUT_TIME = 60000;
process.env.__NEXT_RESPONSE_TIME = '' + (Date.now() + 60000);
setInterval(() => {
  const time = +process.env.__NEXT_RESPONSE_TIME + OS_TIMEOUT_TIME;
  if (time < Date.now()) {
    logger.fatal('系统长时间没有响应');
    process.send('restart');
    process.exit();
  }
}, 30000);

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
    // 避免浏览器关闭却没有关闭进程
    process.exit();
  }
})();
