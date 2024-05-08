


import {Python} from '../helpers/Python.js';
import {WhatsappActivation} from '../scripts/ActivationScript.js';
import {AVDScript} from '../scripts/avd_script.js'
import {WhatsAppHelper} from '../helpers/WhatsApp.js'
import {SabyInfoRepository} from '../Repository/SabyInfoRepo.js'
import { Helper } from '../helpers/Helper.js';
import os from 'os';
import {MainScript} from '../scripts/MainScript.js'
import {Checker} from "../helpers/Checker.js";
const IMG = `../images/`;
export class ActivationService{ 
     whatsappActivation = null;
     python = null;
     script = null;
    constructor(){
        this.whatsappActivation = new WhatsappActivation();
        this.python = new Python();
        this.script = new AVDScript(true);
    }


 async startActivation(call,callback){
        try{

            await new SabyInfoRepository().UpdateStatus("ACTIVATING", "Activating", "STARTING");

            var helper = new Helper();
            let SabyName=await helper.getSabyName();

            this.script = new AVDScript(true);
            console.log("call.request.waName : ",call.request.waName);
            console.log("call.request.phoneNumber : ",call.request.phoneNumber);
            console.log("initScript",call.request.initScript);



              await this.script.deleteAvd(null);
              await this.script.createAvds(null);

              const mainScript = new MainScript();


                var scriptInit =  await mainScript.validate(call.request.alpha,call.request.vpnRegion,call.request.apiRoute);
                console.log("scriptInit",scriptInit);
                if(!scriptInit){
                    callback(null,{
                        message: "couldn't start activation!",
                        sabyName:SabyName,
                        phoneNumber:call.request.phoneNumber,
                        success:false
                    });
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 3000));
                await this.script.changeDeviceName(call.request.waName);
            callback(null,{
                message: "Activating...",
                sabyName:SabyName,
                phoneNumber:call.request.phoneNumber,
                success:true
            });


            console.log("\nActivation start => \n");
            this.whatsappActivation = new WhatsappActivation(call.request.emulatorPort);
            this.python = new Python();


            ///var helper = new Helper();
            if(typeof call.request.phoneNumber == 'undefined' || (call.request.phoneNumber).length < 5){
                await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","ACTIVATION NO NUMBERS");
                return;
            }
            await this.script.uninstallApp("com.whatsapp");

            await new SabyInfoRepository().UpdateStatus("ACTIVATING", "inactive","Set Location");

            let getCountryOperatorStatus= await this.whatsappActivation.getCountryOperator(call.request.phoneNumber);

            // await helper.addContacts(call.request.emulatorPort);
            await new SabyInfoRepository().UpdateStatus("ACTIVATING", "inactive","INSTALLING APP");

            await this.script.setGeoLocation(call.request.lat, call.request.long);
            
            await this.script.installApp("../SabyDemo/apk/WhatsApp.apk");
            var whatsappHelper = new WhatsAppHelper();
            await whatsappHelper.init();
            await whatsappHelper.runApplication();
        //    if(appStarted){
            var stepOne =  await this.whatsappActivation.stepOne();
            console.log(`*** Step One --> ${stepOne}`);
            if(!stepOne){
                let check_whatsapp_notactive=await this.whatsappActivation.check_whatsapp_notactive();
                if(check_whatsapp_notactive[0]){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",check_whatsapp_notactive[1]);
                }else{
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","ACTIVATION STEP ONE NOT COMPLETE");
                }
                return;
            }
            console.log("phone number :",call.request.phoneNumber);

            var stepTwo =  await this.whatsappActivation.stepTwo(call.request.phoneNumber,getCountryOperatorStatus);
            console.log(`*** Step Two --> ${stepTwo}`);
            if(!stepTwo){

                var WaUnableToConnect = await this.whatsappActivation.WhatsappUnableToConnect();
                if(!WaUnableToConnect){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","ACTIVATION WA UNABLE TO CONNECT");
                    return ;
                }

                let check_whatsapp_notactive=await this.whatsappActivation.check_whatsapp_notactive();
                if(check_whatsapp_notactive[0]){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",check_whatsapp_notactive[1]);
                }else{
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED UNKNOWN ISSUE");
                }

             return;
            }
            var stepThree =  await this.whatsappActivation.stepThree();
            console.log(`*** Step Three  --> ${stepThree}`);
            if(!stepThree){

                let check_whatsapp_notactive=await this.whatsappActivation.check_whatsapp_notactive();
                if(check_whatsapp_notactive[0]){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",check_whatsapp_notactive[1]);
                }else{
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED UNKNOWN ISSUE");
                }
                return;
            }
            var UnableToConnect = await this.whatsappActivation.WhatsappUnableToConnect();
            if(!UnableToConnect){
                await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","ACTIVATION WA UNABLE TO CONNECT");
                return;
            }

               var between = await this.whatsappActivation.betweenSteps();
               if(!between){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED WAIT HOURS");
                    return;
               }
                 var next = await this.whatsappActivation.nextStep();
                 if(next == "getOtp"){
                     //#region get otp
                     await new SabyInfoRepository().UpdateStatus("ACTIVATING", null,"WAITING CODE");

                     var otp =   await this.whatsappActivation.getOTPCode(call.request.username,call.request.waName);
                      if(otp[0]){
                          if(await this.whatsappActivation.checkTwoStepVarifications()){
                              await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED TWO STEP VARI");
                              return;
                          }
                          if(!await this.whatsappActivation.CheckSpam()) {
                              await this.whatsappActivation.afterOtp(otp[1]);
                              await new SabyInfoRepository().UpdateStatus("ACTIVATED", "activated","NULL");

                              await helper.HandelSapyActivated(this.whatsappActivation);
                              return

                          }else{
                              await new SabyInfoRepository().UpdateStatus("ACTIVATION FAILED", "inactive","SPAM ACCOUNT");
                          }
                      }
                      return
                      //#endregion
                 }
                var isUsed=  await this.whatsappActivation.isNunberAlreadyused();
                if(isUsed){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NUMBER ALREADY IN USE");
                    return;
                }
                 var stepFour =await this.whatsappActivation.stepFour();
                 console.log(`*** Step Four  --> ${stepFour}`);
                 if(!stepFour){

                     let check_whatsapp_notactive=await this.whatsappActivation.check_whatsapp_notactive();
                     if(check_whatsapp_notactive[0]){
                         await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",check_whatsapp_notactive[1]);
                     }else{
                         await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED UNKNOWN ISSUE");
                     }

                    return;
                 }
                 await this.whatsappActivation.beforeOtp();
                  if(next == "getOtp"){
                      await this.whatsappActivation.afterOtp(call.request.waname);
                  }
                 //#region get otp
                 var otp =   await this.whatsappActivation.getOTPCode(call.request.username);
                 if(!otp[0]){
                   return;
                 }
                //checkTwoStepVarifications
                 if(await this.whatsappActivation.checkTwoStepVarifications()){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED TWO STEP VARI");
                    return;
                }

                 //#CheckSpam
                if(!await this.whatsappActivation.CheckSpam()){
                    //add profile info
                    await this.whatsappActivation.afterOtp(otp[1]);
                    await new SabyInfoRepository().UpdateStatus("ACTIVATED", "activated","NULL");

                    await helper.HandelSapyActivated(this.whatsappActivation);
                    return
                    //start saby
                }else{
                    await new SabyInfoRepository().UpdateStatus("ACTIVATION FAILED", "inactive","SPAM ACCOUNT");
                }

                let check_whatsapp_notactive=await this.whatsappActivation.check_whatsapp_notactive();
                if(check_whatsapp_notactive[0]){
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",check_whatsapp_notactive[1]);
                    await this.script.writetext(otp);
                }else{
                    await new SabyInfoRepository().UpdateStatus("ACTIVATED", "activated","NULL");

                    await helper.HandelSapyActivated(this.whatsappActivation);
                    return
                }

        }catch(error){
            console.log(`\n\n Error in -ActivationService => startActivation()-  , error : ${error} \n\n`);
            // new SabyInfoRepository().UpdateStatus(`Couldn't activate (reason : ${error})`,"inactive");
            callback({
                message:error,
                code:10
            });
        }
    }


    async  StartManualActivation(call,callback){
        try{

                var helper = new Helper();
                let SabyName=await helper.getSabyName();

                this.script = new AVDScript(true);
                await this.script.deleteAvd(null);
                await this.script.createAvds(null);
                const mainScript = new MainScript();
                var scriptInit =  await mainScript.validate(call.request.alpha,call.request.vpnRegion,call.request.apiRoute);
                console.log("scriptInit",scriptInit);
                if(!scriptInit){
                    callback(null,{
                        message: "couldn't start activation!",
                        sabyName:SabyName,
                        phoneNumber:call.request.phoneNumber,
                        success:false
                    });
                    return;
                }
                callback(null,{
                    message: "Activating...",
                    sabyName:SabyName,
                    phoneNumber:"",
                    success:true
                });
                await this.script.setGeoLocation(call.request.lat, call.request.long);
                await new Promise(resolve => setTimeout(resolve, 3000));
                await this.script.changeDeviceName(call.request.waName);
                await this.script.uninstallApp("com.whatsapp");
                await this.script.installApp("../SabyDemo/apk/WhatsApp.apk");

                await new SabyInfoRepository().UpdateStatus("Ready for Manual Activation", "inactive");

        }catch(error){
            console.log(`\n\n Error in -ActivationService => StartManualActivation()-  , error : ${error} \n\n`);
            new SabyInfoRepository().UpdateStatus(`Couldn't activate (reason : ${error})`,"inactive");
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