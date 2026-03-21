import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function main() {
  const skillPath = resolve(root, "skills", "plumboard-cli", "SKILL.md");
  const content = readFileSync(skillPath, "utf-8");

  // Extract YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    console.error("No YAML frontmatter found in SKILL.md");
    process.exit(1);
  }

  const frontmatter = parseYaml(match[1]);
  const metadata = frontmatter.metadata || {};

  // Compile bash patterns to verify they're valid regex
  const bashRegexSources: string[] = [];
  for (const pattern of metadata.bashPatterns || []) {
    try {
      new RegExp(pattern);
      bashRegexSources.push(pattern);
    } catch (e) {
      console.warn(`Invalid bash pattern "${pattern}": ${e}`);
    }
  }

  const manifest = {
    version: 2,
    generatedAt: new Date().toISOString(),
    skills: {
      "plumboard-cli": {
        priority: metadata.priority || 5,
        summary: frontmatter.description,
        docs: metadata.docs || [],
        bashPatterns: metadata.bashPatterns || [],
        bashRegexSources,
        promptSignals: metadata.promptSignals || {},
        bodyPath: "skills/plumboard-cli/SKILL.md",
        retrieval: metadata.retrieval || {},
      },
    },
  };

  const outDir = resolve(root, "generated");
  mkdirSync(outDir, { recursive: true });

  const outPath = resolve(outDir, "skill-manifest.json");
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`Manifest written to ${outPath}`);
}

main();
