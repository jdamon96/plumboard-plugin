// hooks/src/prompt-skill-inject.mts
import { resolve as resolve2 } from "path";
import { existsSync, writeFileSync } from "fs";
import { tmpdir } from "os";

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
function loadSkillBody(skillPath) {
  const content = readFileSync(skillPath, "utf-8");
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content;
}

// hooks/src/prompt-skill-inject.mts
var PHRASES = [
  "what are my to-dos",
  "what are my todos",
  "show my tasks",
  "list tasks",
  "task status",
  "create a task",
  "update task",
  "move task",
  "board status",
  "plumboard",
  "plum board",
  "project progress",
  "what should i work on",
  "what's left to do",
  "mark as done",
  "assign task",
  "add a to-do",
  "check my board"
];
var ALL_OF = [
  ["task", "list"],
  ["task", "create"],
  ["task", "status"],
  ["board", "status"],
  ["task", "done"],
  ["task", "assign"]
];
var ANY_OF = [
  "task",
  "todo",
  "to-do",
  "kanban",
  "board",
  "sprint",
  "backlog"
];
var NONE_OF = ["jira", "linear", "asana", "trello", "github issues"];
var MIN_SCORE = 6;
function scorePrompt(prompt) {
  const lower = prompt.toLowerCase();
  for (const term of NONE_OF) {
    if (lower.includes(term)) return -Infinity;
  }
  let score = 0;
  for (const phrase of PHRASES) {
    if (lower.includes(phrase)) {
      score += 6;
    }
  }
  for (const group of ALL_OF) {
    if (group.every((term) => lower.includes(term))) {
      score += 4;
    }
  }
  let anyOfScore = 0;
  for (const term of ANY_OF) {
    if (lower.includes(term)) {
      anyOfScore += 1;
    }
  }
  score += Math.min(anyOfScore, 2);
  return score;
}
function getDeduplicationPath(sessionId) {
  return resolve2(tmpdir(), `plumboard-plugin-${sessionId}-injected`);
}
async function main() {
  const raw = await readStdin();
  const input = parseStdin(raw);
  const prompt = input.prompt || "";
  if (!prompt) return;
  const score = scorePrompt(prompt);
  if (score < MIN_SCORE) return;
  const sessionId = input.session_id || "unknown";
  const dedupPath = getDeduplicationPath(sessionId);
  if (existsSync(dedupPath)) return;
  try {
    writeFileSync(dedupPath, (/* @__PURE__ */ new Date()).toISOString(), { flag: "wx" });
  } catch {
    return;
  }
  const root = pluginRoot();
  const skillPath = resolve2(root, "skills", "plumboard-cli", "SKILL.md");
  try {
    const body = loadSkillBody(skillPath);
    console.log(body);
  } catch {
  }
}
main().catch(() => {
});
