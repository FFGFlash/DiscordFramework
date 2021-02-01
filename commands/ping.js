const Descriptor = {
	description: "This is an example command."
};

async function execute(msg) {
	return msg.reply("Pong!");
}

module.exports = {
	descriptor: Descriptor,
	execute: execute
};