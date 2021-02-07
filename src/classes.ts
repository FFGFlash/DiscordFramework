import * as Types from "./interfaces";
import * as Discord from "discord.js";
import { Bot } from "./index";

import * as Mysql_ from "mysql";
import * as JsonDBConfig from "node-json-db/dist/lib/JsonDBConfig";

let Mysql: any = undefined;
let Sqlite: any = undefined;
let JsonDB: any = undefined;
let Sheet: any = undefined;
try { Mysql = require("mysql"); } catch(err) {}
try { Sqlite = require("sqlite3"); } catch(err) {}
try { JsonDB = require("node-json-db"); } catch(err) {}
try { Sheet = require("google-spreadsheet"); } catch(err) {}

export class Database {
  name: string;
  connection: Types.database;

  constructor(name: string, connection: Types.database) {
    this.name = name;
    this.connection = connection;
  }

  static JsonDB(name: string, options: string | JsonDBConfig.JsonDBConfig) {
    if (!JsonDB) throw new Error("Missing 'node-json-db' optional dependency.");
    let config = typeof(options) == "object"
    let filename = config ? (options as JsonDBConfig.JsonDBConfig).filename : (options as string);
    let saveOnPush = config ? (options as JsonDBConfig.JsonDBConfig).saveOnPush : undefined;
    let humanReadable = config ? (options as JsonDBConfig.JsonDBConfig).humanReadable : undefined;
    let separator = config ? (options as JsonDBConfig.JsonDBConfig).separator : undefined;
    return new Database(name, new JsonDB.JsonDB(filename, saveOnPush, humanReadable, separator));
  }

  static async SheetDB(name: string, options: Types.SheetDBConfig) {
    if (!Sheet) throw new Error("Missing 'google-spreadsheet' optional dependency.");
    let doc = new Sheet.GoogleSpreadsheet(options.id);
    if (options.creds) {
      await doc.useServiceAccountAuth(options.creds);
    } else if (options.key) {
      await doc.useApiKey(options.key);
    } else throw new Error("Either provide an API Key or Credentials for SheetDB.");
    if (options.populate)
      await doc.loadInfo();
    return new Database(name, doc);
  }

  static MysqlDB(name: string, options: string | Mysql_.ConnectionConfig) {
    if (!Mysql) throw new Error("Missing 'mysql' optional dependency.");
    return new Database(name, Mysql.createConnection(options));
  }

  static MysqlPoolDB(name: string, options: string | Mysql_.PoolConfig) {
    if (!Mysql) throw new Error("Missing 'mysql' optional dependency.");
    return new Database(name, Mysql.createPool(options));
  }

  static SqliteDB(name: string, options: string | Types.SqliteConfig) {
    if (!Sqlite) throw new Error("Missing 'sqlite3' optional dependency.");
    let config = typeof(options) == "object";
    let filename = config ? (options as Types.SqliteConfig).filename : (options as string);
    let mode = config ? (options as Types.SqliteConfig).mode : undefined;
    let callback = config ? (options as Types.SqliteConfig).callback : undefined;
    return new Database(name, new Sqlite.Database(filename, mode, callback));
  }
}

export class Command {
  private static DefaultOptions: Types.CommandOptions = {
    description: "No Description Provided.",
    channels: "any",
    permissions: new Discord.Permissions(0),
    botOwnerOnly: false
  };
  private execute: (msg: Discord.Message, ...args: any[]) => Promise<Types.commandResponse> | Types.commandResponse;
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

  addArgument(name: string, options?: Types.ArgumentOptions): Argument {
    return this.add(new Argument(name, options));
  }

  addPermission(permissionResolvable: Discord.PermissionResolvable) {
    return this.add(new Discord.Permissions(permissionResolvable));
  }

  removePermission(permissionResolvable: Discord.PermissionResolvable) {
    return this.remove(new Discord.Permissions(permissionResolvable));
  }

  add<T>(component: T): T {
    if (component instanceof Argument) {
      this.arguments.push(component);
    } else if (component instanceof Discord.Permissions) {
      this.permissions.add(component);
    }
    return component;
  }

  remove<T>(component: T): T {
    if (component instanceof Discord.Permissions) {
      this.permissions.remove(component);
    }
    return component;
  }

  set run(execute: (msg: Discord.Message, ...args: any[]) => Types.commandResponse | Promise<Types.commandResponse>) {
    this.execute = execute;
  }

  get run(): (msg: Discord.Message, ...args: any[]) => Promise<Types.commandResponse> | Types.commandResponse {
    return (msg: Discord.Message, ...args: any[]): Promise<Types.commandResponse> | Types.commandResponse => {
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
