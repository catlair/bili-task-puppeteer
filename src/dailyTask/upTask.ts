import { ElementHandle, Page } from 'puppeteer-core';
import { distributedRandom, mapAsync, paginationSelect } from '../utils';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import { UserInfoNavDto } from '../dto/UserInfo.dto';
import { paginationToJump } from '../common';
import { DailyTask } from '../config/globalVar';
import shareVideo from './shareVideo';
import playVideo from './playVideo';

const logger = log4js.getLogger('upTask');

enum Contribute {
  '视频',
  '音频',
  '专栏',
}

const ONE_COIN_EXP = DailyTask.ONE_COIN_EXP;
const MAX_ADD_COIN_EXP = DailyTask.MAX_ADD_COIN_NUM * ONE_COIN_EXP;

export class UPTask {
  page: Page;
  uid: number = 0;
  $$: ElementHandle[] = [];
  /** 稿件类型 */
  contributeType: number = 0;
  userNav: UserInfoNavDto['data'];
  /** 第几个 */
  contributeNum: number = 0;
  /** 本稿件投币状态,true表示已经投完了 */
  coinStatus: boolean = false;

  constructor(page: Page, uid?: string | number) {
    this.page = page;
    this.uid = Number(uid);
  }

  async init() {
    try {
      await this.page.util.wt(2, 4);
      await this.goToUpSpace();
      const username = await this.getUserName();
      logger.info(`访问UP主 【${username}】`);
    } catch (error) {
      await this.closeUpPage();
      logger.error('前往up页面失败');
      return;
    }
    /** 稿件获取 */
    await this.page.waitForTimeout(_.random(2000, 5000));
    const nums = await this.getContributeItem();
    if (nums.every(num => num === 0)) {
      logger.info('没有可操作稿件');
      await this.closeUpPage();
      return;
    }
    await this.changeContributeType(nums);
    await this.page.waitForTimeout(_.random(1000, 3000));

    //不直接return是因为只能要做统一的关闭页面
    let isStopCoin = true;
    let errorCount = 0;
    try {
      switch (this.contributeType) {
        case 0:
          //视频
          (await this.commonHandle()) &&
            (isStopCoin = await this.videoHandle());
          break;
        case 1:
          //音频
          (await this.commonHandle()) &&
            (isStopCoin = await this.audioHandle());
          break;
        case 2:
          //专栏
          (await this.commonHandle(
            12 /** 分页12 */,
            '.article-title a[href^="//www.bilibili.com/read/cv"]',
          )) && (isStopCoin = await this.articleHandle());
          break;
        default:
          break;
      }
    } catch (error) {
      //更好的观察出错
      logger.warn('投币出现异常', error.message);
      // 当出现异常,不管投币是否成功,都再次尝试投币
      errorCount++ < 4 && (isStopCoin = false);
    }

    await this.closeUpPage();
    if (isStopCoin) {
      logger.info('剩余硬币数', DailyTask.money);
    }
    return isStopCoin;
  }

  /**
   * 切换稿件类型(视频,音频,专栏)
   * @param nums 每种类型的数量
   */
  async changeContributeType(nums: number[]) {
    /** 0 - (total - 1) */
    const { value, area } = distributedRandom(nums);
    this.contributeType = area;
    this.contributeNum = value;
    logger.trace('选择类型:', Contribute[this.contributeType]);

    //默认就在视频上
    if (this.contributeType !== 0) {
      await this.$$[this.contributeType || 0].click({ delay: 200 });
    }
    await this.page.waitForTimeout(_.random(2000, 5000));
  }

  async closeUpPage() {
    // 避免关闭错误
    const pageUrl = await this.page.url();
    const includesWords = ['/video', 'bangumi', 'read/cv', 'audio/au'];
    const isIncludesWord = includesWords.some(word => pageUrl.includes(word));
    if (!this.page.isClosed() && isIncludesWord) {
      await this.page.util.wt(2, 4);
      await this.page.close();
      logger.debug('关闭投币页面');
    }
  }

  /**
   * 去往用户页面
   */
  async goToUpSpace() {
    if (!this.uid) {
      await this.page.evaluate(() =>
        $('.n-tab-links [href*="video"]')[0].click(),
      );
      return;
    }
    await Promise.all([
      this.page.waitForResponse('https://api.bilibili.com/x/web-interface/nav'),
      this.page.goto(`https://space.bilibili.com/${this.uid}/video`),
    ]);
    return;
  }

