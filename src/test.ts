process.on("SIGINT", () => process.exit(1));
process.on("SIGQUIT", () => process.exit(1));

import { config } from "dotenv";
config();

import { Bot } from "./index";

const BotOwners = process.env.BOT_OWNERS ? process.env.BOT_OWNERS.split(",") : [];

const bot = new Bot({
  owners: BotOwners
});

bot.addJsonDB("json", {filename: "jsondb", saveOnPush: true, humanReadable: false, separator: "/"});
// bot.addSqliteDB("sqlite", "sqlitedb");

bot.addPastebinAPI({
  api_dev_key: process.env.PASTEBIN_DEV_KEY
});

bot.addCommand("inline", {
  description: "A command written purely inline",
  arguments: [
    {
      name: "arg1",
      options: {
        optional: false,
        description: "This argument was written inline"
      }
    }
  ],
  channels: "dm",
  botOwnerOnly: true
}).run = (msg, arg1) => msg.reply(`Wow this command was written on one line! Arg1: ${arg1}`);

bot.login(process.env.TOKEN);
