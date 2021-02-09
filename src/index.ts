import * as Discord from "discord.js";
import * as FileSystem from "fs";
import { resolve } from "path";
import * as Types from "./interfaces";
import * as Classes from "./classes";
import * as Util from "util";

import * as Mysql from "mysql";
import * as JsonDBConfig from "node-json-db/dist/lib/JsonDBConfig";

import * as Chokidar_ from "chokidar";
import PastebinAPI_ from "pastebin-ts/dist/api";
import { IPastebinOptions } from "pastebin-ts/dist/interfaces";
import Fetch from "node-fetch";

let Chokidar: any = undefined;
let PastebinAPI: any = undefined;
try { Chokidar = require("chokidar"); } catch(err) {}
try { PastebinAPI = require("pastebin-ts/dist/api").PastebinAPI; } catch(err) {}

export * from "./interfaces";
export * from "./classes";

function superRequire(file: string): any {
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } catch(err) {
    throw err;
  }
}

export class Bot extends Discord.Client {
  private static DefaultOptions: Types.ClientOptions = {
    cmdDir: "./commands",
    loadCmdDir: true,
    prefix: "!",
    deleteTimer: 5,
    disabledCommands: []
  };

  private fetchPrefix: (guild?: Discord.Guild | null) => string;
  private fetchDisabledCommands: (guild?: Discord.Guild | null) => string[];

  commands: Discord.Collection<string, Classes.Command>;
  databases: Discord.Collection<string, Classes.Database>;
  cmdDir: string;
  loadCmdDir: boolean;
  prefix: string;
  deleteTimer: number;
  owners?: Discord.Snowflake[];
  pastebin?: PastebinAPI_.PastebinAPI;
  disabledCommands: string[];
  embed?: Discord.MessageEmbed | Discord.MessageEmbedOptions;

