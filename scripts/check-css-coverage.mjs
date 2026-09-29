// ============================================================================
// scripts/check-css-coverage.mjs
// ----------------------------------------------------------------------------
// PREBUILD GUARD (curated CSS coverage): stops a component from shipping with
// an entire missing stylesheet family, the failure mode behind five incidents
// found on 2026-07-07 - http-request-translator (36 undefined classes),
// TelemetryStreaming/AS3/DO explainers (28/26/26), and the 404 page (35).
// Each rendered as unstyled browser defaults in production while every other
// guard stayed green, because nothing connected className usage to CSS.
//
// CURATED, not naive: a raw "every class must exist" audit false-positives on
// ~60 healthy components, so three mechanical rules separate signal from noise:
//   1. Tokens are kebab-case with a hyphen and no trailing dash. This drops
//      template-literal stems ("as3-verdict-" from `as3-verdict-${sev}`) and
//      incidental string literals inside className={...} expressions
//      ("explain", "warn", comparison operands) that are not class names.
//   2. ALIASES are exempt when stacked with a defined sibling in the same
//      className attribute (the house pattern "cidr-tool jwt-tool dig-tool
//      curl-tool", where the first is styled and the rest are semantic
//      hooks by design). This is safe against the incident class because
//      every catastrophe presented as a standalone family: re-running the
//      five incidents under this rule still measures 20-36.
//   3. A component only FAILS at >= THRESHOLD real-missing classes. Healthy
//      components measure 0-6 under rules 1-2; known partial gaps (tracked
//      for a cleanup pass) peak at ~10; the five incidents measured 20-36.
//      THRESHOLD 12 sits in the gap with margin on both sides.
//
// Below the threshold, the worst residuals are PRINTED (non-fatal) so partial
// gaps stay visible on every build instead of hiding until they compound.
//
// Read-only text scan, mirroring check-tool-docs.mjs: no imports of app code.
// ============================================================================

import { readFileSync, readdirSync } from "node:fs";

// THRESHOLD: 12 -> 4 on 2026-09-27, after the corpus was actually cleaned.
//
// 12 was chosen when healthy components measured 0-6, partial gaps peaked near
// 10, and the five incidents measured 20-36. It sat in the gap and it was the
// right number for that corpus. The corpus has changed:
//
//   BEFORE  178 real-missing class uses across 52 components, worst 8
//   NOW       7 real-missing class uses across  5 components, worst 2
//
// What was repaired, and it was not tidiness:
//   - The dig-* family: EIGHT names used 236 times by seventeen tools and
//     defined nowhere, including .dig-kv and .dig-notes, which are named in
//     check-css-classes' own header as the founding fault. Every result section
//     in those seventeen rendered as browser defaults. Authored in-family from
//     .jwt-panel, .dig-warning-list, .dig-meaning and .dig-row.
//   - Two tools using a jwt-* FORM family that exists in no stylesheet and no
//     other component, and using `jwt-tool` as a standalone root where 47
//     siblings use `cidr-tool jwt-tool`. Repointed at the house pattern.
//   - 107 more references across 28 components: cidr-h, cidr-result,
//     cidr-result-title, cidr-list, cidr-hint, cidr-result-block, tmsh-name,
//     json-error, json-error-title and type-badge, each repointed at the
//     defined equivalent that already existed in its own family.
//   - The last six in HttpRequestTranslator, one of the five incidents named
//     above: down from 36 to 0.
//   - A blind spot in this guard's own rule 2, described at classGroups below.
//
// The seven that remain are NOT defects, and are listed so nobody "fixes" them:
//   lineage-acq, lineage-founded-body, rca-evidence-col, vprofile-block
//     semantic wrappers and family roots whose children carry the rules
//   ws-line, ws-line--rx
//     the base and the DEFAULT variant of a base/variant scheme: .ws-line--tx
//     and .ws-line--sys are the deviations, rx inherits .ws-console's colour
//   gloss-hint-off
//     a state variant of the defined .gloss-hint
//
// 4 keeps margin over the current worst of 2 while catching a whole family
// arriving unstyled, which is the failure this guard exists for.
const THRESHOLD = 4;

