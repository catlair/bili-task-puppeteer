set -e

function random()
{
    min=$1;
    max=$2-$1;
    num=$(date +%s+10#%N);
    ((retnum=num%max+min));
    echo $retnum;
}
# 等待时间为执行开始后2 - 7200s中随机时间
out=$(random 2 7200)s;
sleep $out
# 已经运行的docker容器name为bili_jury
docker start bili_jury
