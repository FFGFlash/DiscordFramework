import { Handler } from "../classes";
import { Message } from "discord.js";

export class CommandHandler extends Handler {
  constructor() {
    super("\\command_handler", "message", { once: false });
  }

  async call(msg: Message) {
    if (!this.bot.user) return;
    let prefix = this.bot.prefix(msg.guild);
    if (msg.author.bot || (!(msg.content.startsWith(`<@${this.bot.user.id}>`) || msg.content.startsWith(`<@!${this.bot.user.id}>`)) && !msg.content.startsWith(prefix))) return;

    let args = msg.content.split(" ");

    let name = args.shift() as string;
    if (!name.startsWith(prefix)) {
      let v = args.shift();
      if (!v) return msg.channel.send(`Hello, my prefix is '${prefix}'!`);
      else name = v;
    } else name = name.substring(prefix.length);

    let cmd = this.bot.commands.get(name);
    if (!cmd) return;

    let errors = [];
    if (cmd.guildOnly && !msg.guild) errors.push(`Can only be executed in a guild.`);
    if (cmd.devOnly && this.bot.developers.indexOf(msg.author.id) == -1) errors.push(`Can only be executed by a developer.`);
    if (msg.member && !msg.member.hasPermission(cmd.permissions)) errors.push(`Missing required '${msg.member.permissions.missing(cmd.permissions).join(", ")}' permissions.`);

    if (errors.length > 0) return msg.channel.send(this.bot.createEmbed({ title: "The following errors occurred...", description: errors.join("\n") }));

    let resp = await cmd.call(msg, ...args);

    if (!resp) return;

    setTimeout(() => (resp as Message).delete(), this.bot.deleteTimer);
  }
}
