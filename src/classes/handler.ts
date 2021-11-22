import { Bot, Events } from "../bot";

export interface HandlerOptions {
  once?: boolean;
}

interface _HandlerOptions extends HandlerOptions {
  once: boolean;
}

export abstract class Handler<T extends keyof Events> {
  private _name: string;
  private _event: T;
  private _options: _HandlerOptions;
  private _bindedCall!: (...args: Events[T]) => any;

  bot!: Bot;
  data: {[key: string]: any} = {};

  static readonly DefaultOptions: _HandlerOptions = {
    once: false
  };

  constructor(name: string, event: T, options?: HandlerOptions) {
    this._name = name;
    this._event = event;
    this._options = Object.assign({}, Handler.DefaultOptions, options);
  }

  connect(bot: Bot) {
    this.bot = bot;
    this.bot.handlers.set(this.name, this);
    this.bot[this.once ? "once" : "on"]<T>(this.event, this.bindedCall);
  }

  disconnect() {
    this.bot.handlers.delete(this.name);
    this.bot.removeListener(this.event, this.bindedCall);
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

  private get bindedCall() {
    // @ts-ignore
    if (!this._bindedCall) this._bindedCall = this.call.bind(this);
    return this._bindedCall;
  }

  abstract call(this: Handler<T>, ...args: Events[T]): void;
}

export abstract class CoreHandler<T extends keyof Events> extends Handler<T> {
  constructor(coreName: string, event: T, name?: string, options?: HandlerOptions) {
    super(name || coreName, event, options);
  }
}

export class GenericHandler<T extends keyof Events> extends Handler<T> {
  call(...args: Events[T]) {
    this.log(`Event: ${this.event} Arguments:\n`, ...args);
  }
}
