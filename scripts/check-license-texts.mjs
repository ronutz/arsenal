// ============================================================================
// scripts/check-license-texts.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: every licence identifier the project declares must have its text.
//
// WHY THIS EXISTS, and it is a lesson rather than a feature.
//
// On 2026-09-09 a `LicenseRef-Trademark-NominativeUse` identifier was added to
// REUSE.toml for the vendor wordmarks. All 49 local guards passed, `tsc` was
// clean, the build was green, the work was packaged and shipped — and CI failed,
// because the REUSE specification requires a corresponding text file in
// LICENSES/ for every identifier used, and no such file had been written.
//
// The compliance check exists and is good. It just runs ONLY in CI
// (fsfe/reuse-action, .github/workflows/ci.yml), so nothing local could see the
// defect. A check that lives only on the far side of a push is a check that
// finds problems after the author has stopped thinking about them.
//
// This guard mirrors the one rule that broke, locally and cheaply. It does not
// reimplement REUSE — the real conformance check stays in CI, where it belongs —
// it just makes the specific failure impossible to ship again:
//
//   every SPDX-License-Identifier appearing in REUSE.toml or in a source
//   header has a matching LICENSES/<identifier>.txt, and that file is not empty.
//
// It also reports the reverse — a licence text with no user — as INFORMATION
// rather than failure, because an unused licence is untidy and not wrong, and a
// guard that fails on untidiness gets disabled.
// ============================================================================

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-license-texts]";
const LICENSES = path.join(ROOT, "LICENSES");

/** Collect identifiers from REUSE.toml plus any source-header declarations. */
function declaredIdentifiers() {
  const found = new Map(); // identifier -> where it was first seen

  const reuse = path.join(ROOT, "REUSE.toml");
  if (existsSync(reuse)) {
    const src = readFileSync(reuse, "utf8");
    for (const m of src.matchAll(/SPDX-License-Identifier\s*=\s*"([^"]+)"/g)) {
      // An expression may combine identifiers: "MIT OR Apache-2.0".
      for (const id of m[1].split(/\s+(?:OR|AND|WITH)\s+/)) {
        const clean = id.replace(/[()]/g, "").trim();
        if (clean && !found.has(clean)) found.set(clean, "REUSE.toml");
      }
    }
  }

  // Source headers, for the files that carry their own tag rather than relying
  // on REUSE.toml. Scanned shallowly: the directories where headers actually
  // live, not the whole tree, so this stays fast enough to run every build.
  const roots = ["scripts", "src", "worker", "tools"];
  const walk = (dir, depth = 0) => {
    if (depth > 4 || !existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) {
        walk(p, depth + 1);
        continue;
      }
      if (!/\.(m?[jt]sx?|css|mts)$/.test(name)) continue;
      const head = readFileSync(p, "utf8").slice(0, 2000);
      for (const m of head.matchAll(/SPDX-License-Identifier:\s*([A-Za-z0-9.\-+]+)/g)) {
        if (!found.has(m[1])) found.set(m[1], path.relative(ROOT, p));
      }
    }
  };
  for (const r of roots) walk(path.join(ROOT, r));

  return found;
}

const declared = declaredIdentifiers();
const errors = [];

if (!declared.size) {
  errors.push("no SPDX-License-Identifier found anywhere — the parser or the project layout changed");
}

for (const [id, where] of declared) {
  const file = path.join(LICENSES, `${id}.txt`);
  if (!existsSync(file)) {
    errors.push(`"${id}" (declared in ${where}) has no LICENSES/${id}.txt`);
  } else if (readFileSync(file, "utf8").trim().length < 40) {
    errors.push(`LICENSES/${id}.txt exists but is effectively empty`);
  }
}

if (errors.length) {
  console.error(`\n${TAG} FAIL: ${errors.length} licence identifier problem(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(
    `\n  REUSE requires a licence text for every identifier a project declares.\n` +
      `  For SPDX identifiers: 'reuse download --all'. For custom ones\n` +
      `  (LicenseRef-*), the text has to be written by hand.\n` +
      `  This guard exists because CI caught exactly this after a green local run.\n`
  );
  process.exit(1);
}

const onDisk = existsSync(LICENSES)
  ? readdirSync(LICENSES).filter((f) => f.endsWith(".txt")).map((f) => f.slice(0, -4))
  : [];
const unused = onDisk.filter((id) => !declared.has(id));

console.log(
  `${TAG} OK: ${declared.size} identifier(s) declared, all with a licence text` +
    (unused.length ? `; ${unused.length} unused text(s): ${unused.join(", ")}` : "") +
    "."
);
