import chalk from "chalk";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { appendFixNote } from "./note.js";

interface FixOptions {
  note?: string;
}

export function fix(id: string, opts: FixOptions): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }
  if (file.startsWith(paths.fixed)) {
    console.log(chalk.yellow("!"), `${id} is already fixed.`);
    return;
  }

  let issue = readIssue(file);
  issue.frontmatter.status = "fixed";
  issue.frontmatter.fixed_at = new Date().toISOString();
  if (opts.note) {
    issue = appendFixNote(issue, opts.note);
  }
  writeIssue(issue);
  const moved = moveIssue(issue, paths.fixed);
  regenerateIndex(paths);

  console.log(chalk.green("✓"), `Fixed ${chalk.cyan(moved.frontmatter.id)} — ${moved.frontmatter.title}`);
}
