import * as Discord from "discord.js";
import * as Chokidar from "chokidar";
import { resolve } from "path";
import { Module, ModuleOptions, Command, CommandOptions } from "./classes";

export * from "./classes";

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
  modules?: (Module | {name: string, options: ModuleOptions})[];
}

export class Bot extends Discord.Client {
  static readonly DefaultOptions: BotOptions = {
    developers: [],

    prefix: "!",

    devOnly: false,
    guildOnly: false,
    permissions: new Discord.Permissions(0)
  }

  private modules = new Map<string, Module>();
  _options: BotOptions;

  constructor(options?: BotOptions) {
    super(options);

    this._options = Object.assign(Bot.DefaultOptions, options);

    let core = new Module("core", this._options);

    this.add(core);

    if (this._options.modules) {
      for (let m of this._options.modules) {
        if (!(m instanceof Module)) {
          m = new Module(m.name, m.options);
        }
        this.add(m);
      }
    }

    this.on("message", async (msg) => {
      let resp = await this.execute(msg);

      if (resp) {
        resp.delete({timeout: 5000});
      }
    });

    this.on("ready", () => {

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

  execute(msg: Discord.Message) {
    if (msg.author.bot) return;

    let args = msg.content.split(" ");
    let name = args.shift() || "";

    let mod: Module | undefined;
    let cmd: Command | undefined;

    for (let m of this.modules.values()) {
      let prefix = m.getPrefix();
      if (!msg.content.startsWith(prefix)) continue;

      mod = m;
      cmd = m.commands.get(name.substring(prefix.length));

      if (cmd) break;
    }

    function sendErrors(errors: string[]) {
      return msg.reply(`The Following Error(s) Occurred:\n - ${errors.join("\n - ")}`);
    }

    if (!mod && !cmd) return;
    else if (!mod || !cmd) return sendErrors(["Command Not Found"]);

    let opt = (Object.assign({}, this._options, mod.options, cmd.options) as (CommandOptions & ModuleOptions));
    let errors: string[] = [];

    if (opt.devOnly && (!this._options.developers || this._options.developers.indexOf(msg.author.id) == -1)) errors.push("Developer Only");

    if (opt.guildOnly && !msg.guild) errors.push("Guild Only");

    if (msg.guild && opt.permissions && !(msg.member as Discord.GuildMember).hasPermission(opt.permissions)) errors.push("Insuffecient Permissions");

    if (errors.length > 0) return sendErrors(errors);

    return cmd.execute.call(mod, msg, ...args);
  }

  add<T>(object: T): T {
    if (object instanceof Module) {
      object.bot = this;
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
    let watch = Chokidar.watch("./modules", {
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
      console.log(`Loading Module "${name}" from "${path}"`);
      let data = superRequire(path);
      let module = this.addModule(name, data.options);
      if (!data.initialize) return;
      data.initialize.call(module);
    });

    watch.on("change", path => {
      let file = path.split("\\").pop();
      if (!file) return;
      let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
      path = resolve(`./${path}`);
      console.log(`Reloading Module "${name}" from "${path}"`);
      let data = superRequire(path);
      this.removeModule(name);
      let module = this.addModule(name, data.options);
      if (!data.initialize) return;
      data.initialize.call(module);
    });

    watch.on("unlink", path => {
      let file = path.split("\\").pop();
      if (!file) return;
      let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
      path = resolve(`./${path}`);
      console.log(`Reloading Module "${name}" from "${path}"`);
      this.removeModule(name);
    });

    watch.on("error", err => {
      throw err;
    });

    return super.login(token);
  }
}
