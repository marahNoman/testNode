import { AVDScript } from "./avd_script.js";
import { Checker } from "../helpers/Checker.js";
import { SabyInfoRepository } from "../Repository/SabyInfoRepo.js";
import { Python } from "../helpers/Python.js";
import { VpnHelper } from "../helpers/VpnHelper.js";
import { Helper } from "../helpers/Helper.js";
import { SocketManager } from "../helpers/SocketManager.js";
import { WhatsAppHelper } from "../helpers/WhatsApp.js";
import { exec } from "child_process";
import { BehaviourScript } from "./BehaviortScripts.js";
import { WhatsappActivation } from "./ActivationScript.js";
const IMG = `images/`;
export class MainScript {
  python = new Python();
  constructor() {}

  async init() {
    try {
      const helper = new Helper();
      await helper.insttalPip();
      new SabyInfoRepository().UpdateStatus("New");
      const avdScript = new AVDScript(true);
      var exist = await avdScript.checkIfAvdExist("GB");
      if (!exist) {
        await new SabyInfoRepository().UpdateStatus("KILLED", null, "NO AVD");

        console.log("MainScript create avd");
        await avdScript.createAvds("GB");
      }

      await avdScript.avdStart();
      await this.delayFunc(4500); // wait 4.5 seconds for avd to start

      return true;
    } catch (err) {
      console.log(`Error Occurred => ${err}`);
      await new SabyInfoRepository().UpdateStatus(
        "An Error Occurred while init MainScript"
      );
      return false;
    }
  }

  async validate(alpha, countryId, apiRoute) {
    try {
      const avdScript = new AVDScript(true);
      var isRunning = await avdScript.isAVDRunning();

      console.log("Running Avd in MainScript");
      await avdScript.avdStart();
      await this.delayFunc(4500); // wait 4.5 seconds for avd to start

      var checker = new Checker();
      await checker.init();
      await checker.CheckGpuDriverWindow();
      await this.delayFunc(3000);
      let countBoot = 0;
      var isBoot = await checker._checkAVDIsBootCompleted();
      while (!isBoot && countBoot < 5) {
        console.log(`wait for boot ${countBoot}`);
        await this.delayFunc(7000);
        isBoot = await checker._checkAVDIsBootCompleted();
        countBoot++;
      }

      if (!isBoot) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "EMULATOR NOT BOOTING"
        );
        return false;
      }
      console.log("device ready");
      await this.delayFunc(5000);
      await avdScript.changeDeviceName("saby");

      var isVpnInstalled = await checker.isWireguardAppInstalled();
      if (!isVpnInstalled) {
        await new SabyInfoRepository().UpdateStatus(
          "ACTIVATING",
          null,
          "INSTALLING VPN"
        );
        await avdScript.installApp("../SabyDemo/apk/wireguard.apk");
        var checkInstalled = await checker.isWireguardAppInstalled();
        if (!checkInstalled) {
          await new SabyInfoRepository().UpdateStatus(
            "KILLED",
            null,
            "Wireguard VPN NOT INSTALLED"
          );
          return false;
        }
      }
      await avdScript.installApp("../SabyDemo/apk/IPLocation.apk");
      console.log(`ConnectWireGuard: ${alpha},${countryId},${apiRoute}`);
      await new VpnHelper(avdScript.getEmulatorPort()).ConnectWireGuard(
        alpha,
        countryId,
        apiRoute
      );

