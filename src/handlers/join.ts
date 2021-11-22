import { Handler, CoreHandler } from "../classes";
import { Guild, GuildMember, PartialGuildMember, User } from "discord.js";
import { readFile, writeFile } from "fs/promises";

function setAwaitInterval(callback: (...args: any[]) => Promise<any>, timer: number, ...args: any[]) {
  let index: NodeJS.Timeout;
  let next: () => any = () => (index = setTimeout(() => callback(...args).then(next), timer));
  next();
  return () => index;
}

type Cacheable = Guild | GuildMember | PartialGuildMember | User;

var cache: Cache;

interface CacheIds {
  users: [string];
  guilds: [string];
  members: [string, string];
}

class Cache {
  data: {users: string[], guilds: string[], members: {[key: string]: string[]}} = {
    users: [],
    guilds: [],
    members: {}
  };

  load() {
    return new Promise<void>((resolve, reject) => {
      readFile("./cache.json", "utf-8").then(data => {
        try {
          this.data = Object.assign({}, this.data, JSON.parse(data));
          resolve();
        } catch(err) {
          reject(err);
        }
      }).catch(reject);
    });
  }

  save() {
    return writeFile("./cache.json", JSON.stringify(this.data, null, 2), "utf-8");
  }

  findId<T extends keyof CacheIds>(key: T, ...args: CacheIds[T]): number {
    let index = -1;

    switch(key) {
    case "guilds":
    case "users":
      index = (this.data[key] as string[]).indexOf(args[0]);
      break;
    case "members":
      if (!(this.data[key] as {[key: string]: string[]})[args[0]] || !args[1]) return -1;
      index = (this.data[key] as {[key: string]: string[]})[args[0]].indexOf(args[1]);
      break;
    }

    return index;
  }

  removeId<T extends keyof CacheIds>(key: T, ...args: CacheIds[T]): boolean {
    let index = this.findId<T>(key, ...args);

    if (index == -1) return false;

    switch(key) {
      case "guilds":
        delete this.data.members[args[0]]
      case "users":
        (this.data[key] as string[]).splice(index, 1);
        break;
      case "members":
        (this.data[key] as {[key: string]: string[]})[args[0]].splice(index, 1);
        break;
    }

    return true;
  }

  hasId<T extends keyof CacheIds>(key: T, ...args: CacheIds[T]): boolean {
    return this.findId<T>(key, ...args) != -1;
  }

  addId<T extends keyof CacheIds>(key: T, ...args: CacheIds[T]): boolean {
    let index = this.findId<T>(key, ...args);

    if (index == -1) return false;

    switch(key) {
      case "guilds":
        this.data.members[args[0]] = [];
      case "users":
        (this.data[key] as string[]).push(args[0]);
        break;
      case "members":
        if (!args[1]) return false;
        (this.data[key] as {[key: string]: string[]})[args[0]].push(args[1]);
        break;
    }

    return true;
  }

  remove(obj: Cacheable): boolean {
    let index = this.find(obj);

    if (index == -1) return false;

    if (obj instanceof Guild) {
      this.data.guilds.splice(index, 1);
      delete this.data.members[obj.id];
    } else if (obj instanceof User) {
      this.data.users.splice(index, 1);
    } else if (obj instanceof GuildMember || obj.guild) {
      this.data.members[obj.guild.id].splice(index, 1);
    }

    return true;
  }

  find(obj: Cacheable): number {
    let index = -1;

    if (obj instanceof Guild) {
      index = this.data.guilds.indexOf(obj.id);
    } else if (obj instanceof User) {
      index = this.data.users.indexOf(obj.id);
    } else if (obj instanceof GuildMember || obj.guild) {
      if (!this.data.members[obj.guild.id]) return -1;
      index = this.data.members[obj.guild.id].indexOf(obj.id);
    }

    return index;
  }

  has(obj: Cacheable): boolean {
    return this.find(obj) != -1;
  }

