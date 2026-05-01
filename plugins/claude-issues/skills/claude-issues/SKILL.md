---
name: claude-issues
description: Use whenever you're asked to fix, investigate, or work on issues in a project that has a `.claude-issues/` folder. Reads the persistent issue ledger so you know what's open, fixed, or archived across sessions; checks for prior fixes before starting; updates statuses (`open` / `fixed` / `wontfix` / `superseded` / `duplicate`); links related issues; and posts a clickable browser viewer URL at the end of every reply about issues.
---

# claude-issues

This project uses a persistent issue ledger stored in `.claude-issues/` at the
project root. It survives Claude Code sessions: what was fixed last week is
still marked fixed today, and you can see _why_ things were fixed and by
whom.

## When to invoke this skill

- Any time the user asks you to "work on issues," "fix this," "look into X,"
  "pick up where we left off," or anything that sounds like project work —
  if `.claude-issues/` exists in the project, this skill applies.
- At the start of any session in a project with `.claude-issues/INDEX.md`.

## Statuses you'll work with

| Status | Meaning |
|---|---|
| `open` | Active. Needs work. |
| `fixed` | Verified fixed. Lives in `.claude-issues/fixed/`. |
| `wontfix` | Closed without fixing (declined / out of scope). |
| `superseded` | Replaced by a newer issue (see `superseded_by`). |
| `duplicate` | Same as another issue (see `duplicate_of`). |

`fixed`, `wontfix`, `superseded`, and `duplicate` are all _closed_ states.
Closed issues remain part of the audit trail and Claude must still consider
them when deciding what to work on.

## Step 1 — Always read the ledger first

Before doing anything else, run:

```
npx claude-issues list --all
```

…or read `.claude-issues/INDEX.md` directly. This shows open, fixed, and
archived issues with their links. **Do not assume project state from
memory.**

## Step 2 — Check for prior fixes (CRITICAL — duplicate detection)

Before starting work on a new request from the user, you **must** check
whether the same problem has been addressed before. This prevents
re-fixing things and creates a real audit trail.

Heuristics (in order):

1. **By file paths.** If the user's request mentions specific files, scan
   the ledger for any issue (open OR closed) whose `files` overlap. Run
   something like:
   ```
   grep -l "src/auth/Login.tsx" .claude-issues/{open,fixed,archive}/*.md
   ```
2. **By keyword.** Search titles for distinctive words from the user's
   request — e.g., "safari," "login," "dashboard query."
3. **Show the user what you found.** If matches exist (especially if any
   are `fixed`), do **not** silently start working. Surface them:
   > "I see you fixed `ISSUE-007 — Login broken on Safari` last month
   > with note 'Bound onClick handler.' Is the new request a regression
   > of that fix, an intentional second pass with a different approach,
   > or something different? Options:
   > - **Reopen** ISSUE-007 if it's the same bug back: `npx claude-issues reopen 7`
   > - **New issue that supersedes** the old one if you want a different fix recorded:
   >   `npx claude-issues add ... --supersedes 7`
   > - **Mark as duplicate** if it turns out to already be tracked:
   >   `npx claude-issues link <new-id> --duplicate-of 7`"
4. Only proceed once the user confirms intent.

## Step 3 — While working

- Read the issue's full file (not just the index summary) so you see prior
  fix notes from earlier sessions.
- Record meaningful progress as you go:
  ```
  npx claude-issues note <id> "Investigated X; root cause is Y."
  ```
  These notes survive context resets and let future sessions pick up.

## Step 4 — Closing an issue

Pick the right closure based on outcome:

- **Verified fix:**
  ```
  npx claude-issues fix <id> --note "Bound onClick handler in src/auth/Login.tsx"
  ```
- **Won't fix** (out of scope / declined):
  ```
  npx claude-issues wontfix <id> --note "Decided not to support Safari 15."
  ```
- **Replaced by a different approach** (preserves the old as audit):
  ```
  npx claude-issues add -t "New approach to login fix" -s high --supersedes <old-id>
  ```
  → old issue automatically becomes `superseded` and links forward to the new one.
- **It was a duplicate**:
  ```
  npx claude-issues link <id> --duplicate-of <other-id>
  ```

Only mark fixed after you have **actually verified** the fix (ran tests,
reproduced the bug and confirmed it's gone, or got user confirmation).

## Step 5 — Post the browser viewer link at the end

Every CLI command prints a `View: file://…` URL. **Always include this URL
at the end of any reply that involved adding, updating, or closing
issues** so the user can click and see the rendered ledger in a browser.

Example end-of-reply:
> Done. ISSUE-008 is now fixed.
>
> 🔗 View: `file:///abs/path/.claude-issues/_html/ISSUE-008.html`

If the user just wants to browse, run `npx claude-issues view` (no id) and
post the printed URL. The link is clickable in most terminals.

## Adding new issues mid-task

If you discover a new bug while working on something else, log it instead
of derailing:

```
npx claude-issues add -t "..." -s medium -f "src/foo.ts" -d "..."
```

The CLI will warn you if it finds candidates of past similar work — surface
that warning to the user before continuing.

## ID format

`1`, `001`, and `ISSUE-001` all resolve to the same issue. Use whichever is
shortest in your response.

## What this skill replaces

Without this skill, Claude has no memory of project issues across sessions.
You re-explain the same context, miss what was already fixed, and sometimes
"fix" things that were already fixed last week — without an audit trail.
This skill plus the ledger eliminates all of that.
