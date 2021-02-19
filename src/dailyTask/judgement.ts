import { JuryCaseDto, JuryVoteOpinionDto } from '../dto/Jury.dto';
import { Page } from 'puppeteer';
import { JuryVoteOption } from '../interface/Jury';
import * as _ from 'lodash';
import { getLogger } from 'log4js';
import prohibitWords from '../config/prohibitWords';

const logger = getLogger('jury');

type VoteType = JuryVoteOption['vote'];
type VoteOpinion = JuryVoteOpinionDto['data'];

interface VoteDecisionOption {
  voteDelete?: number;
  voteRule?: number;
  originContent: string;
  voteOpinionBlue: VoteOpinion;
  voteOpinionRed: VoteOpinion;
}

enum Vote {
  '未投票',
  '封禁',
  '保留',
  '弃权',
  '删除',
}

class Judgement {
  page: Page;
  isRun: number;
  constructor(page: Page) {
    this.page = page;
    //1 继续 -1 没有了 0 完成了
    this.isRun = 1;
  }

  async init() {
    await this.goBlackHouse();
    await this.page.waitForTimeout(_.random(3000, 6000));
    await this.closeSummary();
    await this.page.waitForTimeout(_.random(3000, 6000));
    try {
      await this.doVote(this.clickStartBtn.bind(this));
    } catch (error) {
      logger.error('执行过程发生异常', error);
    }
    while (this.isRun === 1) {
      try {
        await this.page.waitForTimeout(_.random(3000, 7000));
        await this.doVote(this.goNext.bind(this));
      } catch (error) {
        logger.error('执行过程发生异常', error);
      }
    }
    return this.isRun;
  }

  async doVote(callHandle: () => {}) {
    let data = await this.getJuryCaseInfo(callHandle);
    if (this.isRun === -1) {
      logger.info('没有新的案件了');
      return;
    }
    if (this.isRun === 0) {
      logger.info('今日审核完成');
      return;
    }
    await this.voteHandle(data as VoteDecisionOption);
  }

  async goBlackHouse() {
    logger.debug('前往小黑屋');
    await this.page.goto('https://www.bilibili.com/judgement/index');
  }

  async clickStartBtn() {
    await this.page.click(
      '.cases-wrap .column.col1 .fjw-user.ban-modal button',
    );
  }

  async getJuryCaseInfo(callHandle: () => {}) {
    const juryCaseWait: Promise<JuryCaseDto> = this.page.util.response(
        'credit/jury/juryCase?',
      ),
      juryVoteRedWait: Promise<JuryVoteOpinionDto> = this.page.util.response(
        /credit\/jury\/vote\/opinion.*otype=1/,
      ),
      juryVoteBlueWait: Promise<JuryVoteOpinionDto> = this.page.util.response(
        /credit\/jury\/vote\/opinion.*otype=2/,
      );
    //调用处理函数
    await callHandle();

    const returnDate = {},
      mergeData = obj => _.merge(returnDate, obj);

    /**
     * 关于UnhandledPromiseRejectionWarning异常
     * 1.
     * 下面的几个获取数据需要在return判断之前,
     * 不然会报异常
     * 2.
     * 之所以用单独的try包裹
     * 是因为在一起的话,前一个报错后一个不执行,结果依然是会报异常
     */
    try {
      const {
        data: { originContent = '', voteDelete = 0, voteRule = 0, id },
      } = await juryCaseWait;
      logger.info('获取到案件:', id);
      mergeData({
        originContent,
        voteDelete,
        voteRule,
      });
    } catch (error) {}

    try {
      const { data: voteOpinionRed } = await juryVoteRedWait;
      mergeData({ voteOpinionRed });
    } catch (error) {}

    try {
      const { data: voteOpinionBlue } = await juryVoteBlueWait;
      mergeData({ voteOpinionBlue });
    } catch (error) {}

    await this.page.waitForTimeout(_.random(4000, 10000));
    if (await this.isDone()) return (this.isRun = -1);
    if (await this.isGoodjob()) return (this.isRun = 0);
    return returnDate;
  }

  async voteHandle(data: VoteDecisionOption) {
    const myVote = this.makeDecision(data);
    await this.randomEvent();
    await this.page.waitForTimeout(_.random(4000, 10000));

    //这里之所以转来转去,是因为makeDecision是其他地方拿来直接用的,那里需要的是number
    //而这里无所谓用数字还是汉子
    switch (Vote[myVote]) {
      case '保留':
        await this.chooseBlue();
        break;
      case '封禁':
        await this.chooseRed();
        await this.page.waitForTimeout(_.random(5000, 20000));
        await this.recommendBan();
        break;
      case '删除':
        await this.chooseRed();
        await this.page.waitForTimeout(_.random(5000, 20000));
        await this.recommendDelete();
        break;
      default:
        return;
    }
    await this.page.waitForTimeout(_.random(2000, 4000));
    await this.submitHandle();
  }

