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

/** @type {(s: any) => boolean} */
export function isLoginData(data) {
  return (
    !!data &&
    data.name &&
    typeof data.name === "string" &&
    data.password &&
    typeof data.password === "string"
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
 *  readonly type: "game_created";
 *  readonly data: {
 *    readonly gameId: string;
 *    readonly code: string;
 *  };
 *  readonly id: 0;
 * }} CreateGameResp
 */
