import { ElementHandle, Page } from 'puppeteer';
import {
  asyncArrayToArray,
  paginationSelect,
  distributedRandom,
  jsonpToJson,
} from '../utils';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import { UserInfoNavDto } from '../dto/UserInfo.dto';

const logger = log4js.getLogger('upTask');

enum Contribute {
  '视频',
  '音频',
  '专栏',
}

class UPTask {
  page: Page;
  uid: number = 0;
  $$: ElementHandle[] = [];
  /** 稿件类型 */
  contributeType: number = 0;
  userNav: UserInfoNavDto['data'];
  /** 第几个 */
  contributeNum: number = 0;
  /** 投币状态,true表示不能了 */
  coinStatus: boolean = false;
  constructor(page: Page, uid: string | number) {
    this.page = page;
    this.uid = Number(uid);
  }

  async init() {
    try {
      await this.goToUpByUid();
    } catch (error) {
      logger.error('前往up页面失败');
      return;
    }
    /** 投稿 */
    try {
      await this.page.waitForTimeout(_.random(2000, 5000));
      const nums = await this.getContributeItem();
      await this.page.waitForTimeout(_.random(2000, 5000));
      /** 0 - (total - 1) */
      const { value, area } = distributedRandom(nums);
      this.contributeType = area;
      this.contributeNum = value;
      logger.trace('选择类型:', Contribute[this.contributeType]);
    } catch (error) {
      logger.error('获取up随机视频失败', error);
    }

    try {
      await this.$$[this.contributeType || 0].click({ delay: 200 });
      await this.page.waitForTimeout(_.random(2000, 5000));
    } catch (error) {
      logger.error('选择类型失败', error.message);
    }

    try {
      switch (this.contributeType) {
        case 0:
          //视频
          return await this.videoHandle(this.contributeNum);
        case 1:
          //音频
          return await this.audioHandle(this.contributeNum);
        case 2:
          //专栏
          return await this.articleHandle(this.contributeNum);

        default:
          break;
      }
    } catch (error) {
      logger.warn('投币出现异常', error.message);
    }
  }

  async goToUpByUid() {
    const res = await Promise.all([
      this.page.waitForResponse('https://api.bilibili.com/x/web-interface/nav'),
      this.page.goto(`https://space.bilibili.com/${this.uid}/video`),
    ]);
    this.userNav = (await res[0].json()).data;
    logger.debug('剩余硬币数', this.userNav.money);
    return res;
  }

  /**
   * 获取今日获取的经验
   * @param $coin 投币弹窗按钮
   * @param selector 确认投币按钮的选择器
   * @param resUrl 已获取经验的响应
   */
  async getCoinExp($coin: ElementHandle, selector: string, resUrl: string) {
    return await Promise.all([
      this.page.util.$wait(selector),
      this.page.waitForResponse(r => r.url().includes(resUrl)),
      $coin.click(),
    ]);
  }

  async getContributeId(): Promise<string> {
    try {
      const url = await this.page.url();
      return url.match(/\/([0-9A-Za-z]+)$/)?.[1] || '未知';
    } catch (error) {
      logger.debug('获取稿件id异常', error.message);
      return '未知';
    }
  }

  /** 获取投稿页面音视频和专栏的数量以及元素 */
  async getContributeItem(): Promise<number[]> {
    const $$contributions: ElementHandle[] = await this.page.util.$$wait(
      '.contribution-list > .contribution-item',
    );
    //只需要前3个元素
    $$contributions.length = 3;
    this.$$ = $$contributions;
    //获取页面中的数字
    const numsPro = $$contributions.map(
      async $ => await $.$eval('.num', el => Number(el.textContent)),
    );
    return await asyncArrayToArray(numsPro);
  }

