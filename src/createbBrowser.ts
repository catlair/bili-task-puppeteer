import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
import * as os from 'os';

const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'font']),
});

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('./plugins/eval-plugin')());
// puppeteer.use(blockResourcesPlugin);

const launchOptions =
  os.type() === 'Windows_NT'
    ? {
        headless: false,
        executablePath:
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      }
    : {};

export default async function (): Promise<Browser> {
  return puppeteer.launch({
    ...launchOptions,
    defaultViewport: {
      width: 1500,
      height: 700,
    },
  });
}
