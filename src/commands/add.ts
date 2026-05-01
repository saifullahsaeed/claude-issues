import path from "node:path";
import chalk from "chalk";
import prompts from "prompts";
import { resolvePaths, ensureInitialized } from "../paths.js";
import { writeIssue } from "../storage.js";
import { fileNameFor, nextId } from "../ids.js";
import { regenerateIndex } from "../index-md.js";
import { SEVERITIES, type Severity } from "../types.js";

interface AddOptions {
  title?: string;
  severity?: string;
  files?: string;
  description?: string;
}

export async function add(opts: AddOptions): Promise<void> {
  const paths = resolvePaths();
  ensureInitialized(paths);

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
    },
    body,
    filePath,
  });

  regenerateIndex(paths);
  console.log(chalk.green("✓"), `Added ${chalk.cyan(id)} — ${title}`);
  console.log(`  ${chalk.dim("→")} ${path.relative(paths.cwd, filePath)}`);
}
