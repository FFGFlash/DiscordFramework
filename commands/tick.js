const Descriptor = {
  description: "Increments a number stored to the database"
};

function execute(msg) {
  let number = 0;
  try {
    number = this.db.getData(`/users/${msg.author.id}/ticks`);
  } catch(err) {
  }
  this.db.push(`/users/${msg.author.id}/ticks`, ++number);
  msg.reply(`You now have ${number} of ticks.`);
}

module.exports = {
  descriptor: Descriptor,
  execute: execute
}
