import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  readStdin,
  parseStdin,
  pluginRoot,
  execWithTimeout,
} from "./utils.mts";

interface ProjectConfig {
  boardId: string;
  boardName: string;
}

function readProjectConfig(): ProjectConfig | null {
  try {
    const configPath = resolve(process.cwd(), ".plumboard.json");
    if (!existsSync(configPath)) return null;
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

async function main() {
  const raw = await readStdin();
  const _input = parseStdin(raw);

  const root = pluginRoot();
  const projectConfig = readProjectConfig();

  // Check if plum CLI is available
  const plumPath = execWithTimeout("which plum", 3000);
  if (!plumPath) {
    console.log(
      "PlumBoard CLI (`plum`) not found on PATH. Install with `npm install -g plumboard` then run `plum init` to set up."
    );
    return;
  }

  // Check auth status
  const authRaw = execWithTimeout("plum auth status -o json", 5000);
  let authStatus: { logged_in?: boolean; email?: string } = {};
  if (authRaw) {
    try {
      authStatus = JSON.parse(authRaw);
    } catch {
      // ignore parse errors
    }
  }

  if (!authStatus.logged_in) {
    console.log(
      "PlumBoard CLI is installed but not authenticated. Run `plum init` to set up."
    );
    return;
  }

  // Authenticated — build context
  const contextPath = resolve(root, "plumboard.md");
  const context = readFileSync(contextPath, "utf-8");

  console.log(context);
  console.log(`\nAuthenticated as **${authStatus.email}**.`);

  // If project has .plumboard.json, inject the specific board context
  if (projectConfig) {
    console.log(
      `\n### This Project's Board\n` +
        `- **${projectConfig.boardName}**: \`${projectConfig.boardId}\`\n` +
        `\nUse this board ID for all task commands in this project:\n` +
        `- To-dos: \`plum task list --board ${projectConfig.boardId} --status todo -o json\`\n` +
        `- All tasks: \`plum task list --board ${projectConfig.boardId} -o json\`\n` +
        `- Create task: \`plum task create --board ${projectConfig.boardId} --title "..." -o json\`\n` +
        `- Move task: \`plum task move <TASK_ID> <status> -o json\``
    );
  } else {
    // No project config — list all boards
    let boardInfo = "";
    const boardsRaw = execWithTimeout(
      "plum board list -o json --fields id,name",
      5000
    );
    if (boardsRaw) {
      try {
        const boards = JSON.parse(boardsRaw) as {
          id: string;
          name: string;
        }[];
        if (boards.length > 0) {
          boardInfo = "\n### Available Boards\n";
          for (const board of boards) {
            boardInfo += `- **${board.name}**: \`${board.id}\`\n`;
          }
        }
      } catch {
        // ignore parse errors
      }
    }
    console.log(boardInfo);
    console.log(
      `> **Tip:** Run \`plum init\` in this project to link a board. This lets your AI coding tool know which board to use automatically.`
    );
  }
}

main().catch(() => {
  // Silent failure — don't break the session
});
