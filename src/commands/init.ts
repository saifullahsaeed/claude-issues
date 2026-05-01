import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { resolvePaths } from "../paths.js";
import { regenerateIndex } from "../index-md.js";

const CLAUDE_MD_POINTER = `\n## Issue ledger\n\nThis project uses \`claude-issues\` for cross-session issue tracking. Read \`.claude-issues/INDEX.md\` to see what's open and fixed before starting work. See https://www.npmjs.com/package/claude-issues.\n`;

export function init(): void {
  const paths = resolvePaths();
  fs.mkdirSync(paths.open, { recursive: true });
  fs.mkdirSync(paths.fixed, { recursive: true });
  regenerateIndex(paths);

  const claudeMd = path.join(paths.cwd, "CLAUDE.md");
  if (fs.existsSync(claudeMd)) {
    const current = fs.readFileSync(claudeMd, "utf8");
    if (!current.includes(".claude-issues/INDEX.md")) {
      fs.writeFileSync(claudeMd, current + CLAUDE_MD_POINTER, "utf8");
      console.log(chalk.green("✓"), "Appended pointer to CLAUDE.md");
    }
  }

  console.log(chalk.green("✓"), `Initialized ${chalk.cyan(".claude-issues/")} in ${paths.cwd}`);
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/INDEX.md")}`);
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/open/")}`);
  console.log(`  ${chalk.dim("→")} ${chalk.cyan(".claude-issues/fixed/")}`);
}
