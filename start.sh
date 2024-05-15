#!/bin/bash -x
SabyName=$1
Activation=$2

sleep 2
killall node
PID=$(pgrep -u ${USER} -f bin/gnome-shell)
kill -9 ${PID}
export DISPLAY=:${USER##xdev}

chmod -R  +x ~/SabyDemo/commands 
chmod -R  +x ~/SabyDemo/pythonScripts
cd ~/SabyDemo/
npm rebuild


nohup node index.js $SabyName  $Activation /dev/null > ~/nohup.out 2>&1 &
