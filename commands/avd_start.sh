#!/bin/bash


export DISPLAY=:${USER##xdev}
source ~/SabyDemo/commands/CommandCenter.log
HOSTNAME=$(hostname)
USERNAME=${USER}-${HOSTNAME}
ENV_JSON=$(curl -s ${COMMANDCENTERURL}/getConfigEnvironment/${USERNAME})
ENV_HOST_TYPE=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['type']")
ENV_HOST_NAME=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['name']")
ENV_HOST_API=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['host_api']")
PROFILE_JSON=$(curl -s http://${ENV_HOST_API}/getSabyProfileDetail/${USERNAME})
PROFILE_AVD_NAME=$(echo $PROFILE_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['avd_name']")
ADB_PORTS=$(curl -s http://${ENV_HOST_API}/getSabyAdbPort/${USER})
CONSOLE_PORT=$(echo $ADB_PORTS | python2 -c "import sys, json; print json.load(sys.stdin)['console_port']")

function emulatorProcess() {
    pgrep -u ${USER} qemu
    PROCESS=$?
    return $PROCESS
}

function emulatorStart() {
    nohup ~/Android/Sdk/emulator/emulator @$PROFILE_AVD_NAME -port $CONSOLE_PORT -shell -no-boot-anim -qemu -allow-host-audio >~/avd.log 2>&1 &
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

if [[ "$COUNT" -eq 3 ]]; then
    pkill -9 -u ${USER} "main.*php"
    curl -s http://${ENV_HOST_API}/setSabyState/${USERNAME}/KILLED
    exit 1
fi
