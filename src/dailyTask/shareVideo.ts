import { DailyTask } from '../config/globalVar';
import { getLogger, Logger } from 'log4js';
import { Page } from 'puppeteer-core';
import * as _ from 'lodash';

export default async function shareVideo(page: Page, logger?: Logger) {
  if (!logger) {
    logger = getLogger('shareVideo');
  }
  logger.info('-----开始分享视频-----');
  await page.waitForTimeout(_.random(2000, 5000));
  await page.hover('.share');
  const $$btn = await page.util.$$wait('.share-btn');
  await page.waitForTimeout(_.random(1000, 3000));
  logger.debug('点击分享按钮');
  await $$btn[_.random(1, 4)].click();
  const { x, y } = await $$btn[4].boundingBox();
  await page.mouse.move(x, y - 60);
  //分享页面的url十分长
  const target = await page
    .browser()
    .waitForTarget(x => x.url().length > 500 && x.url().includes('share'));
  await page.waitForTimeout(_.random(4000, 7000));
  try {
    logger.trace('尝试关闭分享窗口');
    // ppeteer-extra-plugin-stealth 会报错
    const sharePage = await target.page();
    //随便等待的一个元素1
    await sharePage.waitForSelector('div');
    await sharePage.close();
    logger.info('成功分享视频');
    DailyTask.share = true;
  } catch (error) {
    logger.error('分享视频失败', error);
  }
}