  add(obj: Cacheable): boolean {
    if (this.has(obj)) return false;

    if (obj instanceof Guild) {
      this.data.guilds.push(obj.id);
      this.data.members[obj.id] = [];
    } else if (obj instanceof User) {
      this.data.users.push(obj.id);
    } else if (obj instanceof GuildMember || obj.guild) {
      this.data.members[obj.guild.id].push(obj.id);
    }

    return true;
  }
}

export class JoinReadyHandler extends CoreHandler<"ready"> {
  autosave?: () => NodeJS.Timeout;

  constructor(name?: string) {
    super("\\join_ready_handler", "ready", name);
  }

  stopAutosave() {
    if (!this.autosave) return;
    clearTimeout(this.autosave());
  }

  startAutosave() {
    if (this.autosave) this.stopAutosave();
    this.autosave = setAwaitInterval(cache.save.bind(cache), 5000);
  }

  call() {
    cache = new Cache();
    this.log("Attempting to load cache...");

    cache.load().then(() => this.log("Cache loaded.")).catch(() => this.warn("No cache found or cache corrupted, creating new cache.")).finally(async () => {
      this.startAutosave();

      for (let guild of [...this.bot.guilds.cache.values()]) {
        if (cache.add(guild)) this.bot.emit("guildRegistered", guild);

        let members = await guild.members.fetch();

        for (let id of cache.data.members[guild.id]) {
          if (members.has(id)) {
            members.delete(id);
            continue;
          }
          let user = await this.bot.users.fetch(id);
          if (cache.removeId("members", guild.id, user.id)) this.bot.emit("guildMemberUnregistered", guild, user);
        }

        for (let member of [...members.values()]) {
          if (cache.add(member)) this.bot.emit("guildMemberRegistered", guild, member.user);
          if (cache.add(member.user)) this.bot.emit("userRegistered", member.user);
        }
      }
    });
  }
}

export class JoinDestroyHandler extends CoreHandler<"destroy"> {
  constructor(name?: string) {
    super("\\join_destroy_handler", "destroy", name);
  }

  async call() {
    let jrh: Handler<any> | JoinReadyHandler | undefined = this.bot.handlers.get("\\join_ready_handler");
    if (!jrh || !(jrh instanceof JoinReadyHandler)) return;
    jrh.stopAutosave();
    cache.save();
  }
}

export class JoinServerHandler extends CoreHandler<"guildCreate"> {
  constructor(name?: string) {
    super("\\join_server_handler", "guildCreate", name);
  }

  async call(guild: Guild) {
    if (cache.add(guild)) this.bot.emit("guildRegistered", guild);

    for (let member of [...(await guild.members.fetch()).values()]) {
      if (cache.add(member)) this.bot.emit("guildMemberRegistered", guild, member.user);
      if (cache.add(member.user)) this.bot.emit("userRegistered", member.user);
    }
  }
}

export class LeaveServerHandler extends CoreHandler<"guildDelete"> {
  constructor(name?: string) {
    super("\\leave_server_handler", "guildDelete", name);
  }

  async call(guild: Guild) {
    for (let member of [...(await guild.members.fetch()).values()]) if (cache.remove(member)) this.bot.emit("guildMemberUnregistered", guild, member.user);

    if (cache.remove(guild)) this.bot.emit("guildUnregistered", guild);
  }
}

export class MemberJoinHandler extends CoreHandler<"guildMemberAdd"> {
  constructor(name?: string) {
    super("\\member_join_handler", "guildMemberAdd", name);
  }

  call(member: GuildMember) {
    if (cache.add(member)) this.bot.emit("guildMemberRegistered", member.guild, member.user);
    if (cache.add(member.user)) this.bot.emit("userRegistered", member.user);
  }
}

export class MemberLeaveHandler extends CoreHandler<"guildMemberRemove"> {
  constructor(name?: string) {
    super("\\member_leave_handler", "guildMemberRemove", name);
  }

  call(member: PartialGuildMember) {
    if (!member.user) return;
    if (cache.remove(member)) this.bot.emit("guildMemberUnregistered", member.guild, member.user);
  }
}
