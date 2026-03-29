/**
 * @import { WebSocket } from "ws"
 * @import { Question } from "../api.js"
 */

/**
 * @typedef {{
 *  readonly ws: WebSocket;
 *  readonly name: string;
 *  readonly score: number;
 * }} Player
 */

/**
 * @typedef {"Waiting" | "Started" | "Finished"} State
 */

class Game {
  /**
   * @private
   * @param {string} gameId
   * @param {string} code
   * @param {readonly Question[]} questions
   */
  constructor(gameId, code, questions) {
    /** @readonly @type {string} */
    this.gameId = gameId;

    /** @readonly @type {string} */
    this.code = code;

    /** @readonly @type {readonly Question[]} */
    this.questions = questions;

    /** @private @type {Player[]} */
    this.players = [];

    /** @private @type {State} */
    this.state = "Waiting";
  }

  /**
   * @returns {readonly Player[]}
   */
  getPlayers() {
    return this.players;
  }

  /**
   * @param {WebSocket} ws
   * @param {string} name
   * @returns {number} player count
   */
  joinPlayer(ws, name) {
    return this.players.push({ ws, name, score: 0 });
  }

  /**
   * @returns {boolean}
   */
  start() {
    if (this.state === "Waiting") {
      this.state = "Started";
      return true;
    }

    return false;
  }

  /**
   * @private @type {Game[]}
   */
  static games = [];

  /**
   * @param {string} gameId
   * @returns {Game | undefined}
   */
  static findByGameId(gameId) {
    return Game.games.find((_) => _.gameId === gameId);
  }

  /**
   * @param {string} code
   * @returns {Game | undefined}
   */
  static findByCode(code) {
    return Game.games.find((_) => _.code === code);
  }

  /**
   * @param {readonly Question[]} questions
   * @returns {Game}
   */
  static create(questions) {
    const code = Math.floor(1000 + 9000 * Math.random()).toString();
    const gameId = Game.games.length.toString();
    const game = new Game(gameId, code, questions);

    Game.games.push(game);
    return game;
  }
}

export default Game;
