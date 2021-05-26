# DiscordFramework
### Powered by [Discord.JS](https://discord.js.org/)
#### Authors
- FFGFlash

#### Table of Contents
- [Installing](#installing)
- [Example](#examples)
    - [Bot](#bot)
    - [Module File](#module-file)
    - [Command File](#command-file)

## Installing
```bat
> npm install --save ffg-discord-framework
```
## Examples
#### Bot
```js
const { Bot } = require("ffg-discord-framework");

let bot = new Bot({
    prefix: "!", // The global command prefix
    developers: [ 12345678901234567890 ], // A list of Discord IDs that grant developer permissions
    deleteTimer: 5, // How long a response should stay in chat
    embed: {}, // Default embed options used when creating an embed with 'bot.createEmbed()'
    commands: [ // Commands here are added to the "core" module.
      {name: "example_inline", options: { /* Same as below */ }, execute: function(msg) {}}
    ],
    modules: [ // Inline modules
      {name: "example_inline", options: { /* ... */ }, initialize: function() {}}
    ]
});

bot.addModule("example", {
  commands: [
    {name: "test", options: { /* ... */ }, execute = function(msg) {
      this.data.hello_world += "!";
      return msg.reply(this.data.hello_world);
    }}
  ]
}).initialize = function() {
  this.data.hello_world = "Hello World";
}

bot.core.addCommand("example", {
    description: "An example command.", // A description of the command
    devOnly: false, // Whether the author needs developer permissions or not
    permissions: new Discord.Permission(0), // Permissions required to execute this command (guild only)
    guildOnly: false, // Determines whether or not the command will be respected within DM channels
    arguments: [ // List of arguments or argument descriptors
        {name: "arg1", options: {optional: false, description: "A required argument."}},
        {name: "arg2", options: {optional: true, description: "An optional argument."}}
    ]
}).execute = (msg, arg1, arg2) => msg.reply(`Example! Arg1: ${arg1} Arg2: ${arg2}`); // Returning a Discord.Message or Promise<Discord.Message> will delete the response after bot.deleteTimer seconds.

bot.login("bot-token");
```
#### Module File
```js
// ./modules/example.js
module.exports = {
  options: {
    description: "An example module.",
    devOnly: true,
    permissions: new Discord.Permission(0),
    guildOnly: false,
    commands: [
      {name: "example", options: { /* ... */ }, execute: function(msg) {
        return msg.reply(this.data.global_module_variable);
      }}
    ]
  },
  initialize: function() {
    this.data.global_module_variable = "Hello World!"; // This can be accessed by any command within the scope of the module.
  }
};
```
#### Command File
```js
// ./modules/core/example.js
module.exports = {
    options: {
        description: "An example command.",
        devOnly: false,
        permissions: new Discord.Permission(0),
        guildOnly: false,
        arguments: [
            {name: "arg1", options: {optional: false, description: "A required argument."}},
            {name: "arg2", options: {optional: true, description: "An optional argument."}}
        ]
    },
    execute: function(msg, arg1, arg2) {
        return msg.reply(`Example! Arg1: ${arg1}, Arg2: ${arg2}`);
    }
}
```
