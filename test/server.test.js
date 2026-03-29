/**
 * @import {
 *  LoginResp,
 *  Question,
 *  CreateGameResp,
 *  JoinGameResp,
 *  StartGameResp,
 *  PlayerJoinedMsg,
 *  UpdatePlayersMsg,
 *  QuestionMsg,
 * } from "../src/api.js"
 */
import { after, before, describe, it } from "node:test";
import { deepEqual } from "node:assert/strict";
import mockFunction from "mock-fn";
import Connection from "../src/client/Connection.js";
import { create as createServer } from "../src/server/server.js";

const port = 12345;

/** @type {Question[]} */
const questions = [
  {
    text: "1 + 2 = ?",
    options: ["3", "4", "5", "12"],
    correctIndex: 0,
    timeLimitSec: 5,
  },
  {
    text: "hello + world = ?",
    options: ["hi", "hello", "world", "hello world"],
    correctIndex: 3,
    timeLimitSec: 5,
  },
];

let gameId = "";
let gameCode = "";

describe("server.test.js", async () => {
  const wss = createServer(port);
  const wssReadyP = Promise.withResolvers();
  wss.once("listening", () => {
    wssReadyP.resolve(undefined);
  });

  /** @type {Promise<Connection>} */
  let hostP = new Promise(() => {});

  /** @type {Promise<Connection>} */
  let playerP = new Promise(() => {});

  /** @type {Promise<Connection>} */
  let userP = new Promise(() => {});

  let hostBroadcastArgs = /** @type {any[]} */ ([]);
  const hostBroadcast = mockFunction((...args) =>
    hostBroadcastArgs.push(...args),
  );

  let playerBroadcastArgs = /** @type {any[]} */ ([]);
  const playerBroadcast = mockFunction((...args) =>
    playerBroadcastArgs.push(...args),
  );

  let userBroadcastArgs = /** @type {any[]} */ ([]);
  const userBroadcast = mockFunction((...args) =>
    userBroadcastArgs.push(...args),
  );

  before(async () => {
    await wssReadyP.promise;
    hostP = Connection.create(`ws://localhost:${port}`, hostBroadcast);
    playerP = Connection.create(`ws://localhost:${port}`, playerBroadcast);
    userP = Connection.create(`ws://localhost:${port}`, userBroadcast);
  });

  after(async () => {
    //cleanup
    await hostP;
    await playerP;
    await userP;
    wss.clients.forEach((ws) => ws.close());
    wss.close();
  });

  it("should handle invalid request json message", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({});
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Internal error: Unknown message type: undefined");
  });

  it("should handle unknown message type json message", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "test_unknown" });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(
      resultError,
      "Internal error: Unknown message type: test_unknown",
    );
  });

  it("should handle invalid reg json message", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "reg" });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Validation error: Invalid reg Json message");
  });

  it("should handle invalid user credentials", async () => {
    //given
    const conn = await hostP;

    //when
    const result = await conn.send({
      type: "reg",
      data: { name: "1", password: "2" },
      id: 0,
    });

    //then
    /** @type {LoginResp} */
    const resp = {
      type: "reg",
      data: {
        name: "1",
        index: 0,
        error: true,
        errorText: "Invalid user name/password",
      },
      id: 0,
    };
    deepEqual(result, resp);
  });

  it("should handle not loggedin user when create_game", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      await conn.send({ type: "create_game", data: { questions }, id: 0 });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "User is not loggedin");
  });

  it("should handle valid user credentials", async () => {
    //given
    const conn = await hostP;

    //when
    const result = await conn.send({
      type: "reg",
      data: { name: "user1", password: "pass1" },
      id: 0,
    });

    //then
    /** @type {LoginResp} */
    const resp = {
      type: "reg",
      data: {
        name: "user1",
        index: 0,
        error: false,
        errorText: "",
      },
      id: 0,
    };
    deepEqual(result, resp);
  });

  it("should handle invalid create_game json message", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      await conn.send({
        type: "create_game",
        data: { questions: [] },
        id: 0,
      });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(
      resultError,
      "Validation error: Invalid create_game Json message",
    );
  });

  it("should return game room code when create_game", async () => {
    //given
    const conn = await hostP;

    //when
    /** @type {CreateGameResp} */
    const result = await conn.send({
      type: "create_game",
      data: { questions },
      id: 0,
    });

    //then
    /** @type {CreateGameResp} */
    const resp = {
      type: "game_created",
      data: {
        gameId: "0",
        code: result.data.code,
      },
      id: 0,
    };
    deepEqual(result, resp);
    deepEqual(result.data.code.length, 4);
    gameId = result.data.gameId;
    gameCode = result.data.code;
  });

  it("should handle invalid join_game json message", async () => {
    //given
    const conn = await playerP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "join_game" });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Validation error: Invalid join_game Json message");
  });

  it("should handle not loggedin user when join_game", async () => {
    //given
    const conn = await playerP;

    //when
    let resultError = null;
    try {
      await conn.send({ type: "join_game", data: { code: "1234" }, id: 0 });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "User is not loggedin");
  });

  it("should login Player successfully", async () => {
    //given
    const conn = await playerP;

    //when
    const result = await conn.send({
      type: "reg",
      data: { name: "user2", password: "pass2" },
      id: 0,
    });

    //then
    /** @type {LoginResp} */
    const resp = {
      type: "reg",
      data: {
        name: "user2",
        index: 0,
        error: false,
        errorText: "",
      },
      id: 0,
    };
    deepEqual(result, resp);
  });

  it("should handle invalid start_game json message", async () => {
    //given
    const conn = await userP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "start_game" });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Validation error: Invalid start_game Json message");
  });

  it("should handle not loggedin user when start_game", async () => {
    //given
    const conn = await userP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "start_game", data: { gameId } });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "User is not loggedin");
  });

  it("should login User successfully", async () => {
    //given
    const conn = await userP;

    //when
    const result = await conn.send({
      type: "reg",
      data: { name: "user3", password: "pass3" },
      id: 0,
    });

    //then
    /** @type {LoginResp} */
    const resp = {
      type: "reg",
      data: {
        name: "user3",
        index: 0,
        error: false,
        errorText: "",
      },
      id: 0,
    };
    deepEqual(result, resp);
  });

  it("should handle user not a Host when start_game", async () => {
    //given
    const conn = await userP;

    //when
    let resultError = null;
    try {
      //@ts-ignore
      await conn.send({ type: "start_game", data: { gameId } });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "User is not a Host");
  });

  it("should handle invalid game code when join_game", async () => {
    //given
    const conn = await playerP;

    //when
    let resultError = null;
    try {
      await conn.send({ type: "join_game", data: { code: "123" }, id: 0 });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Game with room code 123 is not found");
  });

  it("should handle invalid gameId when start_game", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      await conn.send({ type: "start_game", data: { gameId: "123" }, id: 0 });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Game with gameId 123 is not found");
  });

  it("should join game successfully", async () => {
    //given
    const conn = await playerP;

    //when
    const result = await conn.send({
      type: "join_game",
      data: { code: gameCode },
      id: 0,
    });

    //then
    /** @type {JoinGameResp} */
    const resp = {
      type: "game_joined",
      data: {
        gameId,
      },
      id: 0,
    };
    deepEqual(result, resp);

    /** @type {PlayerJoinedMsg} */
    const playerJoinedMsg = {
      type: "player_joined",
      data: {
        playerName: "user2",
        playerCount: 1,
      },
      id: 0,
    };
    /** @type {UpdatePlayersMsg} */
    const updatePlayersMsg = {
      type: "update_players",
      data: [
        {
          name: "user2",
          index: 0,
          score: 0,
        },
      ],
      id: 0,
    };
    await eventually(() => {
      deepEqual(hostBroadcast.times, 2);
      deepEqual(hostBroadcastArgs, [playerJoinedMsg, updatePlayersMsg]);
      deepEqual(playerBroadcast.times, 2);
      deepEqual(playerBroadcastArgs, [playerJoinedMsg, updatePlayersMsg]);
      deepEqual(userBroadcast.times, 0);
      deepEqual(userBroadcastArgs, []);
    });
  });

  it("should start game successfully", async () => {
    //given
    const conn = await hostP;

    //when
    /** @type {StartGameResp} */
    const result = await conn.send({
      type: "start_game",
      data: { gameId },
      id: 0,
    });

    //then
    /** @type {StartGameResp} */
    const resp = {
      type: "game_started",
      data: {
        gameId,
      },
      id: 0,
    };
    deepEqual(result, resp);

    /** @type {QuestionMsg} */
    const questionMsg = {
      type: "question",
      data: {
        questionNumber: 1,
        totalQuestions: 2,
        text: questions[0].text,
        options: questions[0].options,
        timeLimitSec: questions[0].timeLimitSec,
      },
      id: 0,
    };
    await eventually(() => {
      deepEqual(hostBroadcast.times, 3);
      deepEqual(hostBroadcastArgs[2], questionMsg);
      deepEqual(playerBroadcast.times, 3);
      deepEqual(playerBroadcastArgs[2], questionMsg);
      deepEqual(userBroadcast.times, 0);
      deepEqual(userBroadcastArgs, []);
    });
  });

  it("should handle invalid game state when start_game", async () => {
    //given
    const conn = await hostP;

    //when
    let resultError = null;
    try {
      await conn.send({ type: "start_game", data: { gameId }, id: 0 });
    } catch (error) {
      resultError = error;
    }

    //then
    deepEqual(resultError, "Game state is not 'Waiting'");
  });
});

/**
 * @template {any} R
 * @param {() => R} f
 * @param {number} [timeoutMs] millis
 * @param {number} [intervalMs] millis
 * @returns {Promise<R>}
 */
async function eventually(f, timeoutMs = 1000, intervalMs = 10) {
  /** @type {PromiseWithResolvers<R>} */
  const resP = Promise.withResolvers();

  /** @type {any} */
  let lastError = null;

  const intervalId = setInterval(() => {
    try {
      resP.resolve(f());
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    } catch (error) {
      lastError = error;
    }
  }, intervalMs);

  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);

    lastError = lastError || Error();
    lastError.message = `Timedout after ${timeoutMs} millis. Error: ${lastError.message}`;

    resP.reject(lastError);
  }, timeoutMs);

  return resP.promise;
}
