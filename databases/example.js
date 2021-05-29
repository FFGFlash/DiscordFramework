const { Database } = require("../dist/bot");

exports.data =
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
