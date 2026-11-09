// ============================================================================
// check-acronym-first-mention-surfaces — D-90 beyond the Learn corpus and the blog.
// ----------------------------------------------------------------------------
// PRIME 2026-11-08 17:12 ("the acronym retrofit"): the rule that every ruled
// acronym is expanded at its first mention on each page and in each locale now
// covers the other prose surfaces too: the tool documentation pages, the
// glossary entry pages (def, context and depth), the tools' own interface
// strings (not their engine sentences, which are computed output pinned by
// golden vectors), and the Industry record pages (record prose and profile prose in
// English; the pt-BR overlay prose). The ruled table, the corpus commons and the
// detection are read from check-acronym-first-mention.mjs itself, so the two
// guards cannot drift apart.
//
// Commons, by analogy with the Learn ruling's `category: networking`: BGP, OSPF,
// NAT and VLAN need no expansion in tools of the networking category and in
// glossary entries of the enterprise-networking or isp-telecom domains. A
// glossary entry never has to expand its own acronym (its headword and expansion
// line do). Two generic different senses: "SOC" before a number is a System and
// Organization Controls report, and a token followed by "::" is an iRules
// namespace (RADIUS::avp). Page-specific different senses are declared below,
// each with its reason. The retrofit reached zero on 2026-11-08; the baseline is
// zero and may only stay there.
// ============================================================================
import fs from "node:fs"; // file reads only
import path from "node:path"; // path joins

// The guard this one extends: its ruled table and its commons are the single source.
const base = fs.readFileSync("scripts/check-acronym-first-mention.mjs", "utf8"); // the Learn guard's own text
const tableText = base.slice(base.indexOf("const RULED = {") + "const RULED = ".length, base.indexOf("};", base.indexOf("const RULED = {")) + 1); // the object literal
const RULED = Function(`return ${tableText};`)(); // the ruled acronyms and the stems that satisfy them
const commonsMatch = base.match(/const COMMONS_GLOBAL = \[([^\]]*)\]/); // the commons line
const COMMONS_GLOBAL = (commonsMatch?.[1].match(/"([^"]+)"/g) ?? []).map((s) => s.slice(1, -1)); // DNS, TLS, HTTP...
const netMatch = base.match(/const COMMONS_NETWORKING = \[([^\]]*)\]/); // the networking commons line
const COMMONS_NETWORKING = (netMatch?.[1].match(/"([^"]+)"/g) ?? []).map((s) => s.slice(1, -1)); // BGP, OSPF, NAT, VLAN

/** Page-specific different senses: `${surface}:${slug}:${acronym}` -> why the token is not the ruled acronym. */
const DIFFERENT_SENSE = new Map([
  ["industry:arrow-electronics:RCA", "the Radio Corporation of America, a company"], // radios from RCA
  ["industry:xerox:RCA", "the Radio Corporation of America, a company"], // rejected by IBM, GE and RCA
  ["glossary:archive-formats:CAB", "Microsoft's cabinet archive format"], // a file format, not a change board
  ["industry:secureway:MSP", "part of a company's registered name"], // the legal name carries the letters
]);

const BASELINE = 0; // reached by the retrofit of 2026-11-08; may only stay at zero

/** True when the token ending at `end` is not the ruled acronym (an iRules namespace, or a SOC 2 report). */
function otherSense(ac, text, end) {
  if (text.slice(end, end + 2) === "::") return true; // RADIUS::avp, LDAP::, an iRules namespace
  if (ac === "SOC" && /^ [0-9]\b/.test(text.slice(end, end + 3))) return true; // SOC 1, SOC 2, SOC 3 reports
  return false; // the ruled acronym
}

