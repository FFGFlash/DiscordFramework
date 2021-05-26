import { Handler } from "../classes";
import Chokidar from "chokidar";
import { resolve } from "path";

type Loadables = "Command" | "Handler";

function superRequire(file: string) {
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } catch(err) {
    throw err;
  }
}

export class WatchHandler extends Handler {
  data: {[key: string]: any, command_watcher?: Chokidar.FSWatcher, handler_watcher?: Chokidar.FSWatcher} = {}

  constructor() {
    super("\\watch_handler", "load", { once: false });
  }

  private load(path: string, type: Loadables) {
    if (!this.bot) return;
    let pathArr = path.split(/[\/\\]/gi);
    let file = pathArr[pathArr.length - 1];
    if (!file) return;
    let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
    path = resolve(`./${path}`);
    let data = superRequire(path);
    this.log(`Loading ${type} '${name}' from '${path}'`);
    if (data instanceof Function) this.bot.add(new data(name));
    else if (type == "Handler") this.bot.addHandler(name, data.event, data.options).call = data.call;
    else if (type == "Command") this.bot.addCommand(name, data.options).call = data.call;
  }

  private unload(path: string, type: Loadables) {
    if (!this.bot) return;
    let pathArr = path.split(/[\/\\]/gi);
    let file = pathArr[pathArr.length - 1];
    if (!file) return;
    let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
    path = resolve(`./${path}`);
    let data = require(path);
    this.log(`Unloading Handler '${name}' from '${path}'`);
    if (data instanceof Function) name = new data(name).name;
    if (type == "Handler") this.bot.removeHandler(name);
    else if (type == "Command") this.bot.removeCommand(name);
  }

  call() {
    let handlerWatcher = Chokidar.watch("./handlers", { ignored: /^\./, depth: 0, persistent: true, awaitWriteFinish: true });
    handlerWatcher.on("add", path => this.load(path, "Handler"));
    handlerWatcher.on("change", path => this.load(path, "Handler"));
    handlerWatcher.on("unlink", path => this.unload(path, "Handler"));
    this.data.handler_watcher?.close();
    this.data.handler_watcher = handlerWatcher;

    let commandWatcher = Chokidar.watch("./commands", { ignored: /^\./, depth: 0, persistent: true, awaitWriteFinish: true });
    commandWatcher.on("add", path => this.load(path, "Command"));
    commandWatcher.on("change", path => this.load(path, "Command"));
    commandWatcher.on("unlink", path => this.unload(path, "Command"));
    this.data.command_watcher?.close();
    this.data.command_watcher = commandWatcher;
  }
}
