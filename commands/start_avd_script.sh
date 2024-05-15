#!/bin/bash
AVD_NAME=$1
AVD_PORT=$2


export DISPLAY=:${USER##xdev}
source ~/SabyDemo/commands/CommandCenter.log
function emulatorProcess() {
    pgrep -u ${USER} qemu
    PROCESS=$?
    return $PROCESS
}


function check_config_ini() {
    local config_file="/home/${USER}/.android/avd/${AVD_NAME}.avd/config.ini"
    if [ -f "$config_file" ]; then
        last_three_lines=$(tail -n 3 "$config_file")
        expected_lines="skin.dynamic=yes\nskin.name=nexus_5\nskin.path=/home/${USER}/Android/Sdk/skins/nexus_5"
        if ! echo -e "$last_three_lines" | grep -q "$expected_lines"; then
            echo -e "$expected_lines" >> "$config_file"
        fi
    else
        echo "Config file not found: $config_file"
    fi
}
check_config_ini

function emulatorStart() {
    nohup ~/Android/Sdk/emulator/emulator @$AVD_NAME -port $AVD_PORT -shell -no-boot-anim -qemu -allow-host-audio >~/avd.log 2>&1 &
}



emulatorProcess
PROCESS=$?
COUNT=0
while [ "$PROCESS" -eq 1 ] && [ "$COUNT" -lt 3 ]; do
    echo "" >~/avd.log
    emulatorStart
    sleep 5
    emulatorProcess
    PROCESS=$?
    ((COUNT++))
done



