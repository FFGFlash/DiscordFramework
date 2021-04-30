import { Command, CommandOptions } from "./command";
import * as Chokidar from "chokidar";
import { resolve } from "path";
import { Bot } from "../bot";
import { Message } from "discord.js";

function superRequire(file: string) {
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } catch(err) {
    throw err;
  }
}

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
  watcher: Chokidar.FSWatcher;

  constructor(name: string, options? : ModuleOptions) {
    this.name = name;
    this.options = options;

    let watch = Chokidar.watch(`./modules/${name}`, {
      ignored: /^\./,
      depth: 0,
      persistent: true,
      awaitWriteFinish: true
    });

    watch.on("add", path => {
      let file = path.split("\\").pop();
      if (!file) return;
      let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
      path = resolve(`./${path}`);
      console.log(`Loading Command "${name}" from "${path}"`);
      let data = superRequire(path);
      this.addCommand(name, data.options).execute = data.execute;
    });

    watch.on("change", path => {
      let file = path.split("\\").pop();
      if (!file) return;
      let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
      path = resolve(`./${path}`);
      console.log(`Reloading Command "${name}" from "${path}"`);
      let data = superRequire(path);
      this.removeCommand(name);
      this.addCommand(name, data.options).execute = data.execute;
    });

    watch.on("unlink", path => {
      let file = path.split("\\").pop();
      if (!file) return;
      let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
      path = resolve(`./${path}`);
      console.log(`Reloading Command "${name}" from "${path}"`);
      this.removeCommand(name);
    });

    watch.on("error", err => {
      throw err;
    });

    this.watcher = watch;

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
