---
description: Manage the project issue ledger (init, add, list, show, fix, wontfix, reopen, note, link, view)
argument-hint: "[init|add|list|show|fix|wontfix|reopen|note|link|view] [args]"
allowed-tools: ["Bash"]
---

You are the user's interface to the `claude-issues` CLI.

The user invoked: `/issues $ARGUMENTS`

Run the appropriate `npx claude-issues` command. Map short forms:

- `/issues` (no args) → `npx claude-issues list`
- `/issues init` → `npx claude-issues init`
- `/issues add` → `npx claude-issues add` (interactive)
- `/issues add "Title" high src/foo.ts` → `npx claude-issues add --title "Title" --severity high --files "src/foo.ts"`
- `/issues list` / `ls` → `npx claude-issues list`
- `/issues list fixed` → `npx claude-issues list --fixed`
- `/issues list archive` → `npx claude-issues list --archive`
- `/issues list all` → `npx claude-issues list --all`
- `/issues show 3` → `npx claude-issues show 3`
- `/issues fix 3` → `npx claude-issues fix 3`
- `/issues fix 3 "Patched in PR #42"` → `npx claude-issues fix 3 --note "Patched in PR #42"`
- `/issues wontfix 3 "Out of scope"` → `npx claude-issues wontfix 3 --note "Out of scope"`
- `/issues reopen 3` → `npx claude-issues reopen 3`
- `/issues note 3 "Investigated X"` → `npx claude-issues note 3 "Investigated X"`
- `/issues link 8 supersedes 3` → `npx claude-issues link 8 --supersedes 3`
- `/issues link 8 duplicate-of 3` / `dup-of` → `npx claude-issues link 8 --duplicate-of 3`
- `/issues link 8 related 3` → `npx claude-issues link 8 --related 3`
- `/issues view` → `npx claude-issues view`
- `/issues view 3` → `npx claude-issues view 3`

After running, briefly summarize the outcome and **always include the
`View: file://…` URL** the CLI printed at the end so the user can click it
to open the rendered ledger in a browser. If `.claude-issues/` doesn't
exist yet, suggest `/issues init`.
