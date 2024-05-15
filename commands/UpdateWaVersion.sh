#!/bin/bash -x

CONSOLE_PORT=$1
SabyName=$2

#---------------------------------------------------------------------------------------
# reqyest saby details (Type< prod or dev >, M3allem name (ex. prod2) , host_api ex. wa-api-02.7eet.net ) result will be returned in JSON array


adb_devices_output=$(~/Android/Sdk/platform-tools/adb devices)

# Check if the device you are interested in is in the list
if [[ $adb_devices_output =~ emulator-${CONSOLE_PORT} ]]; then
  # The device is connected; proceed with the installation

  whatsapp_version_old=$(~/Android/Sdk/platform-tools/adb -s emulator-${CONSOLE_PORT} shell dumpsys package com.whatsapp | grep versionName)
  whatsapp_version_old=${whatsapp_version_old#*=}

  wget http://65.109.78.162:443/attachments/getWhatsapp -O  ~/whatsapp.apk
  sleep 5

  # Run the ADB install command with the -r flag to wait until the installation completes
  install_output=$(~/Android/Sdk/platform-tools/adb -s emulator-${CONSOLE_PORT} install -r ~/whatsapp.apk)

  # Check if the installation was successful
  if echo "$install_output" | grep -q "Success"; then
    # Installation succeeded, proceed with further actions
    # Run the ADB command and save the output to a variable
    whatsapp_version=$(~/Android/Sdk/platform-tools/adb -s emulator-${CONSOLE_PORT} shell dumpsys package com.whatsapp | grep versionName)
    whatsapp_version=${whatsapp_version#*=}

    if [ -z "$whatsapp_version" ]; then
      echo "whatsapp_version is null."
    elif [ -z "$whatsapp_version_old" ]; then
      echo "whatsapp_version_old is null."
    else
      if [ "$whatsapp_version_old" = "$whatsapp_version" ]; then
        echo "Version-${whatsapp_version}- The versions are the same. ${SabyName}"
      else
        echo "Done Version-${whatsapp_version}- ${SabyName}"
      fi
    fi
  else
    # Installation failed, handle the error
    echo "Installation failed."
    # You can add further error handling here if needed
  fi

else
  # The device is not connected; you can handle this situation accordingly
  echo "This Device is not connected."
  # Add any error handling or alternative steps you want to perform here.
fi
