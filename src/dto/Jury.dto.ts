import { ApiAbstract } from './BiLiAbstractClass';

/**
 * 众议意见
 */
export interface JuryVoteOpinionDto extends ApiAbstract {
  data: {
    total: number;
    list: {
      opid: number;
      mid: number;
      uname: string;
      face: string;
      vote: number;
      /** 好 中 差 合适 一般 不合适 无法判断 */
      vote_text: string;
      content: string;
      anonymous: number;
      like: number;
      hate: number;
      like_status: number;
      vote_time: number;
    }[];
  };
}

/**
 * 众议意见
 */
export interface JuryInfoDto extends ApiAbstract {
  data: {
    uname: string;
    face: string;
    case_total: number;
    term_end: number;
    /** 1 */
    status: number;
  };
}

/**
 * 下一个众议
 */
export interface NextCaseDto extends ApiAbstract {
  /** 25008 暂时没有 25014 今日已完成 */
  code: 25014 | 25008 | 0;
  message: string;
  ttl: number;
}
