#!/usr/bin/env node
// ============================================================================
// check-css-classes  —  every className a page uses must exist in the CSS.
// ----------------------------------------------------------------------------
// WHY THIS EXISTS. PRIME reported the roles pages rendering unformatted. The
// cause was mine: I wrote class names FROM MEMORY of other components rather
// than from the stylesheet, and `dig-kv`, `dig-notes`, `page-title`,
// `page-lede`, `section-title` and several more had never existed.
//
// tsc cannot see this. A guard cannot see it. The build succeeds, the page
// renders, and every rule silently does nothing — which is the worst class of
// fault this codebase has produced, because ALL THE MECHANISMS REPORTED GREEN.
//
// So: read the class names out of the page source, read the selectors out of
// the CSS, and fail on any that the stylesheet has never heard of.
// ============================================================================

import fs from "node:fs";
import path from "node:path";

// Every directory that can define a rule. src/components was MISSING until
// 2026-09-26, and the omission made this guard lie in both directions: it
// reported the colophon's four .ls-status--* dots as undefined when they are
// defined in src/components/LanguageSwitcher.css, and it would equally have
// missed a page relying on a component rule that had been deleted. A guard that
// reads only part of the CSS cannot answer the question it was written to ask.
const CSS_DIRS = ["src/app", "src/styles", "src/components"];
const PAGE_ROOT = "src/app";

function walk(dir, test, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, test, out);
    else if (test(full)) out.push(full);
  }
  return out;
}

// --- every selector the stylesheets define --------------------------------
const known = new Set();
for (const dir of CSS_DIRS) {
  for (const f of walk(dir, (x) => x.endsWith(".css"))) {
    const css = fs.readFileSync(f, "utf8");
    for (const m of css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) known.add(m[1]);
  }
}
if (known.size === 0) {
  console.error("[check-css-classes] FAIL: no CSS selectors found; check CSS_DIRS.");
  process.exit(1);
}

// Utility names that are generated or global rather than authored per-component.
const ALLOW = new Set(["mono", "sr-only", "visually-hidden"]);

// ---------------------------------------------------------------------------
// DECLARED HOOKS - a class that CORRECTLY has no rule, with the reason.
//
// This replaced a bare count on 2026-09-26. A ratchet says "thirteen of these
// are tolerated" and cannot say WHICH, so it tolerates the next typo just as
// readily as the thirteen it was set for. Each entry below was checked against
// the stylesheet and the page, and carries why the absence of a rule is right.
// Anything NOT on this list and not in the CSS fails. The list may only shrink.
//
// Keyed file::class, deliberately: the same name may be a deliberate hook on
// one page and a typo on another, and a blanket name exemption cannot tell the
// difference.
const DECLARED_HOOKS = new Map([
  // -- plain positions in a working section alternation. These pages band
  //    every other section (see canon AUDIT-band-rhythm-20260816). Giving
  //    these a background would put two banded sections side by side, which
  //    is what that audit calls noise rather than rhythm.
  ["app/[locale]/about/credentials/page.tsx::certs-historical-section",
   "plain 3rd position; certs-recognition-section banded at 2nd"],
  ["app/[locale]/colophon/page.tsx::colophon-concord-section",
   "plain 1st position; colophon-seats-section banded at 2nd"],
  ["app/[locale]/colophon/page.tsx::colophon-thanks-section",
   "plain 8th position; section-accent banded at 7th"],

  // -- the reading measure is held on the PROSE, not the container. Both
  //    strategies exist on this site and reach the same result: certs,
  //    colophon and era cap the container at 44-50rem, while these two cap
  //    .api-lede / .api-body at 70ch and .page-hero-lede at 60ch.
  ["app/[locale]/api/page.tsx::api-page",
   "measure set by .api-lede and .api-body at 70ch"],
  ["app/[locale]/contact/page.tsx::contact-container",
   "measure set by .page-hero-lede at 60ch; also wraps the 2-col .contact-layout"],

  // -- an item or column whose spacing comes entirely from the parent's gap.
  //    A rule on the item would double the spacing the parent already sets.
  ["app/[locale]/about/credentials/page.tsx::certs-vendor-group",
   "spacing from the parent's gap"],
  ["app/[locale]/colophon/page.tsx::colophon-principle",
   "item in .colophon-principles, grid gap 1.75rem"],
  ["app/[locale]/roadmap/page.tsx::roadmap-group",
   "item in .roadmap-groups, flex column gap 2.5rem"],
  ["app/[locale]/sitemap/page.tsx::sitemap-group",
   "item in .sitemap-groups, grid gap 28px"],
  ["app/[locale]/contact/page.tsx::contact-form-col",
   "grid column in .contact-layout, gap clamp(2rem, 5vw, 3.5rem)"],

  // -- a family root whose children carry the rules. The root names the family
  //    so the children read as belonging to it; the visual treatment is on the
  //    children. Removing the root would break the naming system.
  ["app/[locale]/training/page.tsx::teach-block",
   "root of .teach-block-title / .teach-block-body"],
  ["app/[locale]/training/page.tsx::teach-instructor",
   "root of .teach-instructor-eyebrow and siblings"],
  ["app/[locale]/admin1029384756/page.tsx::admin-fam",
   "root of .admin-fam-count"],
]);

