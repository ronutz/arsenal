// The guard's test is "does a label contain the year", which an INCIDENTAL year
// satisfies - proven by glenn-ricart. So audit the 125 entries the guard now
// counts as named: which of them rest on a label that mentions SEVERAL years, so
// that a reader cannot tell which one the anchor refers to? Those are where a
// false pass can hide.
import fs from "node:fs";
const src = fs.readFileSync("src/content/glossary/glossary.ts", "utf8");
const lines = src.split("\n");
const blocks = []; let cur = null;
for (const l of lines) {
  if (l === "  {") { cur = []; continue; }
  if (cur && (l === "  }," || l === "  }")) { blocks.push(cur.join("\n")); cur = null; continue; }
  if (cur) cur.push(l);
}
const risky = [], clean = [];
for (const b of blocks) {
  const slug = (b.match(/^\s*slug: "([^"]+)"/m) || [])[1];
  const yr = (b.match(/^\s*personYear: (\d{3,4})/m) || [])[1];
  if (!slug || !yr) continue;
  const labels = [...b.matchAll(/label: "((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
  const naming = labels.filter(l => l.includes(yr));
  if (naming.length === 0) continue;                       // declared; not this audit
  // Distinct 4-digit years in the labels that name the anchor.
  const years = new Set();
  for (const l of naming) for (const m of l.matchAll(/\b(1[6-9]\d\d|20\d\d)\b/g)) years.add(m[1]);
  (years.size > 1 ? risky : clean).push({ slug, yr, others: [...years].filter(y => y !== yr), label: naming[0] });
}
console.log(`named entries: ${risky.length + clean.length}`);
console.log(`  label names ONLY the anchor year:        ${clean.length}`);
console.log(`  label names the anchor AND other years:  ${risky.length}  <- audit these`);
console.log();
for (const r of risky) console.log(`${r.slug.padEnd(24)} ${r.yr}  also: ${r.others.join(",")}`);
fs.writeFileSync("scratchpad/py-risky.txt", risky.map(r => `${r.slug}\t${r.yr}\t${r.others.join(",")}\t${r.label}`).join("\n") + "\n");
