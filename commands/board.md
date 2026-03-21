---
description: Show detailed view of a PlumBoard board — all tasks grouped by status column, with assignees and due dates.
---

# PlumBoard Board View

Show a detailed Kanban-style view of a specific board.

## Arguments

- `board_id` — The board UUID. If not provided, list boards and ask the user which one.

## Steps

1. **Check authentication:**
   ```bash
   plum auth status -o json
   ```

2. **If no board_id provided, list boards:**
   ```bash
   plum board list -o json --fields id,name
   ```
   Ask the user which board to view.

3. **Get board details:**
   ```bash
   plum board get <BOARD_ID> -o json
   ```

4. **Get all tasks:**
   ```bash
   plum task list --board <BOARD_ID> -o json
   ```

5. **Get members:**
   ```bash
   plum member list --board <BOARD_ID> -o json --fields id,email,role
   ```

6. **Get tags:**
   ```bash
   plum tag list --board <BOARD_ID> -o json --fields id,name,color
   ```

## Output Format

Present as a Kanban board:

```
## <Board Name>

### Todo
| Task | Assignee | Due | Tags |
|------|----------|-----|------|
| Task title | user@email | 2026-04-01 | bug, urgent |

### In Progress
| Task | Assignee | Due | Tags |
|------|----------|-----|------|
| Task title | user@email | — | feature |

### Done
| Task | Assignee | Due | Tags |
|------|----------|-----|------|
| Task title | user@email | 2026-03-15 | — |

**Members:** user1@email (admin), user2@email (member)
```
