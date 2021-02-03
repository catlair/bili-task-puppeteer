import { getCookies, getUserId } from './cookie';
import {
  asyncArrayToArray,
  distributedRandom,
  paginationSelect,
} from './number';
import { isMatchString } from './string';

describe('cookie工具测试', () => {
  test('cookie字符串转cookie对象数组', () => {
    expect(getCookies('demo=test; key=v%2Calue%2C', '.t.cn')).toEqual([
      {
        name: 'demo',
        value: 'test',
        domain: '.t.cn',
      },
      {
        name: 'key',
        value: 'v%2Calue%2C',
        domain: '.t.cn',
      },
    ]);
  });

  test('cookie字符串中获取id', () => {
    expect(getUserId('DedeUserID=12345; abc=123')).toBe(12345);
  });

  test('cookie字符串中获取id失败', () => {
    expect(getUserId('abc=123')).toBe(0);
  });
});

describe('数处理', () => {
  test('Promise<number>[] 转换成 number[]', async () => {
    const asyncArray = [1, 2, 3].map(async el => el);
    expect(await asyncArrayToArray(asyncArray)).toEqual([1, 2, 3]);
  });

  test('随机分布数字域的随机数', () => {
    expect(distributedRandom([0, 0, 1])).toEqual({
      value: 0,
      area: 2,
    });
  });

  test('分页选择', () => {
    //从0开始数,50个一页,所以第一页0-49
    expect(paginationSelect(50, 50)).toEqual({
      page: 1,
      num: 0,
    });
  });
});

describe('string测试', () => {
  test('字符串匹配测试', () => {
    const url1 =
        'https://api.bilibili.com/x/credit/jury/vote/option?jsonp=jsonp&callback=Jquery17123123_13123123&cid=123456&otype=1&pn=1&ps=3&_=234234234',
      url2 =
        'https://api.bilibili.com/x/credit/jury/vote/option?jsonp=jsonp&callback=Jquery17123123_145123123&cid=123454356&otype=2&pn=1&ps=3&_=234234234';

    expect(
      isMatchString(url1, 'api.bilibili.com/x/credit/jury/vote/option'),
    ).toBeTruthy();
    //正则
    expect(
      isMatchString(
        url1,
        /api.bilibili.com\/x\/credit\/jury\/vote\/option.*otype=1/,
      ),
    ).toBeTruthy();
    expect(
      isMatchString(
        url2,
        /api.bilibili.com\/x\/credit\/jury\/vote\/option.*otype=1/,
      ),
    ).toBeFalsy();
  });
});
