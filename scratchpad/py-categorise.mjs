// Builds the declared list for the guard from EVIDENCE rather than one blanket
// reason, using the three facts established for every still-unnamed entry:
// does a source LABEL name the year, does the entry's own COPY state it, and
// does the cited PAGE state it. Four categories fall out, and the fourth is the
// only one that needs PRIME: a year no document and no copy anywhere states.
import fs from "node:fs";
const pages = new Map();
for (const line of fs.readFileSync("scratchpad/py-page-check.tsv", "utf8").trim().split("\n")) {
  const [slug, yr, field, verdict, href] = line.split("\t");
  pages.set(slug, { verdict, href });
}
const en = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8")).glossary.entries;
const pt = JSON.parse(fs.readFileSync("src/i18n/messages/pt-BR.json", "utf8")).glossary.entries;
const rows = fs.readFileSync("scratchpad/py88.txt", "utf8").trim().split("\n")
  .map(l => { const [slug, yr, field] = l.split("\t"); return { slug, yr, field }; });

const cats = { "COPY+PAGE": [], "PAGE-ONLY": [], "COPY-ONLY": [], "NEITHER": [] };
for (const r of rows) {
  const copy = [en[r.slug], pt[r.slug]].filter(Boolean)
    .flatMap(v => [v.def || "", v.context || ""]).join(" ").includes(r.yr);
  const page = (pages.get(r.slug) || {}).verdict === "STATES";
  const key = copy && page ? "COPY+PAGE" : page ? "PAGE-ONLY" : copy ? "COPY-ONLY" : "NEITHER";
  cats[key].push(r);
}
for (const [k, v] of Object.entries(cats)) {
  console.log(`${k.padEnd(10)} ${String(v.length).padStart(2)}  ${v.map(r => r.slug).join(" ")}`);
  console.log();
}
fs.writeFileSync("scratchpad/py-categories.json", JSON.stringify(
  Object.fromEntries(Object.entries(cats).map(([k, v]) =>
    [k, v.map(r => ({ slug: r.slug, year: r.yr, field: r.field, href: (pages.get(r.slug) || {}).href || "" }))])), null, 2));
