#!/bin/bash -x
killall node
pkill -u ${USER} -9 qemu
