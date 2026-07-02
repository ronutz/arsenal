// ============================================================================
// scripts/check-tools-registry.mjs
// ----------------------------------------------------------------------------
// PREBUILD GUARD (D-74 "enforce at build"): every tool the catalogue marks as
// built (disposition: "built") MUST have an entry in src/config/tools.ts, the
// registry that drives the tools index and each tool page's title/blurb/family
// chip. Without an entry, a built tool has NO card on /tools and its page
// renders headless — exactly the drift this guard exists to prevent (four
// tools were found missing on 2026-07-01).
//
// Read-only text scan, mirroring check-changelog.mjs: no imports of app code.
// ============================================================================

import { readFileSync } from "node:fs";

const catalogue = readFileSync("src/content/catalogue/catalogue.ts", "utf8");
const registry = readFileSync("src/config/tools.ts", "utf8");

// Built slugs from the catalogue: pair each slug with its entry body and keep
// those whose body declares disposition: "built".
const built = [];
const entryRe = /slug:\s*"([^"]+)"[\s\S]*?disposition:\s*"([^"]+)"/g;
let m;
while ((m = entryRe.exec(catalogue)) !== null) {
  if (m[2] === "built") built.push(m[1]);
}

const registered = new Set(
  [...registry.matchAll(/id:\s*"([^"]+)"/g)].map((x) => x[1]),
);

const missing = built.filter((slug) => !registered.has(slug));

if (missing.length > 0) {
  console.error(
    `[check-tools-registry] FAIL: ${missing.length} built tool(s) missing from src/config/tools.ts: ${missing.join(", ")}.\n` +
      `Add an entry ({ id, href, category, available: true }) for each; the tools index and tool pages depend on it.`,
  );
  process.exit(1);
}

console.log(
  `[check-tools-registry] OK: all ${built.length} built tools are registered in src/config/tools.ts.`,
);
