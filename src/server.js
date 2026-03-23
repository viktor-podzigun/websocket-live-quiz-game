import { WebSocketServer } from "ws";

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
    console.log("received: %s", data);
  });

  ws.send("something");
});
