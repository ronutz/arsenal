// ============================================================================
// scripts/check-asset-budget.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD (reporting, with a ceiling): how close is the manifest to the cap?
//
// WHY. Cloudflare Workers allows 100,000 files in the assets manifest per
// version. The 2026-07-23 incident (error 10304) was this cap being hit, and
// deploy.yml now gates at 97,000 so the failure is loud in five seconds instead
// of silent for thirty-five minutes. That gate is real and stays where it is.
//
// The problem it leaves: THE GATE CAN ONLY BE EVALUATED IN CI, because only CI
// builds all sixteen locales. Local verification builds one locale to keep the
// cycle under fifteen minutes, so the number that matters is never visible
// while the work is being done. That is the same shape as the REUSE failure of
// 2026-09-10 - a real check on the far side of a push - and it gets the same
// treatment: a local mirror that cannot replace the real gate but makes the
// number visible while it can still change a decision.
//
// HOW IT ESTIMATES, and the honesty about it.
//   effective = total files in out/ minus every index.txt, because
//   out/.assetsignore excludes the RSC payloads from the manifest (decision
//   D-19). Files under a locale directory are counted as PER-LOCALE and
//   multiplied by the number of live locales; everything else is counted once.
//
// That extrapolation is sound for this site specifically, because
// generateStaticParams for the Learn route maps routing.locales over every
// slug - each locale renders the whole corpus, falling back to English content
// where a translation does not exist - so locale directories are near-uniform
// in size. It would NOT be sound on a site where locales carry different page
// counts, and this comment exists so nobody carries the script somewhere it
// lies.
//
// On a full sixteen-locale build the extrapolation collapses to a measurement,
// because the multiplier becomes 1 for locales already present.
//
// It FAILS only if the estimate crosses the same 97,000 the deploy gate uses.
// Below that it reports and gets out of the way: a guard that fails on an
// estimate would eventually be disabled, and then the real number would go
// unwatched again.
// ============================================================================

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-asset-budget]";
const OUT = path.join(ROOT, "out");
const GATE = 97_000; // must match .github/workflows/deploy.yml
const HARD_CAP = 100_000; // Cloudflare Workers, assets manifest per version

// Nothing to measure before the export exists; prebuild runs before out/ is
// written, so this is the normal case on a clean run and not a failure.
if (!existsSync(OUT)) {
  console.log(`${TAG} SKIP: no out/ yet (runs after an export).`);
  process.exit(0);
}

// Live locale directory names, read from the locales module rather than
// hard-coded, so adding a locale is reflected here automatically.
// LIVE_LOCALES is DERIVED - `LOCALES.filter((l) => l.status !== "stub")` - so
// there is no literal array of live codes to read. Parse the LOCALES entries and
// apply the same filter, which keeps this in step when a locale is promoted out
// of stub status. (First attempt matched the derived name and found zero, which
// silently produced a meaningless multiplier; hence the assertion below.)
const localesSrc = readFileSync(path.join(ROOT, "src/i18n/locales.ts"), "utf8");
const localeCodes = [...localesSrc.matchAll(/\{\s*code:\s*"([A-Za-z-]+)"[^}]*?status:\s*"([a-z-]+)"/g)]
  .filter((m) => m[2] !== "stub")
  .map((m) => m[1]);
if (!localeCodes.length) {
  console.error(`\n${TAG} FAIL: parsed zero live locales from src/i18n/locales.ts.\n` +
    `  The multiplier would be meaningless, so this stops rather than reporting\n` +
    `  a number that looks precise and is not.\n`);
  process.exit(1);
}
const localeSet = new Set(localeCodes);

let total = 0;
let ignored = 0;
const perLocale = new Map(); // locale -> effective file count
let shared = 0;

const walk = (dir, topLevel = null) => {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p, topLevel ?? name);
      continue;
    }
    total += 1;
    // D-19: index.txt is excluded from the manifest by out/.assetsignore.
    if (name === "index.txt") {
      ignored += 1;
      continue;
    }
    if (topLevel && localeSet.has(topLevel)) {
      perLocale.set(topLevel, (perLocale.get(topLevel) ?? 0) + 1);
    } else {
      shared += 1;
    }
  }
};
walk(OUT);

const built = [...perLocale.keys()];
const effectiveNow = total - ignored;

// Average across the locales actually present, then bill for all live ones.
// The LARGEST built locale, not the mean. A verification build renders one
// locale fully and can leave a partial directory for another (out/pt-BR gets a
// handful of files even under VERIFY_LOCALES=en), and averaging a full locale
// with a stub one halves the estimate and understates the risk. The biggest
// directory is the best proxy for what a full locale costs.
const avgPerLocale = built.length ? Math.max(...perLocale.values()) : 0;
const estimate = avgPerLocale * localeCodes.length + shared;
const exact = built.length === localeCodes.length;

const headroomGate = GATE - estimate;
const pagesLeft = localeCodes.length ? Math.floor(headroomGate / localeCodes.length) : 0;

console.log(
  `${TAG} ${exact ? "MEASURED" : "ESTIMATE"}: ${estimate.toLocaleString()} effective asset(s) ` +
    `of ${HARD_CAP.toLocaleString()} (deploy gate ${GATE.toLocaleString()}).`
);
console.log(
  `  built ${built.length}/${localeCodes.length} locale(s); ` +
    `${avgPerLocale.toLocaleString()} per locale + ${shared.toLocaleString()} shared; ` +
    `${ignored.toLocaleString()} index.txt excluded (D-19).`
);
if (!exact) {
  console.log(
    `  extrapolated from a partial build - CI measures the real number. ` +
      `Headroom to the gate: ${headroomGate.toLocaleString()} (~${pagesLeft.toLocaleString()} more pages).`
  );
}

if (estimate > GATE) {
  console.error(
    `\n${TAG} FAIL: ${estimate.toLocaleString()} exceeds the ${GATE.toLocaleString()} deploy gate.\n` +
      `  A deploy would be rejected. Strategic options are in concord\n` +
      `  canon/PKG-asset-budget-2026-07-23.md; do not raise the gate without\n` +
      `  reading it, because the 100,000 cap above it is Cloudflare's, not ours.\n`
  );
  process.exit(1);
}
