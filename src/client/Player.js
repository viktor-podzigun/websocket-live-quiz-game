/**
 * @import ReadLine from "./ReadLine.js"
 * @import Connection from "./Connection.js"
 * @import {
 *  JoinGameReq,
 *  JoinGameResp,
 *  QuestionAnswerReq,
 *  QuestionAnswerResp,
 *  BroadcastMsg,
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
    this.conn.onBroadcast = (_) => this.onBroadcast(_);

    /** @private @type {string} */
    this.state = "JoinGame";

    /** @private @type {string} */
    this.gameId = "";

    /** @private @type {number} */
    this.questionIndex = -1;
  }

  requestGameRoomCode() {
    this.state = "JoinGame";
    this.rl.prompt("Enter game room code (4 digit)", (_) => this.handler(_));
  }

  requestQuestionAnswer() {
    this.state = "Question";
    this.rl.prompt("Answer", (_) => this.handler(_));
  }

  /** @private @type {(answer: string) => void} */
  handler(answer) {
    switch (this.state) {
      case "JoinGame":
        this.doJoinGame(answer)
          .then((resp) => {
            this.gameId = resp.data.gameId;
            this.rl.output(`Game joined, gameId: ${this.gameId}`);
            this.rl.close(); //TODO
          })
          .catch((error) => {
            this.rl.output(
              `JoinGame error: ${error.stack ? `${error}` : error}`,
            );
            this.requestGameRoomCode();
          });
        break;

      case "Question":
        this.doAnswerQuestion(answer)
          .then((resp) => {
            this.rl.output(
              `Question answered, questionIndex: ${resp.data.questionIndex}`,
            );
            this.rl.close(); //TODO
          })
          .catch((error) => {
            this.rl.output(
              `Question answer error: ${error.stack ? `${error}` : error}`,
            );
            this.requestQuestionAnswer();
          });
        break;

      default:
        this.rl.output(`Unsupported Player state: ${this.state}`);
        this.rl.close();
        break;
    }
  }

  /** @private @type {(msg: BroadcastMsg) => void} */
  onBroadcast(msg) {
    this.rl.output(JSON.stringify(msg));

    switch (msg.type) {
      case "question":
        this.questionIndex = msg.data.questionNumber - 1;
        this.requestQuestionAnswer();
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

  /** @type {(answerIndex: string) => Promise<QuestionAnswerResp>} */
  async doAnswerQuestion(answerIndex) {
    /** @type {QuestionAnswerReq} */
    const msg = {
      type: "answer",
      data: {
        gameId: this.gameId,
        questionIndex: this.questionIndex,
        answerIndex: parseInt(answerIndex),
      },
      id: 0,
    };

    this.rl.output(`Answering question ${this.questionIndex}...`);
    return await this.conn.send(msg);
  }
}

export default Player;
