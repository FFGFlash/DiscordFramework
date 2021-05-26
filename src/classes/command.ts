import { Bot } from "../bot";
import { Message, Permissions, PermissionResolvable, MessageEmbedOptions, MessageEmbed } from "discord.js";
import { Argument, ArgumentOptions } from "./argument";

export type CommandReturn = void | Message | undefined;

export interface CommandOptions {
  description?: string;
  permissions?: PermissionResolvable;
  devOnly?: boolean;
  guildOnly?: boolean;
  arguments?: Array<Argument | {name: string, options?: ArgumentOptions}>;
}

interface _CommandOptions extends CommandOptions {
  description: string;
  permissions: PermissionResolvable;
  devOnly: boolean;
  guildOnly: boolean;
}

export abstract class Command {
  private _name: string;
  private _options: _CommandOptions;
  private _arguments: Array<Argument> = [];

  bot?: Bot;
  data: {[key: string]: any} = {};

  static readonly DefaultOptions: _CommandOptions = {
    description: "No Description Provided.",
    permissions: 0,
    devOnly: false,
    guildOnly: false
  };

  constructor(name: string, options?: CommandOptions) {
    this._name = name;
    this._options = Object.assign({}, Command.DefaultOptions, options);

    if (this._options.arguments) {
      for (let arg of this._options.arguments) {
        if (arg instanceof Argument) {
          this.add(arg);
          continue;
        }
        this.addArgument(arg.name, arg.options);
      }
    }
  }

  get arguments() {
    return this._arguments;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._options.description;
  }

  get devOnly() {
    return this._options.devOnly;
  }

  get guildOnly() {
    return this._options.guildOnly;
  }

  get permissions() {
    return new Permissions(this._options.permissions);
  }

  get formated() {
    return `${this.name} ${this.arguments.map(arg => arg.formated).join(" ")}`;
  }

  get log() {
    if (!this.bot) {
      return console.log;
    }
    return this.bot.log;
  }

  get error() {
    if (!this.bot) {
      return console.error;
    }
    return this.bot.error;
  }

  get warn() {
    if (!this.bot) {
      return console.warn;
    }
    return this.bot.warn;
  }

  get createEmbed() {
    if (!this.bot) return (data: MessageEmbedOptions | MessageEmbed = {}) => new MessageEmbed(data);
    return this.bot.createEmbed.bind(this.bot);
  }

  connect(bot: Bot) {
    this.bot = bot;
    this.bot.commands.set(this.name, this);
  }

  disconnect() {
    if (!this.bot) return;
    this.bot.commands.delete(this.name);
  }

  add<T>(object: T): T {
    if (object instanceof Argument) {
      this._arguments.push(object);
    }

    return object;
  }

  remove<T>(object: T): T {
    if (object instanceof Argument) {
      this._arguments.splice(this._arguments.indexOf(object), 1);
    }

    return object;
  }

  addArgument(name: string, options?: ArgumentOptions) {
    return this.add(new Argument(name, options));
  }

  removeArgument(name: string) {
    return this.remove(this.arguments.find(arg => arg.name == name));
  }

  abstract call(msg: Message, ...args: string[]): CommandReturn | Promise<CommandReturn>;
}

export class GenericCommand extends Command {
  call(msg: Message, ...args: string[]) {
    msg.channel.send(`Command: ${this.name}\nArguments: ${args.join(", ")}`);
  }
}
