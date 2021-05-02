export * from './cookie';
export * from './number';
export * from './string';
export * from './array';

import { resolve } from 'path';

export function getVersion() {
  let CURRENT_VERSION = 'x.x.x';
  try {
    CURRENT_VERSION = require(resolve(__dirname, '../config/level.json'));
  } catch (error) {}
  return CURRENT_VERSION;
}
