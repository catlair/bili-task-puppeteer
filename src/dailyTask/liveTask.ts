import { FansMedalDto, LiveSignDto, LiveSignInfoDto } from '../dto/Live.dto';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import { ElementHandle, HTTPResponse, Page } from 'puppeteer-core';
import { paginationToJump } from '../common';
import { DailyTask } from '../config/globalVar';
import { LiveTaskData } from './liveTaskData';

type FansMedalList = FansMedalDto['data']['fansMedalList'];

const logger = log4js.getLogger('live');
const kaomoji = require('../config/kaomoji.json');

const excludesRoom = DailyTask.excludesLiveRoom;
const includesRoom = DailyTask.includesLiveRoom;

class Live {
  page: Page;
  livePage: Page;
  //完成数
  count: number = 0;
  total: number = 0;
  //操作的页数
  pageNum: number = 0;
  totalPages: number = 0;
  /** 操作的房间下标 */
  index: number = -1;
  /** 页面中无法获取id,所以通过接口获取 */
  fansMedalList: FansMedalList = [];

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
      for (let i = 1; i < this.totalPages; i++) {
        logger.debug(`本页执行完成,等待结束或前往下一页...`);
        this.pageNum = i;
        await this.page.waitForTimeout(_.random(4000, 10000));
        await this.getNextPageMedal();
        logger.info(`现在访问勋章列表第${i + 1}页`);
        await this.doOnePage();
      }
      logger.info('所有直播弹幕发送成功');
    } catch (error) {
      logger.error('发生异常', error.message);
    }
    //此处调用是怕整个过程并没有运行签到
    await liveSign(this.page);
  }

  async doOnePage() {
    this.filterLiveRoom();
    if (this.fansMedalList.length === 0) {
      return;
    }
    for (this.index = 0; this.index < this.fansMedalList.length; this.index++) {
      await this.doOne();
    }
    this.index = -1;
  }

  async goNextPage() {
    return await paginationToJump(
      this.page,
      this.pageNum,
      logger,
      'input.jumping-input',
    );
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
      logger.warn('发送弹幕时出错', target_name, medalName, error.message);
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
      getLiveSignInfo(this.page),
    ]);
    const { data } = await medalPage1[0].json();
    this.fansMedalList = data.fansMedalList;
    this.total = data.count;
    this.totalPages = data.pageinfo?.totalpages;
  }

  async getNextPageMedal() {
    // 有待观察...
    const getMedal = async () => {
      const [res] = await Promise.race([
        Promise.all([this.getMedalResponse(), this.goNextPage()]),
        (async () => {
          await this.page.waitForTimeout(12000);
          return Promise.reject('超时12000ms');
        })(),
      ]);
      const { data } = await res.json();
      this.fansMedalList = data.fansMedalList;
    };
    try {
      await getMedal();
    } catch (error) {
      logger.debug('获取下一页出现错误', error.message);
      await getMedal();
    }
  }

  /** 过滤直播间 */
  filterLiveRoom() {
    this.fansMedalList = this.fansMedalList
      .filter(medal => {
        const hasRoom = Boolean(medal.roomid);
        if (medal.todayFeed >= 100) return false;
        /** 包括房间,该策略优先于排除 */
        if (includesRoom.length > 0) {
          return includesRoom.includes(medal.target_id) && hasRoom;
        }
        /** 排除的用户数组,暂时这样直接写 */
        if (excludesRoom.includes(medal.target_id)) return false;
        return hasRoom;
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
    this.livePage = await this.page.browser().newPage();
    await this.livePage.goto('https://live.bilibili.com/' + roomid);
    logger.debug('成功到达页面');
  }

  async sendMessage() {
    logger.trace('开始寻找输入框');
    let $text: ElementHandle;
    const selector =
      'div.chat-input-ctnr.p-relative > div:nth-child(2) > textarea';

    const $textarea = await Promise.race([
      this.livePage.util.$wait(selector),
      this.livePage.waitForTimeout(12000),
    ]);
    if (!$textarea) {
      logger.debug('直播间可能不允许评论或者是活动直播间');
      const frame = this.livePage
        .frames()
        .filter(frame => frame.url().includes('//live.bilibili.com/blanc/'))[0];
      if (!frame) {
        logger.info('直播间不能评论(未开启功能或者被封禁等)');
        return;
      }
      await this.livePage.util.scroll(800);
      const $textarea = await Promise.race([
        Promise.all([frame?.$(selector), frame.waitForSelector(selector)]),
        this.page.waitForTimeout(12000),
      ]);
      $text = $textarea?.[0];
      if (!$text) {
        logger.info('直播间情况不明');
      }
      logger.info('该直播间为活动直播间');
    } else {
      $text = $textarea;
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
      if (!this.livePage.isClosed()) {
        await this.livePage.close();
      }
    } catch (error) {
      if (!this.livePage.isClosed()) {
        await this.livePage.close();
      }
    }
    logger.debug('关闭直播页面');
  }
}

export default async function (page: Page) {
  return await new Live(page).init();
}

export async function liveSign(page: Page) {
  if (LiveTaskData.liveSign?.status === 1) {
    logger.info('已完成直播签到');
    return;
  }
  try {
    await page.hover(
      '.right-part.h-100.f-right.f-clear > div.shortcuts-ctnr > div:nth-child(2)',
    );
    await page.util.wt(3, 6);
    const [liveSignRes] = await Promise.all([
      page.waitForResponse(t =>
        t.url().includes('/xlive/web-ucenter/v1/sign/DoSign'),
      ),
      page.click('#live-center-app .shortcuts-ctnr .checkin-btn'),
    ]);

    const liveSign: LiveSignDto = await liveSignRes.json();
    if (liveSign.code !== 0) {
      logger.debug('直播签到失败', liveSign.code, liveSign.message);
    }
    logger.info('签到成功', liveSign.data.text, liveSign.data.specialText);
  } catch (error) {
    logger.debug('直播签到异常', error.message);
  }
}

/**
 * 获取直播签到信息
 */
async function getLiveSignInfo(page: Page) {
  // 如果操作过了就不进行了
  if (LiveTaskData.liveSign && LiveTaskData.liveSign.status === 1) {
    return;
  }
  try {
    const liveSignInfoRes = await page.waitForResponse(
      t => t.url().includes('/xlive/web-ucenter/v1/sign/WebGetSignInfo'),
      {
        timeout: 8000,
      },
    );
    const liveSignInfo: LiveSignInfoDto = await liveSignInfoRes.json();
    if (liveSignInfo.code !== 0) {
      logger.debug(liveSignInfo.code, liveSignInfo.message);
      return;
    }
    LiveTaskData.liveSign = liveSignInfo.data;
  } catch (error) {
    logger.debug('获取签到信息异常', error.message);
  }
}
