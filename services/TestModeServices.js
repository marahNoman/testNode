import { Checker } from "../helpers/Checker.js";
import { WhatsAppHelper } from "../helpers/WhatsApp.js";
import { BehaviourScript } from "../scripts/BehaviortScripts.js";
import { SabyInfoRepository } from "../Repository/SabyInfoRepo.js";
import { AVDScript } from "../scripts/avd_script.js";
import { SocketScript } from "../scripts/SocketScript.js";

export class TestModeServices {
    constructor() {
    }

    async StartTestMode(call, callback) {
        try {
            const checker = new Checker();
            const avdScript = new  AVDScript();
            const whatsappHelper = new WhatsAppHelper();
            let result = "";
            await checker.init();
            await whatsappHelper.init();
            await avdScript._getApiData();
            const socket = new SocketScript();
            const behaviourScript = new BehaviourScript(avdScript.getEmulatorPort());
            
            //#region Check VPM Connected
            var isVpnConnected = await checker.isVpnConnected();
            if (!isVpnConnected) {
                await new SabyInfoRepository().UpdateStatus("KILLED", null, "VPN NOT CONNECTED");
                result += 'VPN NOT CONNECTED, ';
            }
            //#endregion

            //#region Check Wifi & Internet Working
            var isWifiWorking = await checker.isWifiConnected();
            var isInternetWorking = await checker.isInternetWorking();
            if (!isInternetWorking) {
                await new SabyInfoRepository().UpdateStatus("KILLED", null, "NO INTERNET");
                result += 'Killed NO INTERNET, ';
            }
            //#endregion

            //#region Check Whatsapp Blocked
            var isBlocked = await whatsappHelper.IsWhatsappBlocked();
            if (isBlocked) {
                await new SabyInfoRepository().UpdateStatus("Killed Whatsapp Blocked", null);
                result += 'Killed Whatsapp Blocked, ';
            }
            //#endregion
            
            //#region Check Socket
            let enableSleep = await socket.CreateSocket();
            if (!enableSleep) {
                result += 'Socket Is Blocked';
            }
            //#endregion

            console.log(result);
            callback(null, {
                value: result,
            });
        } catch (error) {
            console.log("Error : ", error.message);
            callback(null, {
                value: error.message
            });
        }
    }
}