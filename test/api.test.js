/**
 * @import { Question } from "../src/api.js"
 */
import { describe, it } from "node:test";
import { deepEqual } from "node:assert/strict";
import { isCreateGameData, isQuestionData } from "../src/api.js";

describe("api.test.js", () => {
  it("should validate create game request data", () => {
    //given
    /** @type {Question[]} */
    const questions = [
      {
        text: "1 + 2 = ?",
        options: ["3", "4", "5", "12"],
        correctIndex: 0,
        timeLimitSec: 5,
      },
    ];

    //when & then
    deepEqual(isCreateGameData({}), false);
    deepEqual(isCreateGameData({ questions: [] }), false);
    deepEqual(isQuestionData({}), false);
    deepEqual(isQuestionData({ ...questions[0], text: undefined }), false);
    deepEqual(isQuestionData({ ...questions[0], options: undefined }), false);
    deepEqual(isQuestionData({ ...questions[0], options: "" }), false);
    deepEqual(
      isQuestionData({ ...questions[0], correctIndex: undefined }),
      false,
    );
    deepEqual(isQuestionData(questions[0]), true);
    deepEqual(isCreateGameData({ questions }), true);
    deepEqual(
      isCreateGameData({
        questions: [{ ...questions[0], options: ["1", "2", "3"] }],
      }),
      false,
    );
  });
});
