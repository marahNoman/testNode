import net from 'net';
import {SocketScript} from "../scripts/SocketScript.js";
import {SabyInfoRepository} from "../Repository/SabyInfoRepo.js";

export class SocketManager {
    constructor(port) {
        this.server = null;
        this.port = port;
        this.SocketScript=new SocketScript();
    }

    createSocket(timeout) {
        return new Promise((resolve, reject) => {
            let port = this.port;
            let timeoutId;

            this.server = net.createServer((socket) => {
                clearTimeout(timeoutId);  // Clear the timeout when the socket is successfully created
                resolve(socket); // Resolve the promise with the socket
            });

            this.server.on("error", (error) => {
                clearTimeout(timeoutId);  // Clear the timeout on error
                reject(`Server Error: ${error.message}`);
            });

            this.server.listen(port, async () => {
                await new SabyInfoRepository().UpdateStatus("Ready", null,"WAITING COMMANDS");
                await this.SocketScript.UpdateSocketPool('t', port);
                console.log(`TCP socket server is running on port: ${port}`);
            });

            // Set a timeout for creating the socket
            timeoutId = setTimeout(async () => {
                await this.SocketScript.UpdateSocketPool('f', this.port);
                this.server.close();  // Close the server
                reject("Socket creation timed out");
            }, timeout);

        });
    }
    async isSocketNotTimedOut(socket) {
        let  status=false;
        socket.on('disconnect', function () {
            status= true;
        });
        return status;
    }


    async closeSocket() {
        if (this.server) {
            await this.SocketScript.UpdateSocketPool('f', this.port);
            this.server.close();
            console.log("TCP socket server closed");
        }
    }
}
