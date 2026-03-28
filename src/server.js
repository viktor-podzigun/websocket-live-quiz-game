import { WebSocketServer } from "ws";
import WSClient from "./server/WSClient.js";

/**
 * @param {number} port
 * @returns {WebSocketServer}
 */
export function create(port) {
  const wss = new WebSocketServer({ port });

  wss.once("error", console.error);
  wss.once("close", () => {
    console.log("Server closed!");
    process.exit(1);
  });
  wss.once("listening", () => {
    console.log(`Server listening at ws://localhost:${port}`);
  });

  wss.on("connection", (ws) => {
    // console.log(`New connection`);
    ws.on("error", console.error);

    new WSClient(ws);
  });

  return wss;
}
