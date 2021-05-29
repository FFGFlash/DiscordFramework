import { Command } from "../classes";
import { Message } from "discord.js";

export class HelpCommand extends Command {
  constructor() {
    super("help", {
      devOnly: false,
      guildOnly: false,
      description: "Displays the complete list of commands.",
      permissions: 0,
      arguments: [
        { name: "command", options: { optional: true, description: "Specify a command for it's help page." } }
      ]
    });
  }

  call(msg: Message, name?: string) {
    let author = msg.author;
    let prefix = this.bot.prefix(msg.guild);

    let embed = this.createEmbed({
      title: "Loading...",
      description: "Give us a sec to load help menu!"
    });

    if (name) {
      let command = this.bot.commands.get(name.toLowerCase());
      if (!command) {
        msg.channel.send(embed.setTitle("Command Not Found.").setDescription(`The command '${name}' couldn't be found.`))
        return;
      }
      for (let arg of command.arguments) {
        embed.addField(arg.name, arg.description, true);
      }
      msg.channel.send(embed.setTitle(`${prefix}${command.formated}`).setDescription(command.description));
      return;
    }

    let commands = [...this.bot.commands.values()];
    let maxPage = Math.floor(commands.length / 20);

    function updateEmbed(page: number) {
      embed.setTitle("Help Menu").setDescription(`Page ${page + 1} out of ${maxPage + 1}.`).fields = [];
      for (let i = 0; i < 20; i++) {
        let p = page * 20 + i;
        if (p >= commands.length) break;
        let cmd = commands[p];
        embed.addField(`${prefix}${cmd.formated}`, cmd.description);
      }
      return embed;
    }

    let page = 0;
    msg.channel.send(updateEmbed(page)).then(async msg => {
      await msg.react("⬅️");
      await msg.react("➡️");

      let collector = msg.createReactionCollector((r, u) => (r.emoji.name == "⬅️" || r.emoji.name == "➡️") && u.id == author.id, { time: 15000 });
      collector.on("collect", (r, u) => {
        if (r.emoji.name == "⬅️") page--;
        else if (r.emoji.name == "➡️") page++;
        if (page < 0) page = maxPage;
        else if (page > maxPage) page = 0;
        msg.edit(updateEmbed(page));
        r.users.remove(u);
        collector.resetTimer();
      });
      collector.on("end", () => msg.reactions.removeAll());
    });
  }
}
