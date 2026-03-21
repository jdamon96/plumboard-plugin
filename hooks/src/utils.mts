import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export function pluginRoot(): string {
  if (process.env.CLAUDE_PLUGIN_ROOT) {
    return process.env.CLAUDE_PLUGIN_ROOT;
  }
  // Fallback: derive from this file's location (hooks/ dir is one level below root)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  return resolve(__dirname, "..");
}

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export function parseStdin(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function loadSkillBody(skillPath: string): string {
  const content = readFileSync(skillPath, "utf-8");
  // Strip YAML frontmatter (--- ... ---)
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content;
}

export function execWithTimeout(
  cmd: string,
  timeoutMs: number = 3000
): string | null {
  try {
    return execSync(cmd, {
      timeout: timeoutMs,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}
