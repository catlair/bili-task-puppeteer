import {
  distributedRandom,
  filterAsync,
  mapAsync,
  paginationSelect,
} from '../utils';
import * as log4js from 'log4js';
import { ElementHandle, Page } from 'puppeteer-core';
import { paginationToJump } from '../common';
import * as _ from 'lodash';
import { DailyTask, OSConfig } from '../config/globalVar';

const logger = log4js.getLogger('upTask');

const includesFollow = DailyTask.includesFollow;
const excludesFollow = DailyTask.excludesFollow;

export default async function (page: Page): Promise<Page> {
  let upTargetPage: Page = null,
    gotoFollowPageCount = 0,
    chooseFollowTagCount = 0,
    /** 该区域第几个up */
    upTargetValue = 0,
    curFollowUrl: string[],
    curTabListArea = -1,
    uid = 0;

  async function gotoFollowPage() {
    try {
      await page.goto(
        `https://space.bilibili.com/${OSConfig.USER_ID}/fans/follow`,
      );
      await page.util.wt(3, 6);
      logger.trace('到达关注页面');
    } catch (error) {
      if (++gotoFollowPageCount > 3) {
        logger.fatal('前往关注页面异常');
        throw new Error(error);
      }
      logger.warn('前往关注页面异常', error.message);
      await gotoFollowPage();
    }
  }

  async function chooseFollowTag() {
    try {
      //过滤不可见元素
      const tabListSource = await filterAsync(
        await page.$$('a.text[href*="fans/follow"]'),
        $ =>
          $.evaluate(
            (elem: HTMLElement) => elem.parentElement?.style.display !== 'none',
            $,
          ),
      );
      //删除'全部关注'列表
      tabListSource.shift();
      //获取列表上的数字(列表包含up数) => e.g [6,0,21,7]
      const tabListInfoSource = await mapAsync(tabListSource, $ =>
        $.evaluate(
          (elem: HTMLElement) => ({
            followNum: +elem.nextElementSibling.textContent,
            tagName: elem.innerText.trim(),
          }),
          $,
        ),
      );
      let { tabListInfo, tabList } = followListFilter(
        tabListInfoSource,
        tabListSource,
      );

      const { value, area } = distributedRandom(
        tabListInfo.map(t => t.followNum),
      );
      tabList = tabList.filter(el => el);
      await page.util.wt(3, 9);
      if (curTabListArea !== area) {
        await tabList[area].click();
        curTabListArea = area;
      }
      logger.debug('选择tag', tabListInfo[area].tagName);
      upTargetValue = value;
    } catch (error) {
      if (++chooseFollowTagCount > 3) {
        logger.fatal('切换tag异常');
        throw new Error(error);
      }
      logger.warn('切换tag异常', error.message);
      await page.reload();
      await chooseFollowTag();
    }
  }

  function followListFilter(
    tabListInfoSource: {
      followNum: number;
      tagName: string;
    }[],
    tabListSource,
  ) {
    let tabListInfo,
      tabList = _.cloneDeep(tabListSource);
    //指定tag
    if (includesFollow.length !== 0) {
      tabListInfo = tabListInfoSource.filter((el, index) => {
        // 不包含的和数量为0都应该去除
        const isKeep =
          includesFollow.includes(el.tagName) && el.followNum !== 0;
        if (!isKeep) {
          tabList[index] = null;
        }
        return isKeep;
      });
    } else {
      tabListInfo = tabListInfoSource.filter((el, index) => {
        const isKeep =
          !excludesFollow.includes(el.tagName) && el.followNum !== 0;
        if (!isKeep) {
          tabList[index] = null;
        }
        return isKeep;
      });
    }
    if (tabListInfo.length === 0) {
      return {
        tabList: tabListSource,
        tabListInfo: tabListInfoSource,
      };
    }
    return { tabListInfo, tabList };
  }

  async function chooseFollowUp() {
    let errorflag = false;
    try {
      const { pageNum, num } = paginationSelect(upTargetValue, 20);
      await page.util.wt(3, 6);
      await paginationToJump(page, pageNum, logger);
      await page.util.wt(3, 6);
      //等待页面真正的渲染完成
      await page.waitForSelector('.follow-content.section:not(.loading)', {
        timeout: 13000,
      });
      await page.util.wt(1, 3);
      //获取到的$$包含头像和昵称(两者都可点击)
      logger.trace(`选择第${num + 1}个`);
      const $$ = await page.$$('.list-item a[href*="//space.bilibili.com/"]');
      await getFollowUrlAll($$);
      const ranNum = _.random(0, 1) === 1 ? num * 2 : num * 2 + 1;
      const $target = $$[ranNum];
      uid = getFollowUid(await getFollowUrl($target));
      await page.util.wt(3, 6);
      await $target.click();
    } catch (error) {
      errorflag = true;
      logger.error(error.message);

      const curTime = Date.now();
      logger.debug(page.url());
      logger.debug('出现bug，截图中...', curTime);
      await page.screenshot({
        path: `./logs/${curTime}-getfollow.png`,
      });

      if (curFollowUrl && curFollowUrl.length !== 0) {
        upTargetPage = await page.browser().newPage();
        const ranUrl = curFollowUrl[_.random(curFollowUrl.length - 1)];
        uid = getFollowUid(ranUrl);
        await upTargetPage.goto(
          ranUrl.startsWith('http') ? ranUrl : `https:${ranUrl}`,
        );
      }
    }
    if (!errorflag) {
      await getTargetPage();
    }
  }

  async function getFollowUrl(
    $target: ElementHandle<Element>,
  ): Promise<string> {
    return await $target.evaluate(elem => elem.getAttribute('href'), $target);
  }

  function getFollowUid(followUrl: string) {
    return +followUrl.match(/(\d+)/)?.[0];
  }

  async function getFollowUrlAll(
    $$target: ElementHandle<Element>[],
  ): Promise<string[]> {
    try {
      return (curFollowUrl = await mapAsync($$target, $t => getFollowUrl($t)));
    } catch (error) {}
    return [];
  }

  async function getTargetPage() {
    try {
      const upTarget = await page
        .browser()
        .waitForTarget(t => t.url().includes(`space.bilibili.com/${uid}`), {
          timeout: 12000,
        });
      logger.trace('找到目标页面');
      upTargetPage = await upTarget.page();
    } catch (error) {
      logger.error(error);
    }
  }

  async function run() {
    //判断是否已经有过该页面
    const pages = await page.browser().pages();
    const followPage = pages.filter(page =>
      page
        .url()
        .includes(`//space.bilibili.com/${OSConfig.USER_ID}/fans/follow`),
    )[0];
    if (!followPage) {
      await gotoFollowPage();
    } else {
      page = followPage;
    }
    await chooseFollowTag();
    await chooseFollowUp();
  }

  await run();
  return upTargetPage;
}
