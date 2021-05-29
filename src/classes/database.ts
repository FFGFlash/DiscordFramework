import { Sequelize, Options as DatabaseOptions } from "sequelize";
import { Bot } from "../bot";

export { DatabaseOptions };

export abstract class Database extends Sequelize {
  name: string;
  bot!: Bot;

  constructor(name: string, uri: string);
  constructor(name: string, options: DatabaseOptions);
  constructor(name: string, db: string, username: string, password?: string, options?: DatabaseOptions);
  constructor(name: string, ...args: any[]) {
    super(...args);
    this.name = name;
  }

  connect(bot: Bot) {
    this.bot = bot;
    this.bot.databases.set(this.name, this);
    this.build();
  }

  disconnect() {
    this.bot.databases.delete(this.name);
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

  abstract build(): void;
}

export class GenericDatabase extends Database {
  build() {}
}
