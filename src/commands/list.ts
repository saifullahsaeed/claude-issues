import chalk from "chalk";
import Table from "cli-table3";
import { resolvePaths } from "../paths.js";
import { bootstrap } from "./init.js";
import { listOpen, listFixed, listArchive, listAll } from "../storage.js";
import { SEVERITY_RANK, type Issue, type Severity, type Status } from "../types.js";
import { printViewerLink } from "../output.js";

interface ListOptions {
  open?: boolean;
  fixed?: boolean;
  archive?: boolean;
  all?: boolean;
}

const SEV_COLORS: Record<Severity, (s: string) => string> = {
  critical: chalk.bgRed.white,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.gray,
};

const STATUS_COLORS: Record<Status, (s: string) => string> = {
  open: chalk.cyan,
  fixed: chalk.green,
  wontfix: chalk.gray,
  superseded: chalk.magenta,
  duplicate: chalk.blueBright,
};

export function list(opts: ListOptions): void {
  const paths = resolvePaths();
  bootstrap(paths);

  let issues: Issue[];
  let label: string;
  if (opts.all) {
    issues = listAll(paths);
    label = "all";
  } else if (opts.fixed) {
    issues = listFixed(paths);
    label = "fixed";
  } else if (opts.archive) {
    issues = listArchive(paths);
    label = "archive";
  } else {
    issues = listOpen(paths);
    label = "open";
  }

  if (issues.length === 0) {
    console.log(chalk.dim(`No ${label} issues.`));
    printViewerLink(paths);
    return;
  }

  issues.sort(
    (a, b) =>
      SEVERITY_RANK[a.frontmatter.severity] -
        SEVERITY_RANK[b.frontmatter.severity] ||
      a.frontmatter.id.localeCompare(b.frontmatter.id),
  );

  const table = new Table({
    head: [
      chalk.bold("ID"),
      chalk.bold("Status"),
      chalk.bold("Severity"),
      chalk.bold("Title"),
      chalk.bold("Files"),
      chalk.bold("Links"),
    ],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
  });

  for (const i of issues) {
    const sev = SEV_COLORS[i.frontmatter.severity](i.frontmatter.severity);
    const status = STATUS_COLORS[i.frontmatter.status](i.frontmatter.status);
    table.push([
      i.frontmatter.id,
      status,
      sev,
      i.frontmatter.title,
      i.frontmatter.files?.join("\n") ?? "",
      linkSummary(i),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`${issues.length} ${label} issue${issues.length === 1 ? "" : "s"}`));
  printViewerLink(paths);
}

function linkSummary(i: Issue): string {
  const fm = i.frontmatter;
  const parts: string[] = [];
  if (fm.supersedes) parts.push(`supersedes ${fm.supersedes}`);
  if (fm.superseded_by) parts.push(`→ ${fm.superseded_by}`);
  if (fm.duplicate_of) parts.push(`dup of ${fm.duplicate_of}`);
  if (fm.related && fm.related.length > 0) parts.push(`related: ${fm.related.join(", ")}`);
  return parts.join("\n");
}
