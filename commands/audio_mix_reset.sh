#!/bin/bash  -x
#unload the null modules
#pactl unload-module $app_to_avd_module
#pactl unload-module $avd_to_app_module

VOL="100%"

list_modules=$(pactl list| grep -B 2 "Name: module-alsa-card"|grep "Module"|sed "s/Module #//")
for module in $list_modules; do
	echo $module
	pactl unload-module $module
done



