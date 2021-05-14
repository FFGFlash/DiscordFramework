import { Module } from "./module";
import { Argument, ArgumentOptions } from "./argument";
import { Permissions, Message } from "discord.js";

export type CommandExecuteResponse = Message | void;

export interface CommandOptions {
  devOnly?: boolean;
  permissions?: Permissions;
  guildOnly?: boolean;
  description?: string;
  arguments?: (Argument | {name: string, options: ArgumentOptions})[];
}

export class Command {
  name: string;
  options?: CommandOptions;

  arguments = new Map<string, Argument>();

  module?: Module;

  constructor(name: string, options?: CommandOptions) {
    this.name = name;
    this.options = options;

    if (options && options.arguments) {
      for (let a of options.arguments) {
        if (!(a instanceof Argument)) {
          a = new Argument(a.name, a.options);
        }
        this.add(a);
      }
    }
  }

  add<T>(object: T) {
    if (object instanceof Argument) {
      this.arguments.set(object.name, object);
      return true;
    }
    return false;
  }

  execute(msg: Message, ...args: any): Promise<CommandExecuteResponse> | CommandExecuteResponse {
    return msg.reply(`Hello world! Args: ${args.join(" ")}`);
  }

  enable(module: Module) {
    this.module = module;
  }

  disable() {
    this.module = undefined;
  }

  get formated() {
    let args: Array<string> = [];
    for (let arg of this.arguments.values()) {
      args.push(arg.formated);
    }
    return `${this.name} ${args.join(" ")}`;
  }

  get description() {
    if (this.options && this.options.description) {
      return this.options.description;
    }
    return "No Description Provided.";
  }
}