  /**
   * 获取今日获取的经验
   * @param $coin 投币弹窗按钮
   * @param selector 确认投币按钮的选择器
   * @param resUrl 已获取经验的响应
   */
  async getCoinExp(
    $coin: ElementHandle,
    selector: string,
    resUrl: string,
    waitResOptions?: {
      timeout?: number;
    },
  ) {
    return await Promise.all([
      this.page.util.$wait(selector),
      this.page.waitForResponse(r => r.url().includes(resUrl), waitResOptions),
      $coin.click(),
    ]);
  }

  /**
   * 获取稿件的ID
   * @param $item 展示稿件的元素
   */
  async getContributeId($item: ElementHandle): Promise<{
    title: string;
    id: string;
  }> {
    try {
      switch (this.contributeType) {
        case 0:
          return $item.evaluate($li => ({
            id: $li.getAttribute('data-aid'),
            title: $li.querySelector<HTMLAnchorElement>('.title').title,
          }));
        case 1:
          return await $item.evaluate($li => {
            const $title = $li.querySelector<HTMLAnchorElement>('.title');
            return {
              title: $title.title,
              id: $title.href.match(/\/([0-9A-Za-z]+)(?:$|\?)/)?.[1] || '未知',
            };
          });
        case 2:
          return $item.evaluate(($li: HTMLAnchorElement) => ({
            id: $li.href.match(/\/([0-9A-Za-z]+)(?:$|\?)/)?.[1] || '未知',
            title: $li.title,
          }));
        default:
          return { title: '未知', id: '未知' };
      }
    } catch (error) {
      logger.debug('获取稿件id异常', error.message);
      return { title: '未知', id: '未知' };
    }
  }

  /** 获取投稿页面音视频和专栏的数量 */
  async getContributeItem(): Promise<number[]> {
    const $$contributions: ElementHandle[] = await this.page.util.$$wait(
      '.contribution-list > .contribution-item',
    );
    //只需要前3个元素
    $$contributions.length = 3;
    this.$$ = $$contributions;
    //获取页面中的数字
    return await mapAsync(
      $$contributions,
      async $ => await $.$eval('.num', el => +el.textContent),
    );
  }

  async getUserName() {
    try {
      return await this.page.$eval('#h-name', $username => $username.innerHTML);
    } catch (error) {
      logger.warn('获取up用户名失败', error.message);
      return '未知';
    }
  }

  /**
   *
   * @param pageSize 分页大小
   * @param itemSelector 选择每一项使用的选择器
   */
  async commonHandle(
    pageSize: number = 30,
    itemSelector: string = '.section .small-item',
  ) {
    if (DailyTask.money < 1) {
      return false;
    }
    await this.page.waitForTimeout(_.random(4000, 8000));
    //投稿页面一页将会有30或者12个(专栏),然后分页
    const { pageNum, num } = paginationSelect(this.contributeNum, pageSize);
    //跳转
    await paginationToJump(this.page, pageNum, logger);
    await this.page.waitForTimeout(2000);
    //获取所有元素并打印信息
    const $$item = await this.page.util.$$wait(itemSelector);
    const { title, id } = await this.getContributeId($$item[num]);
    logger.trace(`选择第${num + 1}个${Contribute[this.contributeType]}...`);
    logger.info(`前往${Contribute[this.contributeType]}:`, id, title);
    //只在本页操作
    await this.page.util.removeTarget();
    const runArray: any = [
      this.page.waitForNavigation(),
      this.contributeType === 0
        ? $$item[num].$eval('a', (a: HTMLAnchorElement) => a.click())
        : $$item[num].click(),
    ];
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
    try {
      await Promise.all(runArray);
    } catch (error) {
      logger.error(error.message);
      const curTime = Date.now();
      logger.debug('出现bug，截图中...', curTime);
      await this.page.screenshot({
        path: `./logs/${curTime}-upTask.png`,
      });
      throw error;
    }
    await this.page.waitForTimeout(2000);
    return true;
  }

