import chalk from "chalk";
import Table from "cli-table3";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { listOpen, listFixed, listAll } from "../storage.js";
import { SEVERITY_RANK, type Issue, type Severity } from "../types.js";

interface ListOptions {
  open?: boolean;
  fixed?: boolean;
  all?: boolean;
}

const SEV_COLORS: Record<Severity, (s: string) => string> = {
  critical: chalk.bgRed.white,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.gray,
};

export function list(opts: ListOptions): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  let issues: Issue[];
  let label: string;
  if (opts.all) {
    issues = listAll(paths);
    label = "all";
  } else if (opts.fixed) {
    issues = listFixed(paths);
    label = "fixed";
  } else {
    issues = listOpen(paths);
    label = "open";
  }

  if (issues.length === 0) {
    console.log(chalk.dim(`No ${label} issues.`));
    return;
  }

  issues.sort(
    (a, b) =>
      SEVERITY_RANK[a.frontmatter.severity] -
        SEVERITY_RANK[b.frontmatter.severity] ||
      a.frontmatter.id.localeCompare(b.frontmatter.id),
  );

  const table = new Table({
    head: [chalk.bold("ID"), chalk.bold("Status"), chalk.bold("Severity"), chalk.bold("Title"), chalk.bold("Files")],
    style: { head: [], border: ["gray"] },
    wordWrap: true,
  });

  for (const i of issues) {
    const sev = SEV_COLORS[i.frontmatter.severity](i.frontmatter.severity);
    const status = i.frontmatter.status === "fixed" ? chalk.green("fixed") : chalk.cyan("open");
    table.push([
      i.frontmatter.id,
      status,
      sev,
      i.frontmatter.title,
      i.frontmatter.files?.join("\n") ?? "",
    ]);
  }

  console.log(table.toString());
  console.log(chalk.dim(`${issues.length} ${label} issue${issues.length === 1 ? "" : "s"}`));
}
