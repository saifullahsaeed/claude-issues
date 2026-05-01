import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { listOpen, listFixed, listArchive } from "./storage.js";
import { SEVERITY_RANK, type Issue, type Status } from "./types.js";
import type { Paths } from "./paths.js";

const STATUS_COLOR: Record<Status, string> = {
  open: "#2563eb",
  fixed: "#16a34a",
  wontfix: "#6b7280",
  superseded: "#9333ea",
  duplicate: "#0891b2",
};

const SEV_COLOR: Record<string, string> = {
  critical: "#b91c1c",
  high: "#dc2626",
  medium: "#d97706",
  low: "#6b7280",
};

const BASE_CSS = `
*{box-sizing:border-box}
body{font:14px/1.55 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px;max-width:980px;margin:0 auto}
h1{margin:0 0 8px}
h2{margin-top:32px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
a{color:#2563eb;text-decoration:none}
a:hover{text-decoration:underline}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin:8px 0 24px}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;vertical-align:top}
th{background:#f1f5f9;font-weight:600;font-size:13px}
tr:last-child td{border-bottom:none}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;color:#fff;font-weight:500}
.muted{color:#64748b;font-size:13px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin-bottom:16px}
.meta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:#475569;margin:8px 0 16px}
.meta b{color:#0f172a;font-weight:600}
.fixnotes{background:#f8fafc;border-left:3px solid #94a3b8;padding:8px 14px;margin-top:8px}
.body{margin-top:12px}
.body pre{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:6px;overflow-x:auto}
.body code{background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:13px}
.body pre code{background:transparent;padding:0}
.empty{color:#94a3b8;font-style:italic}
.toplinks{margin-bottom:16px}
.toplinks a{margin-right:14px}
`;

export function regenerateHtml(paths: Paths): void {
  fs.mkdirSync(paths.html, { recursive: true });
  const all: Issue[] = [
    ...listOpen(paths),
    ...listFixed(paths),
    ...listArchive(paths),
  ];
  for (const issue of all) {
    fs.writeFileSync(htmlPathFor(paths, issue), renderIssue(issue, all), "utf8");
  }
  fs.writeFileSync(paths.htmlIndex, renderIndex(paths, all), "utf8");
  // remove orphaned html files for issues that no longer exist
  const liveIds = new Set(all.map((i) => i.frontmatter.id));
  for (const f of fs.readdirSync(paths.html)) {
    if (!f.endsWith(".html") || f === "index.html") continue;
    const id = f.replace(/\.html$/, "");
    if (!liveIds.has(id)) fs.unlinkSync(path.join(paths.html, f));
  }
}

export function htmlPathFor(paths: Paths, issue: Issue): string {
  return path.join(paths.html, `${issue.frontmatter.id}.html`);
}

export function htmlUrlFor(paths: Paths, issue?: Issue): string {
  const target = issue ? htmlPathFor(paths, issue) : paths.htmlIndex;
  return `file://${target}`;
}

function renderIndex(paths: Paths, all: Issue[]): string {
  const open = all
    .filter((i) => i.frontmatter.status === "open")
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.frontmatter.severity] -
          SEVERITY_RANK[b.frontmatter.severity] ||
        a.frontmatter.id.localeCompare(b.frontmatter.id),
    );
  const fixed = all
    .filter((i) => i.frontmatter.status === "fixed")
    .sort((a, b) =>
      (b.frontmatter.fixed_at ?? "").localeCompare(a.frontmatter.fixed_at ?? ""),
    );
  const archive = all
    .filter((i) =>
      ["wontfix", "superseded", "duplicate"].includes(i.frontmatter.status),
    )
    .sort((a, b) =>
      (b.frontmatter.closed_at ?? "").localeCompare(a.frontmatter.closed_at ?? ""),
    );

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Claude Issues</title><style>${BASE_CSS}</style></head>
<body>
<h1>Claude Issues — Project Ledger</h1>
<p class="muted">${path.dirname(paths.root)}</p>
<h2>Open <span class="muted">(${open.length})</span></h2>
${tableFor(open, ["id", "title", "severity", "files", "links"])}
<h2>Fixed <span class="muted">(${fixed.length})</span></h2>
${tableFor(fixed, ["id", "title", "files", "fixed_at", "links"])}
<h2>Archive <span class="muted">(${archive.length})</span></h2>
${tableFor(archive, ["id", "title", "status", "files", "closed_at", "links"])}
</body></html>`;
}

type Col = "id" | "title" | "severity" | "status" | "files" | "fixed_at" | "closed_at" | "links";

function tableFor(issues: Issue[], cols: Col[]): string {
  if (issues.length === 0) return `<p class="empty">None.</p>`;
  const head = cols.map((c) => `<th>${headerLabel(c)}</th>`).join("");
  const rows = issues
    .map((i) => `<tr>${cols.map((c) => `<td>${cell(i, c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

function headerLabel(c: Col): string {
  return {
    id: "ID",
    title: "Title",
    severity: "Severity",
    status: "Status",
    files: "Files",
    fixed_at: "Fixed",
    closed_at: "Closed",
    links: "Links",
  }[c];
}

function cell(i: Issue, c: Col): string {
  const fm = i.frontmatter;
  switch (c) {
    case "id":
      return `<a href="${fm.id}.html">${fm.id}</a>`;
    case "title":
      return escapeHtml(fm.title);
    case "severity":
      return `<span class="badge" style="background:${SEV_COLOR[fm.severity] ?? "#6b7280"}">${fm.severity}</span>`;
    case "status":
      return `<span class="badge" style="background:${STATUS_COLOR[fm.status]}">${fm.status}</span>`;
    case "files":
      return (fm.files ?? []).map((f) => `<code>${escapeHtml(f)}</code>`).join("<br>");
    case "fixed_at":
      return (fm.fixed_at ?? "").slice(0, 10);
    case "closed_at":
      return (fm.closed_at ?? fm.fixed_at ?? "").slice(0, 10);
    case "links":
      return linkBadges(fm);
  }
}

