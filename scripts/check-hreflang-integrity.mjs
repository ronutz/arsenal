// check-hreflang-integrity.mjs — P-5, ratified by PRIME 2026-08-19 ("Aceito todas").
//
// ORIGIN. DISPATCH's S3: "equality against the expected, not just counting —
// excess and duplicates are bugs." Their real incident: link annotations that
// were correct but DUPLICATED, invisible to the eye, and a ">= expected" count
// would have passed. Recon here found the gap real: inject-hreflang (94 lines)
// validates nothing about its own output, and duplicated hreflang / JSON-LD is
// the silent, SEO-penalised class of that same bug.
//
// WHAT IT ENFORCES, per HTML page in the build:
//   1. NO duplicate hreflang values (each language advertised at most once).
//   2. When the build carries 2+ locales (the injector's own run condition),
//      the hreflang SET is EXACTLY builtLocales + x-default — not more, not
//      less. Equality, not counting: an extra alternate is as much a bug as a
//      missing one.
//   3. At most ONE canonical link (two canonicals is the duplicate bug again).
//   4. NO two byte-identical JSON-LD blocks on one page.
//
// PARTIAL-BUILD HONESTY. Single-locale verification builds get no hreflang at
// all (the injector skips), so rule 2 is N/A there and says so — but rules 1,
// 3 and 4 always run: a duplicate is a bug in any build. Baselines here are
// permanently zero; there is no legitimate duplicate. CI's full 16-locale build
// exercises rule 2 for real.
//
// Expected locales are DERIVED the same way the injector derives them (top-level
// out/ dirs with an index.html) — one source of truth, no hardcoded 16.

import fs from "node:fs";
import path from "node:path";

const OUT = "out";

if (!fs.existsSync(OUT)) {
  console.error("[check-hreflang-integrity] FAIL: no out/ directory — run after a build.");
  process.exit(1);
}

const locales = fs
  .readdirSync(OUT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && fs.existsSync(path.join(OUT, e.name, "index.html")))
  .map((e) => e.name)
  .filter((n) => /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(n));

const fullSetActive = locales.length >= 2;
const expected = fullSetActive ? [...locales, "x-default"].sort().join(",") : null;

const problems = [];
let pages = 0;

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".html")) {
      pages += 1;
      const body = fs.readFileSync(p, "utf-8");

      const alts = [...body.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"/g)].map(
        (m) => m[1]
      );
      const dupAlts = alts.filter((v, i) => alts.indexOf(v) !== i);
      if (dupAlts.length > 0)
        problems.push(`${p} -> duplicate hreflang: ${[...new Set(dupAlts)].join(", ")}`);
      if (fullSetActive && alts.length > 0) {
        const got = [...new Set(alts)].sort().join(",");
        if (got !== expected)
          problems.push(`${p} -> hreflang set differs from built locales (got ${got})`);
      }

      const canonicals = (body.match(/<link[^>]*rel="canonical"/g) || []).length;
      if (canonicals > 1) problems.push(`${p} -> ${canonicals} canonical links (max 1)`);

      const ld = [...body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
        (m) => m[1]
      );
      if (ld.length !== new Set(ld).size)
        problems.push(`${p} -> byte-identical JSON-LD blocks duplicated`);
    }
  }
};
for (const loc of locales) walk(path.join(OUT, loc));

if (problems.length > 0) {
  console.error(
    `[check-hreflang-integrity] FAIL: ${problems.length} structural duplicate/inequality problem(s).`
  );
  for (const line of problems.slice(0, 20)) console.error(`  ${line}`);
  console.error(
    "  Fix: these are injector/layout output bugs — correct inject-hreflang.mjs or the layout metadata, never the built file. Baseline is permanently 0."
  );
  process.exit(1);
}

console.log(
  `[check-hreflang-integrity] OK: ${pages} page(s); 0 duplicate hreflang, 0 duplicate canonical, 0 duplicate JSON-LD${
    fullSetActive
      ? `; alternate sets equal built locales (${locales.length}+x-default)`
      : "; alternate-set equality N/A on single-locale build (injector skipped, matching its own rule)"
  }.`
);
