/**
 * @import { Question } from "../api.js"
 */

class Game {
  /**
   * @param {string} gameId
   * @param {string} code
   */
  constructor(gameId, code) {
    /** @readonly @type {string} */
    this.gameId = gameId;

    /** @readonly @type {string} */
    this.code = code;
  }

  /**
   * @type {{
   *  readonly questions: readonly Question[],
   *  readonly code: string,
   * }[]}
   */
  static games = [];

  /**
   * @param {readonly Question[]} questions
   * @returns {Game}
   */
  static create(questions) {
    const code = Math.floor(1000 + 9000 * Math.random()).toString();

    const gameId = (Game.games.push({ questions, code }) - 1).toString();

    return new Game(gameId, code);
  }
}

export default Game;
