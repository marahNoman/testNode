import { SipAndLinphone } from "./helpers/SipAndLinphone.js";
import { Helper } from "./helpers/Helper.js";
import { MainScript } from "./scripts/MainScript.js";
import { ActivationService } from "./services/ActivationServices.js";
import { InitializeService } from "./services/InitializeService.js";
import { TestModeServices } from "./services/TestModeServices.js";
import { BehaviourServices } from "./services/BehaviourServices.js";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { SocketScript } from "./scripts/SocketScript.js";
import { CleanupScript } from "./scripts/CleanupScript.js";
import { SabyInfoRepository } from "./Repository/SabyInfoRepo.js";
import { AVDScript } from "./scripts/avd_script.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import process from "node:process";
import { BehaviourScript } from "./scripts/BehaviortScripts.js";
import { exec } from "child_process";
import { Python } from "./helpers/Python.js";

import os from "os";
var user = os.userInfo().username;
const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;
const IMG = `images/`;

console.time("dbsave");

console.log(" Running ... ");

//#region Client
const activationPackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/Activation.proto")
);
const activationProto = grpc.loadPackageDefinition(activationPackageDefinition);

const ConfigurationPackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/GeneralConfiguration.proto")
);
const ConfigurationProto = grpc.loadPackageDefinition(
  ConfigurationPackageDefinition
);

const sabyprofilePackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/sabyProfile.proto")
);
const sabyprofileProto = grpc.loadPackageDefinition(
  sabyprofilePackageDefinition
);

const countryPackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/Countries.proto")
);
const countryProto = grpc.loadPackageDefinition(countryPackageDefinition);

const connectPackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/ConnectNode.proto")
);
const connectProto = grpc.loadPackageDefinition(connectPackageDefinition);

const socketCallDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/SocketCall.proto")
);
const socketCallProto = grpc.loadPackageDefinition(socketCallDefinition);

const DoJobDefinition = protoLoader.loadSync(
  path.join(__dirname, "./serverProtos/DoJob.proto")
);
const DoJobProto = grpc.loadPackageDefinition(DoJobDefinition);

