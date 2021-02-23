import { FansMedalDto } from '../dto/Live.dto';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import { ElementHandle, HTTPResponse, Page } from 'puppeteer';

type FansMedalList = FansMedalDto['data']['fansMedalList'];

const logger = log4js.getLogger('live');
const kaomoji = [
  '(⌒▽⌒)',
  '（￣▽￣）',
  '(=・ω・=)',
  '(｀・ω・´)',
  '(〜￣△￣)〜',
  '(･∀･)',
  '(°∀°)ﾉ',
  '(￣3￣)',
  '╮(￣▽￣)╭',
  '_(:3」∠)_',
  '( ´_ゝ｀)',
  '←_←',
  '→_→',
  '(<_<)',
  '(>_>)',
  '(;¬_¬)',
  '(ﾟДﾟ≡ﾟдﾟ)!?',
  'Σ(ﾟдﾟ;)',
  'Σ( ￣□￣||)',
  '(´；ω；`)',
  '（/TДT)/',
  '(^・ω・^ )',
  '(｡･ω･｡)',
  '(●￣(ｴ)￣●)',
  'ε=ε=(ノ≧∇≦)ノ',
  '(´･_･`)',
  '(-_-#)',
  '（￣へ￣）',
  '(￣ε(#￣) Σ',
  'ヽ(`Д´)ﾉ',
  '（#-_-)┯━┯',
  '(╯°口°)╯(┴—┴',
  '←◡←',
  '( ♥д♥)',
  'Σ>―(〃°ω°〃)♡→',
  '⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄',
  '(╬ﾟдﾟ)▄︻┻┳═一',
  '･*･:≡(　ε:)',
  '(汗)',
  '(苦笑)',
  '1',
  '2',
  '3',
  '4',
  '5',
  '你们好',
];

class live {
  page: Page;
  livePage: Page;
  count: number = 0;
  total: number = 0;
  totalpages: number = 0;
  /** 操作的房间下标 */
  index: number = -1;
  fansMedalList: FansMedalList = [];
  $$room: Array<ElementHandle> = [];
  constructor(page: Page) {
    this.page = page;
  }

  async init() {
    try {
      await this.getFirstPageMedal();
      if (this.total === 0) {
        logger.info('粉丝牌列表为空,跳过执行');
        return;
      }
      logger.info('一共拥有勋章', this.total, '个');
      logger.info(`现在访问勋章列表第1页`);
      await this.doOnePage();
      logger.debug(`本页执行完成,等待结束或前往下一页...`);
      for (let i = 1; i < this.totalpages; i++) {
        await this.page.waitForTimeout(_.random(4000, 10000));
        await this.getNextPageMedal();
        logger.info(`现在访问勋章列表第${i + 1}页`);
        await this.doOnePage();
      }
      logger.info('所有直播弹幕发送成功');
    } catch (error) {
      logger.error('发生异常', error);
    }
  }

  async doOnePage() {
    this.filterLiveRoom();
    if (this.fansMedalList.length === 0) {
      return;
    }
    await this.addElement();
    for (this.index = 0; this.index < this.fansMedalList.length; this.index++) {
      await this.doOne();
    }
    this.index = -1;
  }

  async goNextPage() {
    // 使用click会显示元素不可见或不存在,改成js能行
    const click = () =>
      this.page.util.evalClick(
        'div.operation-page.page-medal > div.link-panigation-ctnr.t-right > ul > li:last-child',
      );
    try {
      await click();
    } catch (error) {
      await click();
    }
  }

  async doOne() {
    try {
      await this.page.waitForTimeout(_.random(4000, 10000));
      await this.gotoRoom();
      await this.livePage.waitForTimeout(_.random(4000, 10000));
      await this.sendMessage();
      this.count++;
      await this.page.waitForTimeout(_.random(4000, 10000));
      await this.closeLiveRoom();
    } catch (error) {
      const { target_name, medalName } = this.fansMedalList[this.index];
      logger.warn('发送弹幕时出错', target_name, medalName, error);
    }
  }

  /** 获取粉丝牌数据 */
  getMedalResponse(): Promise<HTTPResponse> {
    return this.page.waitForResponse(r =>
      r.url().includes('live_fans_medal/iApiMedal?'),
    );
  }

  async getFirstPageMedal() {
    const medalPage1 = await Promise.all([
      this.getMedalResponse(),
      this.page.goto(
        'https://link.bilibili.com/p/center/index#/user-center/wearing-center/my-medal',
      ),
    ]);
    const { data } = await medalPage1[0].json();
    this.fansMedalList = data.fansMedalList;
    this.total = data.count;
    this.totalpages = data.pageinfo?.totalpages;
  }

  async getNextPageMedal() {
    await this.page.util.scrollDown();
    const [res] = await Promise.all([
        this.getMedalResponse(),
        this.goNextPage(),
      ]),
      { data } = await res.json();
    this.fansMedalList = data.fansMedalList;
  }

  /** 添加a元素 */
  async addElement() {
    this.$$room = [];
    for (const fansMedal of this.fansMedalList) {
      let $: ElementHandle = null;
      try {
        $ = await this.page.$(`a[title="${fansMedal.target_name}"]`);
      } catch (error) {
        logger.warn('获取房间地址失败', fansMedal.target_name, error);
      }
      this.$$room.push($);
    }
  }

  /** 排除房间 */
  excludeRoom() {}

  /** 支持房间 */
  includeRoom() {}

  /** 过滤直播间 */
  filterLiveRoom() {
    this.fansMedalList = this.fansMedalList
      .filter(medal => {
        /** 排除的用户数组,暂时这样直接写 */
        if ([20165629].includes(medal.target_id)) return false;
        // if (
        //   [
        //     367877,
        //     883968,
        //     31604158,
        //     35359510,
        //     453972,
        //     20165629,
        //     36081646,
        //     55775966,
        //     298141644,
        //     8681279,
        //   ].includes(medal.target_id)
        // )
        // return false;
        return Boolean(medal.roomid);
      })
      .sort(() => Math.random() - 0.5)
      .reverse()
      .sort(() => Math.random() - Math.random());
  }

  /** 前往直播间 */
  async gotoRoom() {
    const { target_name, medalName, level, roomid } = this.fansMedalList[
      this.index
    ];
    logger.info(`选择${target_name}--【${medalName}】(Lv.${level})`);
    try {
      await this.$$room[this.index].click();
      const liveTarget = await this.page
        .browser()
        .waitForTarget(t =>
          /^https?:\/\/live\.bilibili\.com\/\d+$/.test(t.url()),
        );
      this.livePage = await liveTarget.page();
    } catch (error) {
      logger.debug('点击btn失败', error);
      logger.debug('尝试直接前往直播间', target_name, roomid);
      this.livePage = await this.page.browser().newPage();
      await this.livePage.goto('https://live.bilibili.com/' + roomid);
    }
    logger.debug('成功到达页面');
  }

  async sendMessage() {
    const $text = await this.livePage.$(
      'div.chat-input-ctnr.p-relative > div:nth-child(2) > textarea',
    );

    if (!$text) {
      logger.info('直播间可能不允许评论');
      return;
    }

    const message = kaomoji[_.random(kaomoji.length - 1)];
    await $text.type(message, {
      delay: _.random(100, 200),
    });
    await $text.press('Enter');
    logger.info(message, '发送成功');
  }

  async closeLiveRoom() {
    try {
      this.livePage.close();
    } catch (error) {
      this.livePage.close();
    }
    logger.debug('关闭直播页面');
  }
}

export default async function (page: Page) {
  return await new live(page).init();
}
