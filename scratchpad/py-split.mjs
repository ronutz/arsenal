// Splits the still-unnamed personYear entries by WHY they are unnamed, because
// one uniform reason across sixty-three entries is a bare tolerance count in
// disguise: it cannot tell a deliberate anchor from a careless one.
//   PROSE  - the entry's own en or pt-BR prose states the year; no label does.
//   SILENT - neither the labels nor the prose state it. Needs a source, or an
//            explicit editorial declaration.
import fs from "node:fs";
const rows = fs.readFileSync("scratchpad/py88.txt", "utf8").trim().split("\n")
  .map(l => { const [slug, yr, field, labels, hrefs] = l.split("\t"); return { slug, yr, field, labels, hrefs }; });
const en = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8")).glossary.entries;
const pt = JSON.parse(fs.readFileSync("src/i18n/messages/pt-BR.json", "utf8")).glossary.entries;

const prose = [], silent = [];
for (const r of rows) {
  const texts = [en[r.slug], pt[r.slug]].filter(Boolean)
    .flatMap(v => [v.def || "", v.context || ""]).join(" ");
  (texts.includes(r.yr) ? prose : silent).push(r);
}
const byField = a => { const m = new Map(); for (const r of a) m.set(r.field, (m.get(r.field) || 0) + 1); return [...m].sort((x, y) => y[1] - x[1]); };
console.log(`still unnamed by any label: ${rows.length}`);
console.log(`\nPROSE  (the entry's own text states the year): ${prose.length}`);
for (const [f, n] of byField(prose)) console.log(`   ${String(n).padStart(2)}  ${f}`);
console.log(`\nSILENT (no label and no prose states it):      ${silent.length}`);
for (const [f, n] of byField(silent)) console.log(`   ${String(n).padStart(2)}  ${f}`);
fs.writeFileSync("scratchpad/py-prose.txt", prose.map(r => `${r.slug}\t${r.yr}\t${r.field}\t${r.hrefs}`).join("\n") + "\n");
fs.writeFileSync("scratchpad/py-silent.txt", silent.map(r => `${r.slug}\t${r.yr}\t${r.field}\t${r.hrefs}`).join("\n") + "\n");
