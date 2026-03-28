/**
 * @typedef {LoginReq
 *  | CreateGameReq
 * } ApiReq
 */

/**
 * @typedef {LoginResp
 *  | CreateGameResp
 * } ApiResp
 */

/**
 * @typedef {{
 *  readonly type: "reg";
 *  readonly data: {
 *    readonly name: string;
 *    readonly password: string;
 *  };
 *  readonly id: 0;
 * }} LoginReq
 */

/** @type {(data: any) => boolean} */
export function isLoginData(data) {
  return (
    !!data && typeof data.name === "string" && typeof data.password === "string"
  );
}

/**
 * @typedef {{
 *  readonly type: "reg";
 *  readonly data: {
 *    readonly name: string;
 *    readonly index: number | string;
 *    readonly error: boolean;
 *    readonly errorText: string;
 *  };
 *  readonly id: 0;
 * }} LoginResp
 */

/**
 * @typedef {{
 *  readonly type: "create_game";
 *  readonly data: {
 *    readonly questions: Question[];
 *  };
 *  readonly id: 0;
 * }} CreateGameReq
 */

/** @type {(data: any) => boolean} */
export function isCreateGameData(data) {
  return (
    !!data &&
    Array.isArray(data.questions) &&
    data.questions.length > 0 &&
    data.questions.every(isQuestionData)
  );
}

/** @type {(data: any) => boolean} */
export function isQuestionData(data) {
  return (
    !!data &&
    typeof data.text === "string" &&
    Array.isArray(data.options) &&
    data.options.length === 4 &&
    typeof data.correctIndex === "number" &&
    typeof data.timeLimitSec === "number"
  );
}

/**
 * @typedef {{
 *  readonly text: string;
 *  readonly options: [string, string, string, string];
 *  readonly correctIndex: number;
 *  readonly timeLimitSec: number;
 * }} Question
 */

/**
 * @typedef {{
 *  readonly gameId: string;
 *  readonly code: string;
 * }} GameCreated
 */

/**
 * @typedef {{
 *  readonly type: "game_created";
 *  readonly data: GameCreated;
 *  readonly id: 0;
 * }} CreateGameResp
 */
