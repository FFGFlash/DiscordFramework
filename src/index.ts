import * as Discord from "discord.js";
import * as FileSystem from "fs";
import { resolve } from "path";
import * as Types from "./interfaces";
import * as Classes from "./classes";

import * as Mysql from "mysql";
import * as JsonDB from "node-json-db";
import * as JsonDBConfig from "node-json-db/dist/lib/JsonDBConfig";

export * from "./interfaces";
export * from "./classes";

export class Bot extends Discord.Client {
  private static DefaultOptions: Types.ClientOptions = {
    cmdDir: "./commands",
    loadCmdDir: true,
    prefix: "!",
    deleteTimer: 5
  };

  private fetchPrefix: (guild?: Discord.Guild | null) => string;

  commands: Discord.Collection<string, Classes.Command>;
  cmdDir: string;
  loadCmdDir: boolean;
  prefix: string;
  deleteTimer: number;
  db?: JsonDB.JsonDB | Mysql.Pool | Mysql.Connection;
  owners?: Discord.Snowflake[];

  constructor(options?: Types.ClientOptions) {
    super(options);
    this.commands = new Discord.Collection();
    this.cmdDir = options && options.cmdDir ? options.cmdDir : Bot.DefaultOptions.cmdDir as string;
    this.loadCmdDir = options && options.loadCmdDir ? options.loadCmdDir : Bot.DefaultOptions.loadCmdDir as boolean;
    this.prefix = options && options.prefix ? options.prefix : Bot.DefaultOptions.prefix as string;
    this.deleteTimer = options && options.deleteTimer ? options.deleteTimer : Bot.DefaultOptions.deleteTimer as number;
    this.owners = options && options.owners ? options.owners : Bot.DefaultOptions.owners
    this.fetchPrefix = () => this.prefix;

    this.on("ready", async () => {
      console.log(`Logged in as ${(this.user as Discord.ClientUser).tag}.`);
    });

    this.on("message", async msg => {
      if (msg.author.bot) return;
      let content = msg.content;
      let args = content.split(" ");
      let cmd = (args.shift() as string).toLowerCase();

      let prefix = this.getPrefix(msg.guild)

      if (!cmd.startsWith(prefix)) return;

      let response = await (() => {
        let command = this.commands.get(cmd.substring(prefix.length));

        if (!command) return msg.reply("No Command Found.");

        return command.run(msg, ...args);
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

  addCommand(name: string, options?: Types.CommandOptions) {
    let command = new Classes.Command(this, name, options);
    this.commands.set(name, command);
    console.log(name, command);
    return command;
  }

  createMysqlPoolDB(options: string | Mysql.PoolConfig) {
    if (!Mysql) throw new Error("Missing 'mysql' optional dependency for this feature.");
    this.db = Mysql.createPool(options);
    return this.db;
  }

  createMysqlDB(options: string | Mysql.ConnectionConfig) {
    if (!Mysql) throw new Error("Missing 'mysql' optional dependency for this feature.");
    this.db = Mysql.createConnection(options);
    return this.db;
  }

  createJsonDB(filename: string | JsonDBConfig.Config, saveOnPush?: boolean, humanReadable?: boolean, seperator?: string) {
    if (!JsonDB) throw new Error("Missing 'mysql' optional dependency for this feature.");
    this.db = new JsonDB.JsonDB(filename, saveOnPush, humanReadable, seperator);
    return this.db;
  }

  login(token?: string): Promise<string> {
    if (this.loadCmdDir) {
      let cmdDirExists = FileSystem.existsSync(this.cmdDir);
      if (!cmdDirExists) {
        FileSystem.mkdirSync(this.cmdDir);
      }
      let files = FileSystem.readdirSync(this.cmdDir);
      for (let file of files) {
        let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
        let path = resolve(this.cmdDir, file);
        console.log(`Loading Command "${name}" from "${path}"`);
        let data = require(path);
        this.addCommand(name, data.descriptor).run = data.execute;
      }
    }
    return super.login(token);
  }
}
