/**
 * @import readline from "readline";
 * @import { GameCreated } from "../src/api.js"
 */
import { after, before, describe, it } from "node:test";
import { deepEqual } from "assert/strict";
import ReadLine from "../src/client/ReadLine.js";
import { create as createServer } from "../src/server/server.js";
import { start as startClient } from "../src/client/client.js";

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
const gameJoinedRegex = /Game joined, gameId: (.+)/;
const gameStartedRegex = /Game started, gameId: (.+)/;

/** @type {PromiseWithResolvers<GameCreated>} */
const gameCreatedP = Promise.withResolvers();

/** @type {PromiseWithResolvers<string>} */
const gameJoinedP = Promise.withResolvers();

/** @type {PromiseWithResolvers<string>} */
const gameStartedP = Promise.withResolvers();

/** @type {PromiseWithResolvers<(answer: string) => void>} */
const hostHandlerP = Promise.withResolvers();

let hostRL = /** @type {TestReadLine} */ ({});
let playerRL = /** @type {TestReadLine} */ ({});

describe("client.test.js", async () => {
  const wss = createServer(port);
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
    //given
    hostRL = new TestReadLine(
      () => console.log("TestReadLine is closed!"),
      (q, handler) => {
        //when & then
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
              `[ { "text": "1 + 2 = ?", "options": ["3", "4", "5", "12"], "correctIndex": 0, "timeLimitSec": 5 }, { "text": "hello + world = ?", "options": ["hi", "hello", "world", "hello world"], "correctIndex": 3, "timeLimitSec": 5 } ]`,
            );
            break;

          case "Enter gameId to start game":
            hostHandlerP.resolve(handler);
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
    );

    //when
    startClient(hostRL);

    //then
    await gameCreatedP.promise;
    await hostHandlerP.promise;
  });

  it("should handle join_game command", async () => {
    //given
    const { gameId, code } = await gameCreatedP.promise;
    playerRL = new TestReadLine(
      () => console.log("TestReadLine is closed!"),
      (q, handler) => {
        //when & then
        switch (q) {
          case `Enter server address, starting with "ws://"`:
            handler(`ws://localhost:${port}`);
            break;

          case "Enter your user name":
            handler("user2");
            break;

          case "Enter your password":
            handler("pass2");
            break;

          case "Enter game mode: Host or Player":
            handler("Player");
            break;

          case "Enter game room code (4 digit)":
            handler(code);
            break;

          default:
            gameJoinedP.reject(`Unknown prompt: ${q}`);
            break;
        }
      },
      (log) => {
        if (log.startsWith(`Game joined, gameId: `)) {
          const groups = gameJoinedRegex.exec(log);
          if (groups) {
            gameJoinedP.resolve(groups[1]);
          } else {
            gameJoinedP.reject("gameJoinedRegex didn't match!");
          }
        }
      },
    );

    //when
    startClient(playerRL);

    //then
    const joinGameId = await gameJoinedP.promise;
    deepEqual(joinGameId, gameId);
  });

  it("should handle start_game command", async () => {
    //given
    const { gameId } = await gameCreatedP.promise;
    const hostHandler = await hostHandlerP.promise;
    hostRL.prompt = (q, handler) => {
      //when & then
      switch (q) {
        case "Enter gameId to start game":
          handler(gameId);
          break;

        default:
          gameJoinedP.reject(`Unknown prompt: ${q}`);
          break;
      }
    };
    hostRL.output = (log) => {
      if (log.startsWith(`Game started, gameId: `)) {
        const groups = gameStartedRegex.exec(log);
        if (groups) {
          gameStartedP.resolve(groups[1]);
        } else {
          gameStartedP.reject("gameStartedRegex didn't match!");
        }
      }
    };

    //when
    hostHandler("123");

    //then
    const startedGameId = await gameStartedP.promise;
    deepEqual(startedGameId, gameId);
  });
});
