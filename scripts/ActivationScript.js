
import {exec} from "child_process";
import {Python} from '../helpers/Python.js';
import {AVDScript} from './avd_script.js'
import os from 'os';
var user =os.userInfo().username;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const IMG = `images/`;
import fs  from'fs';
import {Helper} from "../helpers/Helper.js";
import {Checker} from "../helpers/Checker.js";
import {WhatsAppHelper} from "../helpers/WhatsApp.js";
import {makeClientConstructor} from "@grpc/grpc-js";
import {SabyInfoRepository} from "../Repository/SabyInfoRepo.js";


export class WhatsappActivation{

    emulatorPort= null;
  //  dumpScreenFile = "SabyDemo/helpers"+"/logF.xml";
    python = new Python();
    script = new AVDScript(true);
    constructor(emulatorPort){  
        this.emulatorPort = emulatorPort;
      //  this.dumpScreenFile = "SabyDemo/helpers"+"/logF.xml";
        this.python = new Python();
        this.script = new AVDScript(true);
        this.python.setDefaultRegion(70,27,727,414);
    }

    // first step in whatsapp activation
   async stepOne(){
        console.log("in step one");
        this.python.setDefaultRegion(70,27,727,414);
        await this.dumpScreenToFile();
        var foundinDumpScreen = await this.searchStringInDumpScreen("Choose your language to get started");
        if(foundinDumpScreen){
            var CoordinatesFromString = await this.SearchCoordinatesByString("English");
            if(CoordinatesFromString[0] != 0 && CoordinatesFromString[1] != 0){
                await this.python.click(CoordinatesFromString[0], CoordinatesFromString[1]);
            }
            var CoordinatesFromResourceId = await this.SearchCoordinatesByString("English");
            if(CoordinatesFromResourceId[0] != 0 && CoordinatesFromResourceId[1] != 0){
                await this.python.click(CoordinatesFromResourceId[0], CoordinatesFromResourceId[1]);
            }
        }
        
        var foundAndClickedOk =await this.python.findAndClick(`${IMG}whatsapp_ok_big.png`,null,5);
        if(foundAndClickedOk){
            this.script.swipe(475, 1600, 475, 600, 1000);
        } //images\ok_arrow_btn.png
        else{
           await this.python.findAndClick(`${IMG}ok_arrow_btn.png`,null,5);
           // wa_next_btn 
           await this.python.findAndClick(`${IMG}wa_next_btn.png`,null,5);
        }
        // var foundAndClickedAgree = await this.python.findAndClick(`${IMG}gb_agree_and_continue.png`,null,10);
        // var foundAndClickedAgree2 = await this.python.findAndClick(`${IMG}gb_agree_and_continue_2.png`,null,10);
        // C:\Users\User\SabyDemo\images\wa_agree_continue_new.png
        await this.python.findAndClick(`${IMG}rom_ok.png`,null,5);
        var foundAndClickedAgree3 = await this.python.findAndClick(`${IMG}newAgreeAndContinue.png`,null,5);
        // foundAndClickedAgree || foundAndClickedAgree2 || 
        if(foundAndClickedAgree3){
            console.log("in check Enter your phone number foundAndClickedAgree3");

            await this.dumpScreenToFile();
            var stringFound = await this.searchStringInDumpScreen("Verify phone number");
            var stringFound2 = await this.searchStringInDumpScreen("Enter your phone number");
            if(stringFound || stringFound2){
                this.script.swipe(500, 800, 500, 0, 500);
                this.script.swipe(500, 800, 500, 0, 500);
                return true;
            }
        }else{
            console.log("in check Enter your phone number else foundAndClickedAgree3");

            await this.dumpScreenToFile();
            var stringFound = await this.searchStringInDumpScreen("Agree and continue");
            var stringFound2 = await this.searchStringInDumpScreen("AGREE AND CONTINUE");
            if(stringFound || stringFound2){
                await this.dumpScreenToFile();
                var axis = await this.SearchCoordinatesByString("Agree and continue");
                if(axis[0] != 0 && axis[1] != 0)
                    await this.python.click(axis[0],axis[1]);
                var axis2 = await this.SearchCoordinatesByString("AGREE AND CONTINUE");
                if(axis2[0] != 0 && axis2[1] != 0)
                    await this.python.click(axis2[0],axis2[1]);
                var axis3  =await this.SearchCoordinatesByString("com.whatsapp:id/eula_accept");
                if(axis3[0] != 0 && axis3[1] != 0)
                    await this.python.click(axis3[0],axis3[1]);

            }

            await this.dumpScreenToFile();
            var phoneFound = await this.searchStringInDumpScreen("Verify phone number");
            await this.dumpScreenToFile();
            var phoneFound2 = await this.searchStringInDumpScreen("Enter your phone number");
            if(phoneFound || phoneFound2){
                this.script.swipe(500, 800, 500, 0, 500);
                return true;
            }
            console.log("in check Enter your phone number");
        }
        return false;
    }
    async isNunberAlreadyused(){
        var used = await this.python.exists(`${IMG}wa_numberAlready_used.png`,null,10);
        return used;
    }
//images\ok_btnverify.png 
//images\phone_verify.png
// second step in whatsapp activation


