import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { resolvePaths, type Paths } from "../paths.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";

const CLAUDE_MD_POINTER = `\n## Issue ledger\n\nThis project uses \`claude-issues\` for cross-session issue tracking. Read \`.claude-issues/INDEX.md\` to see what's open, fixed, and archived before starting work. Browser view: \`.claude-issues/_html/index.html\` (or run \`/issues serve\` for a clickable http URL).\n`;

/**
 * Idempotently create the .claude-issues/ folder structure if it doesn't
 * yet exist. Safe to call from any command — it's a no-op when the
 * folder is already there.
 */
export function bootstrap(paths: Paths): { created: boolean } {
  if (fs.existsSync(paths.root)) return { created: false };
  fs.mkdirSync(paths.open, { recursive: true });
  fs.mkdirSync(paths.fixed, { recursive: true });
  fs.mkdirSync(paths.archive, { recursive: true });
  fs.mkdirSync(paths.html, { recursive: true });
  regenerateIndex(paths);
  regenerateHtml(paths);
  const giAttr = path.join(paths.root, ".gitignore");
  if (!fs.existsSync(giAttr)) {
    fs.writeFileSync(giAttr, "_html/\n", "utf8");
  }
  return { created: true };
}

export function init(): void {
  const paths = resolvePaths();
  const { created } = bootstrap(paths);

  const claudeMd = path.join(paths.cwd, "CLAUDE.md");
  if (fs.existsSync(claudeMd)) {
    const current = fs.readFileSync(claudeMd, "utf8");
    if (!current.includes(".claude-issues/INDEX.md")) {
      fs.writeFileSync(claudeMd, current + CLAUDE_MD_POINTER, "utf8");
      console.log(chalk.green("✓"), "Appended pointer to CLAUDE.md");
    }
  }

  if (created) {
    console.log(chalk.green("✓"), `Initialized ${chalk.cyan(".claude-issues/")} in ${paths.cwd}`);
  } else {
    console.log(chalk.dim("•"), `${chalk.cyan(".claude-issues/")} already exists in ${paths.cwd}`);
  }
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/INDEX.md")}`);
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/open/")}, ${chalk.cyan("fixed/")}, ${chalk.cyan("archive/")}`);
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/_html/index.html")} (browser view)`);
  printViewerLink(paths);
}
