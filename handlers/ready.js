const { Handler } = require("../dist/bot");

module.exports =
class Ready extends Handler {
  constructor(name) {
    super(name, "ready", {});
  }

  call() {
    this.log(`Bot Ready!`);
  }
};
