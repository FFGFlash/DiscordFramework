import { Command, CommandOptions, CommandExecuteResponse } from "./command";
import { join } from "path";
import { Bot } from "../bot";
import { Message, MessageEmbedOptions, MessageEmbed } from "discord.js";

export interface ModuleOptions extends CommandOptions {
  prefix?: string;
  commands?: (Command | {name: string, options: CommandOptions, execute: (msg: Message, ...args: any[]) => Promise<CommandExecuteResponse> | CommandExecuteResponse})[];
  embed?: MessageEmbedOptions;
}

export class Module {
  options?: ModuleOptions;

  name: string;
  bot?: Bot;

  data: {[key: string]: any} = {};

  commands = new Map<string, Command>();

  constructor(name: string, options? : ModuleOptions) {
    this.name = name;
    this.options = options;

    if (options && options.commands) {
      for (let c of options.commands) {
        if (!(c instanceof Command)) {
          this.addCommand(c.name, c.options).execute = c.execute;
          continue;
        }
        this.add(c);
      }
    }
  }

  disable() {
    if (!this.bot || !this.bot.watcher || !this.bot._options.moduleDir) {
      this.bot = undefined;
      return;
    }
    let path = join(this.bot._options.moduleDir, this.name);
    this.bot.watcher.unwatch(path);
    this.bot = undefined;
  }

  enable(bot: Bot) {
    this.bot = bot;
    if (!this.bot.watcher || !this.bot._options.moduleDir) return;
    let path = join(this.bot._options.moduleDir, this.name);
    return this.bot.watcher.add(path);
  }

  createEmbed(options?: MessageEmbedOptions) {
    options = Object.assign({}, this.embed, options);
    return new MessageEmbed(options);
  }

  get embed() {
    if (this.options && this.options.embed) {
      return this.options.embed;
    } else if (this.bot && this.bot._options.embed) {
      return this.bot._options.embed;
    } else if (Bot.DefaultOptions.embed) {
      return Bot.DefaultOptions.embed;
    }
    return {};
  }

  get prefix() {
    if (this.options && this.options.prefix) {
      return this.options.prefix;
    } else if (this.bot && this.bot._options.prefix) {
      return this.bot._options.prefix;
    } else if (Bot.DefaultOptions.prefix) {
      return Bot.DefaultOptions.prefix;
    }
    return "!";
  }

  add<T>(object: T): T {
    if (object instanceof Command) {
      object.enable(this);
      this.commands.set(object.name, object);
    }
    return object;
  }

  remove<T>(object: T): T {
    if (object instanceof Command) {
      object.disable();
      this.commands.delete(object.name);
    }
    return object;
  }

  addCommand(name: string, options: CommandOptions) {
    return this.add(new Command(name, options));
  }

  removeCommand(name: string) {
    let command = this.commands.get(name);
    if (!command) return;
    return this.remove(command);
  }
}
