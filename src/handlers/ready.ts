import { CoreHandler } from "../classes";

export class ReadyHandler extends CoreHandler<"ready"> {
  constructor(name?: string) {
    super("\\ready_handler", "ready", name, { once: true });
  }

  call() {
    if (!this.bot.user) return;
    this.log(`Logged in as ${this.bot.user.tag}!`);
  }
}
