---
name: claude-issues
description: Use whenever you're asked to fix, investigate, or work on issues in a project that has a `.claude-issues/` folder. Reads the persistent issue ledger so you know what's open, fixed, or archived across sessions; checks for prior fixes before starting; updates statuses (`open` / `fixed` / `wontfix` / `superseded` / `duplicate`); links related issues; and posts a clickable browser viewer URL at the end of every reply about issues.
---

# claude-issues

This project uses a persistent issue ledger stored in `.claude-issues/` at
the project root. It survives Claude Code sessions: what was fixed last
week is still marked fixed today, and you can see _why_ things were fixed.

## The CLI

The CLI is bundled inside this plugin at
`${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs`. **Always invoke it via this path** so
you never collide with an unrelated package on npm. Set a shell variable
once at the start of any session that uses it:

```
CI="${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs"
node "$CI" list --all
```

Every example below assumes `CI` is set this way. If you forget, just
write the full path: `node "${CLAUDE_PLUGIN_ROOT}/bin/cli.cjs" …`.

## When to invoke this skill

- Any time the user asks you to "work on issues," "fix this," "look into
  X," "pick up where we left off," or anything that sounds like project
  work — if `.claude-issues/` exists in the project, this skill applies.
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
Closed issues remain part of the audit trail and you must still consider
them when deciding what to work on.

## Step 1 — Always read the ledger first

```
node "$CI" list --all
```

…or read `.claude-issues/INDEX.md` directly. **Do not assume project state
from memory.**

## Step 2 — Check for prior fixes (CRITICAL — duplicate detection)

Before starting work on a new request, you **must** check whether the
same problem has been addressed before. This prevents re-fixing things
and creates a real audit trail.

Heuristics, in order:

1. **By file paths.** If the user mentions specific files, scan the
   ledger for any issue (open OR closed) whose `files` overlap:
   ```
   grep -l "src/auth/Login.tsx" .claude-issues/{open,fixed,archive}/*.md 2>/dev/null
   ```
2. **By keyword.** Search titles for distinctive words from the request
   ("safari," "login," "dashboard query," etc.).
3. **Show the user what you found.** If matches exist (especially `fixed`
   ones), do **not** silently start working. Surface them:

   > "I see you fixed `ISSUE-007 — Login broken on Safari` last month
   > with note 'Bound onClick handler.' Is the new request a regression
   > of that fix, an intentional second pass with a different approach,
   > or something different? Options:
   > - **Reopen** ISSUE-007 if it's the same bug back:
   >   `node "$CI" reopen 7`
   > - **New issue that supersedes** the old one if you want a different
   >   fix recorded:
   >   `node "$CI" add ... --supersedes 7`
   > - **Mark as duplicate** if it turns out to already be tracked:
   >   `node "$CI" link <new-id> --duplicate-of 7`"
4. Only proceed once the user confirms intent.

## Step 3 — While working

- Read the issue's full markdown file (not just the index summary) so you
  see prior fix notes from earlier sessions.
- Record meaningful progress as you go:
  ```
  node "$CI" note <id> "Investigated X; root cause is Y."
  ```
  These notes survive context resets and let future sessions pick up.

## Step 4 — Closing an issue

Pick the right closure based on outcome:

- **Verified fix:**
  ```
  node "$CI" fix <id> --note "Bound onClick handler in src/auth/Login.tsx"
  ```
- **Won't fix** (out of scope / declined):
  ```
  node "$CI" wontfix <id> --note "Decided not to support Safari 15."
  ```
- **Replaced by a different approach** (preserves the old as audit):
  ```
  node "$CI" add -t "New approach to login fix" -s high --supersedes <old-id>
  ```
  → old issue automatically becomes `superseded` and links forward.
- **It was a duplicate**:
  ```
  node "$CI" link <id> --duplicate-of <other-id>
  ```

Only mark fixed after you have **actually verified** the fix (ran tests,
reproduced the bug and confirmed it's gone, or got user confirmation).

## Step 5 — Post the browser viewer link at the end

Every CLI command prints a `View: file://…` URL. **Always include this
URL at the end of any reply that involved adding, updating, or closing
issues** so the user can click through to the rendered ledger.

**Format the URL as a markdown link, never wrapped in backticks** —
backticks render as inline code and are not clickable. Some chat UIs
also strip plain `file://` URLs.

Good (chat UI renders this as a real link):
> Done. ISSUE-008 is now fixed.
>
> 🔗 [View ISSUE-008 in browser](file:///abs/path/.claude-issues/_html/ISSUE-008.html)

Bad (renders as inline code, not clickable):
> 🔗 View: `file:///abs/path/.claude-issues/_html/ISSUE-008.html`

If a `file://` link won't open in the user's environment (some chat UIs
block them for security), tell them to either:

1. Run `/issues view` — the CLI will shell `open` (or `xdg-open`) and
   open the page in the OS default browser directly.
2. Run `/issues serve` — the CLI starts a tiny local HTTP server and
   prints a clickable `http://localhost:<port>/` URL that works in every
   environment. The server stays running until they Ctrl+C it; pages
   reflect the latest CLI writes on every refresh.

## Adding new issues mid-task

If you discover a new bug while working on something else, log it instead
of derailing:

```
node "$CI" add -t "..." -s medium -f "src/foo.ts" -d "..."
```

The CLI will warn you if it finds candidates of past similar work —
surface that warning to the user before continuing.

## ID format

`1`, `001`, and `ISSUE-001` all resolve to the same issue. Use whichever
is shortest in your reply.

## What this skill replaces

Without this skill, Claude has no memory of project issues across
sessions. You re-explain the same context, miss what was already fixed,
and sometimes "fix" things that were already fixed last week — without
an audit trail. This skill plus the ledger eliminates all of that.
