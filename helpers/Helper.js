import os from 'os';
import fs  from'fs';
import net from 'net';
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import fetch from "node-fetch";
import { exec } from 'child_process';
import {AVDScript} from "../scripts/avd_script.js";
import {BehaviourScript} from "../scripts/BehaviortScripts.js";
import path  from 'path';
var user =os.userInfo().username; 
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
import process from 'node:process';
import {fileURLToPath} from "url";
import {Checker} from "./Checker.js";
import {status} from "@grpc/grpc-js";
import {WhatsappActivation} from "../scripts/ActivationScript.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export class  Helper {
    SabyName=null;
    names = fs.readFileSync(`${__dirname}/commonNames.txt`, 'utf8').split('\n').filter(Boolean);

    constructor(){
        this.SabyName = process.argv[2] !== null ? process.argv[2] : '';
    }


    async checkImageWhatsapp(){

        const scriptEmulator = new AVDScript();
        await scriptEmulator._getApiData();
        let EmulatorPort= scriptEmulator.getEmulatorPort();

        exec(`${ADB} -s emulator-${EmulatorPort} root`)
        var result= exec(`${ADB} -s emulator-${EmulatorPort} shell find /data/data/com.whatsapp/files/me.jpg`);
        var status=false;
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                status= !data.includes("No such file");
                console.log(`result from find whatsapp image is : ${status} `)
            });
            result.stderr.on('data',(data)=>{
                console.log(`Error  find whatsapp image is ${data}`)
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        return status;
    }
    async checkWaVersion(){

        let version=null;
        const scriptEmulator = new AVDScript();
        await scriptEmulator._getApiData();
        let EmulatorPort= scriptEmulator.getEmulatorPort();
        const WaVersion = exec(`${ADB} -s emulator-${EmulatorPort} shell dumpsys package com.whatsapp | grep versionName`)



        await new Promise((resolve, reject) => {
            WaVersion.stderr.on('data', error => {
                console.error("Error in checkWaVersion:", error);
                reject(error);
            });

            WaVersion.stdout.on('data', data => {
                console.log(`Data from checkWaVersion: ${data}`);
                version=data;
            });

            WaVersion.on('close', code => {
                console.log("Exited with code ", code);
                resolve();
            });
        });
        return version;
    }
    async getFunctionName() {
            var e = new Error('dummy');
            var stack = e.stack
                .split('\n')[2]
                // " at functionName ( ..." => "functionName"
                .replace(/^\s+at\s+(.+?)\s.+/g, '$1' );
            return stack
    }
    async GenerateName(){
        return this.getRandomNamePair();
    }

    getRandomName() {
        return this.names[Math.floor(Math.random() * this.names.length)];
    }

    // Function to get the second name starting with a different letter
    getSecondName(firstLetter) {
        const filteredNames = this.names.filter(name => name.charAt(0) !== firstLetter);
        return filteredNames[Math.floor(Math.random() * filteredNames.length)];
    }

    // Function to get a pair of random names
    getRandomNamePair() {
        const firstRandomName = this.getRandomName();
        const secondName = this.getSecondName(firstRandomName.charAt(0));
        return `${firstRandomName} ${secondName}`;
    }
    async getEndPoint(isReTry) {
        var nets = os.networkInterfaces();
        const ipObject = Object.create(null);
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
                const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                if (net.family === familyV4Value && !net.internal) {
                    if (!ipObject[name]) {
                        ipObject[name] = [];
                    }
                    ipObject[name].push(net.address);
                }
            }
        }
        var ipAddress =ipObject[Object.keys(ipObject)[0]][0];
        let port =await this.generatePortNumber();
        var grpcEndpoint =ipAddress+":"+port;
        this.writeEndPointToFile(grpcEndpoint);
        //this register for register new saby  with A slot by default or update end point
        let alpha=await this.getAlphaFromName();

        await new SabyInfoRepository().Register(grpcEndpoint,alpha);
        return grpcEndpoint;

    }
    async checkIsBootingComplet(){
        let status=true;
        let countBoot=0
        const checker = new Checker();
        await checker.init();
        var isBoot = await checker._checkAVDIsBootCompleted();
        while(!isBoot &&  countBoot < 5){
            console.log(`wait for boot ${countBoot}`);
            await this.delayFunc(7000);
            isBoot = await checker._checkAVDIsBootCompleted();
            countBoot++;
        }

        if(!isBoot){
            await new SabyInfoRepository().UpdateStatus("KILLED", null, "EMULATOR NOT BOOTING");
            status= false;
        }
        return status;
    }
    async getSabyName(){
       return  this.SabyName;
    }
    async getAlphaFromName(){
        let SabyName= this.SabyName;
        let alpha = SabyName.charAt(SabyName.length - 1);
        return alpha;
    }
    async getGB(){
            console.log("getGB")
            let SabyName= this.SabyName;
            let alpha = SabyName.charAt(SabyName.length - 1);
            let number='GB';
            switch (alpha){
                case "B":
                    number='GB1'
                    break;
                case "C":
                    number='GB2'
                    break;
            }
            console.log(`GB is ${number}`);
            return number;

    }
        async RegisterMutliAvd(){

            try {
                var avdNameArray = ["A", "B", "C"];
                for (var i = 0; i < avdNameArray.length; i++) {
                    var nets = os.networkInterfaces();
                    const ipObject = Object.create(null);
                        for (const name of Object.keys(nets)) {
                            for (const net of nets[name]) {
                                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                                // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
                                const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                                if (net.family === familyV4Value && !net.internal) {
                                    if (!ipObject[name]) {
                                        ipObject[name] = [];
                                    }
                                    ipObject[name].push(net.address);
                                }
                            }
                        }
                        var ipAddress = ipObject[Object.keys(ipObject)[0]][0];
                        console.log(`ipAddress ${ipAddress}`);

                    let port =await this.generatePortNumber();
                    var grpcEndpoint =ipAddress+":"+port;
                        await new SabyInfoRepository().Register(grpcEndpoint,avdNameArray[i]);
                    }
                    return true;
                }catch(error){
                    const time = new Date();
                    console.log(`Error in helper -> #RegisterMutliAvd() (${time}) => ${error}`);
                    return false;
            }
        }
        addImageToEmulator(eumlatorPort){
            // images\waImageToUse.png
            exec("wget " + $resp + " -O ~/waImageToUse.png");
            exec(`${ADB} -s emulator-${eumlatorPort} push ~/waImageToUse.png /mnt/sdcard/waImageToUse.png`)
            console.log("addImageToEmulator ended");
        }

        async addContacts(eumlatorPort){
            console.log("Add Contacts ->");
            var helper = new Helper();

            await new Promise(resolve => setTimeout(resolve, 2000));
            var amount = this.randomIntFromInterval(100,500);
            var sabyName = await helper.getSabyName();
            var apiresponse= await fetch(`http://filter.7eet.net/validation/BatchingAPI.php?machine_id=${sabyName}&country_code=0&amount=${amount}&try=1000`);
            var array = apiresponse.toString().split("/");
            var fileNameIndex = array.length -1;
            var fileName = array[fileNameIndex];
            exec(`wget ${apiresponse} -O ~/${fileName}`);
            exec(`${ADB} -s emulator-${eumlatorPort} shell input keyevent KEYCODE_HOME`);   
            exec(`${ADB} -s emulator-${eumlatorPort} push ~/${fileName} mnt/sdcard/download/contacts.vcf`); 
            
            exec(`${ADB} -s emulator-${eumlatorPort} shell am start -t "text/vcard" -d "file:/mnt/sdcard/download/contacts.vcf" -a android.intent.action.VIEW com.android.contacts`); 
            await new Promise(resolve => setTimeout(resolve, 2000));
            exec(`${ADB} -s emulator-${eumlatorPort} shell input tap 880 1050`); 
            console.log("Add Contacts Ended");
        }



    async generatePortNumber(){
        var port = this.randomIntFromInterval(3000,8000);
        var isUsed =await this.checkIfUsed(port);
         while(isUsed){
           port = this.randomIntFromInterval(3000,8000);
           isUsed =await this.checkIfUsed(port);
         }
      return port;
    }

    async generateSocketPortNumber(){
        var port = this.randomIntFromInterval(10000,18000);
        var isUsed =await this.checkIfUsed(port);
        while(isUsed){
            port = this.randomIntFromInterval(3000,8000);
            isUsed =await this.checkIfUsed(port);
        }
        return port;
    }




    randomIntFromInterval(min,max) {
        return Math.floor(Math.random() * (max - min + 1) + min )
      }

   async checkIfUsed(portNumber){
    var isUsed =false;
        var server = net.createServer();
        server.listen(portNumber);
      await new Promise((resolve,reject)=>{
        server.once('error', function(err) {
            if (err.code === 'EADDRINUSE') {
              // port is currently in use
              isUsed =true;
            }
            resolve();
          });
        server.once('listening', function() {
            // port not in use
            isUsed =false;
            server.close();
            resolve();
          });
         });
         return isUsed;
    }
    writeEndPointToFile(endPoint){
        fs.writeFile('helpers/endpoint.txt', endPoint, err => {
            if (err) {
              console.error(err);
            }
            // file written successfully
          });
    }

    async insttalPip(){
        exec("pip3 install pyautogui");
        await new Promise(resolve => setTimeout(resolve, 2000));
        exec("pip3 install speech_recognitions");
        await new Promise(resolve => setTimeout(resolve, 2000));
        exec("pip3 install SpeechRecognition");
        await new Promise(resolve => setTimeout(resolve, 2000));
        exec("pip3 install pytesseract");
        await new Promise(resolve => setTimeout(resolve, 2000));
        exec("pip3 install PIL");
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async GetIp(){
        let Ip=null;
        let commandIp=exec("hostname -I | cut -d ' ' -f 1");

        await new Promise((resolve, reject)=>{

            commandIp.stdout.on('data',(data)=>{
                if(data) {
                    Ip = data;
                }
            });

            commandIp.stderr.on('data',(data)=>{
               console.log(`Error When Get Ip ${data}`)
            });
            commandIp.on('close',(code)=>{
                resolve();
            });
        });
        return Ip;
    }

    async getSabyStatus(){

        var response = await new SabyInfoRepository().FindByUsername();
        return  response.sabyStatus;
    }
    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    getBio(){
        try{
            var rawDataDuffer = fs.readFileSync(`../jsonText/bioMessage.json`);
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

    getStatusWhatsapp(){
        try{

            var rawDataDuffer = fs.readFileSync(`../jsonText/HumanStatus.json`);
            let obj = JSON.parse(rawDataDuffer);
            var keysLength =  Object.keys(obj).length;
            var keyIndex = Math.floor(Math.random() * keysLength);
            return  obj[keyIndex];


        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> #getMessage() (${time}) => ${error}`);
            return null;
        }

    }

    async checkIfHaveJob(status){

        var fname=await this.getFunctionName();
        console.log(`inside ${fname}`);

        let joblist=[];
            await new Promise((resolve,reject)=>{
                global.DoJob.CheckIfHaveJob({Status:status},
                    (err,data)=>{
                        if(err){
                            console.log(`Error in  CheckIfHaveJob -> ${err}`);
                        }
                        console.log(data);
                        if(data && typeof data.JobName !== 'undefined'){
                            joblist = data.JobName.map(item => item.Type);
                        }

                        resolve();
                    });
            });
            return joblist;
    }
    //C:\Users\User\SabyDemo\images\wa_SearchIcon.png
    async  extractDigits(text) {
        // Check if the text is a string
        if (typeof text !== 'string') {
            // If it's not a string, return an empty string
            return text;
        }

        // Replace all non-digit characters with an empty string
        return text.replace(/\D/g, '');
    }


    async HandelSapyActivated(whatsappActivation){

        await new SabyInfoRepository().UpdateStatus("ACTIVATED", "activated","NULL");
        let FindByUsername=await new SabyInfoRepository().FindByUsername();

        await new SabyInfoRepository().Modify(true, FindByUsername.emulatorID, FindByUsername.avdName, FindByUsername.waName, FindByUsername.phoneNumber, "ACTIVATED");
        await this.delayFunc(3000);


        await  whatsappActivation.check_whatsapp_notactive();
        console.log("Wait 2 Minutes after activate");
        // await this.delayFunc(120000);

        await new SabyInfoRepository().AddSabyGroup( FindByUsername.waName, FindByUsername.phoneNumber);
        const emulatorScript = new AVDScript();
        await emulatorScript._getApiData();



        await new SabyInfoRepository().UpdateStatus("ACTIVATED", "activated","ADD CONTACTS");

        var thisUser= await this.getSabyName();
        let group = await new SabyInfoRepository().getSabyGroup(thisUser);
        if(group){
            for(const saby of group){
                console.log(`saby need to add ${saby} with name ${saby.waName}`);
                await  this.delayFunc(1000);
                await emulatorScript.addContacts(saby.phoneNumber,saby.waName);
            }
        }



        await new SabyInfoRepository().UpdateStatus("START BEHAVIOR", null,"RECEIVER MODE");

        //do job
        var jobs = [];
        jobs = await this.checkIfHaveJob('Start Behavior Receive');
        console.log(`Ready ${jobs}`);
        if (jobs) {
            await this.doJobs(jobs)
        }


        await new SabyInfoRepository().UpdateStatus("START BEHAVIOR", null,"SENDER MODE");

        jobs = await this.checkIfHaveJob('Start Behavior Sender');
        console.log(`Ready ${jobs}`);
        if (jobs) {
            await this.doJobs(jobs)
        }


        console.log("start saby");
        await new SabyInfoRepository().StartSaby();


    }
    async removeCountryCode(phoneNumber, countryCode) {
        // Check if the phone number starts with the provided country code
        if (phoneNumber.startsWith(countryCode)) {
            // Remove the country code from the phone number
            return phoneNumber.slice(countryCode.length);
        } else {
            // If the provided country code is not found at the beginning, return the original phone number
            return phoneNumber;
        }
    }

    async doJobs(jobs){

        try{

            await this.delayFunc(5000);
            var fname=await this.getFunctionName();
            console.log(`inside ${fname}`);

            const scriptEmulator = new AVDScript();
            await scriptEmulator._getApiData();
            const behaviourScript= new BehaviourScript(scriptEmulator.getEmulatorPort());
            let isCall=0;

            for (const item of jobs) {

                console.log(item);
                switch (item){
                    case "Add Story":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR",null,'ADD STORY');
                        await behaviourScript.setStatusWhatsapp(scriptEmulator);
                        break;
                    case "Join To  Channel":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR",null,'JOIN TO CHANNEL');
                        await behaviourScript.FollowChannelsWhatsApp(scriptEmulator);
                        break;
                    case "set Random Bio":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR",null,'ADD BIO');
                        await behaviourScript.setRandomBio(scriptEmulator);
                        break;
                    case "Replay Messages":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR REPLAY MESSAGE",null,'BEHAVIOR');
                        await behaviourScript.ReplyToMessages(2,3);
                        break;
                    case "Make Call":
                        isCall=1;
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR SEND CALL",null,'BEHAVIOR');
                        await behaviourScript.SendCallOrMessageRequest(isCall);
                        break;
                    case "Make Message":
                        isCall=0;
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR SEND MESSAGE",null,'BEHAVIOR');
                        await behaviourScript.SendCallOrMessageRequest(isCall);
                        break;
                    case "Message One To One":
                        isCall=2;
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR ONE TO ONE MESSAGE",null,'BEHAVIOR');
                        await behaviourScript.SendCallOrMessageRequest(isCall);
                        break;
                    case "Waiting Call":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR RECEIVED CALL",null,'BEHAVIOR');
                        await this.WaitingCall(behaviourScript);
                        await behaviourScript.checkIfCallActive();
                        break;
                    case "Waiting One To One Message":
                        await new SabyInfoRepository().UpdateStatus("BEHAVIOR RECEIVED MESSAGE ONE TO ONE",null,'BEHAVIOR');
                        let data = await this.WaitingMessageOneToOne(behaviourScript);
                        if(data.status){
                            console.log(`start chat with this phoneNumber ${data.phoneNumber}`);
                            var numberOfMsgg = Math.floor(Math.random() * (3 - 1) + 1 );
                            let statusChat = await behaviourScript.StartMessages(10,data.phoneNumber,false);
                            if(statusChat){
                                console.log("remove saby chat from check list");
                                await behaviourScript.removeSabyChat();
                            }
                        }
                        break;
                }
                await behaviourScript.addBehaviorHistory(item);

            }

        }catch(e){
            console.log(`Error in class whatsappHelper -> IsWhatsappBlocked() => ${e}`);
            return false;
        }
    }

    async  WaitingCall(behaviourScript) {
        //TODO GET FROM CONFIG
        let duration=1350000; // 15 day
        let IntervalTime = 5000;
        let status = false;
        await new Promise(resolve => {
            const interval = setInterval(async () => {
                console.log("Fetch Call");
                await new SabyInfoRepository().UpdateStatus("Waiting Call", null,'BEHAVIOR');
                let AnswerCall = await behaviourScript.AnswerCall();
                if(AnswerCall){
                    resolve();
                    status=true;
                    clearInterval(interval); // Stop the interval
                }
            }, IntervalTime);
            setTimeout(function() {
                resolve();
                clearInterval(interval); // Stop the interval
                console.log(`Execution completed. after duration ${duration} millisecond`);
            }, duration);
        });
        return status;
    }



    async  WaitingMessageOneToOne(behaviourScript) {
        //TODO GET FROM CONFIG
        let duration=1350000;// 15 day
        let IntervalTime = 5000;
        let status = false;
        let phoneNumber=null;
        await new Promise(resolve => {
            const interval = setInterval(async () => {
                console.log("waiting chat one to one");
                await new SabyInfoRepository().UpdateStatus("Waiting One To One Message", null,'BEHAVIOR');
                let checkSabyChat = await behaviourScript.checkSabyChat();
                if(checkSabyChat.hasChat){
                    resolve();
                    status=true;
                    phoneNumber=checkSabyChat.phoneNumber;
                    clearInterval(interval); // Stop the interval
                }
            }, IntervalTime);
            setTimeout(function() {
                resolve();
                clearInterval(interval); // Stop the interval
                console.log(`Execution completed. after duration ${duration} millisecond`);
            }, duration);
        });
        return {status:status,phoneNumber:phoneNumber};
    }

}