  async videoHandle(): Promise<boolean> {
    await this.page.waitForTimeout(3000);
    await playVideo(this.page, logger);
    const videoUrl = this.page.url();
    if (videoUrl.includes('//www.bilibili.com/bangumi')) {
      logger.debug('非普通视频, 链接:', videoUrl);
      //处于测试中
      return await this.bangumiHandle();
    }
    await this.page.util.wt(5, 10);

    try {
      if (!DailyTask.isShare) {
        await shareVideo(this.page, undefined, logger);
        await this.page.util.wt(2, 4);
      }
    } catch {}

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
    return await this.addCoinSure(data, $coinSure);
  }

  async audioHandle(): Promise<boolean> {
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
    return await this.addCoinSure(data, $coinSure);
  }

  async articleHandle(): Promise<boolean> {
    if (this.coinStatus) {
      return false;
    }
    const $coin = await this.page.util.$wait('.article-action .coin-btn');
    await $coin.hover();
    const [$coinSure, res] = await this.getCoinExp(
      $coin,
      '.coin-sure.b-btn',
      'account/exp.php',
    );
    const { number } = await res.json();
    return await this.addCoinSure(number, $coinSure);
  }

  /**
   * 番剧/纪录片等特殊视频处理
   */
  async bangumiHandle(): Promise<boolean> {
    try {
      if (!DailyTask.isShare) {
        await shareVideo(this.page, '.share-info', logger);
        await this.page.util.wt(2, 4);
      }
    } catch {}

    try {
      const $coin = await this.page.util.$wait('.coin-info');
      const [$coinSure, res] = await this.getCoinExp(
        $coin,
        '.coin-bottom .coin-btn',
        '/coin/today/exp',
        { timeout: 5000 },
      );
      const { data } = await res.json();
      return await this.addCoinSure(data, $coinSure);
    } catch (error) {
      logger.debug(error.message);
      logger.debug('可能是该视频投币已达上限');
      return false;
    }
  }

  /**
   * 确认投币
   * @param exp 已获得经验
   * @param $coinSure 确认投币按钮
   */
  async addCoinSure(exp: number, $coinSure: ElementHandle): Promise<boolean> {
    if (DailyTask.money <= DailyTask.STAY_COINS || DailyTask.money < 1) {
      logger.info('到达保留硬币界限：', DailyTask.STAY_COINS);
      return true;
    }
    await this.page.waitForTimeout(_.random(2000, 4000));
    if (
      parseInt(DailyTask.money?.toString()) < 1 ||
      (exp === 40 && this.contributeType !== Contribute['专栏'])
    ) {
      logger.debug('还需要投一枚硬币');
      await this.page.evaluate(() => {
        const box = $(':contains("1硬币")');
        box[box.length - 2].click();
      });
      await this.page.util.wt(1, 3);
      return (await this.addCoin($coinSure)) === 1;
    }
    if (exp >= MAX_ADD_COIN_EXP && DailyTask.money > DailyTask.STAY_COINS) {
      logger.info('投币数量', exp / ONE_COIN_EXP, '今日已经够了');
      return true;
    }
    if (DailyTask.isStopCoin) {
      logger.info('因为某种原因(等级，硬币数)不需要/不能再投币');
      return true;
    }
    const coinNum = await this.addCoin($coinSure);
    return MAX_ADD_COIN_EXP <= coinNum * ONE_COIN_EXP + exp;
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

  /**
   * 投币
   * @param $coinSure 确认投币按钮
   * @returns 返回投币数0,1,2
   */
  async addCoin($coinSure: ElementHandle): Promise<number> {
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
      DailyTask.money -= Number(multiply);
      return Number(multiply);
    }
    logger.warn('投币失败', code, message);
    //137004 帐号封禁
    if (code === 137004) {
      logger.fatal(message, '结束任务执行');
      process.exit(0);
    }
    return 0;
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

  /**
   * 获取该音频已经投币状态
   */
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

  /**
   * 获取该文章已投币状态
   */
  async getArticleCoinStatus() {
    //专栏可以投两颗(但是pc端只能一颗),当然这里一颗处理
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
 * @param page up
 * @param uid
 *
 * 使用时需要注意设置延时,避免浏览器关闭太快
 */
export default async function (page: Page, uid?: string | number) {
  if (!page) {
    throw new Error('不存在的页面');
  }
  return await new UPTask(page, uid).init();
}
