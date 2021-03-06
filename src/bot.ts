import * as Discord from "discord.js";
import * as Chokidar from "chokidar";
import { resolve } from "path";
import { Module, ModuleOptions, Command, CommandOptions } from "./classes";
import { HelpCommand, EvalCommand, AboutCommand } from "./commands";

export * from "./classes";
export * from "./commands";

function superRequire(file: string) {
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } catch(err) {
    throw err;
  }
}

export interface BotOptions extends Discord.ClientOptions, ModuleOptions {
  developers?: string[];
  moduleDir?: string;
  deleteTimer?: number;
  modules?: (Module | {name: string, options: ModuleOptions})[];
  about?: string;
}

export class Bot extends Discord.Client {
  static readonly DefaultOptions: BotOptions = {
    moduleDir: "./modules",
    developers: [],
    deleteTimer: 5000,
    about: "A Discord bot made using ffg-discord-framework.",

    prefix: "!",
    embed: {},

    devOnly: false,
    guildOnly: false,
    permissions: new Discord.Permissions(0)
  }

  private _modules = new Map<string, Module>();
  watcher?: Chokidar.FSWatcher;
  _options: BotOptions;

  constructor(options?: BotOptions) {
    super(options);

    this._options = Object.assign(Bot.DefaultOptions, options);

    this.on("message", async (msg) => {
      let resp = await this.execute(msg);

      if (resp) {
        resp.delete({timeout: this._options.deleteTimer});
      }
    });

    this.on("ready", () => {
      this.addModule("core", this._options);

      if (this._options.modules) {
        for (let m of this._options.modules) {
          if (!(m instanceof Module)) {
            m = new Module(m.name, m.options);
          }
          this.add(m);
        }
      }

      if (this._options.moduleDir) {
        let modDir = this._options.moduleDir;
        let bot = this;

        if (this.watcher) {
          this.watcher.close();
        }

        this.watcher = Chokidar.watch(this._options.moduleDir, {
          ignored: /^\./,
          depth: 0,
          persistent: true,
          awaitWriteFinish: true
        });

        this.watcher.on("add", path => {
          let pathArr = path.split(/[\/\\]/gi);
          let file = pathArr[pathArr.length - 1];
          if (!file) return;
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          path = resolve(`./${path}`);
          let data = superRequire(path);
          let module;
          if (pathArr[pathArr.length - 2] == modDir.slice(2)) {
            console.log(`Loading Module "${name}" from "${path}"`);
            if (data instanceof Function) return this.add(new data());
            module = this.addModule(name, data.options);
            if (!data.initialize) return;
            data.initialize.call(module);
          } else {
            let modName = pathArr[pathArr.length - 2];
            console.log(`Loading Command "${name}" from "${path}"`);
            module = bot.modules.get(modName);
            if (!module) return console.error(`Failed to Load Command, Missing "${modName}" Module`);
            if (data instanceof Function) return this.add(new data());
            module.addCommand(name, data.options).execute = data.execute;
          }
        });

        this.watcher.on("change", path => {
          let pathArr = path.split(/[\/\\]/gi);
          let file = pathArr[pathArr.length - 1];
          if (!file) return;
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          path = resolve(`./${path}`);
          let data = superRequire(path);
          let module;
          if (pathArr[pathArr.length - 2] == modDir.slice(2)) {
            console.log(`Reloading Module "${name}" from "${path}"`);
            if (data instanceof Function) {
              let mod = new data();
              this.removeModule(mod.name);
              return this.add(mod);
            }
            this.removeModule(name);
            module = this.addModule(name, data.options);
            if (!data.initialize) return;
            data.initialize.call(module);
          } else {
            let modName = pathArr[pathArr.length - 2];
            console.log(`Reloading Command "${name}" from "${path}"`);
            module = bot.modules.get(modName);
            if (!module) return console.error(`Failed to Reload Command, Missing "${modName}" Module`);
            if (data instanceof Function) {
              let cmd = new data();
              module.removeCommand(cmd.name);
              return module.add(cmd);
            }
            module.removeCommand(name);
            module.addCommand(name, data.options).execute = data.execute;
          }
        });

        this.watcher.on("unlink", path => {
          let pathArr = path.split(/[\/\\]/gi);
          let file = pathArr[pathArr.length - 1];
          if (!file) return;
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          path = resolve(`./${path}`);
          let data = require(path);
          let module;
          if (pathArr[pathArr.length - 2] == modDir.slice(2)) {
            console.log(`Unloading Module "${name}" from "${path}"`);
            if (data instanceof Function) {
              let mod = new data();
              return this.removeModule(mod.name);;
            }
            this.removeModule(name);
          } else {
            let modName = pathArr[pathArr.length - 2];
            console.log(`Unloading Command "${name}" from "${path}"`);
            module = bot.modules.get(modName);
            if (!module) return console.error(`Failed to Reload Command, Missing "${modName}" Module`);
            if (data instanceof Function) {
              let cmd = new data();
              return module.removeCommand(cmd.name);;
            }
            module.removeCommand(name);
          }
        });

        this.watcher.on("error", err => {
          throw err;
        });

        for (let mod of this.modules.values()) {
          mod.enable(this);
        }
      }

      this.core.add(HelpCommand);
      this.core.add(EvalCommand);
      this.core.add(AboutCommand);
    });
  }

