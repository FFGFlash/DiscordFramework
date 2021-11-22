const { Database } = require("../dist/bot");

exports.default =
class Example extends Database {
  constructor(name) {
    super(name, {
      dialect: "sqlite",
      storage: "example.sqlite"
    });
  }

  build() {
    
  }
}
