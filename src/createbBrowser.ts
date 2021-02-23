import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer-core';
import * as os from 'os';

const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources')({
  blockedTypes: new Set(['image', 'font']),
});

puppeteer.use(require('puppeteer-extra-plugin-stealth')());
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')());
puppeteer.use(require('./plugins/eval-plugin')());
puppeteer.use(blockResourcesPlugin);

export default async function (): Promise<Browser> {
  return puppeteer.launch({
    headless: os.type() === 'Windows_NT' ? false : true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    defaultViewport: {
      width: 1500,
      height: 700,
    },
  });
}
