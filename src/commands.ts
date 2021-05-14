import { Command } from "./classes";
import { inspect } from "util";
import { writeFile, unlink } from "fs/promises";

export const AboutCommand = new Command("about", {
  description: "Info about this bot."
});

export const EvalCommand = new Command("eval", {
  description: "Evaluates provided string.",
  devOnly: true,
  arguments: [
    { name: "code", options: { optional: false, description: "The string to evaluate." } }
  ]
});

export const HelpCommand = new Command("help", {
  description: "Displays the complete list of commands.",
  arguments: [
    { name: "command/page", options: { optional: true, description: "What page or command you would like to see." } }
  ]
});

AboutCommand.execute = async function(msg) {
  if (!this.module || !this.module.bot || !this.module.bot.user) return;

  let developers: Array<string> = [];

  if (this.module.bot.developers.length > 0) {
    for (let id of this.module.bot.developers) {
      let user = await this.module.bot.users.fetch(id);
      if (!user) continue;
      developers.push(user.tag);
    }
  } else developers.push("Unspecified")

  msg.channel.send(this.module.createEmbed({
    title: `About ${this.module.bot.user.tag}`,
    description: this.module.bot._options.about,
    fields: [
      { name: "Developers", value: `${developers.join(", ").replace(/, (\w+)$/i, " and $1")}.` },
      { name: "Guilds", value: `Count: ${this.module.bot.guilds.cache.size}`, inline: true },
      { name: "API Latency", value: `${Math.round(this.module.bot.ws.ping)}ms`, inline: true },
      { name: "Message Latency", value: `${Date.now() - msg.createdTimestamp}ms`, inline: true }
    ],
    thumbnail: { url: this.module.bot.user.avatarURL() as string }
  }));
};

EvalCommand.execute = function(msg, ...code) {
  let res;
  let start = new Date().getTime();
  try { res = eval(code.join(" ")); } catch(err) { res = `${err.name}: ${err.message}`; }
  let elapsed = new Date().getTime() - start;
  let getOutput = async (res: any, files: string[] = []): Promise<string[]> => {
    let output = inspect(res);
    let name = `eval_response_${files.length}_${new Date().toUTCString()}`.replace(/[^A-Z0-9]/gi, "_");
    let file = `./${name}.txt`;
    await writeFile(file, output, "utf8");
    files.push(file);
    if (res instanceof Promise) {
      return await getOutput(await res, files);
    }
    return files;
  }
  getOutput(res).then(files => {
    msg.reply(`\`\`\`Response took ${elapsed}ms to process...\`\`\``, {
      files: files
    }).then(() => {
      for (let file of files) {
        unlink(file);
      }
    });
  });
};

HelpCommand.execute = function(msg, cp) {
  if (!this.module || !this.module.bot) return;

  let page = cp ? parseInt(cp) - 1 : 0;

  if (isNaN(page)) {
    let data = this.module.bot.fetchCommand(cp);
    if (!data || !data.command) return msg.reply(`Command "${cp}" Not Found.`);
    let { command: cmd, module: mod } = data;

    let args = [];
    for (let arg of cmd.arguments.values()) {
      args.push({
        name: arg.name,
        value: arg.description,
        inline: true
      });
    }

    msg.channel.send(this.module.createEmbed({
      title: `${mod.prefix}${cmd.formated}`,
      description: cmd.description,
      fields: args
    }));

    return;
  }

  let commands = [];
  for (let mod of this.module.bot.modules.values()) {
    for (let command of mod.commands.values()) {
      commands.push({
        name: `${mod.prefix}${command.formated}`,
        value: command.description
      });
    }
  }

  let maxPage = Math.floor(commands.length / 20);
  page = Math.max(Math.min(page, maxPage), 0);

  let start = page * 20;
  commands = commands.slice(start, Math.min(start + 20, commands.length));

  msg.channel.send(this.module.createEmbed({
    title: `Command List`,
    description: `Page ${page + 1} out of ${maxPage + 1}`,
    fields: commands
  }));
};
