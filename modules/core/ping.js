exports.options = {
  description: "A simple command added through a command file!",
  devOnly: true
}

exports.execute = function(msg) {
  return msg.reply("Pong!");
};
