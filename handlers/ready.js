const { Handler } = require("../dist/bot");

exports.default =
class Ready extends Handler {
  constructor(name) {
    super(name, "ready", {});
  }

  call() {
    this.log(`Bot Ready!`);
  }
};