  constructor(options?: Types.ClientOptions) {
    super(options);
    this.commands = new Discord.Collection();
    this.databases = new Discord.Collection();
    this.cmdDir = options && options.cmdDir ? options.cmdDir : Bot.DefaultOptions.cmdDir as string;
    this.loadCmdDir = options && options.loadCmdDir ? options.loadCmdDir : Bot.DefaultOptions.loadCmdDir as boolean;
    this.prefix = options && options.prefix ? options.prefix : Bot.DefaultOptions.prefix as string;
    this.deleteTimer = options && options.deleteTimer ? options.deleteTimer : Bot.DefaultOptions.deleteTimer as number;
    this.owners = options && options.owners ? options.owners : Bot.DefaultOptions.owners
    this.embed = options && options.embed ? options.embed : Bot.DefaultOptions.embed;
    this.disabledCommands = options && options.disabledCommands ? options.disabledCommands : Bot.DefaultOptions.disabledCommands as string[];
    this.fetchPrefix = () => this.prefix;
    this.fetchDisabledCommands = () => this.disabledCommands;

    this.addCommand("help", {
      description: "Displays all commands.",
      arguments: [
        {name: "page | command", options: {optional: true, description: "Display a certain help page or get help for a specific command."}}
      ]
    }).run = function(this: Bot, msg, p = "1") {
      if (!this.user) return;
      let prefix = this.getPrefix(msg.guild);
      let embed = this.createEmbed().setDescription("<> - required [] - optional").setTimestamp(new Date()).setAuthor(this.user.username, this.user.displayAvatarURL());
      p = p.toLowerCase();
      let commandHelp = isNaN(p);
      if (commandHelp) {
        let cmd = this.commands.get(p);
        if (!cmd) return msg.reply(`Couldn't find the command provided. '${p}'`);
        for (let arg of cmd.arguments) {
          embed.addField(arg.toString(), arg.description, true);
        }
        msg.reply(embed.setTitle(`${prefix}${cmd.toString()}`).setDescription(cmd.description));
        return;
      }
      p = parseInt(p);
      let maxPage = Math.ceil(this.commands.size / 20);
      if (p > maxPage) p = maxPage;
      else if (p < 1) p = 1;
      embed.setTitle(`**Help** (Page ${p}/${maxPage})`)
      p -= 1;

      let cmds = [...this.commands.values()].slice(p * 20, (p + 1) * 20);

      for (let cmd of cmds) {
        embed.addField(`${prefix}${cmd.toString()}`, cmd.description);
      }

      msg.reply(embed);
    }

    this.addCommand("command", {
      botOwnerOnly: true,
      description: "Handles command manipulation.",
      arguments: [
        {name: "load | unload | disable | enable | reload", options: {optional: false, description: "The action to perform."}},
        {name: "name", options: {optional: true, description: "The name of the command."}},
        {name: "pastebin", options: {optional: true, description: "Pastebin id."}}
      ]
    }).run = function(this: Bot, msg, action, name, pastebin) {
      action = action.toLowerCase();
      if (name) name = name.toLowerCase();
      if (action == "load") {
        let path = resolve(this.cmdDir, `${name}.js`);
        let done = () => {
          if (!Chokidar) {
            console.log(`Loading Command "${name}" from "${path}"`);
            let data = superRequire(path);
            this.addCommand(name, data.descriptor).run = data.execute;
          }
          msg.reply(`Command '${name}' loaded.`);
        }
        if (pastebin) {
          if (!PastebinAPI) return msg.reply("Sorry I'm missing the 'PastebinAPI' module.");
          if (!this.pastebin) return msg.reply("Sorry I haven't been given a 'PastebinAPI' dev key.");
          this.pastebin.getPaste(pastebin).then(data => {
            FileSystem.writeFile(path, data, "utf8", (err) => {
              if (err) throw err;
              done();
            });
          });
          return;
        }
        let file = msg.attachments.first();
        if (!file) return msg.reply("No File Provided.");
        if (!file.name) return msg.reply("Missing File Name.");
        if (!name) name = file.name.toLowerCase();
        path = resolve(this.cmdDir, `${name}.js`);
        let ext = name.replace(/(.*\/)?(\..*?|.*?)(\.[^.]*?)?(#.*$|\?.*$|$)/gim, "$3");
        if ([".js"].indexOf(ext) == -1) return msg.reply("Unsupported file extension.");
        Fetch(file.url).then(res => res.text()).then(data => {
          if (ext == ".js") {
            FileSystem.writeFile(path, data, "utf8", (err) => {
              if (err) throw err;
              done();
            });
          }
        });
      } else if (action == "unload") {
        if (!name) return msg.reply("This action requires a name.");
        let command = this.getCommand(name.toLowerCase());
        if (!command) return msg.reply("Couldn't find the command provided.");
        let path = resolve(this.cmdDir, `${command.name}.js`);
        if (FileSystem.existsSync(path)) {
          FileSystem.unlink(path, err => {
            if (err) throw err;
            if (!Chokidar) {
              this.removeCommand(name);
            }
          });
        } else {
          this.removeCommand(name);
        }
        msg.reply(`Command '${name}' unloaded.`);
      } else if (action == "disable") {
        if (!name) return msg.reply("This action requires a name.");
        if (this.disabledCommands.indexOf(name) != -1) return msg.reply("The command provided is already disabled.");
        this.disabledCommands.push(name);
        msg.reply(`Command '${name}' disabled.`);
      } else if (action == "enable") {
        if (!name) return msg.reply("This action requires a name.");
        let index = this.disabledCommands.indexOf(name);
        if (index == -1) return msg.reply("The command provided is already enabled.");
        delete this.disabledCommands[index];
        msg.reply(`Command '${name}' enabled.`);
      } else if (action == "reload") {
        if (!name) return msg.reply("This action requires a name.");
        let command = this.getCommand(name);
        if (!command) return msg.reply("Couldn't find the command provided.");
        let path = resolve(this.cmdDir, `${name}.js`);
        console.log(`Reloading Command "${name}" from "${path}"`);
        let data = superRequire(path);
        this.addCommand(name, data.descriptor).run = data.execute;
        msg.reply(`Command '${name}' reloaded.`)
      }
    };

    this.addCommand("eval", {
      botOwnerOnly: true,
      description: "Evaluates raw javascript.",
      arguments: [
        {name: "code", options: {optional: false, description: "The code to evaluate"}}
      ]
    }).run = function(this: Bot, msg, ...codeArray) {
      let code = codeArray.join(" ");
      let res;
      try {
        res = eval(code);
      } catch(err) {
        res = `${err.name}: ${err.message}`;
      }
      let sendOutput = (res: any) => {
        let output = Util.inspect(res);
        if (output.length > 2000) {
          let name = `eval_response_${new Date().toUTCString()}`.replace(/[^A-Z0-9]/gi, "_");
          let file = `./${name}.txt`;
          FileSystem.writeFile(file, output, "utf8", async (err) => {
            if (err) throw err;
            let url;
            if (this.pastebin) {
              try {
                url = await this.pastebin.createPasteFromFile({
                  file: file,
                  title: name,
                  privacy: 1,
                  expiration: "1H"
                });
              } catch(err) {
                console.warn(err);
              }
            }
            msg.reply(`\`\`\`\nResponse exceeds discord limit of 2000 characters.\`\`\`${url ? `\n**Pastebin:** ${url}` : ""}`, {
              files: [
                file
              ]
            }).then(() => {
              FileSystem.unlink(file, (err) => {
                if (err) throw err;
              });
            });
            console.log(output);
          });
        } else {
          msg.reply(`\`\`\`\n${output}\`\`\``);
        }
        if (!!res && typeof res.then == "function") {
          res.then((res: any) => {
            sendOutput(res);
          });
        }
      }
      sendOutput(res);
    };

    this.on("ready", async () => {
      console.log(`Logged in as ${(this.user as Discord.ClientUser).tag}.`);
    });

    this.on("message", async msg => {
      if (msg.author.bot) return;
      let content = msg.content;
      let args = content.split(" ");
      let cmd = (args.shift() as string).toLowerCase();

      let prefix = this.getPrefix(msg.guild);
      let disabledCommands = this.getDisabledCommands(msg.guild);

      if (!cmd.startsWith(prefix)) return;

      let response = await (async () => {
        let command = this.commands.get(cmd.substring(prefix.length));

        if (!command) return msg.reply("No Command Found.");
        if (disabledCommands.indexOf(command.name) != -1) return msg.reply("The provided command has been disabled.");

        return await command.run(msg, ...args);
      })();

      if (response) {
        setTimeout(() => {
          (response as Discord.Message).delete();
        }, this.deleteTimer * 1000);
      }
    });
  }

  set getPrefix(getPrefix: (guild?: Discord.Guild | null) => string) {
    this.fetchPrefix = getPrefix;
  }

  get getPrefix() {
    return this.fetchPrefix;
  }

  set getDisabledCommands(getDisabledCommands: (guild?: Discord.Guild | null) => string[]) {
    this.fetchDisabledCommands = getDisabledCommands;
  }

  get getDisabledCommands() {
    return this.fetchDisabledCommands;
  }

  createEmbed(options?: Discord.MessageEmbed | Discord.MessageEmbedOptions) {
    let opt: Discord.MessageEmbed | Discord.MessageEmbedOptions = {};
    if (this.embed && options) {
      opt = {...this.embed, ...options} as Discord.MessageEmbedOptions;
    } else if (this.embed) {
      opt = this.embed;
    } else if (options) {
      opt = options;
    }
    return new Discord.MessageEmbed(opt);
  }

  addPastebinAPI(options?: string | IPastebinOptions) {
    if (!PastebinAPI) throw new Error("Missing 'pastebin-ts' optional dependency.");
    return this.add(new PastebinAPI(options));
  }

  addCommand(name: string, options?: Types.CommandOptions) {
    return this.add(new Classes.Command(this, name, options));
  }

  getCommand(name: string) {
    return this.commands.get(name);
  }

  removeCommand(name: string | Classes.Command) {
    if (name instanceof Classes.Command) {
      return this.remove(name);
    }
    let command = this.commands.get(name);
    return this.remove(command);
  }

  addArgument(command: string | Classes.Command, name: string, options?: Types.ArgumentOptions) {
    if (typeof(command) == "string") {
      let _command = this.commands.get(command);
      if (!_command) {
        throw new Error(`Couldn't find the command '${command}'`);
      }
      command = _command;
    }

    if (command instanceof Classes.Command) {
      command.addArgument(name, options);
      return command;
    } else {
      throw new Error(`Something has gone wrong.`);
    }
  }

  addMysqlPoolDB(name: string, options: string | Mysql.PoolConfig) {
    return this.add(Classes.Database.MysqlPoolDB(name, options));
  }

  addMysqlDB(name: string, options: string | Mysql.ConnectionConfig) {
    return this.add(Classes.Database.MysqlDB(name, options));
  }

  addJsonDB(name: string, options: string | JsonDBConfig.JsonDBConfig) {
    return this.add(Classes.Database.JsonDB(name, options));
  }

  addSqliteDB(name: string, options: string | Types.SqliteConfig) {
    return this.add(Classes.Database.SqliteDB(name, options));
  }

  async addSheetDB(name: string, options: Types.SheetDBConfig) {
    return this.add(await Classes.Database.SheetDB(name, options));
  }

  getDB(name: string) {
    let database = this.databases.get(name);
    if (!database) throw new Error("Failed to find requested database.");
    return database.connection;
  }

  add<T>(component: T): T {
    if (component instanceof Classes.Command) {
      this.commands.set(component.name.toLowerCase(), component);
    } else if (component instanceof Classes.Database) {
      this.databases.set(component.name, component);
    } else if (component instanceof PastebinAPI) {
      this.pastebin = (component as unknown as PastebinAPI_.PastebinAPI);
    }
    return component;
  }

  remove<T>(component: T): T {
    if (component instanceof Classes.Command) {
      this.commands.delete(component.name);
    } else if (component instanceof Classes.Database) {
      this.databases.delete(component.name);
    }
    return component;
  }

  login(token?: string): Promise<string> {
    if (this.loadCmdDir) {
      let cmdDirExists = FileSystem.existsSync(this.cmdDir);
      if (!cmdDirExists) {
        FileSystem.mkdirSync(this.cmdDir);
      }
      if (!Chokidar) {
        let files = FileSystem.readdirSync(this.cmdDir);
        for (let file of files) {
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          let path = resolve(this.cmdDir, file);
          console.log(`Loading Command "${name}" from "${path}"`);
          let data = require(path);
          this.addCommand(name, data.descriptor).run = data.execute;
        }
      } else {
        let watch: Chokidar_.FSWatcher = Chokidar.watch(this.cmdDir, {
          ignored: /^\./,
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
          this.addCommand(name, data.descriptor).run = data.execute;
        });

        watch.on("change", path => {
          let file = path.split("\\").pop();
          if (!file) return;
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          path = resolve(`./${path}`);
          console.log(`Reloading Command "${name}" from "${path}"`);
          let data = superRequire(path);
          this.removeCommand(name);
          this.addCommand(name, data.descriptor).run = data.execute;
        });

        watch.on("unlink", path => {
          let file = path.split("\\").pop();
          if (!file) return;
          let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
          path = resolve(`./${path}`);
          console.log(`Removing Command "${name}" from "${path}"`);
          this.removeCommand(name);
        });

        watch.on("error", err => {
          throw err;
        });
      }
    }
    return super.login(token);
  }
}
