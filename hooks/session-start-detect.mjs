// hooks/src/session-start-detect.mts
import { readFileSync as readFileSync2, existsSync } from "fs";
import { resolve as resolve2 } from "path";

// hooks/src/utils.mts
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
function pluginRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "..");
}
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}
function parseStdin(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function execWithTimeout(cmd, timeoutMs = 3e3) {
  try {
    return execSync(cmd, {
      timeout: timeoutMs,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"]
    }).trim();
  } catch {
    return null;
  }
}

// hooks/src/session-start-detect.mts
function readProjectConfig() {
  try {
    const configPath = resolve2(process.cwd(), ".plumboard.json");
    if (!existsSync(configPath)) return null;
    return JSON.parse(readFileSync2(configPath, "utf-8"));
  } catch {
    return null;
  }
}
async function main() {
  const raw = await readStdin();
  const _input = parseStdin(raw);
  const root = pluginRoot();
  const projectConfig = readProjectConfig();
  const plumPath = execWithTimeout("which plum", 3e3);
  if (!plumPath) {
    console.log(
      "PlumBoard CLI (`plum`) not found on PATH. Install with `npm install -g plumboard` then run `plum init` to set up."
    );
    return;
  }
  const authRaw = execWithTimeout("plum auth status -o json", 5e3);
  let authStatus = {};
  if (authRaw) {
    try {
      authStatus = JSON.parse(authRaw);
    } catch {
    }
  }
  if (!authStatus.logged_in) {
    console.log(
      "PlumBoard CLI is installed but not authenticated. Run `plum init` to set up."
    );
    return;
  }
  const contextPath = resolve2(root, "plumboard.md");
  const context = readFileSync2(contextPath, "utf-8");
  console.log(context);
  console.log(`
Authenticated as **${authStatus.email}**.`);
  if (projectConfig) {
    console.log(
      `
### This Project's Board
- **${projectConfig.boardName}**: \`${projectConfig.boardId}\`

Use this board ID for all task commands in this project:
- To-dos: \`plum task list --board ${projectConfig.boardId} --status todo -o json\`
- All tasks: \`plum task list --board ${projectConfig.boardId} -o json\`
- Create task: \`plum task create --board ${projectConfig.boardId} --title "..." -o json\`
- Move task: \`plum task move <TASK_ID> <status> -o json\``
    );
  } else {
    let boardInfo = "";
    const boardsRaw = execWithTimeout(
      "plum board list -o json --fields id,name",
      5e3
    );
    if (boardsRaw) {
      try {
        const boards = JSON.parse(boardsRaw);
        if (boards.length > 0) {
          boardInfo = "\n### Available Boards\n";
          for (const board of boards) {
            boardInfo += `- **${board.name}**: \`${board.id}\`
`;
          }
        }
      } catch {
      }
    }
    console.log(boardInfo);
    console.log(
      `> **Tip:** Run \`plum init\` in this project to link a board. This lets your AI coding tool know which board to use automatically.`
    );
  }
}
main().catch(() => {
});
