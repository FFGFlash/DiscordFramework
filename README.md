# DiscordFramework
### Powered by [Discord.JS](https://discord.js.org/)
#### Authors
- FFGFlash

#### Table of Contents
- [Installing](#installing)
    - [Optional Dependencies](#optional-dependencies)
- [Example](#examples)
    - [Bot](#bot)
    - [Command File](#command-file)

## Installing
```bat
> npm install --save ffg-discord-framework
```
#### Optional Dependencies
```bat
> npm install --save chokidar
> npm install --save mysql
> npm install --save sqlite3
> npm install --save node-json-db
> npm install --save pastebin-ts
```
##### Chokidar
Chokidar enables the framework to watch the provided command directory, meaning commands can be loaded, reloaded and unloaded without restarting the bot.
##### MYSQL
MYSQL enables the use of MYSQL Databases.
```js
bot.addMysqlDB("database-name", "connection-uri");

bot.addMysqlDB("database-name", {
    host: "127.0.0.1",
    port: 3306,
    user: "username",
    password: "password",
    database: "database-name"
});

bot.addMysqlPoolDB("database-name", "connection-uri");

bot.addMysqlPoolDB("database-name", {
    host: "127.0.0.1",
    port: 3306,
    user: "username",
    password: "password",
    database: "database-name",
    connectionLimit: 10,
    queueLimit: 0,
    waitForConnections: true,
    acquireTimeout: 10
});

let conn = bot.getDB("database-name");
conn.connect();
conn.query("example-query");
conn.end();
```
##### SQLite3
SQLite3 enables the use of SQLite Databases.
```js
bot.addSqliteDB("database-name", "database-filename");

bot.addSqliteDB("database-name", {
    filename: "database-filename",
    mode: Sqlite3.OPEN_READWRITE | Sqlite3.OPEN_CREATE,
    callback: error => {
        if (error) throw error;
    }
});

bot.getDB("database-name").run("example-query");
```
##### JSONDB
JSONDB enables the use of JSON Databases.
```js
bot.addJsonDB("database-name", {
    filename: "database-filename",
    saveOnPush: true,
    humanReadable: false,
    seperator: "/"
});

bot.addJsonDB("database-name", "database-filename");

bot.getDB("database-name").push("/example", "data");
```
##### Pastebin.TS
PastebinTS enables access to the PastebinAPI.
```js
bot.addPastebinAPI();

bot.addPastebinAPI("dev-key");

bot.addPastebinAPI({
   api_dev_key: "dev-key",
   api_user_key: "user-key",
   api_user_name: "username",
   api_user_password: "password"
});
```
## Examples
#### Bot
```js
const { Bot } = require("ffg-discord-framework");

let bot = new Bot({
    prefix: "!", // The global command prefix
    owners: [12345678901234567890], // A list of Discord IDs that grant bot owner permission
    cmdDir: "./commands", // Where file commands are stored
    loadCmdDir: true, // Whether or not to load file commands
    deleteTimer: 5, // How long a response should stay in chat
    disableCommands: ["eval", "command"] // List of command names to disable globaly
});

bot.addCommand("example", {
    description: "An example command.", // A description of the command
    botOwnerOnly: false, // Whether the author needs bot owner permission or not
    permissions: new Discord.Permission(0), // Permissions required to execute this command (guild only)
    channels: "any", // What ChannelType this command can be used in (dm | guild | any)
    arguments: [ // List of arguments or argument descriptors
        {name: "arg1", options: {optional: false, description: "A required argument."}},
        {name: "arg2", options: {optional: true, description: "An optional argument."}}
    ]
}).run = (msg, arg1, arg2) => msg.reply(`Example! Arg1: ${arg1} Arg2: ${arg2}`); // Returning a Discord.Message or Promise<Discord.Message> will delete the response after bot.deleteTimer seconds.

bot.login("bot-token");
```
#### Command File
```js
// ./commands/example.js
module.exports = {
    descriptor: {
        description: "An example command.",
        botOwnerOnly: false,
        permissions: new Discord.Permission(0),
        channels: "any",
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
