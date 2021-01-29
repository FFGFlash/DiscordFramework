const Descriptor = {
  description: "Increments a number stored to the database"
};

function execute(msg) {
  let number = 0;
  try {
    number = this.databases.get("json").connection.getData(`/users/${msg.author.id}/ticks`);
  } catch(err) {
  }
  this.databases.get("json").connection.push(`/users/${msg.author.id}/ticks`, ++number);
  msg.reply(`You now have ${number} ticks.`);
}

module.exports = {
  descriptor: Descriptor,
  execute: execute
}
