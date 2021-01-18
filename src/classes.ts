import * as Types from "./interfaces";
import * as Discord from "discord.js";
import { Bot } from "./index";

export class Command {
  private static DefaultOptions: Types.CommandOptions = {
    description: "No Description Provided.",
    channels: "any",
    permissions: new Discord.Permissions(0),
    botOwnerOnly: false
  };
  private execute: (msg: Discord.Message, ...args: any[]) => Promise<Discord.Message> | undefined;
  name: string;
  description: string;
  channels: Types.channel;
  arguments: Argument[];
  permissions: Discord.Permissions;
  botOwnerOnly: boolean;
  bot: Bot;

  constructor(bot: Bot, name: string, options?: Types.CommandOptions) {
    this.name = name.toLowerCase();
    this.bot = bot;
    this.execute = function(msg) {
      return msg.reply("Hello World!");
    }
    this.description = options && options.description ? options.description : Command.DefaultOptions.description as string;
    this.channels = options && options.channels ? options.channels : Command.DefaultOptions.channels as Types.channel;
    this.permissions = new Discord.Permissions(options && options.permissions ? options.permissions : Command.DefaultOptions.permissions as Discord.Permissions);
    this.botOwnerOnly = options && options.botOwnerOnly ? options.botOwnerOnly : Command.DefaultOptions.botOwnerOnly as boolean;
    this.arguments = [];
    if (options && options.arguments) {
      for (let argument of options.arguments) {
        if (argument instanceof Argument) {
          this.arguments.push(argument);
        } else {
          this.addArgument(argument.name, argument.options);
        }
      }
    }
  }

  addArgument(name: string, options?: Types.ArgumentOptions) {
    let argument = new Argument(name, options);
    this.arguments.push(argument);
    return argument;
  }

  set run(execute: (msg: Discord.Message, ...args: any[]) => Promise<Discord.Message> | undefined) {
    this.execute = execute;
  }

  get run(): (msg: Discord.Message, ...args: any[]) => Promise<Discord.Message> | undefined {
    return (msg: Discord.Message, ...args: any[]): Promise<Discord.Message> | undefined => {
      let guild = msg.guild;

      if (this.botOwnerOnly && (!this.bot.owners || this.bot.owners.indexOf(msg.author.id) == -1)) return msg.reply("This command is bot owners only.");

      if (this.channels == "guild" && !guild) return msg.reply("This command can only be executed in guilds.");
      else if (this.channels == "dm" && msg.channel.type != "dm") return msg.reply("This command can only be executed in DMs.");

      for (let index in this.arguments) {
        let { name, optional } = this.arguments[index];
        let value = args[index];
        if (!optional && !value) return msg.reply(`Missing required '${name}' argument.`);
      }

      return this.execute.apply(this.bot, [msg, ...args]);
    }
  }
}

export class Argument {
  private static DefaultOptions: Types.ArgumentOptions = {
    description: "No Description Provided.",
    optional: false
  };
  name: string;
  description: string;
  optional: boolean;

  constructor(name: string, options?: Types.ArgumentOptions) {
    this.name = name.toLowerCase();
    this.description = options && options.description ? options.description : Argument.DefaultOptions.description as string;
    this.optional = options && options.optional ? options.optional : Argument.DefaultOptions.optional as boolean;
  }
}
