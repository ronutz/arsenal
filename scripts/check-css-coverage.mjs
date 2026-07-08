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

const THRESHOLD = 12;

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
function classGroups(src) {
  const groups = [];
  const tokensOf = (s) =>
    s
      .replace(/\$\{[^}]*\}/g, " ")
      .split(/\s+/)
      .filter((t) => /^[a-z][a-z0-9-]*$/i.test(t) && t.includes("-") && !t.endsWith("-"));
  for (const m of src.matchAll(/className="([^"]+)"/g)) {
    const g = tokensOf(m[1]);
    if (g.length) groups.push(g);
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
    for (const m of body.matchAll(/["'`]([^"'`]*)["'`]/g)) g.push(...tokensOf(m[1]));
    if (g.length) groups.push(g);
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
    const hasDefinedSibling = group.some((t) => defined.has(t));
    for (const t of group) {
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
