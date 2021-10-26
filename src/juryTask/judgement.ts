import { Page } from 'puppeteer-core';
import * as _ from 'lodash';
import { getLogger } from 'log4js';

import { JuryInfo, JuryVoteOpinionDto } from '../dto/Jury.dto';

const logger = getLogger('jury');

const MAX_ERROR_COUNT = 4;

const pageUrl = {
  index: '/judgement/index',
  case: '/judgement/case-detail',
};

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
    await this.page.util.wt(3, 6);
    await this.closeSummary();
    while (this.isRun === 1) {
      try {
        await this.page.util.wt(3, 7);
        await this.doVote();
      } catch (error) {
        this.errorCount++;
        logger.error('执行过程发生异常', this.errorCount, error.message);
        if (this.errorCount > MAX_ERROR_COUNT) {
          logger.fatal('致命异常: 异常次数过多,退出执行');
          throw new Error(error.message);
        }
      }
    }
    return this.isRun;
  }

  async doVote() {
    const list = await this.getJuryCaseInfo();
    await this.randomHandle();
    const voteNum = this.calcOfVoting(list);
    logger.debug(`选择项：${voteNum}`);
    await this.page.util.wt(8, 12);
    await this.voteHandle(voteNum);
    await this.page.util.wt(2, 3);
    await this.submitHandle();
  }

  async randomHandle() {
    await this.page.util.wt(1, 3);
    try {
      await this.page.util.evalClick(
        '.bilibili-player-video-control .bilibili-player-video-control-bottom .bilibili-player-video-control-bottom-left .bilibili-player-video-btn button',
      );
    } catch (error) {}
  }

  async voteHandle(n: number) {
    const $$voteBtn = await this.page.util.$$wait(
      '.case-vote .b-card.vote-panel .vote-btns .btn-group .btn-vote',
    );
    $$voteBtn[n].click();
  }

  async submitHandle() {
    try {
      await this.page.util.evalClick(
        '.case-detail .case-vote .b-card.vote-panel .vote-submit button',
      );
      logger.debug('成功提交');
    } catch (error) {
      logger.info(error.message);
    }
  }

  calcOfVoting(list: JuryVoteOpinionDto['data']['list']) {
    // 默认普通
    if (list.length === 0) {
      return 1;
    }
    const voteResults = [0, 0, 0, 0];
    list.forEach(vote => {
      switch (vote.vote_text) {
        case '好':
        case '合适':
          voteResults[0]++;
          break;
        case '中':
        case '一般':
        case '普通':
          voteResults[1]++;
          break;
        case '差':
        case '不适合':
          voteResults[2]++;
          break;
        case '无法判断':
          voteResults[3]++;
          break;
        default:
          break;
      }
    });
    return voteResults.indexOf(Math.max(...voteResults));
  }

  async getJuryCaseInfo() {
    try {
      const callHandle = this.isHomePage
        ? this.clickStartBtn.bind(this)
        : this.goNext.bind(this);
      let [juryVoteOpinion] = await Promise.all([
        this.page.waitForResponse(res =>
          res.url().includes('/jury/case/opinion?case_id='),
        ),
        callHandle(),
      ]);

      this.isHomePage = false;

      // 获得最基本的 5 个
      let {
        data: { list },
      } = (await juryVoteOpinion.json()) as JuryVoteOpinionDto;

      try {
        await this.page.util.wt(1, 3);
        await this.page.evaluate(() => {
          const $h3 = document.querySelector(
            '.case-detail .case-vote .case-result h3',
          ) as HTMLHeadElement;
          if ($h3.innerText.includes('展开')) {
            $h3?.click();
          }
        });
        await this.page.util.wt(1, 3);

        const [opinion] = await Promise.all([
          this.page.waitForResponse(res =>
            res.url().includes('/jury/case/opinion?case_id='),
          ),
          await this.page.evaluate(() => {
            const $h3 = document.querySelector(
              '.case-detail .case-vote .case-result button',
            ) as HTMLHeadElement;
            $h3?.click();
          }),
        ]);

        // 这个是获取 20 的
        const { data } = (await opinion.json()) as JuryVoteOpinionDto;

        await this.page.util.wt(1, 3);
        if (data.list.length === 20) {
          try {
            this.page
              .waitForResponse(res =>
                res.url().includes('/jury/case/opinion?case_id='),
              )
              .then(async res => {
                const { data } = (await res.json()) as JuryVoteOpinionDto;
                list.push(...data.list);
              });
          } catch {}
        }
        await this.scrollDialogDown();
        await this.page.util.wt(1, 2);
        // 关闭弹窗
        await this.page.util.evalClick(
          '.v-dialog.b-dialog .v-dialog__wrap .v-dialog__header h2',
        );

        list = data.list;
      } catch (error) {
        console.log(error);
      }

      return list;
    } catch (error) {
      if (error === -1 || error === 0) {
        return;
      }
      if (++this.voteGetErrorCount > MAX_ERROR_COUNT) {
        logger.error('获取案件错误次数过多');
        this.errorCount = MAX_ERROR_COUNT;
        throw new Error(error.message);
      }
      logger.debug('获取案件失败', error.message);
    }
  }

  async goNext() {
    logger.debug('下一个案件');
    return await this.page.util.clickWaitForNavigation(
      '.case-detail .case-vote .vote-result.b-card button',
    );
  }

  /**
   * 滚动更多弹窗
   */
  async scrollDialogDown() {
    await this.page.util.addScriptLodash();
    await this.page.evaluate(() => {
      return new Promise(resolve => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const distance = _.random(50, 130);
          const $dialog = document.querySelector('.v-dialog__body');
          let scrollHeight = $dialog.scrollHeight;
          $dialog.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve(0);
          }
        }, 100);
      });
    });
  }

  /**
   * 点击开始众议
   */
  async clickStartBtn() {
    logger.debug('开始第一个');
    return await this.page.util.clickWaitForNavigation(
      'div.item-info > div.item-button > button',
    );
  }

  async goBlackHouse() {
    logger.debug('前往小黑屋');
    this.page
      .waitForResponse('https://api.bilibili.com/x/credit/v2/jury/jury')
      .then(async res => {
        const {
          data: { status },
        } = (await res.json()) as JuryInfo;
        if (status !== 1) {
          logger.info('用户个人信息异常');
          this.isRun = 0;
        }
      });
    await this.page.goto('https://www.bilibili.com/judgement/index');
  }

  /**
   * 关闭提示
   */
  async closeSummary() {
    try {
      const $btn = await this.page.util.$wait(
        '.content-outer .fjw-kpi-wrap-bg .mobile-kpi-head h2 i',
        { timeout: 6000 },
      );
      await $btn.click();
    } catch (error) {}
  }
}

export default async function (page: Page) {
  return await new Judgement(page).init();
}
