import { getLogger, Logger } from 'log4js';
import { Page } from 'puppeteer-core';

export default async function playVideo(page: Page, logger?: Logger) {
  if (!logger) {
    logger = getLogger('playVideo');
  }
  try {
    logger.debug('播放视频...');
    const $video = await page.$('video');
    await $video.click();
  } catch (e) {
    logger.error('环境不支持点击视频', e);
  }
}
