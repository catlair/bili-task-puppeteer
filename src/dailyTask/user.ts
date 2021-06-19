import { DailyTask } from '../config/globalVar';
import { UserInfoNavDto } from '../dto/UserInfo.dto';
import { Logger } from 'log4js';
import { Page } from 'puppeteer-core';

export async function getUser(page: Page, logger: Logger) {
  let userNav: UserInfoNavDto['data'];
  async function getUserNav() {
    const res = await page.waitForResponse(
      'https://api.bilibili.com/x/web-interface/nav',
    );
    userNav = (await res.json()).data;
    if (!userNav.isLogin) {
      return;
    }
    const {
      money,
      level_info: { current_level, next_exp, current_exp },
    } = userNav;

    DailyTask.money = money;
    DailyTask.isStopCoin = current_level >= DailyTask.TARGET_LEVEL;

    logger.info(`
        当前等级：${current_level} ${
      DailyTask.isStopCoin ? '[达到目标等级]' : ''
    }
        距离升级还需要经验：${next_exp - current_exp}
        剩余硬币数：${money}`);
    return res;
  }

  try {
    return await Promise.all([getUserNav(), page.goto('https://bilibili.com')]);
  } catch (error) {
    logger.trace('获取用户信息失败', error.message);
  }
}
