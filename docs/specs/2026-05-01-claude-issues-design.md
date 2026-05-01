# claude-issues — Design Spec

**Date:** 2026-05-01
**Status:** Approved (brainstorming session, auto mode)
**Time budget:** ~1 hour of supervised build

## 1. Problem

When working with Claude Code across multiple sessions, there is no shared
durable record of "issues found in this project" vs. "issues already fixed."
Sessions get cleared, restarted, or compacted; Claude loses track of what's
done and what's outstanding. Today the user works around this by re-explaining
context in every session.

## 2. Goal

A tiny CLI + paired Claude Code skill that gives every project a persistent,
human-readable issue ledger Claude can read and update across sessions.

- The user spots issues during the day and logs them via the CLI.
- Claude (in any future session) reads the ledger, picks open issues, fixes
  them, and marks them done — all using the same CLI commands.
- Storage is plain markdown inside the project, so it is git-trackable and
  needs no database.

## 3. Non-goals (v1)

- No SQLite or other database.
- No GitHub/Jira/Linear sync.
- No web UI, TUI, or remote storage.
- No multi-user collaboration features.
- No automated test suite (manual smoke test only — defer to v2).
- No fuzzy search / full-text index.

## 4. Architecture

Single GitHub repo `claude-issues`. The same repo produces two artifacts:

1. **npm package** `claude-issues` — standalone CLI. Installable via
   `npm i -g claude-issues` or invokable via `npx claude-issues`.
2. **Claude Code plugin** — same repo doubles as a Claude Code marketplace.
   Ships a skill + `/issues` slash command that shells out to the CLI
   (via `npx claude-issues …` so it works whether or not the CLI is
   globally installed).

Storage is per-project, in `.claude-issues/` inside whatever directory the
user runs the CLI in. No global state.

## 5. On-disk format

```
.claude-issues/
  INDEX.md                       # auto-regenerated entry point for Claude
  open/
    ISSUE-001-login-broken.md
    ISSUE-002-slow-query.md
  fixed/
    ISSUE-000-typo-header.md     # moved here on `fix`
```

Each issue file:

```markdown
---
id: ISSUE-001
title: Login button does nothing on Safari
status: open
severity: high            # low | medium | high | critical
files:
  - src/auth/Login.tsx
created: 2026-05-01T10:14:00Z
fixed_at: null
---

## Description
Clicking submit on Safari 17 silently fails.

## Repro
1. Open /login on Safari
2. Click "Sign in"
3. Nothing happens; no network request.

## Fix notes
<!-- Claude appends progress here as it works -->
```

`INDEX.md` is regenerated on every CLI write. Format:

```markdown
# Claude Issues — Project Ledger

> Read this file first. Open issues are work to do; fixed issues are done.

## Open

| ID | Title | Severity | Files |
|----|-------|----------|-------|
| 001 | Login button does nothing on Safari | high | src/auth/Login.tsx |
| 002 | Slow query on dashboard | medium | src/api/dashboard.ts |

## Recently fixed (last 10)

| ID | Title | Fixed |
|----|-------|-------|
| 000 | Typo in header | 2026-04-30 |
```

## 6. CLI commands

| Command | Behavior |
|---|---|
| `claude-issues init` | Creates `.claude-issues/{open,fixed}/`, writes `INDEX.md`, appends a pointer to `CLAUDE.md` if present. |
| `claude-issues add` | Interactive prompt (or `--title --severity --files --description`); allocates next `ISSUE-NNN`; regenerates `INDEX.md`. |
| `claude-issues list [--open\|--fixed\|--all]` | Pretty terminal table. Defaults to `--open`. |
| `claude-issues show <id>` | Prints the issue's markdown file to stdout. |
| `claude-issues fix <id> [--note "..."]` | Sets `status: fixed`, stamps `fixed_at`, moves file to `fixed/`, regenerates index. |
| `claude-issues reopen <id>` | Reverse of `fix`; clears `fixed_at`, moves back to `open/`. |
| `claude-issues note <id> "<text>"` | Appends a timestamped line under "Fix notes" in the issue file. |

ID lookup accepts `001`, `1`, or `ISSUE-001` — all resolve to the same file.

## 7. Claude Code plugin

- **Skill** `skills/claude-issues/SKILL.md` — auto-activates when
  `.claude-issues/` exists in the project. Instructs Claude to:
  1. Read `.claude-issues/INDEX.md` first to see project state.
  2. Pick an open issue (highest severity first unless told otherwise).
  3. Read the full issue file.
  4. Do the fix.
  5. Append progress with `claude-issues note <id> "..."`.
  6. After verifying the fix, run `claude-issues fix <id>`.
- **Slash command** `commands/issues.md` — wraps `/issues add`, `/issues list`,
  `/issues fix <id>`. Just shells to the CLI.
- **`plugin.json`** — Claude Code plugin manifest.
- **`marketplace.json`** at repo root — lets users `/plugin marketplace add`
  this repo directly.

## 8. Stack & dependencies

- **TypeScript + Node 20+**, compiled to `dist/`
- Runtime deps: `commander` (CLI), `gray-matter` (frontmatter), `chalk`
  (color), `cli-table3` (lists), `prompts` (interactive add)
- Build: `tsup` (single config, fast)
- Tests: deferred to v2

## 9. Repo layout

```
claude-issues/
  package.json                       # "bin": { "claude-issues": "dist/cli.js" }
  tsconfig.json
  tsup.config.ts
  README.md
  src/
    cli.ts                           # commander entry
    storage.ts                       # read/write .claude-issues/ files
    index-md.ts                      # regenerate INDEX.md
    ids.ts                           # allocate next ID, parse user input
    types.ts                         # Issue type + frontmatter shape
    commands/
      init.ts  add.ts  list.ts  show.ts  fix.ts  reopen.ts  note.ts
  .claude-plugin/
    marketplace.json                 # this repo IS a Claude Code marketplace
  plugins/
    claude-issues/
      .claude-plugin/plugin.json
      skills/claude-issues/SKILL.md
      commands/issues.md
  docs/
    specs/2026-05-01-claude-issues-design.md   # this file
```

## 10. Distribution

- **npm:** `npm publish` from repo root. Users: `npm i -g claude-issues`.
- **Claude Code marketplace:** push repo to GitHub public.
  Users: `/plugin marketplace add <user>/claude-issues` then
  `/plugin install claude-issues`. The plugin shells out via
  `npx claude-issues …`, so it works whether or not the user globally
  installed the npm package.

## 11. Build order (target ~1 hour)

1. Repo skeleton, `package.json`, `tsconfig.json`, `tsup.config.ts` (5 min)
2. `types.ts`, `storage.ts`, `ids.ts`, `index-md.ts` (10 min)
3. CLI commands `init`, `add`, `list`, `show`, `fix`, `reopen`, `note` (20 min)
4. Plugin manifests + SKILL.md + slash command (10 min)
5. Smoke test in a sample project; fix bugs (10 min)
6. README, first commit, push to GitHub, `npm publish` (5 min)

## 12. Acceptance criteria for v1 ship

- `npx claude-issues init` in any directory creates the folder structure.
- `npx claude-issues add` then `list` shows the issue.
- `claude-issues fix 1` moves the file to `fixed/` and regenerates `INDEX.md`.
- The plugin installs via `/plugin marketplace add` and the `/issues` slash
  command works from inside Claude Code.
- The skill auto-activates when `.claude-issues/` is present and Claude
  successfully reads `INDEX.md`, picks an issue, runs `note` and `fix`.
- README documents both install paths (npm + Claude Code plugin).
