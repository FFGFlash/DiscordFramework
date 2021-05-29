const { Command } = require("../dist/bot");

exports.data =
class PingCommand extends Command {
  constructor(name) {
    super(name, {
      description: "An example command file.",
      devOnly: true,
      guildOnly: false,
      permissions: 0,
      arguments: []
    });
  }

  call(msg) {
    return msg.reply("Pong!");
  }
}
