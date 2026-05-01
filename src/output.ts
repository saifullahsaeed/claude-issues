import chalk from "chalk";
import type { Issue } from "./types.js";
import type { Paths } from "./paths.js";
import { htmlUrlFor } from "./html.js";

export function printViewerLink(paths: Paths, issue?: Issue): void {
  const url = htmlUrlFor(paths, issue);
  console.log(chalk.dim("View:"), chalk.cyan(url));
}
