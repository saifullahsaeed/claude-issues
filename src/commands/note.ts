import chalk from "chalk";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue, writeIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";
import type { Issue } from "../types.js";

const FIX_NOTES_HEADER = "## Fix notes";

export function appendFixNote(issue: Issue, text: string): Issue {
  const stamp = new Date().toISOString();
  const line = `- _${stamp}_ ${text.trim()}`;
  let body = issue.body;
  if (body.includes(FIX_NOTES_HEADER)) {
    body = body.replace(FIX_NOTES_HEADER, `${FIX_NOTES_HEADER}\n${line}`);
  } else {
    body = `${body.trimEnd()}\n\n${FIX_NOTES_HEADER}\n${line}\n`;
  }
  return { ...issue, body };
}

export function note(id: string, text: string): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }
  if (!text || !text.trim()) {
    console.error(chalk.red("✗"), "Note text is required.");
    process.exit(1);
  }

  const issue = readIssue(file);
  const updated = appendFixNote(issue, text);
  writeIssue(updated);
  regenerateIndex(paths);
  regenerateHtml(paths);

  console.log(chalk.green("✓"), `Note added to ${chalk.cyan(updated.frontmatter.id)}`);
  printViewerLink(paths, updated);
}
