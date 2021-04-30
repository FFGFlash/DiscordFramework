exports.options = {
  prefix: "@",
  description: "This is an example module!",
  devOnly: true,
  commands: [{
    name: "ping",
    options: {
      description: "A simple command added through the inline format!"
    },
    execute: function(msg) {
      this.data.hello_world += "!";
      return msg.reply(`${this.data.hello_world}`);
    }
  }]
};

exports.initialize = function() {
  this.data.hello_world = "Hello World";
};
