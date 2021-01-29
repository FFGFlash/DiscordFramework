import * as Discord from "discord.js";
import * as Classes from "./classes";

import * as Mysql from "mysql";
import * as JsonDB from "node-json-db";
import * as Sqlite from "sqlite3";

export type channel = 'any' | 'guild' | 'dm';
export type component = Classes.Argument;
export type database = Mysql.Connection | Mysql.Pool | JsonDB.JsonDB | Sqlite.Database;
export type commandResponse = Promise<Discord.Message | undefined> | undefined | void;

export interface CommandOptions {
  description?: string;
  channels?: channel;
  arguments?: Classes.Argument[] | {name: string, options?: ArgumentOptions}[]
  permissions?: Discord.Permissions;
  botOwnerOnly?: boolean;
}

export interface SqliteConfig {
  filename: string;
  mode?: number;
  callback?: (err: Error | null) => void;
}

export interface ArgumentOptions {
  description?: string;
  optional?: boolean;
}

export interface ClientOptions extends Discord.ClientOptions {
  cmdDir?: string;
  loadCmdDir?: boolean;
  prefix?: string;
  deleteTimer?: number;
  owners?: Discord.Snowflake[]
}
