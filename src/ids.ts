import fs from "node:fs";
import path from "node:path";
import type { Paths } from "./paths.js";

const ID_RE = /^ISSUE-(\d{3,})$/;

export function normalizeId(input: string): string {
  const trimmed = input.trim().toUpperCase();
  if (ID_RE.test(trimmed)) return trimmed;
  const numeric = trimmed.replace(/^ISSUE-?/, "");
  const n = Number.parseInt(numeric, 10);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`Invalid issue id: ${input}`);
  }
  return `ISSUE-${String(n).padStart(3, "0")}`;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "untitled";
}

export function fileNameFor(id: string, title: string): string {
  return `${id}-${slugify(title)}.md`;
}

function listIssueIds(dir: string): number[] {
  if (!fs.existsSync(dir)) return [];
  const ids: number[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const m = entry.match(/^ISSUE-(\d+)/);
    if (m && m[1]) ids.push(Number.parseInt(m[1], 10));
  }
  return ids;
}

export function nextId(paths: Paths): string {
  const all = [
    ...listIssueIds(paths.open),
    ...listIssueIds(paths.fixed),
    ...listIssueIds(paths.archive),
  ];
  const max = all.length === 0 ? 0 : Math.max(...all);
  return `ISSUE-${String(max + 1).padStart(3, "0")}`;
}

export function findIssueFile(paths: Paths, id: string): string | null {
  const normalized = normalizeId(id);
  for (const dir of [paths.open, paths.fixed, paths.archive]) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith(`${normalized}-`)) {
        return path.join(dir, entry);
      }
    }
  }
  return null;
}
