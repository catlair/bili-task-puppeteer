import { ElementHandle, Page } from 'puppeteer';
import {
  asyncArrayToArray,
  paginationSelect,
  distributedRandom,
} from '../utils';
import * as _ from 'lodash';
import * as log4js from 'log4js';

const logger = log4js.getLogger('upTask');

enum Contribute {
  '视频',
  '音频',
  '专栏',
}

async function goToUpByUid(page: Page, uid: number | string) {
  return await page.goto(`https://space.bilibili.com/${uid}/video`);
}

/** 获取投稿页面音视频和专栏的数量以及元素 */
async function getContributeItem(page: Page) {
  const $$contributions: ElementHandle[] = await page.util.$$wait(
    '.contribution-list > .contribution-item',
  );
  //只需要前3个元素
  $$contributions.length = 3;
  //获取页面中的数字
  const numsPro = $$contributions.map(
    async $ => await $.$eval('.num', el => Number(el.textContent)),
  );
  const nums = await asyncArrayToArray(numsPro);
  return {
    nums,
    $$: $$contributions,
  };
}

/**
 *
 * @param page 网页对象
 * @param countNum 第几个内容
 * @param pageSize 分页大小
 * @param itemSelector 选择每一项使用的选择器
 */
async function commonHandle(
  page: Page,
  countNum: number,
  pageSize: number = 30,
  itemSelector: string = '.section .small-item',
) {
  await page.waitForTimeout(_.random(4000, 8000));
  //投稿页面一页将会有30或者12个(专栏),然后分页
  const { page: pageNum, num } = paginationSelect(countNum, pageSize);
  //跳转
  await paginationToJump(page, pageNum);

  await page.waitForTimeout(2000);
  logger.debug('选择第', num + 1, '个视频...');
  const $$item = await page.util.$$wait(itemSelector);
  await page.util.removeTarget();
  await $$item[num].click();
  await page.waitForTimeout(2000);
}

async function videoHandle(page: Page, countNum: number): Promise<boolean> {
  await commonHandle(page, countNum);
  await page.waitForTimeout(3000);

  try {
    logger.debug('播放视频...');
    const $video = await page.$('video');
    await $video.click();
    await page.waitForTimeout(_.random(2000, 10000));
    await $video.click();
  } catch (e) {
    logger.error('环境不支持点击视频', e);
  }

  if (!(await isUp(page))) {
    logger.debug('视频up主非指定up主,放弃投币');
    return false;
  }

  const $coin = await page.util.$wait('.video-toolbar .coin');
  const stopCoin = await $coin.evaluate(
    $coin =>
      Promise.resolve(
        $coin.getAttribute('title') === '对本稿件的投币枚数已用完',
      ),
    $coin,
  );

  if (stopCoin) {
    logger.debug('对本稿件的投币枚数已用完');
    return false;
  }

  await $coin.click();
  const $coinSure = await page.util.$wait('.coin-bottom .bi-btn');
  const { data } = await page.util.response('/coin/today/exp');
  if (data >= 50) {
    logger.info('投币数量', data / 10, '今日已经够了');
    return true;
  }
  await page.waitForTimeout(_.random(2000, 4000));
  if (data === 40) {
    logger.debug('还需要投一枚硬币');
    await page.evaluate(() => {
      const box = $(':contains("1硬币")');
      box[box.length - 2].click();
    });
    logger.debug('投币完成');
    return true;
  }
  await $coinSure.click();
  logger.debug('投币完成');
  return false;
}

async function audioHandle(page: Page, countNum: number): Promise<boolean> {
  await commonHandle(page, countNum);

  const $coin = await page.util.$wait('.song-share > i');

  await $coin.click();
  const $coinSure = await page.util.$wait('.song-coin-btn');
  const { data } = await page.util.response('/web/coin/exp');
  await page.waitForTimeout(_.random(2000, 4000));
  if (data < 50) {
    await $coinSure.click();
  } else {
    logger.info('投币数量', data / 10, '今日已经够了');
    return true;
  }
  if (data === 40) {
    logger.debug('还需要投一枚硬币');
    await page.evaluate(() => {
      const box = $(':contains("1硬币")');
      box[box.length - 2].click();
    });
    logger.debug('投币完成');
    return true;
  }
  logger.debug('投币完成');
  return false;
}

async function articleHandle(page: Page, countNum: number): Promise<boolean> {
  await commonHandle(
    page,
    countNum,
    12 /** 分页12 */,
    '.article-title a[href^="//www.bilibili.com/read/cv"]',
  );

  const $coin = await page.util.$wait('.article-action .coin-btn');
  await $coin.hover();
  await $coin.click();
  const $coinSure = await page.util.$wait('.coin-sure.b-btn'),
    $coinTipsExp = await page.util.$wait('.coin-content .coin-tips .exp');
  const exp = +(await $coinTipsExp
    .getProperty('innerText')
    .then(jH => jH.jsonValue()));
  await page.waitForTimeout(_.random(2000, 4000));
  if (exp < 50) {
    await await $coinSure.click();
  } else {
    logger.info('投币数量', exp / 10, '今日已经够了');
    return true;
  }
  logger.debug('投币完成');

  return false;
}

async function isUp(page: Page): Promise<boolean> {
  const isTrue = await page.evaluate(() => {
    const hasUpTag = document
      .querySelector('#member-container > :nth-child(1) > a')
      ?.innerHTML.includes('UP主');
    return Promise.resolve(hasUpTag);
  });
  return isTrue ?? true;
}

async function paginationToJump(page: Page, pageNum: number) {
  //跳转到页面,首页就不跳转了
  pageNum++; //从0开始数的
  logger.debug('跳转到第', pageNum, '页');
  if (pageNum === 1) return;

  await page.util.scrollDown();
  const $input = await page.util.$wait(
    '.be-pager-options-elevator .space_input',
  );
  await $input.focus();
  await page.keyboard.type(pageNum.toString(), { delay: 1000 });
  await page.keyboard.press('Enter', { delay: 500 });
}

export default async function (page: Page, uid: number | string) {
  try {
    await goToUpByUid(page, uid);
    await page.waitForTimeout(_.random(2000, 5000));
    /** 投稿 */
    const contributions = await getContributeItem(page);
    await page.waitForTimeout(_.random(2000, 5000));
    /** 0 - (total - 1) */
    const randomNum = distributedRandom(contributions.nums);
    logger.debug('选择类型:', Contribute[randomNum.area]);
    await contributions.$$[randomNum.area].click({ delay: 200 });

    await page.waitForTimeout(_.random(2000, 5000));
    switch (randomNum.area) {
      case 0:
        //视频
        return await videoHandle(page, randomNum.value);
      case 1:
        //音频
        return await audioHandle(page, randomNum.value);
      case 2:
        //专栏
        return await articleHandle(page, randomNum.value);

      default:
        break;
    }
  } catch (error) {
    logger.warn('投币任务出现异常', error);
  }
}
