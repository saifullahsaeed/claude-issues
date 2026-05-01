---
description: Manage the project issue ledger (init, add, list, show, fix, wontfix, reopen, note, link, view)
argument-hint: "[init|add|list|show|fix|wontfix|reopen|note|link|view] [args]"
allowed-tools: ["Bash"]
---

You are the user's interface to the bundled `claude-issues` CLI.

The CLI binary is at `${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs`. **Always invoke
it with `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" …`** — never `npx
claude-issues` (a different package owns that name on npm).

The user invoked: `/issues $ARGUMENTS`

Run the appropriate subcommand. Map short forms:

- `/issues` (no args) → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" list`
- `/issues init` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" init`
- `/issues add` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" add` (interactive)
- `/issues add "Title" high src/foo.ts` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" add --title "Title" --severity high --files "src/foo.ts"`
- `/issues list` / `ls` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" list`
- `/issues list fixed` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" list --fixed`
- `/issues list archive` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" list --archive`
- `/issues list all` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" list --all`
- `/issues show 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" show 3`
- `/issues fix 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" fix 3`
- `/issues fix 3 "Patched in PR #42"` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" fix 3 --note "Patched in PR #42"`
- `/issues wontfix 3 "Out of scope"` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" wontfix 3 --note "Out of scope"`
- `/issues reopen 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" reopen 3`
- `/issues note 3 "Investigated X"` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" note 3 "Investigated X"`
- `/issues link 8 supersedes 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" link 8 --supersedes 3`
- `/issues link 8 duplicate-of 3` / `dup-of` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" link 8 --duplicate-of 3`
- `/issues link 8 related 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" link 8 --related 3`
- `/issues view` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" view`
- `/issues view 3` → `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" view 3`

After running, briefly summarize the outcome and **always include the
`View: file://…` URL** the CLI printed at the end so the user can click
it to open the rendered ledger in a browser. If `.claude-issues/` doesn't
exist yet, suggest `/issues init`.
