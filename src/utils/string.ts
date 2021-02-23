import * as _ from 'lodash';

/**
 * 是否为目的字符串
 * @param string 完整字符串
 * @param match 匹配信息
 */
export function isMatchString(string: string, match: string | RegExp) {
  if (typeof match === 'string') {
    return string.includes(match);
  }
  return match.test(string);
}

export function jsonpToJson(jsonp: string): { [key: string]: any } {
  const json = jsonp.match(/\w*\(({.*})\)/);
  try {
    return JSON.parse(json[1]);
  } catch (error) {
    return { data: null, code: -1 };
  }
}

export function containProhibit(
  words: Array<string | Function | RegExp>,
  str: string,
): boolean {
  if (!str) {
    return false;
  }
  const strWords = words.filter(word => _.isString(word)) as string[];
  const regWords = words.filter(word => _.isRegExp(word)) as RegExp[];
  const funWords = words.filter(word => _.isFunction(word)) as Function[];
  let result = false;
  result = strWords.some(el => str.includes(el)) || result;
  result = regWords.some(el => el.test(str)) || result;
  result = funWords.some(el => el(str)) || result;
  return result;
}
