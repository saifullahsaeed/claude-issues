---
name: claude-issues
description: Use when working in a project that has a `.claude-issues/` folder. Reads the persistent issue ledger so you know what's open vs. fixed across sessions, picks issues to work on, records progress, and closes them via the `claude-issues` CLI.
---

# claude-issues

This project uses a persistent issue ledger stored in `.claude-issues/` at the
project root. The ledger survives Claude Code sessions, so what was fixed last
week is still marked fixed today.

## When to invoke this skill

- Any time the user asks you to "work on issues," "fix issues," "pick up where
  we left off," or similar — and `.claude-issues/` exists in the project.
- Whenever a session starts in a project that has `.claude-issues/INDEX.md`.

## Before doing anything

1. **Read `.claude-issues/INDEX.md` first.** It is the source of truth for
   what's open and what's recently fixed. Do not assume; do not guess.
2. If the user asked about a specific issue ID, run `npx claude-issues show <id>`
   to see its full markdown (description, repro, prior fix notes).
3. If the user asked to "work on issues" without specifying, pick the
   highest-severity open issue (`critical` > `high` > `medium` > `low`).
   Confirm your choice with the user before starting.

## While working on an issue

- Read the issue's full file (don't rely on the INDEX summary alone) so you
  see the existing fix notes from prior sessions — you may be continuing
  someone else's work.
- Record meaningful progress as you go:
  ```
  npx claude-issues note <id> "Investigated X; root cause is Y"
  ```
  These notes survive context resets and help future sessions pick up.

## Closing an issue

- Only mark an issue fixed after you have **verified the fix** (ran tests,
  reproduced and confirmed the bug is gone, or got user confirmation).
- Then:
  ```
  npx claude-issues fix <id> --note "Fixed by changing X in src/foo.ts"
  ```
- This moves the file to `.claude-issues/fixed/` and regenerates the index.

## Reopening

If a "fixed" issue resurfaces, do not create a new issue — reopen the
existing one so its history is preserved:

```
npx claude-issues reopen <id>
```

## Adding new issues

If you discover a new bug while working that is out of scope for the current
issue, add it instead of derailing the current task:

```
npx claude-issues add --title "..." --severity medium --files "src/foo.ts" --description "..."
```

## ID format

Both `1`, `001`, and `ISSUE-001` are accepted by every command.

## What this skill replaces

Without this skill, Claude has no memory of project issues across sessions.
You would re-explain the same context, miss what was already fixed, and
sometimes "fix" things that were already fixed last week. This skill plus
the ledger eliminates that.
