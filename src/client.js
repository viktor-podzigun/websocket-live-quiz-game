/**
 * @import ReadLine from "./client/ReadLine.js"
 * @import {
 *  LoginReq,
 *  LoginResp,
 *  CreateGameReq,
 *  CreateGameResp,
 *  JoinGameReq,
 *  JoinGameResp
 * } from "./api.js"
 */
import Connection from "./client/Connection.js";

// Possible states:
//
// Connect -> UserName -> Password \
//              /\                  \
//               \                  \/
//                \______________ Login -> Mode
//                                           \
//                                            \
//                                          (Host) -> CreateGame -> StartGame
//                                             |
//                                         (Player) -> JoinGame -> Answer

/**
 * @param {ReadLine} rl
 */
export function start(rl) {
  /** @type {PromiseWithResolvers<Connection>} */
  let connP = Promise.withResolvers();
  let state = "Connect";
  let userName = "";
  let password = "";

  function requestAddress() {
    state = "Connect";
    rl.prompt(`Enter server address, starting with "ws://"`, handler);
  }

  function requestUserName() {
    state = "UserName";
    rl.prompt("Enter your user name", handler);
  }

  function requestPassword() {
    state = "Password";
    rl.prompt("Enter your password", handler);
  }

  function requestMode() {
    state = "Mode";
    rl.prompt("Enter game mode: Host or Player", handler);
  }

  function requestGameQuestions() {
    state = "CreateGame";
    rl.prompt("Enter game questions (json array)", handler);
  }

  function requestGameRoomCode() {
    state = "JoinGame";
    rl.prompt("Enter game room code (4 digit)", handler);
  }

  /** @type {(answer: string) => void} */
  function handler(answer) {
    switch (state) {
      case "Connect":
        Connection.create(answer)
          .then((conn) => {
            connP.resolve(conn);
            conn.ws.addEventListener("close", (event) => {
              rl.output(
                `WebSocket connection closed: ${event.code} ${event.reason}`,
              );
              rl.close();
            });
            requestUserName();
          })
          .catch((error) => {
            rl.output(`Connection error: ${error.stack ? `${error}` : error}`);
            requestAddress();
          });
        break;

      case "UserName":
        if (answer.trim().length === 0) {
          rl.output("User name should not be empty!");
          requestUserName();
          break;
        }
        userName = answer;
        requestPassword();
        break;

      case "Password":
        if (answer.trim().length === 0) {
          rl.output("User password should not be empty!");
          requestPassword();
          break;
        }
        password = answer;
        doLogin()
          .then((resp) => {
            if (resp.data.error) {
              throw resp.data.errorText;
            }
            rl.output("Login successful!");
            requestMode();
          })
          .catch((error) => {
            rl.output(`Login error: ${error.stack ? `${error}` : error}`);
            requestUserName();
          });
        break;

      case "Mode":
        handleMode(answer);
        break;

      case "CreateGame":
        doCreateGame(answer)
          .then((resp) => {
            rl.output(
              `Game created, gameId: ${resp.data.gameId}, room code: ${resp.data.code}`,
            );
            rl.close(); //TODO
          })
          .catch((error) => {
            rl.output(`CreateGame error: ${error.stack ? `${error}` : error}`);
            requestGameQuestions();
          });
        break;

      case "JoinGame":
        doJoinGame(answer)
          .then((resp) => {
            rl.output(`Game joined, gameId: ${resp.data.gameId}`);
            rl.close(); //TODO
          })
          .catch((error) => {
            rl.output(`JoinGame error: ${error.stack ? `${error}` : error}`);
            requestGameRoomCode();
          });
        break;

      default:
        rl.output(`Unsupported state: ${state}`);
        rl.close();
        break;
    }
  }

  /** @type {(answer: string) => void} */
  function handleMode(answer) {
    switch (answer) {
      case "Host":
        requestGameQuestions();
        break;

      case "Player":
        requestGameRoomCode();
        break;

      default:
        rl.output("Unsupported mode!");
        requestMode();
        return;
    }
  }

  /** @type {() => Promise<LoginResp>} */
  async function doLogin() {
    const conn = await connP.promise;

    /** @type {LoginReq} */
    const msg = {
      type: "reg",
      data: {
        name: userName,
        password,
      },
      id: 0,
    };

    rl.output("Logging you in...");
    return await conn.send(msg);
  }

  /** @type {(questionsJson: string) => Promise<CreateGameResp>} */
  async function doCreateGame(questionsJson) {
    const conn = await connP.promise;

    /** @type {CreateGameReq} */
    const msg = {
      type: "create_game",
      data: {
        questions: JSON.parse(questionsJson),
      },
      id: 0,
    };

    rl.output("Creating game...");
    return await conn.send(msg);
  }

  /** @type {(code: string) => Promise<JoinGameResp>} */
  async function doJoinGame(code) {
    const conn = await connP.promise;

    /** @type {JoinGameReq} */
    const msg = {
      type: "join_game",
      data: {
        code,
      },
      id: 0,
    };

    rl.output("Joining game...");
    return await conn.send(msg);
  }

  requestAddress();
}
