import chalk from "chalk";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";

export function reopen(id: string): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }
  if (file.startsWith(paths.open)) {
    console.log(chalk.yellow("!"), `${id} is already open.`);
    return;
  }

  const issue = readIssue(file);
  issue.frontmatter.status = "open";
  issue.frontmatter.fixed_at = null;
  writeIssue(issue);
  const moved = moveIssue(issue, paths.open);
  regenerateIndex(paths);

  console.log(chalk.green("✓"), `Reopened ${chalk.cyan(moved.frontmatter.id)} — ${moved.frontmatter.title}`);
}
