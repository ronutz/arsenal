// check-confidential-terms.mjs — P-1, ratified by PRIME 2026-08-19.
//
// THE RULING THIS GUARD EXECUTES.
//
// ORIGINAL (PRIME, 2026-08-19): the names of direct consulting clients are
// NEVER published; engagements are described BY SHAPE, never by name. And
// Mindstream, the legal vehicle, is excluded from ordinary public copy.
//
// AMENDED (PRIME, 2026-09-02): "the names of direct consulting clients CAN be
// published as long as they are not mentioned as my direct consulting clients."
//
// That is a narrower and more accurate statement of what the ruling was always
// protecting. The harm was never the NAME - these are public companies that
// appear in channel directories, press and award lists. The harm is the
// ASSOCIATION: publishing that this company is his client, which is his
// counterparty's information as much as his.
//
// So the guard stopped matching names and started matching names IN CONTEXT:
//   - a ruled name near client/engagement vocabulary  -> FAIL
//   - a ruled name near first-person or possessive language -> FAIL
//   - a ruled name on a page that is ABOUT HIM -> FAIL, because there the page
//     itself supplies the association even if the sentence does not
//   - a ruled name in ordinary third-party prose -> allowed
//
// MINDSTREAM IS NOT RELAXED. The amendment speaks about consulting CLIENTS;
// Mindstream is his own legal vehicle, excluded from public copy by a different
// ruling that was not amended. It stays absolute, and a reading that quietly
// widened the amendment to cover it would be me deciding something PRIME did
// not say.
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

// SCOPED EXCEPTIONS (PRIME, 2026-09-02).
// -----------------------------------------------------------------------------
// PRIME clarified that the ruling exists to protect ASSOCIATIONS WITH HIM, and
// that a ruled name appearing in prose with no connection to him is not the
// defect the ruling was written against. The guard had no way to express that:
// a term was forbidden everywhere, so the only options were to publish nothing
// or to weaken the list.
//
// An exception is {term, file substring, reason}. It is deliberately narrow -
// it admits ONE term in ONE place, with a written reason, in the same style as
// the ALLOWED_SHADOWS list in check-redirect-shadowing.
//
// WHAT THIS IS NOT: a way to publish a client. If a ruled name is on the list
// because the company is a direct consulting client, then the company being
// discussed in another role does NOT make the name publishable - the ruling is
// about the name, not about the sentence around it. Those cases go to PRIME.
const ALLOWED = [
  // { term: "...", file: "out/en/...", reason: "..." },
];

// Client names: publishable in neutral third-party prose, never as his clients.
const CLIENT_NAMES = ["Mapfre", "Porto Seguro", "Inmetrics", "Sigma Telecom"];

// Absolute, unchanged by the 2026-09-02 amendment (see header).
const ALWAYS_FORBIDDEN = ["Mindstream"];

// Vocabulary that turns a mention into an association. English and Portuguese,
// because the site ships both and a Portuguese page is as public as an English
// one. Kept deliberately broad: a false positive costs one sentence rewrite, a
// false negative publishes a client relationship.
const ASSOCIATION = [
  "client", "cliente", "consult", "engagement", "engajamento", "advisory",
  "assessoria", "contratante", "delivered for", "entregue para", "project for",
  "projeto para", "worked with", "trabalhei", "trabalhou com", "my ", "our ",
  "meu ", "minha ", "nosso ", "nossa ", "Rodolfo", "Nutzmann", "N\u00fctzmann",
];

// Pages that are about him. A ruled name here is an association by context, so
// proximity is not required.
const PERSONAL_PATHS = [
  "/about", "/advisory", "/speaking", "/endorsements", "/contact",
  "/training", "/red-education", "/credentials",
];

// How far from the name the association vocabulary has to be to count. One
// paragraph either side, which is where a sentence about a company and a
// sentence about his work with it would sit.
const WINDOW = 400;

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
      const personalPage = PERSONAL_PATHS.some((seg) => p.includes(seg));

      for (const term of ALWAYS_FORBIDDEN) {
        if (body.includes(term)) hits.push({ file: p, term, why: "absolute" });
      }

      for (const term of CLIENT_NAMES) {
        if (!body.includes(term)) continue;
        if (ALLOWED.some((a) => a.term === term && p.includes(a.file))) continue;

        if (personalPage) {
          hits.push({ file: p, term, why: "named on a page about PRIME" });
          continue;
        }
        // Proximity: does association vocabulary sit within a paragraph of it?
        let associated = null;
        let from = 0;
        while (associated === null) {
          const at = body.indexOf(term, from);
          if (at === -1) break;
          const near = body.slice(Math.max(0, at - WINDOW), at + term.length + WINDOW);
          const found = ASSOCIATION.find((w) => near.includes(w));
          if (found) associated = found;
          from = at + term.length;
        }
        if (associated) {
          hits.push({ file: p, term, why: `near "${associated}"` });
        }
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
    console.error(`  ${h.file} -> "${h.term}" (${h.why})`);
  }
  console.error(
    "  Fix: remove the name from the source that produced this page; describe the engagement BY SHAPE.\n  If the hit is a genuine collision with no association to PRIME, add a scoped entry to ALLOWED with a reason - and if the name is on the list because the company is a client, take it to PRIME instead."
  );
  process.exit(1);
}

console.log(
  `[check-confidential-terms] OK: 0 occurrence(s) of ${CLIENT_NAMES.length + ALWAYS_FORBIDDEN.length} ruled-confidential term(s) across the build output (baseline 0, permanent).`
);
