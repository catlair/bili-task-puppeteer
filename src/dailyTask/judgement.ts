import { JuryVoteOpinionDto } from '../dto/Jury.dto';
import { Page } from 'puppeteer-core';
import { JuryVoteOption } from '../interface/Jury';
import * as _ from 'lodash';
import { getLogger } from 'log4js';
import prohibitWords from '../config/prohibitWords';
import { containProhibit, jsonpToJson } from '../utils';

const logger = getLogger('jury');

const MAX_ERROR_COUNT = 4;

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
  errorCount: number = 0;
  voteGetErrorCount: number = 0;
  isHomePage: boolean = true;
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
    await this.doVote();
    while (this.isRun === 1) {
      try {
        await this.page.waitForTimeout(_.random(3000, 7000));
        await this.doVote();
      } catch (error) {
        this.errorCount++;
        logger.error('执行过程发生异常', this.errorCount, error);
        if (this.errorCount > MAX_ERROR_COUNT) {
          logger.fatal('致命异常: 异常次数过多,退出执行');
          return;
        }
      }
    }
    return this.isRun;
  }

  async doVote() {
    const data = await this.getJuryCaseInfo();
    if (this.isRun === -1) {
      logger.info('没有新的案件了');
      return;
    }
    if (this.isRun === 0) {
      logger.info('今日审核完成');
      return;
    }
    if (!data) {
      return;
    }
    await this.voteHandle(data as VoteDecisionOption);
  }

  async goBlackHouse() {
    logger.debug('前往小黑屋');
    await this.page.goto('https://www.bilibili.com/judgement/index');
  }

  async clickStartBtn() {
    return await this.page.util.clickWaitForNavigation(
      '.cases-wrap .column.col1 .fjw-user.ban-modal button',
    );
  }

  async getStatus(): Promise<number> {
    /** 这个的返回值可能null(导航时),所以不用 */
    await this.page.waitForNavigation();
    /** 浏览器关闭触发太快肉眼都不可见改变页面 */
    await this.page.util.wt(2, 4);
    const url = this.page.url();
    if (url.endsWith('/judgement/done')) {
      this.isRun = -1;
      return Promise.reject(-1);
    }
    if (url.endsWith('/judgement/goodjob')) {
      this.isRun = 0;
      return Promise.reject(0);
    }
    return Promise.resolve(1);
  }

  async getJuryCaseInfo() {
    try {
      const callHandle = this.isHomePage
        ? this.clickStartBtn.bind(this)
        : this.goNext.bind(this);
      const [juryCase, juryVoteRed, juryVoteBlue] = await Promise.all([
        this.page.waitForResponse(res =>
          res.url().includes('credit/jury/juryCase?'),
        ),
        this.page.waitForResponse(res =>
          /credit\/jury\/vote\/opinion.*otype=1/.test(res.url()),
        ),
        this.page.waitForResponse(res =>
          /credit\/jury\/vote\/opinion.*otype=2/.test(res.url()),
        ),
        callHandle(),
        this.getStatus(),
      ]);

      this.isHomePage = false;

      const {
        data: { originContent = '', voteDelete = 0, voteRule = 0, id },
      } = jsonpToJson(await juryCase.text());
      logger.info('获取到案件:', id);
      const { data: voteOpinionRed } = jsonpToJson(await juryVoteRed.text()),
        { data: voteOpinionBlue } = jsonpToJson(await juryVoteBlue.text());

      await this.page.waitForTimeout(_.random(4000, 10000));

      return {
        originContent,
        voteDelete,
        voteRule,
        voteOpinionBlue,
        voteOpinionRed,
      };
    } catch (error) {
      if (error === -1 || error === 0) {
        return;
      }
      if (++this.voteGetErrorCount > MAX_ERROR_COUNT) {
        logger.error('获取案件错误次数过多');
        this.errorCount = MAX_ERROR_COUNT;
        throw new Error(error);
      }
      logger.debug('获取案件失败', error);
    }
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
    originContent = '',
    voteOpinionBlue,
    voteOpinionRed,
  }: VoteDecisionOption): VoteType {
    //瞎鸡*计算怎么投票
    let myVote: VoteType = 4;

    const opinionRedCount = voteOpinionRed?.count || 0;
    const opinionBlueCount = voteOpinionBlue?.count || 0;

    logger.debug(`
      内容: ${originContent}
      蓝方: 评论数${opinionBlueCount} / 总人数${voteRule}
      红方: 评论数${opinionRedCount} / 总人数${voteDelete}
    `);

    //vote判断不合理,有的人喊着封禁实则没有
    const banOfRed =
      voteOpinionRed?.opinion?.filter(el => {
        if (el.vote === Vote['封禁']) {
          return true;
        }
        const text = ['封禁', '小黑屋', '封了', '建议封', '小黑屋'];
        if (text.some(v => el.content.includes(v))) {
          return true;
        }
        return false;
      }) || [];
    const ban = containProhibit(prohibitWords, originContent);

    if (ban) {
      logger.info('应该是地域黑吧?');
      myVote = Vote['封禁'];
    } else if (
      (opinionRedCount > 3 && banOfRed.length / opinionRedCount >= 0.8) ||
      banOfRed.length > 5
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

  async goBackToHouse() {
    await this.page.util.clickWaitForNavigation(
      '.judgement .home.home-app-width .case-tip button',
    );
  }

  async goNext() {
    logger.debug('下一个案件');
    return await this.page.util.clickWaitForNavigation(
      'div.status-right > div > div > button',
    );
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
