// Scratchpad analysis, not a guard. Splits glossary.ts into entry blocks at the
// 2-space object boundary, then reports every person entry whose personYear is
// not named by any of its own source labels.
import fs from "node:fs";
const src = fs.readFileSync("src/content/glossary/glossary.ts", "utf8");
const lines = src.split("\n");

// Entry blocks open with exactly "  {" and close with exactly "  }," or "  }".
const blocks = [];
let cur = null;
for (const line of lines) {
  if (line === "  {") { cur = []; continue; }
  if (cur && (line === "  }," || line === "  }")) { blocks.push(cur.join("\n")); cur = null; continue; }
  if (cur) cur.push(line);
}

const out = [];
for (const b of blocks) {
  const slug = (b.match(/^\s*slug:\s*"([^"]+)"/m) || [])[1];
  const yr = (b.match(/^\s*personYear:\s*(\d{3,4})/m) || [])[1];
  if (!slug || !yr) continue;
  const field = (b.match(/^\s*personField:\s*"([^"]+)"/m) || [])[1] || "";
  // Every source label and href in the block, in order.
  const labels = [...b.matchAll(/label:\s*"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
  const hrefs = [...b.matchAll(/href:\s*"([^"]+)"/g)].map(m => m[1]);
  const named = labels.some(l => l.includes(yr));
  out.push({ slug, yr, field, labels, hrefs, named });
}

const unnamed = out.filter(e => !e.named);
console.log(`person entries with personYear: ${out.length}`);
console.log(`  year NAMED by a source label:   ${out.length - unnamed.length}`);
console.log(`  year NOT named by any label:    ${unnamed.length}`);
fs.writeFileSync("scratchpad/py88.txt",
  unnamed.map(e => [e.slug, e.yr, e.field, e.labels.join(" | "), e.hrefs.join(" ")].join("\t")).join("\n") + "\n");
fs.writeFileSync("scratchpad/py-named.txt",
  out.filter(e => e.named).map(e => `${e.slug}\t${e.yr}`).join("\n") + "\n");

// Host histogram over the unnamed set, to size the remedies.
const hosts = new Map();
for (const e of unnamed) for (const h of e.hrefs) {
  try { const host = new URL(h).host; hosts.set(host, (hosts.get(host) || 0) + 1); } catch {}
}
console.log("\nhosts across the unnamed set:");
for (const [h, n] of [...hosts].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${h}`);
const noHref = unnamed.filter(e => e.hrefs.length === 0);
console.log(`\nunnamed entries with NO href at all: ${noHref.length}`);
for (const e of noHref) console.log(`  ${e.slug} (${e.yr}): ${e.labels.join(" | ")}`);
