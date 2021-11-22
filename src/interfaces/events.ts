import { ClientEvents, Guild, User, PartialUser } from "discord.js";

export interface Events extends ClientEvents {
  load: [];
  destroy: [];
  prelogin: [];
  guildRegistered: [Guild];
  guildUnregistered: [Guild];
  guildMemberRegistered: [Guild, User | PartialUser];
  guildMemberUnregistered: [Guild, User | PartialUser];
  userRegistered: [User | PartialUser];
  userUnregistered: [User | PartialUser];
}
