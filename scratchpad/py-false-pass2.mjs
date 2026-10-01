// The first version of this audit displayed only the FIRST label that contained
// the anchor year, which made marisa-bellisario look like a false pass: the
// Treccani label mentions "the ten-year telecommunications plan of 1981-90",
// while her Storia Olivetti label says "sole managing director from August 1981"
// and Italian Wikipedia says "returned in 1981 to lead Italtel". She is properly
// named; my display was misleading.
//
// This version tests EVERY occurrence of the anchor year across ALL of an entry's
// labels, and flags an entry only when the year NEVER appears outside a range
// expression ("1981-90", "1952-1959") - the pattern that produced the illusion.
// A year that appears at least once on its own is attributed prose, not a range.
import fs from "node:fs";
const src = fs.readFileSync("src/content/glossary/glossary.ts", "utf8");
const blocks = []; let cur = null;
for (const l of src.split("\n")) {
  if (l === "  {") { cur = []; continue; }
  if (cur && (l === "  }," || l === "  }")) { blocks.push(cur.join("\n")); cur = null; continue; }
  if (cur) cur.push(l);
}
const onlyInRange = [];
let named = 0;
for (const b of blocks) {
  const slug = (b.match(/^\s*slug: "([^"]+)"/m) || [])[1];
  const yr = (b.match(/^\s*personYear: (\d{3,4})/m) || [])[1];
  if (!slug || !yr) continue;
  const labels = [...b.matchAll(/label: "((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
  const hits = [];
  for (const l of labels) {
    let i = -1;
    while ((i = l.indexOf(yr, i + 1)) !== -1) {
      const after = l.slice(i + yr.length, i + yr.length + 6);
      const before = l.slice(Math.max(0, i - 6), i);
      // A range expression: the year is joined to another year by a hyphen or "to".
      const isRange = /^\s*(-|–|to )\s*\d{2,4}/.test(after) || /\d{2,4}\s*(-|–|to )\s*$/.test(before);
      hits.push({ isRange, window: l.slice(Math.max(0, i - 70), i + 90) });
    }
  }
  if (hits.length === 0) continue;   // declared; not this audit
  named += 1;
  if (hits.every(h => h.isRange)) onlyInRange.push({ slug, yr, windows: hits.map(h => h.window) });
}
console.log(`named entries audited: ${named}`);
console.log(`entries whose anchor year appears ONLY inside a range expression: ${onlyInRange.length}\n`);
for (const e of onlyInRange) {
  console.log(`  ${e.slug} (${e.yr})`);
  for (const w of e.windows) console.log(`      ...${w}...`);
}
