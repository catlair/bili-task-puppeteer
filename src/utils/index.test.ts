import { getCookies, getUserId } from './cookie';
import { distributedRandom, paginationSelect } from './number';
import { containProhibit, isMatchString, jsonpToJson } from './string';
import { filterAsync, mapAsync } from './array';
import prohibitWords from '../config/prohibitWords';

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
    expect(getUserId('abc=123')).toBe(0);
  });
});

describe('数处理', () => {
  test('随机分布数字域的随机数', () => {
    expect(distributedRandom([0, 0, 1])).toEqual({
      value: 0,
      area: 2,
    });
    expect(distributedRandom([0, 0, 0])).toEqual({
      value: 0,
      area: 0,
    });
    expect(distributedRandom([])).toEqual({
      value: 0,
      area: 0,
    });
  });

  test('分页选择', () => {
    //从0开始数,50个一页,所以第一页0-49
    expect(paginationSelect(50, 50)).toEqual({
      pageNum: 1,
      num: 0,
    });
    //默认参数
    expect(paginationSelect(10)).toEqual({
      pageNum: 1,
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

  test('jsonp转json', () => {
    const jsonp1 =
      'jQuery17206282081774188071_1613873812188({"code":0,"message":"0","ttl":1,"data":{"count":0,"opinion":null}})';
    const jsonpError = 'ajhksbdsasdj';
    expect(jsonpToJson(jsonp1)).toEqual({
      code: 0,
      message: '0',
      ttl: 1,
      data: {
        count: 0,
        opinion: null,
      },
    });

    expect(jsonpToJson(jsonpError)).toEqual({ data: null, code: -1 });
  });

  test('违禁词检测', () => {
    expect(containProhibit(prohibitWords, '你爸我可厉害了')).toBeTruthy();
    expect(containProhibit(prohibitWords, '你爸爸没给你妈说吗?')).toBeFalsy();
    expect(
      containProhibit(prohibitWords, '你们荷兰人真是伤透了我的心！'),
    ).toBeTruthy();
    // 为空
    expect(containProhibit(prohibitWords, '')).toBeFalsy();
  });
});

describe('数组方法测试', () => {
  test('filterAsync', async () => {
    const result = await filterAsync(
      [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
      async el => (await el) > 1,
    );
    expect(result).toEqual([Promise.resolve(2), Promise.resolve(3)]);
  });

  test('mapAsync', async () => {
    const result = await mapAsync(
      [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)],
      async el => (await el) * 2,
    );
    expect(result).toEqual([2, 4, 6]);
  });
});
