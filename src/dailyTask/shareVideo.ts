import { DailyTask } from '../config/globalVar';
import { getLogger, Logger } from 'log4js';
import { Page } from 'puppeteer-core';
import * as _ from 'lodash';

/**
 * 分享视频
 * @param page 视频页面
 * @param selector 分享icon的选择器(string/undefined)
 * @param logger
 */
export default async function shareVideo(
  page: Page,
  selector: string = '.share',
  logger?: Logger,
) {
  if (!logger) {
    logger = getLogger('shareVideo');
  }
  let sharePage: Page;

  try {
    logger.debug('开始分享视频');
    await page.util.wt(2, 5);
    await page.hover(selector);
    const $$btn = await page.util.$$wait('.share-btn');
    await page.util.wt(1, 3);
    logger.debug('点击分享按钮');
    await $$btn[_.random(1, 4)].click();
    const { x, y } = await $$btn[4].boundingBox();
    await page.mouse.move(x, y - 60);
    //分享页面的url十分长
    const target = await page
      .browser()
      .waitForTarget(x => x.url().length > 500 && x.url().includes('share'));
    await page.util.wt(4, 7);

    logger.trace('尝试关闭分享窗口');
    // ppeteer-extra-plugin-stealth 会报错
    sharePage = await target.page();
    //随便等待的一个元素1
    await sharePage.waitForSelector('div');
    logger.info('成功分享视频');
    DailyTask.isShare = true;
  } catch (error) {
    logger.error('分享视频失败', error.message);
  } finally {
    if (!sharePage.isClosed()) {
      await sharePage.close();
      logger.trace('关闭分享窗口');
    }
  }
}
