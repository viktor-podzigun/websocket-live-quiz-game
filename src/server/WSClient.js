/**
 * @import { WebSocket } from "ws"
 * @import {
 *  ApiReq,
 *  ApiResp,
 *  LoginReq,
 *  LoginResp,
 *  CreateGameReq,
 *  CreateGameResp,
 * } from "../api.js"
 */
import { isLoginData, isCreateGameData } from "../api.js";
import Game from "./Game.js";
import { isValidCredentials } from "./users.js";

class WSClient {
  /**
   * @param {WebSocket} ws
   */
  constructor(ws) {
    /** @readonly @type {WebSocket} */
    this.ws = ws;

    ws.on("message", (data) => {
      this.handler(JSON.parse(data.toString()));
    });

    /** @private @type {boolean} */
    this.isLoggedin = false;
  }

  /**
   * @private
   * @param {ApiResp} resp
   * @returns {void}
   */
  sendResp(resp) {
    this.ws.send(JSON.stringify(resp));
  }

  /**
   * @private
   * @param {ApiReq} req
   * @returns {void}
   */
  handler(req) {
    try {
      switch (req.type) {
        case "reg":
          this.handleLogin(req);
          break;

        case "create_game":
          this.handleCreateGame(req);
          break;
      }
    } catch (error) {
      this.ws.send(`Internal error: ${error}`);
    }
  }

  /**
   * @private
   * @param {LoginReq} req
   * @returns {void}
   */
  handleLogin(req) {
    if (!isLoginData(req.data)) {
      this.ws.send("Validation error: Invalid reg Json message");
      return;
    }
    if (!isValidCredentials(req.data.name, req.data.password)) {
      /** @type {LoginResp} */
      const msg = {
        type: "reg",
        data: {
          name: req.data.name,
          index: 0,
          error: true,
          errorText: "Invalid user name/password",
        },
        id: 0,
      };
      this.sendResp(msg);
      return;
    }

    /** @type {LoginResp} */
    const msg = {
      type: "reg",
      data: {
        name: req.data.name,
        index: 0,
        error: false,
        errorText: "",
      },
      id: 0,
    };
    this.sendResp(msg);
    this.isLoggedin = true;
  }

  /**
   * @private
   * @param {CreateGameReq} req
   * @returns {void}
   */
  handleCreateGame(req) {
    if (!this.isLoggedin) {
      this.ws.send("User is not loggedin");
      return;
    }
    if (!isCreateGameData(req.data)) {
      this.ws.send("Validation error: Invalid create_game Json message");
      return;
    }

    const { gameId, code } = Game.create(req.data.questions);
    console.log(`Game created, gameId: ${gameId}, room code: ${code}`);

    /** @type {CreateGameResp} */
    const msg = {
      type: "game_created",
      data: {
        gameId,
        code,
      },
      id: 0,
    };
    this.sendResp(msg);
  }
}

export default WSClient;
