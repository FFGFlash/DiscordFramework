import { Bot } from "./bot";
import { config } from "dotenv";

config();

const bot = new Bot({
  developers: (process.env.DEVELOPERS || "").split(" ")
});

bot.on("ready", () => {
  if (!bot.user) return;
  console.log(`${bot.user.tag} is now ready!`);
});

bot.login(process.env.TOKEN);
