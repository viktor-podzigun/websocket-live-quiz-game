/**
 * @import { ApiReq, ApiResp } from "../api.js"
 */

class Connection {
  /**
   * @param {WebSocket} ws
   */
  constructor(ws) {
    /** @private @readonly @type {WebSocket} */
    this.ws = ws;

    /** @private @type {PromiseWithResolvers<string>} */
    this.respP = Promise.withResolvers();

    ws.addEventListener("message", (event) => {
      this.serverHandler(event.data);
    });
  }

  /**
   * @private
   * @param {string} serverResp
   */
  serverHandler(serverResp) {
    this.respP.resolve(serverResp);
  }

  /**
   * @template {ApiReq} D
   * @template {ApiResp} R
   * @param {D} msg
   * @returns {Promise<R>}
   */
  async send(msg) {
    this.respP = Promise.withResolvers();
    this.ws.send(JSON.stringify(msg));

    return this.respP.promise.then((resp) => {
      if (!resp.trim().startsWith("{")) {
        throw resp;
      }

      return JSON.parse(resp);
    });
  }

  /**
   * @param {string} address
   * @returns {Promise<Connection>}
   */
  static async create(address) {
    /** @type {(value: Connection) => void} */
    let resolve;
    /** @type {(reason?: any) => void} */
    let reject;
    /** @type {Promise<Connection>} */
    const p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const ws = new WebSocket(address);
    ws.addEventListener("open", () => {
      resolve(new Connection(ws));
    });

    ws.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      p.then(() => process.exit(1)).catch(() => {
        // connection errors already handled
      });
    });

    ws.addEventListener("error", (error) => {
      reject(error);
    });

    return p;
  }
}

export default Connection;
