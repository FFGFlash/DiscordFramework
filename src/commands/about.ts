import { Command } from "../classes";
import { Message } from "discord.js";

export class AboutCommand extends Command {
  constructor() {
    super("about", {
      description: "Provides information about the bot.",
      devOnly: false,
      guildOnly: false,
      permissions: 0,
      arguments: []
    });
  }

  async call(msg: Message) {
    if (!this.bot || !this.bot.user) return;

    let developers: Array<string> = [ "Unspecified" ];

    if (this.bot.developers.length > 0) {
      developers = [];
      for (let id of this.bot.developers) {
        let user = await this.bot.users.fetch(id);
        if (!user) continue;
        developers.push(user.tag);
      }
    }

    msg.channel.send(this.createEmbed({
      title: `About ${this.bot.user.tag}`,
      description: this.bot.description,
      fields: [
        { name: "Developers", value: `${developers.join(", ").replace(/, (\w+)$/i, " and $1")}.` },
        { name: "Guilds", value: `Count: ${this.bot.guilds.cache.size}`, inline: true },
        { name: "API Latency", value: `${Math.round(this.bot.ws.ping)}ms`, inline: true },
        { name: "Message Latency", value: `${Date.now() - msg.createdTimestamp}ms`, inline: true }
      ],
      thumbnail: { url: this.bot.user.avatarURL() as string }
    }));
  }
}
