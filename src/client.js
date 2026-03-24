import ReadLine from "./client/ReadLine.js";

// Possible states for Host:
//
// Connect -> UserName -> Password -> Login -> Mode -> CreateGame -> StartGame

// Possible states for Player:
//
// Connect -> UserName -> Password -> Login -> Mode -> JoinGame -> Answer

const main = () => {
  const rl = new ReadLine();

  /** @type {WebSocket | null} */
  let ws = null;
  let state = "Connect";
  let userName = "";
  let password = "";
  /** @type {"Host" | "Player"} */
  let gameMode = "Host";

  /** @type {(serverResp: string) => void} */
  function messageListener(serverResp) {
    console.log(userName);
    console.log(password);
    console.log(gameMode);
    console.log(serverResp);
  }

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
        createWebSocketClient(answer)
          .then((socket) => {
            ws = socket;
            ws.addEventListener("message", (event) => {
              messageListener(event.data);
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
        requestMode();
        break;

      case "Mode":
        if (answer !== "Host" && answer !== "Player") {
          console.log("Unsupported mode!");
          requestMode();
          break;
        }
        gameMode = answer;
        state = "Exit"; //TODO
        rl.prompt("Press enter to exit", handler);
        break;

      default:
        console.log(`Unsupported state: ${state}`);
        process.exit(0);
        break;
    }
  }

  requestAddress();
};

main();

/**
 * @param {string} address
 * @returns {Promise<WebSocket>}
 */
async function createWebSocketClient(address) {
  /** @type {(value: WebSocket) => void} */
  let resolve;
  /** @type {(reason?: any) => void} */
  let reject;
  /** @type {Promise<WebSocket>} */
  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const ws = new WebSocket(address);
  ws.addEventListener("open", () => {
    resolve(ws);
  });

  ws.addEventListener("close", (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);
    p.then(() => process.exit(1)).catch(() => {
      // connection errors already handled
    });
  });

  ws.addEventListener("error", (error) => {
    reject(error);
  });

  return p;
}
