#!/bin/bash
function emulatorProcess() {
	EmuProccess=$(pgrep -u ${USER} qemu)
	PROCESS=$?
	return $PROCESS
}
emulatorProcess

PROCESS=$?
if [[ "$PROCESS" -eq 1 ]]; then
	echo 0
	exit
fi
X2=0
Y2=0
for pid in $(xdotool search --pid $(pgrep -u ${USER} qemu)); do
	WindowName=$(xdotool getwindowname $pid)
	if [[ "${WindowName}" == "Android Emulator"* ]]; then
		xdotool windowactivate $pid 2>&1
		EMU_DETAILS="$(cut -d'-' -f2 <<<${WindowName})"
		DIMENTION=$(xdotool getwindowgeometry $pid | grep Geometry | awk '{print $2}')
		POSITION=$(xdotool getwindowgeometry $pid | grep Position | awk '{print $2}')
	fi
done
EmuName="$(cut -d':' -f1 <<<${EMU_DETAILS})"
EmuPort="$(cut -d':' -f2 <<<${EMU_DETAILS})"
REAL_X1="$(cut -d',' -f1 <<<${POSITION})"
REAL_Y1="$(cut -d',' -f2 <<<${POSITION})"

X2="$(cut -d'x' -f1 <<<${DIMENTION})"
Y2="$(cut -d'x' -f2 <<<${DIMENTION})"
echo ${EmuName},${EmuPort},${REAL_X1},${REAL_Y1},${X2},${Y2}
