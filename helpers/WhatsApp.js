import {exec} from "child_process";
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import {Python} from './Python.js'
import { AVDScript } from "../scripts/avd_script.js";
import os from 'os';
import fetch from "node-fetch";
import http  from'http';
import fs  from'fs';
import {Helper} from "./Helper.js";
var user =os.userInfo().username;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const IMG = `images/`;



export class WhatsAppHelper{
    emulatorPort    = null;
    emulatorName    = null;
    emulatorAlpha   = null;
    androidID       = null;
    emulatorID      = null;
    emulatorBaseName= null;

    constructor(){
    }
    
    async init(){
        console.log("init Helper")
        var response = await new SabyInfoRepository().GetCheckerConstructorData();
        this.emulatorPort =response[0];
        this.application =response[1];
        this.emulatorBaseName =response[3];
        this.emulatorID = response[4];
        this.emulatorAlpha =response[5];
        this.asteriskHost =response[6];
        this.emulatorName = response[3];
       }
    async stopWhatsapp(){
        console.log("inside stopWhatsapp");
        console.log(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop com.whatsapp`);
        var stop =  exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop com.whatsapp`);
        await new Promise((resolve, reject)=>{
            stop.on('close',(code)=>{
                resolve();
            });
        });
    }
    async runApplication(){
        console.log("inside runApplication")
        let appStarted =false;
        var stop =  exec(`${ADB} -s emulator-${this.emulatorPort} shell am force-stop com.whatsapp`);
        await new Promise((resolve, reject)=>{
            stop.on('close',(code)=>{
                resolve();
            });
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        var startApp =exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -n com.whatsapp/.Main`);
        await new Promise((resolve, reject)=>{
          startApp.on('close',(code)=>{
              resolve();
          });
        });


        if(!await this.isWhatsAppRunning()){
            console.log("wait application running")
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        console.log("wait 8 s");
        await new Promise(resolve => setTimeout(resolve, 8000));


        return  await this.checkActiveWhatsappImages();

    }

    async checkActiveWhatsappImages(){
        console.log(`inside checkActiveWhatsappImages `);
        let status=false;
        const py = new Python();
        py.setDefaultRegion(70,27,727,414);
        console.log("check normal whatsapp theme")
        if(await py.exists(`${IMG}zoomWhatsapp.png`,null,3) || await py.exists(`${IMG}WhatsAppImage.png`,null,3)){
            status= true
        }
        console.log("check white whatsapp")
        if(await py.exists(`${IMG}whatsappZoomwhite.png`,null,3) || await py.exists(`${IMG}WhatsappImageWhite.png`,null,3)){
            status= true;
        }
        return  status;

    }

    async  isWhatsAppRunning() {
        console.log("inside isWhatsAppRunning")

        return new Promise((resolve, reject) => {
            const checkWhatsApp = exec(`${ADB} -s emulator-${this.emulatorPort} shell dumpsys activity | grep -i "whatsapp"`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject(stderr);
                    return;
                }

                // Check if WhatsApp is running
                const isRunning = stdout.includes('com.whatsapp');
                resolve(isRunning);
            });
        });
    }

    setProfileImg(){
        
    }

    async SendMessage(message){
        const py = new Python();
        py.setDefaultRegion(70,27,727,414);
        var interval = randomIntFromInterval(0.5,2);
        await py.writeMsg(message, interval);
        await py.findAndClick(`${IMG}wa_send_msg.png`, 5);
    }   

    async SendImage(){

    }

    async IsWhatsappBlocked(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        try{
            const py = new Python();
            py.setDefaultRegion(70,27,727,414);
            const script =new AVDScript();
            await script._getApiData();
            await script.dumpScreenToFile();

            var loginBtn1 = await script.SearchString("Log in");
            var loginBtn2 =  await script.SearchString("Login");
            if(loginBtn1 || loginBtn2){
                console.log(`loginBtn1 : ${loginBtn1} , loginBtn2 : ${loginBtn2}`);
                return true;
            }
            
            return false;
        }catch(e){
            console.log(`Error in class whatsappHelper -> IsWhatsappBlocked() => ${e}`);
            return false;
        }
    }

    async GetUserNameAndPhoneNumber(){
        try{

            console.log("inside GetUserName ---------");
            await this.stopWhatsapp();

            const py = new Python();
            py.setDefaultRegion(70,27,727,414);
            const script = new AVDScript(true);

            await new Promise(resolve => setTimeout(resolve, 1500));

              var openProfileResult=  await this.openWhatsappProfileUsingDumpScreen();
              if(openProfileResult[0] != "error" && openProfileResult[0] != "" && openProfileResult[1] != "error" && openProfileResult[1] != ""){
                await new Promise(resolve => setTimeout(resolve, 1000));
                script.backBtn();
                script.backBtn();
                return openProfileResult;
              }
               await new Promise(resolve => setTimeout(resolve, 1000));
                script.backBtn();
                script.backBtn();
              return null;
        }catch(e){
            console.log(`Error in GetUserName => ${e}`);
            return null;
        }
    }

    // search UI using python to find profile Button then click it
    async openWhatsappSettingsUsingPython(){
        try{
            const py = new Python();
            py.setDefaultRegion(70,27,727,414);
            var optionsBtn =  await py.findAndClick(`${IMG}whatsappSettingsIMG.png`,null,7);
            if(!optionsBtn){
                return [false,"options"];
            }   
           
            var settingsBtn = await py.findAndClick(`${IMG}whatsappSettingfromOptionsDropdown.png`,null,7);
            if(!settingsBtn){
                return [false,"settings"];
            }

            var statusBtn = await py.findAndClick(`${IMG}whatsappStatusHeyThere.png`,null,7);
            if(!statusBtn){
                return [false,"status"];
            }   

            return [true,"profile"];
        }catch(ex){
            console.log(`Error in class WhatsAppHelper -> openWhatsappProfileUsingPython() => ${ex}`);
            return [false,"error"];
        }
    }
    // search DumpScreen to find profile Button then click it 
    async openWhatsappProfileUsingDumpScreen(){
        try{
            const script = new AVDScript(true);
            await new Promise(resolve => setTimeout(resolve, 1500));


            exec(`${ADB} -s emulator-${this.emulatorPort} shell am start  -n com.whatsapp/.profile.ProfileInfoActivity`)

            await script.dumpScreenToFile();
                // profile imgae =>  com.whatsapp:id/profile_info_photo / com.whatsapp:id/profile_info_name [can be used to get whatsapp name]

            var name = await script.GetWhatsappName("Name");

            console.log(`\n\nwhatsapp name from script.GetWhatsappName ${name}\n\n`);


            await new Promise(resolve => setTimeout(resolve, 1500));
            script.swipe(990, 930, 990, 353, 500);
            await new Promise(resolve => setTimeout(resolve, 1500));
            script.swipe(990, 930, 990, 353, 500);
            await new Promise(resolve => setTimeout(resolve, 1500));
            await script.dumpScreenToFile();
            var phoneNumber = await script.GetWhatsappNumber("com.whatsapp:id/profile_phone_info","com.whatsapp:id/profile_settings_row_subtext");//com.whatsapp:id/profile_settings_row_subtext
            console.log(`\n\nwhatsapp number from script.phoneNumber ${phoneNumber}\n\n`);
            script.backBtn();// exit profile 
            script.backBtn();// exit settings
            script.backBtn();// exit whatsapp


            if(name.includes("This is not your username")){
                return ["stuck",phoneNumber]
            }

            return [name, phoneNumber];
        }catch(ex){
            console.log(`Error in class WhatsAppHelper -> openWhatsappProfileUsingDumpScreen() => ${ex}`);
            return ["error","error"];
        }
    }
    // check if whatsapp needs update
    async needsUpdate(){
        try{
            const helper = new Helper();
            var fname=await helper.getFunctionName();
            console.log(`inside ${fname}`);

            const script =new AVDScript();
            await script._getApiData();
            await script.dumpScreenToFile();
            var thisVersonOfWhatsApp = await script.SearchString("This version of whatsApp");
            var notAllowed = await script.SearchString("This account is not allowed to use WhatsApp");
            var updateWhatsApp = await script.SearchString("Update WhatsApp");
            var requestReview = await script.SearchString("Request a review");
            if(thisVersonOfWhatsApp || notAllowed || updateWhatsApp || requestReview){
                console.log("WhatsApp need update");
                await new SabyInfoRepository().UpdateStatus("Need Update", null, "Need Update Whatsapp");

                await this.delayFunc(5000);
                return true;
            }   
            return false;
        }catch(error){
            console.log(`Error in class whatsappHelper -> needsUpdate() => ${error} `);
            return false;
        }
    }
    // update whatsapp by getting apk from Api-Gateway then downloading 
    async updateWhatsappVersion(){
        try{
            const helper = new Helper();
            var fname=await helper.getFunctionName();
            console.log(`inside ${fname}`);

           let oldWaVersion= await helper.checkWaVersion();

           await new Promise(resolve => setTimeout(resolve, 3500));
            console.log("updateWhatsappVersion Function Start");
            const script = new AVDScript();
            await new Promise(resolve => setTimeout(resolve, 3500));
            const file = fs.createWriteStream("whatsapp.apk");
            const request = http.get("http://65.109.78.162:443/attachments/getWhatsapp", function(response) {
               response.pipe(file);

               // after download completed close filestream
               file.on("finish", () => {
                   file.close();
                   console.log("Download Completed"); 
               });
            });

            await new Promise(resolve => setTimeout(resolve, 3500));
            await  script.installApp('whatsapp.apk');
            console.log("updateWhatsappVersion Function Ended");

            let NewWaVersion= await helper.checkWaVersion();

            if(oldWaVersion === NewWaVersion){
                console.log("Old version are same New version plz update for latest")
                return false;
            }
            return true;
        }catch(error){
            console.log(`Error in class whatsappHelper -> updateWhatsappVersion() => ${error}`);
            return false;
        }
    }

    randomIntFromInterval(min,max) {
        return Math.floor(Math.random() * (max - min) + min )
      }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}