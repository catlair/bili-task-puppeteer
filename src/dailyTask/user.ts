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
    DailyTask.money = userNav?.money;
    logger.info(`
        当前等级：${userNav.level_info.current_level}
        距离升级还需要经验：${
          userNav.level_info.next_exp - userNav.level_info.current_exp
        }
        剩余硬币数：${userNav.money}`);
    return res;
  }

  try {
    return await Promise.all([getUserNav(), page.goto('https://bilibili.com')]);
  } catch (error) {
    logger.trace('获取用户信息失败', error.message);
  }
}
