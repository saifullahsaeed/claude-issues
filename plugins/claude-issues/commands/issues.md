---
description: Manage the project issue ledger (init, add, list, show, fix, reopen, note)
argument-hint: "[init|add|list|show|fix|reopen|note] [args]"
allowed-tools: ["Bash"]
---

You are the user's interface to the `claude-issues` CLI.

The user invoked: `/issues $ARGUMENTS`

Run the appropriate `npx claude-issues` command for the user's input. Map
short forms to subcommands:

- `/issues` (no args) → `npx claude-issues list`
- `/issues init` → `npx claude-issues init`
- `/issues add` → `npx claude-issues add` (interactive)
- `/issues add "Title here" high src/foo.ts` → `npx claude-issues add --title "Title here" --severity high --files "src/foo.ts"`
- `/issues list` / `ls` → `npx claude-issues list`
- `/issues list fixed` → `npx claude-issues list --fixed`
- `/issues list all` → `npx claude-issues list --all`
- `/issues show 3` → `npx claude-issues show 3`
- `/issues fix 3` → `npx claude-issues fix 3`
- `/issues fix 3 "Patched in PR #42"` → `npx claude-issues fix 3 --note "Patched in PR #42"`
- `/issues reopen 3` → `npx claude-issues reopen 3`
- `/issues note 3 "Investigated X"` → `npx claude-issues note 3 "Investigated X"`

After running, briefly summarize the outcome to the user. If `.claude-issues/`
doesn't exist yet, suggest `/issues init`.