/** The guard's verdict for one page: the acronyms whose first mention is unexpanded. */
function misses(texts, { networking = false, own = [], key = "" } = {}) {
  const full = texts.join("\n"); // the page in reading order
  const clean = full.replace(/<c>[\s\S]*?<\/c>/g, "").replace(/`[^`]*`/g, "").replace(/\]\([^)]*\)/g, ""); // code and link targets out, as the Learn guard does
  const low = clean.toLowerCase(); // for the stem test
  const out = []; // what fails
  for (const [ac, stems] of Object.entries(RULED)) { // every ruled acronym
    if (COMMONS_GLOBAL.includes(ac) || own.includes(ac)) continue; // a commons, or the entry's own acronym
    if (networking && COMMONS_NETWORKING.includes(ac)) continue; // a networking commons on a networking page
    if (DIFFERENT_SENSE.has(`${key}:${ac}`)) continue; // declared as another sense on this page
    const re = new RegExp("(?<![\\w/-])" + ac.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])", "g"); // the Learn guard's token rule
    let m; // the current match
    let first = null; // the first match in the ruled sense
    while ((m = re.exec(clean))) { if (!otherSense(ac, clean, m.index + ac.length)) { first = m; break; } } // skip other senses
    if (!first) continue; // not on the page
    const expanded = stems.some((s) => low.includes(s.toLowerCase())) || clean.slice(first.index + ac.length).startsWith(" ("); // the stem anywhere, or "ACR (" at first use
    if (!expanded) out.push(ac); // unexpanded first mention
  }
  return out; // the page's defects
}

const rows = []; // [page label, acronyms]
const note = (label, list) => { if (list.length) rows.push([label, list]); }; // record a failing page

// Tool categories (networking commons) and glossary domains (networking commons for entries).
const cfg = fs.readFileSync("src/config/tools.ts", "utf8"); // the tools registry config
const CAT = Object.fromEntries([...cfg.matchAll(/id:\s*"([^"]+)"[^}]*?category:\s*"([^"]+)"/gs)].map((m) => [m[1], m[2]])); // id -> category
const gl = fs.readFileSync("src/content/glossary/glossary.ts", "utf8"); // the glossary registry
const NETWORKED = new Set(); // glossary slugs in a networking domain
for (const m of gl.matchAll(/    slug: "([^"]+)",[^\n]*\n(?:(?!    slug: ).*\n){0,12}?    domains: \[([^\]]*)\]/g)) { // each entry's slug and domains
  if (/"(enterprise-networking|isp-telecom)"/.test(m[2])) NETWORKED.add(m[1]); // a networking entry
}

// 1. Tool documentation pages.
for (const loc of ["en", "pt-BR"]) { // both authored locales
  const dir = `src/content/tool-docs/${loc}`; // the locale's docs
  for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) { // every doc page
    const slug = fn.replace(/\.md$/, ""); // the tool
    const text = fs.readFileSync(path.join(dir, fn), "utf8").replace(/```[\s\S]*?```/g, ""); // fenced code is code
    note(`tool-docs:${loc}/${slug}`, misses([text], { networking: CAT[slug] === "networking", key: `tool-docs:${slug}` })); // judge the page
  }
}

// 2. Glossary entry pages and tool interface strings, from the packs.
for (const loc of ["en", "pt-BR"]) { // both authored locales
  const pk = JSON.parse(fs.readFileSync(`src/i18n/messages/${loc}.json`, "utf8")); // the pack
  for (const [slug, e] of Object.entries(pk.glossary?.entries ?? {})) { // every entry
    const texts = [e.def, e.context, e.depth].filter((x) => typeof x === "string"); // what the entry page shows
    const own = Object.keys(RULED).filter((a) => { const s = a.toLowerCase().replace("/", "-"); return slug === s || slug.startsWith(s + "-"); }); // the entry's own acronym
    note(`glossary:${loc}/${slug}`, misses(texts, { networking: NETWORKED.has(slug), own, key: `glossary:${slug}` })); // judge the page
  }
  for (const [slug, t] of Object.entries(pk.tools ?? {})) { // every tool namespace
    if (!CAT[slug] || typeof t !== "object") continue; // shared namespaces are not a page
    const flat = []; // every string of the tool's interface
    const { engine: _engine, ...ui } = t; // engine sentences are the engine's own output, pinned by its golden vectors and by check-engine-sentences
    (function walk(v) { if (typeof v === "string") flat.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); })(ui); // collect the interface strings
    note(`tool-ui:${loc}/${slug}`, misses(flat, { networking: CAT[slug] === "networking", key: `tool-ui:${slug}` })); // judge the page
  }
}

// 3. Industry record pages: record prose then profile prose (English), and the pt-BR overlays.
const BARE = /^\s{6,10}"((?:[^"\\]|\\.)*)",?\s*$/; // a body paragraph or a wrapped field value on its own line
const FIELDS_ALL = /(?:tagline|intro|name|detail|title|what|became|lede|summary|note): "((?:[^"\\]|\\.)*)"/g; // every prose field on a line (timeline events put several on one)
const strings = (lines) => lines.flatMap((l) => { const all = [...l.matchAll(FIELDS_ALL)].map((m) => m[1]); if (all.length) return all; const b = l.match(BARE); return b ? [b[1]] : []; }); // the prose strings of a block
const pv = fs.readFileSync("src/content/vendors/partners.ts", "utf8").split("\n"); // the English records
const starts = pv.map((l, i) => [i, l.match(/^    slug: "([^"]+)"/)?.[1]]).filter(([, s]) => s); // record starts
for (let k = 0; k < starts.length; k++) { // every record
  const [i, slug] = starts[k]; // its line and slug
  const end = k + 1 < starts.length ? starts[k + 1][0] : pv.length; // up to the next record
  const texts = strings(pv.slice(i, end)); // the record's prose
  const prof = `src/content/vendors/profiles/${slug}.ts`; // its profile, when it has one
  if (fs.existsSync(prof)) texts.push(...strings(fs.readFileSync(prof, "utf8").split("\n"))); // the page shows it too
  note(`industry:en/${slug}`, misses(texts, { key: `industry:${slug}` })); // judge the page
}
for (let n = 1; n <= 8; n++) { // the eight pt-BR overlay shards
  const sh = fs.readFileSync(`src/content/vendors/overlays/pt-BR/shard-${n}.ts`, "utf8").split("\n"); // one shard
  const st = sh.map((l, i) => [i, l.match(/^  "([a-z0-9-]+)": \{/)?.[1]]).filter(([, s]) => s); // overlay entries
  for (let k = 0; k < st.length; k++) { // every overlay entry
    const [i, slug] = st[k]; // its line and slug
    const end = k + 1 < st.length ? st[k + 1][0] : sh.length; // up to the next entry
    note(`industry:pt-BR/${slug}`, misses(strings(sh.slice(i, end)), { key: `industry:${slug}` })); // judge the page
  }
}

const defects = rows.reduce((n, [, l]) => n + l.length, 0); // unexpanded first mentions in all
if (defects > BASELINE) { // above the baseline: fail with the worst pages
  rows.sort((a, b) => b[1].length - a[1].length); // worst first
  console.error(`[check-acronym-first-mention-surfaces] FAIL: ${defects} unexpanded first mention(s) on ${rows.length} page(s), above the baseline of ${BASELINE}: ` + rows.slice(0, 8).map(([p, l]) => `${p} (${l.join(", ")})`).join("; ")); // where and what
  process.exit(1); // stop the build
}
console.log(`[check-acronym-first-mention-surfaces] OK: 0 unexpanded first mentions across tool docs, glossary entries, tool interfaces and Industry pages in en and pt-BR (baseline ${BASELINE}; ${DIFFERENT_SENSE.size} declared different senses).`); // green
