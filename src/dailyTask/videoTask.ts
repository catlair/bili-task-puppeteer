import { Page } from 'puppeteer-core';
import { UPTask } from './upTask';

export default async function (page: Page): Promise<boolean> {
  const upTask = new UPTask(page);
  const isContinueCoin = await upTask.videoHandle();
  await upTask.closeUpPage();
  return isContinueCoin;
}
