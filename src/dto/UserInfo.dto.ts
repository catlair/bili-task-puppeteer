import { ApiAbstract } from './BiLiAbstractClass';

//用户信息
export class UserInfoNavDto extends ApiAbstract {
  data?: {
    isLogin: boolean;
    //等级信息
    level_info: {
      current_level: number;
      current_min: number;
      current_exp: number;
      next_exp: number;
    };
    mid: number; //用户id
    money: number; //硬币
    moral: number;
    scores: number;
    uname: string;
    /** 会员到期时间 */
    vipDueDate: number;
    /** 0无 1有 */
    vipStatus: 0 | 1;
    /** 0:无 1:月度 2:年度及以上 */
    vipType: 0 | 1 | 2;
    vip_label: {
      text: number;
    };
  };
}
