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
docker-compose -f /root/workspace/bili_task_jury/docker-compose.yml down
# 等待时间为执行开始后2 - 7200s中随机时间
a=$2
b=$3
[[ ! $2 ]] && a=2
[[ ! $3 ]] && b=7200
out=$(random $a $b)s;
sleep $out
if [ $(grep -c "BILI_TASK_JURY" .env) -eq 0 ];then
echo "BILI_TASK_JURY=false" >> /root/workspace/bili_task_jury/.env
fi
sed -i "s/BILI_TASK_JURY.*$/BILI_TASK_JURY=false/g" /root/workspace/bili_task_jury/.env
if [ $1 -eq 1 ];then
sed -i "s/BILI_TASK_JURY.*$/BILI_TASK_JURY=true/g" /root/workspace/bili_task_jury/.env
fi
# 执行
docker-compose -f /root/workspace/bili_task_jury/docker-compose.yml up -d 
