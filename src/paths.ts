import path from "node:path";
import fs from "node:fs";

export const ROOT_DIR_NAME = ".claude-issues";

export interface Paths {
  cwd: string;
  root: string;
  open: string;
  fixed: string;
  index: string;
}

export function resolvePaths(cwd: string = process.cwd()): Paths {
  const root = path.join(cwd, ROOT_DIR_NAME);
  return {
    cwd,
    root,
    open: path.join(root, "open"),
    fixed: path.join(root, "fixed"),
    index: path.join(root, "INDEX.md"),
  };
}

export function ensureInitialized(paths: Paths): void {
  if (!fs.existsSync(paths.root)) {
    throw new Error(
      `No .claude-issues/ folder found in ${paths.cwd}. Run \`claude-issues init\` first.`,
    );
  }
}
