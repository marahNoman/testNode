#!/bin/bash  -x
DIR=$(dirname $0)
#AUDIOFILE=${DIR%%scripts}audio/${1}
AUDIOFILE=${DIR}/../audio/${1}
[ ! -f ${AUDIOFILE} ] && echo "error. audio file does not exist" && exit 2 

pkill -9 -u ${USER} ffplay
ffplay -loglevel quiet -nodisp -autoexit ${AUDIOFILE} >> ~/ffplay.log 2>&1 &
bash -x ${DIR}/audio_mix_ffplay.sh >> ~/audio_mix_ffplay.log  2>&1
