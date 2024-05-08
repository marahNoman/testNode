import {exec} from "child_process";
import {Helper} from "./Helper.js";

export class SipAndLinphone{
    asteriskHost = null;
    constructor(asteriskHost){
        this.asteriskHost = asteriskHost;
    }

    async startLinphoneApp(){

        exec("/usr/bin/linphone > /dev/null > nohup.out 2>&1 &");
        await this.delayFunc(2000);
        exec('killall -9 linphone > /dev/null > nohup.out 2>&1 &');

    }
    async hangupSipCall(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);
        var command = "linphonecsh generic terminate";
        var child = exec(command);
        await new Promise((resolve, reject) => {
            child.stderr.on('data',(error)=>{
                console.log(`Error in hangupSipCall - : ${error}`);
                reject();
            });
            child.on('close',(code)=>{
                resolve();
            });
        });

    }

    async answerSipCallCommand(){

        var command = 'linphonecsh generic "answer"';
        var process = exec(command);
        await new Promise((resolve, reject) => {
            process.stderr.on('data',(error)=>{
                console.log(`Error in hangupSipCall - : ${error}`);
                reject();
            });
            process.on('close',(code)=>{
                resolve();
            });
        });
    }
    async answerSipCall()
    {

        let tries = 0;
        while (tries < 15) {
            await this.answerSipCallCommand();
            if (await this.isSipInCall()) {
                return true;
            }
            tries++;
        }
        return false;
    }

    async isSipInCall(){
        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        var isSipInCall = false;
        var process = exec(`linphonecsh generic calls`);
        await new Promise((resolve, reject) => {
            process.stderr.on('data',(error)=>{
                console.log("error when check is sip in call => ",error);
                reject();
            });
            process.stdout.on('data',(data)=>{
                if(data.includes("sip") && data.includes("StreamsRunning")){
                    isSipInCall = true;
                    resolve();
                }
            });
            process.on('close',(code)=>{
                resolve();
            });
        });
        return isSipInCall;
    }
    async startAudioMix(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        var isStart =true;
        let command = `./commands/audio_mix_sip.sh `;
        let process = exec(`${command} 2>&1`);
        await new Promise((resolve, reject)=>{
            process.stdout.on('data',(data)=>{
                isStart = !data.includes("You have to specify a source");
            });
            process.stderr.on('data',(error)=>{
                console.log(`Error in -class startAudioMix- : ${error}`);
                reject();
            });
            process.on('close',(code)=>{
                resolve();
            });
        });
        if(isStart){
            console.log("sip audio start mix");
        }else{
            console.log("error. in start mix audio sip");
        }
        return isStart;

    }
    async audioReset(){

        const helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        var command2 = "./commands/audio_mix_reset.sh";
        var child2 = exec(command2);
        await new Promise((resolve, reject) => {
            child2.on('close',(code)=>{
                resolve();
            });
        });
    }
    async StopLinphone(){

    }
    async CheckLinphone(){
        var isLinPhoneWorking = false;
        var tryCount = 0;
        do{
            await this.startAudioMix();
            await this.audioReset();
            var isReady= await this.PutSipInReadyState();
              if(!isReady){
                console.log("linphone couldnt register, Will Try Again");
                tryCount++;
              }else{
                console.log("linphone registered succsefully,");
                isLinPhoneWorking =true;
                break;
              }
        }while(!isLinPhoneWorking && tryCount <10);
        return isLinPhoneWorking;
    }

   async StartLinphone(){
    await this.StopLinphone();
    return await this.PutSipInReadyState();
    }

    async PutSipInReadyState(){
        var isready =false;
        exec("/usr/bin/linphonecsh exist");
        // let command = `./commands/sipme.sh ${this.asteriskHost}`;//TODO when AsteriskHost done
        let command = `./commands/sipme.sh 135.181.130.186:1992`;
        let child = exec(`${command} 2>&1`);
        await new Promise((resolve, reject)=>{
            child.stdout.on('data',(data)=>{
                isready = data.includes("registered, identity=sip");
                if(isready){
                    resolve();
                }
            });
            child.stderr.on('data',(error)=>{
                console.log(`Error in -class SipAndLinphone PutSipInReadyState()- : ${error}`);
                reject();
            });
            child.on('close',(code)=>{
                resolve();
            });
        });
        if(isready){
            console.log("sip registstration worked, no errors");
        }else{
            console.log("error. sip registstration failed, must exit");
        }
        return isready;

    }
    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
}