      if (!(await checker.isVpnConnected())) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "ACTIVATION VPN NOT CONNECTING"
        );
        return false;
      }

      var isinternet = await checker.isInternetWorking();
      if (!isinternet) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "NO INTERNET"
        );
        return false;
      }

      var CheckProxmox = await checker.CheckProxmox();
      if (!CheckProxmox) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "ACTIVATION PROXMOX"
        );
        return false;
      }

      return true;
    } catch (error) {
      console.log(`Error Occurred => ${error}`);
      return false;
    }
  }

  // check if saby already activated
  async CheckIfActivated() {
    try {
      console.log(" --- CheckIfActivated() --- ");
      await this.delayFunc(2000);
      const avdScript = new AVDScript(true);
      const checker = new Checker();
      const helper = new Helper();
      const waHelper = new WhatsAppHelper();

      await waHelper.init();
      await checker.init();
      await this.delayFunc(2000);
      avdScript.HomeBtn();
      //#region Get avd name

      var GB = await helper.getGB();

      //#endregion
      await avdScript.avdStart(GB);
      await this.delayFunc(5000);
      avdScript.HomeBtn();

      await checker.CheckGpuDriverWindow();
      await this.delayFunc(3000);

      console.log("checking boot");
      var isBoot = await checker._checkAVDIsBootCompleted();
      var countBoot = 0;
      while (!isBoot && countBoot < 5) {
        console.log("wait for boot");
        await this.delayFunc(7000);
        isBoot = await checker._checkAVDIsBootCompleted();
        countBoot++;
      }
      if (!isBoot) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "EMULATOR NOT BOOTING"
        );
        return false;
      }

      await helper.insttalPip();
      console.log("is apps ready");
      var appsReady = await checker.isAppsReady();
      if (!appsReady) {
        console.log("Apps not ready (vpn, whatsapp)");
        return false;
      }
      console.log("run application");
      await this.delayFunc(1000);
      var whatsappStarted = await waHelper.runApplication();
      if (!whatsappStarted) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          null,
          "CAN't OPEN WHATSAPP"
        );
        return false;
      }
      var needsUpdate = await waHelper.needsUpdate();
      if (needsUpdate) {
        avdScript.HomeBtn();
        if (!(await waHelper.updateWhatsappVersion())) {
          await new SabyInfoRepository().UpdateStatus(
            "Can't update WhatsApp",
            null,
            "STUCK"
          );
          return;
        }
        await this.delayFunc(1000);
        await waHelper.runApplication();
        await this.delayFunc(3000);
      }

      console.log("serach for profile info");

      if (
        (await this.python.exists(`${IMG}profileINfo.png`, null, 10)) ||
        (await avdScript.SearchString("Profile info"))
      ) {
        console.log("found Profile info");
        await new SabyInfoRepository().Modify(
          true,
          id,
          GB,
          null,
          null,
          "Activated"
        );
        await new SabyInfoRepository().UpdateStatus(
          "PROFILE INFO STUCK",
          null,
          "STUCK"
        );
        return true;
      }

      await avdScript.dumpScreenToFile();
      const whatsappActivation = new WhatsappActivation(
        avdScript.getEmulatorPort()
      );

      await avdScript._getApiData();
      await avdScript.doJob();

      let check_whatsapp_notactive =
        await whatsappActivation.check_whatsapp_notactive();
      if (check_whatsapp_notactive[0]) {
        await new SabyInfoRepository().UpdateStatus(
          "KILLED",
          "inactive",
          check_whatsapp_notactive[1]
        );
        await new SabyInfoRepository().Modify(false, id, GB, "", "", null);
        return;
      }

      var YourEmail = await this.python.exists(
        `${IMG}EnterYourEmail.png`,
        null,
        10
      );
      if (YourEmail) {
        this.script.backBtn();
        await this.python.findAndClick(`${IMG}NotNowEnterEmail.png`, null, 5);
      }

      var id = await avdScript.getEmulatorAndroidID();
      var nameAndNumber = await waHelper.GetUserNameAndPhoneNumber();

      if (nameAndNumber) {
        if (nameAndNumber[0] == "stuck") {
          await new SabyInfoRepository().UpdateStatus(
            "PROFILE INFO STUCK",
            null,
            "STUCK"
          );
          // check Profile info
          const behaviourScript = new BehaviourScript(
            avdScript.getEmulatorPort()
          );
          let name = await helper.GenerateName();
          await behaviourScript.check_profile_info(name);
          await this.delayFunc(5000);
          await new SabyInfoRepository().StartSaby();
          return false;
        }
        await new SabyInfoRepository().Modify(
          true,
          id,
          GB,
          nameAndNumber[0],
          nameAndNumber[1],
          null
        );
        await new SabyInfoRepository().AddSabyGroup(
          nameAndNumber[0],
          nameAndNumber[1]
        );
        return true;
      }
      //
      // await waHelper.runApplication();
      // if(await this.checkWhatsappImages()){
      //     await new SabyInfoRepository().UpdateStatus("Something Wrong",null,"Can't Check Is Active Or Not");
      //     return false;
      //
      //  }

      console.log("is Blocked ");
      var isBlocked = await waHelper.IsWhatsappBlocked();
      console.log("*****Is Whatsapp Blocked : ", isBlocked);
      avdScript.HomeBtn();
      return true;
    } catch (e) {
      console.log(`Error in CheckIfActivated() ${e}`);
      return false;
    }
  }
  async checkWhatsappImages() {
    return (
      !(await this.python.exists(`${IMG}zoomWhatsapp.png`, null, 5)) ||
      !(await this.python.exists(`${IMG}WhatsAppImage.png`, null, 5)) ||
      !(await this.python.exists(`${IMG}whatsappZoomwhite.png`, null, 5)) ||
      !(await this.python.exists(`${IMG}WhatsappImageWhite.png`, null, 5))
    );
  }

  delayFunc(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  delayFuncRandom(startTime, endTime) {
    var delayTime =
      Math.floor(Math.random() * (endTime - startTime + 1)) + startTime;
    // console.log("delayFuncRandom",delayTime);
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }
  async swipeRandom(start_x, start_y, end_x, end_y, swipeUpSpeed) {
    var user = os.userInfo().username;
    const ADB = `/home/${user}/Android/Sdk/platform-tools/adb`;

    console.log("swipeRandom start");
    var swipeUpRandom = exec(
      `${ADB} -s emulator-5164 shell input swipe ${start_x} ${start_y} ${end_x} ${end_y} ${swipeUpSpeed}`
    );
    await new Promise((resolve, reject) => {
      swipeUpRandom.on("close", (code) => {
        resolve();
      });
    });
    console.log("swipeRandom end");
  }
}
