/**
 * @import {
 *  LoginReq,
 *  LoginResp,
 *  CreateGameReq,
 *  CreateGameResp
 * } from "./api.js"
 */
import Connection from "./client/Connection.js";
import ReadLine from "./client/ReadLine.js";

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

const rl = new ReadLine();

/** @type {PromiseWithResolvers<Connection>} */
let connP = Promise.withResolvers();
let state = "Connect";
let userName = "";
let password = "";
/** @type {"Host" | "Player"} */
let gameMode = "Host";

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

/** @type {(answer: string) => void} */
function handler(answer) {
  switch (state) {
    case "Connect":
      Connection.create(answer)
        .then((conn) => {
          connP.resolve(conn);
          conn.ws.addEventListener("close", (event) => {
            console.log(
              "WebSocket connection closed:",
              event.code,
              event.reason,
            );
            process.exit(1);
          });
          requestUserName();
        })
        .catch((error) => {
          console.log(`Connection error:`, error.stack ? `${error}` : error);
          requestAddress();
        });
      break;

    case "UserName":
      if (answer.trim().length === 0) {
        console.log("User name should not be empty!");
        requestUserName();
        break;
      }
      userName = answer;
      requestPassword();
      break;

    case "Password":
      if (answer.trim().length === 0) {
        console.log("User password should not be empty!");
        requestPassword();
        break;
      }
      password = answer;
      doLogin()
        .then((resp) => {
          if (resp.data.error) {
            throw resp.data.errorText;
          }
          console.log("Login successful!");
          requestMode();
        })
        .catch((error) => {
          console.log(`Login error:`, error.stack ? `${error}` : error);
          requestUserName();
        });
      break;

    case "Mode":
      handleMode(answer);
      break;

    case "CreateGame":
      doCreateGame(answer)
        .then((resp) => {
          console.log(`Game created, room code: ${resp.data.code}`);
          requestMode(); //TODO
        })
        .catch((error) => {
          console.log(`CreateGame error:`, error.stack ? `${error}` : error);
          requestGameQuestions();
        });
      break;

    default:
      console.log(`Unsupported state: ${state}`);
      process.exit(0);
      break;
  }
}

/** @type {(answer: string) => void} */
function handleMode(answer) {
  switch (answer) {
    case "Host":
      gameMode = answer;
      requestGameQuestions();
      break;

    case "Player":
      gameMode = answer;
      console.log(gameMode);
      state = "Exit"; //TODO
      rl.prompt("Press enter to exit", handler);
      break;

    default:
      console.log("Unsupported mode!");
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

  console.log("Logging you in...");
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

  console.log("Creating game...");
  return await conn.send(msg);
}

requestAddress();
