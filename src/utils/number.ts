import * as _ from 'lodash';

/**
 * 不同大小的数字区域中选出一个(0-total)
 * @param nums 分布列表
 *
 * @returns value 该区域的第几个(0开始)
 * @returns area 选择的区域编号(0开始)
 */
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
        value: ranNum - tempNum + nums[i],
        area: i,
      };
  }
}

/**
 * 分页
 * @param total 总数量
 * @param pageSize 分页大小 默认10
 *
 * @returns num 第几个(从0开始)
 * @returns page 第几页(从0开始)
 */
export function paginationSelect(
  total,
  pageSize: number = 10,
): { pageNum: number; num: number } {
  //需要从0开始的下标
  //total是0开始的,所以加1
  const pageNum = _.ceil(_.divide(total + 1, pageSize)) - 1,
    num = total % pageSize;

  return { pageNum, num };
}