  /**
   *
   * @param page 网页对象
   * @param countNum 第几个内容
   * @param pageSize 分页大小
   * @param itemSelector 选择每一项使用的选择器
   */
  async commonHandle(
    countNum: number,
    pageSize: number = 30,
    itemSelector: string = '.section .small-item',
  ) {
    await this.page.waitForTimeout(_.random(4000, 8000));
    //投稿页面一页将会有30或者12个(专栏),然后分页
    const { page: pageNum, num } = paginationSelect(countNum, pageSize);
    //跳转
    await this.paginationToJump(pageNum);
    await this.page.waitForTimeout(2000);
    logger.trace(`选择第${num + 1}个${Contribute[this.contributeType]}...`);
    const $$item = await this.page.util.$$wait(itemSelector);
    await this.page.util.removeTarget();
    const runArray: any = [this.page.waitForNavigation(), $$item[num].click()];
    switch (this.contributeType) {
      case 1:
        runArray.splice(0, 0, this.getAudioCoinStatus());
        break;
      case 2:
        runArray.splice(0, 0, this.getArticleCoinStatus());
        break;
      default:
        break;
    }
    await Promise.all(runArray);
    const id = await this.getContributeId();
    logger.info(`前往${Contribute[this.contributeType]}:`, id);
    await this.page.waitForTimeout(2000);
  }

  async playVideo() {
    try {
      logger.debug('播放视频...');
      const $video = await this.page.$('video');
      await $video.click();
      await this.page.waitForTimeout(_.random(2000, 10000));
      // await $video.click();
    } catch (e) {
      logger.error('环境不支持点击视频', e);
    }
  }

  async videoHandle(countNum: number): Promise<boolean> {
    await this.commonHandle(countNum);
    await this.page.waitForTimeout(3000);
    await this.playVideo();

    if (!(await this.isUp())) {
      logger.debug('视频up主非指定up主,放弃投币');
      return false;
    }

    const $coin = await this.page.util.$wait('.video-toolbar .coin');
    await this.getVideoCoinStatus($coin);
    if (this.coinStatus) {
      return false;
    }
    const [$coinSure, res] = await this.getCoinExp(
      $coin,
      '.coin-bottom .bi-btn',
      '/coin/today/exp',
    );

    const { data } = await res.json();
    if (data >= 50) {
      logger.info('今日已投币数量', data / 10, '今日已经够了');
      return true;
    }
    await this.page.waitForTimeout(_.random(2000, 4000));
    if (data === 40) {
      logger.debug('还需要投一枚硬币');
      await this.page.evaluate(() => {
        const box = $(':contains("1硬币")');
        box[box.length - 2].click();
      });
      await this.page.util.wt(1, 3);
      return await this.addCoin($coinSure);
    }
    return (await this.addCoin($coinSure))
      ? data === 30
        ? true
        : false
      : false;
  }

  async audioHandle(countNum: number): Promise<boolean> {
    await this.commonHandle(countNum);
    if (this.coinStatus) {
      return false;
    }
    const $coin = await this.page.util.$wait('.song-share > i');
    const [$coinSure, res] = await this.getCoinExp(
      $coin,
      '.song-coin-btn',
      '/web/coin/exp',
    );
    const { data } = await res.json();
    await this.page.waitForTimeout(_.random(2000, 4000));
    if (data < 50) {
      await this.addCoin($coinSure);
    } else {
      logger.info('投币数量', data / 10, '今日已经够了');
      return true;
    }
    if (data === 40) {
      logger.debug('还需要投一枚硬币');
      await this.page.evaluate(() => {
        const box = $(':contains("1硬币")');
        box[box.length - 2].click();
      });
      return await this.addCoin($coinSure);
    }
    return false;
  }

  async articleHandle(countNum: number): Promise<boolean> {
    await this.commonHandle(
      countNum,
      12 /** 分页12 */,
      '.article-title a[href^="//www.bilibili.com/read/cv"]',
    );
    if (this.coinStatus) {
      return false;
    }
    const $coin = await this.page.util.$wait('.article-action .coin-btn');
    await $coin.hover();
    await $coin.click();
    const $coinSure = await this.page.util.$wait('.coin-sure.b-btn'),
      $coinTipsExp = await this.page.util.$wait(
        '.coin-content .coin-tips .exp',
      );
    const exp = +(await $coinTipsExp
      .getProperty('innerText')
      .then(jH => jH.jsonValue()));
    await this.page.waitForTimeout(_.random(2000, 4000));
    if (exp < 50) {
      await this.addCoin($coinSure);
    } else {
      logger.info('投币数量', exp / 10, '今日已经够了');
      return true;
    }
    return exp === 40 ? true : false;
  }

