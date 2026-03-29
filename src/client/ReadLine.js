/**
 * @import readline from "readline";
 */

class ReadLine {
  /**
   * @param {readline.Interface} rl
   */
  constructor(rl) {
    /** @private @readonly @type {readline.Interface} */
    this.rl = rl;
  }

  close() {
    this.rl.close();
  }

  /**
   * @param {string} question
   * @param {(answer: string) => void} onAnswer
   */
  prompt(question, onAnswer) {
    this.rl.question(`${question}> `, (answer) => {
      onAnswer(answer);
    });
  }

  /**
   * @param {string} log
   */
  output(log) {
    console.log(log);
  }
}

export default ReadLine;
