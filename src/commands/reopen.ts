import chalk from "chalk";
import { resolvePaths, dirForStatus } from "../paths.js";
import { bootstrap } from "./init.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";

export function reopen(id: string): void {
  const paths = resolvePaths();
  bootstrap(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }

  const issue = readIssue(file);
  if (issue.frontmatter.status === "open") {
    console.log(chalk.yellow("!"), `${issue.frontmatter.id} is already open.`);
    return;
  }

  issue.frontmatter.status = "open";
  issue.frontmatter.fixed_at = null;
  issue.frontmatter.closed_at = null;
  writeIssue(issue);
  const moved = moveIssue(issue, dirForStatus(paths, "open"));
  regenerateIndex(paths);
  regenerateHtml(paths);

  console.log(chalk.green("✓"), `Reopened ${chalk.cyan(moved.frontmatter.id)} — ${moved.frontmatter.title}`);
  printViewerLink(paths, moved);
}
