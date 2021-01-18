process.on("SIGINT", () => process.exit(1));
process.on("SIGQUIT", () => process.exit(1));

import { config } from "dotenv";
config();

import { Bot } from "./index";

const BotOwners = process.env.BOT_OWNERS ? process.env.BOT_OWNERS.split(",") : undefined;

const bot = new Bot({
  owners: BotOwners
});

bot.createJsonDB("myDatabase", true, false, "/");

bot.login(process.env.TOKEN);
