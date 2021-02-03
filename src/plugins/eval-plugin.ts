import { ElementHandle, Page, WaitForSelectorOptions } from 'puppeteer';
import { isMatchString } from '../utils';
import * as _ from 'lodash';

const { PuppeteerExtraPlugin } = require('puppeteer-extra-plugin');

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
  ): Promise<ElementHandle<Element>> {
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
  ): Promise<ElementHandle<Element>[]> {
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
    await this.page.evaluate(() => {
      return new Promise(resolve => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
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

  response(
    match: string | RegExp,
    options: { delay?: number } = {},
  ): Promise<unknown> {
    const { delay = 30000 } = options;

    return new Promise((resolve, reject) => {
      const resHandle = async res => {
          const resUrl = await res.url();
          if (!isMatchString(resUrl, match)) return;
          if (!res.ok()) reject('响应状态失败');
          let content = await res.text();
          try {
            content = JSON.parse(content);
          } catch (error) {
            try {
              content = JSON.parse(content.split(/[()]/)[1]);
            } catch (error) {}
          }
          this.page.off('response', resHandleBind);
          resolve(content);
        },
        resHandleBind = resHandle.bind(this);
      this.page.on('response', resHandleBind);
      let timer = setTimeout(() => {
        this.page.off('response', resHandleBind);
        clearTimeout(timer);
        reject(`timeout ${delay} ${match.toString()}`);
      }, delay);
    });
  }

  wt(min: number, max: number, unit: 'ms' | 's' | 'm' | 'h' = 's') {
    const ran = (min, max) => this.page.waitForTimeout(_.random(min, max));
    switch (unit) {
      case 'ms':
        return ran(min, max);
      case 's':
        return ran(min * 1000, max * 1000);
      case 'm':
        return ran(min * 60000, max * 60000);
      case 'h':
        return ran(min * 3600000, max * 3600000);
      default:
        return ran(min * 1000, max * 1000);
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

  async onPageCreated(page) {
    page.util = new Util(page);
  }
}

module.exports = function (pluginConfig) {
  return new EvalPlugin(pluginConfig);
};
