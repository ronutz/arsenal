// check-confidential-terms.mjs — P-1, ratified by PRIME 2026-08-19.
//
// THE RULING THIS GUARD EXECUTES (PRIME, standing, permanent): the names of
// direct consulting clients are NEVER published. Engagements may be described
// BY SHAPE ("a national insurer during a live outage"), never by name. And
// Mindstream, the legal vehicle, is excluded from ordinary public copy.
//
// Until today that ruling lived only as canon text. This guard is the scar made
// executable — the idea arrived from DISPATCH's governance export (§4.5,
// confidentiality sweep of delivery packages), which is our own philosophy
// ("every living rule becomes a check") applied to a ruling of ours that had
// none. Origin credited in canon/current/ANALISE-governanca-dispatch-20260819.md.
//
// Mechanics:
//   - Sweeps every file in out/ (the delivery artefact, not the source tree —
//     canon and code comments MAY contain these names; "telling me is not the
//     same as publishing").
//   - CASE-SENSITIVE on purpose: "porto seguro" lower-case is an ordinary
//     Portuguese phrase (safe harbour) and must not false-positive; the client
//     name is title-cased. The other names have no common-phrase collision but
//     keep the same discipline.
//   - BASELINE is 0 and can never be anything else. There is no legitimate hit.
//   - Runs post-build. On partial (single-locale) verification builds a zero is
//     necessary but not sufficient; CI builds all locales and sweeps everything.
//   - The failure message names the file and the term, per the guard-message
//     rule: say what to fix, not just that it failed.

import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const FORBIDDEN = [
  "Mapfre",
  "Porto Seguro",
  "Inmetrics",
  "Sigma Telecom",
  "Mindstream",
];

if (!fs.existsSync(OUT)) {
  console.error("[check-confidential-terms] FAIL: no out/ directory — run after a build.");
  process.exit(1);
}

const hits = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      // Text-bearing formats only; images and fonts cannot carry the names as text.
      if (!/\.(html|xml|txt|json|js|css|svg|webmanifest)$/i.test(entry.name)) continue;
      const body = fs.readFileSync(p, "utf-8");
      for (const term of FORBIDDEN) {
        if (body.includes(term)) hits.push({ file: p, term });
      }
    }
  }
};
walk(OUT);

if (hits.length > 0) {
  console.error(
    `[check-confidential-terms] FAIL: ${hits.length} occurrence(s) of ruled-confidential terms in the build output.`
  );
  for (const h of hits.slice(0, 20)) {
    console.error(`  ${h.file} -> "${h.term}"`);
  }
  console.error(
    "  Fix: remove the name from the source that produced this page; describe the engagement BY SHAPE. The ruling admits no exceptions and this baseline is permanently 0."
  );
  process.exit(1);
}

console.log(
  `[check-confidential-terms] OK: 0 occurrence(s) of ${FORBIDDEN.length} ruled-confidential term(s) across the build output (baseline 0, permanent).`
);
