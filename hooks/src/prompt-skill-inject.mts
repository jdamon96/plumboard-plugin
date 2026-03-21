import { resolve } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { readStdin, parseStdin, pluginRoot, loadSkillBody } from "./utils.mts";

// Prompt signals for task-management-related queries
const PHRASES = [
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
  "check my board",
];

const ALL_OF: string[][] = [
  ["task", "list"],
  ["task", "create"],
  ["task", "status"],
  ["board", "status"],
  ["task", "done"],
  ["task", "assign"],
];

const ANY_OF = [
  "task",
  "todo",
  "to-do",
  "kanban",
  "board",
  "sprint",
  "backlog",
];

const NONE_OF = ["jira", "linear", "asana", "trello", "github issues"];

const MIN_SCORE = 6;

function scorePrompt(prompt: string): number {
  const lower = prompt.toLowerCase();

  // Hard reject if competing tool mentioned
  for (const term of NONE_OF) {
    if (lower.includes(term)) return -Infinity;
  }

  let score = 0;

  // Phrase matches: +6 each
  for (const phrase of PHRASES) {
    if (lower.includes(phrase)) {
      score += 6;
    }
  }

  // allOf conjunctions: +4 each (all terms must be present)
  for (const group of ALL_OF) {
    if (group.every((term) => lower.includes(term))) {
      score += 4;
    }
  }

  // anyOf disjunctions: +1 each (cap at +2)
  let anyOfScore = 0;
  for (const term of ANY_OF) {
    if (lower.includes(term)) {
      anyOfScore += 1;
    }
  }
  score += Math.min(anyOfScore, 2);

  return score;
}

function getDeduplicationPath(sessionId: string): string {
  return resolve(tmpdir(), `plumboard-plugin-${sessionId}-injected`);
}

async function main() {
  const raw = await readStdin();
  const input = parseStdin(raw);

  const prompt = (input.prompt as string) || "";
  if (!prompt) return;

  const score = scorePrompt(prompt);
  if (score < MIN_SCORE) return;

  // Deduplicate: don't re-inject within the same session
  const sessionId = (input.session_id as string) || "unknown";
  const dedupPath = getDeduplicationPath(sessionId);
  if (existsSync(dedupPath)) return;

  // Mark as injected
  try {
    writeFileSync(dedupPath, new Date().toISOString(), { flag: "wx" });
  } catch {
    // File already exists (race condition) — skip injection
    return;
  }

  // Load and output the skill body
  const root = pluginRoot();
  const skillPath = resolve(root, "skills", "plumboard-cli", "SKILL.md");

  try {
    const body = loadSkillBody(skillPath);
    console.log(body);
  } catch {
    // Skill file missing — silent failure
  }
}

main().catch(() => {
  // Silent failure — don't break the session
});
