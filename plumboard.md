## PlumBoard

This project uses PlumBoard for task and project management. Use the `plum` CLI to manage tasks.

- Check to-dos: `plum task list --board <BOARD_ID> --status todo -o json`
- List boards: `plum board list -o json`
- Always pass `-o json` and use full UUIDs.
- Run `/plumboard:status` for a full project overview.
- Full CLI reference is auto-loaded on task-related prompts.
