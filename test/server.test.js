/**
 * @import { LoginResp, Question, CreateGameResp, JoinGameResp } from "../src/api.js"
 */
import { after, before, describe, it } from "node:test";
import { deepEqual } from "node:assert/strict";
import Connection from "../src/client/Connection.js";
import { create } from "../src/server.js";

const port = 12345;

/** @type {Question[]} */
const questions = [
  {
    text: "1 + 2 = ?",
    options: ["3", "4", "5", "12"],
    correctIndex: 0,
    timeLimitSec: 5,
  },
];

let gameCode = "";

describe("server.test.js", async () => {
  const wss = create(port);
  const wssReadyP = Promise.withResolvers();
  wss.once("listening", () => {
    wssReadyP.resolve(undefined);
  });

  /** @type {Promise<Connection>} */
  let hostP = new Promise(() => {});

  /** @type {Promise<Connection>} */
  let playerP = new Promise(() => {});

  before(async () => {
    await wssReadyP.promise;
    hostP = Connection.create(`ws://localhost:${port}`);
    playerP = Connection.create(`ws://localhost:${port}`);
  });

  after(async () => {
    //cleanup
    await hostP;
    await playerP;
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
    deepEqual(resultError, "Internal error: Unknown request: undefined");
  });

  it("should handle unknown request type json message", async () => {
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
    deepEqual(resultError, "Internal error: Unknown request: test_unknown");
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
      await conn.send({ type: "create_game", data: { questions: [] }, id: 0 });
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

  it("should handle invalid game code", async () => {
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
        gameId: "0",
      },
      id: 0,
    };
    deepEqual(result, resp);
  });
});
