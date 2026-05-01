import chalk from "chalk";
import { resolvePaths, ensureInitialized, dirForStatus } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";
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

  let issue = readIssue(file);
  if (issue.frontmatter.status === "fixed") {
    console.log(chalk.yellow("!"), `${issue.frontmatter.id} is already fixed.`);
    return;
  }

  const now = new Date().toISOString();
  issue.frontmatter.status = "fixed";
  issue.frontmatter.fixed_at = now;
  issue.frontmatter.closed_at = now;
  if (opts.note) issue = appendFixNote(issue, opts.note);
  writeIssue(issue);
  const moved = moveIssue(issue, dirForStatus(paths, "fixed"));
  regenerateIndex(paths);
  regenerateHtml(paths);

  console.log(chalk.green("✓"), `Fixed ${chalk.cyan(moved.frontmatter.id)} — ${moved.frontmatter.title}`);
  printViewerLink(paths, moved);
}
