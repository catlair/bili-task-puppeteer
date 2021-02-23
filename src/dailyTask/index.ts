import { HTTPResponse, Page } from 'puppeteer';
import { jsonpToJson } from '../utils';
import * as log4js from 'log4js';

const logger = log4js.getLogger('upTask');

export default async function (page: Page) {
  async function gotoSpaceFollow() {
    try {
      const [res] = await Promise.all([
        page.waitForResponse((r: HTTPResponse) =>
          r.url().startsWith('https://api.bilibili.com/x/relation/followings?'),
        ),
        page.goto(`https://space.bilibili.com/357123798/fans/follow`),
      ]);

      return jsonpToJson(await res.text());
    } catch (error) {
      logger.error('获取关注列表失败', error.message);
    }
  }

  async function name() {}
}
