import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';

const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'font']),
});

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('./plugins/eval-plugin')());
// puppeteer.use(blockResourcesPlugin);

export default async function (): Promise<Browser> {
  return puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 1500,
      height: 700,
    },
    executablePath:
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  });
}
