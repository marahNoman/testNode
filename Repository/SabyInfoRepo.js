import os from 'os';
import { Helper } from '../helpers/Helper.js';
import { AVDScript } from '../scripts/avd_script.js';

export class SabyInfoRepository{

    constructor(){

    }

  async GetEmulatorPorts(){
        var avdName,emulatorPort,adbPort;
      var helper = new Helper();
        var thisUser= await helper.getSabyName();
       await new Promise((resolve,reject)=>{
        global.sabyService.GetEmulatorPorts({username:thisUser},
            (err,response)=>{
                if(err){
                    console.log("GetEmulatorPorts Error : ",err);
                    return ["GB",5554,5555];
                }              
                emulatorPort = response.emulatorPort;
                adbPort= response.adbPort;
                avdName= response.avdname;
                resolve();
        });
       }); 
        await this.delayFunc(500);
        return [avdName,emulatorPort,adbPort];
    }

    async StartSaby(){

        var helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);
        var thisUser= await helper.getSabyName();
        await new Promise((resolve,reject)=>{
            global.sabyService.StartSaby({username:thisUser},
                (err,response)=>{
                    if(err){
                        console.log("Error Start saby");
                    }
                    resolve();
                });
        });
    }
    async getSabyGroup(username){

        let data=null;
        await new Promise((resolve,reject)=>{
            global.sabyService.getSabyGroup(
                {
                    username:username
                },
                (err,response)=>{
                    if(err){
                        console.log("Error get Saby group");
                    }
                    if(response){
                        data= response.list;
                        console.log(`get saby group Grpc data ${response.executed}`)
                    }else{
                        console.log("can't get saby group or  saby not register")
                    }
                    resolve();
                });
        });
        return data;
    }

    async AddSabyGroup(waName,phoneNumber){


        var helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);
        var thisUser= await helper.getSabyName();
        await new Promise((resolve,reject)=>{
            global.sabyService.AddSabyGroup({username:thisUser,phoneNumber:phoneNumber,waName:waName},
                (err,response)=>{
                    if(err){
                        console.log("Error add Saby group");
                    }
                    if(response){
                        console.log(`add saby group Grpc data ${response.executed}`)
                    }
                    resolve();
                });
        });
    }


    async RemoveSabyFromGroup(){


        var helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);
        var thisUser= await helper.getSabyName();
        await new Promise((resolve,reject)=>{
            global.sabyService.removeSabyFromGroup({username:thisUser},
                (err,response)=>{
                    if(err){
                        console.log("Error add Saby group");
                    }
                    if(response){
                        console.log(`saby group Grpc  ${response.executed}`)
                    }
                    resolve();
                });
        });
    }

    delayFunc(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    async GetCheckerConstructorData(){

        var helper = new Helper();
        var thisUser= await helper.getSabyName();
        var emulatorPort,application,emulatorBaseName,emulatorID,emulatorAlpha,asteriskHost;
        await this.delayFunc(1000);
        await global.sabyService.FindByUsername({username:thisUser},(err,response)=>{
            if(err){
                console.log("GetCheckerConstructorData Error :",err);
                return [emulatorPort,application,emulatorBaseName,emulatorID,emulatorAlpha,asteriskHost];
            }
            
            emulatorPort     = response.emulatorPort;
            application      = "whatsapp";
            emulatorBaseName = response.avdName;
            emulatorID       = response.emulatorID;
            emulatorAlpha    = response.emulatorAlpha;
            asteriskHost     = response.hostAsterisk;
        });
        await this.delayFunc(1000);
        return [emulatorPort,application,emulatorBaseName,emulatorID,emulatorAlpha,asteriskHost];
    }

    async FindByUsername(){
        var helper = new Helper();
        var thisUser=  await helper.getSabyName();
        var emulatorPort,application,emulatorBaseName,emulatorID,emulatorAlpha,asteriskHost,sabyStatus,endPoint,waName,phoneNumber,activated,avdName;
        await this.delayFunc(1000);
        await global.sabyService.FindByUsername({username:thisUser},(err,response)=>{
            if(err){
                console.log("FindByUsername Error :",err);
                return {"emulatorPort":emulatorPort,"application":application,"emulatorBaseName":emulatorBaseName,"emulatorID":emulatorID,"emulatorAlpha":emulatorAlpha,"asteriskHost":asteriskHost,"sabyStatus":sabyStatus,"activated":activated,'avdName':avdName};
            }

            emulatorPort     = response.emulatorPort;
            endPoint     = response.endPoint;
            application      = "whatsapp";
            emulatorBaseName = response.avdName;
            emulatorID       = response.emulatorID;
            emulatorAlpha    = response.emulatorAlpha;
            asteriskHost     = response.hostAsterisk;
            sabyStatus     = response.sabyStatus;
            waName     = response.waName;
            phoneNumber     = response.phoneNumber;
            activated     = response.activated;
            avdName     = response.avdName;
        });
        await this.delayFunc(1000);
        return {
            "emulatorPort":emulatorPort,
            "application":application,
            "emulatorBaseName":emulatorBaseName,
            "emulatorID":emulatorID,
            "emulatorAlpha":emulatorAlpha,
            "asteriskHost":asteriskHost,
            "sabyStatus":sabyStatus,
            "endPoint":endPoint,
            "waName":waName,
            "phoneNumber":phoneNumber,
            "activated":activated,
            "avdName":avdName,
        };
    }



  async Register(endPoint,alpha='A'){
        var thisUser= os.userInfo().username +"@"+os.hostname()+'-'+alpha;
        var thisipAddress = endPoint.toString().split(":")[0];
        var helper = new Helper();
        var ePort = await helper.generatePortNumber();
        var adbport = await helper.generatePortNumber();
        if(ePort == adbport){
            adbport = await helper.generatePortNumber();
        }
        var alphaNumber=await this.getAlphaNumber(alpha);
        //TODO Get number of avds and numbers
        global.sabyService
        .Register({
            endPoint:endPoint,
            username: thisUser,
            ipAddress:thisipAddress,
            hostName:os.hostname(),
            hostType:".",
            hostAPI:".",
            hostAsterisk:"135.181.130.186:1992",// TO DO GET FROM CONFIG
            hostBeanstalk:".",
            emulatorAlpha:`${alpha}`,
            emulatorID:".",
            emulatorPort:ePort,
            adbPort:adbport,
            emulatorX:"70",
            emulatorY:"27",
            emulatorWidth:"411",
            emulatorHeight:"720",
            androidProfile:"29",
            profileType:"wa",
            avdName:`GB${alphaNumber}`,
            vpnRegion:"",
        },(err,response)=>{
            if(err){
                console.log("err : ",err);
            }
            //* Stop Avd in case it was running

            var script = new AVDScript(false);
            script.avdStop();
        });
    }

    async getAlphaNumber(alpha){
        let number='';
        switch (alpha){
            case "B":
                number='1'
                break;
            case "C":
                number='2'
                break;
        }
        return number;
    }

    async Modify(activate, emulatorId, avdname, waName, phoneNum, status) {
        console.log("Repository -> Modify() : \n");
        var helper = new Helper();

        var thisUser = await helper.getSabyName();
        global.sabyService
            .Modify({
                username: thisUser,
                emulatorId: emulatorId,
                avdName: avdname,
                waName: waName,
                phoneNumber: phoneNum,
                activated: activate,
                sabyStatus: status,
            }, (err, response) => {
                if (err) {
                    console.log("Modify err : ", err);
                }
                console.log("Modify response : ", response);
            });
    }


    async AddDeactiveSaby(DeActiveReason) {

        var helper = new Helper();
        var fname=await helper.getFunctionName();
        console.log(`inside ${fname}`);

        var username = await helper.getSabyName();

        global.sabyService
            .AddDeactiveSaby({
                username: username,
                status: DeActiveReason,

            }, (err, response) => {
                if (err) {
                    console.log("err : ", err);
                }

            });
    }

    async UpdateStatus(newStatus, activationStatus,statusDetails=null) {
        var helper = new Helper();
        var username = await helper.getSabyName();
        // logical condition
        var activeStatus = activationStatus == null ? "" : (typeof activationStatus == 'undefined' ? "" : activationStatus)
        global.sabyService
            .UpdateStatus({
                username: username,
                status: newStatus,
                activationStatus: activeStatus,
                statusDetails:statusDetails

            }, (err, response) => {
                if (err) {
                    console.log("err : ", err);
                }

            });
    }



}