    async check_whatsapp_notactive(){
        var fname=await new Helper().getFunctionName();
        console.log(`inside ${fname}`);


        const whatsappHelper = new WhatsAppHelper();
        await whatsappHelper.init();
        await whatsappHelper.runApplication();


        let deactivated11 = ["This account is not allowed to use WhatsApp", "NOT ALLOW"];
        let deactivated10 = ["This account is not allowed to use WhatsApp due to spam", "SPAM ACCOUNT"];
        let deactivated18 = ["This account can no longer use WhatsApp due to spam", "SPAM ACCOUNT"];
        let deactivated20 = ["This account can no longer use WhatsApp", "NOT ALLOW"];
        let deactivated21 = ["Welcome to WhatsApp", "NOT ACTIVE"];
        let deactivated22 = ["Choose your language to get started", "NOT ACTIVE"];
        let deactivated23 = ["You recently connected.", "NOT ACTIVE"];
        let deactivated24 = ["Sorry, an unrecoverable error has occurred. Please contact customer support for assistance.", "NOT ACTIVE"];
        let deactivated25 = ["Send SMS to WhatsApp", "NOT ACTIVE"];
        let deactivated26 = ["Waiting to automatically detect an SMS", "NOT ACTIVE"];
        let deactivated27 = ["We couldn't send an SMS to your number. Please check your number and try again in 1 hour.", "NOT ACTIVE"];
        let deactivated28 = ["Something went wrong. You'll need to verify your account again.", "NOT ACTIVE"];
        let deactivated29 = ["Two-step Verification", "NOT ACTIVE Two-step Verification"];
        let deactivated30 = ["You can now send a new code to", "NOT ACTIVE"];
        let deactivated31 = ["Verifying your number", "NOT ACTIVE"];
        let deactivated32 = ["Use your other phone to confirm moving WhatsApp to this one.", "NOT ACTIVE"];
        let deactivated33 = ["Confirm moving phones", "NOT ACTIVE"];

        let deactivated19 = ["You have a custom ROM installed.", "NOT ACTIVE"];
        let deactivated14 = ["Registration timed out", "NOT ACTIVE"];
        let allowed11 = ["Something went wrong. You'll need to verify your account again.", "NOT ALLOW"];
        let keepStoping = ["WhatsApp keeps stopping", "WHATSAPP KEEPS STOPPING"];
        let deactivated12 = ["You have been logged out", "NOT ACTIVE"];
        let restoredAccount = ["This account has been restored", "WhatsApp RESTORED ACCOUNT"];
        let restoredChats = ["Restore chat history", "WhatsApp Restored Chats"];
        let deactivated6 = ["Wrong number?", "NOT ACTIVE"];
        let deactivated16 = ["Switching to WhatsApp Messenger will delete all of your business ", "NOT ACTIVE SWITCH"];
        let deactivated15 = ["You need the official WhatsApp to log in", "NOT ACTIVE OFFICIAL WHATSAPP"];
        let deactivated3 = ["If you want to restore chats history from WhatsApp, make sure you made a backup from your messages, then you can restore it by pressing the button below, then put your number and press (Next).", "NOT ACTIVE"];
        let deactivated5 = ["is banned from using WhatsApp", "NOT ACTIVE"];
        let deactivated17 = ["Login not available right now", "Can't Login with This Number Whatsapp"];
        let deactivated8 = ["Your phone number is no longer registered with WhatsApp on this phone. This might be because you registered it on another phone.&#10;&#10;If you didn't do this, verify your phone number to log back into your account.", "DEACTIVATED"];
        let deactivated7 = ["You have guessed too many times.&#10;&#10;Please check with your mobile provider that you can receive SMS and phone calls.&#10;&#10;Please wait for a new code to be sent.&#10;&#10;Try again after -1 seconds.", "NOT ACTIVE"];


        //custom
        await this.dumpScreenToFile();
        var WaitingSms = await this.SearchCoordinatesByString("Waiting to automatically detect an SMS");
        if(await this.python.exists(`${IMG}waitingSmsCode.png`,null,5) || WaitingSms[0] !== 0) {
            return [true, 'CAN"T WRITE SMS'];
        }

        console.log("now check all Deactivate status")
        await this.delayFunc(5000);
        console.log("checking");

        const arrays = [deactivated28,deactivated27,deactivated26,deactivated25,deactivated24,deactivated23,deactivated22,deactivated21,deactivated20,deactivated19,deactivated18,deactivated17,deactivated16,deactivated15,deactivated11, deactivated10, deactivated14, allowed11, keepStoping, deactivated12, restoredAccount, restoredChats, deactivated6, deactivated3, deactivated5, deactivated8, deactivated7,deactivated29,deactivated30,deactivated31,deactivated32,deactivated33];

        for (let i = 0; i < arrays.length; i++) {
            var array = arrays[i];
            console.log("...");
            await this.delayFunc(1000);
            await this.dumpScreenToFile();
            await this.delayFunc(1000);
            var result = await this.searchStringInDumpScreen(array[0]);
            if (result) {
                await new SabyInfoRepository().RemoveSabyFromGroup();
                return [true, array[1]];
            }
        }

        return [false, ""];
    }
    async stepTwo(phone,CountryOperatorStatus){

        const helper = new Helper();

        this.python.setDefaultRegion(70,27,727,414);
        await new SabyInfoRepository().UpdateStatus("ACTIVATING", null, "FILLING NUMBER");

        console.log(`Write Phone Number ${phone}`);
        phone=await helper.extractDigits(phone);

        if(CountryOperatorStatus){
            console.log(`CountryCode ${CountryOperatorStatus}`)
            await this.python.findAndClick(`${IMG}FillingPhoneNmber.png`,null,5);
            await this.delayFunc(2000);

            let cutNumber =await helper.removeCountryCode(phone,CountryOperatorStatus);
            console.log(`cutNumber is ${cutNumber}`);
            await this.script.writetext(cutNumber);

        }else{
            await this.python.findAndClick(`${IMG}CountryCode.png`,null,5);
            this.script.forwardDelete();

            await this.python.exists(`${IMG}EmptyPhoneNumberField.png`,null,5);
            this.script.forwardDelete();

            await this.delayFunc(2000);
            await this.script.writetext(phone);

        }



        var img3 = await this.python.exists(`${IMG}gb_next_new.png`,null,5);
        if(img3){
           console.log(`img3 ${img3}`);

             this.script.backBtn();
             await this.dumpScreenToFile();
             var stringFound =await this.searchStringInDumpScreen("Select number");
            if(stringFound){
               var axis =await this.SearchCoordinatesByString("USE");
                if(axis[0] != 0 && axis[1] != 0)
                {
                  await this.python.click(axis[0] , axis[1]);
                }
            }
            // wa_phonenumber
                    var findAndClick = await this.python.findAndClick(`${IMG}gb_next_new.png`,null,5);
                    console.log(`findAndClick gb_next_new ${findAndClick}`);

                    var verfiy = await this.python.exists(`${IMG}phone_verify.png`,null,5);
                    await this.delayFunc(2000);
                    var okBtn =await this.python.findAndClick(`${IMG}ok_btnverify.png`,null,5);
                    await this.delayFunc(3000);
                    var yesBtn = await this.python.findAndClick(`${IMG}wa_yes.png`,null,20);
                    await this.delayFunc(3000);
                    console.log(`yesBtn ${yesBtn}`);
                    if(okBtn||yesBtn){
                        return true;  
                    }
               
        }
        return false;
    }
    async betweenSteps(){
        await this.dumpScreenToFile();
        await this.python.findAndClick(`${IMG}continueToSms.png`,null,5);
        await this.python.findAndClick(`${IMG}allowBtnNew.png`,null,5);
        var didnotSendSms = await this.python.exists(`${IMG}couldnotSendSms.png`,null,5);
        return !didnotSendSms;
    }
    // 4th step in whatsapp activationstepFour
    async stepFour(){
        this.python.setDefaultRegion(70,27,727,414);
        await this.dumpScreenToFile();
        var string1= await this.searchStringInDumpScreen("Enter the numbers shown");
        var string2 = await this.searchStringInDumpScreen("Help us keep WhatsApp secure by verifying that you're a real person.");
        var keeptrying = false;
        var tryCount =0;
        if(string1 || string2){
            await new SabyInfoRepository().UpdateStatus("ACTIVATION", null,"NEED TO SECURE CODE");

            console.log("\nWhatsappActivation => stepThree() : verifying Code -------  \n");
            this.script.increaseVolumeToMax();
            await this.script.increaseVolume();
            while(keeptrying == false && tryCount < 10){
                var soundImg = await this.python.findAndClick(`${IMG}sound.png`,null,5);
                if(soundImg){
                    await this.listen_to_sound_enter_code_active();
                    var numberfromSound = await this.python.getNumberFromSound();
                   // console.log("stepThree() => number from Sound  :",numberfromSound);
                    if(numberfromSound != "Exception:" && numberfromSound != null && numberfromSound != "" && typeof numberfromSound != 'undefined' && !numberfromSound.toString().includes('Exception')){
                        await this.writeNumber(numberfromSound);
                        await this.delayFunc(4500);
                        await this.python.findAndClick(`${IMG}EnterCheck.png`,null,3);
                        await this.dumpScreenToFile();
                        var axis = await this.SearchCoordinatesByString("NEXT");
                        if(axis[0] != 0 && axis[2] != 0){
                            this.script.click(axis[0],axis[1]);
                        }
                        await this.python.findAndClick(`${IMG}NextClickActivation.png`,null,5);

                        await this.dumpScreenToFile();
                        var string3= await this.searchStringInDumpScreen("Numbers do not match");
                        if(string3){
                            await this.dumpScreenToFile();
                            var axis2 = await this.SearchCoordinatesByString("Try Again");
                            if(axis2[0] != 0 && axis2[2] != 0){
                                this.script.click(axis2[0],axis2[1]);
                                tryCount=0;
                            }
    
                        }else{
                            keeptrying = true;
                        }
                    }
                }
                tryCount++;
            }
        }
        return keeptrying;
    }
// 3rd step in whatsapp activation
    async WhatsappUnableToConnect(){
        let status=true;
        if(await this.python.exists(`${IMG}EmptyPhoneNumberField.png`,null,5)){
            status=false;
        }
        return status;
    }
    async stepThree(){
        var banned =false;
        this.python.setDefaultRegion(70,27,727,414);
        await this.dumpScreenToFile();
        var string1= await this.searchStringInDumpScreen("is not a valid mobile number for");
        var string2 = await this.searchStringInDumpScreen("is too long for");
        if(string1 || string2 ){
            console.log("\n whatsapp activation class At: steptree() => not a valid number. \n");
            return false;
        }
        //TODO isWhatsappSpamAccount

        var okBtn = await this.python.findAndClick(`${IMG}whatsapp_verify_ok.png`,null,5);
        if(okBtn){
            await this.dumpScreenToFile();
            var s1= await this.searchStringInDumpScreen("To automatically verify with a missed call to your phone:");
            var s2 = await this.searchStringInDumpScreen("Verify phone number");
            if(s1 || s2){
                this.script.swipe(500, 800, 500, 0, 500);
                // this.script.swipe(500, 800, 500, 0, 500);
                await this.dumpScreenToFile();
                var axis = await this.SearchCoordinatesByString("com.whatsapp:id/verify_with_sms_button");
                if(axis[0] != 0 && axis[1] != 0){
                    this.script.click(axis[0],axis[1]);
                }else{
                    var axis2 = await this.SearchCoordinatesByString("VERIFY WITH SMS");
                    if(axis2[0] != 0 && axis2[1] != 0){
                        this.script.click(axis2[0],axis2[1]);
                    }
                }
                await this.dumpScreenToFile();
                var str = await this.searchStringInDumpScreen("Verify phone number");
                if(str){
                    var axis3 = await this.SearchCoordinatesByString("VERIFY ANOTHER WAY");
                    if(axis3[0] != 0 && axis3[1] != 0){
                        this.script.click(axis3[0],axis3[1]);
                    }
                }else{
                    var axis3 = await this.SearchCoordinatesByString("com.whatsapp:id/verify_another_way_button_view");
                    if(axis3[0] != 0 && axis3[1] != 0){
                        this.script.click(axis3[0],axis3[1]);
                    }
                }
                await this.dumpScreenToFile();
                var sms = await this.searchStringInDumpScreen("Verify your phone number another way");
                var sms1 = await this.searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call");
                if(sms || sms1){
                    var smsAxis = await this.SearchCoordinatesByString("SEND SMS");
                    if(smsAxis[0] != 0 && smsAxis[2] !=0){
                        this.script.click(smsAxis[0],smsAxis[1]);
                    }
                }
            }
            await this.dumpScreenToFile();
            var string = await this.searchStringInDumpScreen("No call detected");
            if(string){
                var axis = await this.SearchCoordinatesByString("Verify with SMS");
                if(axis[0] != 0 && axis[1] != 0){
                    this.script.click(axis[0],axis[1]);
                }else{
                    var axisById = await this.SearchCoordinatesByString("com.whatsapp:id/verify_with_sms_button");
                    if(axisById[0] != 0 && axisById[1] != 0){
                        this.script.click(axisById[0],axisById[1]);
                    }
                }
                var axisAnotherWay = await this.SearchCoordinatesByString("VERIFY ANOTHER WAY");
                if(axisAnotherWay[0] != 0 && axisAnotherWay[1] !=0) {
                    this.script.click(axisAnotherWay[0],axisAnotherWay[1]);
                }else{
                    var axisAnotherWayById = await this.SearchCoordinatesByString("com.whatsapp:id/verify_another_way_button_view");
                    if(axisAnotherWayById[0] != 0 && axisAnotherWayById[1] !=0) {
                        this.script.click(axisAnotherWayById[0],axisAnotherWayById[1]);
                    }
                }
                await this.dumpScreenToFile();
                var verfiyAnotherWay = await this.searchStringInDumpScreen("Verify your phone number another way");
                var verfiyAnotherWay1 = await this.searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call");
                if(verfiyAnotherWay || verfiyAnotherWay1){
                    var axisSend = await this.SearchCoordinatesByString("SEND SMS");
                    if(axisSend[0] != 0 && axisSend[1] != 0){
                        this.script.click(axisSend[0],axisSend[1]);
                    }
                }
                await this.dumpScreenToFile();
                var isBanned = await this.python.exists(`${IMG}wa_banned.png`,null,1);
                var isUsed = await this.searchStringInDumpScreen("Use your other phone to confirm moving WhatsApp to this one.");
                if(isBanned || isUsed){
                    banned =true;
                    console.log("\n Whatsapp Activation class At: stepThree() => Banned Or Used Number.\n");
                    return false;
                }
            }
        }
        await this.dumpScreenToFile();
        var switchString = await this.searchStringInDumpScreen("Switching to WhatsApp Messenger will delete all of your business information");
        if(switchString){
            var switchAxis =await this.SearchCoordinatesByString("SWITCH");
            if(switchAxis[0] != 0 && switchAxis[1] != 0){
                this.script.click(switchAxis[0],switchAxis[1]);
            }else{
                await this.dumpScreenToFile();
                var switchAxis2 =await this.SearchCoordinatesByString("Switch");
                if(switchAxis2[0] != 0 && switchAxis2[1] != 0){
                    this.script.click(switchAxis2[0],switchAxis2[1]);
                }
            }
        }else{
            await this.python.findAndClick(`${IMG}whatsappSwitchButton.png`,null,5);    
        }
        // continue if didn't enter prev if statment  
        if(!switchString){
            var verifyNumberString =await this.searchStringInDumpScreen("To automatically verify with a missed call to your phone:");
            var verifyNumberString2 =await this.searchStringInDumpScreen("Verify phone number");
            if(verifyNumberString || verifyNumberString2){
                this.script.swipe(500, 800, 500, 0, 500);
                // this.script.swipe(500, 800, 500, 0, 500);
                await this.dumpScreenToFile();
                var btnAxis = await this.SearchCoordinatesByString("com.whatsapp:id/verify_with_sms_button");
                if(btnAxis[0] != 0 && btnAxis[1] != 0){
                    this.script.click(btnAxis[0],btnAxis[1]);
                }else{
                    var btnAxisString = await this.SearchCoordinatesByString("VERIFY WITH SMS");
                    if(btnAxisString[0] != 0 && btnAxisString[1] != 0){
                        this.script.click(btnAxisString[0],btnAxisString[1]);
                    }
                }
                var anotherbtnAxis = await this.SearchCoordinatesByString("com.whatsapp:id/verify_another_way_button_view");
                if(anotherbtnAxis[0] != 0 && anotherbtnAxis[1] != 0){
                    this.script.click(anotherbtnAxis[0],anotherbtnAxis[1]);
                }else{
                    var anotherbtnAxisString = await this.SearchCoordinatesByString("VERIFY ANOTHER WAY");
                    if(anotherbtnAxisString[0] != 0 && anotherbtnAxisString[1] != 0){
                        this.script.click(anotherbtnAxisString[0],anotherbtnAxisString[1]);
                    }
                }
                await this.dumpScreenToFile();
                var verifyAnother = await this.searchStringInDumpScreen("Verify your phone number another way");
                var verifyAnother2 = await this.searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call");
                if(verifyAnother || verifyAnother2){
                    var sendSmsAxis = await this.SearchCoordinatesByString("SEND SMS");
                    if(sendSmsAxis[0] != 0 && sendSmsAxis[1] != 0){
                        this.script.click(sendSmsAxis[0],sendSmsAxis[1]);
                    }
                }
            }
        }
        return true;
    }

