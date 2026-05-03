---
description: Show PlumBoard task summary — list boards, view tasks by status, and check what's assigned to you.
---

# PlumBoard Status

Show a summary of the current project's PlumBoard. One CLI call gives you auth state, board context (auto-detected from `.plumboard.json`), and tasks grouped by status.

## Step

```bash
plum status -o json
```

That's it. The command:

- Auto-refreshes an expired token (no separate `auth status` needed).
- Reads `.plumboard.json` from the current directory (walks upward, like git) to determine which board to show.
- Returns auth + board metadata + tasks grouped by status in one structured payload.

If the user asked about a specific board they're not currently in, pass `--board <UUID>` to override.

## Response Shape

Single board (when `.plumboard.json` is present, or `--board` is passed):

```jsonc
{
  "ok": true,
  "scope": "board",
  "scope_source": "config" | "flag",
  "config_path": "/path/to/.plumboard.json" | null,
  "auth": { "logged_in": true, "email": "...", "user_id": "...", "token_valid": true },
  "board": { "id": "...", "name": "...", "url": "https://plumboard.app/board/..." },
  "summary": { "todo": 4, "in_progress": 2, "done": 18, "discarded": 1, "assigned_to_me": 5 },
  "tasks": {
    "todo":        [ { id, title, status, assigned_to, due_date, tags, ... } ],
    "in_progress": [ ... ],
    "done":        [],   // empty by default — pass --include-done to populate
    "discarded":   []
  }
}
```

Multi-board (no config, no `--board`):

```jsonc
{
  "ok": true,
  "scope": "user",
  "auth": { ... },
  "boards": [ { "id", "name", "url", "summary": { todo, in_progress, done, discarded } } ]
}
```

Auth failure:

```jsonc
{
  "ok": false,
  "auth": { "logged_in": false, "token_valid": false, "reason": "refresh_failed" },
  "next_action": "Run `plum auth login` to re-authenticate."
}
```

When `ok` is `false`, tell the user to run `plum auth login` and stop.

## Useful Filters

- `--mine` — only tasks assigned to the current user
- `--status todo,in-progress` — comma-separated status filter
- `--limit 10` — cap tasks per status group (default 25)
- `--include-done` — include `done` and `discarded` task bodies (always counted in summary regardless)

## Output Format

Present the summary as:

```
## Board: <name>
- Todo: X
- In Progress: Y
- Done: Z (assigned to me: N)

### To-do
- Task title (due YYYY-MM-DD)
- ...

### In Progress
- ...
```

Compute overdue from `due_date` < today and surface those first.

If multi-board mode (no `.plumboard.json`), list each board with its counts and ask the user which one to drill into.
