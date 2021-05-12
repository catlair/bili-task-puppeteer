import {
  ElementHandle,
  HTTPResponse,
  MouseButton,
  Page,
  WaitForOptions,
  WaitForSelectorOptions,
} from 'puppeteer-core';
import * as _ from 'lodash';

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin');

type timeUnit = 'ms' | 's' | 'm' | 'h';
type ClickOptions = {
  delay?: number;
  button?: MouseButton;
  clickCount?: number;
};

class Util {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 等待元素出现并使用原生js点击
   * @param selector 元素选择器
   * @param options 等待元素的配置
   */
  async evalClick(
    selector: string,
    options?: WaitForSelectorOptions,
  ): Promise<any> {
    await this.page.waitForSelector(selector, options);
    return await this.page.evaluate(
      selector => document.querySelector(selector).click(),
      selector,
    );
  }

  /**
   * 等待元素出现并返回元素
   * @param selector 元素选择器
   * @param options 等待元素的配置
   */
  async $wait(
    selector: string,
    options?: WaitForSelectorOptions,
  ): Promise<ElementHandle> {
    await this.page.waitForSelector(selector, options);
    return await this.page.$(selector);
  }

  /**
   * 等待元素出现并返回元素
   * @param selector 元素选择器
   * @param options 等待元素的配置
   */
  async $$wait(
    selector: string,
    options?: WaitForSelectorOptions,
  ): Promise<ElementHandle[]> {
    await this.page.waitForSelector(selector, options);
    return await this.page.$$(selector);
  }

  /**
   * 去掉所有的新标签页打开
   */
  async removeTarget() {
    await this.page.evaluate(() => {
      $(() => {
        $('a[target]').removeAttr('target');
      });
    });
  }

  /**
   * 页面滚动到底部
   */
  async scrollDown() {
    await this.addScriptLodash();
    await this.page.evaluate(() => {
      return new Promise(resolve => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const distance = _.random(50, 130);
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(0);
          }
        }, 100);
      });
    });
  }

  /**
   * 页面滚动到指定位置
   */
  async scroll(targetHeight: number) {
    await this.addScriptLodash();
    await this.page.evaluate(targetHeight => {
      return new Promise(resolve => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const distance = _.random(50, 130);
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= targetHeight) {
            clearInterval(timer);
            resolve(0);
          }
        }, 100);
      });
    }, targetHeight);
  }

  async scrollByElement(selector: string) {
    const el = await this.$wait(selector);
    const { y, height } = await el.boundingBox();
    return await this.scroll(y - height);
  }

  async clickWaitForNavigation(
    selector: string,
    clickOptions?: ClickOptions,
    waitOptions?: WaitForOptions,
  ): Promise<HTTPResponse> {
    const [response] = await Promise.all([
      this.page.waitForNavigation(waitOptions),
      this.page.click(selector, clickOptions),
    ]);
    return response;
  }

  wt(min: number, max: number, unit: timeUnit);
  wt(min: number, unit: timeUnit);
  wt(min: number, max: any = 's', unit: timeUnit = 's') {
    unit = typeof max === 'string' ? (max as timeUnit) : unit;
    let baseTime = 1;
    switch (unit) {
      case 'ms':
        break;
      case 's':
        baseTime = 1000;
        break;
      case 'm':
        baseTime = 60000;
        break;
      case 'h':
        baseTime = 3600000;
        break;
      default:
        baseTime = 1000;
    }
    const ran = async () => {
      if (typeof max === 'string') {
        await this.page.waitForTimeout(min * baseTime);
      } else {
        await this.page.waitForTimeout(
          _.random(min * baseTime, max * baseTime),
        );
      }
    };
    return ran();
  }

  /** 页面增加lodash */
  async addScriptLodash() {
    try {
      await this.page.addScriptTag({
        url: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
      });
    } catch {
      await this.page.addScriptTag({
        url:
          'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
      });
    }
  }
}

class EvalPlugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts);
  }

  get name() {
    return 'eval';
  }

  async onPageCreated(page: Page) {
    Object.defineProperty(page, 'util', {
      value: new Util(page),
    });
  }
}

module.exports = function (pluginConfig) {
  return new EvalPlugin(pluginConfig);
};