    async beforeOtp(){
        var axis3 = await this.SearchCoordinatesByString("VERIFY ANOTHER WAY");
        if(axis3[0] != 0 && axis3[1] != 0){
            this.script.click(axis3[0],axis3[1]);
        }else{
            var axis3 = await this.SearchCoordinatesByString("com.whatsapp:id/verify_another_way_button_view");
            if(axis3[0] != 0 && axis3[1] != 0){
                this.script.click(axis3[0],axis3[1]);
            }
        }
        await this.dumpScreenToFile();
        var sms = await this.searchStringInDumpScreen("Verify your phone number another way");
        var sms1 = await this.searchStringInDumpScreen("You can receive your verification code by text message (SMS) or phone call");
        if(sms || sms1){
            var smsAxis = await this.SearchCoordinatesByString("SEND SMS");
            if(smsAxis[0] != 0 && smsAxis[2] !=0){
                this.script.click(smsAxis[0],smsAxis[1]);
            }
        }
        
        await this.delayFunc(10000);
    }
    async CheckSpam(){
        let status = false;
        const whatsappHelper = new WhatsAppHelper();
        await whatsappHelper.init();
        await whatsappHelper.runApplication();
        await this.script.dumpScreenToFile();
        if(await this.script.SearchString("This account is not allowed to use WhatsApp") || await this.script.SearchString("This account is not allowed to use WhatsApp due to spam")) {
            status=true;
        }
        return status
    }
    async checkTwoStepVarifications(){

        const whatsappHelper = new WhatsAppHelper();
        await whatsappHelper.init();
        await whatsappHelper.runApplication();

        let status = false;
        if(await this.python.exists(`${IMG}WhatsappTwoStepVarifications.png`, null, 10)) {
            status=true;
        }
        return status;
    }
    async afterOtp(waName){
        var fname=await new Helper().getFunctionName();
        console.log(`inside ${fname}`);

        this.python.setDefaultRegion(70,27,727,414);
        await this.python.findAndClick(`${IMG}wa_cont.png`,null,5);
        await this.python.findAndClick(`${IMG}wa_allow.png`,null,5);
        await this.python.findAndClick(`${IMG}wa_allow.png`,null,5);
        console.log(`after otp waname : ${waName}`);

        if(!await new Helper().checkImageWhatsapp){

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

                const whatsappHelper = new WhatsAppHelper();
                await whatsappHelper.init();
                await whatsappHelper.runApplication();
                await this.uploadPhotoToSaby();
            }

        }

