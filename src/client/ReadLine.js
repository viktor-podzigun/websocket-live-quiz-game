import readline from "readline";

class ReadLine {
  constructor() {
    /** @readonly @type {readline.Interface} */
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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
}

export default ReadLine;
