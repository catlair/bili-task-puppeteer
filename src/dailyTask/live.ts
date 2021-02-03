import { FansMedalDto } from '../dto/Live.dto';
import * as _ from 'lodash';
import * as log4js from 'log4js';
import { ElementHandle, Page } from 'puppeteer';

type FansMedalList = FansMedalDto['data']['fansMedalList'];
type FansMedalListElement = FansMedalList[0] & { $a: ElementHandle };

const logger = log4js.getLogger('live');
const kaomoji = [
  '(⌒▽⌒)',
  '（￣▽￣）',
  '(=・ω・=)',
  '(｀・ω・´)',
  '(〜￣△￣)〜',
  '(･∀･)',
  '(°∀°)ﾉ',
  '(￣3￣)',
  '╮(￣▽￣)╭',
  '_(:3」∠)_',
  '( ´_ゝ｀)',
  '←_←',
  '→_→',
  '(<_<)',
  '(>_>)',
  '(;¬_¬)',
  '(ﾟДﾟ≡ﾟдﾟ)!?',
  'Σ(ﾟдﾟ;)',
  'Σ( ￣□￣||)',
  '(´；ω；`)',
  '（/TДT)/',
  '(^・ω・^ )',
  '(｡･ω･｡)',
  '(●￣(ｴ)￣●)',
  'ε=ε=(ノ≧∇≦)ノ',
  '(´･_･`)',
  '(-_-#)',
  '（￣へ￣）',
  '(￣ε(#￣) Σ',
  'ヽ(`Д´)ﾉ',
  '（#-_-)┯━┯',
  '(╯°口°)╯(┴—┴',
  '←◡←',
  '( ♥д♥)',
  'Σ>―(〃°ω°〃)♡→',
  '⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄',
  '(╬ﾟдﾟ)▄︻┻┳═一',
  '･*･:≡(　ε:)',
  '(汗)',
  '(苦笑)',
  '1',
  '2',
  '3',
  '4',
  '5',
  '你们好',
];

export default async (page: Page) => {
  const getMedalPage: () => Promise<FansMedalDto> = () =>
    page.util.response('live_fans_medal/iApiMedal?');

  function addElement(fansMedalList: FansMedalList): FansMedalListElement[] {
    (async () => {
      for (const fansMedal of fansMedalList) {
        fansMedal['$a'] = await page.$(`a[title="${fansMedal.target_name}"]`);
      }
    })();
    return fansMedalList as FansMedalListElement[];
  }

  async function goLiveRoomSend(fansMedalListElement: FansMedalListElement[]) {
    for (let i = 0; i < fansMedalListElement.length; i++) {
      try {
        await page.waitForTimeout(_.random(4000, 10000));
        const { $a, target_name, medalName, level } = fansMedalListElement[i];
        logger.info(`选择${target_name}--【${medalName}】(Lv.${level})`);
        await $a.click();

        const liveTarget = await page
          .browser()
          .waitForTarget(t =>
            /^https?:\/\/live\.bilibili\.com\/\d+$/.test(t.url()),
          );

        const livePage = await liveTarget.page();

        logger.debug('成功到达页面');
        await livePage.waitForTimeout(_.random(4000, 10000));

        const $text = await livePage.$(
          'div.chat-input-ctnr.p-relative > div:nth-child(2) > textarea',
        );

        if (!$text) {
          logger.info('直播间可能不允许评论');
          livePage.close();
          continue;
        }

        const message = kaomoji[_.random(kaomoji.length - 1)];
        await $text.type(message, {
          delay: 100,
        });

        await $text.press('Enter');
        logger.info(message, '发送成功');

        await page.waitForTimeout(_.random(4000, 10000));
        livePage.close();
        logger.debug('关闭直播页面');
      } catch (error) {
        logger.error('直播间发送消息异常', error);
      }
    }
  }

  const medalPage1 = await Promise.all([
    getMedalPage(),
    page.goto(
      'https://link.bilibili.com/p/center/index#/user-center/wearing-center/my-medal',
    ),
  ]);
  const { data } = await medalPage1[0];

  if (data.count === 0) {
    logger.info('粉丝牌列表为空,跳过执行');
    return;
  }

  async function run(data: FansMedalDto['data']) {
    //乱序列表和排除某些直播间
    const fansMedalList = data.fansMedalList;
    const fansMedalListElement = addElement(
      fansMedalList
        .filter(medal => {
          /** 排除的用户数组,暂时这样直接写 */
          if ([20165629].includes(medal.target_id)) return false;
          return Boolean(medal.roomid);
        })
        .sort(() => Math.random() - 0.5)
        .reverse()
        .sort(() => Math.random() - Math.random()),
    );

    await goLiveRoomSend(fansMedalListElement);
  }

  logger.info('一共拥有勋章', data.count, '个');
  logger.info(`现在访问勋章列表第1页`);
  await run(data);
  for (let i = 1; i < data.pageinfo.totalpages; i++) {
    logger.debug(`本页执行完成,等待前往下一页...`);
    await page.waitForTimeout(_.random(4000, 10000));
    logger.info(`现在访问勋章列表第${i + 1}页`);
    await page.click(
      'div.operation-page.page-medal > div.link-panigation-ctnr.t-right > ul > li:last-child',
    );
    const { data } = await getMedalPage();
    await run(data);
  }
  logger.info('所有直播弹幕发送成功');
};
