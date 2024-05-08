#!/bin/bash
source ~/SabyDemo/commands/CommandCenter.log
USERNAME=${USER}-${HOSTNAME}
ENV_JSON=$(curl -s ${COMMANDCENTERURL}/getConfigEnvironment/${USERNAME})
ENV_HOST_TYPE=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['type']")
echo "ENV_HOST_TYPE"=${ENV_HOST_TYPE} >~/Documents/Register.log
ENV_HOST_NAME=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['name']")
echo "ENV_HOST_NAME"=${ENV_HOST_NAME} >>~/Documents/Register.log
ENV_HOST_API=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['host_api']")
ADB_PORTS=$(curl -s http://${ENV_HOST_API}/getSabyAdbPort/${USER})
CONSOLE_PORT=$(echo $ADB_PORTS | python2 -c "import sys, json; print json.load(sys.stdin)['console_port']")

AVD_NAME=$1
function emulatorStart() {
    nohup ~/Android/Sdk/emulator/emulator @$AVD_NAME -port ${CONSOLE_PORT} -shell -no-boot-anim -qemu -allow-host-audio >~/avd.log 2>&1 &
}
function emulatorProcess() {
    pgrep -u ${USER} qemu
    PROCESS=$?
    return $PROCESS
}

emulatorStart
sleep 5
emulatorProcess
PROCESS=$?
COUNT=0
while [ "$PROCESS" -eq 1 ] && [ "$COUNT" -lt 3 ]; do
    emulatorStart
    sleep 5
    emulatorProcess
    PROCESS=$?
    ((COUNT++))
done
