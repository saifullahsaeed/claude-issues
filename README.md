# claude-issues

A persistent, markdown-based issue ledger Claude Code plugin — with a
built-in browser viewer, status audit trail, and cross-issue links.

You spot issues during the day. Claude (in any future session) reads the
ledger, checks for prior work touching the same files, picks issues,
fixes them, and closes them. No database. Just markdown files in
`.claude-issues/` inside your project, fully git-trackable.

## Why

Claude Code sessions get cleared, restarted, or compacted. There is no
shared memory of "what's already fixed in this project" vs. "what's still
open." This plugin gives every project a durable, audit-friendly ledger
that survives sessions, so Claude always knows the current state when you
start a new conversation — and so you have a real history of how each
problem was decided.

## Install

In Claude Code:

```
/plugin marketplace add saifullahsaeed/claude-issues
/plugin install claude-issues@claude-issues
```

That's it. The CLI ships bundled inside the plugin — there's nothing to
install from npm.

## Quick start

In any project, just start using it — the ledger auto-creates on first
use:

```
/claude-issues:issues add
/claude-issues:issues list
/claude-issues:issues view     # opens .claude-issues/_html/index.html in your browser
/claude-issues:issues serve    # for a clickable http://localhost URL
```

The bundled `claude-issues` skill auto-activates whenever you ask Claude
to fix or investigate something: it reads the ledger first, checks for
past similar fixes before starting new work, and posts a browser URL at
the end of any reply that touched issues.

Depending on Claude Code version and conflicts, the slash command may
also show as just `/issues` in autocomplete. Both forms work.

## Statuses

| Status | Meaning |
|---|---|
| `open` | Active. Needs work. |
| `fixed` | Verified fixed. Lives in `.claude-issues/fixed/`. |
| `wontfix` | Closed without fixing (declined / out of scope). |
| `superseded` | Replaced by a newer issue (`superseded_by` points forward). |
| `duplicate` | Same as another issue (`duplicate_of` points to it). |

`fixed`, `wontfix`, `superseded`, and `duplicate` are all _closed_ states
and contribute to the audit trail. Closed issues live in `archive/`
(except `fixed`, which keeps its own `fixed/` folder for visibility).

## Slash command

The `/claude-issues:issues` command in Claude Code wraps everything
(may also be available as just `/issues`):

| Subcommand | What it does |
|---|---|
| `add` | Add an issue (interactive); warns if similar past issues exist |
| `list` / `list fixed` / `list archive` / `list all` | List issues |
| `show <id>` | Print an issue's full markdown |
| `fix <id> "<note>"` | Mark fixed; move to `fixed/` |
| `wontfix <id> "<note>"` | Close without fixing |
| `reopen <id>` | Move any closed issue back to `open/` |
| `note <id> "<text>"` | Append a timestamped progress note |
| `link <id> supersedes <old>` | New issue replaces an older one |
| `link <id> duplicate-of <other>` | Mark `<id>` as a duplicate |
| `link <id> related <other>` | Add a bidirectional related link |
| `view [id]` | Open the browser viewer (file://) |
| `serve [port]` | Start a local HTTP server for a clickable http://localhost URL |
| `init` | Optional — every other command auto-creates the ledger if missing |

IDs accept `1`, `001`, or `ISSUE-001` interchangeably.

## Browser viewer

Every CLI write also regenerates a static HTML site at
`.claude-issues/_html/index.html`. Each command prints a clickable
`file://…` URL at the end of its output:

```
View: file:///abs/path/.claude-issues/_html/ISSUE-008.html
```

Click it (or run `/issues view`) to browse a styled, navigable ledger
with severity / status badges and links between superseded, duplicate,
and related issues. The skill instructs Claude to always post this URL
at the end of any reply that touches issues.

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

The bundled `claude-issues` skill instructs Claude to:

1. Read `.claude-issues/INDEX.md` first to learn project state.
2. **Before fixing**, scan the ledger (open + fixed + archive) for prior
   work touching the same files or keywords. If it finds a match, ask
   the user whether the new request is a regression (→ reopen), an
   intentional different approach (→ supersede), or a duplicate (→ link).
3. Read the full issue file, including any prior fix notes.
4. Record progress with `note <id> "..."` as it works.
5. Verify the fix, then close with the right command:
   - `fix` for verified fixes
   - `wontfix` for declined / out-of-scope
   - `link --duplicate-of` if it turns out to be a duplicate
   - `add --supersedes <old>` if it's a different fix for the same problem
6. Post the `View: file://…` URL at the end of every reply.

## Contributing / building locally

```
git clone https://github.com/saifullahsaeed/claude-issues
cd claude-issues
npm install
npm run build      # rebuilds plugins/claude-issues/bin/cli.cjs
```

The bundled CLI at `plugins/claude-issues/bin/cli.cjs` is committed so
plugin users don't need to build anything.

## License

MIT
