import fs from 'fs';
import {AVDScript} from './avd_script.js';
import { MainScript } from "./MainScript.js";

import {WhatsappActivation} from './ActivationScript.js';
import {Python} from '../helpers/Python.js';
import {WhatsAppHelper} from '../helpers/WhatsApp.js'
const IMG = `images/`;
import { Helper } from '../helpers/Helper.js';
import {exec} from "child_process";
import {SabyInfoRepository} from "../Repository/SabyInfoRepo.js";
import os from 'os';
import {performance, PerformanceObserver} from 'perf_hooks';
import path from "path";
import grpc, {status} from '@grpc/grpc-js';
import protoLoader  from'@grpc/proto-loader';
import {fileURLToPath} from "url";
import {Checker} from "../helpers/Checker.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


var user =os.userInfo().username;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const mainScript = new MainScript();

//const textToImage = require('text-to-image');
export class BehaviourScript{

    python = new Python();
    emulatorPort = 0;
    constructor(emulatorPort){
        this.emulatorPort = emulatorPort;
    }


    async StartMessages(numberOfMsg,sabyToChatWith,useCommand){
        try{
            
            if(useCommand == null || typeof useCommand == 'undefined'){
                useCommand = true;
            }
            console.log("inside StartMessages()");

            const whatsappHelper = new WhatsAppHelper();
            await whatsappHelper.init();
            await whatsappHelper.runApplication();
            const script = new AVDScript();
            //* open chat page
           
              await this.delayFunc(1000);
              if(useCommand){
                var opened = await this.OpenConversation(sabyToChatWith);
              }else{
                console.log('open with command : ', sabyToChatWith);
                var phone = String(sabyToChatWith).replace("-","");
                var opened = await this.OpenConversationCommand(phone);
              }
              
            await this.delayFunc(2000);

            if(!opened){
                 const time = new Date();
                 console.log(`BehaviourScript -> StartMessages() (${time}) => can not open conversation with ${sabyToChatWith}`);
                 return false;
            }
            //* time in MS
            var waitTime = this.randomIntFromInterval(3000,20000);
            let msg = "";
            for(var i = 0 ; i < numberOfMsg ; i++){
                
                if(i== 0){
                    msg = "Hello";
                }else{
                    let tempMsg = this.getMessage();
                    if(tempMsg != null){
                        msg = tempMsg;
                    }
                }

              var send = await this.sendMessage(script,msg);
              if(send == false){
                var opened = await this.OpenConversationCommand(sabyToChatWith);
              }
                await this.delayFunc(waitTime);
                waitTime = this.randomIntFromInterval(2000,20000);

            }
            script.backBtn();
            script.backBtn();
            script.backBtn();
            return true;

        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> StartMessages() (${time}) => ${error}`);
            return false;
        }
    }


    async StartCall(sabyToChatWith){
        try{
            var fname=await new Helper().getFunctionName();
            console.log(`inside ${fname}`);
            const whatsappHelper = new WhatsAppHelper();
            const script = new AVDScript();
            await whatsappHelper.init();
            await whatsappHelper.runApplication();
            //* open chat page

            await this.delayFunc(1000);
            var opened = await this.OpenConversationCommand(sabyToChatWith);
            await this.delayFunc(2000);

            if(!opened){
                const time = new Date();
                console.log(`BehaviourScript -> ${fname}() (${time}) => can not open conversation with ${sabyToChatWith}`);
                return false;
            }
            var waitTime = this.randomIntFromInterval(60000,90000);
            await this.MakeCall(script);
            await this.delayFunc(waitTime);
            await this.EndCall();
            script.backBtn();
            await new SabyInfoRepository().UpdateStatus("IN Call", null,"Ended");
            return true;
        }catch(error){
            const time = new Date();
            var fname=await new Helper().getFunctionName();
            console.log(`Error in BehaviourScript -> ${fname}() (${time}) => ${error}`);
            return false;
        }
    }

//C:\Users\User\SabyDemo\images\wa_SearchIcon.png
    async extractDigits(phoneNumber) {
        return phoneNumber.replace(/\D/g, '');
    }
    async OpenConversationCommand(phoneNumber){
        try{
            phoneNumber=await this.extractDigits(phoneNumber);
            console.log('inside OpenConversationCommand() phone :', phoneNumber);
            var isOpen = false;
            var openConv = exec(`${ADB} -s emulator-${this.emulatorPort} shell am start -n com.whatsapp/.Conversation -e jid '${phoneNumber}@s.whatsapp.net'`);
            console.log(`${ADB} -s emulator-${this.emulatorPort} shell am start -n com.whatsapp/.Conversation -e jid '${phoneNumber}@s.whatsapp.net'`);
            await new Promise((resolve,reject)=>{
                openConv.on('exit',(code)=>{
                    isOpen = code ==0 ? true : false;
                    resolve();
                })
            });
            return isOpen;
        }catch(error){
            const time = new Date();
            var fname=await new Helper().getFunctionName();
            console.log(`Error in BehaviourScript -> ${fname}() (${time}) => ${error}`);
            return false;
        }
    }

    async OpenConversation(sabyToChatWith){
        try{
            console.log("inside OpenConversation()");
            const script = new AVDScript();
            await script._getApiData();
            const py = new Python();
            py.setDefaultRegion(70,27,727,414);
           await py.findAndClick(`${IMG}wa_SearchIcon.png`,null,10);
           // images\wa_search_icon.png
      
                await script.dumpScreenToFile();
                var axis = await script.SearchCoordinatesByString("menuitem_search");
                if(axis[0] != 0 && axis[1] != 0){
                    script.click(axis[0],axis[1]);
                }
            
            await this.delayFunc(1500);
            await script.writetext(sabyToChatWith);           
        
            var clicked =false;
            
                 await script.dumpScreenToFile();
                 var Coordinates = await script.SearchCoordinatesByString(sabyToChatWith);
                 console.log(`saby  Coordinates  : ${Coordinates}`);
                //  if(Coordinates[0] != 0 && Coordinates[1] != 0){
                 script.click(350,350);
                 clicked = true;
                 
                 await this.delayFunc(1500);
 
            if(!clicked){
             const time = new Date();
             console.log(`BehaviourScript -> OpenConversation() (${time}) => can not open conversation with ${sabyToChatWith}`);
             return false;
            }
            await script.dumpScreenToFile();
            
            var isInsideCOnv = await script.SearchString("com.whatsapp:id/conversation_contact_name");
            return isInsideCOnv;
        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> OpenConversation() (${time}) => ${error}`);
            return false;
        }
    }
    async AnswerCall(){
        try{
            console.log("AnswerCall() -> BehaviourScript  Started => \n");
            const py = new Python();
            var inCommingCall =await py.exists(`${IMG}WhatsappIncommingCall.png`,null,60);
            var AnswerCAll =await py.exists(`${IMG}AnswerCAll.png`,null,60);
            if(inCommingCall || AnswerCAll) {


                var detectCall = exec(`${ADB} -s emulator-${this.emulatorPort} shell dumpsys activity activities | grep \'label="Video Call"\' | wc -l`);
                var callDetected = true;
                await new Promise((resolve, reject) => {
                    detectCall.stdout.on('data', (data) => {
                        console.log(`callDetected : ${data}`);
                        callDetected = data == 0 ? false : true;
                    });
                    detectCall.on('exit', (code) => {
                        resolve();
                    })
                })

                if (callDetected) {
                    console.log("no Call Detected ");
                    await new SabyInfoRepository().UpdateStatus("no Call Detected", null);
                    await py.findAndClick(`${IMG}whatsapp_hangup.png`, null, 10);
                    return false;
                }

                var hostm = exec(`${ADB} -s emulator-${this.emulatorPort} emu avd hostmicon`);
                await new Promise((resolve, reject) => {
                    hostm.on('exit', (code) => {
                        resolve();
                    })
                })
                // for old whatsapp
                exec(`${ADB} -s emulator-${this.emulatorPort} shell input swipe 540 1477 540 1000`);

                // new whatsapp behavior answer call
                if (await this.python.exists(`${IMG}AnswerCAll.png`, null, 5)) {
                    await this.python.findAndClick(`${IMG}AnswerCAll.png`, null, 5);
                } else {
                    exec(`${ADB} -s emulator-${this.emulatorPort} shell input tap 808 409`);

                }


                var isAnswered = await this.isCallAnswered();
                if (!isAnswered) {
                    await new SabyInfoRepository().UpdateStatus("Call not answered", null);
                    return false;
                }

                await new SabyInfoRepository().UpdateStatus("In Call", null);
                await this.delayFunc(5000);
                return true;
            }else{
                return false;
            }
        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> AnswerCall() (${time}) => ${error}`);
            return false;
        }
    }

    async checkIfCallActive(){
        while(true) {
            if(!await this.python.exists(`${IMG}whatsapp_add_contact.png`, null, 5) || !await this.python.exists(`${IMG}whatsapp_add_contact2.png`, null, 5) || !await this.python.exists(`${IMG}whatsapp_add_contact3.png`, null, 5)){
                console.log("call ended");
                break;
            }
            await new SabyInfoRepository().UpdateStatus("In Call", null,'BEHAVIOR');
            await this.delayFunc(15000);
        }
    }
    async ReplyToMessages(numberOfReplay,numberOfMsg){
        try{
                let cmd=`${ADB} -s emulator-${this.emulatorPort} shell  'sqlite3 /data/data/com.whatsapp/databases/msgstore.db`;
                let query = " \"select jid.raw_string from chat join jid on chat.jid_row_id = jid._id where unseen_message_count > 0 ";
                query += numberOfReplay != 0 ? ` limit ${numberOfReplay}"'`: ` "'`;
                console.log(query);
                var result =  exec(`${cmd} ${query}`);
                var dataresponse="";
                await new Promise((resolve, reject)=>{
                    result.stdout.on('data',async (data) => {
                        var response = data.toString().split(",")[0];
                        console.log(`response ${response}`);
                        if (response) {
                            let sendersList = response.split("\n");
                            for (let sender of sendersList) {
                                let [senderNumber, domain] = sender.split('@');
                                console.log(`domain for replay message from adb ${domain}`);

                                if(typeof domain != 'undefined'  && domain.includes("whatsapp")){
                                    if (senderNumber.includes('-')) {
                                        senderNumber = senderNumber.split('-');
                                    }
                                    await this.StartMessages(numberOfMsg, senderNumber,false);
                                }

                            }
                            resolve();
                        }else{
                            resolve();
                        }
                    });
                    result.stdout.on('end', () => {
                        resolve();
                    });


                    result.stderr.on('data',(error)=>{
                        console.log("stderr ReplyToMessages()- Error : ",error);
                        reject();
                    });
                });

           

           return true;
        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> StartMessages() (${time}) => ${error}`);
            return false;
        }
    }


    //#region private functions

    async sendMessage(script,msg){
        try{
            //


            await script.dumpScreenToFile();
            var Disappearing = await script.SearchCoordinatesByString("Disappearing messages are on in this chat");
            console.log(`send msg  Coordinates  : ${Coordinates}`);
            if(Disappearing[0] !== 0){
                await this.python.findAndClick(`${IMG}okDisappearing.png`, null, 5);
                await this.python.findAndClick(`${IMG}CloseDisappearing.png`, null, 5);
            }

            const py = new Python();
           var insideChat =  await  py.exists('images/FindMicrophone.png',null,7);
           if(!insideChat){
            console.log("Chat not opened");
            return false;
           }

           var interval =(Math.random() * (0.33 - 0.14) + 0.14)
           var msgWritten= await py.writeMsg(msg,interval);
           if(!msgWritten){
                await script.writetext(msg);
           }

            // send_container
            await script.dumpScreenToFile();
            var Coordinates = await script.SearchCoordinatesByString("send_container");
            console.log(`send msg  Coordinates  : ${Coordinates}`);
            if(Coordinates[0] != 0 && Coordinates[1] != 0){
                script.click(Coordinates[0],Coordinates[1]);
            }
             console.log("Message ..");

        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> #sendMessage() (${time}) => ${error}`);
        }
    }
    async check_if_have_image(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);
        exec(`${ADB} -s emulator-${this.emulatorPort} root`)
        var result= exec(`${ADB} -s emulator-${this.emulatorPort} shell find /data/data/com.whatsapp/files/me.jpg`);
        var status=false;
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                status= data.includes("No such file");
                console.log(`result from find whatsapp image is : ${status} `)
            });
            result.stderr.on('data',(data)=>{
                status=true;
                console.log(`Error  find whatsapp image is ${data}`)
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        if(status){
            const emulatorScript = new AVDScript();


            if(await this.python.generatePhoto()) {
                console.log("upload now");
                exec(`${ADB} -s emulator-${this.emulatorPort} push ~/cropped_image.jpg /mnt/sdcard/pic.jpg`);
                const checker = new Checker();
                await checker.init();
                console.log("waiting reboot");
                exec(`${ADB} -s emulator-${this.emulatorPort} reboot`);
                await this.delayFunc(25000);
                if(!await new Helper().checkIsBootingComplet()){
                    return false;
                }else{
                    console.log("boot complete")
                }
                //make it root access
                exec(`${ADB} -s emulator-${this.emulatorPort} root`);
            }


                const whatsappHelper = new WhatsAppHelper();
                await whatsappHelper.init();
                await whatsappHelper.runApplication();
                // not have image set image
                exec(`${ADB} -s emulator-${this.emulatorPort} shell am start  -n com.whatsapp/.profile.ProfileInfoActivity`)
                await this.delayFunc(2000);
                exec(`${ADB} -s emulator-${this.emulatorPort} shell input tap 517 522`);
                await this.python.findAndClick(`${IMG}addImageCam.png`,null,5);

                await emulatorScript.dumpScreenToFile();
                var axis = await emulatorScript.SearchCoordinatesByString("Gallery");

                if (await this.python.exists(`${IMG}GalleryUploadPhoto.png`, null, 5) || (axis[0] !== 0 && axis[1] !== 0)) {

                    if(axis[0] !== 0 && axis[1] !== 0){
                        emulatorScript.click(axis[0],axis[1]);
                    }
                    await this.python.findAndClick(`${IMG}GalleryUploadPhoto.png`, null, 5);
                    await this.delayFunc(2000);
                    exec(`${ADB} -s emulator-${this.emulatorPort} shell input tap 246 683`);
                    //
                    console.log(`${ADB} -s emulator-${this.emulatorPort} shell input tap 246 683`);
                    //
                    await this.delayFunc(2000);
                    exec(`${ADB} -s emulator-${this.emulatorPort} shell input tap 246 683`);
                    await this.delayFunc(1000);

                    if(await this.python.exists(`${IMG}DoneUploadPhoto.png`, null, 3)){
                        await this.python.findAndClick(`${IMG}DoneUploadPhoto.png`, null, 3);
                    }else{
                        await emulatorScript.dumpScreenToFile();
                        var DoneAxis = await emulatorScript.SearchCoordinatesByString("DONE");
                        if(DoneAxis[0] !== 0 && DoneAxis[1] !== 0){
                            emulatorScript.click(DoneAxis[0],DoneAxis[1]);
                        }
                    }                }

        }else{
            console.log(`have image`)
        }
    }
    async check_stuck_profile_info(){
        let status= false;
        const emulatorScript = new AVDScript();
        await emulatorScript._getApiData();
        await emulatorScript.dumpScreenToFile();
        var yourName = await emulatorScript.SearchCoordinatesByString("Type your name here");

        if(await this.python.exists(`${IMG}profileINfo.png`,null,10) || await emulatorScript.SearchString("Profile info") || yourName[0] !== 0) {
            console.log("found profile info");
            status=true;
        }
        return status
    }
    async check_profile_info (waName){

        const helper = new Helper();
        var checkProfile = false;
        var fname=await helper.getFunctionName();
        console.log(`inside behaviourScript -> ${fname}`);
        const emulatorScript = new AVDScript();
        console.log(`Emu Port ${emulatorScript.getEmulatorPort()}`);

        let whatsappActivation = new WhatsappActivation(this.emulatorPort);
        await emulatorScript._getApiData();
        await emulatorScript.doJob();

        await emulatorScript.dumpScreenToFile();
       if(await this.python.exists(`${IMG}profileINfo.png`,null,10) || await emulatorScript.SearchString("Profile info")) {

           if(await this.python.generatePhoto()){
               console.log("upload now");
               exec(`${ADB} -s emulator-${this.emulatorPort} push ~/cropped_image.jpg /mnt/sdcard/pic.jpg`);
               const checker = new Checker();
               await checker.init();
               console.log("waiting reboot");
               exec(`${ADB} -s emulator-${this.emulatorPort} reboot`);
               await this.delayFunc(25000);
               if(!await new Helper().checkIsBootingComplet()){
                   return false;
               }else{
                   console.log("boot complete")
               }
               //make it root access
               exec(`${ADB} -s emulator-${this.emulatorPort} root`);
               const whatsappHelper = new WhatsAppHelper();
               await whatsappHelper.init();
               await whatsappHelper.runApplication();
               await whatsappActivation.uploadPhotoToSaby();

           }

           await emulatorScript.dumpScreenToFile();
           if(await emulatorScript.SearchString("Type your name here")){
               var TypeNameHere=  await emulatorScript.SearchCoordinatesByString("Type your name here");
               emulatorScript.click(TypeNameHere[0],TypeNameHere[1]);
           }
           await emulatorScript.writetext(waName);
           await this.python.findAndClick(`${IMG}EnterCheck.png`,null,3);
           await emulatorScript.dumpScreenToFile();
           var axis = await emulatorScript.SearchCoordinatesByString("NEXT");
           if(axis[0] !== 0 && axis[1] !== 0){
               emulatorScript.click(axis[0],axis[1]);
           }
           checkProfile=true;
       }
        await this.python.findAndClick(`${IMG}NextClickActivation.png`,null,5);

        var YourEmail = await this.python.exists(`${IMG}EnterYourEmail.png`,null,10);
        if(YourEmail){
           emulatorScript.backBtn();
            await this.python.findAndClick(`${IMG}NotNowEnterEmail.png`,null,5);
        }

        if(checkProfile){

            let wahelper=new WhatsAppHelper();
            await wahelper.init();
            let nameAndNumber = await wahelper.GetUserNameAndPhoneNumber();
            if(nameAndNumber){
                await new SabyInfoRepository().AddSabyGroup( nameAndNumber[0], nameAndNumber[1]);
            }

        }



    }
    async MakeCall(script){
        try{
            const helper = new Helper();
            var fname=await helper.getFunctionName();
            console.log(`inside ${fname}`);

            if(await this.python.exists(`${IMG}whatsapp_dial_big.png`,null,10) || await this.python.exists(`${IMG}whiteDial.png`,null,10)){
                var foundAndClickedOk =await this.python.findAndClick(`${IMG}whatsapp_dial_big.png`,null,5);
                var foundAndClickedOk =await this.python.findAndClick(`${IMG}whiteDial.png`,null,5);
                if(foundAndClickedOk){
                    await script.dumpScreenToFile();
                    if(await script.SearchString("Start voice call?")){
                        exec(`${ADB} -s emulator-${this.emulatorPort} shell input tap 840 1010`);
                    }
                   // new SabyInfoRepository().UpdateStatus("Calling",null);
                    await new SabyInfoRepository().UpdateStatus("IN CALL", null,"DIALLING");
                    if(!await this.isCallBusy()){
                        var focus =  await script.putAVDInFocus();
                        if(await this.isRinging()){
                           await new SabyInfoRepository().UpdateStatus("IN CALL", null,"Ringing");
                        }
                        if(await this.isCallAnswered()){
                           await new SabyInfoRepository().UpdateStatus("IN CALL", null,"Answered");
                        }
                    }else{
                        await new SabyInfoRepository().UpdateStatus("IN CALL", null,'BUSY');
                    }
                }
            }
        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> #MakeCall() (${time}) => ${error}`);
        }
    }
    async EndCall(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        if(!await this.python.exists(`${IMG}whatsapp_add_contact.png`, null, 5) || await this.python.exists(`${IMG}whatsapp_add_contact2.png`, null, 5) || await this.python.exists(`${IMG}whatsapp_add_contact3.png`, null, 5)) {
            if(await this.python.exists(`${IMG}WhatsappReportCall.png`, null, 5)){
                await this.python.findAndClick(`${IMG}WhatsappReportCallOK.png`,null,5);
            }   
            await this.python.findAndClick(`${IMG}whatsapp_microphone_ok_big.png`,null,5);
            await this.python.findAndClick(`${IMG}WhatsappCallCancel.png`,null,5);
        }
        exec(`./commands/audio_stop.sh &`);
        await this.python.findAndClick(`${IMG}WhatsappRateCall.png`,null,5);
        await this.python.findAndClick(`${IMG}WhatsappRateCallSubmit.png`,null,5);
        console.log('whatsapp hangup call End');
        if(await this.python.exists(`${IMG}whatsapp_hangup.png`,null,5)){
            await this.python.findAndClick(`${IMG}whatsapp_hangup.png`,null,5);
        }
    }


    async isCallAnswered(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        if (await this.python.exists(`${IMG}whatsapp_add_contact.png`, null, 5) || await this.python.exists(`${IMG}whatsapp_add_contact2.png`, null, 5) || await this.python.exists(`${IMG}whatsapp_add_contact3.png`, null, 5)){
            var mixingCount=0;
            let audioMP3 = this.randomIntFromInterval(1,39);
            exec(`./commands/audio_fplay.sh ${audioMP3}.mp3  &`)
            var response = "";
            while (mixingCount <= 20) {
                var result =  exec(`./commands/audio_mix_ffplay.sh 2>&1`);
                await new Promise((resolve, reject)=>{
                    result.stdout.on('data',(data)=>{
                     response = data.toString().split(",")[0];
                    });
                    result.on('close',(code)=>{
                        resolve();
                    });
                });
                if(response == 1){
                    break;
                 }
                mixingCount++;
            }
            mixingCount > 20 ? new SabyInfoRepository().UpdateStatus("MIXING ERROR",null):null;
            return true;
        }else{
            return false;
        }
    }

    async isRinging(){
        var fname=await new  Helper().getFunctionName();
        console.log(`inside ${fname}`);
        if (await this.python.exists(`${IMG}WhatsppRinging.png`, null, 5) || await this.python.exists(`${IMG}RingingNew.png`, null, 5)) {
            return true;
        } else {
            return false;
        }
    }

    async isCallBusy() {
        var fname=await new  Helper().getFunctionName();
        console.log(`inside ${fname}`);
        if (await this.python.exists(`${IMG}whatsapp_busy_big.png`, null, 5)) {
            return true;
        } else {
            return false;
        }
    }
   async startSleep(){

       const helper = new Helper();
       var fname=await helper.getFunctionName();
       console.log(`inside ${fname}`);


       new SabyInfoRepository().UpdateStatus("SLEEP WAITING IN COMING CALL",null);

        const startTimeStamp = performance.now() / 1000;
        const  sleepTime= await this.getSleepTime();
        let sleepIsNotTimeOut=true;
        do {
            await this.AnswerCall();
            const currentTimeStamp = performance.now() / 1000;
            sleepIsNotTimeOut = sleepTime > (currentTimeStamp - startTimeStamp);
        } while (sleepIsNotTimeOut);

        new SabyInfoRepository().UpdateStatus("SLEEP END ",null);

        return sleepIsNotTimeOut;
    }

    async getSleepTime(){
        let helper= new Helper();

        let maxsleepTime = 10;
        await new Promise((resolve, reject) => {
            global.ConfigurationService.GetConfiguration({ key: "MaxSleepTime" }, (err, response) => {
                if (err)
                {
                    console.log("GetSleepTime Error :", err);
                }
                else if (response.value != null || response.value != '')
                {
                    maxsleepTime = response.value;
                }
                
                resolve();
            });
        });

        let minSleepTime= Math.ceil(maxsleepTime * 0.7);
        let sleepTime=helper.randomIntFromInterval(minSleepTime, maxsleepTime);
        console.log(`sleep time max : ${maxsleepTime}`);
        console.log(`sleep time min : ${minSleepTime}`);
        console.log(`sleep time : ${sleepTime}`);
        return sleepTime;
    }
     getMessage(){

        try{

            var rawDataDuffer = fs.readFileSync(`../jsonText/Message.json`);
            let obj = JSON.parse(rawDataDuffer);
            var keysLength =  Object.keys(obj).length;
            var keyIndex = Math.floor(Math.random() * keysLength);
            var msg = obj[keyIndex];
            return msg;

        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> #getMessage() (${time}) => ${error}`);
            return null;
        }

    }


    async setRandomBio(script) {
        try {
            let helper= new Helper();

            script.stopWhatsApp();
            await this.delayFunc(4000);
            await script.openWhatsAppProfile();
            const py = new Python();
            await script.dumpScreenToFile();
            var Coordinates = await script.SearchCoordinatesByString("About");
            console.log(`send msg  Coordinates  : ${Coordinates}`);
            if (Coordinates[0] !== 0 && Coordinates[1] !== 0) {
                script.click(Coordinates[0], Coordinates[1]);
            }

                var insideChat = await py.exists(`${IMG}EditBio.png`, null, 7);
                if (insideChat) {
                    await py.findAndClick(`${IMG}EditBio.png`, null, 7);
                }else{
                    script.click(948,601);
                }
                await this.delayFunc(3000);

                script.forwardDelete();
                let bioMessage=helper.getBio();
                console.log(`Bio ${bioMessage}`);
                await this.delayFunc(3000);
                await script.writetext(bioMessage);
                await this.delayFunc(3000);
                await script.dumpScreenToFile();
                var CoordinatesSAVE = await script.SearchCoordinatesByString("SAVE");
                if (CoordinatesSAVE[0] !== 0 && CoordinatesSAVE[1] !== 0) {
                    script.click(CoordinatesSAVE[0], CoordinatesSAVE[1]);
                }
                await this.delayFunc(3000);
                await  py.findAndClick(`${IMG}SaveAbout.png`,null,7);
                script.stopWhatsApp();




        } catch (error) {
            const time = new Date();
            console.log(`Error in BehaviourScript -> #setRandomBio() (${time}) => ${error}`);
        }
    }

    async setStatusWhatsapp(script) {
        try {
            let helper= new Helper();
            await this.delayFunc(3000);
            await script.doJob();
            const py = new Python();

            if(await  py.findAndClick(`${IMG}updateImageMainPage.png`,null,7) || await  py.findAndClick(`${IMG}UpdatesWhite.png`,null,7)){

                var insideChat = await py.exists(`${IMG}editStatus.png`, null, 7);
                var insideChat2 = await py.exists(`${IMG}EditStory.png`, null, 7);

                if (insideChat || insideChat2) {
                    await  py.findAndClick(`${IMG}editStatus.png`,null,5);
                    await  py.findAndClick(`${IMG}EditStory.png`,null,5);
                }else{
                    script.click(925,1107)
                }


                let getStatusWhatsapp=await helper.getStatusWhatsapp();
                console.log(`Status ${getStatusWhatsapp}`);
                await this.delayFunc(3000);

                await script.writetext(getStatusWhatsapp);
                await this.delayFunc(2000);
                await  py.findAndClick(`${IMG}whatsapp_send.png`,null,5);
                await this.delayFunc(2000);

                script.dumpScreenToFile();
                var Sendaxis = await script.SearchCoordinatesByString("Send");
                if(Sendaxis[0] != 0 && Sendaxis[1] != 0){
                    script.click(Sendaxis[0],Sendaxis[1]);
                }
                await this.delayFunc(2000);
                var SendStatus = await py.exists(`${IMG}SendStatus.png`, null, 7);
                if(SendStatus){
                    await  py.findAndClick(`${IMG}SendStatus.png`,null,5);
                }
                script.stopWhatsApp();

            }

        } catch (error) {
            const time = new Date();
            console.log(`Error in BehaviourScript -> #setRandomBio() (${time}) => ${error}`);
        }
    }
    async FollowChannelsWhatsApp(script){
        await script.doJob();
        const py = new Python();
        let count=0;
        let followCount=0;
        if(await  py.findAndClick(`${IMG}updateImageMainPage.png`,null,5) || await  py.findAndClick(`${IMG}UpdatesWhite.png`,null,7)){

            await script.dumpScreenToFile();
            var searchStringUpdates= await script.SearchCoordinatesByString("Updates");
            var searchStringStatus= await script.SearchCoordinatesByString("Status");

            while (searchStringUpdates[0] && searchStringStatus[0] && count < 20){

                console.log(`count ${count}`);
                await script.swipe( 500, 800, 500, 0, 500);
                await this.delayFunc(2000);
                if(await  py.exists(`${IMG}FollowWhatsapp.png`,null,5)){
                    break;
                }
                count++;
            }
            while(followCount < 3){
                await this.delayFunc(2000);
                await  py.findAndClick(`${IMG}FollowWhatsapp.png`,null,5);
                if(await  py.exists(`${IMG}AcceptFollowWhatsappGroup.png`,null,5)){
                    await  py.findAndClick(`${IMG}AcceptFollowWhatsappGroup.png`,null,5)
                }
                followCount++
            }
            script.stopWhatsApp();
        }
    }
    async SendCallOrMessageRequest(isCall){
        try{
                // second  saby replay call from grpc request in getRandomSabyGroup
                let sabyGroup=await this.getSabyFromGroup(isCall);
                console.log(`sabyGroup ${sabyGroup}`);
                var numberOfMsgg = Math.floor(Math.random() * (3 - 1) + 1 );
                console.log(`isCall ${isCall}`);
                if(sabyGroup){
                    if(sabyGroup.success){
                        const emulatorScript = new AVDScript();
                        await emulatorScript._getApiData();
                        if(!sabyGroup.waName.includes("undefined")){
                            await emulatorScript.addContacts(sabyGroup.phoneNumber,sabyGroup.waName);
                            if(isCall == 1){
                                await this.StartCall(sabyGroup.phoneNumber);
                            }else if(isCall == 2) {
                                console.log("one to one");
                                console.log(`phoneNumber : ${sabyGroup.phoneNumber}`,`waName ${sabyGroup.waName}`);
                                await this.StartMessages(10,sabyGroup.phoneNumber,false);
                            }else{
                                await this.StartMessages(numberOfMsgg,sabyGroup.phoneNumber,false);
                            }
                        }
                    }else{
                        console.log("can't find saby group")
                    }
                }
        }catch(error){
            console.log("make call",error);
        }
    }

    async getSabyFromGroup(isCall){

        var helper = new Helper();
        const sabyName=  await helper.getSabyName();
        const packageDefinitionProc = protoLoader.
        loadSync(path.join(__dirname, '../serverProtos/Behavior.proto'));
        const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);
        const processingStub = new processingProto.Behavior("65.109.78.162:80",
            grpc.credentials.createInsecure());
        let result=null;


        await new Promise((resolve,reject)=>{
            processingStub.getSabyFromGroup(
                {
                    username:sabyName,
                    isCall:isCall
                },
                (err,data)=>{
                    if(err){
                        console.log("err",err.toString().split("\n")[0].split("Error:")[1]);
                    }
                    else{
                        console.log("behavior send");
                        result=data
                    }
                    resolve();
                });
        });
        console.log(`sabyName ${sabyName}`);
        console.log(`isCall ${isCall}`);
        console.log("data",result);
        return result;
    }



    async checkSabyChat(){
        var helper = new Helper();
        const sabyName=  await helper.getSabyName();
        const packageDefinitionProc = protoLoader.
        loadSync(path.join(__dirname, '../serverProtos/Behavior.proto'));
        const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);
        const processingStub = new processingProto.Behavior("65.109.78.162:80",
            grpc.credentials.createInsecure());
        let result=null;
        await new Promise((resolve,reject)=>{
            processingStub.checkSabyChat(
                {
                    username:sabyName,
                },
                (err,data)=>{
                    if(err){
                        console.log("err",err.toString().split("\n")[0].split("Error:")[1]);
                    }
                    else{
                        result=data
                    }
                    resolve();
                });
        });
        console.log("data",result);
        return result;
    }


    async removeSabyChat(){
        var helper = new Helper();
        const sabyName=    await helper.getSabyName();
        const packageDefinitionProc = protoLoader.
        loadSync(path.join(__dirname, '../serverProtos/Behavior.proto'));
        const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);
        const processingStub = new processingProto.Behavior("65.109.78.162:80",
            grpc.credentials.createInsecure());
        let result=null;
        await new Promise((resolve,reject)=>{
            processingStub.RemoveSabyChat(
                {
                    username:sabyName
                },
                (err,data)=>{
                    if(err){
                        console.log("err",err.toString().split("\n")[0].split("Error:")[1]);
                    }
                    else{
                        result=data
                    }
                    resolve();
                });
        });
        console.log("data",result);
        return result;
    }


    async addBehaviorHistory(behaviorType){

        var helper = new Helper();
        const sabyName=    await helper.getSabyName();
        const packageDefinitionProc = protoLoader.
        loadSync(path.join(__dirname, '../serverProtos/Behavior.proto'));
        const processingProto = grpc.loadPackageDefinition(packageDefinitionProc);
        const processingStub = new processingProto.Behavior("65.109.78.162:80",
            grpc.credentials.createInsecure());
        let result=null;
        await new Promise((resolve,reject)=>{
            processingStub.addBehaviorHistory(
                {
                    username:sabyName,
                    behaviorType:behaviorType
                },
                (err,data)=>{
                    if(err){
                        console.log("err",err.toString().split("\n")[0].split("Error:")[1]);
                    }
                    else{
                        result=data
                    }
                    resolve();
                });
        });
        console.log("data",result);
        return result;

    }

    randomIntFromInterval(min,max) {
        return Math.floor(Math.random() * (max - min) + min )
    }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    //#endregion
    async swipeAndsendMessage(){
        console.log("inside stopWhatsapp test >>>>>>>>>>>>>>>>>>>>>>>>");
        const py = new Python();
        var stop = exec(
          `${ADB} -s emulator-5164 shell am force-stop com.whatsapp`
        );
        await new Promise((resolve, reject) => {
          stop.on("close", (code) => {
            resolve();
          });
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        var startApp = exec(
          `${ADB} -s emulator-5164 shell am start -n com.whatsapp/.Main`
        );
        await new Promise((resolve, reject) => {
          startApp.on("close", (code) => {
            resolve();
          });
        });
        console.log("===================================================");
        
        let screenSizeWH = "";
        var screenWidth = 0;
        var screenHeight = 0;

        try {
          const screenSize = exec(`${ADB} -s emulator-5164 shell wm size`);
          await new Promise((resolve, reject) => {
            screenSize.stderr.on("data", (error) => {
              console.log("error: ", error);
              reject();
            });
            screenSize.stdout.on("data", (data) => {
              screenSizeWH = data.trim();
            });
            screenSize.on("close", (code) => {
              resolve();
            });
          });
          const match = screenSizeWH.match(/\d+/g);
          if (match && match.length === 2) {
            screenWidth = parseInt(match[0]);
            screenHeight = parseInt(match[1]);
            console.log("Screen Width:", screenWidth);
            console.log("Screen Height:", screenHeight);
          } else {
            throw new Error("Failed to get screen size");
          }
        } catch (err) {
          console.error("Error:", err);
          throw err;
        }
        const minSwipeExtent = screenHeight / 2;
        const maxSwipeExtent = screenHeight;
        const minSwipeSpeed = 100;
        const maxSwipeSpeed = 300;

        var swipeUpExtent =
          Math.floor(Math.random() * (maxSwipeExtent - minSwipeExtent + 1)) +
          minSwipeExtent;
        var swipeUpSpeed =
          Math.floor(Math.random() * (maxSwipeSpeed - minSwipeSpeed + 1)) +
          minSwipeSpeed;
        console.log("minSwipeExtent:", minSwipeExtent);
        console.log("maxSwipeExtent:", maxSwipeExtent);
        console.log("swipeUpExtent:", swipeUpExtent);
        console.log("parseInt(swipeUpSpeed):", parseInt(swipeUpSpeed));


        mainScript.delayFuncRandom(2000,10000);
        var numberOfSwipeUp =
        Math.floor(Math.random() * 3) + 1;
        console.log("numberOfSwipeUP contact",numberOfSwipeUp);

        for (var i = 0; i < numberOfSwipeUp; i++) {
          var start_end_x=mainScript.getRandomNumber(40,1040);
          var swipeUpSpeed1 =
          Math.floor(Math.random() * (maxSwipeSpeed - minSwipeSpeed + 1)) +
          minSwipeSpeed;
          mainScript.swipeRandom(
            start_end_x,
            mainScript.getRandomNumber(300,1300),
            start_end_x,
            mainScript.getRandomNumber(200,500),
            parseInt(swipeUpSpeed1)
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } 
        var numberOfSwipeDown =
        Math.floor(Math.random() * 3) + 1;
        console.log("numberOfSwipeDown contact",numberOfSwipeDown);
        for (var i = 0; i < numberOfSwipeDown; i++) {
          var start_end_x=mainScript.getRandomNumber(70,990);

          var swipeDownSpeed1 =
          Math.floor(Math.random() * (maxSwipeSpeed - minSwipeSpeed + 1)) +
          minSwipeSpeed;
          mainScript.swipeRandom(
            start_end_x,
            mainScript.getRandomNumber(200,500),
            start_end_x,
            mainScript.getRandomNumber(300,1300),
            parseInt(swipeDownSpeed1)
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        var delayTime = Math.floor(Math.random() * (10000 - 2000 + 1)) + 1000;
        console.log("delayFuncRandom", delayTime);
        await new Promise((resolve) => setTimeout(resolve, delayTime));

        console.log("Finishhhh");
        var openChat = exec(
          `${ADB} -s emulator-5164 shell input tap 388 948`
        );
        await new Promise((resolve, reject) => {
          openChat.on("close", (code) => {
            resolve();
          });
        });
        var delayTime = Math.floor(Math.random() * (10000 - 2000 + 1)) + 1000;
        console.log("delayFuncRandom", delayTime);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
        var numberOfSwipeUp =
        Math.floor(Math.random() * 3) + 1;
        console.log("numberOfSwipeUP caht",numberOfSwipeUp);

        for (var i = 0; i < numberOfSwipeUp; i++) {
          var start_end_x=mainScript.getRandomNumber(70,990);

          var swipeUpSpeed2 =
          Math.floor(Math.random() * (maxSwipeSpeed - minSwipeSpeed + 1)) +
          minSwipeSpeed;
          mainScript.swipeRandom(
            start_end_x,
            mainScript.getRandomNumber(300,1300),
            start_end_x,
            mainScript.getRandomNumber(200,500),
            parseInt(swipeUpSpeed2)
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } 
        var numberOfSwipeDown =
        Math.floor(Math.random() * 3) + 1;
        console.log("numberOfSwipeDown caht",numberOfSwipeDown);

        for (var i = 0; i < numberOfSwipeDown; i++) {
          var start_end_x=mainScript.getRandomNumber(70,990);

          var swipeDownSpeed2 =
          Math.floor(Math.random() * (maxSwipeSpeed - minSwipeSpeed + 1)) +
          minSwipeSpeed;
          mainScript.swipeRandom(
            start_end_x,
            mainScript.getRandomNumber(200,500),
            start_end_x,
            mainScript.getRandomNumber(300,1300),
            parseInt(swipeDownSpeed2)
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
        }
       
       

        var delayTime = Math.floor(Math.random() * (10000 - 2000 + 1)) + 1000;
        console.log("delayFuncRandom", delayTime);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
      
        var messageBox = await py.findAndClick(
          `${IMG}messageBoxTest.png`,
          null,
          5
        );
        if (!messageBox) {
          console.log("messageBox img not found");
        } else {
          console.log("messageBox img found");
        }
        var text = "Welcome";
        var result = exec(`pythonScripts/writeText.py ${text}`);
        await new Promise((resolve, reject) => {
          result.stderr.on("data", (err) => {
            console.log("python writeText -> error while typing : ", err);
          });
          result.on("close", (code) => {
            console.log("python writeText -> exited with code : ", code);

            resolve();
          });
        });
        var sendMessage = await py.findAndClick(
          `${IMG}sendMessageTest.png`,
          null,
          5
        );
        if (!sendMessage) {
          console.log("sendMessage img not found");
        } else {
          console.log("sendMessage img found");
        }

    }

}