import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "hooks/src/session-start-detect.mts",
    "hooks/src/prompt-skill-inject.mts",
  ],
  outDir: "hooks",
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  splitting: false,
  clean: false,
  target: "node20",
});
