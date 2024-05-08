import { Checker } from "../helpers/Checker.js";
import { SabyInfoRepository } from "../Repository/SabyInfoRepo.js";
import { WhatsAppHelper } from "../helpers/WhatsApp.js";
import { VpnHelper } from "../helpers/VpnHelper.js";
import { SipAndLinphone } from "../helpers/SipAndLinphone.js";
import { SocketScript } from "./SocketScript.js";
import { BehaviourScript } from "./BehaviortScripts.js";
import { AVDScript } from "./avd_script.js";
import {Helper} from "../helpers/Helper.js";
import {exec} from "child_process";
import {WhatsappActivation} from "./ActivationScript.js";
export class CleanupScript{
    constructor(){}

   async avdChecker(){
        try{
            const avdScript = new  AVDScript();
            const checker = new Checker();
            const vpnHelper = new VpnHelper();
            const whatsappHelper = new WhatsAppHelper();
            const socket = new SocketScript();
            await avdScript._getApiData();
            const behaviourScript = new BehaviourScript(avdScript.getEmulatorPort());
            await checker.init();
            await whatsappHelper.init();
            const helper = new Helper();
            let jobs=[];
            let callLimit = 0 ;
            // call limit from grpc function

            while(callLimit < 10){


                await new SabyInfoRepository().UpdateStatus("Cleanup", null,'Working');


                //TODO change asteriskHost with the actual asteriskHost 148.251.183.88:1992 get from config
                const sipAndLinphone = new SipAndLinphone("135.181.130.186:1992");

                console.log("check isVpnConnected ... ");
                var isVpnConnected =  await checker.isVpnConnected();
                if(!isVpnConnected){
                    //TODO change vpn config file
                    await new SabyInfoRepository().UpdateStatus("KILLED",null,"NO VPN");
                }
                console.log("VpnConnected");

                console.log("check isWifiConnected ... ");
                var isWifiWorking = await checker.isWifiConnected();
                var isInternetWorking = await checker.isInternetWorking();
                if(!isInternetWorking){
                    await new SabyInfoRepository().UpdateStatus("KILLED", null, "NO INTERNET");
                    break;
                }
                console.log("WifiConnected");

                console.log("check IsWhatsappBlocked .. ");
                var isBlocked = await whatsappHelper.IsWhatsappBlocked();
                if(isBlocked){
                    await new SabyInfoRepository().UpdateStatus("KILLED", null,"Whatsapp Blocked");
                    break;
                }
                const avdScript = new  AVDScript();
                await avdScript._getApiData();
                let whatsappActivation = new WhatsappActivation(avdScript.getEmulatorPort());

                let check_whatsapp_notactive=await whatsappActivation.check_whatsapp_notactive();
                if(check_whatsapp_notactive[0]){
                    let DeActiveReason=check_whatsapp_notactive[1];
                    await new SabyInfoRepository().AddDeactiveSaby(DeActiveReason);
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive",DeActiveReason);
                }


                if(await behaviourScript.check_stuck_profile_info()){
                    await new SabyInfoRepository().UpdateStatus("PROFILE INFO STUCK",null,'STUCK');

                    return false;
                }


                console.log("Whatsapp App Work fine");

                console.log("check if needs Update.. ");
                var needUpdate = await whatsappHelper.needsUpdate();
                if(needUpdate){
                    console.log("Whatsapp Need Update Well Update Now ");
                    if(!await whatsappHelper.updateWhatsappVersion()){
                        await new SabyInfoRepository().UpdateStatus("Can't update WhatsApp",null,'STUCK');
                        return
                    }

                }else{
                    console.log("Whatsapp Not Need Update");
                }


                console.log("check saby group register");
                let FindByUsername=await new SabyInfoRepository().FindByUsername();
                await new SabyInfoRepository().AddSabyGroup( FindByUsername.waName, FindByUsername.phoneNumber);
                const emulatorScript = new AVDScript();
                await emulatorScript._getApiData();



                console.log("check CONTACTS");

                await new SabyInfoRepository().UpdateStatus("CHECK CONTACTS", null,"WORKING");

                var thisUser= await helper.getSabyName();
                let group = await new SabyInfoRepository().getSabyGroup(thisUser);
                if(group){
                    for(const saby of group){
                        console.log(`saby need to add ${saby} with name ${saby.waName}`);
                        await  helper.delayFunc(1000);
                        await emulatorScript.addContacts(saby.phoneNumber,saby.waName);
                    }
                }



                console.log("Check Linphone...");
                var isLinphoneActive = await sipAndLinphone.CheckLinphone();
                if(!isLinphoneActive){
                    await new SabyInfoRepository().UpdateStatus("KILLED", null, 'LINPHONE');
                    break;
                }

                console.log("Linphone Work Fine");

                jobs = await helper.checkIfHaveJob('Cleanup');
                console.log(`Cleanup ${jobs}`);
                if(jobs){
                    await helper.doJobs(jobs)
                }

                console.log("Create Socket Now ...");


                await new SabyInfoRepository().UpdateStatus("Ready", null,"WAITING COMMANDS");
                await socket.CreateSocket();
                let enableSleep = await socket.callProcess();

                if(enableSleep){
                       while (await helper.getSabyStatus() === 'CALL IN PROGRESS'){
                            console.log("wait call end")
                       }
                       console.log("sleep start")
                       await behaviourScript.startSleep();
                            jobs = await helper.checkIfHaveJob('sleep');
                            console.log(`Ready ${jobs}`);
                            if(jobs){
                                await helper.doJobs(jobs)
                            }
                       callLimit++;
                }

                jobs = await helper.checkIfHaveJob('Ready');
                console.log(`Ready ${jobs}`);
                if(jobs){
                    await helper.doJobs(jobs)
                }
            }

            console.log(`callLimit Now ${callLimit}`);
            if(callLimit < 0){
                console.log("Limited Call");
                await behaviourScript.ReplyToMessages(0,3);
            }
            console.log("____________________________END CLEAN UP ________________________________")


        }catch(error){
            console.log(`Error in avdChecker : ${error}`);
        }
    }


}