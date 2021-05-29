const { Handler } = require("../dist/bot");

exports.data =
class Ready extends Handler {
  constructor(name) {
    super(name, "ready", {});
  }

  call() {
    this.log(`Bot Ready!`);
  }
};
