import { CoreHandler } from "../classes";
import Chokidar from "chokidar";
import { resolve, join } from "path";

type Loadables = "Command" | "Handler" | "Database";

function superRequire(file: string) {
  try {
    delete require.cache[require.resolve(file)];
    return require(file);
  } catch(err) {
    throw err;
  }
}

export class WatchHandler extends CoreHandler<"load"> {
  data: { [key: string]: any, command_watcher?: Chokidar.FSWatcher, handler_watcher?: Chokidar.FSWatcher, database_watcher?: Chokidar.FSWatcher } = {}

  constructor(name?: string) {
    super("\\watch_handler", "load", name, { once: false });
  }

  private load(path: string, type: Loadables) {
    if (!this.bot) return;
    let pathArr = path.split(/[\/\\]/gi);
    let file = pathArr[pathArr.length - 1];
    if (!file) return;
    let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
    path = resolve(`./${path}`);
    let { default: data } = superRequire(path);
    this.log(`Loading ${type} '${name}' from '${path}'`);
    if (data instanceof Function) this.bot.add(new data(name));
    else if (type == "Handler") this.bot.addHandler(name, data.event, data.options).call = data.call;
    else if (type == "Command") this.bot.addCommand(name, data.options).call = data.call;
    else if (type == "Database") this.bot.addDatabase(name, data.options).build = data.build;
  }

  private unload(path: string, type: Loadables) {
    if (!this.bot) return;
    let pathArr = path.split(/[\/\\]/gi);
    let file = pathArr[pathArr.length - 1];
    if (!file) return;
    let name = file.replace(/^(\w+)\.(.+)$/i, "$1");
    path = resolve(`./${path}`);
    let { default: data } = require(path);
    this.log(`Unloading Handler '${name}' from '${path}'`);
    if (data instanceof Function) name = new data(name).name;
    if (type == "Handler") this.bot.removeHandler(name);
    else if (type == "Command") this.bot.removeCommand(name);
    else if (type == "Database") this.bot.removeDatabase(name);
  }

  call() {
    let handlerWatcher = Chokidar.watch(join(this.bot.root, "handlers/**/*.js"), { ignored: /^\./, depth: 0, persistent: true, awaitWriteFinish: true });
    handlerWatcher.on("add", path => this.load(path, "Handler"));
    handlerWatcher.on("change", path => this.load(path, "Handler"));
    handlerWatcher.on("unlink", path => this.unload(path, "Handler"));
    this.data.handler_watcher?.close();
    this.data.handler_watcher = handlerWatcher;

    let commandWatcher = Chokidar.watch(join(this.bot.root, "commands/**/*.js"), { ignored: /^\./, depth: 0, persistent: true, awaitWriteFinish: true });
    commandWatcher.on("add", path => this.load(path, "Command"));
    commandWatcher.on("change", path => this.load(path, "Command"));
    commandWatcher.on("unlink", path => this.unload(path, "Command"));
    this.data.command_watcher?.close();
    this.data.command_watcher = commandWatcher;

    let databaseWatcher = Chokidar.watch(join(this.bot.root, "databases/**/*.js"), { ignored: /^\./, depth: 0, persistent: true, awaitWriteFinish: true });
    databaseWatcher.on("add", path => this.load(path, "Database"));
    databaseWatcher.on("change", path => this.load(path, "Database"));
    databaseWatcher.on("unlink", path => this.unload(path, "Database"));
    this.data.database_watcher?.close();
    this.data.database_watcher = databaseWatcher;
  }
}
