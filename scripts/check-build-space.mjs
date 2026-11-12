// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-build-space.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: there must be room for the export BEFORE the build spends its
// time generating pages.
//
// WHY. On 12/11/2026 the six-language verification build in the sandbox
// generated all 13,035 pages (about 40 minutes) and then died copying them
// from .next/ into out/ with ENOSPC: at that moment .next/ held 7.6 GiB and
// out/ 3.2 GiB of a final 6.2 GiB, and the session's writable allowance had
// only 11 GiB left because old working files had piled up beside the repo.
// The same failure had happened before (the 2026-07-09 Workers Builds ENOSPC
// that moved production builds to GitHub Actions). Nothing checked the room
// first, so the failure showed only at the very end.
//
// WHAT IT CHECKS. The free space of the file system that holds the repository
// (fs.statfsSync; in the sandbox this is the session's allowance, which df
// and statfs both report) against an estimate of the build's peak: .next/ and
// out/ both full at the export copy, about 2.4 GiB per built language, plus a
// 2 GiB margin for the search index, the machine-legible files and the logs.
// The languages come from VERIFY_LOCALES (the sandbox's verification build);
// without it, from the number of live languages a full build makes.
//
// WHEN IT FAILS. Only for a sandbox verification build (VERIFY_LOCALES set):
// it stops the build at its first step and says how much to free. In CI
// (GITHUB_ACTIONS or CI set, no VERIFY_LOCALES) it only reports, because the
// runner frees its own disk first and its numbers differ.
//
// Tunable without editing: BUILD_SPACE_GIB_PER_LOCALE, BUILD_SPACE_MARGIN_GIB.
// ============================================================================

import fs from "node:fs"; // statfsSync and existsSync
import path from "node:path"; // the repository root
import { fileURLToPath } from "node:url"; // this file's own path

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."); // the repository root
const GIB = 1024 ** 3; // one gibibyte in bytes
const PER_LOCALE = Number(process.env.BUILD_SPACE_GIB_PER_LOCALE ?? 2.4); // the peak per built language, in GiB (12/11/2026: 13.8 GiB for six)
const MARGIN = Number(process.env.BUILD_SPACE_MARGIN_GIB ?? 2); // room for pagefind, machine-legible files and logs, in GiB
const verify = (process.env.VERIFY_LOCALES ?? "").split(/[,|]/).map((s) => s.trim()).filter(Boolean); // the languages a sandbox build makes
const inCi = Boolean(process.env.GITHUB_ACTIONS || process.env.CI); // a CI runner, which frees its own disk

/** The number of live languages (LIVE_LOCALES = every status but "stub"), read without importing TypeScript. */
function liveLocaleCount() {
  const src = fs.readFileSync(path.join(ROOT, "src", "i18n", "locales.ts"), "utf8"); // the registry's source
  const n = (src.match(/status:\s*"(?!stub")[a-z-]+"/g) ?? []).length; // entries whose status is not "stub"
  return n > 0 ? n : 6; // the six live languages of 12/11/2026 when the pattern finds none
}

/** The size in bytes of a directory tree, or 0 when it does not exist (used for stale .next/ and out/). */
function treeBytes(dir) {
  if (!fs.existsSync(dir)) return 0; // nothing there
  let total = 0; // the running sum
  const stack = [dir]; // directories still to walk
  while (stack.length) {
    const d = stack.pop(); // the next directory
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name); // the entry's path
      if (e.isDirectory()) stack.push(p); // walk into it
      else if (e.isFile()) total += fs.statSync(p).size; // count its bytes
    }
  }
  return total; // the tree's size
}

const locales = verify.length || liveLocaleCount(); // how many languages this build makes
const st = fs.statfsSync(ROOT); // the file system holding the repository
const free = st.bavail * st.bsize; // bytes this process may still write
const stale = treeBytes(path.join(ROOT, ".next")) + treeBytes(path.join(ROOT, "out")); // earlier build output still on disk
const need = (locales * PER_LOCALE + MARGIN) * GIB; // the estimated peak of this build
const fmt = (b) => `${(b / GIB).toFixed(1)} GiB`; // bytes as GiB, one decimal

const line = `${locales} language(s): needs about ${fmt(need)} free at the export copy; ${fmt(free)} free now`; // the verdict's numbers
const staleNote = stale > 0 ? `; .next/ and out/ from an earlier build hold ${fmt(stale)} (rm -rf .next out first)` : ""; // what can be freed at once

if (free >= need) {
  console.log(`[check-build-space] OK: ${line}${staleNote}.`); // enough room
  process.exit(0); // pass
}
const msg = `[check-build-space] ${verify.length ? "FAIL" : "WARN"}: ${line}${staleNote}. Free at least ${fmt(need - free)} before building (old working files, caches, earlier build output).`; // what to do
if (verify.length && !inCi) {
  console.error(msg); // a sandbox verification build would fail at the end: stop now
  process.exit(1); // fail
}
console.warn(msg); // CI or a full build outside the sandbox: report only
process.exit(0); // pass
