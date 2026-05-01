import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Issue, IssueFrontmatter } from "./types.js";
import type { Paths } from "./paths.js";

export function readIssue(filePath: string): Issue {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  return {
    frontmatter: parsed.data as IssueFrontmatter,
    body: parsed.content,
    filePath,
  };
}

export function writeIssue(issue: Issue): void {
  const out = matter.stringify(issue.body, issue.frontmatter as Record<string, unknown>);
  fs.writeFileSync(issue.filePath, out, "utf8");
}

function readDir(dir: string): Issue[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readIssue(path.join(dir, f)));
}

export function listOpen(paths: Paths): Issue[] {
  return readDir(paths.open);
}

export function listFixed(paths: Paths): Issue[] {
  return readDir(paths.fixed);
}

export function listArchive(paths: Paths): Issue[] {
  return readDir(paths.archive);
}

export function listAll(paths: Paths): Issue[] {
  return [...listOpen(paths), ...listFixed(paths), ...listArchive(paths)];
}

export function moveIssue(issue: Issue, targetDir: string): Issue {
  fs.mkdirSync(targetDir, { recursive: true });
  const newPath = path.join(targetDir, path.basename(issue.filePath));
  if (path.resolve(newPath) === path.resolve(issue.filePath)) {
    return issue;
  }
  fs.renameSync(issue.filePath, newPath);
  return { ...issue, filePath: newPath };
}
