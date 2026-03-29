import { create } from "./server/server.js";

const wss = create(8080);

wss.once("close", () => {
  console.log("Server closed!");
  process.exit(1);
});
