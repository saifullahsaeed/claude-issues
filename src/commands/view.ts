import chalk from "chalk";
import { spawn } from "node:child_process";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { findIssueFile } from "../ids.js";
import { readIssue } from "../storage.js";
import { regenerateHtml, htmlUrlFor } from "../html.js";

interface ViewOptions {
  noOpen?: boolean;
}

export function view(id: string | undefined, opts: ViewOptions): void {
  const paths = resolvePaths();
  ensureInitialized(paths);
  regenerateHtml(paths);

  let url: string;
  if (id) {
    const file = findIssueFile(paths, id);
    if (!file) {
      console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
      process.exit(1);
    }
    url = htmlUrlFor(paths, readIssue(file));
  } else {
    url = htmlUrlFor(paths);
  }

  console.log(chalk.cyan(url));

  if (!opts.noOpen) {
    const opener = process.platform === "darwin" ? "open"
      : process.platform === "win32" ? "start"
      : "xdg-open";
    try {
      spawn(opener, [url], { detached: true, stdio: "ignore" }).unref();
    } catch {
      // silently ignore — link is still printed
    }
  }
}
