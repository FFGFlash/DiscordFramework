import { Command, CommandOptions } from "./command";
import { join } from "path";
import { Bot } from "../bot";
import { Message } from "discord.js";

export interface ModuleOptions extends CommandOptions {
  prefix?: string;
  commands?: (Command | {name: string, options: CommandOptions, execute: (msg: Message, ...args: any[]) => Message | Promise<Message> | undefined})[];
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
    if (!this.bot || !this.bot.watcher || !this.bot._options.moduleDir) return;
    let path = join(this.bot._options.moduleDir, this.name);
    return this.bot.watcher.unwatch(path);
  }

  enable(bot: Bot) {
    this.bot = bot;
    if (!this.bot.watcher || !this.bot._options.moduleDir) return;
    let path = join(this.bot._options.moduleDir, this.name);
    return this.bot.watcher.add(path);
  }

  getPrefix() {
    return (this.options && this.options.prefix ? this.options.prefix : this.bot ? this.bot._options.prefix : Bot.DefaultOptions.prefix) as string;
  }

  add<T>(object: T): T {
    if (object instanceof Command) {
      this.commands.set(object.name, object);
    }
    return object;
  }

  remove<T>(object: T): T {
    if (object instanceof Command) {
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
