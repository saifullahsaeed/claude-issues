import path from "node:path";
import chalk from "chalk";
import prompts from "prompts";
import { resolvePaths } from "../paths.js";
import { bootstrap } from "./init.js";
import { writeIssue, listAll } from "../storage.js";
import { fileNameFor, nextId } from "../ids.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";
import { SEVERITIES, type Severity, type Issue } from "../types.js";

interface AddOptions {
  title?: string;
  severity?: string;
  files?: string;
  description?: string;
  supersedes?: string;
  noScan?: boolean;
}

export async function add(opts: AddOptions): Promise<void> {
  const paths = resolvePaths();
  bootstrap(paths);

  let { title, severity, files, description } = opts;

  if (!title || !severity) {
    const answers = await prompts(
      [
        title
          ? null
          : {
              type: "text",
              name: "title",
              message: "Title",
              validate: (v: string) => (v.trim().length > 0 ? true : "Required"),
            },
        severity
          ? null
          : {
              type: "select",
              name: "severity",
              message: "Severity",
              choices: SEVERITIES.map((s) => ({ title: s, value: s })),
              initial: 1,
            },
        files
          ? null
          : {
              type: "text",
              name: "files",
              message: "Files (comma-separated, optional)",
            },
        description
          ? null
          : {
              type: "text",
              name: "description",
              message: "Short description (optional)",
            },
      ].filter(Boolean) as prompts.PromptObject[],
      {
        onCancel: () => {
          console.log(chalk.yellow("Cancelled."));
          process.exit(1);
        },
      },
    );
    title = title ?? answers.title;
    severity = severity ?? answers.severity;
    files = files ?? answers.files;
    description = description ?? answers.description;
  }

  if (!title || !severity) {
    throw new Error("Title and severity are required.");
  }
  if (!SEVERITIES.includes(severity as Severity)) {
    throw new Error(`Invalid severity: ${severity}. Must be one of ${SEVERITIES.join(", ")}.`);
  }

  const id = nextId(paths);
  const fileList = (files ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  // Surface possible duplicates so callers (and Claude) can decide.
  if (!opts.noScan) {
    const matches = findRelated(listAll(paths), title, fileList);
    if (matches.length > 0) {
      console.log(chalk.yellow("⚠"), "Similar past issues:");
      for (const m of matches) {
        console.log(
          `  ${chalk.cyan(m.frontmatter.id)} ${chalk.dim("(" + m.frontmatter.status + ")")} — ${m.frontmatter.title}`,
        );
      }
      console.log(
        chalk.dim(
          `  Use --supersedes <id> if this replaces a prior fix, or \`claude-issues link ${id} --duplicate-of <id>\` later.`,
        ),
      );
    }
  }

  const filePath = path.join(paths.open, fileNameFor(id, title));
  const body = `\n## Description\n${description?.trim() || "_(none provided)_"}\n\n## Repro\n_(add steps here)_\n\n## Fix notes\n`;

  writeIssue({
    frontmatter: {
      id,
      title,
      status: "open",
      severity: severity as Severity,
      files: fileList,
      created: new Date().toISOString(),
      fixed_at: null,
      closed_at: null,
      supersedes: opts.supersedes ? opts.supersedes.toUpperCase() : null,
      superseded_by: null,
      duplicate_of: null,
      related: [],
    },
    body,
    filePath,
  });

  // If --supersedes given, mark the older issue as superseded too.
  if (opts.supersedes) {
    await applySupersedes(id, opts.supersedes);
  }

  regenerateIndex(paths);
  regenerateHtml(paths);
  console.log(chalk.green("✓"), `Added ${chalk.cyan(id)} — ${title}`);
  console.log(`  ${chalk.dim("→")} ${path.relative(paths.cwd, filePath)}`);
  printViewerLink(paths, {
    frontmatter: { id } as Issue["frontmatter"],
    body: "",
    filePath,
  });
}

async function applySupersedes(newId: string, oldIdRaw: string): Promise<void> {
  const { link } = await import("./link.js");
  link(newId, { supersedes: oldIdRaw });
}

function findRelated(all: Issue[], title: string, files: string[]): Issue[] {
  const lcTitle = title.toLowerCase();
  const titleTerms = lcTitle.split(/\W+/).filter((t) => t.length >= 4);
  const matches: { issue: Issue; score: number }[] = [];
  for (const issue of all) {
    let score = 0;
    if (issue.frontmatter.files) {
      for (const f of issue.frontmatter.files) {
        if (files.includes(f)) score += 3;
      }
    }
    const otherTitle = issue.frontmatter.title.toLowerCase();
    for (const term of titleTerms) {
      if (otherTitle.includes(term)) score += 1;
    }
    if (score >= 2) matches.push({ issue, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 5).map((m) => m.issue);
}
