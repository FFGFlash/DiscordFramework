import { CoreHandler } from "../classes";
import { PartialUser, Guild, User } from "discord.js";

export class RegisterGuildMemberHandler extends CoreHandler<"guildMemberRegistered"> {
  constructor(name?: string) {
    super("\\register_guild_member_handler", "guildMemberRegistered", name);
  }

  call(guild: Guild, user: User | PartialUser) {
    this.log(`${user.tag} (${user.id}) has joined ${guild.name} (${guild.id}).`);
  }
}

export class UnregisterGuildMemberHandler extends CoreHandler<"guildMemberUnregistered"> {
  constructor(name?: string) {
    super("\\unregister_guild_member_handler", "guildMemberUnregistered", name);
  }

  call(guild: Guild, user: User | PartialUser) {
    this.log(`${user.id} has left ${guild.name} (${guild.id}).`);
  }
}

export class RegisterGuildHandler extends CoreHandler<"guildRegistered"> {
  constructor(name?: string) {
    super("\\register_guild_handler", "guildRegistered", name);
  }

  call(guild: Guild) {
    if (!this.bot.user) return;
    this.log(`${this.bot.user.tag} joined ${guild.name} (${guild.id})`);
  }
}

export class UnregisterGuildHandler extends CoreHandler<"guildUnregistered"> {
  constructor(name?: string) {
    super("\\unregister_guild_handler", "guildUnregistered", name);
  }

  call(guild: Guild) {
    if (!this.bot.user) return;
    this.log(`${this.bot.user.tag} left ${guild.name} (${guild.id})`);
  }
}
