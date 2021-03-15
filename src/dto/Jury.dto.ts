import { ApiAbstract } from './BiLiAbstractClass';

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
