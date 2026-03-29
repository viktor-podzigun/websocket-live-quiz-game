/**
 * @import ReadLine from "./ReadLine.js"
 * @import Connection from "./Connection.js"
 * @import {
 *  CreateGameReq,
 *  CreateGameResp,
 *  StartGameReq,
 *  StartGameResp,
 * } from "../api.js"
 */

// Possible states:
//
// CreateGame -> StartGame

class Host {
  /**
   * @param {ReadLine} rl
   * @param {Connection} conn
   */
  constructor(rl, conn) {
    /** @private @readonly @type {ReadLine} */
    this.rl = rl;

    /** @private @readonly @type {Connection} */
    this.conn = conn;

    /** @private @type {string} */
    this.state = "CreateGame";
  }

  requestGameQuestions() {
    this.state = "CreateGame";
    this.rl.prompt("Enter game questions (json array)", (_) => this.handler(_));
  }

  requestGameId() {
    this.state = "StartGame";
    this.rl.prompt("Enter gameId to start game", (_) => this.handler(_));
  }

  /** @private @type {(answer: string) => void} */
  handler(answer) {
    switch (this.state) {
      case "CreateGame":
        this.doCreateGame(answer)
          .then((resp) => {
            this.rl.output(
              `Game created, gameId: ${resp.data.gameId}, room code: ${resp.data.code}`,
            );
            this.requestGameId();
          })
          .catch((error) => {
            this.rl.output(
              `CreateGame error: ${error.stack ? `${error}` : error}`,
            );
            this.requestGameQuestions();
          });
        break;

      case "StartGame":
        this.doStartGame(answer)
          .then((resp) => {
            this.rl.output(`Game started, gameId: ${resp.data.gameId}`);
            this.rl.close(); //TODO
          })
          .catch((error) => {
            this.rl.output(
              `StartGame error: ${error.stack ? `${error}` : error}`,
            );
            this.requestGameId();
          });
        break;

      default:
        this.rl.output(`Unsupported Host state: ${this.state}`);
        this.rl.close();
        break;
    }
  }

  /** @type {(questionsJson: string) => Promise<CreateGameResp>} */
  async doCreateGame(questionsJson) {
    /** @type {CreateGameReq} */
    const msg = {
      type: "create_game",
      data: {
        questions: JSON.parse(questionsJson),
      },
      id: 0,
    };

    this.rl.output("Creating game...");
    return await this.conn.send(msg);
  }

  /** @type {(gameId: string) => Promise<StartGameResp>} */
  async doStartGame(gameId) {
    /** @type {StartGameReq} */
    const msg = {
      type: "start_game",
      data: {
        gameId,
      },
      id: 0,
    };

    this.rl.output("Starting game...");
    return await this.conn.send(msg);
  }
}

export default Host;
