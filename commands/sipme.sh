#!/bin/bash -x

# to see the current call
# linphonecsh generic "calls"

# to check if the sip was registered
# linphonecsh status register

# to kill linphonecsh
# linphonecsh exit
source ~/SabyDemo/commands/CommandCenter.log
HOSTNAME=$(hostname)
USERNAME=${USER}-${HOSTNAME}
PASSWORD=${HOSTNAME}
SLEEP=2
DAEMON=linphonec
RETRY=5
CONFIG_FILE=~/.config/linphone/linphonerc
ASTERISK_HOST=$1

UBUNTU_VERSION=$(lsb_release -rs)
#if test -z "$ASTERISK_HOST"; then
#	#ENV_TYPE=$(curl -s ${COMMANDCENTERURL}/getConfigEnvironment/${USERNAME} | sed 's/{"type":"//' | sed 's/",".*//')
#	ENV_JSON=$(curl -s ${COMMANDCENTERURL}/getConfigEnvironment/${USERNAME})
#	ASTERISK_HOST=$(echo $ENV_JSON | python2 -c "import sys, json; print json.load(sys.stdin)['host_asterisk']")
#fi

/usr/bin/linphonecsh exit

#if [ ${ENV_TYPE} != "dev" ] && [ ${ENV_TYPE} != "prod" ]; then
#	echo "error, wrong environment type from control center..."
#	exit 2
#fi
# we need to reset linphone connection
sed -i 's/reg_identity=.*/reg_identity=/' ${CONFIG_FILE}
sed -i 's/reg_proxy=.*/reg_proxy=/' ${CONFIG_FILE}
if [[ $(lsb_release -rs) == "20.04" ]]; then
	kill -9 $(pgrep -u ${USER} linph)
fi
sleep 2
#sip server functions
function sipstart() {
	/usr/bin/linphonecsh init -c ~/.config/linphone/linphonerc
	sleep ${SLEEP}
	return $?
}

function sipregister() {
	/usr/bin/linphonecsh init -c ~/.config/linphone/linphonerc
	/usr/bin/linphonecsh register --host ${ASTERISK_HOST} --username ${USERNAME} --password ${PASSWORD}
	#/usr/bin/linphonecsh generic "stun ${HOST}"
	#/usr/bin/linphonecsh generic "firewall stun"
	return $?
}

function sipisregistered() {
	/usr/bin/linphonecsh status register
	return $?
}

function sipautoanswer() {
	/usr/bin/linphonecsh generic "autoanswer enable"
}

#sip server main
pgrep -u ${USER} $DAEMON
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
	echo "starting sip server..."
	sipstart
fi

sipisregistered
STATUS=$?
while [ "$STATUS" -ne 1 ]; do
	echo "sip not registered, will register now..."
	sipregister
	#sipautoanswer
	sleep ${SLEEP}
	sipisregistered
	STATUS=$?
	RETRY=$(($RETRY - 1))
	[ "$RETRY" -eq 0 ] && echo "Error. Could not register." && exit 2
done
exit 0