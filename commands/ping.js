const Descriptor = {
  description: "A simple test command."
};

async function execute(msg) {
  return await msg.reply("Pong!");
}

module.exports = {
  descriptor: Descriptor,
  execute: execute
}
