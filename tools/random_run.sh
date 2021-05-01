#!/bin/bash
set -e

function random()
{
    min=$1;
    max=$2-$1;
    num=$(date +%s+10#%N);
    ((retnum=num%max+min));
    echo $retnum;
}
# 旧的不去新的不来
docker pull catlair/bilitaskpuppeteer:latest
docker-compose -f docker/docker-compose.yml down
# 等待时间为执行开始后2 - 7200s中随机时间
out=$(random 2 7200)s;
sleep $out
# 执行
docker-compose -f docker/docker-compose.yml up -d
