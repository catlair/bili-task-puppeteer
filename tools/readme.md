## crontab

shell 都是直接百度的。所以，你懂的

`randmon_run.sh` 配合 crontab 和 Docker 随机时间运行。**根据自己情况修改（特别是路径），只是参考**

sh 脚本命令

```bash
./randmon_run.sh 是每日任务还是风纪任务（1、0） 随机最小数 随机最大数
```

示例：
运行风纪任务，随机延迟 2s-7199s 后启动

```bash
./randmon_run.sh 1 2 7200
```

使用时注意一定注意修改`randmon_run.sh`和`crontab`中的路径
