<?php

use JetBrains\PhpStorm\Internal\ReturnTypeContract;

require_once dirname(__DIR__) . '/pythonUIClass/pythonUI.php';

class Automate
{
    public $pythonUI = null;
    public $state = null;
    public $saby = null;
    public $sabyFullName = null;
    public $emulatorPort = null;
    public $cmdKey = 'KeyModifier.CTRL';
    public $viberPid = 0;
    public $dumpScreenFile = null;
    public $AVDPid = null;
    public $_data = null;
    public $androidVersion = null;
    public $reporter = null;
    public $EMULATOR_ID = null;
    public function __construct($sabyName, $sabyFullName, $emulatorPort)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $this->pythonUI = new pythonUI();
        $this->saby = $sabyName;
        $this->sabyFullName = $sabyFullName;
        $this->emulatorPort = $emulatorPort;
        $this->dumpScreenFile = $_SERVER['HOME'] . '/myLogxml.xml';
        unset($sabyName, $sabyFullName, $emulatorPort);
    }
    public function addEmulatorObject($emulator)
    {
        $this->EMULATOR_ID = $emulator;
    }
    public function addTransporterObject($transporterObject)
    {
        $this->reporter = $transporterObject;
    }

    public function __destruct()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        //$this->cleanup();
        myLog("Destroying Auto/PYTHON UI Class");
    }

    public function cleanup()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        foreach (get_class_vars(__CLASS__) as $clsVar => $_) {
            unset($this->$clsVar);
        }

        //cleanup all objects inside data array
        if (is_array($this->_data)) {
            foreach ($this->_data as $value) {
                if (is_object($value) && method_exists($value, 'cleanUp')) {
                    $value->cleanUp();
                }
            }
        }
        unset($clsVar, $_, $value);
    }

    public function setAVDLocation()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $AVDPid = $this->_getAVDPid();
        $wid = $this->_getAVDMainWid($AVDPid);
        $output = shell_exec("xdotool windowmove " . $wid . " 0 0 2>&1");
        if (strstr($output, 'failed')) {
            unset($AVDPid, $wid, $output);
            return false;
        }
        return true;
    }

    public function putAVDInFocus()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        myLog("Putting AVD in Focused state.");
        $AVDPid = $this->_getAVDPid();
        myLog("Emulator Proccess ID : " . $AVDPid);
        $wid = $this->_getAVDMainWid($AVDPid);
        myLog("Emulator Window ID : " . $wid);
        $isActive = $this->_activateWindow($wid);
        unset($AVDPid, $wid, $isActive);
        return true;
    }

    private function _getAVDPid()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $pid = shell_exec('pgrep -u ${USER} -x qemu-system-x86');
        if (!empty($pid)) {
            return trim($pid);
        }
        return false;
    }

    private function _getAVDMainWid($pid)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $wids = shell_exec("xdotool search --pid " . $pid . " 2>&1");
        $wids = explode("\n", $wids);
        foreach ($wids as $wid) {
            $wid = (int) $wid;
            if ($wid) {
                $windowName = shell_exec("xdotool getwindowname " . $wid . " 2>&1");
                if ($this->_isAVDWindow($windowName)) {
                    unset($pid, $wids, $windowName);
                    return $wid;
                }
            }
        }
        unset($pid, $wid, $wids, $windowName);
    }

    private function _isAVDWindow($windowName)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        if (strstr($windowName, 'Android Emulator')) {
            unset($windowName);
            return true;
        }
        unset($windowName);
        return false;
    }

    private function _activateWindow($wid)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $output = shell_exec("xdotool windowactivate $wid 2>&1");
        if (strstr($output, 'failed')) {
            unset($output, $wid);
            return false;
        }
        unset($output, $wid);
        return true;
    }

    public function putAVDinDialState($try = 1, $updateState = true)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        myLog("Putting AVD in Ready state. Try  $try");
        $this->AVDPid = getAVDPid();
        $wid = getAVDMainWid($this->AVDPid);

        $isActive = activateWindow($wid);
        if ($isActive) {
            unset($try, $updateState, $wid, $isActive);
            return true;
        }
    }

    public function ConfirmVpnStatus($vpn_provider, $vpn_region)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $regionArr = null;
        switch ($vpn_provider) {
            case "ExpressVPN":
            case "com.expressvpn.vpn":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.expressvpn.vpn/.ui.home.HomeActivity");
                if ($this->pythonUI->exists(IMG . 'ExpressVpnNotSignedIn.png', null, 30)) {
                    mylog("ExpressVpn Not Logged In");
                    $this->loginExpressVPN();
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.expressvpn.vpn/.ui.home.HomeActivity");
                if ($this->pythonUI->exists(IMG . 'ExpressVpnNeverConnected.png', null, 30) || $this->pythonUI->exists(IMG . 'ExpressVpnNotConnected.png', null, 5)) {
                    mylog("ExpressVpn NOT CONNECTED");
                    $this->ConnectExpressVPN($vpn_region);
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.expressvpn.vpn/.ui.home.HomeActivity");
                if ($this->pythonUI->exists(IMG . 'ExpressVpnConnected.png', null, 30)) {
                    mylog("ExpressVpn CONNECTED");
                }
                break;
            case "Surfshark":
            case "com.surfshark.vpnclient.android":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.surfshark.vpnclient.android/.app.feature.main.MainActivity");
                if ($this->pythonUI->exists(IMG . 'SurfSharkNotSignedIn.png', null, 30) || $this->pythonUI->exists(IMG . 'SurfSharkNotSignedIn2.png', null, 5)) {
                    mylog("SurfShar Not Logged In");
                    $this->loginSurfShark();
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.surfshark.vpnclient.android/.app.feature.main.MainActivity");
                if ($this->pythonUI->exists(IMG . 'SurfSharkNotConnected.png', null, 30)) {
                    mylog("SurfShar NOT CONNECTED");
                    $this->ConnectSurfShark($vpn_region);
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.surfshark.vpnclient.android/.app.feature.main.MainActivity");
                if ($this->pythonUI->exists(IMG . 'SurfSharkConnected.png', null, 30)) {
                    mylog("SurfShar CONNECTED");
                }
                break;
            case "PIA":
            case "com.ixolit.ipvanish":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.ixolit.ipvanish");
                sleep(5);
                $piaVersion = $this->getApplicationVersion('com.ixolit.ipvanish');
                $piaVersion = intval(substr($piaVersion, 0, 1));
                if ($piaVersion == 3) {
                    exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.activity.ActivityMain");
                    if ($this->pythonUI->exists(IMG . 'PIANotSignedIn.png', null, 30)) {
                        mylog("PIA Not Logged In");
                        $this->loginPIA();
                    }
                    exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.activity.ActivityMain");
                    if ($this->pythonUI->exists(IMG . 'PIANotConnected.png', null, 30)) {
                        mylog("PIA NOT CONNECTED");
                        $this->ConnectPIA($vpn_region);
                    }
                    exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.activity.ActivityMain");
                    if ($this->pythonUI->exists(IMG . 'PIAConnected.png', null, 30)) {
                        mylog("PIA CONNECTED");
                    }
                } else {
                    $this->loginPIA();
                    exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.presentation.features.main.MainActivity");
                    $this->dumpScreenToFile();
                    if ($this->searchStringInDumpScreen('text="Not connected" resource-id="com.ixolit.ipvanish:id/connection_status_text_view"')) {
                        $this->ConnectPIA($vpn_region);
                    }
                }
                break;
            case "Strong":
            case "com.strongvpn":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.strongvpn/.app.presentation.features.connect.MainActivity");
                if ($this->pythonUI->exists(IMG . 'StrongVpnDisconnected.png', null, 30)) {
                    mylog("Strong NOT CONNECTED");
                    $this->ConnectStrong($vpn_region);
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.strongvpn/.app.presentation.features.connect.MainActivity");
                if ($this->pythonUI->exists(IMG . 'StrongVpnConnected.png', null, 30)) {
                    mylog("StrongVpn CONNECTED");
                }
                break;
            case "HotSpot":
            case "hotspotshield.android.vpn":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n hotspotshield.android.vpn/com.anchorfree.hotspotshield.ui.HssActivity");
                if (!$this->pythonUI->exists(IMG . 'HotspotDisconnectVPN.png', null, 30)) {
                    mylog("HotSpot NOT CONNECTED");
                    //$this->ConnectHotSpot($vpn_region);
                    exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 780");
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n hotspotshield.android.vpn/com.anchorfree.hotspotshield.ui.HssActivity");
                if ($this->pythonUI->exists(IMG . 'HotspotDisconnectVPN.png', null, 30)) {
                    mylog("HotSpot CONNECTED");
                }
                break;

            case "PureVpn":
            case "com.gaditek.purevpnics":
                $regionVPN = null;
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.gaditek.purevpnics/.main.dashboard.DashboardActivity");
                if ($this->pythonUI->findAndClick(IMG . 'PureVpnDiconnected.png', null, 30)) {
                    mylog("PureVpn NOT CONNECTED");
                    $this->ConnectPureVpn($vpn_region);
                }
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.gaditek.purevpnics/.main.dashboard.DashboardActivity");
                if ($this->pythonUI->exists(IMG . 'PureVpnConnected.png', null, 30)) {
                    mylog("PureVpn CONNECTED");
                }
                break;

            case "WireGuard":
            case "com.wireguard.android":
                exec("~/Android/Sdk/platform-tools/adb -s emulator-" . $this->emulatorPort . " shell am start -n com.wireguard.android/.activity.MainActivity");
                $regionVPN = null;
                sleep(4);
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen('text="OFF" resource-id="com.wireguard.android:id/tunnel_switch"')) {
                    $this->dumpScreenToFile();
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.wireguard.android:id/tunnel_switch");
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                        $this->click($xCoordinate, $yCoordinate);
                    }
                }
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen('text="ON" resource-id="com.wireguard.android:id/tunnel_switch"')) {
                    if ($this->pythonUI->findAndClick(IMG . 'WireGuardNotConnected.png', null, 30)) {
                        mylog("WireGuard Not CONNECTED");
                        $this->pythonUI->click($regionVPN);
                    }
                    if ($this->pythonUI->exists(IMG . 'WireGuardConnected.png', null, 30)) {
                        mylog("WireGuard CONNECTED");
                    }
                }
                break;
        }
        unset($regionArr, $regionVPN, $vpn_provider, $vpn_region);
    }

    public function contactsEnabled()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . "  -s emulator-" . $this->emulatorPort . " shell am start -n com.android.contacts/.activities.ContactEditorAccountsChangedActivity");
        if ($this->pythonUI->exists(IMG . 'EnableContactsAdd.png', null, 30)) {
            $confirmAddContacts = null;
            $regionArr = null;
            $this->pythonUI->findAndClick(IMG . 'EnableContactsAddConfirm.png', null, 30);
        }
        unset($confirmAddContacts, $regionArr);
    }

    public function destroyExpressVpn()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.expressvpn.vpn");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.expressvpn.vpn/.ui.home.HomeActivity");
        sleep(10);
        $result = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys activity activities | grep 'mResumedActivity'");
        myLog("Which Activity is this ? : " . $result);
        if (substr_count($result, 'com.expressvpn.vpn/.ui.home.HomeActivity') > 0) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 90 175");
            sleep(10);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 300 1635");
            sleep(10);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 780 1100");
            sleep(5);
            $vpnAccountIdFile = "/home/" . get_current_user() . "/Documents/VPN_ID.txt";
            $id = trim(file_get_contents($vpnAccountIdFile));
            updateExpressVpnAccount($id, 'disconnect');
        }
        unset($id, $result);
    }

    public function destroySurfshark()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.surfshark.vpnclient.android");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.surfshark.vpnclient.android/.app.feature.main.MainActivity");
        sleep(10);
        $result = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys activity activities | grep 'mResumedActivity'");
        myLog("Which Activity is this ? : " . $result);
        if (substr_count($result, 'com.surfshark.vpnclient.android') > 0) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 950 1650");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 155");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 850 480");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 800 1030");
        }
        unset($result);
    }

    public function destroyPIA()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.ixolit.ipvanish");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.ixolit.ipvanish/.activity.ActivityMain");
        sleep(10);
        $result = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys activity activities | grep 'mResumedActivity'");
        myLog("Which Activity is this ? : " . $result);
        if (substr_count($result, 'com.ixolit.ipvanish') > 0) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 100 172");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 390 1415");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 1000 170");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 600 175");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 860 1180");
        }
        unset($result);
    }

    public function destroyHotSpot()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop hotspotshield.android.vpn");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n hotspotshield.android.vpn/com.anchorfree.hotspotshield.ui.HssActivity");
        sleep(10);
        $result = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys activity activities | grep 'mResumedActivity'");
        myLog("Which Activity is this ? : " . $result);
        if (substr_count($result, 'hotspotshield.android.vpn') > 0) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 870 1660");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 270 880");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 190 1100");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 800 1050");
        }
        unset($result);
    }

    public function destroyWireGuard()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        file_get_contents("http://cc-api.7eet.net/destroySabyVpnActivation/" . $this->saby);
        file_get_contents("http://cc-api.7eet.net/destroySabyVpnActivation/" . $this->sabyFullName);
    }

    public function increaseVolume()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put system volume_voice_speaker 100");
    }

    public function getProfilePic()
    {
        myLog("RUNNING >>>>" . __FUNCTION__ . " IN CLASS >>>> " . __CLASS__);
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_URL => 'http://95.217.198.229/apk/ProfilePic/picture.php',
            CURLOPT_USERAGENT => 'Codular Sample cURL Request',
        ]);
        $resp = curl_exec($curl);
        curl_close($curl);
        exec("wget " . $resp . " -O ~/pic.jpg");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " push ~/pic.jpg /mnt/sdcard/pic.jpeg");
    }

    public function add_contacts()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $amount = rand(100, 500);
        $url = 'http://filter.7eet.net/validation/BatchingAPI.php?machine_id=' . $this->sabyFullName . '&country_code=0&amount=' . $amount . '&try=1000';
        myLog('url : ' . $url);

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_URL => $url,
            CURLOPT_USERAGENT => 'Codular Sample cURL Request',
        ]);

        $resp = curl_exec($curl);
        curl_close($curl);

        $file_apart = explode('/', $resp);
        $file_name_index = count($file_apart) - 1;
        $download_file = $file_apart[$file_name_index];
        myLog('download_file : ' . $download_file);
        exec("wget " . $resp . " -O ~/" . $download_file);

        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " push ~/" . $download_file . " mnt/sdcard/download/contacts.vcf");
        exec(ADB . ' -s emulator-' . $this->emulatorPort . ' shell am start -t "text/vcard" -d "file:/mnt/sdcard/download/contacts.vcf" -a android.intent.action.VIEW com.android.contacts');
        sleep(1);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 880 1050");
        unset($download_file, $file_name_index, $file_apart, $resp, $curl, $amount);
    }

    public function setGeoLocation($latitude, $longtitude)
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " emu geo fix " . $latitude . " " . $longtitude);
        unset($latitude, $longtitude);
    }

    public function installApp()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        return trim(shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g " . "/home/" . get_current_user() . "/Downloads/WAORG.apk"));
    }
    // TODO activation Functions 
    public function activateAppStage1()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $counterTry = 0; 
        do {
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("Choose your language to get started")) {
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("English");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    $this->click($xCoordinate, $yCoordinate);
                }
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/next_button");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    $this->click($xCoordinate, $yCoordinate);
                }
            }
            $counterTry++;
        } while ($counterTry <= 5);
        if ($this->pythonUI->findAndClick(IMG . 'whatsapp_ok_big.png', null, 10)) {
            sleep(2);
            $this->swipe(475, 1600, 475, 600, 1000);
        }
        if ($this->pythonUI->findAndClick(IMG . 'gb_agree_and_continue.png', null, 10) || $this->pythonUI->findAndClick(IMG . 'gb_agree_and_continue_2.png', null, 10)) {
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("Verify phone number") || $this->searchStringInDumpScreen("Enter your phone number")) {
                $this->swipe(500, 800, 500, 0, 500);
                $this->swipe(500, 800, 500, 0, 500);
                sleep(5);
            }
            return true;
        } else {
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("Agree and continue") || $this->searchStringInDumpScreen("AGREE AND CONTINUE")) {
                $this->dumpScreenToFile();
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Agree and continue");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    $this->click($xCoordinate, $yCoordinate);
                }
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("AGREE AND CONTINUE");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    $this->click($xCoordinate, $yCoordinate);
                }
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/eula_accept");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    $this->click($xCoordinate, $yCoordinate);
                }
                sleep(5);
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen("Verify phone number") || $this->searchStringInDumpScreen("Enter your phone number")) {
                    $this->swipe(500, 800, 500, 0, 500);
                    sleep(5);
                }
                return true;
            }
            return false;
        }
    }

    public function activateAppStage2()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        if ($this->pythonUI->exists(IMG . 'gb_next.png', null, 10) || $this->pythonUI->exists(IMG . 'gb_next_2.png', null, 10)) {

            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
            $tryCount = 0;
            do {
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen("Select number")) {
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("USE");
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                    break;
                }
                sleep(2);
                $tryCount++;
            } while ($tryCount <= 5);
            if ($this->pythonUI->findAndClick(IMG . 'wa_phonenumber.png', null, 2)) {
                return true;
            } else {
                return false;
            }
        } else {
            unset($regionPhoneNumber, $regionArr);
            return false;
        }
    }

    public function activateAppStage3()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $banned = false;
        $tryCount = 0;
        do {
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("is not a valid mobile number for") || $this->searchStringInDumpScreen("is too long for")) {
                return false;
            }
            $tryCount++;
        } while ($tryCount <= 5);
        $tryCount = 0;
        do {
            if ($this->isWhatsappSpamAccount()) {
                return false;
            }
            $tryCount++;
        } while ($tryCount <= 5);
        $findOk = $this->pythonUI->findAndClick(IMG . 'whatsapp_verify_ok.png', null, 5);
        if ($findOk) {
            while ($tryCount < 5) {
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen("To automatically verify with a missed call to your phone:") || $this->searchStringInDumpScreen("Verify phone number")) {
                    $this->swipe(500, 800, 500, 0, 500);
                    $this->swipe(500, 800, 500, 0, 500);
                    $this->dumpScreenToFile();
                    sleep(5);
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId('com.whatsapp:id/verify_with_sms_button');
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    } else {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('VERIFY WITH SMS');
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    }
                    sleep(5);
                    $this->dumpScreenToFile();
                    if ($this->searchStringInDumpScreen("Verify phone number")) {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('VERIFY ANOTHER WAY');
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    } else {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId('com.whatsapp:id/verify_another_way_button_view');
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    }
                    sleep(5);
                    $this->dumpScreenToFile();
                    if (
                        $this->searchStringInDumpScreen("Verify your phone number another way")
                        || $this->searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call")
                    ) {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("SEND SMS");
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    }
                    sleep(5);
                }
                $this->dumpScreenToFile();
                if ($this->searchStringInDumpScreen("No call detected")) {
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Verify with SMS");
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    } else {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/verify_with_sms_button");
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    }
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('VERIFY ANOTHER WAY');
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId('com.whatsapp:id/verify_another_way_button_view');
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                    sleep(5);
                    $this->dumpScreenToFile();
                    if (
                        $this->searchStringInDumpScreen("Verify your phone number another way")
                        || $this->searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call")
                    ) {
                        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("SEND SMS");
                        if ($xCoordinate > 0 && $yCoordinate > 0) {
                            $this->click($xCoordinate, $yCoordinate);
                        }
                    }
                }
                $this->dumpScreenToFile();
                if ($this->pythonUI->exists(IMG . 'wa_banned.png', null, 1) || $this->searchStringInDumpScreen("Use your other phone to confirm moving WhatsApp to this one.")) {
                    $banned = true;
                    break;
                }
                $tryCount++;
            }
        }
        if ($banned || $tryCount >= 20) {
            return false;
        }
        do {
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("Switching to WhatsApp Messenger will delete all of your business information")) {
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("SWITCH");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                } else {
                    $this->dumpScreenToFile();
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Switch");
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                }
                break;
            } else {
                $this->pythonUI->findAndClick(IMG . "whatsappSwitchButton.png", null, 5);
            }
            if ($this->searchStringInDumpScreen("To automatically verify with a missed call to your phone:") || $this->searchStringInDumpScreen("Verify phone number")) {
                $this->swipe(500, 800, 500, 0, 500);
                $this->swipe(500, 800, 500, 0, 500);
                $this->dumpScreenToFile();
                sleep(5);
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId('com.whatsapp:id/verify_with_sms_button');
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                } else {
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('VERIFY WITH SMS');
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                }
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('VERIFY ANOTHER WAY');
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                }
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId('com.whatsapp:id/verify_another_way_button_view');
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                }
                sleep(5);
                $this->dumpScreenToFile();
                if (
                    $this->searchStringInDumpScreen("Verify your phone number another way")
                    || $this->searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call")
                ) {
                    list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("SEND SMS");
                    if ($xCoordinate > 0 && $yCoordinate > 0) {
                        $this->click($xCoordinate, $yCoordinate);
                    }
                }
                sleep(5);
            }
            $tryCount++;
            sleep(2);
        } while ($tryCount <= 5);
        sleep(3);
        unset($regionArr, $tryCount, $regionVerifyOk, $banned);
        return true;
    }

    public function installIpLocationApp()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g " . dirname(__DIR__) . "/apk/IPLocation.apk");
    }

    public function add_profile_pic()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.whatsapp/.profile.ProfileInfoActivity");
        sleep(1);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 725 807");
        sleep(3);
        $onscreen = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell uiautomator dump && " . ADB . " -s emulator-" . $this->emulatorPort . " shell cat /sdcard/window_dump.xml");
        $remove = substr_count($onscreen, "Remove");
        if ($remove > 0) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 425 1410");
        } else {
            $this->dumpScreenToFile();
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString('Gallery');
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 280 500");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 196 570");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 900 1680");
        unset($onscreen, $xCoordinate, $yCoordinate);
    }

    public function click($xCoordinate, $yCoordinate)
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input tap ' . $xCoordinate . ' ' . $yCoordinate;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd);
    }

    public function swipe($x1Coordinate, $y1Coordinate, $x2Coordinate, $y2Coordinate, $duration)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ');
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input swipe ' . $x1Coordinate . ' ' . $y1Coordinate . ' ' . $x2Coordinate . ' ' . $y2Coordinate . ' ' . $duration;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd, $x1Coordinate, $y1Coordinate, $x2Coordinate, $y2Coordinate, $duration);
    }

    public function dumpScreenToFile()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ');
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' exec-out uiautomator dump /dev/tty > ' . $this->dumpScreenFile;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd);
        sleep(1);
    }

    public function browseWeb($httpLink)
    {
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop org.chromium.webview_shell");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell pm clear org.chromium.webview_shell");
        sleep(5);
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n org.chromium.webview_shell/.WebViewBrowserActivity -a android.intent.action.VIEW -d " . $httpLink;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd, $httpLink);
    }

    private function _doLog($cmd)
    {
        $date = new DateTime();
        myLog($cmd . " @ " . $date->format('Y-m-d G:i:s.u'));
        unset($cmd, $date);
    }
    public function connectWifi()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . "  -s emulator-" . $this->emulatorPort . " shell am start -n com.android.settings/com.android.settings.Settings");
        if ($this->pythonUI->exists(IMG . 'SettingsSearchArea.png', null, 30)) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 270 195");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text internet");
        }
        $regionVPN = null;
        $regionArr = null;
        if ($this->pythonUI->findAndClick(IMG . 'Internet.png', null, 30)) {
            if ($this->pythonUI->exists(IMG . 'WifiOff.png', null, 30)) {
                sleep(2);
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 909 409");
            }
        }
        unset($regionVPN, $regionArr);
    }

    public function setPlaneMode($status)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.android.settings");
        sleep(10);
        exec(ADB . "  -s emulator-" . $this->emulatorPort . " shell am start -n com.android.settings/com.android.settings.Settings");
        if ($this->pythonUI->exists(IMG . 'SettingsSearchArea.png', null, 30)) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 270 195");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text internet");
        }
        $regionVPN = null;
        $regionArr = null;
        $this->pythonUI->findAndClick(IMG . 'Internet.png', null, 30, $regionVPN, $regionArr);
        sleep(5);
        myLog("The Order is if 1 is turning off if 0 turning on : " . $status);
        if ($status == 'off' && $this->getAirPlaneStause() == 0) {
            if ($this->pythonUI->exists(IMG . 'PlaneMode.png', null, 30)) {
                sleep(2);
                myLog("Set AirPlane Mode ON");
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 909 946");
            }
        } elseif ($status == 'on' && $this->getAirPlaneStause() == 1) {
            if ($this->pythonUI->exists(IMG . 'PlaneMode.png', null, 30)) {
                myLog("Set AirPlane Mode OFF");
                sleep(5);
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 909 946");
            }
        }
        unset($status, $regionVPN, $regionArr);
    }

    public function getAirPlaneStause()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $result = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings get global airplane_mode_on");
        $result = str_replace('\n', '', $result);
        myLog("The Airplane mode is " . strval($result));
        return strval($result);
    }

    public function uninstallVpn($vpnRetuenType)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        switch ($vpnRetuenType) {
            case "PureVpn":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall com.gaditek.purevpnics");
                break;
            case "ExpressVPN":
                $this->destroyExpressVpn();
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall com.expressvpn.vpn");
                break;
            case "Surfshark":
                $this->destroySurfshark();
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall com.surfshark.vpnclient.android");
                break;
            case "HotSpot":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall hotspotshield.android.vpn");
                break;
            case "PIA":
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall com.ixolit.ipvanish");
                break;
            case "WireGuard":
            case "NordVpn":
            case "Wire-XpressVpn":
                $this->destroyWireGuard();
                exec(ADB . " -s emulator-" . $this->emulatorPort . " uninstall com.wireguard.android");
                break;
        }
        unset($vpnRetuenType);
    }

    // Install ExpressVPN and Login
    public function loginExpressVPN()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/expressvpn-7-9-8.apk");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.expressvpn.vpn/.ui.user.WelcomeActivity");
        sleep(5);
        list($id, $username, $password) = getExpressVpnAccount();
        $vpnAccountIdFile = "/home/" . get_current_user() . "/Documents/" . $this->sabyFullName . "-VPN_ID.txt";
        file_put_contents($vpnAccountIdFile, $id);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 1616");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text '" . $username . "'");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 162 845");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text '" . $password . "'");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
        //////////////////////////////////////////////////////
        usleep(500000);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 540 1150");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 1643");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 1450");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 866 1520");
        sleep(10);
        updateExpressVpnAccount($id, 'connect');
        unset($id, $username, $password, $vpnAccountIdFile);
    }

    //Connect ExpressVPN and Set it Always on VPN
    public function ConnectExpressVPN($vpn_region)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.expressvpn.vpn/.ui.home.HomeActivity");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 936 987");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 830 170");
        sleep(5);
        if ($vpn_region != 'Unknown') {
            $random_vpn_region = getExpressVpnRandomRegion($vpn_region);
        } else {
            $random_vpn_region = 'USA';
        }
        //$random_vpn_region = str_replace(" ", "\ ",$random_vpn_region);
        //exec(ADB." -s emulator-" . $this->emulatorPort . " shell input text " . $random_vpn_region);
        $this->pythonUI->type($random_vpn_region);
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 490 380");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.expressvpn.vpn");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        unset($vpn_region);
        return $random_vpn_region;
    }

    public function updateSurfShark()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/Surfshark.apk");
    }
    //Install SurfShark and Login
    public function loginSurfShark()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        if (rand(0, 50) > 20) {
            $username = 'saher@mapletele.com';
        } else {
            $username = 'm.othman@mapletele.com';
        }
        $password = 'Moh.2023!@!';
        echo "instaling VPN" . "\n";
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/Surfshark.apk");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.surfshark.vpnclient.android/.app.feature.onboarding.OnboardingActivity");
        sleep(5);
        ///////////////////SurfShark-Account/////////////////
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 540 1500");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 100 450");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text '" . $username . "'");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 100 720");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text '" . $password . "'");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 540 920");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 925 175");
        unset($username, $password);
    }

    //Connect surfshark and Set it Always on VPN
    public function ConnectSurfShark($vpn_region)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $reagonOK = null;
        $reagonArr = null;
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.surfshark.vpnclient.android/.app.feature.main.MainActivity");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 400 1640");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 1000 170");
        sleep(5);
        if ($vpn_region != 'Unknown') {
            $random_vpn_region = getSurfSharkRandomRegion($vpn_region);
        } else {
            $random_vpn_region = 'USA';
        }
        //$random_vpn_region = str_replace(" ", "\ ",$random_vpn_region);
        //exec(ADB." -s emulator-" . $this->emulatorPort . " shell input text ".$random_vpn_region);
        $this->pythonUI->type($random_vpn_region);
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 400 500");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 875 1525");
        sleep(5);
        if ($this->pythonUI->exists(IMG . 'SurfSharkTimeToUpdate.png', null, 5)) {
            $this->pythonUI->findAndClick(IMG . 'SurfsharkCancelButton.png', null, 5);
        }
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.surfshark.vpnclient.android");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        unset($reagonOK, $reagonArr, $vpn_region);
        return $random_vpn_region;
    }

    public function writeText($string)
    {
        $string = str_replace(" ", "\ ", $string);
        if (substr_count($string, "+") > 0) {
            $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input text +' . substr($string, 1);
        } else {
            $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input text ' . $string;
        }
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd, $string);
    }

    public function _checkLoginPia()
    {
        myLog("RUNNING >>>>" . __FUNCTION__ . " IN CLASS >>>> " . __CLASS__);
        $username = 'mohammad.othman.mo@gmail.com';
        $sharedPrefsString = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell cat '/data/data/com.ixolit.ipvanish/shared_prefs/com.ixolit.ipvanish_preferences.xml'");
        return (substr_count($sharedPrefsString, $username) > 0);
    }

    //Install IP VANISH (PIA) and Login
    public function loginPIA()
    {
        myLog("RUNNING >>>>" . __FUNCTION__ . " IN CLASS >>>> " . __CLASS__);
        $username = 'mohammad.othman.mo@gmail.com';
        $password = 'Moh.2022!@!';
        if (!$this->searchForFile("/data/data/com.ixolit.ipvanish")) {
            myLog("RUNNING >>>> INSTALL PIA APK " . __FUNCTION__ . " IN CLASS >>>> " . __CLASS__);
            myLog("RUNNING " . ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/PIA.apk");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/PIA.apk");
        }
        sleep(5);
        if ($this->_checkLoginPia()) {
            return false;
        }
        $tryCount = 0;
        myLog("OPENING THE LOGIN PIA ACTIVITY");
        do {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.presentation.features.engagement.EngagementActivity");
            $tryCount++;
        } while ($this->getCurrentActivity() != 'com.ixolit.ipvanish/.presentation.features.engagement.EngagementActivity' && $tryCount <= 5);
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/engagement_login_button");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/login_username_edit_text");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
            $this->writeText($username);
            $this->pressBack();
        }
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/login_password_edit_text");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
            $this->writeText($password);
            $this->pressBack();
        }
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/login_button");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
        }
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/tutorial_begin_skip_button");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
        }
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->searchStringInDumpScreen("Connection request")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("OK");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
        }
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/main_bottom_navigation_settings");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
        }
        $this->swipe(480, 1500, 480, 200, 500);
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Connect on Android Startup");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
        }
    }

    public function searchForFile($fileName)
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell find ' . $fileName . ' 2>&1 &';
        $badString = "find:";
        $tryCounter = 0;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        do {
            usleep(200000);
            $result = shell_exec($cmd);
            $returnValue = substr_count($result, $badString) == 0;
            $tryCounter++;
        } while (!$returnValue && $tryCounter < 10);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ' . ' >>> ' . $returnValue);
        unset($cmd, $fileName, $badString, $result, $tryCounter);
        return $returnValue;
    }

    //Connect IP VANISH (PIA) and Set it Always on VPN
    public function ConnectPIA($vpn_region)
    {
        myLog("RUNNING >>>>" . __FUNCTION__ . " IN CLASS >>>> " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -r  " . dirname(__DIR__) . "/apk/PIA.apk");
        sleep(5);
        $piaVersion = $this->getApplicationVersion('com.ixolit.ipvanish');
        if ($piaVersion == 3) {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.activity.ActivityMain");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 100 170");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 350 930");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 820 160");
            sleep(5);
            if ($vpn_region != 'Unknown') {
                $random_vpn_region = getPiaRandomRegion($vpn_region);
                if ($random_vpn_region == false) {
                    $random_vpn_region = $vpn_region;
                }
            } else {
                $random_vpn_region = 'USA';
            }
            //$random_vpn_region = str_replace(" ", "\ ",$random_vpn_region);
            //exec(ADB." -s emulator-" . $this->emulatorPort . " shell input text ".$random_vpn_region);
            $this->pythonUI->type($random_vpn_region);
            sleep(10);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 500 370");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 820 1070");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 870 1520");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.ixolit.ipvanish");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
            return $random_vpn_region;
        } else {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.presentation.features.main.MainActivity");
            sleep(5);
            $this->dumpScreenToFile();
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/main_bottom_navigation_locations");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
            if ($vpn_region == 'Taiwan') {
                list($random_vpn_region, $regionId) = getRandom5SimCountry('PIA');
            }
            if ($vpn_region != 'Unknown') {
                $random_vpn_region = getPiaRandomRegion($vpn_region);
                if ($random_vpn_region == false) {
                    $random_vpn_region = $vpn_region;
                }
            } else {
                $random_vpn_region = 'USA';
            }
            sleep(5);
            $this->dumpScreenToFile();
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/locations_search_button");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
            $this->pythonUI->type($random_vpn_region);
            sleep(2);
            $this->click(500, 500);
            sleep(5);
            $this->dumpScreenToFile();
            if ($this->searchStringInDumpScreen("Would you like to connect to")) {
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("CONNECT");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    sleep(2);
                }
            }
            $tryCounter = 0;
            do {
                sleep(5);
                $this->dumpScreenToFile();
                $tryCounter++;
            } while (!$this->searchStringInDumpScreen('text="Connected" resource-id="com.ixolit.ipvanish:id/connection_status_text_view"') && $tryCounter < 10);
        }
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.ixolit.ipvanish");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        return $random_vpn_region;
    }

    //Connect HotSpot and Set it Always on VPN
    public function ConnectHotSpot($vpn_region)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n hotspotshield.android.vpn/com.anchorfree.hotspotshield.ui.HssActivity");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 900 880");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 1000 165");
        sleep(5);
        if ($vpn_region != 'Unknown') {
            $random_vpn_region = getHotSpotRandomRegion($vpn_region);
        } else {
            $random_vpn_region = 'USA';
        }
        $this->pythonUI->type($random_vpn_region);
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 400 400");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 500 750");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app hotspotshield.android.vpn");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        unset($vpn_region);
        return $random_vpn_region;
    }

    //Connect Strong and Set it Always on VPN
    public function ConnectStrong($vpn_region)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.strongvpn/.app.presentation.features.connect.MainActivity");
        sleep(5);
        $regionVPN = null;
        $regionArr = null;
        while (!$this->pythonUI->exists(IMG . 'StrongVpnDisconnected.png', null, 5)) {
            $this->pythonUI->findAndClick(IMG . 'StrongVpnConnected.png', null, 5);
        }

        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 500 550");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 830 170");
        sleep(5);
        if ($vpn_region != 'Unknown') {
            $random_vpn_region = getStrongRandomRegion($vpn_region);
        } else {
            $random_vpn_region = 'USA';
        }
        //$random_vpn_region = str_replace(" ", "\ ",$random_vpn_region);
        //exec(ADB." -s emulator-" . $this->emulatorPort . " shell input text ".$random_vpn_region);
        $this->pythonUI->type($random_vpn_region);
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 550 350");
        sleep(10);
        $regionVPN = null;
        $this->pythonUI->findAndClick(IMG . 'StrongVpnDisconnected.png', null, 30);
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.strongvpn");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        unset($regionVPN, $regionArr);
        return $random_vpn_region;
    }

    //Connect Strong and Set it Always on VPN
    public function ConnectPureVpn($vpn_region)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.gaditek.purevpnics/.main.dashboard.DashboardActivity");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 1020 350");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 990 160");
        sleep(5);
        if ($vpn_region != 'Unknown') {
            $random_vpn_region = getPureVpnRandomRegion($vpn_region);
        } else {
            $random_vpn_region = 'USA';
        }
        $this->pythonUI->type($random_vpn_region);
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 420 700");
        sleep(10);
        // Wait VPN to be connected
        while (!$this->pythonUI->exists(IMG . 'PureVpnConnected.png', null, 5)) {
        }
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        sleep(5);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.gaditek.purevpnics");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        unset($vpn_region);
        return $random_vpn_region;
    }

    //Connect WireGuard and Set it Always on VPN
    public function ConnectWireGuard($android_ver, $installType, $nav_download_folder = true)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $regionClose = null;
        myLog('install wireguard');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " install -g  " . dirname(__DIR__) . "/apk/wireguard.apk");
        sleep(10);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.wireguard.android/.activity.MainActivity");
        sleep(5);
        myLog("Add new Config file Button");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 930 1600");
        sleep(5);
        myLog("Import Config file");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 566 1301");
        sleep(5);
        if ($nav_download_folder) {
            myLog("Open Download Folder");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 122 189");
            sleep(5);
            if ($android_ver === "29") {
                if ($installType == 'Old') {
                    if ($this->pythonUI->findAndClick(IMG . 'AndroidDownload.png', null, 2)) {
                    } else {
                        if ($this->pythonUI->findAndClick(IMG . 'AndroidDownloadActive.png', null, 2)) {
                        }
                    }
                } else {
                    if ($this->pythonUI->findAndClick(IMG . 'AndroidDownload.png', null, 2)) {
                    } else {
                        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 500 750");
                    }
                }
            } else {
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 339 563");
            }
            sleep(5);
        }
        if ($android_ver === "27") {
            myLog("Chosing the Config file");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 363 636");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 910 380");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 870 1515");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.android.settings/com.android.settings.Settings");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 270 195");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text VPN");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 340 430");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 390 1480");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 969 410");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 914 650");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 902 1009");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 800 1227");
        } elseif ($android_ver === "29" || $android_ver === "30") {
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input press 300 1100");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input press 300 1100");
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 910 380");
            if (!$this->pythonUI->findAndClick(IMG . 'WireGuardConnected.png', null, 5)) {
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 910 380");
            }
            sleep(5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 870 1515");
        }
        sleep(5);
        myLog("Settings Add for Android");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_app com.wireguard.android");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell settings put secure always_on_vpn_lockdown 1");
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
        unset($android_ver, $installType, $nav_download_folder);
    }

    public function fixUnableToConnect()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>'); /*
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        switch ($vpn_provider) {
        case "ExpressVPN":
        case "com.expressvpn.vpn":
        $this->ConnectExpressVPN();
        break;
        case "Surfshark":
        case "com.surfshark.vpnclient.android":
        $this->ConnectSurfShark();
        break;
        case "PIA":
        case "com.ixolit.ipvanish":
        $this->ConnectPIA();
        break;
        case "HotSpot":
        case "hotspotshield.android.vpn":
        $this->ConnectHotSpot();
        break;
        case "Strong":
        case "com.strongvpn":
        $this->ConnectStrong();
        break;
        case "PureVpn":
        case "com.gaditek.purevpnics":
        $this->ConnectPureVpn();
        break;
        }

        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
         */
        $this->closeKeyBoard();
        $this->closeKeyBoard(); 
        $name = get_random_name();
        myLog('name is :' . $name);
        $this->putAVDInFocus();
        $this->pythonUI->click(IMG . 'wa_your_name.png');
        $this->pythonUI->click(IMG . 'wa_your_name.png');

        //Modify Name
        $name = str_replace('\ ', ' ', $name);
        // Write Name Slowly
        $loopIterations = strlen($name);
        for ($loop = 0; $loop < $loopIterations; $loop++) {
            $this->pythonUI->type($name[$loop]);
            $sleepDuration = rand(500000, 2000000);
            usleep($sleepDuration);
        }
        $this->pythonUI->keyDown('Key.ENTER');
        $this->pythonUI->keyDown('Key.ENTER');
        $this->pythonUI->findAndClick(IMG . "gb_next_2.png", null, 5);
        $this->dumpScreenToFile();
        $tryCount2 = 0;
        do {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Next");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
            $tryCount2++;
        } while ($tryCount2  <= 5);
        while ($this->pythonUI->exists(IMG . 'wa_init.png', null, 2)) {
        }
        if ($this->pythonUI->exists(IMG . 'WhatsappUnableToConnect.png', null, 5)) {
            myLog("found whatsapp Unable to Connect ");
            return false;
        }
        if ($this->pythonUI->findAndClick(IMG . 'wa_close.png', null, 2)) {
        }
        if ($this->pythonUI->exists(IMG . 'gb_opened.png', null, 5)) {
            $this->add_profile_pic();
            sleep(3);
            // $simProvider->sendActivatedSignal();
            $this->reporter->setSabyEmulatorState("ACTIVATED", 'NULL');
            //setSabyActivationRecord($simProvider->getRequestDetail("ACTIVATED", $androidID));
            $this->reporter->addSabyActivationDetails('Status', 'ACTIVATED');
            $activationDate = date('Y-m-d H:i:s');
            //$transporter->setFreshActivationDateTime($activationDate, $VPN_REGION, $VPN_PROVIDER, $phoneNumber, $ACTIVATION_TYPE);
            $this->reporter->setSabyEmulatorActivationInfo('activation_date', $activationDate);
            //Add Activation Done Log
            $this->reporter->AnalysisLogsExtra('Act', null);
            if ($this->isWhatsappSpamAccount()) {
                $this->reporter->setSabyEmulatorState('ACTIVATION FAILED', 'SPAM ACCOUNT');
                exit();
            }
            $this->turnOffDownloadImage();
            $this->turnOffTextSuggestion();
            //startSaby($sipExt, $vpn_region, $vpn_provider);
            //$transporter->ServerSabyCheckOutState('ACTIVATING');
            $this->reporter->SabyEmulatorSignal('ACTIVATION COMPLETED', 'KILL');
            // saby daily limit to 2 Calls
            $this->reporter->sabyDetail('set', '2');
            sleep(3);
            $this->reporter->sabyDetail('set', '2');
            $resultOfBackUpAvd = shell_exec("/home/" . get_current_user() . "/7eet-saby-whatsapp-ubuntu20/scripts/backupFileAfterActivation.sh " . $this->EMULATOR_ID);
            myLog("THE RESULT OF BACKUP AVD " . $resultOfBackUpAvd);
            $this->reporter->switchSabyToRecieverMode();
            exit();
        }

        unset($loop, $name, $loopIterations, $sleepDuration);
        return true;
    }

    public function ConfirmNewWhatsappTerms()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        if ($this->pythonUI->exists(IMG . 'WhatsappNewTerms.png', null, 10)) {
            if ($this->pythonUI->findAndClick(IMG . 'NewTermsNext.png', null, 30)) {
            }
            if ($this->pythonUI->findAndClick(IMG . 'Confrim16.png', null, 30)) {
            }
            if ($this->pythonUI->findAndClick(IMG . 'WhastappTermsAgree.png', null, 30)) {
            }
        }
        unset($regionNext, $regionArr, $regionAgree, $regionOverAge);
    }
    public function twoStepVarifications()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        return ($this->pythonUI->exists(IMG . 'WhatsappTwoStepVarifications.png', null, 2));
    }
    public function WhatsappUnableToConnect()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        return ($this->pythonUI->exists(IMG . 'WhatsappUnableToConnect.png', null, 5));
    }
    public function temporarily1hour()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        return ($this->pythonUI->exists(IMG . 'wa_temporarily_1hour.png', null, 5));
    }

    public function startCallRecord()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell screenrecord /mnt/sdcard/video.mp4 > ~/rec.log 2>&1 &");
    }

    public function stopCallRecord()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell 'pkill -2 screenrecord'");
        sleep(5);
    }

    public function uploadCallRecord($ENV_IP, $caller, $callId, $callee)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $current_user = get_current_user();
        $baseFileName = $this->sabyFullName . '^^' . $caller . "_" . $callee . "_" . $callId . ".mp4";
        exec(ADB . " -s emulator-" . $this->emulatorPort . " pull /mnt/sdcard/video.mp4 ~/Downloads/" . $baseFileName);
        exec('curl -F "videoFile=@/home/' . $current_user . '/Downloads/' . $baseFileName . '" http://' . $ENV_IP . '/MapleVoipFilter/api/uploadVideo.php');
        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell rm /mnt/sdcard/video.mp4");
        exec("rm -rf ~/Downloads/*.mp4");
        unset($caller, $callId, $callee, $baseFileName, $current_user);
    }

    public function updateTermsPrivacyPolicy()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        if ($this->pythonUI->exists(IMG . 'WhatsappUpdatingTerms.png', null, 5)) {
            $this->pythonUI->findAndClick(IMG . 'WhatsappUpdatingTermsContinue.png', null, 5);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input tap 540 1630");
            $this->pythonUI->findAndClick(IMG . 'WhatsappUpdatingTermsAccept.png', null, 5);
        }
    }

    public function resetEmultorPort($newEmultorPort)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $this->emulatorPort = $newEmultorPort;
        unset($newEmultorPort);
    }

    public function updateEmulatorDetails($sabyFullName, $RUNNING_EMULATOR_PORT)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $this->emulatorPort = $RUNNING_EMULATOR_PORT;
        $this->sabyFullName = $sabyFullName;
        unset($sabyFullName, $RUNNING_EMULATOR_PORT);
    }

    public function updateSipResponses($newSipResponses)
    {
        myLog("Running " . __FUNCTION__ . " --> ");
        for ($loop = 0; $loop < count($newSipResponses); $loop++) {
            $caseName = $newSipResponses[$loop]->{'case_name'};
            $caseValue = $newSipResponses[$loop]->{'sip_code'};
            if ($GLOBALS['SIP_RESPONSES'][$caseName] != $caseValue) {
                $GLOBALS['SIP_RESPONSES'][$caseName] = $caseValue;
            }
        }
        unset($newSipResponses, $loop);
    }

    public function getWireGuardEndPointIp()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.wireguard.android");
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.wireguard.android");
        sleep(1);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.wireguard.android/.activity.MainActivity");
        if ($this->pythonUI->exists(IMG . 'WireGuardConnected.png', null, 30)) {
            $this->click(506, 399);
            sleep(1);
            $this->click(506, 399);
            sleep(2);
            $this->swipe(550, 1460, 550, 280, 500);
            $screenDump = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell uiautomator dump && ~/Android/Sdk/platform-tools/adb -s emulator-" . $this->emulatorPort . " shell cat /sdcard/window_dump.xml");
            $keyWord = ":51"; // as the Identify the row of the ip in the dumpscreen
            $keyWordPositions = strpos($screenDump, $keyWord); // to get the index of the $keyWord in the dump screen
            $endPointPort = substr($screenDump, $keyWordPositions + 1, 5); //To get the port number from dump
            $safeOffset = $keyWordPositions - 17; // to get the 1st index of the ip Address
            $targetArea = substr($screenDump, $safeOffset, strlen($keyWord) + 17); // to get the target the string in dumpscreen
            $endPointIpstart = strpos($targetArea, '="') + strlen('="');
            // end point is the $targetArea after filter the result
            $endPointIp = substr($targetArea, $endPointIpstart, strpos($targetArea, $keyWord) - $endPointIpstart);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_HOME");
            return array($endPointIp, $endPointPort);
        }
    }

    public function fixPIAReagon($ENV_IP)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        sleep(5);
        $this->browseWeb('http://' . $ENV_IP . '/MapleVoipFilter/apiManager/getvpnLocationByApi/' . $this->sabyFullName);
        $this->browseWeb('http://' . $ENV_IP . '/MapleVoipFilter/apiManager/getvpnLocationByApi/' . $this->sabyFullName);
        sleep(5);
    }

    public function closeRunningApp()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>>');
        $needleString = ''; //string for the clear all button because it's differante between the android version
        $verficationString = ''; //for check it the press appswitch opration sccusses done
        $needleResult = false; // the result of checking the if thay are founded the needleString
        switch ($this->androidVersion) {
            case '30':
            case '31':
                $needleString = "Clear all";
                $verficationString = "Screenshot";
                $clearAppButtonId = "com.google.android.apps.nexuslauncher:id/clear_all";
                break;
            default:
                $needleString = "CLEAR ALL";
                $verficationString = "com.android.launcher3:id/snapshot";
                $clearAppButtonId = 'com.android.launcher3:id/clear_all';
                break;
        }
        $tryCounter = 0;

        do {
            $this->pressAppSwitch();
            $this->dumpScreenToFile();
            $tryCounter++;
        } while (!$this->searchStringInDumpScreen($verficationString) && $tryCounter < 3);

        if ($tryCounter >= 3) {
            return false;
        }
        $tryCounter = 0;
        do {
            $this->dumpScreenToFile();
            $needleResult = $this->searchStringInDumpScreen($needleString);
            if ($needleResult) {
                break;
            }
            myLog("SEARCHING ABOUT THE CLEAR ALL BUTTON");
            $this->swipe(300, 900, 1200, 900, 500);
            if ($tryCounter >= 10) {
                $needleResult = false;
                break;
            }
            $tryCounter++;
        } while (!$needleResult && $this->searchStringInDumpScreen($verficationString));
        sleep(2);
        $this->dumpScreenToFile();
        if ($needleResult) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId($clearAppButtonId);
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
            $this->pressBack();
            return true;
        } else {
            return false;
        }
    }

    public function searchStringInDumpScreen($string)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $xmlFile = file_get_contents($this->dumpScreenFile);
        if (substr_count($xmlFile, $string) > 0) {
            // Found
            $returnValue = true;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ' . $string);
        } else {
            // Found
            $returnValue = false;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ' . $string);
        }
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ' . $string . ' >>> ' . $returnValue);
        unset($xmlFile, $string);
        return $returnValue;
    }

    public function SearchCoordinatesByString($string)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $cmd = "perl -ne '" . 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /text="' . $string . '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' . "' " . $this->dumpScreenFile;
        $coordinates = shell_exec($cmd);
        if (substr_count($coordinates, " ") > 0) {
            $coordinates = str_replace("\n", "", str_replace("\r", "", $coordinates));
            list($xCoordinate, $yCoordinate) = explode(" ", $coordinates);
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ' . $string);
        } else {
            $xCoordinate = 0;
            $yCoordinate = 0;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ' . $string);
        }
        unset($cmd, $coordinates, $string);
        return array($xCoordinate, $yCoordinate);
    }

    public function pressBack()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input keyevent KEYCODE_BACK';
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd);
    }

    public function SearchCoordinatesByResourceId($string)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $string = str_replace("/", "\/", $string);
        $cmd = "perl -ne '" . 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /resource-id="' . $string . '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' . "' " . $this->dumpScreenFile;
        $this->_doLog('Entering ' . __FUNCTION__ . ' >>> ');
        $this->_doLog('Executing ' . __FUNCTION__ . ' >>> ' . $cmd);
        $coordinates = shell_exec($cmd);
        if (substr_count($coordinates, " ") > 0) {
            $coordinates = str_replace("\n", "", str_replace("\r", "", $coordinates));
            list($xCoordinate, $yCoordinate) = explode(" ", $coordinates);
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ' . $string);
        } else {
            $xCoordinate = 0;
            $yCoordinate = 0;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ' . $string);
        }
        unset($cmd, $coordinates, $string);
        return array($xCoordinate, $yCoordinate);
    }

    public function getCurrentActivity()
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell dumpsys activity activities | grep "mResumedActivity" | awk ' . "'{print $4}'";
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        $returnValue = shell_exec($cmd);
        $returnValue = str_replace("\n", "", str_replace("\r", "", $returnValue));
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ' . ' >>> ' . $returnValue);
        unset($cmd);
        return $returnValue;
    }

    public function pressAppSwitch()
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell input keyevent KEYCODE_APP_SWITCH';
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd);
    }

    public function SearchCoordinatesByClass($string)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $string = str_replace("/", "\/", $string);
        $cmd = "perl -ne '" . 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /class="' . $string . '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' . "' " . $this->dumpScreenFile;
        $coordinates = shell_exec($cmd);
        if (substr_count($coordinates, " ") > 0) {
            $coordinates = str_replace("\n", "", str_replace("\r", "", $coordinates));
            list($xCoordinate, $yCoordinate) = explode(" ", $coordinates);
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ' . $string);
        } else {
            $xCoordinate = 0;
            $yCoordinate = 0;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ' . $string);
        }
        unset($cmd, $coordinates, $string);
        return array($xCoordinate, $yCoordinate);
    }

    public function SearchCoordinatesByCheckBoxStatus()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $cmd = "perl -ne '" . 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /checked="true"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' . "' " . $this->dumpScreenFile;
        $coordinates = shell_exec($cmd);
        if (substr_count($coordinates, " ") > 0) {
            $coordinates = str_replace("\n", "", str_replace("\r", "", $coordinates));
            list($xCoordinate, $yCoordinate) = explode(" ", $coordinates);
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ');
        } else {
            $xCoordinate = 0;
            $yCoordinate = 0;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ');
        }
        unset($cmd, $coordinates);
        return array($xCoordinate, $yCoordinate);
    }

    public function SearchCoordinatesByContentDesciption($string)
    {
        $string = str_replace("/", "\/", $string);
        $cmd = "perl -ne '" . 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /content-desc="' . $string . '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' . "' " . $this->dumpScreenFile;
        $coordinates = shell_exec($cmd);
        if (substr_count($coordinates, " ") > 0) {
            $coordinates = str_replace("\n", "", str_replace("\r", "", $coordinates));
            list($xCoordinate, $yCoordinate) = explode(" ", $coordinates);
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Find ' . $string);
        } else {
            $xCoordinate = 0;
            $yCoordinate = 0;
            $this->_doLog('Result ' . __FUNCTION__ . ' >>> Didnt Find ' . $string);
        }
        unset($cmd, $coordinates, $string);
        return array($xCoordinate, $yCoordinate);
    }
    public function turnOffAddSabyToGroups()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
        sleep(3);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByContentDesciption("More options");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Settings");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Privacy");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }

        sleep(2);
        $this->swipe(500, 1450, 500, 300, 750);
        sleep(2);
        $this->swipe(500, 1450, 500, 300, 750);
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Groups");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("My contacts");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        } else {
            sleep(2);
            $this->dumpScreenToFile();
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/my_contacts_button");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }

        $this->_doLog('DONE ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        sleep(10);
    }
    public function turnOffDownloadImage()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
        sleep(3);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByContentDesciption("More options");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Settings");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->swipe(500, 1450, 500, 300, 750);
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Storage and data");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->swipe(500, 1450, 500, 300, 750);
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/setting_autodownload_cellular");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        do {

            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByCheckBoxStatus();
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            } else {
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("OK");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                }
                break;
            }
            sleep(1);
            $this->dumpScreenToFile();
        } while (true);
        $this->dumpScreenToFile();
        sleep(3);
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/setting_autodownload_wifi");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }

        sleep(2);
        $this->dumpScreenToFile();

        do {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByCheckBoxStatus();
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            } else {
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("OK");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                }
                break;
            }
            sleep(1);
            $this->dumpScreenToFile();
        } while (true);

        sleep(2);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
    }

    public function getApplicationVersion($packageName)
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys package " . $packageName . " | grep versionName";
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        $versionValue = shell_exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        $versionValue = trim($versionValue);
        $string = str_replace('versionName=', '', $versionValue);
        return $string;
    }

    #check the type of incomming Whatsapp Call
    #0/false for voise call
    #1/true for video call
    public function detectIncommingCallType()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $cmdCommand = ADB . ' -s emulator-' . $this->emulatorPort . ' shell dumpsys activity activities | grep \'label="Video Call"\' | wc -l';
        $returnValue = shell_exec($cmdCommand);
        $returnValue = trim($returnValue);
        return $returnValue;
    }

    public function isWhatsappSpamAccount()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $tryCount = 0;
        do {
            $currentScreenActivity = shell_exec(ADB . ' -s emulator-' . $this->emulatorPort . ' shell dumpsys activity activities | grep "mResumedActivity"');
            $isWhatsappActivity = substr_count($currentScreenActivity, 'com.whatsapp') > 0;
            if (!$isWhatsappActivity) {
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
            }
            $tryCount++;
        } while ($tryCount <= 5);
        $onscreen = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell uiautomator dump && " . ADB . " -s emulator-" . $this->emulatorPort . " shell cat /sdcard/window_dump.xml");
        $result = substr_count($onscreen, "This account is not allowed to use WhatsApp due to spam") > 0 || substr_count($onscreen, "This account is not allowed to use WhatsApp") > 0;
        return $result;
    }

    public function _checkSettingStatus($settingName)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $screenDump = file_get_contents($this->dumpScreenFile);
        $startStringPosition = strpos($screenDump, "text=\"" . $settingName . '"');
        $neededString = substr($screenDump, $startStringPosition - 6, 1750);
        if (substr_count($neededString, 'checked="true"') > 0) {
            $returnValue = true;
        } else {
            $returnValue = false;
        }
        unset($screenDump, $startStringPosition, $neededString);
        return $returnValue;
    }

    public function setSabySpamAccountDetails($apiManager, $sabyPhoneNumber, $sabyStatus)
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $requestedURL = $apiManager . '/setSpamAccountDetails/' . $this->sabyFullName . '/' . $sabyPhoneNumber . '/' . str_replace(' ', '_', $sabyStatus);
        myLog("THE URL REQUESTED IN " . __FUNCTION__ . " IN CLASS " . __CLASS__ . " >>>> " . $requestedURL);
        $this->browseWeb($requestedURL);
        $this->browseWeb($requestedURL);
    }

    public function turnOffTextSuggestion()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.android.inputmethod.latin/.settings.SettingsActivity";
        $tryCount = 0;
        do {
            exec($cmd);
            $currentScreenActivity = shell_exec(ADB . ' -s emulator-' . $this->emulatorPort . ' shell dumpsys activity activities | grep "mResumedActivity"');
            $isWhatsappActivity = substr_count($currentScreenActivity, 'com.android.inputmethod.latin') > 0;
            if ($isWhatsappActivity) {
                break;
            }
        } while ($tryCount <= 5);
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Gesture Typing");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->_checkSettingStatus("Enable gesture typing")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Enable gesture typing");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(5);
        $this->pressBack();
        sleep(2);
        $tryCount = 0;
        do {
            exec($cmd);
            $currentScreenActivity = shell_exec(ADB . ' -s emulator-' . $this->emulatorPort . ' shell dumpsys activity activities | grep "mResumedActivity"');
            $isWhatsappActivity = substr_count($currentScreenActivity, 'com.android.inputmethod.latin') > 0;
            if ($isWhatsappActivity) {
                break;
            }
        } while ($tryCount <= 5);

        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Text correction");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->_checkSettingStatus("Block offensive words")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Block offensive words");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(5);
        $this->dumpScreenToFile();

        if ($this->_checkSettingStatus("Auto-correction")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Auto-correction");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->_checkSettingStatus("Show correction suggestions")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Show correction suggestions");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(5);
        $this->swipe(450, 1725, 450, 400, 1000);
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->_checkSettingStatus("Personalized suggestions")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Personalized suggestions");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }
        sleep(5);
        $this->dumpScreenToFile();
        if ($this->_checkSettingStatus("Next-word suggestions")) {
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Next-word suggestions");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
        }

        $this->pressBack();
        $this->pressBack();
    }

    public function emptyCountryCodeFiled()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/registration_cc");
        list($xCoordinate2, $yCoordinate2) = $this->SearchCoordinatesByString("+");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_MOVE_END");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            myLog(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            return array($xCoordinate, $yCoordinate);
        } elseif ($xCoordinate2 > 0 && $yCoordinate2 > 0) {
            $this->click($xCoordinate2, $yCoordinate2);
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_MOVE_END");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_BACK");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            return array($xCoordinate2, $yCoordinate2);
        }
    }

    public function checkPIAAutoStart()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.ixolit.ipvanish/.presentation.features.main.MainActivity");
        sleep(5);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.ixolit.ipvanish:id/main_bottom_navigation_settings");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
            sleep(2);
        }
        $this->swipe(550, 1500, 550, 500, 1000);
        $onscreen = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell uiautomator dump && " . ADB . " -s emulator-" . $this->emulatorPort . " shell cat /sdcard/window_dump.xml");
        if (!empty($onscreen)) {
            $String = get_between_data($onscreen, "Connect on Android Startup", "</hierarchy>");
            if (substr_count($String, 'text="OFF" resource-id="com.ixolit.ipvanish:id/switchWidget"')) {
                $this->dumpScreenToFile();
                list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Connect on Android Startup");
                if ($xCoordinate > 0 && $yCoordinate > 0) {
                    $this->click($xCoordinate, $yCoordinate);
                    sleep(2);
                }
            }
        }
    }

    public function pushFile($sourceFile, $targetFile)
    {
        $cmd =  ADB . " -s emulator-" . $this->emulatorPort . ' push ' . $sourceFile . ' ' . $targetFile;
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        exec($cmd);
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd, $sourceFile, $targetFile);
    }

    public function getWireguradConfigFileName()
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . ' shell ls "/data/data/com.wireguard.android/files"';
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        $targetFile = trim(shell_exec($cmd));
        myLog("THE TARGET FILE NAME IS " . $targetFile);
        return $targetFile;
    }

    public function checkActivationOneHour()
    {
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> IN ' . __CLASS__);
        $this->dumpScreenToFile();
        $onscreen = shell_exec(ADB . " -s emulator-" . $this->emulatorPort . " shell uiautomator dump && " . ADB . " -s emulator-" . $this->emulatorPort . " shell cat /sdcard/window_dump.xml");
        if (substr_count($onscreen, 'try again in 1 hour.') > 0) {
            myLog("THE RESULT OF " . __FUNCTION__ . " >>>>> " . __CLASS__ . " >>> TRUE");
            return true;
        }
        if (substr_count($onscreen, 'Please wait 1 hour') > 0) {
            myLog("THE RESULT OF " . __FUNCTION__ . " >>>>> " . __CLASS__ . " >>> TRUE");
            return true;
        }
        $this->dumpScreenToFile();
        if ($this->searchStringInDumpScreen("try again in 1 hour.")) {
            myLog("THE RESULT OF " . __FUNCTION__ . " >>>>> " . __CLASS__ . " >>> TRUE");
            return true;
        }

        myLog("THE RESULT OF " . __FUNCTION__ . " >>>>> " . __CLASS__ . " >>> FALSE");
        return false;
    }

    public function closeKeyBoard()
    {
        $cmd = ADB . " -s emulator-" . $this->emulatorPort . " shell dumpsys input_method | grep mInputShown | awk '{print $4}'";
        $badString = "mInputShown=true";
        $this->_doLog('Excuting ' . __FUNCTION__ . ' >>> ' . $cmd);
        $result = shell_exec($cmd);
        if (substr_count($result, $badString) > 0) {
            $this->pressBack();
        }
        $this->_doLog('Leaving ' . __FUNCTION__ . ' >>> ');
        unset($cmd, $result, $badString);
    }

    public  function changeWhatsappAboutStatus()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
        sleep(3);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByContentDesciption("More options");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(2);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Settings");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(1);
        do {
            $currentScreenActivity = shell_exec(ADB . ' -s emulator-' . $this->emulatorPort . ' shell dumpsys activity activities | grep "mResumedActivity"');
            $isWhatsappActivity = substr_count($currentScreenActivity, "com.whatsapp/.profile.ProfileInfoActivity") > 0;
            if (!$isWhatsappActivity) {
                exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.whatsapp/.profile.ProfileInfoActivity");
            } else
                break;
        } while (true);
        sleep(1);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("About");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }
        sleep(1);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/status_tv_edit_icon");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        }

        sleep(1);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
        sleep(1);
        $random_about = get_random_about();
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input text '" . $random_about . "'");
        sleep(1);
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("SAVE");
        if ($xCoordinate > 0 && $yCoordinate > 0) {
            $this->click($xCoordinate, $yCoordinate);
        } else {
            $this->dumpScreenToFile();
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByResourceId("com.whatsapp:id/save_button");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
        }
        unset($random_about);
    }
    public function ChangeAboutPy()
    {
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        sleep(3);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
        sleep(3);

        if ($this->pythonUI->findAndClick(IMG . 'wa_setting.png', null, 4)) {
            $this->dumpScreenToFile();
            sleep(2);
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Settings");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                $this->click($xCoordinate, $yCoordinate);
            }
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start  -n com.whatsapp/.profile.ProfileInfoActivity");
            sleep(2);
            $this->pythonUI->findAndClick(IMG . 'wa_about.png', null, 4);
            sleep(2);
            $this->pythonUI->findAndClick(IMG . 'wa_edit.png', null, 4);
            sleep(2);
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent KEYCODE_DEL");
            sleep(2);
            $random_about = get_random_about();
            sleep(2);
            $this->pythonUI->type($random_about);
            sleep(2);
            $this->pythonUI->findAndClick(IMG . 'wa_save.png', null, 4);
            unset($random_about);
        }
    }

    public function CheckExistTypeNameScreen(){
        $this->dumpScreenToFile();
        list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Type your name here");
        return ($xCoordinate > 0  && $yCoordinate > 0) ? 1:0;
    }


    public function type_name(){
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am force-stop com.whatsapp");
        sleep(1);
        exec(ADB . " -s emulator-" . $this->emulatorPort . " shell am start -n com.whatsapp/.Main");
        sleep(1);
        $tryCounter=0;
        do {
            $this->dumpScreenToFile();
            sleep(3);
            list($xCoordinate, $yCoordinate) = $this->SearchCoordinatesByString("Type your name here");
            if ($xCoordinate > 0 && $yCoordinate > 0) {
                myLog("----------------------------");
                myLog("I am click to type your name hear ");
                myLog("----------------------------");
                $this->click($xCoordinate, $yCoordinate);
                sleep(2);
            }
            $tryCounter++;
        } while ($tryCounter <= 5);
        if ($xCoordinate == 0 && $yCoordinate == 0) {
            sleep(2);
            $this->pythonUI->findAndClick(IMG . "type_your_name.png", null, 30);
        }
    }

    public function increaseVolumeToMax(){
        $counter=0;
        do{
            exec(ADB . " -s emulator-" . $this->emulatorPort . " shell input keyevent 24");
            $counter++;
        }while($counter < 10);
    }


    public function listen_to_sound_enter_code_active(){
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        myLog('this is  from listen_to_sound_enter_code');
        $this->putAVDInFocus();
        $res=shell_exec( "(timeout 8 parec --format=s16le --rate=44100 --channels=2 -d avd_to_app.monitor > output.raw && cat output.raw | pacat) & ". ADB . " -s emulator-" . $this->emulatorPort ." shell input tap 852 563");
        myLog('this is result '.$res);
        exec('ffmpeg -f s16le -ar 44100 -ac 2 -i output.raw -y ~/output.wav');
        myLog('save output.wav');
    }



    public function listen_to_sound_enter_code(){
        myLog('RUNNING >>> ' . __FUNCTION__ . " >>>>  IN " . __CLASS__);
        myLog('this is  from listen_to_sound_enter_code');
        $this->putAVDInFocus();
        $res=shell_exec("(timeout 8 parec --format=s16le --rate=44100 --channels=2 -d avd_to_app.monitor > output.raw && cat output.raw | pacat) & ".ADB . " -s emulator-" . $this->emulatorPort ." shell input tap 852 683");
        myLog('this is result '.$res);
        exec('ffmpeg -f s16le -ar 44100 -ac 2 -i output.raw -y ~/output.wav');
        myLog('save output.wav');
    }

}
