/**
 * @import { WebSocket } from "ws"
 * @import { ApiReq, ApiResp, LoginReq, LoginResp } from "./api.js"
 */
import { WebSocketServer } from "ws";
import { isValidCredentials } from "./server/users.js";
import { isLoginData } from "./api.js";

const wss = new WebSocketServer({ port: 8080 });

wss.once("error", console.error);
wss.once("close", () => {
  console.log("Server closed!");
  process.exit(1);
});
wss.once("listening", () => {
  console.log(`Server listening at ws://localhost:8080`);
});

wss.on("connection", (ws) => {
  console.log(`New connection`);

  ws.on("error", console.error);

  ws.on("message", (data) => {
    handler(ws, JSON.parse(data.toString()));
  });
});

/** @type {(ws: WebSocket, resp: ApiResp) => void} */
function sendResp(ws, resp) {
  ws.send(JSON.stringify(resp));
}

/** @type {(ws: WebSocket, req: ApiReq) => void} */
function handler(ws, req) {
  try {
    switch (req.type) {
      case "reg":
        handleLogin(ws, req);
        break;

      default:
        const error = `Unsupported request: type = ${req.type}`;
        console.log(error);
        throw error;
    }
  } catch (error) {
    ws.send(`Validation error: ${error}`);
  }
}

/** @type {(ws: WebSocket, req: LoginReq) => void} */
function handleLogin(ws, req) {
  if (!isLoginData(req.data)) {
    ws.send("Validation error: Invalid Login message");
    return;
  }
  if (!isValidCredentials(req.data.name, req.data.password)) {
    /** @type {LoginResp} */
    const msg = {
      type: "reg",
      data: {
        name: req.data.name,
        index: 0,
        error: true,
        errorText: "Invalid user name/password",
      },
      id: 0,
    };
    sendResp(ws, msg);
    return;
  }

  /** @type {LoginResp} */
  const msg = {
    type: "reg",
    data: {
      name: req.data.name,
      index: 0,
      error: false,
      errorText: "",
    },
    id: 0,
  };
  sendResp(ws, msg);
}
