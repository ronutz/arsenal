// ============================================================================
// scripts/gen-build-info.mjs
// ----------------------------------------------------------------------------
// Writes a single build timestamp that the footer renders as "Last modified".
// Runs in prebuild, so the value refreshes on every build and is identical
// across all statically exported pages (one timestamp per build, not per page).
// ============================================================================
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("src/generated", { recursive: true });
const iso = new Date().toISOString();
writeFileSync(
  "src/generated/build-info.ts",
  `// AUTO-GENERATED at build time by scripts/gen-build-info.mjs. Do not edit by hand.\n` +
    `export const BUILD_TIME = ${JSON.stringify(iso)};\n`,
);
console.log("[gen-build-info] BUILD_TIME =", iso);
