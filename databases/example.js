const { Database } = require("../dist/bot");

exports.default =
class ExampleDatabase extends Database {
  constructor(name) {
    super(name, {
      dialect: "sqlite",
      storage: "example.sqlite"
    });
  }

  build() {
    this.log("Building database...");
  }
}
