---
name: plumboard-cli
description: Guides usage of the PlumBoard CLI (plum) for managing Kanban boards, tasks, tags, comments, and members. Use when user asks to manage a PlumBoard board, create or move tasks, run plum commands, or asks about to-dos or project status.
metadata:
  priority: 5
  docs:
    - https://github.com/jdamon96/plumboard
  bashPatterns:
    - "^\\s*plum(?:\\s|$)"
    - "\\bplum\\s+task\\b"
    - "\\bplum\\s+board\\b"
    - "\\bplum\\s+comment\\b"
    - "\\bplum\\s+tag\\b"
    - "\\bplum\\s+member\\b"
    - "\\bplum\\s+auth\\b"
  promptSignals:
    phrases:
      - "what are my to-dos"
      - "what are my todos"
      - "show my tasks"
      - "list tasks"
      - "task status"
      - "create a task"
      - "update task"
      - "move task"
      - "board status"
      - "plumboard"
      - "plum board"
      - "project progress"
      - "what should I work on"
      - "what's left to do"
      - "mark as done"
      - "assign task"
      - "add a to-do"
      - "check my board"
    allOf:
      - [task, list]
      - [task, create]
      - [task, status]
      - [board, status]
      - [task, done]
      - [task, assign]
    anyOf:
      - "task"
      - "todo"
      - "to-do"
      - "kanban"
      - "board"
      - "sprint"
      - "backlog"
    noneOf:
      - "jira"
      - "linear"
      - "asana"
      - "trello"
      - "github issues"
    minScore: 6
  retrieval:
    aliases:
      - plumboard cli
      - plum command line
      - task management
      - kanban board cli
    intents:
      - list tasks
      - create task
      - move task status
      - check to-dos
      - manage board members
      - add comments to tasks
      - organize with tags
    entities:
      - plum CLI
      - plum task
      - plum board
      - plum tag
      - plum comment
    examples:
      - "What are my to-dos?"
      - "Create a task for the auth bug"
      - "Move the design task to in-progress"
      - "Show me what's on the board"
      - "What should I work on next?"
---

# PlumBoard CLI Skill

## Overview

PlumBoard is a Kanban board app. The `plum` CLI lets you manage boards, tasks, comments, tags, and members from the terminal. This skill covers how to operate the CLI as an agent: always use structured JSON output, validate inputs, and follow the correct workflow order.

## Critical Rules

1. **For status / "what are my to-dos" questions, run `plum status -o json` FIRST.** It bundles auth, board context (auto-detected from `.plumboard.json`), and tasks grouped by status into one call. Skip `auth status` and `board list` — `status` does both.
2. **Always pass `-o json`** on every command. This gives structured JSON output with full UUIDs.
3. **Always use full UUIDs** — never truncated 8-char IDs. The CLI rejects non-UUID strings.
4. **Use `--force` on all delete commands** to skip interactive prompts that would hang.
5. **Use `--dry-run`** before destructive or high-stakes mutations to preview the payload.

## One-Shot Status (preferred entry point)

For "what are my to-dos", "what's on the board", "project status", or any read-only check:

```bash
plum status -o json
```

This single call returns:
- Auth state (auto-refreshes an expired token; no separate `auth status` needed)
- Board metadata (auto-detected from `.plumboard.json` in CWD or any parent directory)
- Tasks grouped by status with per-status counts and an `assigned_to_me` count

Filters: `--mine`, `--status todo,in-progress`, `--limit 10`, `--include-done`, `--board <uuid>` (override config).

If the response has `ok: false`, the user needs to run `plum auth login` — surface that and stop.

If `scope` is `"user"` (no `.plumboard.json` found and no `--board`), the response lists boards with summary counts only — drill in by re-running with `--board <uuid>`.

## Auth Setup

`plum status` handles auth implicitly. You only need to call `plum auth status -o json` directly when the user explicitly asks about their auth state.

```bash
plum auth status -o json
# {"logged_in": true, "email": "...", "user_id": "...", "token_valid": true, "refreshed": false}
```

If `token_valid` is false (refresh also failed):
```bash
plum auth login
```
Note: `auth login` opens a browser for Google OAuth — interactive, cannot be fully automated.

## Core Workflow

For mutations and detail drill-ins:

1. **Read state** — `plum status -o json` (one call: auth + board + tasks)
2. **Drill into a task** — `plum task get <TASK_ID> -o json`
3. **Add tasks** — `plum task create --board <BOARD_ID> --title "..." -o json`
4. **Move tasks through statuses** — `plum task move <TASK_ID> in-progress -o json`
5. **Organize with tags** — `plum tag create` then `plum tag assign`
6. **Collaborate** — `plum member add` to invite, `plum comment add` to discuss
7. **Open in browser** — `plum open <BOARD_ID>` to view the board on the web

The board ID for mutations comes from `plum status` (in `board.id`) or from `.plumboard.json` directly.

## Commands Reference

### Boards

```bash
# List all boards (returns array)
plum board list -o json

# Get board details
plum board get <BOARD_ID> -o json

# Create a board (returns {success, id, name})
plum board create "Board Name" -d "Description" -o json

# Update a board
plum board update <BOARD_ID> --name "New Name" -o json

# Delete a board
plum board delete <BOARD_ID> --force -o json
```

### Tasks

Valid statuses: `todo`, `in-progress`, `done`, `discarded`

