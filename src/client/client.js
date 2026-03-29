/**
 * @import ReadLine from "./ReadLine.js"
 * @import {
 *  LoginReq,
 *  LoginResp,
 * } from "../api.js"
 */
import Connection from "./Connection.js";
import Host from "./Host.js";
import Player from "./Player.js";

// Possible states:
//
// Connect -> UserName -> Password \
//              /\                  \
//               \                  \/
//                \______________ Login -> Mode (Host or Player)

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

  /** @type {(answer: string) => void} */
  function handler(answer) {
    switch (state) {
      case "Connect":
        Connection.create(answer, (_) => rl.output(JSON.stringify(_)))
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
        handleMode(answer).catch((error) => {
          rl.output(`Mode error: ${error.stack ? `${error}` : error}`);
          requestMode();
        });
        break;

      default:
        rl.output(`Unsupported Client state: ${state}`);
        rl.close();
        break;
    }
  }

  /** @type {(answer: string) => Promise<void>} */
  async function handleMode(answer) {
    const conn = await connP.promise;

    switch (answer) {
      case "Host":
        new Host(rl, conn).requestGameQuestions();
        break;

      case "Player":
        new Player(rl, conn).requestGameRoomCode();
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

  requestAddress();
}
