import { fork } from 'child_process';
import { resolve } from 'path';

let child = fork(resolve(__dirname, 'index'));

// 部分错误进行重启处理
let errorCounnt = 0;
child.on('message', msg => {
  if (msg === 'restart' && errorCounnt < 3) {
    errorCounnt++;
    fork(resolve(__dirname, 'index'));
  }
});
