
import {exec} from "child_process";
import {AVDScript} from '../scripts/avd_script.js';
import {Helper} from "./Helper.js";
const IMG = `images/`;

export class Python{

    xAxis   =0;
    yAxis   =0;
    hight   =0;
    width   =0;
    script = new AVDScript(true);
    constructor(){}

    setDefaultRegion(xAxis,yAxis,hight,width){
        this.xAxis= xAxis;
        this.yAxis =yAxis;
        this.hight=hight;
        this.width=width;
    }

   async exists(imgPath,searchRegion,timeOut){
       const helper = new Helper();
       var fname=await helper.getFunctionName();
       console.log(`inside ${fname}`);

        var exits =false;
        var region;
        if(searchRegion != null && searchRegion != "")
             region = searchRegion.toString().split(",");
        else{
            region =[];
            region[0]= this.xAxis;
            region[1]=this.yAxis;
            region[2]=this.hight;
            region[3]=this.width
        }
        
        var result = exec(`pythonScripts/findImage.py ${imgPath} ${region[0]} ${region[1]} ${region[2]} ${region[3]} ${timeOut}`);
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                console.log(`python exists : ${data}`);
                 var response = data.toString().split(",")[0];
                if(response == 1){
                    exits =true;
                }
            });
            result.on('close',(code)=>{
                resolve();
            });
        });

        return exits;
    }

    async getNumberFromSound(){
        var response;
        var result = exec(`pythonScripts/getNumberFromSound.py`);
        await new Promise((resolve, reject)=>{
            result.stderr.on('data',(err)=>{
                console.log(`Error in getNumberFromSound ${err}`);
                reject();
           });
            result.stdout.on('data',(data)=>{
                console.log(`Data in getNumberFromSound ${data}`);
                 response = data;
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        return response;
    }

    async findAndClick(imgPath,searchRegion,timeOut){
        var clicked =false;
        
        var region;
        if(searchRegion != null && searchRegion != "")
             region = searchRegion.toString().split(",");
        else{
            region =[];
            region[0]= this.xAxis;
            region[1]=this.yAxis;
            region[2]=this.hight;
            region[3]=this.width
        }
        // pythonScripts/findImageAndClick.py
        var result = exec(`pythonScripts/findImageAndClick.py ${imgPath} ${region[0]} ${region[1]} ${region[2]} ${region[3]} ${timeOut}`);
        await new Promise((resolve, reject)=>{
            result.stderr.on('data',(error)=>{
                console.log(`Python findAndClick() Error=> ${error}`);
            })
            result.stdout.on('data',(data)=>{
                console.log(`Python findAndClick() path "${imgPath}" => ${data}`);
                 var response = data.toString().split(",")[0];
                if(response == 1){
                    clicked =true;
                }
            });
            result.on('close',(code)=>{
                resolve();
            });
        });

        return clicked;
    }

    async click(xAxis,yAxis){
        var result = exec(`pythonScripts/click.py ${xAxis} ${yAxis}`);
        await new Promise((resolve, reject)=>{
            result.on('close',(code)=>{
                resolve();
            });
        });
    }

    async writeText(text){
        
       var written =false;
       var script = new AVDScript(true);
       await new Promise(resolve => setTimeout(resolve, 2000));
       var focus =  await script.putAVDInFocus();
        if(focus){
            var result = exec(`pythonScripts/writeText.py ${text}`);
            await new Promise((resolve, reject)=>{
                result.stderr.on('data',(err)=>{
                    console.log("python writeText -> error while typing : ",err);
                })
                result.on('close',(code)=>{
                    console.log("python writeText -> exited with code : ",code);
                    written =true;
                    resolve();
                });
            });
        }
        return written;
    }
    async writeMsg(text,interval){
        console.log("send message by python")
        var written =false;


        const script = new AVDScript();
        await script._getApiData();




        if(await this.exists(`${IMG}message_box_writer.png`, null, 10)){

            await this.findAndClick(`${IMG}message_box_writer.png`, null, 10)


            // var textArray = String(text).split(" ");
            console.log(`text ${text}`);
            var result = exec(`pythonScripts/writeMsg.py '${text}' ${interval}`);
            await new Promise((resolve, reject)=>{
                result.stderr.on('data',(err)=>{
                    console.log("python writeMsg -> error while typing : ",err);
                })
                result.on('close',(code)=>{
                    console.log("python writeMsg -> exited with code : ",code);
                    written =true;
                    resolve();
                });
            });

        }else{
            console.log("can't send message i can't find message place")
        }
         return written;
     }
     async writeCustomMessage(text){
         // var interval =(Math.random() * (0.33 - 0.14) + 0.14)
         var interval =1;

         var written =false;
         var result = exec(`pythonScripts/writeMsg.py '${text}' ${interval}`);
         await new Promise((resolve, reject)=>{
             result.stderr.on('data',(err)=>{
                 console.log("python writeMsg -> error while typing : ",err);
             })
             result.on('close',(code)=>{
                 console.log("python writeMsg -> exited with code : ",code);
                 written =true;
                 resolve();
             });
         });
     }
    async keyDown(btn){
        var result = exec(`pythonScripts/pressButton.py ${btn}`);
        await new Promise((resolve, reject)=>{
            result.on('close',(code)=>{
                resolve();
            });
        });
    }

    async searchStringInScreenShot(string, searchRegion, timeOut){
        var found =false;
        var region;
        if(searchRegion != null && searchRegion != "")
             region = searchRegion.toString().split(",");
        else{
            region =[];
            region[0]= this.xAxis;
            region[1]=this.yAxis;
            region[2]=this.hight;
            region[3]=this.width
        }
        var result = exec(`pythonScripts/getStringFromScreenShot.py ${region[0]} ${region[1]} ${region[2]} ${region[3]} ${timeOut} ${string}`);
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                if(data != "" && data.includes(",")){
                    var response = data.toString().split(",")[0];
                    if(response == 1)
                        found =true;
                }
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        return found;
    }

    async rebootAVDByUI(){
        var result = exec(`pythonScripts/rebootAvdByUI.py`);
        await new Promise((resolve, reject)=>{
            result.on('close',(code)=>{
                resolve();
            });
        });
    }

    async generatePhoto(){
        var fname=await new Helper().getFunctionName();
        console.log(`inside ${fname}`);

        var status=false;
        var result = exec(`pythonScripts/generate_photo.py`);
        await new Promise((resolve, reject)=>{
            result.stdout.on('data',(data)=>{
                console.log(`python exists : ${data}`);
                var response = data.toString().split(",")[0];
                if(response == 1){
                    status =true;
                }
            });
            result.on('close',(code)=>{
                resolve();
            });
        });
        return status;
    }

}