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