// -- 1. Collect every class the stylesheets define ---------------------------
// Comments are stripped first so a class mentioned in prose (".poison-stat is
// also used by...") never counts as a definition.
const CSS_FILES = [
  "src/app/components.css",
  "src/app/globals.css",
  "src/app/not-found.css", // the 404's self-contained stylesheet (own shell, own theme)
  "src/components/LanguageSwitcher.css",
];
const css = CSS_FILES.map((f) => readFileSync(f, "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const defined = new Set([...css.matchAll(/\.([A-Za-z][A-Za-z0-9_-]*)/g)].map((m) => m[1]));

// -- 2. Extract className token GROUPS from a component ----------------------
// Groups (one per className attribute) preserve sibling context for rule 2.
// Static attributes are read directly; for className={...} the balanced brace
// body is walked and every string/template literal inside contributes tokens
// (template ${...} spans blanked first), covering ternaries and concatenation.
// Two token lists per className attribute, for two different questions.
//
// `tokensOf` is what gets REPORTED, and the hyphen requirement earns its place
// there: it drops template stems and the incidental string literals that live
// inside className={...} expressions ("explain", "warn", comparison operands).
//
// `siblingsOf` is what decides whether an element is styled at all, and the
// hyphen requirement was WRONG there until 2026-09-27. It silently discarded
// every hyphen-less class from sibling detection, so `className="seg seg--layers"`
// looked unstyled even though `.seg` carries the whole control - border, radius,
// inline-flex, background. Rule 2 cannot answer "is this element styled" while
// it is blind to `.seg`, `.card`, `.mono` and every other single-word class.
function classGroups(src) {
  const groups = [];
  const clean = (s) => s.replace(/\$\{[^}]*\}/g, " ").split(/\s+/);
  const siblingsOf = (s) =>
    clean(s).filter((t) => /^[a-z][a-z0-9-]*$/i.test(t) && !t.endsWith("-"));
  const tokensOf = (s) =>
    clean(s).filter((t) => /^[a-z][a-z0-9-]*$/i.test(t) && t.includes("-") && !t.endsWith("-"));
  for (const m of src.matchAll(/className="([^"]+)"/g)) {
    const g = tokensOf(m[1]);
    if (g.length) groups.push({ tokens: g, siblings: siblingsOf(m[1]) });
  }
  let i = 0;
  while ((i = src.indexOf("className={", i)) !== -1) {
    let j = i + 11;
    let depth = 1;
    while (j < src.length && depth > 0) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") depth--;
      j++;
    }
    const body = src.slice(i + 11, j - 1);
    const g = [];
    const sib = [];
    for (const m of body.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      g.push(...tokensOf(m[1]));
      sib.push(...siblingsOf(m[1]));
    }
    if (g.length) groups.push({ tokens: g, siblings: sib });
    i = j;
  }
  return groups;
}

// -- 3. Score every component -------------------------------------------------
const rows = [];
for (const f of readdirSync("src/components").filter((x) => x.endsWith(".tsx"))) {
  const missing = new Set();
  const aliased = new Set();
  for (const group of classGroups(readFileSync("src/components/" + f, "utf8"))) {
    const hasDefinedSibling = group.siblings.some((t) => defined.has(t));
    for (const t of group.tokens) {
      if (defined.has(t)) continue;
      if (hasDefinedSibling) aliased.add(t); // rule 2: styled via sibling
      else missing.add(t);
    }
  }
  for (const t of aliased) missing.delete(t); // any aliased use wins
  if (missing.size) rows.push({ f, missing: [...missing].sort() });
}
rows.sort((a, b) => b.missing.length - a.missing.length);

// -- 4. Verdict ----------------------------------------------------------------
const failures = rows.filter((r) => r.missing.length >= THRESHOLD);
if (failures.length) {
  for (const r of failures) {
    console.error(
      `[check-css-coverage] FAIL: ${r.f} uses ${r.missing.length} CSS classes defined nowhere ` +
        `(threshold ${THRESHOLD}) - an entire stylesheet family is missing. Author its block in ` +
        `src/app/components.css (container aliases stacked with a styled sibling are exempt automatically).\n` +
        `  missing: ${r.missing.join(" ")}`
    );
  }
  process.exit(1);
}

const worst = rows.slice(0, 5).map((r) => `${r.f.replace("Tool.tsx", "").replace(".tsx", "")}:${r.missing.length}`);
const max = rows.length ? rows[0].missing.length : 0;
console.log(
  rows.length
    ? `[check-css-coverage] OK: no component reaches ${THRESHOLD} real-missing CSS classes ` +
      `(max ${max}; worst residuals: ${worst.join(", ")} - partial gaps tracked).`
    : `[check-css-coverage] OK: every component's CSS classes are fully covered ` +
      `(0 real-missing across the codebase; threshold ${THRESHOLD}).`
);
