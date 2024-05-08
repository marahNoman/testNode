#!/bin/bash -x
SabyName=$1

if [ -z "$SabyName" ] || [ "$SabyName" == "null" ]; then
    SabyName="${USER}@$(hostname)-A"
fi

killall node
PID=$(pgrep -u ${USER} -f bin/gnome-shell)
kill -9 ${PID}
export DISPLAY=:${USER##xdev}

chmod -R  +x ~/SabyDemo/commands 
chmod -R  +x ~/SabyDemo/pythonScripts
cd ~/SabyDemo/
npm rebuild

nohup node index.js $SabyName register /dev/null > nohup.out 2>&1 &
