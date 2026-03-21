import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  readStdin,
  parseStdin,
  pluginRoot,
  execWithTimeout,
} from "./utils.mts";

async function main() {
  const raw = await readStdin();
  const _input = parseStdin(raw);

  const root = pluginRoot();

  // Check if plum CLI is available
  const plumPath = execWithTimeout("which plum", 3000);
  if (!plumPath) {
    console.log(
      "PlumBoard CLI (`plum`) not found on PATH. Install with `npm install -g plumboard` to enable task management."
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
    // Load the base context even if not authenticated
    const contextPath = resolve(root, "plumboard.md");
    const context = readFileSync(contextPath, "utf-8");
    console.log(context);
    console.log(
      "\n> **Note:** PlumBoard CLI is installed but not authenticated. Run `plum auth login` to connect.\n"
    );
    return;
  }

  // Authenticated — load context and list boards for awareness
  const contextPath = resolve(root, "plumboard.md");
  const context = readFileSync(contextPath, "utf-8");

  let boardInfo = "";
  const boardsRaw = execWithTimeout(
    "plum board list -o json --fields id,name",
    5000
  );
  if (boardsRaw) {
    try {
      const boards = JSON.parse(boardsRaw) as { id: string; name: string }[];
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

  console.log(context);
  console.log(
    `\nAuthenticated as **${authStatus.email}**.${boardInfo}`
  );
}

main().catch(() => {
  // Silent failure — don't break the session
});