  makeDecision({
    voteDelete = 0,
    voteRule = 0,
    originContent,
    voteOpinionBlue,
    voteOpinionRed,
  }: VoteDecisionOption): VoteType {
    function containProhibit(words: Array<any>, str: string): boolean {
      if (!str) {
        return false;
      }
      return words.some(el => {
        return str.indexOf(el) !== -1;
      });
    }

    //瞎鸡*计算怎么投票
    let myVote: VoteType = 4;

    const opinionRedCount = voteOpinionRed?.count || 0;
    const opinionBlueCount = voteOpinionBlue?.count || 0;

    logger.debug(`
      内容: ${originContent}
      蓝方: 评论数${opinionBlueCount} / 总人数${voteRule}
      红方: 评论数${opinionRedCount} / 总人数${voteDelete}
    `);

    const banOfRed =
      voteOpinionRed?.opinion?.filter(el => el.vote === Vote['封禁']) || [];
    const ban = containProhibit(prohibitWords, originContent);

    //大家都说你
    if (ban && originContent.length < 6) {
      //就这几个字你好含有地域黑嫌疑词
      logger.info('应该是地域黑吧?');
      myVote = Vote['封禁'];
    } else if (
      opinionRedCount > 3 &&
      banOfRed.length / opinionRedCount >= 0.8
    ) {
      //>3 还是严谨点
      logger.info('多人发布观点表示封禁');
      myVote = Vote['封禁'];
    } else if (voteDelete > 200 && voteRule < 20) {
      myVote = Vote['删除'];
    } else if (voteRule > voteDelete * 2 && voteRule > 200) {
      //保留的人多
      myVote = Vote['保留'];
    } else if (voteDelete > voteRule * 2 && voteRule > 100) {
      //删除的人多
      myVote = Vote['删除'];
    } else if (opinionRedCount >= 5 && opinionBlueCount <= 1) {
      //删除的人还是挺多的
      myVote = Vote['删除'];
    } else if (opinionBlueCount >= 7 && opinionRedCount === 0) {
      //保留的人确实多
      if (voteRule > voteDelete) {
        myVote = Vote['保留'];
      } else {
        myVote = Vote['删除'];
      }
    } else if (voteDelete > voteRule && opinionRedCount > opinionBlueCount) {
      myVote = Vote['删除'];
    } else if (voteDelete < voteRule && opinionRedCount < opinionBlueCount) {
      myVote = Vote['保留'];
    }

    logger.info('做出的选择是:', Vote[myVote]);
    return myVote;
  }

  async isDone() {
    const url = await this.page.url();
    return url.endsWith('/judgement/done');
  }

  async isGoodjob() {
    const url = await this.page.url();
    return url.endsWith('/judgement/goodjob');
  }

  async goBackToHouse() {
    await this.page.click('.judgement .home.home-app-width .case-tip button');
  }

  async goNext() {
    logger.debug('下一个案件');
    await this.page.click('div.status-right > div > div > button');
  }

  async chooseRed() {
    await this.page.click('.legal-btn.legal-btn-color');
  }

  async chooseBlue() {
    await this.page.click('.illegal-btn.illegal-btn-color');
  }

  async recommendDelete() {
    await this.page.evaluate(() => {
      $('label:contains("建议删除")')[0].click();
    });
  }

  async recommendBan() {
    await this.page.evaluate(() => {
      $('label:contains("建议封禁")')[0].click();
    });
  }

  async submitHandle() {
    await this.page.click('.content-outer .footer button');
    logger.info('成功提交');
  }

  async closeSummary() {
    try {
      const $btn = await this.page.util.$wait(
        '.content-outer .fjw-kpi-wrap-bg .mobile-kpi-head h2 i',
        { timeout: 10000 },
      );
      await $btn.click();
    } catch (error) {}
  }

  async randomEvent() {
    try {
      const $$content = [
        await this.page.$('.content-box .fjw-point-wrap header'),
        await this.page.$('.content-box .video-model header'),
        await this.page.$('.content-box .info-model header'),
      ];

      for (let i = 0; i < $$content.length; i++) {
        if (Math.random() > Math.random()) {
          await $$content[i].click();
          await this.page.waitForTimeout(_.random(6000, 15000));
          await $$content[i].click();
        }
      }
    } catch (error) {
      logger.warn('随机事件发生异常', error.message);
    }
  }
}

export default async function (page: Page) {
  return await new Judgement(page).init();
}
