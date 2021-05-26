# DiscordFramework
### Powered by [Discord.JS](https://discord.js.org/)
#### Authors
- FFGFlash

#### Table of Contents
- [Installing](#installing)
- [Example](#examples)
    - [Bot](#bot)
    - [Handler File](#handler-file)
    - [Command File](#command-file)

## Installing
```bat
> npm install --save ffg-discord-framework@alpha
```
## Examples
#### Bot
```js
const { Bot } = require("ffg-discord-framework");

let bot = new Bot({
    prefix: "!", // The default command prefix
    developers: [ 12345678901234567890 ], // A list of Discord IDs that grant developer permissions
    deleteTimer: 15000, // How long a response should stay in chat in ms
    embed: {} // The default embed data used when creating an embed with 'bot.createEmbed()'
});

bot.addHandler("example", "ready", {
  once: true // Whether or not the handler should only fire once.
}).call = function() {
  this.bot.logger.info("Bot Ready!");
}

bot.addCommand("example", {
    description: "An example command.", // A description of the command
    devOnly: false, // Whether or not the author needs developer permissions
    guildOnly: false, // Determines whether or not the command will be respected within DM channels
    permissions: 0, // Permissions required to execute this command (guild only)
    arguments: [ // List of arguments or argument descriptors
        { name: "arg1", options: { optional: false, description: "A required argument." } },
        { name: "arg2", options: { optional: true, description: "An optional argument." } }
    ]
}).call = function(msg, arg1, arg2) {
  return msg.reply(`Example! Arg1: ${arg1} Arg2: ${arg2}`); // Returning a Discord.Message or Promise<Discord.Message> will delete the response after bot.deleteTimer seconds.
}

bot.login("<bot-token>");
```
#### Handler File
##### Class Syntax
```js
// ./handlers/example.js
const { Handler } = require("ffg-discord-framework");

module.exports =
class Ready extends Handler {
  constructor(name) {
    super(name, "ready", {});
  }

  call() {
    console.log(`Bot Ready!`);
  }
};

```
##### Object Syntax
```js
// ./handlers/example.js
module.exports = {
  event: "ready",
  options: {},
  call: function(...args) {
    console.log(`Event: ${this.event} Arguments:\n`, ...args);
  }
};
```
#### Command File
##### Class Syntax
```js
// ./commands/example.js
const { Command } = require("ffg-discord-framework");

module.exports =
class Example extends Command {
  constructor(name) {
    super(name, {});
  }

  call(msg, ...args) {
    msg.channel.send(`Command: ${this.name}\nArguments: ${args.join(", ")}`);
  }
};
```
##### Object Syntax
```js
// ./commands/example.js
module.exports = {
  options: {},
  call: function(msg, ...args) {
    msg.channel.send(`Command: ${this.name}\nArguments: ${args.join(", ")}`);
  }
};
```
