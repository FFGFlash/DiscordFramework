import * as Discord from "discord.js";
import * as Classes from "./classes";

export type channel = 'any' | 'guild' | 'dm';

export interface CommandOptions {
  description?: string;
  channels?: channel;
  arguments?: Classes.Argument[] | {name: string, options?: ArgumentOptions}[]
  permissions?: Discord.Permissions;
  botOwnerOnly?: boolean;
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
