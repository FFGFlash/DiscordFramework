const Descriptor = {
  description: "Evaluates javascript.",
  botOwnerOnly: true
};

function execute(msg, ...code) {
  code = code.join(" ");
  let res;
  try {
    res = eval(code);
  } catch(err) {
    res = `${err.name}: ${err.message}`;
  }
  msg.reply(`\`\`\`\n${res}\`\`\``)
}

module.exports = {
  descriptor: Descriptor,
  execute: execute
}
