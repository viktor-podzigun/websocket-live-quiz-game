/**
 * @import { ApiReq, ApiResp, BroadcastMsg } from "../api.js"
 */
import { isBroadcastMsg } from "../api.js";

class Connection {
  /**
   * @param {WebSocket} ws
   * @param {(msg: BroadcastMsg) => void} onBroadcast
   */
  constructor(ws, onBroadcast) {
    /** @readonly @type {WebSocket} */
    this.ws = ws;

    /** @type {(msg: BroadcastMsg) => void} */
    this.onBroadcast = onBroadcast;

    /** @private @type {PromiseWithResolvers<ApiResp>} */
    this.respP = Promise.withResolvers();

    ws.addEventListener("message", (event) => {
      this.serverHandler(event.data);
    });
  }

  /**
   * @private
   * @param {string} rawResp
   */
  serverHandler(rawResp) {
    if (!rawResp.trim().startsWith("{")) {
      this.respP.reject(rawResp);
      return;
    }

    const resp = JSON.parse(rawResp);
    if (isBroadcastMsg(resp)) {
      this.onBroadcast(resp);
      return;
    }

    this.respP.resolve(resp);
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

    // @ts-ignore
    return this.respP.promise;
  }

  /**
   * @param {string} address
   * @param {(msg: BroadcastMsg) => void} onBroadcast
   * @returns {Promise<Connection>}
   */
  static async create(address, onBroadcast) {
    /** @type {PromiseWithResolvers<Connection>} */
    const p = Promise.withResolvers();

    const ws = new WebSocket(address);
    ws.addEventListener("open", () => {
      p.resolve(new Connection(ws, onBroadcast));
    });

    ws.addEventListener("error", (error) => {
      p.reject(error);
    });

    return p.promise;
  }
}

export default Connection;
