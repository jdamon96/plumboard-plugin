---
description: Show PlumBoard task summary — list boards, view tasks by status, and check what's assigned to you.
---

# PlumBoard Status

Show a summary of all PlumBoard boards and their task status.

## Steps

1. **Check authentication:**
   ```bash
   plum auth status -o json
   ```
   If not authenticated, tell the user to run `plum auth login`.

2. **List all boards:**
   ```bash
   plum board list -o json --fields id,name
   ```

3. **For each board** (or the board the user specifies), get tasks:
   ```bash
   plum task list --board <BOARD_ID> -o json --fields id,title,status,assigned_to_email,due_date
   ```

4. **Summarize** in a table:
   - Group tasks by status (todo, in-progress, done)
   - Show count per status
   - List overdue tasks (due_date < today)
   - List tasks assigned to the current user

## Output Format

Present the summary as:
```
## Board: <name>
- Todo: X tasks
- In Progress: Y tasks
- Done: Z tasks

### My Tasks
- [ ] Task title (todo, due: date)
- [~] Task title (in-progress)
- [x] Task title (done)
```

If no board is specified, show a summary of all boards.
