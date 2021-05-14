const { Command } = require("../../dist/bot.js");

class Ping extends Command {
  constructor() {
    super("ping", {
      description: "A simple command added through a command file!",
      devOnly: true
    });
  }

  execute(msg) {
    return msg.reply("Pong!");
  }
}

module.exports = Ping;

// exports.options = {
//   description: "A simple command added through a command file!",
//   devOnly: true
// }
//
// exports.execute = function(msg) {
//   return msg.reply("Pong!");
// };