const countriesService = new countryProto.Countries(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

global.ConfigurationService = new ConfigurationProto.GeneralConfigurations(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

global.sabyService = new sabyprofileProto.SabysProfiles(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

global.ServerActivation = new activationProto.Activations(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

global.SocketCall = new socketCallProto.SocketCall(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

global.DoJob = new DoJobProto.DoJob(
  "65.109.78.162:80",
  grpc.credentials.createInsecure()
);

//#endregion
//#region Server
const packageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./protos/test.proto")
);
const processingProto = grpc.loadPackageDefinition(packageDefinition);

const ActivationpackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./protos/NodeActivation.proto")
);
const activationProtoservice = grpc.loadPackageDefinition(
  ActivationpackageDefinition
);

const InitializepackageDefinition = protoLoader.loadSync(
  path.join(__dirname, "./protos/Initialize.proto")
);
const initializeProtoservice = grpc.loadPackageDefinition(
  InitializepackageDefinition
);

const testModeServicesDefinition = protoLoader.loadSync(
  path.join(__dirname, "./protos/TestModes.proto")
);
const testModeProtoServices = grpc.loadPackageDefinition(
  testModeServicesDefinition
);

const behaviorDefinition = protoLoader.loadSync(
  path.join(__dirname, "./protos/Behavior.proto")
);
const behaviorProtoService = grpc.loadPackageDefinition(behaviorDefinition);

//#endregion

const helper = new Helper();

const script = new MainScript();
const socketScript = new SocketScript();
const cleanUpScript = new CleanupScript();
const activationService = new ActivationService();
const initializeService = new InitializeService();
const testModeServices = new TestModeServices();
const behaviorService = new BehaviourServices();

const server = new grpc.Server();
server.addService(activationProtoservice.NodeActivation.service, {
  StartActivation: activationService.startActivation,
  StartManualActivation: activationService.StartManualActivation,
});

server.addService(initializeProtoservice.Initialize.service, {
  CreateAvd: initializeService.CreateAvd,
  StartAvd: initializeService.StartAvd,
  StopAvd: initializeService.StopAvd,
  SwitchAvd: initializeService.SwitchAvd,
  DeleteAvd: initializeService.DeleteAvd,
  UpdateWhatsapp: initializeService.UpdateWhatsApp,
  RegisterMutliAvd: initializeService.RegisterMutliAvd,
});

server.addService(testModeProtoServices.TestModes.service, {
  StartTestMode: testModeServices.StartTestMode,
});

server.addService(behaviorProtoService.Behavior.service, {
  OneToOne: behaviorService.startOnetoOneMsg,
  SingleBehaviour: behaviorService.SingleBehaviour,
  addContacts: behaviorService.addContacts,
  ReplayMessage: behaviorService.ReplayMessage,
  AnswerCall: behaviorService.AnswerCall,
});

try {
  helper.getEndPoint(true).then(async (endPoint) => {
    console.log("This endpoint : ", endPoint);
    server.bindAsync(
      endPoint,
      grpc.ServerCredentials.createInsecure(),
      async () => {
        console.log(`process.argv[3] : ${process.argv[3]}`);
        server.start();
        await new SabyInfoRepository().UpdateStatus(
          "Preparing",
          null,
          "Working"
        );
      }
    );

    if (process.argv[3] != null && process.argv[3] === "Activation") {
      console.log(`process.argv[3] ${process.argv[3]}`);
      console.log("confirm ready activation");
      await new SabyInfoRepository().UpdateStatus(
        "Saby Ready To Activate",
        null,
        "NULL"
      );
      return;
    }

    // check if request for register
    if (process.argv[3] != null && process.argv[3] === "register") {
      console.log("register done");
      return;
    }

    //--------------------- check If GB exist--------
    const avdScript = new AVDScript(true);
    var GB = await helper.getGB();
    var exist = await avdScript.checkIfAvdExist(GB);
    if (!exist) {
      console.log("No GB Found");
      await new SabyInfoRepository().UpdateStatus(
        "Saby Ready To Activate",
        null,
        "NULL"
      );
      return;
    }
    //---------------------------------------/

    script.CheckIfActivated().then(async (activated) => {
      if (!activated) {
        console.log("\n * No avd activated, Starting init script. \n");

        return;
        //TODO update saby data to activated false and activationStatus Not Active
      } else {
        const py = new Python();
        console.log("saby activated");
        console.log("inside stopWhatsapp test >>>>>>>>>>>>>>>>>>>>>>>>");
        console.log(`${ADB} -s emulator-5164 shell am force-stop com.whatsapp`);
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        var newChat = await py.findAndClick(`${IMG}newChatTest.png`, null, 5);
        if (!newChat) {
          console.log("newChat img not found");
        } else {
          console.log("newChat img found");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        var messageYourself = await py.findAndClick(
          `${IMG}messageYourselfTest.png`,
          null,
          5
        );
        if (!messageYourself) {
          console.log("messageYourself img not found");
        } else {
          console.log("messageYourself img found");
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
        var text = "Hii";
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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        var emojiIcon = await py.findAndClick(`${IMG}emojiIcon.png`, null, 5);
        if (!emojiIcon) {
          console.log("emojiIcon img not found");
        } else {
          console.log("emojiIcon img found");
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        var minClicks = 1; // Minimum number of clicks
        var maxClicks = 10; // Maximum number of clicks

        var numberOfClicks =
          Math.floor(Math.random() * (maxClicks - minClicks + 1)) + minClicks;

        var smailIcon = await py.findAndClick(
          `${IMG}smailIcon.png`,
          null,
          numberOfClicks
        );

        if (!smailIcon) {
          console.log("smailIcon img not found");
        } else {
          console.log("smailIcon img found");
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        exec(
            `${ADB} -s emulator-5164 shell input keyevent KEYCODE_BACK`
          );
        
        await new Promise((resolve) => setTimeout(resolve, 1500));

        var sendMessage = await py.findAndClick(
          `${IMG}sendMessageTest.png`,
          null,
          5
        );
        if (!sendMessage) {
          console.log("sendMessage img not found");
        } else {
          console.log("sendMessage img found");
          return;
        }
        // //check if saby not register in active side
        // let FindByUsername=await new SabyInfoRepository().FindByUsername();
        // if(FindByUsername.activated){
        //     await new SabyInfoRepository().Modify(true, FindByUsername.emulatorID, FindByUsername.avdName, FindByUsername.waName, FindByUsername.phoneNumber, null);
        // }

        // // check Profile info
        // const behaviourScript= new BehaviourScript(avdScript.getEmulatorPort());
        // let name = await helper.GenerateName();
        // await behaviourScript.check_profile_info(name);

        // if(await behaviourScript.check_stuck_profile_info()){

        //     await new SabyInfoRepository().UpdateStatus("PROFILE INFO STUCK",null,'STUCK');
        //     return false;

        // }

        // //check if have image and add if not have
        // await behaviourScript.check_if_have_image();

        // //check linphone
        // const sipAndLinphone = new SipAndLinphone("135.181.130.186:1992");
        // await sipAndLinphone.startLinphoneApp();

        // //do job
        // let jobs = [];
        // jobs = await helper.checkIfHaveJob('Preparing');
        // console.log(`Ready ${jobs}`);
        // if (jobs) {
        //     await helper.doJobs(jobs)
        // }

        // await new SabyInfoRepository().UpdateStatus("FIRST BEHAVIOR",null,'BEHAVIOR');
        // jobs = await helper.checkIfHaveJob('First Behavior');
        // console.log(`Ready ${jobs}`);
        // if (jobs) {
        //     await helper.doJobs(jobs);
        // }

        // // clean up
        // await cleanUpScript.avdChecker();
      }
    });
  });
} catch (error) {
  console.log("index catch : ", error);
  helper.getEndPoint(true).then((endPoint) => {
    console.log("This endpoint : ", endPoint);
    server.bindAsync(endPoint, grpc.ServerCredentials.createInsecure(), () => {
      server.start();
    });
    script.CheckIfActivated();
  });
}