  getApp(guildId?: string) {
    // @ts-ignore Has to be ignored, because this.api is private
    const app = this.api.applications(this.user.id);
    if (guildId) {
      app.guild(guildId);
    }
    return app;
  }

  get core() {
    let core = this.modules.get("core");

    return core as Module;
  }

  get modules() {
    return this._modules;
  }

  get developers() {
    return this._options.developers ? this._options.developers : [];
  }

  fetchCommand(query: string, prefix: boolean = false): { command?: Command, module: Module } | undefined {
    let queryArr = query.split(":");
    if (queryArr.length == 2) {
      let mod = this.modules.get(queryArr[0]);
      if (!mod) return undefined;
      let cmd = mod.commands.get(queryArr[1]);
      if (!cmd) return { module: mod };
      return { command: cmd, module: mod };
    } else if (prefix) {
      let mod: Module | undefined;
      for (let m of this.modules.values()) {
        if (prefix && !query.startsWith(m.prefix)) continue;
        mod = m;
        let c = m.commands.get(query.substring(m.prefix.length));
        if (c) return { command: c, module: m };
      }
      if (mod) return { module: mod };
      return undefined;
    }
    for (let m of this.modules.values()) {
      let c = m.commands.get(query);
      if (c) return { command: c, module: m };
    }
    return undefined;
  }

  execute(msg: Discord.Message) {
    if (msg.author.bot) return;

    let args = msg.content.split(" ");
    let name = args.shift() || "";

    function sendErrors(errors: string[]) {
      return msg.reply(`The Following Error(s) Occurred:\n - ${errors.join("\n - ")}`);
    }

    let data = this.fetchCommand(name, true);
    if (!data) return;
    else if (!data.command) return sendErrors(["Command Not Found"]);
    let { command: cmd, module: mod } = data;

    let opt = (Object.assign({}, this._options, mod.options, cmd.options) as (CommandOptions & ModuleOptions));
    let errors: string[] = [];

    if (opt.devOnly && (!this._options.developers || this._options.developers.indexOf(msg.author.id) == -1)) errors.push("Developer Only");

    if (opt.guildOnly && !msg.guild) errors.push("Guild Only");

    if (msg.guild && opt.permissions && !(msg.member as Discord.GuildMember).hasPermission(opt.permissions)) errors.push("Insuffecient Permissions");

    if (errors.length > 0) return sendErrors(errors);

    return cmd.execute(msg, ...args);
  }

  add<T>(object: T): T {
    if (object instanceof Module) {
      object.enable(this);
      this.modules.set(object.name, object);
    } else {
      let core = this.modules.get("core");
      if (!core) return object;
      return core.add(object);
    }
    return object;
  }

  remove<T>(object: T): T {
    if (object instanceof Module) {
      object.bot = undefined;
      object.disable();
      this.modules.delete(object.name);
    }
    return object;
  }

  addModule(name: string, option: ModuleOptions) {
    let module = new Module(name, option);
    return this.add(module);
  }

  removeModule(name: string) {
    let module = this.modules.get(name);
    if (!module) return;
    return this.remove(module);
  }

  login(token?: string): Promise<string> {
    return super.login(token);
  }
}
