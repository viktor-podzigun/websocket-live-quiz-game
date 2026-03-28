/**
 * @import readline from "readline";
 * @import { GameCreated } from "../src/api.js"
 */
import { after, before, describe, it } from "node:test";
import ReadLine from "../src/client/ReadLine.js";
import { create } from "../src/server.js";
import { start as startClient } from "../src/client.js";

const port = 12346;

class TestReadLine extends ReadLine {
  /**
   * @param {() => void} close
   * @param {(q: string, handler: (a: string) => void) => void} prompt
   * @param {(log: string) => void} output
   */
  constructor(close, prompt, output) {
    super(/** @type {readline.Interface} */ ({}));
    this.close = close;
    this.prompt = prompt;
    this.output = output;
  }
}

const gameCreatedRegex = /Game created, gameId: (.+?), room code: (.+)/;

/** @type {PromiseWithResolvers<GameCreated>} */
const gameCreatedP = Promise.withResolvers();

describe("client.test.js", async () => {
  const wss = create(port);
  const readyP = Promise.withResolvers();
  wss.once("listening", () => {
    readyP.resolve(undefined);
  });

  before(async () => {
    await readyP.promise;
  });

  after(async () => {
    //cleanup
    wss.clients.forEach((ws) => ws.close());
    wss.close();
  });

  it("should handle create_game command", async () => {
    //when & then
    startClient(
      new TestReadLine(
        () => console.log("TestReadLine is closed!"),
        (q, handler) => {
          switch (q) {
            case `Enter server address, starting with "ws://"`:
              handler(`ws://localhost:${port}`);
              break;

            case "Enter your user name":
              handler("user1");
              break;

            case "Enter your password":
              handler("pass1");
              break;

            case "Enter game mode: Host or Player":
              handler("Host");
              break;

            case "Enter game questions (json array)":
              handler(
                `[ { "text": "1 + 2 = ?", "options": ["3", "4", "5", "12"], "correctIndex": 0, "timeLimitSec": 5 }, { "text": "hello + world = ?", "options": ["hi", "hello", "world", "hello world"], "correctIndex": 3, "timeLimitSec": 5 }, { "text": "Berlin is capital of?", "options": ["USA", "Germany", "Paris", "London"], "correctIndex": 1, "timeLimitSec": 5 } ]`,
              );
              break;

            default:
              gameCreatedP.reject(`Unknown prompt: ${q}`);
              break;
          }
        },
        (log) => {
          if (log.startsWith(`Game created, gameId: `)) {
            const groups = gameCreatedRegex.exec(log);
            if (groups) {
              gameCreatedP.resolve({ gameId: groups[1], code: groups[2] });
            } else {
              gameCreatedP.reject("gameCreatedRegex didn't match!");
            }
          }
        },
      ),
    );

    const { gameId, code } = await gameCreatedP.promise;
    console.log(`${gameId}, ${code}`);
  });
});
