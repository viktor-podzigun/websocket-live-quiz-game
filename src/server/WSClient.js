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
 *  StartGameReq,
 *  StartGameResp,
 *  QuestionMsg,
 *  PlayerJoinedMsg,
 *  UpdatePlayersMsg,
 *  BroadcastMsg,
 * } from "../api.js"
 */
import {
  isLoginData,
  isCreateGameData,
  isJoinGameData,
  isStartGameData,
} from "../api.js";
import Game from "./Game.js";
import { isValidCredentials } from "./users.js";

class WSClient {
  /**
   * @private
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

    /** @private @type {boolean} */
    this.isHost = false;
  }

  /**
   * @private @type {WSClient[]}
   */
  static clients = [];

  /**
   * @param {WebSocket} ws
   * @returns {WSClient}
   */
  static create(ws) {
    const client = new WSClient(ws);

    WSClient.clients.push(client);
    return client;
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
   * @param {Game} game
   * @param {BroadcastMsg} msg
   * @returns {void}
   */
  broadcastMsg(game, msg) {
    const players = game.getPlayers();
    const data = JSON.stringify(msg);

    players.forEach((p) => {
      p.ws.send(data);
    });
    const host = WSClient.clients.find((_) => _.isHost);
    if (host) {
      host.ws.send(data);
    }
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

        case "start_game":
          this.handleStartGame(req);
          break;

        default:
          //@ts-ignore
          throw `Unknown message type: ${req.type}`;
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
    this.isHost = true;

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
      `Player joined, gameId: ${game.gameId}, user name: ${this.userName}`,
    );
    this.broadcastPlayerJoined(game);

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

  /**
   * @private
   * @param {StartGameReq} req
   * @returns {void}
   */
  handleStartGame(req) {
    if (!isStartGameData(req.data)) {
      this.ws.send("Validation error: Invalid start_game Json message");
      return;
    }
    if (this.userName === undefined) {
      this.ws.send("User is not loggedin");
      return;
    }
    if (!this.isHost) {
      this.ws.send("User is not a Host");
      return;
    }

    const gameId = req.data.gameId;
    const game = Game.findByGameId(gameId);
    if (!game) {
      this.ws.send(`Game with gameId ${gameId} is not found`);
      return;
    }
    if (!game.start()) {
      this.ws.send("Game state is not 'Waiting'");
      return;
    }
    console.log(
      `Game started, gameId: ${game.gameId}, host name: ${this.userName}`,
    );
    this.broadcastQuestion(game, 0);

    /** @type {StartGameResp} */
    const msg = {
      type: "game_started",
      data: {
        gameId: game.gameId,
      },
      id: 0,
    };
    this.sendResp(msg);
  }

  /**
   * @private
   * @param {Game} game
   * @param {number} questionIndex
   * @returns {void}
   */
  broadcastQuestion(game, questionIndex) {
    const q = game.questions[questionIndex];

    /** @type {QuestionMsg} */
    const questionMsg = {
      type: "question",
      data: {
        questionNumber: questionIndex + 1,
        totalQuestions: game.questions.length,
        text: q.text,
        options: q.options,
        timeLimitSec: q.timeLimitSec,
      },
      id: 0,
    };
    this.broadcastMsg(game, questionMsg);
  }

  /**
   * @private
   * @param {Game} game
   * @returns {void}
   */
  broadcastPlayerJoined(game) {
    const players = game.getPlayers();
    const p = players[players.length - 1];

    /** @type {PlayerJoinedMsg} */
    const playerJoinedMsg = {
      type: "player_joined",
      data: {
        playerName: p.name,
        playerCount: players.length,
      },
      id: 0,
    };
    this.broadcastMsg(game, playerJoinedMsg);

    /** @type {UpdatePlayersMsg} */
    const updatePlayersMsg = {
      type: "update_players",
      data: players.map((_, index) => ({
        name: _.name,
        index,
        score: _.score,
      })),
      id: 0,
    };
    this.broadcastMsg(game, updatePlayersMsg);
  }
}

export default WSClient;