function linkBadges(fm: Issue["frontmatter"]): string {
  const parts: string[] = [];
  if (fm.supersedes) parts.push(`supersedes <a href="${fm.supersedes}.html">${fm.supersedes}</a>`);
  if (fm.superseded_by) parts.push(`superseded by <a href="${fm.superseded_by}.html">${fm.superseded_by}</a>`);
  if (fm.duplicate_of) parts.push(`dup of <a href="${fm.duplicate_of}.html">${fm.duplicate_of}</a>`);
  if (fm.related && fm.related.length > 0) {
    parts.push(
      "related: " +
        fm.related.map((r) => `<a href="${r}.html">${r}</a>`).join(", "),
    );
  }
  return parts.join("; ");
}

function renderIssue(issue: Issue, all: Issue[]): string {
  const fm = issue.frontmatter;
  const bodyHtml = marked.parse(issue.body, { async: false }) as string;
  const back = `<p class="toplinks"><a href="index.html">← All issues</a></p>`;
  const meta = `
<div class="meta">
  <span><b>Status:</b> <span class="badge" style="background:${STATUS_COLOR[fm.status]}">${fm.status}</span></span>
  <span><b>Severity:</b> <span class="badge" style="background:${SEV_COLOR[fm.severity] ?? "#6b7280"}">${fm.severity}</span></span>
  <span><b>Created:</b> ${(fm.created ?? "").slice(0, 10)}</span>
  ${fm.fixed_at ? `<span><b>Fixed:</b> ${fm.fixed_at.slice(0, 10)}</span>` : ""}
  ${fm.closed_at ? `<span><b>Closed:</b> ${fm.closed_at.slice(0, 10)}</span>` : ""}
</div>`;
  const files = (fm.files ?? []).length
    ? `<p><b>Files:</b> ${fm.files.map((f) => `<code>${escapeHtml(f)}</code>`).join(", ")}</p>`
    : "";
  const links = linkBadges(fm) ? `<p><b>Links:</b> ${linkBadges(fm)}</p>` : "";

  // sibling references not captured in frontmatter
  const incoming = all
    .filter(
      (other) =>
        other.frontmatter.id !== fm.id &&
        (other.frontmatter.supersedes === fm.id ||
          other.frontmatter.duplicate_of === fm.id ||
          (other.frontmatter.related ?? []).includes(fm.id)),
    )
    .map((o) => `<a href="${o.frontmatter.id}.html">${o.frontmatter.id}</a> (${o.frontmatter.status})`)
    .join(", ");
  const referencedBy = incoming ? `<p><b>Referenced by:</b> ${incoming}</p>` : "";

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(fm.id)} — ${escapeHtml(fm.title)}</title><style>${BASE_CSS}</style></head>
<body>
${back}
<div class="card">
  <h1>${escapeHtml(fm.id)} — ${escapeHtml(fm.title)}</h1>
  ${meta}
  ${files}
  ${links}
  ${referencedBy}
  <div class="body">${bodyHtml}</div>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
