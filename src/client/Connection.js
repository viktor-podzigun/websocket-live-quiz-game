/**
 * @import { ApiReq, ApiResp } from "../api.js"
 */

class Connection {
  /**
   * @param {WebSocket} ws
   */
  constructor(ws) {
    /** @readonly @type {WebSocket} */
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
    /** @type {PromiseWithResolvers<Connection>} */
    const p = Promise.withResolvers();

    const ws = new WebSocket(address);
    ws.addEventListener("open", () => {
      p.resolve(new Connection(ws));
    });

    ws.addEventListener("error", (error) => {
      p.reject(error);
    });

    return p.promise;
  }
}

export default Connection;