```bash
# List tasks for a board (returns array)
plum task list --board <BOARD_ID> -o json
plum task list --board <BOARD_ID> --status todo -o json
plum task list --board <BOARD_ID> --assigned user@example.com -o json

# Get task details (includes tags, children summary)
plum task get <TASK_ID> -o json

# Create a task (returns {success, id, title, status})
plum task create --board <BOARD_ID> --title "Task name" -o json
plum task create --board <BOARD_ID> --title "Task name" --status in-progress --assign <USER_ID> --due 2025-06-15 --tag <TAG_ID> -o json

# Update a task
plum task update <TASK_ID> --title "Updated" --status done -o json

# Move task status (shorthand)
plum task move <TASK_ID> done -o json

# Delete a task
plum task delete <TASK_ID> --force -o json
```

### Comments

```bash
# List comments for a task (returns array)
plum comment list <TASK_ID> -o json

# Add a comment (returns {success, id, task_id})
plum comment add <TASK_ID> --text "Comment content" -o json

# Update a comment
plum comment update <COMMENT_ID> --text "Updated text" -o json

# Delete a comment
plum comment delete <COMMENT_ID> --force -o json
```

### Tags

Tags are scoped to a board. You must create a tag on a board before assigning it to tasks on that board.

```bash
# List tags for a board (returns array)
plum tag list --board <BOARD_ID> -o json

# Create a tag (returns {success, id, name})
plum tag create --board <BOARD_ID> --name "bug" --color "#ff0000" -o json

# Assign tag to task
plum tag assign <TAG_ID> <TASK_ID> -o json

# Remove tag from task
plum tag unassign <TAG_ID> <TASK_ID> -o json

# Delete a tag
plum tag delete <TAG_ID> --force -o json
```

### Members

```bash
# List members of a board (returns array)
plum member list --board <BOARD_ID> -o json

# Add a member (user must have logged in to PlumBoard at least once)
plum member add --board <BOARD_ID> --email user@example.com -o json

# Remove a member
plum member remove <MEMBER_ID> --force -o json
```

### Open in Browser

```bash
# Open the dashboard
plum open -o json

# Open a specific board
plum open <BOARD_ID> -o json

# Open a specific task (requires --board)
plum open <TASK_ID> --board <BOARD_ID> -o json
```

Returns `{"url": "https://plumboard.app/board/..."}` and opens the URL in the default browser. When a user asks for a link to their board or task, use this command — it both prints the URL and opens it.

### Config

```bash
# Show current Supabase config
plum config show -o json

# Set Supabase config (for self-hosted instances)
plum config set --url https://your-project.supabase.co --anon-key "your-key" -o json
```

## Useful Global Flags

| Flag | Purpose |
|------|---------|
| `-o json` | Structured JSON output. **Always use this.** |
| `--dry-run` | Preview mutation payload without executing. Works on all create/update/delete/move/assign commands. |
| `--fields id,title,status` | Filter JSON response to only these keys. Reduces noise. |

## Introspection

If you need to check the exact schema for any command:

```bash
# All commands with full argument/option metadata
plum describe -o json

# Single command
plum describe "task create" -o json
```

This returns argument types (`uuid`, `enum`, `string`, `date`), required/optional, enum values, and defaults.

## Important Invariants

- **Board membership required** — Users can only access boards they are members of. Creating a board automatically adds the creator as a member.
- **Parent task status is locked** — Tasks with children derive their status from children. Do not try to set the status of a parent task directly.
- **Tags are board-scoped** — A tag belongs to one board. Only assign tags to tasks on the same board.
- **Member lookup requires prior login** — `member add` only works for users who have logged into PlumBoard at least once (their profile must exist in the database).

## Examples

### Example 1: Create a board and add tasks

User says: "Set up a new sprint board with three tasks"

```bash
# Create the board
plum board create "Sprint 3" -d "March sprint" -o json
# Response: {"success": true, "id": "abc12345-...", "name": "Sprint 3"}

# Create tasks using the board ID from above
plum task create --board abc12345-... --title "Design auth flow" --status todo -o json
plum task create --board abc12345-... --title "Implement API" --status todo -o json
plum task create --board abc12345-... --title "Write tests" --status todo --due 2025-03-20 -o json
```

### Example 2: Move tasks through a workflow

User says: "Start working on the design task and mark API as done"

```bash
plum task move <DESIGN_TASK_ID> in-progress -o json
# Response: {"success": true, "id": "...", "status": "in-progress"}

plum task move <API_TASK_ID> done -o json
# Response: {"success": true, "id": "...", "status": "done"}
```

### Example 3: Preview before acting

User says: "Show me what would happen if I created this task"

```bash
plum task create --board <BOARD_ID> --title "Risky refactor" --status todo --dry-run -o json
# Response: {"dryRun": true, "action": "task.create", "payload": {"title": "Risky refactor", ...}}
```

No data is written. Execute without `--dry-run` to commit.

## Troubleshooting

### Error: "Invalid UUID for task id"
**Cause:** You passed a truncated ID (e.g., `a1b2c3d4`) or a made-up string.
**Fix:** Use the full UUID from a prior `list` or `create` command output. UUIDs look like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

### Error: Auth-related failures on data commands
**Cause:** Not logged in or token expired.
**Fix:** Run `plum auth status -o json` to check. If `token_valid` is false, run `plum auth login`.

### Error: "Could not find user with email"
**Cause:** Trying to add a member who has never logged into PlumBoard.
**Fix:** The user must log in to PlumBoard (web or CLI) at least once before they can be added to a board.

### Empty array `[]` returned
**Cause:** No results match your query. This is not an error.
**Fix:** Verify the board ID is correct and the filters (status, assigned) match existing data.

### Command hangs (no output)
**Cause:** An interactive confirmation prompt is waiting for input.
**Fix:** Always use `--force` on delete commands and `-o json` to suppress prompts.
