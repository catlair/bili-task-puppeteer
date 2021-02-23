import { getCookies, isMatchString } from './utils';
import createBrowser from './createbBrowser';
import upTask from './dailyTask/upTask';
import * as _ from 'lodash';
import live from './dailyTask/live';
import index from './dailyTask';
import judgement from './dailyTask/judgement';
import * as log4js from 'log4js';
require('dotenv').config();

log4js.configure('./src/config/log4js.json');
const logger = log4js.getLogger('test');

(async () => {
  let browser, page;
  for (let isRun = 1; ; ) {
    browser = await createBrowser();
    page = await browser.newPage();
    await page.setCookie(
      ...getCookies(process.env.TEST_COOKIE, '.bilibili.com'),
    );

    isRun = await judgement(page);
    // await live(page);
    // await index(page);
    logger.debug('关闭浏览器');
    await page.close();
    page = null;
    await browser.close();
    browser = null;
    const temp = _.random(300000, 1800000);
    if (isRun === 0) break;
    logger.info(`等待${_.floor(_.divide(temp, 60000), 2)}分重启`);
    await new Promise(resolve => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        resolve(0);
      }, temp);
    });
  }

  // console.log(a[0].postData().match(/multiply=(\d)/)[1]);
  // console.log(await a[1].json());

  // await upTask(page, 517327498);
  // await upTask(page, 18908454);
  // await upTask(page, 454143774);
  // await upTask(page, 157480427);
  //476867757
  // while (!(await upTask(page, 18908454))) {
  // await page.waitForTimeout(_.random(2000, 6000));
  // }
  // await page.util.wt(3, 6);
  // await browser.close();

  // await page.goto('https://www.bilibili.com/video/av844060018');
  // await page.waitForTimeout(_.random(2000, 5000));
  // await page.hover('.share');
  // const $$btn = await page.util.$$wait('.share-btn');
  // await page.waitForTimeout(_.random(1000, 3000));
  // await $$btn[3].click();
  // const { x, y } = await $$btn[4].boundingBox();
  // await page.mouse.move(x, y - 60);
  // const target = await browser.waitForTarget(
  //   x => x.url().length > 1000 && x.url().includes('share'),
  // );
  // await page.waitForTimeout(_.random(4000, 7000));
  // try {
  //   // ppeteer-extra-plugin-stealth 会报错
  //   const sharePage = await target.page();
  //   await sharePage.waitForSelector('span');
  //   await sharePage.close();
  // } catch (error) {
  //   logger.error(error);
  // }

  // await page.screenshot({
  //   path: 'src/demo2.png',
  // });
  // await browser.close();
})();
