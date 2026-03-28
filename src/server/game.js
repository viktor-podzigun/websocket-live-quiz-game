/**
 * @import { Question } from "../api.js"
 */

/**
 * @type {{
 *  readonly questions: readonly Question[],
 *  readonly code: string,
 * }[]}
 */
const games = [];

/** @type {(questions: readonly Question[]) => [string, string]} */
export function createGame(questions) {
  const code = Math.floor(1000 + 9000 * Math.random()).toString();

  const gameId = games.push({ questions, code }) - 1;

  return [`${gameId}`, code];
}
