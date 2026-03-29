import { WebSocketServer } from "ws";
import WSClient from "./WSClient.js";

/**
 * @param {number} port
 * @returns {WebSocketServer}
 */
export function create(port) {
  const wss = new WebSocketServer({ port });

  wss.once("error", console.error);

  wss.once("listening", () => {
    console.log(`Server listening at ws://localhost:${port}`);
  });

  wss.on("connection", (ws) => {
    // console.log(`New connection`);
    ws.on("error", console.error);

    WSClient.create(ws);
  });

  return wss;
}
