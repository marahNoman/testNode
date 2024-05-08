import {exec} from "child_process";
import {Python} from './Python.js';
import os from 'os';
import fs from 'fs';
import fetch from "node-fetch";
import http  from'http';
import { AVDScript } from "../scripts/avd_script.js";
var user =os.userInfo().username;
var host = os.hostname();
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const IMG = `images/`;
export class VpnHelper{
    emulatorPort= null; 
    constructor(port){
        this.emulatorPort =port;
    }
    //TODO change the following Api to GRPC 
    async getConfigFile(alpha,countryId,apiRoute){

       var groupId = 2;

       console.log("getConfigFile () => ");
       //Hotspot /HTZ-hotspotvpnwg.php/getSabyHotspotvpnWgConfig/
       //Proton  /HTZ-protonvpnwg.php/getSabyprotonvpnWgConfig/
       //Xpress xpressvpnwg.php/getSabyXpressvpnWgConfig/
       if(apiRoute == null || typeof apiRoute == 'undefined' || apiRoute == ""){
        apiRoute = "xpressvpnwg.php/getSabyXpressvpnWgConfig/";
        }
        if(!apiRoute.includes("xpressvpnwg.php/")){
            groupId =1;
        }
        console.log(`http://cc-api.7eet.net/${apiRoute}${user}-${host}/${alpha}/${countryId}/${groupId}`);
        var apiResponse =await fetch(`http://cc-api.7eet.net/${apiRoute}${user}-${host}/${alpha}/${countryId}/${groupId}`);
        var response= await apiResponse.text();
        if(response.includes("ERROR")){
            console.log("getConfigFile Error \n ",response);
            return false;
        }

        console.log("remove old conf");
        exec(`rm -r /home/${user}/GB-${alpha}.conf`);
        await this.delayFunc(1000);
        console.log("add new conf");
        var path = `/home/${user}/GB-${alpha}.conf`;
        fs.writeFile(path, response, function (err) {
            if (err) throw err;
            console.log('saved!');
        });

         await this.delayFunc(3000);
         exec(`${ADB} -s emulator-${this.emulatorPort} shell rm -r  /data/data/com.wireguard.android/files/${user}-${host}-${alpha}.conf`);
         await this.delayFunc(1000);

         var pushFile= exec(`${ADB} -s emulator-${this.emulatorPort} push ~/GB-${alpha}.conf /data/data/com.wireguard.android/files/${user}-${host}-${alpha}.conf`);

         await new Promise((resolve,reject)=>{
            pushFile.stderr.on('data',err=>{
                console.log("Error in pushFile \n ",err);
            });
            pushFile.on('close',(code)=>{
                console.log("push success")
                resolve();
            })
        });

         return true;
    }

    async ConnectWireGuard(alpha,countryId,apiRoute){
        console.log("ConnectWireGuard () => ");
        let count=0;
        const script = new AVDScript(true);


        var gotFile =  await this.getConfigFile(alpha,countryId,apiRoute);
       if(!gotFile){
           console.log(`can't get config file from api`)
            return false;
       }
        await this.delayFunc(5000);
        var python = new Python();
        python.setDefaultRegion(70,27,727,414);
        var openWireGuard = exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -n com.wireguard.android/.activity.MainActivity`);
        await new Promise((resolve,reject)=>{
            openWireGuard.on('close',(code)=>{
                resolve();
            })
        });

        while (count < 10){
            await this.delayFunc(2000);
            await script.dumpScreenToFile();
            var searchStringUpdates= await script.SearchCoordinatesByString("WireGuard");
            if(searchStringUpdates[0]){
                break;
            }
            console.log(`search WireGuard is on screen try ${count}`)
            count++;
        }
        if(!searchStringUpdates[0]){
            return false;
        }
        // await this.delayFunc(3000);
        // await python.findAndClick(`${IMG}wireGuardAddNew.png`,null,9);
        // await this.delayFunc(3000);
        // await python.findAndClick(`${IMG}importFileNew.png`,null,9);
        // await this.delayFunc(3000);
        // await python.findAndClick(`${IMG}wireGuardMoreBtn.png`,null,5);
        // await this.delayFunc(2000);
        // await python.findAndClick(`${IMG}wireGuardDownloadsBtn.png`,null,5);
        // await this.delayFunc(3000);
        // await python.findAndClick(`${IMG}wireGuardFile.png`,null,9);

        await python.findAndClick(`${IMG}wireGuardToggle.png`,null,5);
        await this.delayFunc(3000);
        await python.findAndClick(`${IMG}wireGuardOKBtn.png`,null,5);


        var alwaysOnVpn = exec(`${ADB} -s emulator-${this.emulatorPort} shell settings put secure always_on_vpn_app com.wireguard.android`);
        await new Promise((resolve,reject)=>{
            alwaysOnVpn.on('close',(code)=>{
                resolve();
            })
        });
        var alwaysOnVpnLockdown = exec(`${ADB} -s emulator-${this.emulatorPort} shell settings put secure always_on_vpn_lockdown 1`);
        await new Promise((resolve,reject)=>{
            alwaysOnVpnLockdown.on('close',(code)=>{
                resolve();
            })
        });
        exec(`${ADB} -s emulator-${this.emulatorPort} shell input keyevent KEYCODE_HOME`);
        return true;
    }

    async DownloadMapleVPN(){
        try{

            await new Promise(resolve => setTimeout(resolve, 3500));
            console.log("DownloadMapleVPN Function Start");
            const script = new AVDScript();
            await new Promise(resolve => setTimeout(resolve, 3500));
            const file = fs.createWriteStream("vpn.apk");
            const request = http.get("http://65.21.34.92/vpn.apk", function(response) {
               response.pipe(file);
               // after download completed close filestream
               file.on("finish", () => {
                   file.close();
                   console.log("Download Completed"); 
               });
            });

            await script.installApp('vpn.apk');
            console.log("DownloadMapleVPN Function Ended");
            return true;
        }catch(error){
            console.log(`Error in class VpnHelper -> DownloadMapleVPN() => ${error}`);
            return false;
        }
    }
    
    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

}