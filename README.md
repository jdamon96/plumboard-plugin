# PlumBoard Plugin

Task awareness and project management for AI coding tools.

| Tool | Status |
|------|--------|
| Claude Code | Supported |
| Cursor | Planned |
| OpenAI Codex | Planned |

## Getting Started

One command sets up everything:

```bash
npx plumboard init
```

That's it. Here's what happens when you run it:

1. **Authenticates** — checks if you're logged in, opens the browser for Google OAuth if not
2. **Creates or links a board** — asks whether to create a new board or link an existing one, then writes a `.plumboard.json` config to your project root
3. **Installs the plugin** — detects your AI coding tools (Claude Code, Cursor) and installs the PlumBoard plugin automatically
4. **Done** — your AI coding assistant now has full task awareness for this project

After setup, open your AI coding tool and ask "what are my to-dos?" — it just works.

## What it does

- **Auto-detects** the project's board from `.plumboard.json` at session start — no manual configuration needed
- **Injects CLI skill** when you ask task-related questions ("what are my to-dos?", "create a task", "what should I work on?")
- **Slash commands:**
  - `/plumboard:status` — summary of all boards and task counts
  - `/plumboard:board <id>` — detailed Kanban view of a specific board

## How it works

The plugin uses two lifecycle hooks:

1. **SessionStart** — Checks if `plum` is installed and authenticated. Reads `.plumboard.json` to identify the project's board and injects ready-to-use commands with the correct board ID. If no project config exists, lists all boards and suggests running `plum init`.
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
