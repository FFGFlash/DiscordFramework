import { Bot } from "../bot";

export interface HandlerOptions {
  once?: boolean;
}

interface _HandlerOptions extends HandlerOptions {
  once: boolean;
}

export abstract class Handler {
  private _name: string;
  private _event: string;
  private _options: _HandlerOptions;

  bot!: Bot;
  data: {[key: string]: any} = {};

  static readonly DefaultOptions: _HandlerOptions = {
    once: false
  };

  constructor(name: string, event: string, options?: HandlerOptions) {
    this._name = name;
    this._event = event;
    this._options = Object.assign({}, Handler.DefaultOptions, options);
  }

  connect(bot: Bot) {
    this.bot = bot;
    this.bot.handlers.set(this.name, this);
    this.bot[this.once ? "once" : "on"](this.event, (...args) => this.call(...args));
  }

  disconnect() {
    this.bot.handlers.delete(this.name);
    this.bot.removeListener(this.event, this.call);
  }

  get name() {
    return this._name;
  }

  get event() {
    return this._event;
  }

  get once() {
    return this._options.once;
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

  get createEmbed() {
    return this.bot.createEmbed.bind(this.bot);
  }

  abstract call(...args: any[]): void;
}

export class GenericHandler extends Handler {
  call(...args: any[]) {
    this.log(`Event: ${this.event} Arguments:\n`, ...args);
  }
}
