import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer-core';

const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'font']),
});

puppeteer.use(require('./plugins/nav-status')());
puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('./plugins/eval-plugin')());
puppeteer.use(blockResourcesPlugin);

export default async function (): Promise<Browser> {
  //@ts-ignore
  return puppeteer.launch({
    headless: process.env.HEADLESS?.toLowerCase() !== 'false',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    defaultViewport: {
      width: 1500,
      height: 700,
    },
    args: ['--no-sandbox'],
  });
}
