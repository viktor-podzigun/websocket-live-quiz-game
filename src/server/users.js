import { readFile } from "fs/promises";

const json = await readFile(new URL("./users.json", import.meta.url));

/**
 * @type {readonly {
 *  readonly name: string;
 *  readonly password: string;
 * }[]}
 */
const players = JSON.parse(json.toString());

/** @type {(name: string, password: string) => boolean} */
export function isValidCredentials(name, password) {
  const player = players.find((_) => _.name === name);
  return !!player && player.password === password;
}
