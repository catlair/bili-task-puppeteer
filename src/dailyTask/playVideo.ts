import { getLogger, Logger } from 'log4js';
import { Page } from 'puppeteer-core';

export default async function playVideo(page: Page, logger?: Logger) {
  if (!logger) {
    logger = getLogger('playVideo');
  }
  try {
    const isVideoPlaying = await page.$eval(
      'video',
      (video: HTMLVideoElement) =>
        new Promise(res => {
          const prevTime = video.currentTime;
          setTimeout(() => res(prevTime !== video.currentTime), 1000);
        }),
    );
    if (isVideoPlaying) {
      logger.debug('视频正在播放...');
      return;
    }
    logger.debug('播放视频...');
    const $video = await page.$('video');
    await $video.click();
  } catch (e) {
    logger.error('环境不支持点击视频', e);
  }
}
