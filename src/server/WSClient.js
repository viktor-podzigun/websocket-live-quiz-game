/**
 * @import { WebSocket } from "ws"
 * @import {
 *  ApiReq,
 *  ApiResp,
 *  LoginReq,
 *  LoginResp,
 *  CreateGameReq,
 *  CreateGameResp,
 *  JoinGameReq,
 *  JoinGameResp,
 * } from "../api.js"
 */
import { isLoginData, isCreateGameData, isJoinGameData } from "../api.js";
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

    /** @private @type {string | undefined} */
    this.userName = undefined;
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

        case "join_game":
          this.handleJoinGame(req);
          break;

        default:
          //@ts-ignore
          throw `Unknown request: ${req.type}`;
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
    this.userName = req.data.name;
    this.sendResp(msg);
  }

  /**
   * @private
   * @param {CreateGameReq} req
   * @returns {void}
   */
  handleCreateGame(req) {
    if (!isCreateGameData(req.data)) {
      this.ws.send("Validation error: Invalid create_game Json message");
      return;
    }
    if (this.userName === undefined) {
      this.ws.send("User is not loggedin");
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

  /**
   * @private
   * @param {JoinGameReq} req
   * @returns {void}
   */
  handleJoinGame(req) {
    if (!isJoinGameData(req.data)) {
      this.ws.send("Validation error: Invalid join_game Json message");
      return;
    }
    if (this.userName === undefined) {
      this.ws.send("User is not loggedin");
      return;
    }

    const code = req.data.code;
    const game = Game.findByCode(code);
    if (!game) {
      this.ws.send(`Game with room code ${code} is not found`);
      return;
    }

    game.joinPlayer(this.ws, this.userName);
    console.log(
      `Game joined, gameId: ${game.gameId}, user name: ${this.userName}`,
    );

    /** @type {JoinGameResp} */
    const msg = {
      type: "game_joined",
      data: {
        gameId: game.gameId,
      },
      id: 0,
    };
    this.sendResp(msg);
  }
}

export default WSClient;
