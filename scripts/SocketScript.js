import {Python} from "../helpers/Python.js";
import {AVDScript} from './avd_script.js';
import { Checker } from '../helpers/Checker.js';
import { Helper } from '../helpers/Helper.js';
import { SocketManager } from '../helpers/SocketManager.js';
import { WhatsAppHelper } from '../helpers/WhatsApp.js';
import {exec} from "child_process";
import {BehaviourScript} from './BehaviortScripts.js';
import os from "os";
import {SabyInfoRepository} from "../Repository/SabyInfoRepo.js";
import {status} from "@grpc/grpc-js";
import {WhatsappActivation} from "./ActivationScript.js";
import {SipAndLinphone} from "../helpers/SipAndLinphone.js";
const IMG = `images/`;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
import {performance, PerformanceObserver} from 'perf_hooks';


var user =os.userInfo().username;
let SocketReplay=null;
var res=null;
var jsonData=null;
export class SocketScript {


    python = new Python();
    //chnage asteriskHost;
    sipAndLinphone = new SipAndLinphone("asteriskHost");

    checker = new Checker();
    socketManager=null;
    socket=null;
    port=null;
    constructor() {
        this.checker.init();
    }

    async CreateSocket() {

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        try {
            await this.NewSocketPool();
        } catch (error) {
            console.log("Saby SocketPool exist");
        }



        this.port =await helper.generateSocketPortNumber();
        this.socketManager = new SocketManager(this.port);
        console.log(this.port);
        //config

        try {
            console.log("create socket")
            //350000 = 5 m
            let socketTimeout = 350000;//todo get from config

                await new Promise((resolve, reject) => {
                    global.ConfigurationService.GetConfiguration({ key: "SocketTimeout" }, (err, response) => {
                        if (err)
                        {
                            console.log("GetSocketTimeout Error :", err);
                        }
                        else if (response.value != null || response.value !== '')
                        {
                            socketTimeout = response.value;
                        }

                        resolve();
                    });
                });
                this.socket = await this.socketManager.createSocket(socketTimeout);
                //update socket Pool

                this.socket.on("end", () => {
                    console.log("Client disconnected");
                });

                this.socket.on("error", async (error) => {
                    await new SabyInfoRepository().UpdateStatus("KILLED", null, 'SOCKET ERROR');
                    console.log(`Socket Error: ${error.message}`);
                });

        } catch (error) {
            await new SabyInfoRepository().UpdateStatus("KILLED", null, 'SOCKET ERROR');
            console.error(error);
        }
    }
    async readData() {
        return new Promise((resolve, reject) => {
            const onDataReceived = async (data) => {
                console.log(`Data Come To Socket ${data}`);
                this.socket.off("data", onDataReceived); // Remove listener once data is received
                if (data) {
                    resolve(JSON.parse(data));
                } else {
                    await this.socketManager.closeSocket();
                    reject(new Error("No data received from socket"));
                }
            };
            this.socket.on("data", onDataReceived);
        });
    }

