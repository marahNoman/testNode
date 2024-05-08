import {exec} from "child_process";
//import { setTimeout } from 'node:timers/promises';
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import os from 'os';
import {AVDScript} from "../scripts/avd_script.js";
import {Helper} from "./Helper.js";
import {Python} from "./Python.js";
const IMG = `images/`;

var user =os.userInfo().username;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;

export class Checker {
    emulatorPort    = null;
    emulatorName    = null;
    emulatorAlpha   = null;
    application     = null;
    androidID       = null;
    emulatorID      = null;
    automator       = null;
    vpnType         = null;
    asteriskHost    = null;
    _data           = null;
    emulatorBaseName= null;
 
    constructor() {
        
    }

   async init(){
     var response = await new SabyInfoRepository().GetCheckerConstructorData();
     console.log("checker response",response);
     this.emulatorPort =response[0];
     this.application =response[1];
     this.emulatorBaseName =response[3];
     this.emulatorID = response[4];
     this.emulatorAlpha =response[5];
     this.asteriskHost =response[6];
     this.emulatorName = response[3];
    }



    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

//#region AVD

     async rebootAVD(){
            console.log("in reboot");
             var avd_script = new AVDScript(false);
             await avd_script.avdStop();
             await avd_script.avdStart();
             console.log('wait 10 s');
            await this.delayFunc(10000);
     }
//#endregion

  
     // give permissions 
    async AdbStartupPermissions() {

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`)

        if (!await this._checkAVDIsBootCompleted()) {
           // myLog("AVD is not booted");
            return false;
        }
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put global heads_up_notifications_enabled 0");
      await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell content insert --uri content://settings/system --bind name:s:show_touches --bind value:i:1");
       await this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put system pointer_location 1");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put global window_animation_scale 0");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put global transition_animation_scale 0");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put global animator_duration_scale 0");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put system font_scale 1.3");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell settings put global wifi_on 1");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.READ_CONTACTS");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.WRITE_CONTACTS");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.GET_ACCOUNTS");
       await  this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.CALL_PHONE");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.READ_PHONE_STATE");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell pm grant com.android.contacts android.permission.READ_EXTERNAL_STORAGE");
       await   this.delayFunc(1000);
        exec(ADB + " -s emulator-" + this.emulatorPort + " shell wm density 540");
       await   this.delayFunc(1000);
        return true;

     }

   async _checkAVDIsBootCompleted() {

       const helper = new Helper();
       var fname=await helper.getFunctionName();
       console.log(`inside ${fname}`);

       let tryCountIsRoot=0;
        while (tryCountIsRoot < 2 )
        {
            console.log(`tryCountIsRoot : ${tryCountIsRoot}`)
            let isRoot = await this._checkAVDIsRoot();
            if(!isRoot){
              await  this.rebootAVD();
            }else{
                break;
            }
            tryCountIsRoot++
       }
       let isRoot = await this._checkAVDIsRoot();
       if(!isRoot){
           return  false;
        }
       console.log("->>>>>>>>>>>>> start wait-for-device ->>>>>>>>>>>>>>>")


       const wait = exec(ADB + " -s emulator-" + this.emulatorPort + " wait-for-device");
       await  new Promise((resolve,reject)=>{
             wait.on('close',(code)=>{
                 resolve();
             });
         });

       console.log("->>>>>>>>>>>>> wait-for-device ->>>>>>>>>>>>>>>")
        let tryingCount = 0;
        let boot_completed ="";
        do {
           const child = exec(ADB + " -s emulator-" + this.emulatorPort + " shell getprop sys.boot_completed");
          await  new Promise((resolve,reject)=>{
            child.stderr.on('data',(error)=>{
                console.log("error in -Class Checker- _checkAVDIsBootCompleted() => ",error);
                reject();
            });
            child.stdout.on('data', (data) => {
                boot_completed = data;
              }); 
              child.on('close',(code)=>{
                tryingCount++;
                resolve();
            });
           });
          console.log(`tryingCount for _checkAVDIsBootCompleted ${tryingCount}`)
            // await  this.delayFunc(2000);     
        } while (!(boot_completed.split("1").length > 1) && tryingCount < 2);
        let result = tryingCount < 2;
        if (result) {
            await this._checkAVDIsRoot();
        }
        let count=0;

       // $RUNNING_EMULATOR_WIDTH != '421' && $RUNNING_EMULATOR_HEIGHT != '720'
       // 414,727

       if (result === true) {
           let success = true;
           await this.checkResolution()
               .then(async ({ REAL_X1, REAL_Y1 }) => {
                   console.log('REAL_X1:', REAL_X1);
                   console.log('REAL_Y1:', REAL_Y1);
                   if ((REAL_X1 !== 414 && REAL_Y1 !== 727) && (REAL_X1 !== 411 && REAL_Y1 !== 720)) {
                       success = false;
                   }
               });

           if (!success) {
               let count = 0;
               while (count < 3) {
                   await this.delayFunc(2000);
                   if (await this.simulateCtrlArrowDown()) {
                       await this.delayFunc(2000);
                       await this.checkResolution()
                           .then(async ({ REAL_X1, REAL_Y1 }) => {
                               console.log(`REAL_X1_check this is WIDTH  ${REAL_X1}`);
                               if (REAL_X1 < 415) {
                                   console.log("Resolution Check Done");
                                   success = true; // Mark as successful if the resolution is fixed
                               }
                           });
                       if(success){
                           break;
                       }

                   } else {
                       console.log("problem in press ctrl + down to fix Resolution");
                       break;
                   }
                   count++;
               }
           }

           if (success) {
               console.log("Success!");
           } else {
               console.log("Failed after 3 attempts.");
           }
       }


       return result;
     }


    async CheckBlackScreen(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        exec(`${ADB} -s emulator-${this.emulatorPort} shell input keyevent KEYCODE_HOME`);


        const py = new Python();
        py.setDefaultRegion(70,27,727,414);
        var checkBlack= await py.exists(`${IMG}checkBlackScreen.png`,null,10);
        if(!checkBlack){
           return true;
            console.log("CheckGpuDriverWindow found");
        }
        return false;
    }


    async  simulateCtrlArrowDown() {
        let status = true;
        let Result=exec("xdotool key ctrl+Down")
        await new Promise((resolve,reject)=>{
            Result.stderr.on('data', error => {
                console.error("Error in simulateCtrlArrowDown:", error);
                status=false;
                reject(error);
            });

            Result.stdout.on('end', () => {
                resolve();
            });
        });
        return status;
    }

    async  checkResolution() {
        const cm = './commands/get_avd_port_name.sh';
        console.log(cm);
        const start = exec(cm);

        let REAL_X1, REAL_Y1;

        await new Promise((resolve, reject) => {
            start.stderr.on('data', error => {
                console.error("Error in checkResolution:", error);
            });

            start.stdout.on('data', data => {
                console.log(`Data from checkResolution: ${data}`);
                const [REAL_X1_str, REAL_Y1_str] = data.trim().split(',');
                REAL_X1 = parseFloat(REAL_X1_str);
                REAL_Y1 = parseFloat(REAL_Y1_str);
                resolve();
            });

            start.on('close', code => {
                console.log("Exited with code ", code);
                resolve();
            });
        });

        // Return REAL_X1 and REAL_Y1
        return { REAL_X1, REAL_Y1 };
    }

   async  _checkAVDIsRoot(){
        let isRoot = "";
        let tryingCount = 0;
        do {
            this.delayFunc(2000);
        var child = exec(ADB + " -s emulator-" + this.emulatorPort + " root");
         await new Promise((resolve, reject)=>{
            child.stderr.on('data',(error)=>{
                console.log("error in -Class Checker- _checkAVDIsRoot() => ",error);
               // reject();
               resolve();
               });
            child.stdout.on('data',(data)=>{
                isRoot = data;
            });
            child.on('close',(code)=>{
                resolve();
            });
          });
            tryingCount++;
        } while (!(isRoot.includes("adbd is already running as root")) && tryingCount < 5);
        return isRoot.includes("adbd is already running as root");
     }

      isUndefined(obj) {
        if (typeof obj == 'undefined')
            return true;
        return false;
    }
    async getVpnType(){
         let vpnTypes = ['com.surfshark.vpnclient.android', 'com.wireguard.android', 'com.expressvpn.vpn',
                        'com.ixolit.ipvanish', 'hotspotshield.android.vpn', 'com.strongvpn', 'com.gaditek.purevpnics'];
         let vpnFound ="";
         let vpnReturnValue ="";
         var i =0 ;
         while(i < vpnTypes.length){
            let temp ="";
            var exe = exec(ADB + " -s emulator-" + this.emulatorPort + " shell find /data/data/" + vpnTypes[i] + " 2>&1 &");
             exe.stdout.on('data',(data)=>{
                temp = data;
               });
             if(!temp.includes('No such file or directory')){
                vpnFound = temp;
                break;
             }
            await new Promise( (resolve, reject) => {
                exe.on('close',(code)=>{
                    i++;
                    resolve();
                 });
            });
         }
        this.vpnType = vpnFound;
        switch (this.vpnType) {
            case 'com.surfshark.vpnclient.android':
                vpnReturnValue = 'Surfshark';
                break;
            case 'com.wireguard.android':
                vpnReturnValue = 'WireGuard';
                break;
            case 'com.expressvpn.vpn':
                vpnReturnValue = 'ExpressVPN';
                break;
            case 'com.ixolit.ipvanish':
                vpnReturnValue = 'PIA';
                break;
            case 'hotspotshield.android.vpn':
                vpnReturnValue = 'HotSpot';
                break;
            case 'com.strongvpn':
                vpnReturnValue = 'Strong';
                break;
            case 'com.gaditek.purevpnics':
                vpnReturnValue = 'PureVpn';
                break;
            default:
                vpnReturnValue ="";   
        }
        return vpnReturnValue;
     }
     // check if whatsapp installed 
    async isAppInstalled(applcation){
        let isinstalled = false;
        if(this.application  == null || this.application == "" || typeof(this.application) == 'undefined'){
            this.application = "com.whatsapp";
        }
        let count=0;
        while (count < 8){
            console.log(`count try check check ${applcation} ${count}`);
            var packages = exec(`${ADB} -s emulator-${this.emulatorPort} shell pm list packages | grep ${applcation}`);
            packages.stdout.on('data',(data)=>{
                console.log(`data ${data}`)
                isinstalled = data.includes(applcation);
            });
            packages.stderr.on('data',(error)=>{
                console.log("Error  = ",error);
            });
            await new Promise( (resolve, reject) => {
                packages.on('close',(code)=>{
                    resolve();
                });
            });
            if(isinstalled){
                break;
            }
            count++;
        }

        return isinstalled;
     }

     async CheckGpuDriverWindow(){

         const helper = new Helper();
         var fname=await helper.getFunctionName();
         console.log(`inside ${fname}`);

         const py = new Python();
         py.setDefaultRegion(0,0,3000,3000);
         var GpuDriverPopUp= await py.exists(`${IMG}GpuDriver.png`,null,10);
         var GpuDriverPopUp2= await py.exists(`${IMG}GpuDriverInfoWidow.png`,null,10);
         if(GpuDriverPopUp || GpuDriverPopUp2){
             console.log("CheckGpuDriverWindow found");
             await py.findAndClick(`${IMG}NeverShowThisAgain.PNG`,null,5);
             await py.findAndClick(`${IMG}okGUIDRIVER.PNG`,null,5);
         }
         py.setDefaultRegion(70,27,727,414);
     }

     async isWireguardAppInstalled(){

        let isinstalled = false;
        var packages = exec(`${ADB} -s emulator-${this.emulatorPort}  shell pm list packages`);
        packages.stdout.on('data',(data)=>{
            isinstalled = data.includes(`wireguard`) || data.includes("com.wireguard.android");
        });       
        packages.stderr.on('data',(error)=>{
            console.log("Error in  isWireguardAppInstalled = ",error);
        });
        await new Promise( (resolve, reject) => {
            packages.on('close',(code)=>{
                resolve();
             });
        });
        return isinstalled;
     }
     
     async isWifiConnected(){

         const helper = new Helper();
         var fname=await helper.getFunctionName();
         console.log(`inside ${fname}`);

        var isConnected = false;
        var process = exec(`${ADB} -s emulator-${this.emulatorPort} shell dumpsys connectivity | grep "type: WIFI"`);
        await new Promise((resolve, reject) => {
            process.stderr.on('data',(error)=>{
                console.log("error in -Class Checker- isWifiConnected() => ",error);
                reject();
            });
            process.stdout.on('data',(data)=>{
                //console.log("-Class Checker- isWifiConnected() =>",data);
                if(data.includes("state: CONNECTED/CONNECTED")){
                    isConnected = true;
                }
            });
            process.on('close',(code)=>{
                resolve();
            });
        });
        return isConnected;
     }


     async isVpnConnected(){
         const helper = new Helper();
         var fname=await helper.getFunctionName();
         console.log(`inside ${fname}`);
         // check is install and is connected automation
         if(await this.isAppInstalled("com.wireguard.android")){

             var openWireGuard = exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -n com.wireguard.android/.activity.MainActivity`);
             await new Promise((resolve,reject)=>{
                 openWireGuard.on('close',(code)=>{
                     resolve();
                 })
             });

