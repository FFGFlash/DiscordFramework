import { Sequelize, Options as DatabaseOptions } from "sequelize";
import { Bot } from "../bot";

export { DatabaseOptions };

export class Database extends Sequelize {
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
  }

  disconnect() {
    this.bot.databases.delete(this.name);
  }
}
