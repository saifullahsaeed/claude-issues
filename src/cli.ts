import { Command } from "commander";
import chalk from "chalk";
import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { list } from "./commands/list.js";
import { show } from "./commands/show.js";
import { fix } from "./commands/fix.js";
import { reopen } from "./commands/reopen.js";
import { note } from "./commands/note.js";

const program = new Command();

program
  .name("claude-issues")
  .description("Persistent markdown issue ledger for Claude Code projects.")
  .version("0.1.0");

program
  .command("init")
  .description("Create .claude-issues/ in the current directory")
  .action(wrap(() => init()));

program
  .command("add")
  .description("Add a new open issue")
  .option("-t, --title <title>", "Issue title")
  .option("-s, --severity <severity>", "low | medium | high | critical")
  .option("-f, --files <files>", "Comma-separated file paths")
  .option("-d, --description <text>", "Short description")
  .action(wrap((opts) => add(opts)));

program
  .command("list")
  .alias("ls")
  .description("List issues (default: open)")
  .option("--open", "Open issues only (default)")
  .option("--fixed", "Fixed issues only")
  .option("--all", "All issues")
  .action(wrap((opts) => list(opts)));

program
  .command("show <id>")
  .description("Print an issue's full markdown")
  .action(wrap((id) => show(id)));

program
  .command("fix <id>")
  .description("Mark an issue as fixed and move it to fixed/")
  .option("-n, --note <text>", "Append a final fix note before closing")
  .action(wrap((id, opts) => fix(id, opts)));

program
  .command("reopen <id>")
  .description("Move a fixed issue back to open/")
  .action(wrap((id) => reopen(id)));

program
  .command("note <id> <text>")
  .description("Append a timestamped progress note to an issue")
  .action(wrap((id, text) => note(id, text)));

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red("✗"), err instanceof Error ? err.message : String(err));
  process.exit(1);
});

function wrap<T extends unknown[]>(fn: (...args: T) => unknown | Promise<unknown>) {
  return async (...args: T) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(chalk.red("✗"), err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  };
}
