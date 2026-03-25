/**
 * @import { WebSocket } from "ws"
 * @import { ApiReq, ApiResp, LoginReq, LoginResp } from "./api.js"
 */
import { WebSocketServer } from "ws";
import { isValidCredentials } from "./server/users.js";

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
  switch (req.type) {
    case "reg":
      sendResp(ws, handleLogin(req));
      break;

    default:
      console.log(`Unsupported request: ${req.type}`);
      ws.send("Validation error: Unsupported request type");
  }
}

/** @type {(req: LoginReq) => LoginResp} */
function handleLogin(req) {
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
    return msg;
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

  return msg;
}
