/**
 * @typedef {LoginReq
 *  | CreateGameReq
 *  | JoinGameReq
 *  | StartGameReq
 *  | QuestionAnswerReq
 * } ApiReq
 */

/**
 * @typedef {LoginResp
 *  | CreateGameResp
 *  | JoinGameResp
 *  | StartGameResp
 *  | QuestionAnswerResp
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

/**
 * @typedef {{
 *  readonly type: "join_game";
 *  readonly data: {
 *    readonly code: string;
 *  };
 *  readonly id: 0;
 * }} JoinGameReq
 */

/** @type {(data: any) => boolean} */
export function isJoinGameData(data) {
  return !!data && typeof data.code === "string";
}

/**
 * @typedef {{
 *  readonly type: "game_joined";
 *  readonly data: {
 *    readonly gameId: string;
 *  };
 *  readonly id: 0;
 * }} JoinGameResp
 */

/**
 * @typedef {{
 *  readonly type: "start_game";
 *  readonly data: {
 *    readonly gameId: string;
 *  };
 *  readonly id: 0;
 * }} StartGameReq
 */

/** @type {(data: any) => boolean} */
export function isStartGameData(data) {
  return !!data && typeof data.gameId === "string";
}

/**
 * @typedef {{
 *  readonly type: "game_started";
 *  readonly data: {
 *    readonly gameId: string;
 *  };
 *  readonly id: 0;
 * }} StartGameResp
 */

/**
 * @typedef {{
 *  readonly type: "answer";
 *  readonly data: {
 *    readonly gameId: string;
 *    readonly questionIndex: number;
 *    readonly answerIndex: number;
 *  };
 *  readonly id: 0;
 * }} QuestionAnswerReq
 */

/** @type {(data: any) => boolean} */
export function isQuestionAnswerData(data) {
  return (
    !!data &&
    typeof data.gameId === "string" &&
    typeof data.questionIndex === "number" &&
    typeof data.answerIndex === "number"
  );
}

/**
 * @typedef {{
 *  readonly type: "answer_accepted";
 *  readonly data: {
 *    readonly questionIndex: number;
 *  };
 *  readonly id: 0;
 * }} QuestionAnswerResp
 */

/**
 * @typedef {PlayerJoinedMsg
 *  | UpdatePlayersMsg
 *  | QuestionMsg
 * } BroadcastMsg
 */

/** @type {(resp: any) => boolean} */
export function isBroadcastMsg(resp) {
  return (
    !!resp &&
    (resp.type === "player_joined" ||
      resp.type === "update_players" ||
      resp.type === "question")
  );
}

/**
 * @typedef {{
 *  readonly type: "player_joined";
 *  readonly data: {
 *    readonly playerName: string;
 *    readonly playerCount: number;
 *  };
 *  readonly id: 0;
 * }} PlayerJoinedMsg
 */

/**
 * @typedef {{
 *  readonly type: "update_players";
 *  readonly data: {
 *    readonly name: string;
 *    readonly index: number | string;
 *    readonly score: number;
 *  }[];
 *  readonly id: 0;
 * }} UpdatePlayersMsg
 */

/**
 * @typedef {{
 *  readonly type: "question";
 *  readonly data: {
 *    readonly questionNumber: number;
 *    readonly totalQuestions: number;
 *    readonly text: string;
 *    readonly options: [string, string, string, string];
 *    readonly timeLimitSec: number;
 *  };
 *  readonly id: 0;
 * }} QuestionMsg
 */
