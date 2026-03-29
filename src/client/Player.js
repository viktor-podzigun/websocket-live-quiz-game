/**
 * @import ReadLine from "./ReadLine.js"
 * @import Connection from "./Connection.js"
 * @import {
 *  JoinGameReq,
 *  JoinGameResp
 * } from "../api.js"
 */

// Possible states:
//
// JoinGame -> Answer

class Player {
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
    this.state = "JoinGame";
  }

  requestGameRoomCode() {
    this.state = "JoinGame";
    this.rl.prompt("Enter game room code (4 digit)", (_) => this.handler(_));
  }

  /** @private @type {(answer: string) => void} */
  handler(answer) {
    switch (this.state) {
      case "JoinGame":
        this.doJoinGame(answer)
          .then((resp) => {
            this.rl.output(`Game joined, gameId: ${resp.data.gameId}`);
            this.rl.close(); //TODO
          })
          .catch((error) => {
            this.rl.output(
              `JoinGame error: ${error.stack ? `${error}` : error}`,
            );
            this.requestGameRoomCode();
          });
        break;

      default:
        this.rl.output(`Unsupported Player state: ${this.state}`);
        this.rl.close();
        break;
    }
  }

  /** @type {(code: string) => Promise<JoinGameResp>} */
  async doJoinGame(code) {
    /** @type {JoinGameReq} */
    const msg = {
      type: "join_game",
      data: {
        code,
      },
      id: 0,
    };

    this.rl.output("Joining game...");
    return await this.conn.send(msg);
  }
}

export default Player;
