# claude-issues

A persistent, markdown-based issue ledger for Claude Code projects — with
a built-in browser viewer, status audit trail, and cross-issue links.

You spot issues during the day. Claude (in any future session) reads the
ledger, checks for prior work touching the same files, picks issues, fixes
them, and closes them — all using the same CLI. No database. Just markdown
files in `.claude-issues/` inside your project, fully git-trackable.

## Why

Claude Code sessions get cleared, restarted, or compacted. There is no
shared memory of "what's already fixed in this project" vs. "what's still
open." This tool gives every project a durable, audit-friendly ledger that
survives sessions, so Claude always knows the current state when you start
a new conversation — and so you have a real history of how each problem
was decided.

## Install

Pick either, or both.

### As an npm CLI

```bash
npm install -g claude-issues
# or use directly without install:
npx claude-issues init
```

### As a Claude Code plugin

```
/plugin marketplace add <your-github-user>/claude-issues
/plugin install claude-issues
```

The plugin installs a paired `claude-issues` skill (auto-activates when
`.claude-issues/` exists) and a `/issues` slash command that wraps the CLI.

## Quick start

```bash
cd ~/your-project
claude-issues init
claude-issues add -t "Login button broken on Safari" -s high -f "src/auth/Login.tsx"
claude-issues list
claude-issues view          # open the browser viewer
```

Now open Claude Code in that project. The skill picks up `.claude-issues/`
automatically, reads the index, checks for past similar fixes, and is
ready to work on open issues.

## Statuses

| Status | Meaning |
|---|---|
| `open` | Active. Needs work. |
| `fixed` | Verified fixed. Lives in `.claude-issues/fixed/`. |
| `wontfix` | Closed without fixing (declined / out of scope). |
| `superseded` | Replaced by a newer issue (`superseded_by` points forward). |
| `duplicate` | Same as another issue (`duplicate_of` points to it). |

`fixed`, `wontfix`, `superseded`, and `duplicate` are all _closed_ states
and live in `archive/` (except `fixed`, which keeps its own `fixed/`
folder for visibility). Closed issues stay part of the audit trail.

## Commands

| Command | What it does |
|---|---|
| `claude-issues init` | Create `.claude-issues/` in the current directory |
| `claude-issues add` | Add an issue (interactive or `-t -s -f -d`); warns if similar past issues exist |
| `claude-issues list [--open\|--fixed\|--archive\|--all]` | List issues (default: open) |
| `claude-issues show <id>` | Print an issue's full markdown |
| `claude-issues fix <id> [--note "..."]` | Mark fixed; move to `fixed/` |
| `claude-issues wontfix <id> [--note "..."]` | Close without fixing |
| `claude-issues reopen <id>` | Move any closed issue back to `open/` |
| `claude-issues note <id> "<text>"` | Append a timestamped progress note |
| `claude-issues link <id> --supersedes <old>` | New issue replaces an older one (old → `superseded`) |
| `claude-issues link <id> --duplicate-of <other>` | Mark `<id>` as a duplicate of another |
| `claude-issues link <id> --related <other>` | Add a bidirectional related link |
| `claude-issues view [id] [--no-open]` | Open the browser viewer |

`add --supersedes <id>` is a shortcut: create a new issue and immediately
mark the older one as superseded.

IDs accept `1`, `001`, or `ISSUE-001` interchangeably.

## Browser viewer

Every CLI write also regenerates a static HTML site at
`.claude-issues/_html/index.html`. Each command prints a clickable
`file://…` URL at the end of its output:

```
View: file:///abs/path/.claude-issues/_html/ISSUE-008.html
```

Click it (or run `claude-issues view`) to browse a styled, navigable
ledger with severity / status badges and links between superseded,
duplicate, and related issues.

The skill instructs Claude to include this URL at the end of any reply
that touches issues, so a click takes you straight to the rendered page.

## On-disk layout

```
.claude-issues/
  INDEX.md                       # auto-generated entry point for Claude
  _html/                         # browser viewer (gitignored)
    index.html
    ISSUE-001.html …
  open/
    ISSUE-003-slow-dashboard-query.md
  fixed/
    ISSUE-001-login-broken-on-safari.md
  archive/                       # wontfix · superseded · duplicate
    ISSUE-002-…-superseded.md
    ISSUE-005-…-duplicate.md
    ISSUE-006-…-wontfix.md
```

Each issue file has YAML frontmatter (`id`, `title`, `status`, `severity`,
`files`, `created`, `fixed_at`, `closed_at`, `supersedes`,
`superseded_by`, `duplicate_of`, `related`) and a markdown body with
description, repro steps, and an auto-appended "Fix notes" section.

## How Claude uses it

The bundled skill instructs Claude to:

1. Read `.claude-issues/INDEX.md` first to learn project state.
2. **Before fixing**, scan the ledger (open + fixed + archive) for prior
   work touching the same files or keywords. If it finds a match, ask the
   user whether the new request is a regression (→ reopen), an intentional
   different approach (→ supersede), or a duplicate (→ link).
3. Read the full issue file, including any prior fix notes.
4. Record progress with `claude-issues note <id> "..."` as it works.
5. Verify the fix, then close with the right command:
   - `fix` for verified fixes
   - `wontfix` for declined / out-of-scope
   - `link --duplicate-of` if it turns out to be a duplicate
   - `add --supersedes <old>` if it's a different fix for the same problem
6. Post the `View: file://…` URL at the end of every reply.

## License

MIT