             const py = new Python();
             py.setDefaultRegion(70,27,727,414);
             if(await py.exists(`${IMG}wireGuardToggle.png`,null,10)){
                 await this.delayFunc(3000);
                 await py.findAndClick(`${IMG}wireGuardToggle.png`,null,6);
                 await this.delayFunc(3000);
                 await py.findAndClick(`${IMG}wireGuardOKBtn.png`,null,5);
                 await this.delayFunc(4000);
             }


         }else{
             return  false;
         }

         try{
             var isConnected = false;
             let count=0;
             while (count < 5){
                 await this.delayFunc(1000);
                 console.log(`try check vpn ${count}`)
                 var process = exec(`${ADB} -s emulator-${this.emulatorPort} shell dumpsys connectivity | grep "type: VPN"`);
                 console.log("wait promise get  data for vpn");
                 await new Promise((resolve, reject) => {
                     process.stderr.on('data',(error)=>{
                         console.log("error in -Class Checker- isVpnConnected() => ",error);
                         reject();
                     });
                     process.stdout.on('data',(data)=>{
                         console.log("get data for vpn");
                         if(data.includes("state: CONNECTED/CONNECTED")){
                             isConnected = true;
                         }
                     });
                     process.on('close',(code)=>{
                         console.log("done");
                         resolve();
                     });
                 });
                 if(isConnected){
                     break;
                 }
                 count++;
             }


             return isConnected;
         }catch(error){
             return false;
            console.log(`Error in VpnConnected : ${error}`);
        }
     }
     async CheckProxmox(){
        let isWorking=true;

         const predefinedIPs = [
             '65.21.233.12',
             '162.55.137.134',
             '135.181.183.250',
             '135.181.222.118',
             '135.181.209.39',
             '65.21.76.117',
             '65.108.123.53'
         ];

        let url= "http://cc-api.7eet.net/whatIsMyIp";
         exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop org.chromium.webview_shell`);
         exec(`${ADB} -s emulator-${this.emulatorPort} shell pm clear org.chromium.webview_shell`);
         var startWeb= exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -a android.intent.action.VIEW -d '${url}' `);
         await new Promise((resolve,reject) => {
             startWeb.on('close',(code)=>{
                 resolve();
             });
         });
         var process = exec(`${ADB} -s emulator-${this.emulatorPort} shell uiautomator dump && ${ADB} -s emulator-${this.emulatorPort} shell cat /sdcard/window_dump.xml`);
         await new Promise((resolve,reject)=>{
             process.stdout.on('data',(data)=>{

                 const extractedIP = data.toString().match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/); // Extract IP address from data
                 if (extractedIP) {
                     console.log(`extractedIP ---------------------------> ${extractedIP}`)
                     if(extractedIP[0]){
                         var ipAddress = extractedIP[0];
                         if (predefinedIPs.includes(ipAddress)) {
                             isWorking=false;
                         }
                     }
                 }




             });
             process.on('close',(code)=>{
                 exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop org.chromium.webview_shell`);
                 resolve();
             });
         });
         return isWorking;

     }

     async isInternetWorking(){

         const helper = new Helper();
         var fname=await helper.getFunctionName();
         console.log(`inside ${fname}`);

         try{
             let count=0;
             var isWorking = false;

             while (count < 7) {
                 await this.delayFunc(1000);
                 console.log(`count ${count}`);
                 let url = "http://google.com";
                 exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop org.chromium.webview_shell`);
                 console.log(`${ADB} -s emulator-${this.emulatorPort} shell am start -a android.intent.action.VIEW -d '${url}`);
                 var startWeb = exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -a android.intent.action.VIEW -d '${url}'`);
                 await new Promise((resolve, reject) => {
                     startWeb.on('close', (code) => {
                         resolve();
                     });
                 });
                 var process = exec(`${ADB} -s emulator-${this.emulatorPort} shell uiautomator dump && ${ADB} -s emulator-${this.emulatorPort} shell cat /sdcard/window_dump.xml`);
                 await new Promise((resolve, reject) => {
                     process.stdout.on('data', (data) => {
                         isWorking = !data.includes("Webpage not available");
                     });
                     process.on('close', (code) => {
                         exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop org.chromium.webview_shell`);
                         resolve();
                     });
                 });

                 if(isWorking){
                     break;
                 }
                 count++;
             }

         }catch(error){
             console.log(`Error in isInternetWorking : ${error}`);
         }

        return isWorking;
     }

     async isAppsReady(){
        try{
            console.log("--- inside checker isActivated function ---");

            var vpnConnected = await this.isVpnConnected();
            if(!vpnConnected){
                await new SabyInfoRepository().UpdateStatus("KILLED",null,"NO VPN");
                console.log("Checker class -> isActivated() => Vpn Not Connected.");
                return false;
            }

            var waInstalled = await this.isAppInstalled('com.whatsapp');
            if(!waInstalled){
                await new SabyInfoRepository().UpdateStatus("KILLED",null,"NO WHATSAPP");
                console.log("Checker class -> isActivated() => whatsapp Not Installed.");
                return false;
            }    
            
            return true;
        }catch(ex){
            console.log(`Error in checker class -> isActivated() => ${ex} `);
            return false;
        }
     }

     async checkCalleeImage(callee){
         const helper = new Helper();

         var fname=await helper.getFunctionName();
         console.log(`inside ${fname}`);

         let isHave=false;
         const Result = exec(ADB + " -s emulator-" + this.emulatorPort + ` shell find /data/data/com.whatsapp/files/Avatars/${callee}@s.whatsapp.net.j`);
         await new Promise((resolve,reject)=>{
             Result.stdout.on('data',(data)=>{
                 console.log(data);
                 isHave = !data.includes("find:");
             });
             Result.on('close',(code)=>{
                 console.log("checkCalleeImage Exited with code ",code);
                 resolve();
             });
         });
         return isHave;
     }

    async checkVoiceCallDialog(){
        let isHave = false;
        let command = ADB + " -s emulator-" + this.emulatorPort + ` shell cat data/data/com.whatsapp/shared_prefs/com.whatsapp_preferences_light.xml | grep -E 'name="call_confirmation_dialog_count"'| awk '{print $3}'`;
        const Result = exec(command);
        const processData = (data) => {
            console.log(`Result CallDialog ${data}`);
            if (data) {
                console.log("find value checkVoiceCallDialog");
                let number = data.match(/(\d+)/);
                if (number && number[1]) {
                    let parsedNumber = parseInt(number[1], 10);
                    isHave = parsedNumber < 5;
                }
            }else{
                console.log("not found value");
                isHave=true;
            }
        };

        await new Promise((resolve, reject) => {
            let buffer = '';

            Result.stdout.on('data', (data) => {
                buffer += data;
            });

            Result.stdout.on('end', () => {
                processData(buffer);
                resolve();
            });

            Result.stdout.on('error', (error) => {
                reject(error);
            });
        });


        return isHave;

    }

   async checkInComingSipCall(){
       const helper = new Helper();
       var fname=await helper.getFunctionName();
       console.log(`inside ${fname}`);
       let isHave=false;
       const Result = exec(`linphonecsh status hook`);
       await new Promise((resolve,reject)=>{
           Result.stdout.on('data',(data)=>{
               console.log(`result sip call ${data}`);
               isHave= data.includes("Incoming call from");
               resolve();
           });
           Result.stderr.on('data',(error)=>{
               console.log(`Error in checkInComingSipCall - : ${error}`);
               reject();
           });

           Result.stdout.on('end', () => {
               resolve();
           });

       });
       return isHave;
   }


    async checkSipInCall(){
        const helper = new Helper();

        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let isHave=false;
        const Result = exec(`linphonecsh generic calls`);
        await new Promise((resolve,reject)=>{
            Result.stdout.on('data',(data)=>{
                console.log(`result check sip  in call ${data}`);
               if(data.includes("sip") && data.includes("StreamsRunning")){
                   isHave=true;
               }
            });

            Result.stdout.on('end', () => {
                resolve();
            });

        });
        return isHave;
    }

  }
