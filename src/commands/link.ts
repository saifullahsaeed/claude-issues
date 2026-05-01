import chalk from "chalk";
import { resolvePaths, ensureInitialized, dirForStatus } from "../paths.js";
import { findIssueFile, normalizeId } from "../ids.js";
import { readIssue, writeIssue, moveIssue } from "../storage.js";
import { regenerateIndex } from "../index-md.js";
import { regenerateHtml } from "../html.js";
import { printViewerLink } from "../output.js";

interface LinkOptions {
  supersedes?: string;
  duplicateOf?: string;
  related?: string;
  unrelated?: string;
}

export function link(id: string, opts: LinkOptions): void {
  const paths = resolvePaths();
  ensureInitialized(paths);

  const file = findIssueFile(paths, id);
  if (!file) {
    console.error(chalk.red("✗"), `No issue found matching ${chalk.cyan(id)}`);
    process.exit(1);
  }
  const issue = readIssue(file);
  let acted = false;

  if (opts.supersedes) {
    const oldId = normalizeId(opts.supersedes);
    const oldFile = findIssueFile(paths, oldId);
    if (!oldFile) {
      console.error(chalk.red("✗"), `Cannot supersede unknown issue ${oldId}`);
      process.exit(1);
    }
    issue.frontmatter.supersedes = oldId;
    writeIssue(issue);

    const old = readIssue(oldFile);
    old.frontmatter.superseded_by = issue.frontmatter.id;
    old.frontmatter.status = "superseded";
    old.frontmatter.closed_at = new Date().toISOString();
    writeIssue(old);
    moveIssue(old, dirForStatus(paths, "superseded"));

    console.log(
      chalk.green("✓"),
      `${chalk.cyan(issue.frontmatter.id)} now supersedes ${chalk.cyan(oldId)} (status → superseded)`,
    );
    acted = true;
  }

  if (opts.duplicateOf) {
    const otherId = normalizeId(opts.duplicateOf);
    const otherFile = findIssueFile(paths, otherId);
    if (!otherFile) {
      console.error(chalk.red("✗"), `Cannot mark duplicate of unknown issue ${otherId}`);
      process.exit(1);
    }
    issue.frontmatter.duplicate_of = otherId;
    issue.frontmatter.status = "duplicate";
    issue.frontmatter.closed_at = new Date().toISOString();
    writeIssue(issue);
    moveIssue(issue, dirForStatus(paths, "duplicate"));
    console.log(
      chalk.green("✓"),
      `${chalk.cyan(issue.frontmatter.id)} marked as duplicate of ${chalk.cyan(otherId)}`,
    );
    acted = true;
  }

  if (opts.related) {
    const relId = normalizeId(opts.related);
    if (!findIssueFile(paths, relId)) {
      console.error(chalk.red("✗"), `Cannot relate to unknown issue ${relId}`);
      process.exit(1);
    }
    const set = new Set(issue.frontmatter.related ?? []);
    set.add(relId);
    issue.frontmatter.related = [...set];
    writeIssue(issue);

    // bidirectional
    const otherFile = findIssueFile(paths, relId);
    if (otherFile) {
      const other = readIssue(otherFile);
      const otherSet = new Set(other.frontmatter.related ?? []);
      otherSet.add(issue.frontmatter.id);
      other.frontmatter.related = [...otherSet];
      writeIssue(other);
    }
    console.log(chalk.green("✓"), `Linked ${chalk.cyan(issue.frontmatter.id)} ↔ ${chalk.cyan(relId)}`);
    acted = true;
  }

  if (opts.unrelated) {
    const relId = normalizeId(opts.unrelated);
    issue.frontmatter.related = (issue.frontmatter.related ?? []).filter((r) => r !== relId);
    writeIssue(issue);
    const otherFile = findIssueFile(paths, relId);
    if (otherFile) {
      const other = readIssue(otherFile);
      other.frontmatter.related = (other.frontmatter.related ?? []).filter(
        (r) => r !== issue.frontmatter.id,
      );
      writeIssue(other);
    }
    console.log(chalk.green("✓"), `Unlinked ${chalk.cyan(issue.frontmatter.id)} ↮ ${chalk.cyan(relId)}`);
    acted = true;
  }

  if (!acted) {
    console.error(
      chalk.red("✗"),
      "Specify one of --supersedes, --duplicate-of, --related, --unrelated.",
    );
    process.exit(1);
  }

  regenerateIndex(paths);
  regenerateHtml(paths);
  printViewerLink(paths);
}
