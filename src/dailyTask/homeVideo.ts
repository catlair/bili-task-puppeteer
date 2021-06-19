import * as log4js from 'log4js';
import * as _ from 'lodash';
import { Page } from 'puppeteer-core';

const logger = log4js.getLogger('homeVideo');

class HomeVideo {
  page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async recommendVideo() {
    try {
      await this.gotoHome();
      await this.gotoVideo();
      return await this.getTargetPage();
    } catch (error) {
      logger.error(error);
      return this.page;
    }
  }

  async gotoHome() {
    const url = this.page.url();
    if (url.match(/^https?:\/\/(www\.)?bilibili\.com\/?$/)) {
      try {
        await this.page.click('.change-btn');
      } catch (error) {}
      return;
    }
    await this.page.goto('https://bilibili.com');
  }

  async getRecommendVideoCard() {
    const $$ = await this.page.$$('.rcmd-box-wrap .rcmd-box .info-box img');
    $$.length = 6;
    // 5是长度减1
    return $$[_.random(5)];
  }

  async getTargetPage() {
    const upTarget = await this.page
      .browser()
      .waitForTarget(t => t.url().includes(`https://www.bilibili.com/video/`), {
        timeout: 12000,
      });
    logger.trace('找到目标页面');
    return upTarget.page();
  }

  async gotoVideo() {
    const $video = await this.getRecommendVideoCard();
    await this.page.util.wt(2, 5);
    logger.trace('点击视频');
    await $video.evaluate((node: HTMLElement) => node.click());
  }
}

export default async function (page: Page) {
  return await new HomeVideo(page).recommendVideo();
}
