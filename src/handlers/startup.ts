import { Handler } from "../classes";

export class StartupHandler extends Handler {
  constructor() {
    super("\\startup_handler", "ready", { once: true });
  }

  call() {
    if (!this.bot || !this.bot.user) return;
    this.log(`Logged in as ${this.bot.user.tag}!`);
  }
}
