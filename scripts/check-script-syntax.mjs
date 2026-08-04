#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-script-syntax.mjs — THE TWENTY-FIFTH GUARD
// ----------------------------------------------------------------------------
// BUILD GUARD: every file in scripts/ must parse.
//
// WHY. On 2026-08-04 a temporary sandbox gate was removed from gen-og.mts by a
// line-filtering script whose state variable was set to a TRUTHY STRING
// ("guard") while an earlier condition tested that same variable for
// truthiness. Every line after the gate was therefore dropped: the rest of
// siteWide(), the whole of samples(), and the mode dispatch. **The file was
// truncated mid-function and shipped.**
//
// It survived every check that ran, for a specific and instructive reason.
// `tsc --noEmit` does not typecheck scripts/, the 24 content guards do not
// parse each other, and the removal script's own assertion tested for the
// SUBSTRING "async function siteWide() {" - which was the last surviving line.
// **The assertion passed because it asked whether a string was present, not
// whether the file was valid.**
//
// CI caught it in seconds. That is the correct outcome and also the expensive
// one, because it caught it after a deploy rather than before a zip.
//
// The rule this encodes: **after editing any file, rebuild before shipping.**
// This guard is the cheap mechanical half of that; it cannot replace the habit.
// ============================================================================

import { readdirSync, readFileSync } from "node:fs";
import { transformSync } from "esbuild";

const DIR = "scripts";
const files = readdirSync(DIR).filter((f) => /\.(mjs|mts|ts|js)$/.test(f));

const failures = [];
for (const file of files) {
  const path = `${DIR}/${file}`;
  const source = readFileSync(path, "utf8");
  try {
    transformSync(source, {
      loader: file.endsWith(".mts") || file.endsWith(".ts") ? "ts" : "js",
      format: "esm",
    });
  } catch (error) {
    const detail = (error?.errors ?? [])
      .map((e) => `${e.location?.line ?? "?"}:${e.location?.column ?? "?"} ${e.text}`)
      .join("; ");
    failures.push(`${path}: ${detail || error.message}`);
  }
}

if (failures.length) {
  console.error("\n[check-script-syntax] FAIL:\n");
  for (const f of failures) console.error(`  - ${f}\n`);
  process.exit(1);
}

console.log(`[check-script-syntax] OK: ${files.length} build scripts parse.`);
