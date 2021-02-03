import { ApiAbstract } from './BiLiAbstractClass';

/**
 * 个人仲裁信息
 */
export class JuryInfoDto extends ApiAbstract {
  /**
   *  0 成功
   *  25005 没有资格
   */
  code: number;
  'data'?: {
    /** 总仲裁数量 */
    caseTotal: number;
    face: string;
    /**当前剩余天数 */
    restDays: number;
    /**当前裁决胜率 */
    rightRadio: number;
    /**是否具有资格 1:有 2:过期 */
    status: 1 | 2;
    uname: string;
  };
}

/**
 * 仲裁内容
 */
export class JuryCaseDto extends ApiAbstract {
  data: {
    /** 仲裁案件id */
    id: number;
    /** 用户mid */
    mid: number;
    status: number;
    originType: number;
    statusTitle: string;
    reasonType: number;
    /** 被举报的内容 */
    originContent: string;
    punishResult: number;
    judgeType: number;
    /** 视频地址 */
    originUrl: string;
    /** 封禁时间 */
    blockedDays: number;
    putTotal: number;
    /** 保留人数 */
    voteRule: number;
    /** 弃权人数 */
    voteBreak: number;
    /** 删除人数 */
    voteDelete: number;
    startTime: number;
    endTime: number;
    ctime: number;
    mtime: number;
    /** 源视频标题 */
    originTitle: string;
    relationId: string;
    face: string;
    /** 用户昵称 */
    uname: string;
    vote: number;
    case_type: number;
    expiredMillis: number;
  };
}

/**
 * 陪审团投票意见
 */
export class JuryVoteOpinionDto extends ApiAbstract {
  data: {
    /** 意见数量 */
    count: number;
    opinion:
      | {
          mid: number;
          opid: number;
          vote: number;
          /** 意见内容 */
          content: string;
          /** 是否匿名 0 匿名；1 不匿名 */
          attr: number;
          /** 反对 */
          hate: number;
          /** 同意 */
          like: number;
        }[]
      | null;
  };
}

/**
 * 投票返回信息
 */
export class JuryVoteDto {
  /**
   * 0 成功
   * 25012 重复投票
   * -400 参数错误
   */
  code: number;
  /** 成功时为'0' */
  message: string;
  ttl: number;
}
