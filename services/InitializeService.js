import {AVDScript} from '../scripts/avd_script.js'
import {WhatsAppHelper} from '../helpers/WhatsApp.js'
import os from 'os';
import {Helper} from "../helpers/Helper.js";
import {SabyInfoRepository} from "../Repository/SabyInfoRepo.js";
export class InitializeService{
constructor(){
}

    async RegisterMutliAvd(call,callback){
        try{

            var helper = new Helper();
            var statusRegister = await helper.RegisterMutliAvd();
            if(statusRegister){
                callback(null,{
                    message: `${call.request.username}  Register Mutli Avd Success`,
                    success:true
                });
            }else{
                callback({
                    message:"Error Register Multi Avd",
                    code:10
                });
            }


        }catch(error){
            callback({
                message:error,
                code:10
            });
        }
    }
    async UpdateWhatsApp(call,callback){
        try{
            const avdScript = new AVDScript(true);
            await avdScript._getApiData();
            const waHelper = new WhatsAppHelper();
            await waHelper.init();

            callback(null,{
                message: `${call.request.username} received update Request`,
                success:true
            });

            avdScript.HomeBtn();
            if(!await waHelper.updateWhatsappVersion()){
                await new SabyInfoRepository().UpdateStatus("Can't update WhatsApp",null,'STUCK');
                return
            }

            await  new Promise(resolve => setTimeout(resolve, 1500));
            await waHelper.runApplication();
        }catch(error){
            console.log(`\n\n Error in -InitializeService => UpdateWhatsApp()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }

    async CreateAvd(call,callback){
        try{
            const script = new AVDScript(false);
            var helper = new Helper();
            let sabyName=await helper.getSabyName();

            var avdExist = await script.checkIfAvdExist(call.request.avdName);
            if(avdExist){
                callback(null,{
                    message: "Avd already exist",
                    sabyName:sabyName,
                    alpha:call.request.avdName,
                    fullName:`${sabyName}-${call.request.avdName}`,
                    success:false
                });
                return;
            }
            await script.createAvds(call.request.avdName);
            callback(null,{
                message: "Avd Created",
                sabyName:sabyName,
                alpha:call.request.avdName,
                fullName:`${sabyName}-${call.request.avdName}`,
                success:true
            });
        }catch(error){
            console.log(`\n\n Error in -InitializeService => CreateAvd()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }

    async DeleteAvd(call,callback){
        try{

            var helper = new Helper();
            const script = new AVDScript(true);
            const sabyName = await helper.getSabyName();
            var avdExist = await script.checkIfAvdExist(call.request.avdName);
            if(avdExist){
                callback(null,{
                    message: "Avd does not exist",
                    sabyName:sabyName,
                    alpha:call.request.avdName,
                    fullName:`${sabyName}-${call.request.avdName}`,
                    success:false
                });
                return;
            }
            await script.deleteAvd(call.request.avdName);
            callback(null,{
                message: "Avd Deleted",
                sabyName:sabyName,
                alpha:call.request.avdName,
                fullName:`${sabyName}-${call.request.avdName}`,
                success:true
            });
        }catch(error){
            console.log(`\n\n Error in -InitializeService => DeleteAvd()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }

    async StartAvd(call,callback){
        try{

            var helper = new Helper();
            let sabyName=await helper.getSabyName();
            const script = new AVDScript(true);
            var avdExist = await script.checkIfAvdExist(call.request.avdName);
            if(!avdExist){
                callback(null,{
                    message: "Avd does not exist",
                    sabyName:sabyName,
                    alpha:call.request.avdName,
                    fullName:`${sabyName}-${call.request.avdName}`,
                    success:false
                });
                return;
            }
            await script.avdStart();
            callback(null,{
                message: "Avd Started",
                sabyName:sabyName,
                alpha:call.request.avdName,
                fullName:`${sabyName}-${call.request.avdName}`,
                success:true
            });
        }catch(error){
            console.log(`\n\n Error in -InitializeService => StartAvd()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }

    async SwitchAvd(call,callback){
        try{
            const script = new AVDScript(true);
            var helper = new Helper();
            let sabyName=await helper.getSabyName();
            var isrunning = await script.isAVDRunning();
            if(isrunning){
                script.avdStop();
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            await script.avdStart();
            callback(null,{ 
                message: "Avd Switched",
                sabyName:sabyName,
                alpha:call.request.avdName,
                fullName:`${sabyName}-${call.request.avdName}`,
                success:true
            });
        }catch(error){
            console.log(`\n\n Error in -InitializeService => SwitchAvd()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }

    async StopAvd(call,callback){
        try{

            var helper = new Helper();
            let sabyName=await helper.getSabyName();
            const script = new AVDScript(false);

            var isrunning = await script.isAVDRunning();
            if(!isrunning){
                callback(null,{
                    message: "no avd running",
                    sabyName:sabyName,
                    alpha:call.request.avdName,
                    fullName:`${sabyName}-${call.request.avdName}`,
                    success:false
                });
                return;
            }
            script.avdStop();
            callback(null,{
                message: "Avd stopped",
                sabyName:sabyName,
                alpha:call.request.avdName,
                fullName:`${sabyName}-${call.request.avdName}`,
                success:true
            });
        }catch(error){
            console.log(`\n\n Error in -InitializeService => StopAvd()-  , error : ${error} \n\n`);
            callback({
                message:error,
                code:10
            });
        }
    }
    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
      }

}