/**
 * @import { LoginResp, Question, CreateGameResp } from "../src/api.js"
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

describe("server.test.js", async () => {
  const wss = create(port);
  const readyP = Promise.withResolvers();
  wss.once("listening", () => {
    readyP.resolve(undefined);
  });

  /** @type {Promise<Connection>} */
  let connP = new Promise(() => {});

  before(async () => {
    await readyP.promise;
    connP = Connection.create(`ws://localhost:${port}`);
  });

  after(async () => {
    //cleanup
    const conn = await connP;
    conn.ws.close();
    wss.close();
  });

  it("should handle invalid reg json message", async () => {
    //given
    const conn = await connP;

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
    const conn = await connP;

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
    const conn = await connP;

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
    const conn = await connP;

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
    const conn = await connP;

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

  it("should return room code when create_game", async () => {
    //given
    const conn = await connP;

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
  });
});
