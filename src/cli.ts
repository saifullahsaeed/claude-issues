import { Command } from "commander";
import chalk from "chalk";
import { init } from "./commands/init.js";
import { add } from "./commands/add.js";
import { list } from "./commands/list.js";
import { show } from "./commands/show.js";
import { fix } from "./commands/fix.js";
import { reopen } from "./commands/reopen.js";
import { note } from "./commands/note.js";
import { link } from "./commands/link.js";
import { wontfix } from "./commands/wontfix.js";
import { view } from "./commands/view.js";
import { serve } from "./commands/serve.js";

const program = new Command();

program
  .name("claude-issues")
  .description("Persistent markdown issue ledger for Claude Code projects.")
  .version("0.3.1");

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
  .option("--supersedes <id>", "Mark this new issue as a replacement for an older issue")
  .option("--no-scan", "Skip the duplicate-detection scan")
  .action(wrap((opts) => add(opts)));

program
  .command("list")
  .alias("ls")
  .description("List issues (default: open)")
  .option("--open", "Open issues only (default)")
  .option("--fixed", "Fixed issues only")
  .option("--archive", "Archived issues only (wontfix · superseded · duplicate)")
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
  .description("Reopen any closed issue (fixed/wontfix/superseded/duplicate → open)")
  .action(wrap((id) => reopen(id)));

program
  .command("note <id> <text>")
  .description("Append a timestamped progress note to an issue")
  .action(wrap((id, text) => note(id, text)));

program
  .command("wontfix <id>")
  .description("Close an issue without fixing")
  .option("-n, --note <text>", "Reason note")
  .action(wrap((id, opts) => wontfix(id, opts)));

program
  .command("link <id>")
  .description("Link an issue to another (supersedes / duplicate-of / related)")
  .option("--supersedes <id>", "<id> replaces an older issue (older becomes superseded)")
  .option("--duplicate-of <id>", "Mark <id> as duplicate of another (closed)")
  .option("--related <id>", "Add a bidirectional related link to another issue")
  .option("--unrelated <id>", "Remove a related link")
  .action(wrap((id, opts) => link(id, opts)));

program
  .command("view [id]")
  .description("Open the browser viewer for the project ledger or a single issue")
  .option("--no-open", "Print the URL but don't auto-open the browser")
  .action(wrap((id, opts) => view(id, opts)));

program
  .command("serve")
  .description("Start a tiny local HTTP server so the ledger has a clickable http://localhost:<port> URL")
  .option("-p, --port <port>", "Port (default 47829)")
  .action(wrap((opts) => serve(opts)));

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