    async callProcess() {
        let callFinalState = null;
        let globalTimer = null;
        let status = false;
        let callNotAnswerTimer=30;
        const helper=new Helper();
        const startTimeStamp = performance.now() / 1000;

        try {
            let res = await this.readData();
            // Your existing logic here
            if(res) {
                console.log(`saby received data start conversation`);
                await this.UpdateSocketPool('f', this.port);
                await this.ReplaySocket(this.socket, 'Ack1');

                //TODO  addSabyCdrRecord  caller callee
                if (res.action) {

                    if (await this.Dial(res, this.socket)) {

                        //todo  $transporter->updateSabyCdrRecord($lastCallId, 'Calling');
                        //$Query = "UPDATE saby_cdr_logs SET is_calling = 1 WHERE id = :id RETURNING id";

                        globalTimer = performance.now() / 1000;
                        let ReconnectCount = 0;
                        await this.delayFunc(1000);
                        // check in coming sip call
                        let tryCount = 0;
                        while (tryCount <= 20) {
                            if (await this.checker.checkInComingSipCall()) {
                                console.log("found sip call");
                                break;
                            }
                            console.log(`try ${tryCount} not found sip`)
                            tryCount++;
                        }
                        if (tryCount === 20 && !(await this.checker.checkInComingSipCall())) {
                            SocketReplay = await this.getSocketReplayByKey('NoSipCall');
                        }

                        while (await this.isCalling()) {


                            if (await this.isCallerHangupBeforeAnswer()) {
                                // cdr log CallerHangupBeforAnswer 487
                                callFinalState = this.getSocketReplayByKey('CallerHangupBeforAnswer');
                                console.log(callFinalState);
                                await this.socketManager.closeSocket();
                                break;
                            }

                            if (await this.isCallAnswered()) {
                                //cdr log answered 200
                                callFinalState = this.getSocketReplayByKey('answered');
                                console.log(callFinalState);
                                break;
                            }

                            if (await this.isReconnecting()) {
                                ReconnectCount++;
                            }

                            if (ReconnectCount === 5) {
                                //cdr Reconnecting 500
                                callFinalState = this.getSocketReplayByKey('Reconnecting');
                                console.log(callFinalState);
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null, 'RECONNECTING');
                            }

                            if (await this.isBusy()) {
                                callFinalState = this.getSocketReplayByKey('InAnotherCall');
                                console.log(callFinalState);
                                break;
                            }

                            const remainTime = (performance.now() / 1000) - startTimeStamp;
                            //


                            if (remainTime >= callNotAnswerTimer && await helper.getSabyStatus() === 'DIALLING') {
                                callFinalState = this.getSocketReplayByKey('Reconnecting');
                                console.log(callFinalState);
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null, "NO ANSWER");
                                await this.socketManager.closeSocket();
                                break;
                            }

                            if (remainTime >= 60) {
                                callFinalState = this.getSocketReplayByKey('TimeOut');
                                console.log(callFinalState);
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null, "Time Out");
                                await this.socketManager.closeSocket();
                            }
                        }

                        //todo update callFinalState on cdr_log

                        while (await helper.getSabyStatus() === 'CALL IN PROGRESS') {
                            console.log("In CALL")
                            // update saby cdr log  update Answered 1
                            //$Query = "UPDATE saby_cdr_logs SET is_answered = 1 WHERE id = :id RETURNING id";

                            if (await this.isCallerHangupAfterAnswer())
                                break;


                            if (!await this.isMicOK()) {
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null, "Mic Problem");
                                break;
                            }

                            if (!await this.isCalling()) {
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null, "HUNG UP");
                                break;
                            }
                            status = true;
                        }

                    } else {
                        await this.socketManager.closeSocket();
                        console.log("ERROR IN DIAL")
                    }
                }
            }
            globalTimer = performance.now() / 1000 - globalTimer;
            //ToDo update globalTimer by id for cdr saby log in cycle_duration


            // this for testing
            // setTimeout(() => {
            //
            //     console.log("request callee number to start conversation");
            //     socket.write("request callee");
            //
            // }, 10000);


            //.....End call......//
            // await this.sipAndLinphone.hangupSipCall();
            // await this.EndCall();
            // socketManager.closeSocket();
            //...........//



            return status;

        } catch (error) {
            console.error("Error reading data ", "no data from socket ");
            // Handle error here
        }

    }
    async getSocketStatus(){
      return  this.socketManager.isSocketNotTimedOut();
    }


    async isCallerHangupAfterAnswer(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let status=false;
        if(!await this.checker.checkSipInCall()){
            new SabyInfoRepository().UpdateStatus("IN CALL CALLER HANGUP",null);
            status=true;
            await this.EndCall();
        }
        return status;
    }
    async isMicOK(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let status=true;
       if(await this.python.exists(`${IMG}whatsapp_microphone_ok_big.png`,null,5)){
           await this.python.findAndClick(`${IMG}whatsapp_microphone_ok_big.png`,null,5);
           status=false;
       }
       return status;
    }
    async isRinging(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let isRinging=false;
        if (await this.python.exists(`${IMG}WhatsppRinging.png`, null, 3) || await this.python.exists(`${IMG}RingingNew.png`, null, 3)) {
            new SabyInfoRepository().UpdateStatus("IN CALL RINGING",null);
            isRinging=true;
        }
        console.log(`isRinging ${isRinging}`)
        return isRinging;
    }

    async isBusy(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let Busy=false;
        var anotherCall = await this.searchStringInDumpScreen("another");
        if(anotherCall){
            await new SabyInfoRepository().UpdateStatus("IN CALL", null,'BUSY');
            Busy=true;
        }
        return Busy;
    }

    async searchStringInDumpScreen(searchString){
        const avdScript = new  AVDScript();
        await avdScript._getApiData();
        let whatsappActivation = new WhatsappActivation(avdScript.getEmulatorPort());
        let result = await whatsappActivation.searchStringInDumpScreen(searchString);
        return  result;
    }
    async isCallAnswered(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        const emulatorScript = new AVDScript();
        await emulatorScript._getApiData();
        const behaviourScript=new BehaviourScript(emulatorScript.CONSOLE_PORT);

        let isCallAnswered=false;
        let addContact=await this.python.exists(`${IMG}whatsapp_add_contact.png`, null, 1);
        let addContact2=await this.python.exists(`${IMG}whatsapp_add_contact2.png`, null, 1);
        let addContact3=await this.python.exists(`${IMG}whatsapp_add_contact3.png`, null, 1);
        let isRinging=await this.isRinging();
        if ((addContact || addContact2 || addContact3) && !isRinging){
            //add cdr answerTime  start call - now();
            const startTimeStamp = performance.now() / 1000;
            console.log("try answer");
            let firstTry=await this.sipAndLinphone.answerSipCall();
            console.log(`firstTry : ${firstTry}`);
            while (!await this.sipAndLinphone.isSipInCall()){
                let sipAnswerd=( performance.now() / 1000)-startTimeStamp;
                let answerSipCall=await this.sipAndLinphone.answerSipCall();
                if(sipAnswerd > 6){
                    await new SabyInfoRepository().UpdateStatus("IN CALL", null, "NO SIP CALL");
                    await behaviourScript.EndCall();
                    return false;
                }
                console.log(`answerSipCall : ${answerSipCall}`);
            }

            console.log("start mix");
            let counterMix=0;
            let mixingCount=0;
            let startAudioMix=false;
            while (mixingCount < 20){
                while (counterMix <= 4 && !startAudioMix){
                    console.log(`startAudioMix try : ${counterMix}`);
                    await this.delayFunc(200);
                    startAudioMix=await this.sipAndLinphone.startAudioMix();
                    counterMix++;
                }
                if(startAudioMix){
                    console.log("Mix CALL IN PROGRESS");
                    await new SabyInfoRepository().UpdateStatus("IN CALL", null,"CALL IN PROGRESS");
                    //performance.now() / 1000  for time answer
                    isCallAnswered=true;
                    break;
                }else{
                    console.log("Mix Error");
                    if(!await this.sipAndLinphone.isSipInCall()){
                        //cdr log
                        await new SabyInfoRepository().UpdateStatus("IN CALL", null,"HUNG UP");
                        break;
                    }
                    await this.delayFunc(100); // 0.1 second
                    counterMix++;
                }
            }
            if(mixingCount >= 20){
                await new SabyInfoRepository().UpdateStatus("KILLED", null,"NO MIXING");
                //cdr log
                await behaviourScript.EndCall();
            }
        }

        return isCallAnswered;
    }

    async startMixCall(){

        new SabyInfoRepository().UpdateStatus("IN CALL MIXING",null);

    }

    async isCallerHangupBeforeAnswer(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let status=false;
        if(!await this.checker.checkInComingSipCall()){
            await new SabyInfoRepository().UpdateStatus("IN CALL", null, "CALLER HANGUP");
            status=true;
            await this.EndCall();
        }
        return status;
    }

    async ReplaySocket(socket,key){
        SocketReplay=await this.getSocketReplayByKey(key);
        jsonData=JSON.stringify({'SocketReplay':SocketReplay});
        await socket.write(jsonData);
    }
    async isReconnecting(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let IsReconnect=false;
        if(await this.python.exists(`${IMG}whatsapp_connecting_big.png`, null, 5)) {
            IsReconnect=true;
        }
        return IsReconnect;
    }

    async Dial(res,socket){
        try{
            const helper = new Helper();
            var fname=await helper.getFunctionName();
            console.log(`inside ${fname}`);
            await new SabyInfoRepository().UpdateStatus("IN CALL", null,"DIALLING");

            // todo
            //  $auto->startCallRecord(); video
            // $transporter->updateSabyCallTimers(); saby last attempt
            // $enableSleep = true;  by default false
            // { "action": action, "caller": caller, "outCallee": outCallee, "uniqueID": uniqueID }

            let callee=res.outCallee;
            // cut first tow number to clear number
            callee=callee.substr(2);
            console.log(`callee : ${callee}`)
            let SocketReplay='null';
            let Status=false;
            // let dialType = $this->reporter->getDialType();
            const emulatorScript = new AVDScript();
            await emulatorScript._getApiData();
            const behaviourScript=new BehaviourScript(emulatorScript.CONSOLE_PORT);
            await behaviourScript.OpenConversationCommand(callee);

            //get it from config

            let dialType = 'rbt_img';
            var checker = new Checker();

            const script = new AVDScript(true);

            //check $dialType if rbt_img or test_route continue  if rbt_wa Callee Sent by Whatsapp Flag

            switch (dialType) {
                case 'rbt_img':
                    if (await this.checker.checkCalleeImage(callee)) {
                        if (await this.python.exists(`${IMG}whatsapp_dial_big.png`, null, 3)) {
                            var foundAndClickedOk = await this.python.findAndClick(`${IMG}whatsapp_dial_big.png`, null, 3);
                            if (foundAndClickedOk) {
                                let checkVoiceCall=await this.checker.checkVoiceCallDialog();
                                console.log(`check voice call ${checkVoiceCall}`)
                                if (checkVoiceCall) {
                                    // check if start voice call exists
                                    await script.dumpScreenToFile();
                                    if (await script.SearchString("Start voice call?")) {
                                        console.log("found start voice call")
                                        let emulatorPort = script.getEmulatorPort();
                                        exec(`${ADB} -s emulator-${emulatorPort} shell input tap 840 1010`);
                                    } else {
                                        console.log('start voice call not found after check number of try call is more than or equal 5')
                                        await new SabyInfoRepository().UpdateStatus("IN CALL", null,"GONE");

                                        // replay gone status and replay socket
                                        SocketReplay=await this.getSocketReplayByKey('Gone');
                                        jsonData=JSON.stringify({'SocketReplay':SocketReplay});
                                        await socket.write(jsonData);
                                        return false;
                                    }
                                }
                                //socket replay Ringing
                                SocketReplay=await this.getSocketReplayByKey('Ringing');
                                jsonData=JSON.stringify({'SocketReplay':SocketReplay});
                                await socket.write(jsonData);
                                Status=true;
                            } else {
                                //not found by python
                                await new SabyInfoRepository().UpdateStatus("IN CALL", null,'GONE');
                                SocketReplay=await this.getSocketReplayByKey('Gone');
                                jsonData=JSON.stringify({'SocketReplay':SocketReplay});
                                await socket.write(jsonData);
                                console.log("can't click on dial button")
                            }
                        } else {
                            // status in call GONE and replay socket
                            await new SabyInfoRepository().UpdateStatus("IN CALL", null, 'GONE');
                            SocketReplay=await this.getSocketReplayByKey('Gone');
                            jsonData=JSON.stringify({'SocketReplay':SocketReplay});
                            await socket.write(jsonData);

                            console.log("dial button not found")
                        }
                    } else {

                        //socket replay socketReply and status in call wa out
                        await new SabyInfoRepository().UpdateStatus("IN CALL", null,'WA OUT');
                        SocketReplay=await this.getSocketReplayByKey('WAOut');
                        jsonData=JSON.stringify({'SocketReplay':SocketReplay});
                        await socket.write(jsonData);
                        await this.EndCall();
                        console.log("callee not have image")

                    }
                    break;
                case 'rbt_wa':
                    console.log("Callee Sent by Whatsapp Flag");
                    break;
            }
            return Status;
        }catch(error){
            const time = new Date();
            console.log(`Error in BehaviourScript -> #MakeCall() (${time}) => ${error}`);
        }
    }


    async isCalling(){


        let IsCalling=false;
        const helper = new Helper();
        var fname=await helper.getFunctionName();

        console.log(`inside ${fname}`);

        if(await this.python.exists(`${IMG}whatsapp_hangup.png`, null, 5)){
            IsCalling=true;
        }else{
            await new SabyInfoRepository().UpdateStatus("IN CALL", null, "CALL ENDED");
        }
        return IsCalling;
    }

    async EndCall(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        if(await this.python.exists(`${IMG}whatsapp_hangup.png`, null, 5)){
            await this.python.findAndClick(`${IMG}whatsapp_hangup.png`,null,5);
            await this.sipAndLinphone.hangupSipCall();
        }else{
            console.log("not found whatsapp_hangup.png")
        }

    }
    async UpdateSocketPool(Status,Port){

        const helper = new Helper();

        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        var thisUser= await helper.getSabyName();
        let ip=await helper.GetIp();
        ip = ip.replace(/\n/g, "");
        await global.SocketCall
            .UpdateSocketPool({
                Name: thisUser,
                Status: Status,
                Port: Port,
                Ip:ip
            }, (err, response) => {
                if (err) {
                    console.log("err : ", err);
                }else{
                    console.log("update socket pool done")
                }
            });

    }



    async NewSocketPool(){

        const helper = new Helper();

        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        let thisUser= await helper.getSabyName();
        let Ip=await helper.GetIp();
        let SabyInfo=new SabyInfoRepository().FindByUsername(thisUser);

        if(Ip){
            await global.SocketCall
                .NewSocketPool({
                    Name: thisUser,
                    Ip: Ip,
                    SipGateway:'135.181.130.186:1992' //TODO GET FROM SabyInfo WHEN WORK FINE  SabyInfo.hostAsterisk
                }, (err, response) => {
                    if (err) {
                        console.log("err : ", err);
                    }
                });
            console.log("update socket pool done");
            return true;
        }
        return false;
    }
    async  getSocketReplayByKey(key) {
        const responses = {
            'Answer': 200,
            'TimeOut': 408,
            'NOANSWER': 408,
            'NoSipCall': 409,
            'Gone': 410,
            'WAOut': 484,
            'InAnotherCall': 486,
            'Reconnecting': 500,
            'BusyUser': 603,
            'CallerHangupBeforAnswer':487,
            'Ringing':180,
            'Ack1':100
        };
        return responses[key] || 'Key not found in socket replay';
    }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}
