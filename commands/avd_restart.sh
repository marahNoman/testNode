#!/bin/bash
pkill -u ${USER} -9 qemu
export DISPLAY=:${USER##xdev}
echo "" > ~/avd.log
nohup ~/Android/Sdk/emulator/emulator @GB -shell -no-boot-anim -camera-back none -camera-front none -memory 1500 -cache-size 1000 -qemu -allow-host-audio > ~/avd.log 2>&1 &
