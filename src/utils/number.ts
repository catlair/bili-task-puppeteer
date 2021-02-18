import * as _ from 'lodash';

/** 不同大小的数字区域中选出一个(0-total) */
export function distributedRandom(nums: number[]) {
  if (nums.length === 0) {
    return { value: 0, area: 0 };
  }
  const total = nums.reduce((num, cur) => cur + num, 0);
  if (total === 0) {
    return { value: 0, area: 0 };
  }
  const ranNum = _.random(total - 1);
  let tempNum = 0;
  for (let i = 0; i < nums.length; i++) {
    tempNum += nums[i];
    if (ranNum < tempNum)
      return {
        /** value不是总的第几个,而是区域第几个 (0开始)*/
        value: ranNum - tempNum + nums[i],
        area: i,
      };
  }
}

/** 将包含Promise的数组变成普通数组 */
export async function asyncArrayToArray<T>(
  numsPro: Promise<T>[],
): Promise<T[]> {
  let nums: T[] = [];

  for await (const num of numsPro) {
    nums.push(num);
  }

  return nums;
}

/**
 * 分页
 * @param total 总数量
 * @param pageSize 分页大小 默认10
 */
export function paginationSelect(
  total,
  pageSize: number = 10,
): { page: number; num: number } {
  //需要从0开始的下标
  //total是0开始的,所以加1
  const page = _.ceil(_.divide(total + 1, pageSize)) - 1,
    num = total % pageSize;

  return {
    /** 第几页(从0开始) */
    page,
    /** 第几个(从0开始) */
    num,
  };
}
