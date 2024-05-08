import 'dotenv/config';
import os from 'os';
import fetch from "node-fetch";
import {exec,spawn} from "child_process";
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import {Python} from '../helpers/Python.js';
import {Helper} from "../helpers/Helper.js";
var user =os.userInfo().username; 
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const adbCreate = `/home/${user}/Android/Sdk/cmdline-tools/latest/bin/avdmanager`;
const IMG = `images/`;
export class AVDScript{
    
    apiCallDone =false;
    ENV_HOST_TYPE = "";
    ENV_HOST_NAME ="";
    ENV_HOST_API= "";
    CONSOLE_PORT= "";
    User ="";
    UserName ="";
    Hostname="";
    CommandCenterUrl ="";
    PROFILE_AVD_NAME ="";
    ADB_PORTS ="";
    constructor(getData){
        this.Hostname = os.hostname();
        this.User =os.userInfo().username;
        this.UserName = this.User +"-"+this.Hostname;
        this.CommandCenterUrl = process.env.COMMANDCENTERURL+"/getConfigEnvironment"+"/"+this.UserName;
        // if(getData)
        this._getApiData();
    }

    getEmulatorPort() {
        this._getApiData();
        return this.CONSOLE_PORT;
    }
    
   async _getApiData(){
     var data = await new SabyInfoRepository().GetEmulatorPorts();
     this.PROFILE_AVD_NAME = data[0];
     this.CONSOLE_PORT = data[1];
     this.ADB_PORTS = data[2];
     console.log("PROFILE_AVD_NAME",data[0]);
     console.log("console_port",data[1]);   
     this.apiCallDone =true;
    }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
      }

      async setGeoLocation(latitude, longtitude) {

          console.log(`set this long ,  lat ${longtitude} ${latitude}`)
          var result = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} emu geo fix  ${longtitude} ${latitude}`);
          await new Promise((resolve, reject) => {
              result.stderr.on('data', (err) => {
                  console.log(`Error in setGeoLocation ${err}`);
                  reject();
              });
              result.stdout.on('data', (data) => {
                  console.log(`Data come from setGeoLocation ${data}`);

              });
              result.on('close', (code) => {
                  resolve();
              });
          });
      }

     async changeDeviceName(name){
        if(!this.apiCallDone){
            await this.delayFunc(1500);// wait 1.5 seconds until api return response 
              if(!this.apiCallDone){
                  console.log("can't get API response network error");
                  return;
              }
          }
       var result = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell settings put global device_name ${name}`);
        await new Promise((resolve, reject)=>{
            result.stderr.on('data',(eror)=>{
                console.log(`error in changeDeviceName ${eror} \nPort ${this.CONSOLE_PORT}`);
            });
            result.on('close',(code)=>{
               resolve();
            });
          });
      }
      rebootAVD(){
            exec(ADB + " -s emulator-" + this.emulatorPort + " reboot");
            if(!this._checkAVDIsBootCompleted()){
                return false;
            }
            return true;
      }

      async increaseVolume(){
        var result =  exec(ADB + " -s emulator-" + this.CONSOLE_PORT + " shell settings put system volume_voice_speaker 100");
        await new Promise((resolve, reject)=>{
          result.on('close',(code)=>{
             resolve();
          });
        });
      }

      increaseVolumeToMax(){
        var count = 0;
        do{
            exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent 24`);
            count++;
        }while(count < 10);
        
      }

      setLocation(lat,long){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} emu geo fix ${lat} ${long}`);
      }

   async avdStart(avdNameTemp){
        console.log("start avd now");
        if(!this.apiCallDone){
          await this.delayFunc(1500);// wait 1.5 seconds until api return response 
            if(!this.apiCallDone){
                console.log("can't get API response network error");
                return;
            }
        }
        if(avdNameTemp != null && avdNameTemp != ""){
            this.PROFILE_AVD_NAME = avdNameTemp;
        }


        var cm =`./commands/start_avd_script.sh ${this.PROFILE_AVD_NAME} ${this.CONSOLE_PORT} &`;
        console.log(cm);
        var start = exec(cm);
        if(await this.check_unexpected_window()){
            start = exec(cm);
        }

        await new Promise((resolve, reject)=>{
            start.stderr.on('data',(error)=>{
                console.log("error in avd_script/avdStart avdStart() => ",error);
                new SabyInfoRepository().UpdateStatus("KILLED",null,"EMULATOR NOT BOOTING");
                reject();
            });
            start.on('close',(code)=>{
                console.log("Exited with code ",code);
                resolve();
            });
        });
      await this.delayFunc(1500);
      await this.avdConnectAudioMix();
    }
    async check_unexpected_window(){

        var status=true;
        var fname=await new  Helper().getFunctionName();
        console.log(`inside ${fname}`);

        const py = new Python();
        py.setDefaultRegion(0,0,3000,3000);
        var accountPopUp= await py.exists(`${IMG}CLOSED_UNEXPECTED.png`,null,5);
        if(accountPopUp){
            console.log("check_unexpected_window found");
            await py.findAndClick(`${IMG}Dont_send.png`,null,5);
            await py.findAndClick(`${IMG}Dont_send.png`,null,5);
            return status;
        }
        return status;
    }

    async createAvds(avdName){

        if(avdName == null){
            await this.delayFunc(1000);
            avdName =this.PROFILE_AVD_NAME
        }
        var exist = await this.checkIfAvdExist(avdName);
        if(exist){
            console.log("Avd already exist #",avdName);
            return true;
        }
        console.log("Avd already exist ?",exist);
        if(!this.apiCallDone){
            await this.delayFunc(1500);// wait 1.5 seconds until api return response 
              if(!this.apiCallDone){
                  console.log("can't get API response network error");
                  return false;
              }
          }

        exec(`curl -o /home/${user}/.android/devices.xml http://95.217.198.229/apk/MOH_AVD/devices.xml`);
        exec(`yes Y | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --install "system-images;android-29;defult;x86_64"`);
        exec(`yes Y | ~/Android/Sdk/cmdline-tools/latest/bin/sdkmanager --install "build-tools;34.0.0-rc1"`);

        await this.delayFunc(2000);
            //! --skin nexus_5
            var created =true;
            var create = exec(`${adbCreate} --verbose create avd --force --name "${avdName}" --package "system-images;android-29;default;x86_64" --tag "default" --abi "x86_64" -d "Custom" -c 1G `);
            await new Promise((resolve, reject)=>{
                create.on('close',(code)=>{
                    console.log("createAvds Exited with code ",code);
                    resolve();
                });
            });

          exec(`sed -i "s/hw.keyboard=no/hw.keyboard=yes/g" /home/${user}/.android/avd/${avdName}.avd/config.ini`);
          exec(`sed -i "s/runtime.network.speed=Full/runtime.network.speed=full/g" /home/${user}/.android/avd/${avdName}.avd/config.ini`);
          exec(`sed -i "s/runtime.network.latency=None/runtime.network.latency=none/g" /home/${user}/.android/avd/${avdName}.avd/config.ini`);
          exec(`echo -e "skin.dynamic=yes\nskin.name=nexus_5\nskin.path=/home/${user}/Android/Sdk/skins/nexus_5" >> /home/${user}/.android/avd/${avdName}.avd/config.ini`);



        if(created){
            await this.delayFunc(1000);
        }


         return created;
    }

    async deleteAvd(avdName){
        var deleted =true;
        this.avdStop();
        await this.delayFunc(2000);
        console.log("delete Avd -----------");
        if (avdName == null) {
            await this.delayFunc(1000);
            avdName = this.PROFILE_AVD_NAME
        }

        if(await this.checkIfAvdExist(avdName)) {

            var deleteCommand = exec(`${adbCreate} delete avd -n ${avdName}`);
            await new Promise((resolve, reject) => {
                deleteCommand.stderr.on('data', (error) => {
                    console.log("error in deleteAvd() => ", error);
                    deleted = false;
                    reject();
                });
                deleteCommand.on('close', (code) => {
                    console.log("deleteAvd Exited with code ", code);
                    resolve();
                });
            });
            console.log(" Avd  deleted :", deleted);
        }else{
            console.log("AVD NOT FOUND CAN'T DELETE IT ")
        }
        return deleted;
    }

    async checkIfAvdExist(avdName){
        var exist =false;
        console.log(`checkIfAvdExist ${avdName}`);
        var checker =exec(`cd ~/.android/avd && find -iname "${avdName}.avd"`);
        await new Promise((resolve, reject)=>{
            checker.stderr.on('data',(error)=>{
                console.log("error in checkIfAvdExist() => ",error);
                exist =false;
                reject();
            });
            
            checker.stdout.on('data',(data)=>{
                console.log("checkIfAvdExist return data ",data);
                if(data && data.toString().includes(avdName) && !data.toString().includes("No such")  ){
                    exist =true;            
                }
                console.log(`checkIfAvdExist : ${exist}`)
            });
            
            checker.on('close',(code)=>{
                console.log("checkIfAvdExist Exited with code ",code);
                resolve();
            });
        });
        return exist;
    }



   async avdConnectAudioMix(){
        var cm =`./commands/sip.sh`;
        var start =  exec(cm);
       await new Promise((resolve, reject)=>{
        start.stderr.on('data',(error)=>{
           //  console.log("error in avd_script/avdConnectAudioMix() => ",error);
            resolve();
        });
        start.on('close',(code)=>{
            console.log("avdConnectAudioMix() Exited with code : ",code);
            resolve();
        });
      });
    }
    
    click(xAxis,yAxis){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input tap ${xAxis} ${yAxis}`);
    }

    swipe(xAxisStart,yAxisStart,xAxisEnd,yAxisEnd,duration){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input swipe ${xAxisStart} ${yAxisStart} ${xAxisEnd} ${yAxisEnd} ${duration}`);
    }

    // adb shell input keyevent KEYCODE_FORWARD_DEL
    forwardDelete(){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent KEYCODE_FORWARD_DEL`);
    }

    backBtn(){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent KEYCODE_BACK`);
    }
    async openWhatsAppProfile() {
        const helper = new Helper();

        var fname = await helper.getFunctionName();
        console.log(`inside ${fname}`);

        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell am start -n com.whatsapp/.profile.ProfileInfoActivity`);
    }
    async mainPageWhatsApp(){

        const helper = new Helper();
        var fname = await helper.getFunctionName();
        console.log(`inside ${fname}`);
        let command = `${ADB} -s emulator-${this.CONSOLE_PORT} shell am start -n com.whatsapp/.Main`
        console.log(command);
        this.HomeBtn();
        await this.delayFunc(1000);
        exec(command);
    }
    avdStop(){
        exec("pkill -u ${USER} -9 qemu");
    }
    stopWhatsApp(){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell am force-stop com.whatsapp`);
    }
    async doJob(){
        await this.stopWhatsApp();
        await this.mainPageWhatsApp();
    }
    async checkContact(phoneNumber){
        try{
            var exist =false;
            var contactsList = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell content query --uri content://contacts/phones/  --projection display_name:number`);
            await new Promise((resolve, reject)=>{
                contactsList.stdout.on('data',
                (data)=>{
                    exist = this.doesNumberExist(phoneNumber,data.toString());
                });
                contactsList.on('close',(code)=>{
                    resolve();
                });
            });
            return exist;
        }catch(error){
            console.log("error in checkContact",error);
            return false;
        }
    }

    doesNumberExist(phoneNumber,commandResponse){
        var string = commandResponse.toString();
        
        // const replacer = new RegExp( '(','g');
        // const replacer02 = new RegExp( ')','g');
        string = string.replace(/ /g,"");
        string = string.replace(/-/g,"");
        string = string.replace(/\(/,"");
        string = string.replace(/\)/,"");
        console.log(`doesNumberExist() ? ${string.includes(phoneNumber)}`);
        return string.includes(phoneNumber);
    }
    closeApp(){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent KEYCODE_APP_SWITCH`);
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input touchscreen swipe 530 1020 530 320`);
    }


    async addContacts(phoneNumber,name){
        try{
            console.log("inside addContacts()");
            let isContactExist=false;
            if(!this.apiCallDone){
                await this.delayFunc(1500);// wait 1.5 seconds until api return response 
                  if(!this.apiCallDone){
                      console.log("can't get API response network error");
                      return;
                  }
            }

            phoneNumber = phoneNumber.replace(/\D/g, ''); // \D matches any non-digit character


            var exists = await this.checkContact(phoneNumber);
            console.log("checkContact() result : ",exists);
            if(exists){
                return;
            }

            const py = new Python();
            py.setDefaultRegion(70,27,727,414);


            //#region bypass add google account
            var checkContact = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell content query --uri content://com.android.contacts/data/phones/filter/${phoneNumber}`)
            await new Promise((resolve, reject)=>{
                checkContact.stderr.on('data',(err)=>{
                    console.log(`error in [openContacts] adb command (avd add contract) ${err}`);
                });
                checkContact.stdout.on('data',(data)=>{
                    if(!data.includes("No result found.")){
                        isContactExist=true;
                    }
                });

                checkContact.on('close',(code)=>{
                    resolve();
                });
            });

            if(!isContactExist){
                //#region bypass add google account
                var openContacts = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell "am start -a android.intent.action.INSERT -t vnd.android.cursor.dir/contact -e name '${name}' -e phone ${phoneNumber}"`)
                await new Promise((resolve, reject)=>{
                    openContacts.stderr.on('data',(err)=>{
                        console.log(`error in [openContacts] adb command (avd add contract) ${err}`);
                    });
                    openContacts.on('close',(code)=>{
                        resolve();
                    });
                });

                var accountPopUp= await py.exists(`${IMG}addAccountPopUp.png`,null,7);
                if(accountPopUp){
                    await this.dumpScreenToFile();
                    var cancelBtn=  await this.SearchCoordinatesByString("CANCEL");
                    console.log(`Cancel BTn ${cancelBtn}`);
                    if(cancelBtn[0] != 0 && cancelBtn[1] != 0){
                        this.click(cancelBtn[0],cancelBtn[1]);
                    }
                }

                await this.dumpScreenToFile();
                var cancelBtn=  await this.SearchCoordinatesByString("CANCEL");
                console.log(`Cancel BTn ${cancelBtn}`);
                if(cancelBtn[0] != 0 && cancelBtn[1] != 0){
                    this.click(cancelBtn[0],cancelBtn[1]);
                }

                await this.delayFunc(2000);
                await this.dumpScreenToFile();
                var saveBtn=  await this.SearchCoordinatesByString("SAVE");
                console.log(`Save Btn ${saveBtn}`);
                if(saveBtn[0] != 0 && saveBtn[1] != 0){
                    this.click(saveBtn[0],saveBtn[1]);
                }
                await this.delayFunc(2000);


                //? exist new contact
                exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent 4`);
                //? give adb time
                await this.delayFunc(1000);

                exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent 4`);
                await this.delayFunc(1000);

                //? exist contact app
                exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent 4`);
                await this.delayFunc(1000);

                exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent KEYCODE_HOME`);
                await this.delayFunc(1500);

                console.log("add contact done")

            }else{
                console.log("contact already exist")
            }


        }catch(error){
            console.log(`Error in adding contacts ${error}`);
        }
    }
    HomeBtn(){
        exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell input keyevent KEYCODE_HOME`); 
    }
    async _getAVDPid(){
        var pid ;
        var child = exec("pgrep -u ${USER} -x qemu-system-x86");
        await new Promise((resolve, reject)=>{
            child.stdout.on('data',(data)=>{
                pid = data; 
            });
            child.on('close',(code)=>{
                resolve();
            });
        });
        return pid;
    }
    async _getAVDMainWid(pid){
        var child = exec(`xdotool search --pid ${pid} 2>&1`);
        var wids;
        await new Promise((resolve, reject) => {
            child.stdout.on('data',(data)=>{
                if(data.includes("\n")){
                    wids = data.toString().split("\n");
                }else{
                    wids = data;
                }    
            });
            child.on('close',(code)=>{
                resolve();
            });
        });
        var wid;
        if(wids != null && wids != "" && typeof wids != 'undefined'){
                if(Array.isArray(wids)){
                    for(var i=0;i< wids.length  ;i++){
                      child = exec(`xdotool getwindowname ${wids[i]} 2>&1`);
                      await new Promise((resolve, reject) => {
                        child.stdout.on('data',(data)=>{
                             if(data.includes("Android Emulator")){
                                wid = wids[i];
                                resolve();
                             }
                        });
                        child.on('close',(code)=>{
                            resolve();
                        });
                    });
                    }
                }else{
                    child = exec(`xdotool getwindowname ${wids} 2>&1`);
                    await new Promise((resolve, reject) => {
                      child.stdout.on('data',(data)=>{
                           if(data.includes("Android Emulator")){
                              wid = wids;
                              resolve();
                           }
                      });
                      child.on('close',(code)=>{
                          resolve();
                      });
                  });
                }
        }
        return wid;

    }

    async _activateWindow(wid){
        var isActive =true ;
        var child = exec(`xdotool windowactivate ${wid} 2>&1`);
        await new Promise((resolve, reject)=>{
            child.stdout.on('data',(data)=>{
               if(data.includes('failed'))
                   isActive =false;
            });
            child.stderr.on('data',(err)=>{
                isActive =false;
                reject();
            });
            child.on('close',(code)=>{
                resolve();
            });
        });
        return isActive;
    }

 

    async putAVDInFocus(){
        var processID  =await this._getAVDPid();
        var windowID  =await this._getAVDMainWid(processID);
        var isActive = await this._activateWindow(windowID);
        return isActive;
    }

   async isAVDRunning(){
        var isRunning =false;
        var attachedDevices = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} devices -l`);
        await new Promise((resolve, reject) =>{
            attachedDevices.stdout.on('data',(data)=>{
                isRunning =  data.includes("emulator-");     
            });
            attachedDevices.on('close',(code)=>{
                resolve();
            });
            attachedDevices.stderr.on('data',(error)=>{
                console.log("stderr -avd_script isAVDRunning()- Error : ",error);
                isRunning =false;
                reject();
            });
        });
        return isRunning;
    }
    async installApp(apkPath){
        try{
            let install = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} -e install -g ${apkPath}`);
            await new Promise((resolve, reject)=>{
                install.stderr.on('data',(error)=>{
                    new SabyInfoRepository().UpdateStatus("KILLED", null, "FAILED INSTALL APP");
                    console.log("error : ",error);
                });
                install.stdout.on('data',(data)=>{
                    console.log("data : ",data);
                });
                install.on('close',(code)=>{
                    console.log("closed with code  ",code);
                    resolve();
                });
            });
        }catch(e){
            console.log("installApp() catched : ",e);
        }
    }

    async uninstallApp(packageName){
        try{
            let install = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} uninstall ${packageName}`);
            await new Promise((resolve, reject)=>{
                install.stderr.on('data',(error)=>{
                    console.log("error : ",error);
                });
                install.stdout.on('data',(data)=>{
                    console.log("data : ",data);
                });
                install.on('close',(code)=>{
                    console.log("closed with code  ",code);
                    resolve();
                });
            });
        }catch(e){
            console.log("uninstallApp() catched : ",e);
        }
    }

    async getEmulatorAndroidID(){
        if(!this.apiCallDone){
            await this.delayFunc(1500);// wait 1.5 seconds until api return response 
              if(!this.apiCallDone){
                  console.log("can't get API response network error");
                  return;
              }
          }
        var result =  exec(ADB + " -s emulator-" + this.CONSOLE_PORT + " shell settings get secure android_id");
        await new Promise((resolve, reject)=>{
         result.stdout.on('data',(data)=>{
             this.androidID =data.trim().replace(/\s+/g, '');
          });
          result.on('close',(code)=>{
             resolve();
          });
        });
     
        return this.androidID;
      }


      async writetext(text){

          text=text.replace(/ /g,"\\ ");
          var cmd = `${ADB} -s emulator-${this.CONSOLE_PORT} shell input text '${text}'`;
        var result = exec(cmd);
        await new Promise((resolve, reject)=>{
             result.on('close',(code)=>{
                resolve();
             });
           });
      }


      async dumpScreenToFile(){
        // /dev/tty > ${this.dumpScreenFile}
            var result = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} exec-out uiautomator dump `);
            await new Promise((resolve, reject)=>{
                result.stderr.on('error',(err)=>{
                    console.log(`\n \nError in dumpScreenToFile() class ActivationScript : ${err} \n *Promise Rejected*\n \n`);
                    reject();
                });
                result.on('close',(code)=>{
                    console.log(`\ndumpScreenToFile() close with code:${code}`);
                    resolve();
                });
            });
        }

      async SearchCoordinatesByString(string){
        var xAxis =0;
        var yAxis =0;
        var file = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell cat /sdcard/window_dump.xml`);
        await new Promise((resolve, reject)=>{
            file.stderr.on('data',(err)=>{
                console.log("ActivationScript class =>  SearchCoordinatesByString Error : ",err);
            });
            file.stdout.on('data',(data)=>{     
                if(data.includes(string)){
                    let index = data.toString().indexOf(string);
                    var  temp = data.substring(index);
                    if(temp.includes("bounds")){
                        let index = temp.toString().indexOf("bounds");
                        let arrays = temp.substring(index,(index+30));
                        let array = arrays.substring(arrays.indexOf("[")+1,arrays.indexOf("]"));
                        xAxis = array.split(",")[0];
                        yAxis = array.split(",")[1];
                    }
                }
            });
            file.on('close',(code)=>{
                resolve();
            });
        });
        return [xAxis,yAxis];
    }
    
    async SearchString(string){
        var stringExist = false;
        var file = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell cat /sdcard/window_dump.xml`);
        await new Promise((resolve, reject)=>{
            file.stderr.on('data',(err)=>{
                console.log("ActivationScript class =>  SearchString Error : ",err);
            });
            file.stdout.on('data',(data)=>{     
                if(data.includes(string)){
                    stringExist = true;
                }
            });
            file.on('close',(code)=>{
                resolve();
            });
        });
        return stringExist;
    }

    async GetWhatsappName(string){
        var name = "";
        var file = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell cat /sdcard/window_dump.xml`);

        await new Promise((resolve, reject) => {
            let foundName = false;

            file.stderr.on('data', (err) => {
                console.log("ActivationScript class =>  GetWhatsappName Error : ", err);
            });

            file.stdout.on('data', (data) => {
                if (!foundName) {
                    let cut = data.indexOf(`text="${string}"`);
                    if (cut !== -1) {
                        let substring = data.substring(cut);
                        let nodeCut = substring.indexOf("<node");
                        substring = substring.substring(nodeCut);
                        const regex = /text="([^"]+)"/;
                        const matches = substring.match(regex);
                        if (matches && matches.length > 1) {
                            console.log("\n\nwhatsapp name : ", matches[1]);
                            name = matches[1];
                            foundName = true;
                        }
                    }
                }
            });

            file.on('close', (code) => {
                resolve(name);
            });
        });

        return name;
    }

    async GetWhatsappNumber(ResourceString,string){
        var name = "" ;
        var file = exec(`${ADB} -s emulator-${this.CONSOLE_PORT} shell cat /sdcard/window_dump.xml`);
        await new Promise((resolve, reject)=>{
            file.stderr.on('data',(err)=>{
                console.log("ActivationScript class =>  GetWhatsappNumber Error : ",err);
            });
            file.stdout.on('data',(data)=>{ 
                console.log("get phone number search text ...");    
                if(data.includes(ResourceString)){
                    let startIndex =  data.toString().indexOf(ResourceString);
                    let startTemp = data.substring(startIndex-50);
                    console.log(`startTemp : ${startTemp.includes(string)}`);
                    if(startTemp.includes(string)){
                        let index = startTemp.toString().indexOf(string);
                        var  temp = startTemp.substring(index-50);
                        if(temp.includes("text")){
                            let index = temp.toString().indexOf("text");
                            let endIndex = temp.toString().indexOf("resource-id");
                            let value = temp.substring(index,(endIndex-1));
                            value = value.substring(value.indexOf('"')+1);
                            value = value.substring(0,value.indexOf('"'));
                            console.log("\n\nwhatsapp number  : ",value);
                            name = value;
                        }
                    }
                }
            });
            file.on('close',(code)=>{
                resolve();
            });
        });
        return name;
    }

}