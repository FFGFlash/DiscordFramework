import { Command } from "../classes";
import { Message } from "discord.js";
import { inspect } from "util";
import { writeFile, unlink } from "fs/promises";

function getOutput(res: any, files: string[] = []) {
  return new Promise<Array<string>>(function(resolve, reject) {
    let output = inspect(res);
    let name = `eval_response_${files.length}_${new Date().toUTCString()}`.replace(/[^A-Z0-9]/gi, "_");
    let file = `./${name}.txt`;
    writeFile(file, output, "utf8").then(async () => {
      files.push(file);
      if (res instanceof Promise) getOutput(await res, files).then(resolve).catch(reject);
      else resolve(files);
    }).catch(reject);
  });
}

export class EvalCommand extends Command {
  constructor() {
    super("eval", {
      description: "Evaluates raw javascript.",
      devOnly: true,
      guildOnly: false,
      permissions: 0,
      arguments: [
        { name: "code", options: { optional: false, description: "The code to evaluate." } }
      ]
    });
  }

  call(msg: Message, ...args: string[]) {
    let code = args.join(" ");
    let lines = code.split("\n");
    if (lines[0].startsWith("```")) {
      lines.shift();
      lines.pop();
    }
    code = lines.join("\n");
    let res: string;
    let start = Date.now();
    try { res = eval(code); } catch(err) { res = `${err.name}: ${err.message}`; }
    let elapsed = Date.now() - start;
    getOutput(res).then(files => {
      msg.reply(`Response took ${elapsed}ms to process.`, {
        files: files
      }).then(() => {
        for (let file of files) {
          unlink(file);
        }
      });
    });
  }
}
