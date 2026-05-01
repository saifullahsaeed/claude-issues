import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["cjs"],
  target: "node20",
  outDir: "plugins/claude-issues/bin",
  outExtension: () => ({ js: ".cjs" }),
  clean: true,
  minify: false,
  sourcemap: false,
  splitting: false,
  shims: false,
  noExternal: [/.*/],
  banner: { js: "#!/usr/bin/env node" },
});
