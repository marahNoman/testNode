#!/bin/bash -x
#unload the null modules
#pactl unload-module $app_to_avd_module
#pactl unload-module $avd_to_app_module

VOL="100%"

app_to_avd_module=$(pactl list|grep -B 2 'Argument: sink_name=app_to_avd'|grep "Module"|sed "s/Module #//") 
echo $app_to_avd_module
avd_to_app_module=$(pactl list|grep -B 2 'Argument: sink_name=avd_to_app'|grep "Module"|sed "s/Module #//") 
echo $avd_to_app_module

if [ -z "$app_to_avd_module" ]; then
	echo "app_to_avd_module not loaded, loading now"
	pactl load-module module-null-sink sink_name=app_to_avd sink_properties=device.description=app_to_avd
fi

if [ -z "$avd_to_app_module" ]; then
	echo "avd_to_app_module not loaded, loading now"
	pactl load-module module-null-sink sink_name=avd_to_app sink_properties=device.description=avd_to_app
fi

# get the playback index for app and avd sinks
play_app=$(pactl list |grep -B 30 "module-stream-restore.id = \"sink-input-by-application-name:linphonec"|grep "Sink Input"|sed "s/Sink Input #//")
echo "playback app: $play_app"
play_avd=$(pactl list |grep -B 30 "module-stream-restore.id = \"sink-input-by-application-name:qemu-system-.*\""|grep "Sink Input"|sed "s/Sink Input #//")
echo "playback avd: $play_avd" 

# get the record index for app and avd source
record_app=$(pactl list |grep -B 30 "module-stream-restore.id = \"source-output-by-application-name:ALSA plug-in \[linphonec]\""|grep "Source Output"|sed "s/Source Output #//")
echo "recording app: $record_app"
echo "setting volume for record_app"
#pactl set-sink-volume $record_app ${VOL}
record_avd=$(pactl list |grep -B 30 "module-stream-restore.id = \"source-output-by-application-name:qemu-system-.*\""|grep "Source Output"|sed "s/Source Output #//")	
echo "recording avd: $record_avd"
echo "setting volume for record_avd"
#pactl set-sink-volume $record_avd ${VOL}

# get the index of null sinks
app_to_avd_sink=$(pactl list|grep -B 5 "app_to_avd$"|grep "^Sink"|sed "s/Sink #//")
echo "app_to_avd sink: $app_to_avd_sink"

avd_to_app_sink=$(pactl list|grep -B 5 "avd_to_app$"|grep "^Sink"|sed "s/Sink #//")
echo "avd_to_app sink: $avd_to_app_sink"

# get the index of null sources
app_to_avd_source=$(pactl list|grep -B 5 "app_to_avd.monitor"|grep "^Source"|sed "s/Source #//")
echo "app_to_avd source: $app_to_avd_source"
avd_to_app_source=$(pactl list|grep -B 5 "avd_to_app.monitor"|grep "^Source"|sed "s/Source #//")
echo "avd_to_app source: $avd_to_app_source"

# set the volume
pactl set-sink-volume $app_to_avd_sink ${VOL}
pactl set-sink-volume $avd_to_app_sink ${VOL}

pactl set-sink-input-volume $play_avd ${VOL}
pactl set-sink-input-volume $play_app ${VOL}

pactl set-source-output-volume $record_app ${VOL}
pactl set-source-output-volume $record_avd ${VOL}

# unmute
pactl set-sink-mute $avd_to_app_sink 0
pactl set-sink-mute $app_to_avd_sink 0

pactl set-sink-input-mute $play_avd 0
pactl set-sink-input-mute $play_app 0

pactl set-source-output-mute $record_app 0
pactl set-source-output-mute $record_avd 0

# hookup the playback
echo "hookup the playback"
pactl move-sink-input $play_app $app_to_avd_sink
pactl move-sink-input $play_avd $avd_to_app_sink

# hookup the record
echo "hookup the record"
pactl  move-source-output $record_app $avd_to_app_source
pactl  move-source-output $record_avd $app_to_avd_source

