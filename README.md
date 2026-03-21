# PlumBoard Plugin

Task awareness and project management for AI coding tools.

| Tool | Status |
|------|--------|
| Claude Code | Supported |
| Cursor | Planned |
| OpenAI Codex | Planned |

## Install

```bash
npx plugins add jdamon96/plumboard-plugin
```

Or in Claude Code:

```
/plugin install plumboard
```

## Prerequisites

The [PlumBoard CLI](https://github.com/jdamon96/plumboard) (`plum`) must be installed and authenticated:

```bash
npm install -g plumboard
plum auth login
```

## What it does

- **Auto-detects** the `plum` CLI at session start and injects board context
- **Injects CLI skill** when you ask task-related questions ("what are my to-dos?", "create a task", etc.)
- **Slash commands:**
  - `/plumboard:status` — summary of all boards and task counts
  - `/plumboard:board <id>` — detailed Kanban view of a specific board

## How it works

The plugin uses two lifecycle hooks:

1. **SessionStart** — Checks if `plum` is installed and authenticated. If so, lists available boards and injects lightweight context (~500 bytes).
2. **UserPromptSubmit** — Scores the user's prompt against task-management signals. If the prompt is task-related, injects the full CLI skill (~8KB) with command reference, examples, and troubleshooting.

Skills are deduplicated within a session — the full skill body is injected at most once.

## Development

```bash
npm install
npm run build        # Build hooks + manifest
npm run typecheck    # TypeScript check
```

## License

MIT
