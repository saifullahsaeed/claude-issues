import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { resolvePaths } from "../paths.js";
import { bootstrap } from "./init.js";
import { regenerateHtml } from "../html.js";

interface ServeOptions {
  port?: string;
  open?: boolean;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

export async function serve(opts: ServeOptions): Promise<void> {
  const paths = resolvePaths();
  bootstrap(paths);
  regenerateHtml(paths);

  const port = opts.port ? Number.parseInt(opts.port, 10) : 47829;
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --port: ${opts.port}`);
  }

  const root = paths.html;
  const server = http.createServer((req, res) => {
    const reqUrl = req.url ?? "/";
    let pathname = decodeURIComponent(reqUrl.split("?")[0] ?? "/");
    if (pathname === "/" || pathname === "") pathname = "/index.html";

    // Always regenerate before serving so it reflects latest CLI writes.
    regenerateHtml(paths);

    const target = path.normalize(path.join(root, pathname));
    if (!target.startsWith(root)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("not found");
        return;
      }
      res.writeHead(200, {
        "content-type": MIME[path.extname(target)] ?? "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(data);
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        chalk.red("✗"),
        `Port ${port} is already in use. Try \`claude-issues serve --port <other>\`.`,
      );
      process.exit(1);
    }
    throw err;
  });

  await new Promise<void>((resolve) => server.listen(port, "127.0.0.1", resolve));
  const url = `http://localhost:${port}/`;
  console.log(chalk.green("✓"), `Serving ledger at ${chalk.cyan(url)}`);
  console.log(chalk.dim("  Press Ctrl+C to stop. Pages auto-refresh content on every request."));
  console.log(`View: ${url}`);

  process.on("SIGINT", () => {
    console.log("\nStopping…");
    server.close(() => process.exit(0));
  });
}
