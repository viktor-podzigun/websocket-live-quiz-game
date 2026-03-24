import Connection from "./client/Connection.js";
import ReadLine from "./client/ReadLine.js";

// Possible states for Host:
//
// Connect -> UserName -> Password -> Login -> Mode -> CreateGame -> StartGame

// Possible states for Player:
//
// Connect -> UserName -> Password -> Login -> Mode -> JoinGame -> Answer

const main = () => {
  const rl = new ReadLine();

  /** @type {Connection | null} */
  let conn = null;
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

  /** @type {(answer: string) => void} */
  function handler(answer) {
    switch (state) {
      case "Connect":
        Connection.create(answer)
          .then((c) => {
            conn = c;
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