const problems = [];
let checked = 0;
for (const f of walk(PAGE_ROOT, (x) => x.endsWith(".tsx"))) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/className="([a-z0-9 _-]+)"/g)) {
    for (const cls of m[1].split(/\s+/).filter(Boolean)) {
      checked += 1;
      if (!known.has(cls) && !ALLOW.has(cls)) {
        const rel = f.replace(/^src\//, "");
        if (DECLARED_HOOKS.has(`${rel}::${cls}`)) continue;
        problems.push(`${rel}: "${cls}" is used and never defined`);
      }
    }
  }
}

// --- NO LONGER A RATCHET ---------------------------------------------------
//
// It was one from 2026-09-05 to 2026-09-26, and the first run found 21
// undefined class names across pages nobody had asked about. A ratchet was
// right then: rewriting seven unrelated pages to satisfy a guard written that
// day would have been the manufactured edit this canon refuses.
//
// It is closed now, and the number is ZERO. The 19 it held were resolved by
// reading each one against the stylesheet and the page:
//
//   4  were never undefined. CSS_DIRS did not include src/components, so the
//      colophon's .ls-status--* dots were reported missing while sitting in
//      LanguageSwitcher.css. The guard's own scope was the fault.
//   1  was a REAL rendering defect. `type-badge` on /industry/milestones was
//      borrowed from .tmsh-type-badge in the tool components and defined
//      nowhere, so every milestone attribution ("Charles Kao and George
//      Hockham") rendered as unstyled inline text at the same size as the
//      title beside it. Renamed .lineage-deal-who, into its own family, and
//      given the secondary-attribution treatment .lineage-deal-price uses.
//      This is precisely the fault that produced this guard.
//   1  was dead. `roadmap-hero` added a name to a section that all eleven
//      other pages on the generic .page-hero-* path wrap in a bare `section`.
//      Removed rather than given an invented rule.
//  13  correctly have no rule, and are now DECLARED above with the reason
//      each. Three sit in plain positions of a working band alternation; two
//      hold their measure on the prose instead of the container; five are
//      items whose spacing comes from a parent's gap; three are family roots
//      whose children carry the rules.
//
// What this buys over the count it replaced: a number cannot say WHICH
// thirteen, so it tolerated the fourteenth typo exactly as readily. The list
// can. Every undeclared class is a failure again, which is what the guard was
// written to enforce.
const BASELINE = 0;

const uniq = [...new Set(problems)];
if (uniq.length > BASELINE) {
  console.error(`\n[check-css-classes] FAIL: ${uniq.length} undefined class name(s), above the baseline of ${BASELINE}.\n`);
  for (const p of uniq.slice(0, 25)) console.error(`      ${p}`);
  console.error("\n      A class with no rule behind it renders unformatted while every other check reports green.\n");
  process.exit(1);
}

console.log(
  `[check-css-classes] OK: ${checked} class use(s); ${uniq.length} undefined (baseline ${BASELINE}, may only go down).` +
  (uniq.length < BASELINE ? ` LOWER THAN BASELINE - drop BASELINE to ${uniq.length}.` : ""),
);
