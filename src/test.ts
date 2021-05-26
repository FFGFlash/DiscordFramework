import { config } from "dotenv";
import { Bot } from "./bot";

config();

let developers = process.env.DEVELOPERS ? process.env.DEVELOPERS.split(",") : [];

let bot = new Bot({ developers: developers });

bot.login(process.env.TOKEN);

process.on("exit", () => {
  bot.destroy();
});
