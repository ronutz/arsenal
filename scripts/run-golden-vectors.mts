#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// run-golden-vectors — THE VECTORS WERE NEVER RUN.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. On 2026-10-01, while testing a claim that the em-dash backlog
// in src/lib was "blocked by byte-exact golden vectors", the blocker turned out
// not to exist. The reason it did not exist is worse than the claim being wrong:
//
//     *** NOTHING IN THIS REPOSITORY EVER EXECUTED A GOLDEN VECTOR. ***
//
// Measured, not assumed:
//   * 145 files define `export function verifyVectors`.
//   * 116 tool entry points re-export it.
//   * package.json has no `test` script. There is no vitest or jest config and
//     no *.test.ts or *.spec.ts anywhere in the tree.
//   * No page, route or script under src/app or src/components calls it.
//
// So 145 vector sets were written, maintained, re-exported, and never once run.
// They could not have blocked an edit because nothing would have noticed. The
// whole point of a golden vector is to fail when behaviour drifts, and a vector
// nobody runs is a comment that costs a compile.
//
// WHAT THIS STEP DOES. Imports every module that defines `verifyVectors`, calls
// it, and fails the build on any non-empty failure list.
//
// THE RETURN SHAPES ARE NOT UNIFORM, and this tolerates that rather than asking
// 145 files to be rewritten first. SEVEN shapes exist in the tree, found by reading
// the outliers after a first run reported 25 results it could not interpret:
//   void, and THROWS on failure      (iquery-protocol-explainer, pac-file-explainer)
//   string[] returned directly       (ldap-filter-explainer)
//   { failures: [...] }              (most)
//   { failed: [...] }                (ognl-injection-decoder, pingfederate-ognl-explainer)
//   { passed, failed: <number>, failures: [...] }        (dig-output-explainer)
//   { accepted, rejected: <number> } (mtu-mss)
//   { setId, total, passed, failures }                   (VerifyReport / VectorReport)
//
// A module whose result fits NONE of those is reported as UNREADABLE rather than
// counted as passing. That distinction is the whole point: a runner that treats
// "I could not tell" as "fine" reproduces exactly the condition this step exists
// to end, which is a suite everyone believes in and nobody executes.
//
// The void-and-throw shape is the one that needs care. An undefined return means
// "passed" only when the function signals failure by throwing, so that is
// confirmed against the function's own source before it is accepted.
//
// AN IMPORT ERROR IS A FINDING, NOT A SKIP. A tool module that cannot be loaded
// outside Next's bundler is a real defect in that module's boundaries, so it
// fails here with the error rather than being passed over.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

/** Every .ts file under src that DEFINES verifyVectors (not the re-exports). */
function discover(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) discover(p, out);
    else if (e.isFile() && p.endsWith(".ts")) {
      const t = fs.readFileSync(p, "utf8");
      if (/export\s+(?:async\s+)?function\s+verifyVectors\b/.test(t)) out.push(p);
    }
  }
  return out;
}

// Sets that are known to fail or to be unloadable, each with the reason and the
// date. MAY ONLY SHRINK: a declared set that now passes is reported as stale, so
// this list cannot quietly become the place failures go to be forgotten.
const DECLARED_FAILING = new Map<string, string>([]);

// The number of vector sets that must be found. A set that stops being discovered
// is as bad as one that fails, and a bare count of "sets that passed" could not
// see one disappear. Declared on 2026-10-01; may only be raised. Raised 145 -> 153
// on 2026-10-03 with the eight iRules / Tcl 8.4 teaching tools' sets,
// 153 -> 154 the same day with the BIG-IP zero-or-one finder's set, and
// 154 -> 156 the same day with the ASCII table explorer's and the Unicode
// inspector's sets, 156 -> 157 the same day with the charset converter's, and
// 157 -> 158 on 2026-10-04 with the chmod permission calculator's.
const MIN_SETS = 161;

/**
 * Reduce any of the tree's verifyVectors return shapes to a list of failures.
 * Returns null when the shape is not recognised, which the caller treats as an
 * error rather than a pass.
 *
 * @param report the value verifyVectors returned
 * @param source the module's own text, used only to confirm that an undefined
 *               return belongs to a throw-on-failure implementation
 */
