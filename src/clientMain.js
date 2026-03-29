import readline from "readline";
import ReadLine from "./client/ReadLine.js";
import { start } from "./client/client.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on("close", () => process.exit(0));

start(new ReadLine(rl));