  /** 判断目标用户是否是该视频up(不一定准) */
  async isUp(): Promise<boolean> {
    try {
      const isTrue = await this.page.evaluate(() => {
        const hasUpTag = document
          .querySelector('#member-container > :nth-child(1) > a')
          ?.innerHTML.includes('UP主');
        return Promise.resolve(hasUpTag);
      });
      return isTrue ?? true;
    } catch (error) {
      logger.debug('判断是否为up失败,默认为是');
      return true;
    }
  }

  async paginationToJump(pageNum: number) {
    //跳转到页面,首页就不跳转了
    pageNum++; //从0开始数的
    logger.trace('跳转到第', pageNum, '页');
    if (pageNum === 1) return;

    await this.page.util.scrollDown();
    const $input = await this.page.util.$wait(
      '.be-pager-options-elevator .space_input',
    );
    await $input.focus();
    await this.page.keyboard.type(pageNum.toString(), { delay: 1000 });
    await this.page.keyboard.press('Enter', { delay: 500 });
  }

  /**
   * 投币
   * @param $coinSure 确认投币按钮
   */
  async addCoin($coinSure: ElementHandle): Promise<boolean> {
    const [coinRes] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/coin/add')),
      $coinSure.click(),
    ]);
    const multiply = coinRes
      .request()
      .postData()
      .match(/multiply=(\d)&?/)?.[1];
    const { code, message } = await coinRes.json();
    if (code === 0) {
      logger.info('成功投币', multiply, '颗');
      return true;
    }
    logger.warn('投币失败', code, message);
    return false;
  }

  /**
   * 获取该视频已经投币状态
   * @param $coin 投币弹窗按钮
   */
  async getVideoCoinStatus($coin?: ElementHandle) {
    //视频可投币数为0或1
    const stopCoin = await $coin.evaluate(
      $coin =>
        Promise.resolve(
          $coin.getAttribute('title') === '对本稿件的投币枚数已用完',
        ),
      $coin,
    );

    if (stopCoin) {
      logger.info('对本稿件的投币枚数已用完');
      return (this.coinStatus = true);
    }
    this.coinStatus = false;
  }

  async getAudioCoinStatus() {
    //音频可投币数是否可变不知
    //暂时当成2
    // {"code":0,"msg":"success","data":2}}
    try {
      const res = await this.page.waitForResponse(r =>
          /music-service-c\/web\/coin\/audio/.test(r.url()),
        ),
        { data } = await res.json();
      if (data === 2) {
        logger.info('对本稿件的投币枚数已用完');
        return (this.coinStatus = true);
      }
    } catch (error) {
      logger.debug('获取音频投币状态失败', error.message);
    }
    this.coinStatus = false;
  }

  async getArticleCoinStatus() {
    //专栏可以投两颗(漏洞),当然这里一颗处理
    // {"code":0,"data":{like:0,coin:0,favorite:false}}}
    try {
      const res = await this.page.waitForResponse(r =>
          /\/article\/viewinfo/.test(r.url()),
        ),
        { data } = await res.json();
      if (data.coin) {
        logger.info('对本稿件的投币枚数已用完');
        return (this.coinStatus = true);
      }
    } catch (error) {
      logger.debug('获取专栏投币状态失败', error.message);
    }
    this.coinStatus = false;
  }
}

/**
 * 运行返回true表示今日不需要投币了
 * @param page
 * @param uid
 *
 * 使用时需要注意设置延时,避免浏览器关闭太快
 */
export default async function (page: Page, uid: string | number) {
  return await new UPTask(page, uid).init();
}
