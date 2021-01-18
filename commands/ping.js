const Descriptor = {
  description: "A simple test command."
};

function execute(msg) {
  return msg.reply("Pong!");
}

module.exports = {
  descriptor: Descriptor,
  execute: execute
}
