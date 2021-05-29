import { Client, ClientOptions, Guild, MessageEmbed, MessageEmbedOptions } from "discord.js";
import Winston from "winston";

import { Handler, GenericHandler, HandlerOptions, Command, GenericCommand, CommandOptions, Database, DatabaseOptions } from "./classes";
import * as Handlers from "./handlers";
import * as Commands from "./commands";

export * from "./classes";
export * from "./handlers";
export * from "./commands";

export interface BotOptions {
  prefix?: string;
  developers?: Array<string>;
  deleteTimer?: number;
  embed?: MessageEmbed | MessageEmbedOptions | ((this: Bot) => MessageEmbed | MessageEmbedOptions);
  description?: string;
  root?: string;
}

interface _BotOptions extends BotOptions {
  prefix: string;
  developers: Array<string>;
  deleteTimer: number;
  embed: MessageEmbed | MessageEmbedOptions | ((this: Bot) => MessageEmbed | MessageEmbedOptions);
  description: string;
  root: string;
}

export class Bot extends Client {
  public handlers: Map<string, Handler> = new Map();
  public commands: Map<string, Command> = new Map();
  public databases: Map<string, Database> = new Map();

  private _options: _BotOptions;

  logger: Winston.Logger = Winston.createLogger({
    level: "info",
    format: Winston.format.json(),
    defaultMeta: { service: "discord-bot" },
    transports: [
      new Winston.transports.File({ filename: "latest.log" })
    ]
  });

  data: {[key: string]: any} = {};

  static readonly DefaultOptions: _BotOptions = {
    prefix: "!",
    description: "No Description Provided.",
    developers: [],
    deleteTimer: 5000,
    root: ".",
    embed: function(this: Bot) {
      if (!this.user) return {};
      return {
        author: {
          name: this.user.username,
          iconURL: this.user.avatarURL() || ""
        },
        timestamp: new Date()
      };
    }
  };

  constructor(options?: BotOptions, client_options?: ClientOptions) {
    super(client_options);
    this._options = Object.assign({}, Bot.DefaultOptions, options);

    if (process.env.NODE_ENV !== "production") {
      this.logger.add(new Winston.transports.Console({
        format: Winston.format.simple()
      }));
    }

    for (let handler of Object.values(Handlers)) {
      this.add(new handler());
    }
    for (let command of Object.values(Commands)) {
      this.add(new command());
    }

    this.emit("load");
  }

  prefix(guild?: Guild | null) {
    if (guild) {
      // TODO: Get Guild Prefix.
    }
    return this._options.prefix;
  }

  get developers() {
    return this._options.developers;
  }

  get deleteTimer() {
    return this._options.deleteTimer;
  }

  get description() {
    return this._options.description;
  }

  get root() {
    return this._options.root;
  }

  get log() {
    return this.logger.info.bind(this.logger);
  }

  get error() {
    return this.logger.error.bind(this.logger);
  }

  get warn() {
    return this.logger.warn.bind(this.logger);
  }

  createEmbed(data?: MessageEmbed | MessageEmbedOptions) {
    return new MessageEmbed(Object.assign(
      {},
      typeof this._options.embed == "function" ? this._options.embed.call(this) : this._options.embed,
      data
    ));
  }

  add<T>(object: T): T {
    if (object instanceof Command || object instanceof Handler || object instanceof Database) {
      object.connect(this);
    }

    return object;
  }

  remove<T>(object: T): T {
    if (object instanceof Command || object instanceof Handler || object instanceof Database) {
      object.disconnect();
    }

    return object;
  }

  addHandler(name: string, event: string, options?: HandlerOptions) {
    return this.add(new GenericHandler(name, event, options));
  }

  removeHandler(name: string) {
    return this.remove(this.handlers.get(name));
  }

  addCommand(name: string, options?: CommandOptions) {
    return this.add(new GenericCommand(name, options));
  }

  removeCommand(name: string) {
    return this.remove(this.commands.get(name));
  }

  addDatabase(name: string, uri: string): Database;
  addDatabase(name: string, options: DatabaseOptions): Database;
  addDatabase(name: string, db: string, username: string, password?: string, options?: DatabaseOptions): Database;
  addDatabase(name: string, ...args: any[]) {
    return this.add(new Database(name, args[0], args[1], args[2], args[3]));
  }

  removeDatabase(name: string) {
    return this.remove(this.databases.get(name));
  }
}
