import { Logger } from 'log4js';
import { Page } from 'puppeteer-core';

export async function paginationToJump(
  page: Page,
  pageNum: number,
  logger?: Logger,
  inputSelector: string = '.be-pager-options-elevator .space_input',
) {
  if (!logger) {
    logger = (await import('log4js')).getLogger('paginationToJump');
  }
  //跳转到页面,首页就不跳转了
  pageNum++; //从0开始数的
  logger.trace('跳转到第', pageNum, '页');
  if (pageNum === 1) return;

  await page.util.scrollDown();
  const $input = await page.util.$wait(inputSelector);
  await $input.focus();
  await page.keyboard.press('Backspace', { delay: 1000 });
  await page.keyboard.type(pageNum.toString(), { delay: 1000 });
  await page.keyboard.press('Enter', { delay: 500 });
}
