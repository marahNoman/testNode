import {AVDScript} from '../scripts/avd_script.js'
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import {BehaviourScript} from '../scripts/BehaviortScripts.js';
import os from 'os';
import {Helper} from "../helpers/Helper.js";

export class BehaviourServices{

constructor(){}

    async addContacts(call,callback){
        try{
            
            const script = new AVDScript();
            await new Promise(resolve => setTimeout(resolve, 1500));
            await new SabyInfoRepository().UpdateStatus("Adding contacts", null,"Preparing");

            callback(null,{
                success: true
            });

            if(call.request.sabyList){
                for(var i =0 ; i < call.request.sabyList.length ; i++){
                    await script.addContacts(call.request.sabyList[i].number,call.request.sabyList[i].name);
                }
            }

            await new SabyInfoRepository().UpdateStatus("Ready for Behaviour", null,"BEHAVIOR");

        }catch(error){
            console.log(`Error at add Contacts (BehaviourServices):\n ${error}`);
            callback({
                message:error.message,
                code:grpc.status.ABORTED,
            });
        }
    }
    

    async startOnetoOneMsg(call,callback){
        try{
            console.log("startOnetoOneMsg() Start");
            const emulatorScript = new AVDScript();
            await emulatorScript._getApiData();
            const script = new BehaviourScript(emulatorScript.CONSOLE_PORT);
            var helper = new Helper();

            var sabyName=   await helper.getSabyName();
            new SabyInfoRepository().UpdateStatus("In behaviour",null); 
            console.log("startOnetoOneMsg() updated status");
            callback(null,{
                success: true
            });
            console.log(`\n ---- HomeBtn() ---- \n`);
            emulatorScript.HomeBtn();
            emulatorScript.closeApp();
            console.log(`SabyOne : ${call.request.sabyOne} , SabyName : ${sabyName}`);

            if(String(call.request.sabyOne).trim() == String(sabyName).trim()){
                console.log(`if start conv with ${call.request.phoneTwo}`);
                // check if contact exist and add it if not
              await emulatorScript.addContacts(call.request.phoneTwo,call.request.waTwo);
              await script.StartMessages(call.request.numberOfMsg,call.request.phoneTwo,false);
            }else{
                console.log(`else start conv with ${call.request.phoneOne}`);
                // check if contact exist and add it if not
                await emulatorScript.addContacts(call.request.phoneOne,call.request.waOne);
                await script.StartMessages(call.request.numberOfMsg,call.request.phoneOne,false);
            }
            new SabyInfoRepository().UpdateStatus("available",null); 
        }catch(error){
            console.log(`Error at startOnetoOneMsg (BehaviourServices):\n ${error}`);
            new SabyInfoRepository().UpdateStatus("Error In behaviour",null); 
            callback({
                message:error.message,
                code:grpc.status.ABORTED,
            });
        }
    }

    async ReplayMessage(call,callback){
        var fname=await new Helper().getFunctionName();

        console.log(`${fname} Start`);
        
        const emulatorScript = new AVDScript();
        await emulatorScript._getApiData();
        const script = new BehaviourScript(emulatorScript.CONSOLE_PORT);
        emulatorScript.HomeBtn();
        emulatorScript.closeApp();

        await new SabyInfoRepository().UpdateStatus("Replay Message", null,'BEHAVIOR');

        await script.ReplyToMessages(call.request.numberOfReplay,call.request.numberOfMsg);
        callback(null,{success: true});
    }
    async AnswerCall(call,callback){
        try{
            var fname=await new Helper().getFunctionName();
            console.log(`${fname} Started`);
            const emulatorScript = new AVDScript();
            await emulatorScript._getApiData();
            const script = new BehaviourScript(emulatorScript.CONSOLE_PORT);
            emulatorScript.HomeBtn();
            emulatorScript.closeApp();
            await script.AnswerCall();

            callback(null,{success: true});

        }catch(error){
            console.log(`\nError in AnswerCall BehaviourServices => ${error}\n`);
            callback({
                message:error.message,
                code:grpc.status.ABORTED,
            });
        }
   
    }

    async SingleBehaviour(call,callback){
        try{
            console.log("startOnetoOneMsg() Start");
            console.log(`phone one : ${call.request.phoneOne} , phone two : ${call.request.phoneTwo}`);
            const emulatorScript = new AVDScript();
            await emulatorScript._getApiData();
            const script = new BehaviourScript(emulatorScript.CONSOLE_PORT);
            var helper = new Helper();

            var sabyName=    await helper.getSabyName();
            await new SabyInfoRepository().UpdateStatus("In behaviour", null);
            console.log("startOnetoOneMsg() updated status");
            callback(null,{
                success: true
            });
            console.log(`\n ---- HomeBtn() ---- \n`);
            emulatorScript.HomeBtn();
            emulatorScript.closeApp();

            let checkCallMessage=call.request.isCall ? "Make Call" : "Send Massage";
            new SabyInfoRepository().UpdateStatus(checkCallMessage,null);

            if(call.request.sabyOne == sabyName){
                // check if contact exist and add it if not
                await emulatorScript.addContacts(call.request.phoneTwo,call.request.waTwo);
                if(call.request.isCall){
                    await script.StartCall(call.request.phoneTwo);
                  }else{
                    await script.StartMessages(call.request.numberOfMsg,call.request.phoneTwo,false);
                  }
            }else{
                // check if contact exist and add it if not
                await emulatorScript.addContacts(call.request.phoneOne,call.request.waOne);
                if(call.request.isCall){
                    await script.StartCall(call.request.phoneOne);
                }else{
                    await script.StartMessages(call.request.numberOfMsg,call.request.phoneOne,false);
                  }
            }
            await new SabyInfoRepository().UpdateStatus("available", null);
        }catch(error){
            console.log(`Error at startOnetoOneMsg (BehaviourServices):\n ${error}`);
            await new SabyInfoRepository().UpdateStatus("Error In behaviour", null);
            callback({
                message:error.message,
                code:grpc.status.ABORTED,
            });
        }
    }



}