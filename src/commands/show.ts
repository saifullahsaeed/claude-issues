import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue } from "../storage.js";
import { printViewerLink } from "../output.js";

export function show(id: string): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }

  console.log(chalk.dim(path.relative(paths.cwd, file)));
  console.log(chalk.dim("─".repeat(60)));
  process.stdout.write(fs.readFileSync(file, "utf8"));
  const issue = readIssue(file);
  console.log();
  printViewerLink(paths, issue);
}
