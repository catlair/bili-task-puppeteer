type cookieObject = {
  name: string;
  value: string;
  domain: string;
};

export const getCookies = (
  cookieString: string,
  domain: string,
): cookieObject[] => {
  return cookieString.split(';').map((pair) => {
    const name = pair.trim().slice(0, pair.trim().indexOf('='));
    const value = pair.trim().slice(pair.trim().indexOf('=') + 1);
    return { name, value, domain };
  });
};

export function getUserId(cookie: string): number {
  const result = cookie.match(/(?:^|)DedeUserID=([^;]*)(?:;|$)/);
  return +result?.[1] || 0;
}
