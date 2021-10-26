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
export interface JuryInfo extends ApiAbstract {
  data: {
    uname: string;
    face: string;
    case_total: number;
    term_end: number;
    /** 1 */
    status: number;
  };
}