function normalise(report: unknown, source: string): unknown[] | null {
  // Does this set signal failure by throwing? If so, the call having returned at
  // all is the pass, whatever it returned.
  const body = source.slice(source.search(/export\s+(?:async\s+)?function\s+verifyVectors\b/));
  const throwsOnFailure = /\bthrow new Error\b/.test(body);

  // An explicit failure list always wins, because some sets collect rather than throw.
  if (Array.isArray(report)) return report;
  if (report && typeof report === "object") {
    const r = report as Record<string, unknown>;
    if (Array.isArray(r.failures)) return r.failures;
    if (Array.isArray(r.failed)) return r.failed;
    if (typeof r.failed === "number") {
      return r.failed > 0 ? [`${r.failed} vector(s) failed (the set reports a count without detail)`] : [];
    }
  }

  // No failure list. A throw-based set returning normally has passed: that covers
  // `void`, `{ accepted, rejected }` and `{ ok, count }`, where `rejected` counts
  // inputs the tool CORRECTLY refused and is not a failure at all.
  if (throwsOnFailure) return [];

  // Anything else is genuinely uninterpretable and must not be read as a pass.
  return null;
}

const files = discover(SRC).sort();
const errors: string[] = [];
const stale: string[] = [];
let ran = 0;
let totalVectors = 0;
let totalPassed = 0;
let setsReportingBoth = 0;
const failingNow = new Set<string>();

for (const file of files) {
  const rel = path.relative(ROOT, file);
  let report: unknown;
  let mod: Record<string, unknown>;
  // The import and the call are tried SEPARATELY, because they fail for entirely
  // different reasons and conflating them sends the reader to the wrong problem: a
  // module that will not load outside the bundler is a boundary defect, while a throw
  // from verifyVectors is a vector that failed, which is this step's whole purpose.
  try {
    mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`${rel}: could not be imported outside the bundler: ${msg.split("\n")[0]}`);
    continue;
  }
  if (typeof mod.verifyVectors !== "function") {
    errors.push(`${rel}: defines verifyVectors in source but the module does not export a callable one.`);
    continue;
  }
  try {
    report = await (mod.verifyVectors as () => unknown)();
  } catch (e) {
    // A throw-on-failure set reporting a failed vector.
    const msg = e instanceof Error ? e.message : String(e);
    ran += 1;
    failingNow.add(rel);
    if (!DECLARED_FAILING.has(rel)) errors.push(`${rel}: vector failure: ${msg.split("\n")[0]}`);
    continue;
  }
  ran += 1;

  // Normalise the seven shapes to a failure list. `null` means UNREADABLE, which is
  // an error, never a pass.
  const failures = normalise(report, fs.readFileSync(file, "utf8"));
  if (failures === null) {
    errors.push(
      `${rel}: verifyVectors returned a shape this runner cannot interpret ` +
        `(got ${JSON.stringify(report)?.slice(0, 140)}). Add the shape to normalise() rather than ` +
        `letting an uninterpretable result count as a pass.`
    );
    continue;
  }
  const r = (report ?? {}) as Record<string, unknown>;
  // Only count the pair when a set reports BOTH, so the printed ratio is coherent.
  // Summing them independently produced "940/237" on the first green run, which is
  // the same class of meaningless figure this chain exists to remove.
  if (typeof r.total === "number" && typeof r.passed === "number") {
    totalVectors += r.total;
    totalPassed += r.passed;
    setsReportingBoth += 1;
  }

  if (failures.length > 0) {
    failingNow.add(rel);
    if (!DECLARED_FAILING.has(rel)) {
      const shown = failures
        .slice(0, 3)
        .map((f) => (typeof f === "string" ? f : JSON.stringify(f)))
        .join(" | ");
      errors.push(`${rel}: ${failures.length} vector failure(s): ${shown}`);
    }
  }
}

// The stale half, for the same reason every other declared list in this chain has
// one: without it the list can only grow.
for (const rel of DECLARED_FAILING.keys()) {
  if (!failingNow.has(rel)) stale.push(`DECLARED_FAILING lists "${rel}", which now passes - remove it from the list.`);
}

if (files.length < MIN_SETS) {
  errors.unshift(
    `${files.length} vector set(s) discovered, below the declared floor of ${MIN_SETS}. A set that ` +
      `stops being discovered is as bad as one that fails.`
  );
}

if (errors.length > 0 || stale.length > 0) {
  console.error("[run-golden-vectors] FAIL:");
  for (const e of [...errors, ...stale]) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `[run-golden-vectors] OK: ${ran} of ${files.length} vector set(s) executed (floor ${MIN_SETS}, may only be raised)` +
    (setsReportingBoth > 0
      ? `, and ${totalPassed}/${totalVectors} individual vectors passing across the ${setsReportingBoth} set(s) that report both figures`
      : "") +
    `; ${DECLARED_FAILING.size} declared failing (may only shrink). Before 2026-10-01 none of these had ever been run.`
);
