#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0
// ============================================================================
// scripts/run-pagefind.mjs
// ----------------------------------------------------------------------------
// THE SEARCH INDEX, FOR THE LOCALES WHOSE INTERFACE IS WRITTEN (09/11/2026).
//
// The build used to run `pagefind --site out --glob "{en,pt-BR}/**/*.html"`:
// indexing every locale had pushed the asset manifest past its 100,000-file cap
// (2026-08-31), so only the two authored locales were indexed. Since PRIME's
// interface-first languages (09/11/2026) a locale whose interface is written
// natively joins the index too, read from INTERFACE_LOCALES in
// src/i18n/locales.ts, the same list the search box reads
// (src/components/Search.tsx), so the two cannot drift apart.
// ============================================================================
import fs from "node:fs"; // the registry
import { spawnSync } from "node:child_process"; // pagefind itself

// The registry's source (plain node cannot import TypeScript).
const src = fs.readFileSync("src/i18n/locales.ts", "utf8");
// The interface-native locales, as written in the array literal.
const locales = [...(src.match(/INTERFACE_LOCALES\s*=\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([A-Za-z-]+)"/g)].map((m) => m[1]);
// A list that cannot be read must stop the build rather than index nothing.
if (!locales.includes("en")) {
  // Say what is missing.
  console.error("[run-pagefind] FAIL: could not read INTERFACE_LOCALES from src/i18n/locales.ts.");
  // Hard stop.
  process.exit(1);
}
// The glob: one brace group of the locale folders (a single locale needs no braces).
const glob = locales.length === 1 ? `${locales[0]}/**/*.html` : `{${locales.join(",")}}/**/*.html`;
// Say what is indexed, in the build log.
console.log(`[run-pagefind] indexing ${locales.join(", ")}: ${glob}`);
// Run the locally installed pagefind with the same flags as before.
const res = spawnSync("npx", ["pagefind", "--site", "out", "--glob", glob], { stdio: "inherit", shell: process.platform === "win32" });
// Its exit code is the build's.
process.exit(res.status ?? 1);
