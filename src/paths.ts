import path from "node:path";
import type { Status } from "./types.js";

export const ROOT_DIR_NAME = ".claude-issues";

export interface Paths {
  cwd: string;
  root: string;
  open: string;
  fixed: string;
  archive: string;
  html: string;
  htmlIndex: string;
  index: string;
}

export function resolvePaths(cwd: string = process.cwd()): Paths {
  const root = path.join(cwd, ROOT_DIR_NAME);
  const html = path.join(root, "_html");
  return {
    cwd,
    root,
    open: path.join(root, "open"),
    fixed: path.join(root, "fixed"),
    archive: path.join(root, "archive"),
    html,
    htmlIndex: path.join(html, "index.html"),
    index: path.join(root, "INDEX.md"),
  };
}

export function dirForStatus(paths: Paths, status: Status): string {
  switch (status) {
    case "open":
      return paths.open;
    case "fixed":
      return paths.fixed;
    case "wontfix":
    case "superseded":
    case "duplicate":
      return paths.archive;
  }
}

