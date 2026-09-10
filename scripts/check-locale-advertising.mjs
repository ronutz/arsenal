// ============================================================================
// scripts/check-locale-advertising.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: navigation offers only locales that actually exist.
//
// PRIME, 2026-09-10: "hide the 26 stubs from navigation until we know which
// ones will make it."
//
// WHY A GUARD AND NOT JUST THE EDIT. The switcher listing every registered
// locale was a deliberate design, documented in its own header, with a status
// dot and a "not translated yet" notice. A future reader who finds
// `LIVE_LOCALES` there and does not know the history has every reason to
// "restore" `LOCALES` and think they are fixing a regression. This guard makes
// that revert fail loudly, and its message says why it exists.
//
// THE REASON THE RULE MATTERS, in one line, because a guard nobody understands
// gets deleted: the Worker answers a stub path with a **301 Permanent
// Redirect** to English. Browsers cache 301s hard and for a long time. Every
// click on an offered stub burns a permanent redirect into that visitor's
// browser, so if the locale is later promoted, those visitors keep landing on
// English and never see the translation. Advertising a stub is not a cosmetic
// choice, it is a cache decision that outlives it.
//
// WHAT IT CHECKS. Any component that renders a locale CHOOSER must derive its
// list from LIVE_LOCALES (or LIVE_LOCALE_CODES), never from the full LOCALES
// registry. LOCALES itself stays - the Worker needs it to recognise a stub path
// and redirect it, and that behaviour is deliberately unchanged, so existing
// links keep working.
//
// It deliberately does NOT check the Worker, which must keep reading LOCALES.
// ============================================================================

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-locale-advertising]";

// Components that present a list of languages to a human. Add to this list if
// another chooser appears; the point is the list is explicit rather than
// pattern-matched, so nobody has to guess what counts as "navigation".
const CHOOSERS = ["src/components/LanguageSwitcher.tsx"];

const errors = [];

for (const rel of CHOOSERS) {
  const file = path.join(ROOT, rel);
  if (!existsSync(file)) {
    errors.push(`${rel} does not exist - the chooser moved and this guard did not follow`);
    continue;
  }
  const src = readFileSync(file, "utf8");

  // Strip comments before looking for the identifier, so the explanatory prose
  // in the component's own header (which necessarily says the word LOCALES)
  // cannot trip or satisfy the check.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");

  const usesLive = /\bLIVE_LOCALES\b|\bLIVE_LOCALE_CODES\b/.test(code);
  // A bare LOCALES reference that is not part of LIVE_LOCALES / ORDERED_LOCALES.
  const bareLocales = [...code.matchAll(/(?<![A-Z_])LOCALES\b/g)].filter((m) => {
    const before = code.slice(Math.max(0, m.index - 20), m.index);
    return !/LIVE_$|ORDERED_$/.test(before);
  });

  if (!usesLive) {
    errors.push(`${rel}: builds its list from the full registry; use LIVE_LOCALES`);
  }
  // A single LOCALES reference is tolerated for the `getLocale(...) ?? LOCALES[0]`
  // fallback, which is about resolving the ACTIVE locale, not about what is
  // offered. More than that means the list itself is probably back on LOCALES.
  if (bareLocales.length > 2) {
    errors.push(
      `${rel}: ${bareLocales.length} references to the full LOCALES registry ` +
        `(expected at most 2, for the active-locale fallback and the type import)`
    );
  }
}

// The Worker must still know about stubs, or their URLs stop resolving.
const workerFile = path.join(ROOT, "worker", "index.ts");
if (existsSync(workerFile)) {
  const w = readFileSync(workerFile, "utf8");
  if (!/isStubLocale/.test(w)) {
    errors.push(
      "worker/index.ts no longer handles stub locales - existing links to a stub " +
        "path would stop redirecting to English and start 404ing"
    );
  }
}

if (errors.length) {
  console.error(`\n${TAG} FAIL: ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(
    `\n  Navigation offers LIVE locales only (PRIME, 2026-09-10). The Worker still\n` +
      `  recognises stub paths and 301s them to English, so old links keep working.\n` +
      `  See the header of this file for why advertising a stub is a CACHE decision\n` +
      `  and not a cosmetic one.\n`
  );
  process.exit(1);
}

console.log(`${TAG} OK: chooser lists live locales only; Worker still resolves stub paths.`);
