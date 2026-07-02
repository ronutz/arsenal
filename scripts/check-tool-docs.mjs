// ============================================================================
// scripts/check-tool-docs.mjs
// ----------------------------------------------------------------------------
// PREBUILD GUARD (D-77 "twin & sibling .md must be verbose, detailed, rich"):
// every AVAILABLE tool in src/config/tools.ts MUST have an authored rich
// documentation file in BOTH locales -
//     src/content/tool-docs/en/<id>.md   and   src/content/tool-docs/pt-BR/<id>.md
// and neither file may be empty. The machine-legibility generator uses these
// authored bodies for each tool's .md sibling; a missing one silently falls back
// to a thin derived stub, which D-77 forbids now that coverage is complete
// (39/39, reviewed and ratified 2026-07-01). This guard stops a NEW tool from
// shipping without its docs, the same way check-tools-registry stops a built
// tool from shipping without a registry entry.
//
// Read-only text scan, mirroring check-tools-registry.mjs: no imports of app code.
// ============================================================================

import { readFileSync, existsSync } from "node:fs";

const registry = readFileSync("src/config/tools.ts", "utf8");

// Available tool ids: within each tool object, pair the id with its `available`
// flag (the non-greedy `[^}]*?` keeps the match inside one object), and keep the
// ids declared available - exactly the set the generator documents.
const available = [];
const entryRe = /id:\s*"([^"]+)"[^}]*?available:\s*(true|false)/g;
let m;
while ((m = entryRe.exec(registry)) !== null) {
  if (m[2] === "true") available.push(m[1]);
}

const LOCALES = ["en", "pt-BR"];
const missing = [];
for (const id of available) {
  for (const locale of LOCALES) {
    const p = `src/content/tool-docs/${locale}/${id}.md`;
    if (!existsSync(p) || readFileSync(p, "utf8").trim() === "") {
      missing.push(`${locale}/${id}.md`);
    }
  }
}

if (missing.length > 0) {
  console.error(
    `[check-tool-docs] FAIL: ${missing.length} authored tool doc(s) missing or empty ` +
      `(D-77 requires an authored doc per available tool in en + pt-BR):\n` +
      missing.map((x) => `  - src/content/tool-docs/${x}`).join("\n") +
      `\nAuthor the doc(s); each tool's .md sibling depends on them.`,
  );
  process.exit(1);
}

console.log(
  `[check-tool-docs] OK: all ${available.length} available tools have en + pt-BR authored docs (D-77).`,
);
