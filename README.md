# claude-issues

A persistent, markdown-based issue ledger for Claude Code projects.

You spot issues during the day. Claude (in any future session) reads the
ledger, picks open issues, fixes them, and marks them done — all using the
same CLI commands. No database. Just markdown files in `.claude-issues/`
inside your project, fully git-trackable.

## Why

Claude Code sessions get cleared, restarted, or compacted. There is no
shared memory of "what's already fixed in this project" vs. "what's still
open." This tool gives every project a durable issue ledger that survives
sessions, so Claude always knows the current state when you start a new
conversation.

## Install

You can use this two ways — pick whichever, or both.

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
```

Now open Claude Code in that project. The skill picks up `.claude-issues/`
automatically, reads the index, and is ready to work on open issues.

## Commands

| Command | What it does |
|---|---|
| `claude-issues init` | Create `.claude-issues/` in the current directory |
| `claude-issues add` | Add an issue (interactive, or pass `-t -s -f -d`) |
| `claude-issues list [--open\|--fixed\|--all]` | List issues (default: open) |
| `claude-issues show <id>` | Print an issue's full markdown |
| `claude-issues fix <id> [--note "..."]` | Mark fixed; move to `fixed/` |
| `claude-issues reopen <id>` | Move a fixed issue back to `open/` |
| `claude-issues note <id> "<text>"` | Append a timestamped progress note |

IDs accept `1`, `001`, or `ISSUE-001` interchangeably.

## On-disk layout

```
.claude-issues/
  INDEX.md                       # auto-generated entry point
  open/
    ISSUE-001-login-broken.md
  fixed/
    ISSUE-000-typo-header.md
```

Each issue file has YAML frontmatter (`id`, `title`, `status`, `severity`,
`files`, `created`, `fixed_at`) and a markdown body with description,
repro steps, and an auto-appended "Fix notes" section.

`INDEX.md` is regenerated on every CLI write, so a single read of that file
gives Claude the full picture of the project's open and recently-fixed work.

## How Claude uses it

The bundled skill instructs Claude to:

1. Read `.claude-issues/INDEX.md` first to learn project state.
2. Pick the highest-severity open issue (or whichever the user names).
3. Read the full issue file, including any prior fix notes.
4. Record progress with `claude-issues note <id> "..."` as it works.
5. Verify the fix, then run `claude-issues fix <id> --note "..."` to close.

Reopen, don't recreate, when a "fixed" issue resurfaces — that preserves
the full debugging history.

## License

MIT
