import chalk from "chalk";
import { resolvePaths, ensureInitialized, dirForStatus } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";
import { appendFixNote } from "./note.js";

interface WontfixOptions {
  note?: string;
}

export function wontfix(id: string, opts: WontfixOptions): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }
  let issue = readIssue(file);
  if (issue.frontmatter.status === "wontfix") {
    console.log(chalk.yellow("!"), `${issue.frontmatter.id} is already wontfix.`);
    return;
  }
  issue.frontmatter.status = "wontfix";
  issue.frontmatter.closed_at = new Date().toISOString();
  if (opts.note) issue = appendFixNote(issue, `[wontfix] ${opts.note}`);
  writeIssue(issue);
  const moved = moveIssue(issue, dirForStatus(paths, "wontfix"));
  regenerateIndex(paths);
  regenerateHtml(paths);
  console.log(chalk.green("✓"), `Marked ${chalk.cyan(moved.frontmatter.id)} as ${chalk.gray("wontfix")}`);
  printViewerLink(paths, moved);
}
