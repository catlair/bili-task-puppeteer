require('dotenv').config();
const userConfig = require('../../config/config.json');

//任务完成情况统计
export abstract class DailyTask {
  /**今日是否已经分享视频 */
  static isShare: boolean = false;
  /** 是否停止投币 */
  static isStopCoin: boolean = false;
  /** 自定义up */
  static readonly CUSTOMIZE_UP: number[] = userConfig.CUSTOMIZE_UP || [];

  static isRun: boolean = true;

  static readonly ONE_COIN_EXP = 10;

  static readonly MAX_ADD_COIN_EXP = 50;

  static excludesLiveRoom: number[] = userConfig.excludesLiveRoom || [];

  static includesLiveRoom: number[] = userConfig.includesLiveRoom || [];

  static includesFollow: string[] = userConfig.includesFollow || [];

  static excludesFollow: string[] = userConfig.excludesFollow || [];
}

export abstract class OSConfig {
  /**  浏览器UA */
  static USER_AGENT: string = process.env.USER_AGENT || userConfig.USER_AGENT;
  /** 系统三次响应的时间戳 */
  static COOKIE: string = process.env.BILI_COOKIE;
  /**  用户id */
  // static USER_ID: number = getUserId(OSConfig.COOKIE);
}

const funConfig = userConfig.function;

export abstract class FunConfig {
  static juryTask = funConfig.juryTask ?? false;
  static coinByUID = funConfig.coinByUID ?? false;
  static coinByRecommend = funConfig.coinByRecommend ?? false;
  static coinByFollow = funConfig.coinByFollow ?? true;
  static watchAndShare = funConfig.watchAndShare ?? true;
  static liveTask = funConfig.liveTask ?? false;
}