        await this.script.dumpScreenToFile();
        if(await this.script.SearchString("Type your name here")){
            var TypeNameHere=  await this.script.SearchCoordinatesByString("Type your name here");
            this.script.click(TypeNameHere[0],TypeNameHere[1]);
            await this.delayFunc(2000);
            await this.script.writetext(waName);
        }


        // await this.python.writeText(waName);
        await this.python.findAndClick(`${IMG}EnterCheck.png`,null,3);
        await this.dumpScreenToFile();
        var axis = await this.SearchCoordinatesByString("NEXT");
        if(axis[0] != 0 && axis[1] != 0){
            this.script.click(axis[0],axis[1]);
        }
        await this.python.findAndClick(`${IMG}NextClickActivation.png`,null,5);

        await this.delayFunc(5000);
        var YourEmail = await this.python.exists(`${IMG}EnterYourEmail.png`,null,10);
        if(YourEmail){
            this.script.backBtn();
            await this.python.findAndClick(`${IMG}NotNowEnterEmail.png`,null,5);
        }

        //? wait 30 seconds 
        await this.delayFunc(30000);
        var needUpdate = await this.python.exists(`${IMG}wa_needs_update.png`,null,10);
        if(needUpdate){
            await this.python.findAndClick(`${IMG}wa_cancel.png`,null,5);
        }


    }
    async uploadPhotoToSaby(){
        var fname=await new Helper().getFunctionName();
        console.log(`inside ${fname}`);


        if(await this.python.exists(`${IMG}halfCamera.png`, null, 10)) {
            await this.script.backBtn();
        }


        await this.delayFunc(2000);
        if(await this.python.exists(`${IMG}addImage.png`, null, 10)) {
            await this.python.findAndClick(`${IMG}addImage.png`, null, 5);

            await this.dumpScreenToFile();
            var axis = await this.SearchCoordinatesByString("Gallery");

            if (await this.python.exists(`${IMG}GalleryUploadPhoto.png`, null, 5) || (axis[0] !== 0 && axis[1] !== 0)) {

                if(axis[0] !== 0 && axis[1] !== 0){
                    this.script.click(axis[0],axis[1]);
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
                    await this.dumpScreenToFile();
                    var DoneAxis = await this.SearchCoordinatesByString("DONE");
                    if(DoneAxis[0] !== 0 && DoneAxis[1] !== 0){
                        this.script.click(DoneAxis[0],DoneAxis[1]);
                    }
                }
            }
        }
    }

    async getCountryOperator(PhoneNumber){

        var fname=await new Helper().getFunctionName();
        console.log(`inside ${fname}`);

        let result,mccmnc,iso,country,mcc,mnc,network,countryCode=null;


        await new Promise((resolve,reject)=>{
            global.ServerActivation.GetCountryOperatorDetails({PhoneNumber:PhoneNumber},
                (err,data)=>{
                    if(err){
                        console.log(`Error in getCountryOperator -> ${err}`);
                    }
                    if(data && data.success){
                        console.log(`getCountryOperator ${data.country}`)
                        result=data;
                    }
                    resolve();
                });
        });
        if(result){
            mcc=result.mcc;
            mnc=result.mnc;
            mccmnc=mcc+mnc;
            iso=result.iso;
            country=result.country;
            network=result.network;
            countryCode=result.countryCode;
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.sim.operator.alpha "${network}" `);
            await this.delayFunc(1000);
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.operator.alpha "${network}" `);
            await this.delayFunc(1000);
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.sim.operator.iso-country  "${iso}" `);
            await this.delayFunc(1000);
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.operator.iso-country "${iso}" `);
            await this.delayFunc(1000);
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.sim.operator.numeric "${mccmnc}" `);
            await this.delayFunc(1000);
            exec(`${ADB} -s emulator-${this.emulatorPort} shell setprop gsm.operator.numeric "${mccmnc}" `);
            await this.delayFunc(1000);
        }
        return countryCode;
    }
    async getOTPCode(userName,waname){
        var otp =0;
        // var waname ="";
        var cancelRes = "Couldn't get OTP";
            this.python.setDefaultRegion(70,27,727,414);
            console.log(`--- Start get otp --->`);
            var tryCount =0;
            while(tryCount < 20){
                console.log(`inside while loop`);
                var cantSendSms = await this.python.exists(`${IMG}couldnotSendSms.png`,null,5);
                if(cantSendSms){
                    cancelRes = "can't activate whatsapp couldn't send sms";
                    await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","NOT ACTIVATED CAN't SEND SMS ");
                    tryCount = 21;
                }
                await new Promise((resolve,reject)=>{
                    global.ServerActivation.GetOTP({username:userName,simProvider:"Direct"},
                        (err,data)=>{
                            if(err){
                              console.log(`Error in get OTP -> ${err}`);
                              //? break Loop
                              tryCount = 21;
                            }
                            if(data.success && data.otp != 0){
                                otp = data.otp;
                                // waname =data.waName;
                                tryCount = 21;
                            }
                            resolve();
                    });
                });
                //? wait 30 seconds before requsting again
                await new Promise(resolve => setTimeout(resolve, 45000));
                console.log(`tryCount = ${tryCount}`);
                console.log(`otp = ${otp}`);
                tryCount++;
            }
            console.log(" exist loop");
            if(otp != 0){
                console.log("write otp ",otp);
                await new SabyInfoRepository().UpdateStatus("ACTIVATING", null,"FILLING CODE");

                try{
                    if(otp.toString().length === 6){
                        otp=  await this.formatNumber(otp);
                        //this is for write otp without GUI by call emu
                        await this.delayFunc(2000);

                        const WhatsAppcode= exec(`${ADB} -s emulator-${this.emulatorPort} emu sms send 'WhatsApp' 'Your WhatsApp code:${otp} '`);

                        await new Promise((resolve, reject) => {
                            WhatsAppcode.stderr.on('data', error => {
                                console.error("Error in Write Otp By Emu sms:", error);
                                console.log("Now Try Write by adb  ");
                                resolve();
                            });

                            WhatsAppcode.on('close', code => {
                                console.log("Exited with code ", code);
                                resolve();
                            });
                        });

                        console.log("wait check after otp")
                        await this.delayFunc(7000);

                        if(await this.detectanSmsPage()){
                            await this.script.writetext(otp);
                        }
                        await this.delayFunc(5000);

                        await this.dumpScreenToFile();
                        var WaitingSms3 = await this.SearchCoordinatesByString("Waiting to automatically detect an SMS");
                        if(WaitingSms3[0]){
                            return [false,waname,cancelRes];
                        }

                        return [true,waname];
                    }else{
                        await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","WAITING CODE TIME OUT");
                        return [false,waname,cancelRes];
                    }


                }catch (error){
                    console.log("can't send to whatsapp  code by emu i will try write by adb");
                    if(await this.detectanSmsPage()) {
                        await this.script.writetext(otp);
                        return [true,waname];
                    }else{
                        console.log("can't write otp")
                    }
                }
            }

        await new SabyInfoRepository().UpdateStatus("KILLED", "inactive","WAITING CODE TIME OUT");
        return [false,waname,cancelRes];

    }

    async detectanSmsPage(){

        await this.dumpScreenToFile();
        var WaitingSms = await this.SearchCoordinatesByString("Waiting to automatically detect an SMS");

        if(await this.python.exists(`${IMG}waitingSmsCode.png`,null,5) || WaitingSms[0] !== 0) {
            return true;
        }
        return false;
    }

    async formatNumber(num) {
        // Convert number to string
        let numStr = num.toString();

        // Insert hyphen at the desired position
        let formattedNum = numStr.slice(0, 3) + '-' + numStr.slice(3);

        return formattedNum;
    }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    async nextStep(){
          /// images\VerifyingYourNumber.png
          var isOtp = await this.python.exists(`${IMG}VerifyingYourNumber.png`,null,10);
          if(isOtp){
            return "getOtp";
          }else{
            return "codeValidation";
          }
    }
    async writeNumber(number){
        console.log("\n Number is : ",number);
        var codeNumber = number.toString().replace('/[^0-9]/',"");
        if(codeNumber.includes(": ")){
          codeNumber = codeNumber.split(": ")[1];
        }
       //await this.python.writeText(codeNumber);
       await this.script.writetext(codeNumber);
      }

   //! Not used
   async writeNumber2(number){
      console.log("\n Number is : ",number);
      var codeNumber = number.toString().replace('/[^0-9]/',"");
      if(codeNumber.includes(": ")){
        codeNumber = codeNumber.split(": ")[1];
      }
      console.log("\nCode Number is : ",codeNumber);
      var command  = `~/Android/Sdk/platform-tools/adb -s emulator-${this.emulatorPort} shell input keyevent `;
      for(var i =0; i < codeNumber.length ; i++){
       var adbCommand = command + this.getNumberAscii(codeNumber[i]);
       var cmd =  exec(adbCommand);
       await new Promise((res,rej)=>{
        cmd.stderr.on('data',(e)=>{
            console.log("writeNumber error",e);
        });
        cmd.on('close',(code)=>{
            res();
        });
       });
      }
    }
    getNumberAscii(number){
        switch(number){
            case 0: 
              return 144;
            case 1:
                return 145;
           case 2: 
           return 146;
         case 3:
             return 147;   
             case 4: 
              return 148;
            case 5:
                return 149;
                case 6: 
              return 150;
            case 7:
                return 151;
                case 8: 
              return 152;
            case 9:
                return 153;
        }
    }

    async listen_to_sound_enter_code_active(){
        await this.script.putAVDInFocus();
        var result = exec(`(timeout 8 parec --format=s16le --rate=44100 --channels=2 -d avd_to_app.monitor > output.raw && cat output.raw | pacat) & ${ADB} -s emulator-${this.emulatorPort} shell input tap 852 563`);
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                console.log("result Data from listen_to_sound_enter_code_active() => ",data);
            });
            result.stderr.on('data',(err)=>{
                console.log("result Error from listen_to_sound_enter_code_active() => ",err);
                reject();
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        var result2 =exec(`ffmpeg -f s16le -ar 44100 -ac 2 -i output.raw -y ~/output.wav`);
        await new Promise((resolve, reject)=>{
            result2.stdout.on('data',(data)=>{
                console.log("result2 Data from listen_to_sound_enter_code_active() => ",data);
            });
            result2.stderr.on('data',(err)=>{
                console.log("result2 Error from listen_to_sound_enter_code_active() => ",err);
            });
            result2.on('close',(code)=>{
                resolve();
            });
        });
    }

    //! Not used
    async SearchCoordinatesByStringOld(string){
        var xAxis =0;
        var yAxis =0;
        var response ;
        // TODO : return Data
        var result = exec("perl -ne '" + 'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /text="' + string + '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' + "' " + "window_dump.xml");
        console.log("--- SearchCoordinatesByString ---");
        await new Promise((resolve, reject)=>{
            console.log("Inside Promise");
            result.stdout.on('data',(data)=>{
                console.log("SearchCoordinatesByString Data");
                if(data.includes(" ")){
                     var x = data.replace("\r","");
                     var y = x.replace("\n","");
                     response = y.split(" ");
                     xAxis = response[0];
                     yAxis = response[1];
                }
            });            
            result.stderr.on('data',(e)=>{
                console.log("Error SearchCoordinatesByString => ",e);
                reject();
            })
            result.on('message',(msg)=>{
                console.log("msg => ",msg);
            })
            result.on('close',(code)=>{
                console.log(`SearchCoordinatesByString close with code : ${code}`);
                resolve();
            });
        });
        console.log("--- return ---");
        return [xAxis,yAxis];
    }

   async dumpScreenToFile(){
    // /dev/tty > ${this.dumpScreenFile}
        var result = exec(`${ADB} -s emulator-${this.emulatorPort} exec-out uiautomator dump `);
        await new Promise((resolve, reject)=>{
            result.stderr.on('error',(err)=>{
                console.log(`\n \nError in dumpScreenToFile() class ActivationScript : ${err} \n *Promise Rejected*\n \n`);
                reject();
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
    }
async SearchCoordinatesByString(string){
    var xAxis =0;
    var yAxis =0;
    var file = exec(`${ADB} -s emulator-${this.emulatorPort} shell cat /sdcard/window_dump.xml`);
    await new Promise((resolve, reject)=>{
        file.stderr.on('data',(err)=>{
            console.log("ActivationScript class =>  searchStringInDumpScreen Error : ",err);
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
    async searchStringInDumpScreen(string){
            var found =false;
            // adb pull /sdcard/window_dump.xml ./window_dump.xml
            //var file = exec("adb pull /sdcard/window_dump.xml ./window_dump.xml");
            var file = exec(`${ADB} -s emulator-${this.emulatorPort} shell cat /sdcard/window_dump.xml`);
            await new Promise((resolve, reject)=>{
                file.stderr.on('data',(err)=>{
                    console.log("searchStringInDumpScreen Error : ",err);
                    reject();
                });
                file.stdout.on('data',(data)=>{     
                    if(data.includes(string)){
                        found= true;
                    }
                });
                file.on('close',(code)=>{
                    resolve();
                });
            });
        return found;
    }
    //! Not used
    async SearchCoordinatesByResourceId(string){
        var xAxis =0;
        var yAxis =0;
        var response ;
        var result =exec("perl -ne '" +'printf "%d %d\n", ($1+$3)/2, ($2+$4)/2 if /resource-id="' +string + '"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/' + "' " + this.dumpScreenFile)
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                if(data.includes(" ")){
                    var x = data.replace("\r","");
                    var y = x.replace("\n","");
                    response = y.split(" ");
                    xAxis = response[0];
                    yAxis = response[1];
               }
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        return [xAxis,yAxis];
    }

}