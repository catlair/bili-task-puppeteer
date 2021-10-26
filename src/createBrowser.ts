import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer-core';
import { OSConfig } from './config/globalVar';

const blockResources = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'font']),
});
const stealth = require('puppeteer-extra-plugin-stealth')();

//是否自定义UA
if (OSConfig.USER_AGENT) {
  stealth.enabledEvasions.delete('user-agent-override');
  puppeteer.use(
    require('puppeteer-extra-plugin-anonymize-ua')({
      customFn: () => OSConfig.USER_AGENT,
    }),
  );
}

puppeteer
  .use(stealth)
  .use(require('./plugins/nav-status')()) //输入哔哩哔哩专属
  .use(require('./plugins/eval-plugin')())
  .use(blockResources);

export default async function (): Promise<Browser> {
  //@ts-ignore
  return puppeteer.launch({
    headless: false || process.env.HEADLESS?.toLowerCase() !== 'false',
    executablePath:
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' ||
      process.env.PUPPETEER_EXECUTABLE_PATH,
    defaultViewport: {
      width: 1500,
      height: 700,
    },
    args: ['--no-sandbox'],
  });
}
