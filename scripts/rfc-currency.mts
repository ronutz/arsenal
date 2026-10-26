// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/rfc-currency.mts  (library; imported by check-materials.mts and
// refresh-rfc-status.mts, never run on its own)
// ----------------------------------------------------------------------------
// THE STANDARDS-CURRENCY REVIEW OF THE OPEN MATERIALS (Round 1 batch B, item
// B4, PRIME 2026-10-25 20:28; the audit's /materials scorecard: "Add a
// standards-currency review to the integrity check"). An open course that cites
// RFCs ages the way exams do: an RFC is obsoleted and the slide keeps citing it.
// This module holds the three pieces both scripts share, so the guard and the
// refresher can never disagree about what counts as a citation:
//
//   1. parseRfcIndex(): reads the RFC Editor's official index
//      (https://www.rfc-editor.org/rfc-index.xml) into one record per RFC:
//      title, date, current status, obsoleted-by and updated-by;
//   2. collectUnits() and citationsOf(): every RFC an open-course asset cites,
//      found in the four places the course text lives (the registry source in
//      src/content/materials, each language's presenter manifest deck.json,
//      the slide bodies inside each language's PPTX, and the "materials"
//      namespace of the en and pt-BR message packs), each citation kept with
//      the text unit it sits in;
//   3. judge(): the verdict on one citation against the committed snapshot,
//      including THE HISTORICAL-LABEL CONVENTION below.
//
// THE HISTORICAL-LABEL CONVENTION (chosen 2026-10-26 for B4; documented here
// and in the B4 notes). A citation of an obsoleted RFC passes only when the
// text that carries it says, in a way a guard can read, that it is cited as
// history. The scope of a label is the CLAUSE the citation sits in: a slide
// paragraph, a notes paragraph or a pack string cut at sentence ends; a table
// row as a whole (a row is one record); a source comment paragraph as a whole
// (one change note). Inside that clause, any ONE of these labels it:
//   (a) a historical marker word, whole word, any case, in the SEGMENT that
//       carries the citation: the clause cut at commas and semicolons that sit
//       outside parentheses and brackets, so "RFC 2236 and 3376 (IGMP), ...,
//       RFC 1075 and 1584 (DVMRP, MOSPF, historical)" labels 1075 and 1584 but
//       not 3376 (the list is MARKERS below): English historical, historic, historically, legacy, obsolete,
//       obsoleted, obsoletes, predecessor, superseded, replaces, replaced,
//       successor, successors; Portuguese histórico, histórica, históricos,
//       históricas, historicamente, legado, obsoleto, obsoleta, obsoletos,
//       obsoletas, obsoletou, obsoletado, obsoletada, antecessor, antecessora,
//       antecessores, substitui, substituiu, substituída, substituído,
//       sucessor, sucessora, sucessores. ("history" alone is NOT a marker:
//       the references table has a topic row called "Layer 2 and history"
//       whose citations are not all history.) A clause that OPENS with a
//       label and a colon ("History:", "Historical:", "Legacy:", "Histórico:",
//       "História:", "Legado:") is labelled as a whole;
//   (b) the citation's own successor: an RFC that the index lists, directly or
//       through a chain, as obsoleting it ("RFC 9568, which obsoletes RFC 5798"
//       or "RFC 8200; RFC 2460 and RFC 1883 before it");
//   (c) the slide-level tag the deck already uses for history: a slide whose
//       body has a paragraph reading exactly LEGACY (English deck) or HISTÓRICO
//       (Portuguese deck) labels every citation on that slide, its body and its
//       notes in deck.json;
//   (d) PRIME's register, src/content/materials/rfc-historical.json: a
//       citation PRIME has ruled historical without editing the course (the
//       PPTX and the PDFs are PRIME's and re-exporting them is costly). An
//       entry names the RFC, the scope (a deck slide, which covers both
//       languages, the PPTX body and the deck.json notes; or one asset and
//       place), PRIME's reason and the decision's date. The guard fails on an
//       entry that no longer matches an obsoleted citation, so the register
//       cannot outlive the text it excuses.
// A citation the index does not list at all, or one missing from the snapshot,
// fails as well: the snapshot must be refreshed (refresh-rfc-status.mts) from a
// freshly downloaded index before the citation can be judged. "Updated by" is
// kept in the snapshot and printed by the refresher's change report, never
// fatal: an updated RFC is still the standard, read with its updates.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/** One RFC as the RFC Editor index records it (only the fields the review uses). */
export interface RfcStatus {
  /** The RFC number. */
  rfc: number;
  /** The RFC's title, as the index prints it. */
  title: string;
  /** Publication month and year, as the index prints them ("April 2024"). */
  date: string;
  /** The index's current-status field (INTERNET STANDARD, PROPOSED STANDARD, HISTORIC, ...). */
  status: string;
  /** RFCs that obsolete this one, ascending. Empty when nothing obsoletes it. */
  obsoletedBy: number[];
  /** RFCs that update this one, ascending. */
  updatedBy: number[];
}

/** The committed snapshot: the index's records for every cited RFC and its successors, with the read provenance. */
export interface RfcSnapshot {
  /** What the file is, for a human reader. */
  about: string;
  /** The index URL the records were read from. */
  source: string;
  /** When the index was downloaded (ISO 8601 with offset). */
  readAt: string;
  /** Size and SHA-256 of the downloaded index, so a reader can tell which copy was used. */
  indexBytes: number;
  indexSha256: string;
  /** One record per RFC, keyed by its number as a string, ascending. */
  rfcs: Record<string, RfcStatus>;
}

/** Where the committed snapshot lives (repository-relative). */
export const SNAPSHOT_PATH = "src/content/materials/rfc-status.json";

/** The official index, the only source the snapshot is built from. */
export const INDEX_URL = "https://www.rfc-editor.org/rfc-index.xml";

/** Decode the five XML entities and numeric character references (the index and the PPTX parts use both). */
export function decodeXml(s: string): string {
  // Numeric references first (decimal and hex), then the named five, with &amp; last so "&amp;lt;" stays "&lt;".
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** The RFC numbers inside one <obsoleted-by> or <updated-by> element of an index entry, ascending. */
function idsIn(block: string, tag: string): number[] {
  // The element holds <doc-id>RFCnnnn</doc-id> children; only RFC ids are kept (never STD or BCP aliases).
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  // No element: nothing obsoletes (or updates) this RFC.
  if (!m) return [];
  // Each child id, numeric part only, sorted ascending and deduplicated.
  return [...new Set([...m[1].matchAll(/<doc-id>RFC(\d+)<\/doc-id>/g)].map((x) => Number(x[1])))].sort((a, b) => a - b);
}

/** Read the RFC Editor index XML into one record per RFC. Pure string parsing, no XML library, no network. */
export function parseRfcIndex(xml: string): Map<number, RfcStatus> {
  // The result, keyed by RFC number.
  const out = new Map<number, RfcStatus>();
  // Every <rfc-entry> block (not-issued entries and BCP/STD/FYI entries are different element names, so skipped).
  for (const e of xml.matchAll(/<rfc-entry>([\s\S]*?)<\/rfc-entry>/g)) {
    // The block's text.
    const b = e[1];
    // Its own id: the first <doc-id> directly inside the entry.
    const id = b.match(/<doc-id>RFC(\d+)<\/doc-id>/);
    // An entry without an RFC id is malformed for our purpose; skip it.
    if (!id) continue;
    // Title, publication month and year, and current status, entity-decoded.
    const title = decodeXml((b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim());
    const month = b.match(/<date>[\s\S]*?<month>([^<]+)<\/month>/)?.[1] ?? "";
    const year = b.match(/<date>[\s\S]*?<year>([^<]+)<\/year>/)?.[1] ?? "";
    const status = (b.match(/<current-status>([^<]+)<\/current-status>/)?.[1] ?? "").trim();
    // The record, with obsoleted-by and updated-by read from their own elements.
    out.set(Number(id[1]), {
      rfc: Number(id[1]),
      title,
      date: `${month} ${year}`.trim(),
      status,
      obsoletedBy: idsIn(b, "obsoleted-by"),
      updatedBy: idsIn(b, "updated-by"),
    });
  }
  // All records.
  return out;
}

/** Every RFC that obsoletes `rfc`, directly or through a chain, read from a record lookup (cycle-safe). */
export function successorsOf(rfc: number, lookup: (n: number) => RfcStatus | undefined): number[] {
  // Breadth-first over obsoleted-by, remembering what was seen so a malformed cycle cannot loop.
  const seen = new Set<number>();
  // The queue starts with the direct successors.
  const queue = [...(lookup(rfc)?.obsoletedBy ?? [])];
  // Walk until no new successor appears.
  while (queue.length) {
    // Next successor.
    const n = queue.shift()!;
    // Already counted: skip.
    if (seen.has(n)) continue;
    // Count it and queue its own successors.
    seen.add(n);
    queue.push(...(lookup(n)?.obsoletedBy ?? []));
  }
  // Ascending.
  return [...seen].sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Citations.
// ---------------------------------------------------------------------------

/** One piece of course text that a citation's label is judged inside. */
export interface TextUnit {
  /** The asset, repository-relative (with "!slideN.xml" for a part inside a PPTX). */
  asset: string;
  /** Where in the asset, for a human reader ("slide 177 row 4", "notes 2", "materials.items.x.lede"). */
  where: string;
  /** The deck slide the unit belongs to, when it belongs to one (joins deck.json notes to the PPTX slide tag). */
  slide?: number;
  /** The deck language, when the unit belongs to a deck ("en" or "pt-BR"). */
  lang?: string;
  /** The unit's plain text. */
  text: string;
  /** Judge the unit as one clause (a table row is one record; a source comment paragraph is one change note). */
  whole?: boolean;
}

/** One citation of one RFC, with the clause that judges its label. */
export interface Citation {
  /** The cited RFC. */
  rfc: number;
  /** The unit it sits in. */
  unit: TextUnit;
  /** The clause (a sentence of the unit, or the whole unit when it is judged whole) that carries it. */
  clause: string;
  /** The segment(s) of the clause that carry it (cut at commas and semicolons outside brackets): marker scope. */
  scope: string;
}

/** The citation pattern: "RFC" or "RFCs", then a number, then any continuation joined by "/", ",", "&", "and" or
 *  "e" (Portuguese "and"). Numbers of one to five digits; whitespace may include no-break spaces. */
const CITE = /\bRFCs?[\s -]*(\d{1,5})((?:[\s ]*(?:\/|,|&|\band\b|\be\b)[\s ]*\d{1,5}\b)*)/gi;

/** The RFC numbers one string cites. A comma followed by a four-digit number from 1960 to 2039 is read as a year
 *  ("RFC 950, 1985") and ends the continuation; "/", "and", "e" and "&" always continue ("RFC 2236 and 3376"). */
export function rfcNumbersIn(text: string): number[] {
  // The groups' numbers, flattened in order of appearance.
  return rfcGroupsIn(text).flatMap((g) => g.nums);
}

/** The citation groups of one string, each with its character span and the RFC numbers it names. */
export function rfcGroupsIn(text: string): { start: number; end: number; nums: number[] }[] {
  // The groups found.
  const groups: { start: number; end: number; nums: number[] }[] = [];
  // Each citation group.
  for (const m of text.matchAll(CITE)) {
    // The group's numbers; the head number always counts.
    const nums: number[] = [Number(m[1])];
    groups.push({ start: m.index!, end: m.index! + m[0].length, nums });
    // The continuation, split into (separator, number) pairs.
    for (const c of m[2].matchAll(/[\s ]*(\/|,|&|\band\b|\be\b)[\s ]*(\d{1,5})/gi)) {
      // Separator and number.
      const sep = c[1];
      const n = Number(c[2]);
      // A comma then a plausible year: the group is "RFC n, year"; stop reading this group.
      if (sep === "," && c[2].length === 4 && n >= 1960 && n <= 2039) break;
      // Otherwise the number is another RFC of the same group.
      nums.push(n);
    }
  }
  // All groups.
  return groups;
}

/** Cut a clause into segments at commas and semicolons outside (), [] and {}; each with its span. */
export function segmentsOf(text: string): { start: number; end: number }[] {
  // The segments, the bracket depth, and the current segment's start.
  const segs: { start: number; end: number }[] = [];
  let depth = 0;
  let start = 0;
  // One pass over the characters.
  for (let i = 0; i < text.length; i++) {
    // Track the depth; a stray closer never takes it below zero.
    const ch = text[i];
    if ("([{".includes(ch)) depth++;
    else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
    // A separator at depth zero closes the segment.
    else if ((ch === "," || ch === ";") && depth === 0) { segs.push({ start, end: i }); start = i + 1; }
  }
  // The last segment.
  segs.push({ start, end: text.length });
  return segs;
}

/** The marker scope of one RFC inside a clause: every segment that overlaps a citation group naming it. */
export function scopeOf(clause: string, rfc: number): string {
  // The clause's segments and the groups that name the RFC.
  const segs = segmentsOf(clause);
  const groups = rfcGroupsIn(clause).filter((g) => g.nums.includes(rfc));
  // Segments overlapping any such group, joined in order.
  return segs.filter((s) => groups.some((g) => g.start < s.end && g.end > s.start)).map((s) => clause.slice(s.start, s.end).trim()).join(" … ");
}

/** Split a unit into clauses: at a sentence end (". ", "! ", "? "). */
export function clausesOf(text: string): string[] {
  // Split, trim, drop empties. A dotted number ("3.2") has no space after the dot, so it is not a sentence end.
  // Semicolons are NOT cut: in this course they sit inside parentheses and lists more often than between clauses.
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

/** All citations in a list of units, one per (unit, clause, RFC). */
export function citationsOf(units: TextUnit[]): Citation[] {
  // The result.
  const out: Citation[] = [];
  // Each unit, each clause, each distinct RFC the clause cites.
  for (const unit of units) {
    for (const clause of unit.whole ? [unit.text] : clausesOf(unit.text)) {
      for (const rfc of new Set(rfcNumbersIn(clause))) out.push({ rfc, unit, clause, scope: scopeOf(clause, rfc) });
    }
  }
  // All citations.
  return out;
}

// ---------------------------------------------------------------------------
// The four places the course text lives.
// ---------------------------------------------------------------------------

/** Read selected entries of a ZIP archive (a PPTX) with no library: the central directory gives each entry's name,
 *  method and offset; stored (0) and deflated (8) entries are the only methods an Office package uses. */
export function readZip(buf: Buffer, want: (name: string) => boolean): Map<string, Buffer> {
  // The entries read.
  const out = new Map<string, Buffer>();
  // The end-of-central-directory record sits in the last 64 KiB + 22 bytes; find its signature from the end.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  // No record: not a ZIP; return nothing (the caller reports the missing parts).
  if (eocd < 0) return out;
  // Number of entries and the central directory's offset.
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  // Walk the central directory.
  for (let k = 0; k < count && buf.readUInt32LE(p) === 0x02014b50; k++) {
    // Method, compressed size, name, extra and comment lengths, and the local header's offset.
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    // Next central entry.
    p += 46 + nlen + xlen + clen;
    // Not wanted: skip.
    if (!want(name)) continue;
    // The data starts after the local header and its own name and extra fields.
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + csize);
    // Inflate or copy.
    if (method === 8) out.set(name, zlib.inflateRawSync(data));
    else if (method === 0) out.set(name, Buffer.from(data));
  }
  // The wanted entries.
  return out;
}

/** The plain text of one DrawingML paragraph: its runs joined without separators (runs can split a word). */
function paragraphText(xml: string): string {
  // Each <a:t> run, decoded; a line break inside the paragraph becomes a space.
  return [...xml.replace(/<a:br\/>/g, "<a:t> </a:t>").matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1])).join("").replace(/\s+/g, " ").trim();
}

/** The slide tags that label a whole slide as history: the deck's LEGACY / HISTÓRICO badge. */
export const SLIDE_TAGS = new Set(["LEGACY", "HISTÓRICO"]);

/** Text units of one slide part: each table row as one unit (its cells joined by " | "), and each paragraph outside a
 *  table as one unit. Also reports whether the slide carries the history tag. */
export function slideUnits(xml: string, asset: string, slide: number, lang: string): { units: TextUnit[]; tagged: boolean } {
  // The units found.
  const units: TextUnit[] = [];
  // Table rows first.
  let row = 0;
  for (const tr of xml.matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)) {
    // Each cell's paragraphs joined by spaces, cells joined by " | ".
    const cells = [...tr[0].matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)].map((tc) => [...tc[0].matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)].map((p) => paragraphText(p[0])).filter(Boolean).join(" "));
    // One unit per row with any text.
    row++;
    const text = cells.join(" | ").trim();
    if (text.replace(/[|\s]/g, "")) units.push({ asset, where: `slide ${slide} table row ${row}`, slide, lang, text, whole: true });
  }
  // Then every paragraph outside the tables.
  const rest = xml.replace(/<a:tbl\b[\s\S]*?<\/a:tbl>/g, "");
  let para = 0;
  let tagged = false;
  for (const p of rest.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)) {
    // The paragraph's text.
    const text = paragraphText(p[0]);
    // Empty paragraphs are layout only.
    if (!text) continue;
    para++;
    // The history badge: a paragraph that reads exactly LEGACY or HISTÓRICO.
    if (SLIDE_TAGS.has(text)) tagged = true;
    units.push({ asset, where: `slide ${slide} paragraph ${para}`, slide, lang, text });
  }
  // The slide's units and its tag.
  return { units, tagged };
}

/** The repository's open-course text, as units, plus the set of history-tagged slides per language. */
export function collectUnits(root: string): { units: TextUnit[]; tagged: Set<string>; problems: string[] } {
  // Units, tagged slides ("en:56"), and anything that could not be read.
  const units: TextUnit[] = [];
  const tagged = new Set<string>();
  const problems: string[] = [];
  // 1. The registry source: src/content/materials/*.ts, comment paragraphs and string literals alike, one unit per
  //    run of non-blank lines (a comment block's paragraph), with the comment markers stripped.
  const regDir = path.join(root, "src/content/materials");
  for (const f of fs.readdirSync(regDir).filter((n) => n.endsWith(".ts")).sort()) {
    // Lines with their comment leaders removed.
    const lines = fs.readFileSync(path.join(regDir, f), "utf8").split("\n").map((l) => l.replace(/^\s*(\/\/+|\/\*+|\*+\/?)\s?/, "").trimEnd());
    // Group runs of non-blank lines.
    let start = 0;
    let buf: string[] = [];
    // Flush the current run as one unit.
    const flush = (end: number) => {
      // Only runs with text.
      if (buf.join("").trim()) units.push({ asset: `src/content/materials/${f}`, where: `lines ${start + 1}-${end}`, text: buf.join(" ").replace(/\s+/g, " ").trim(), whole: true });
      buf = [];
    };
    lines.forEach((l, i) => {
      // A blank line ends a run; a non-blank line starts or extends one.
      if (!l.trim()) { flush(i); start = i + 1; } else { if (!buf.length) start = i; buf.push(l); }
    });
    flush(lines.length);
  }
  // 2 and 3. Each material's decks: the PPTX slide bodies and the presenter manifests (titles and notes).
  const pubDir = path.join(root, "public/materials");
  for (const slug of fs.existsSync(pubDir) ? fs.readdirSync(pubDir).sort() : []) {
    // The material's folder.
    const dir = path.join(pubDir, slug);
    if (!fs.statSync(dir).isDirectory()) continue;
    // Each PPTX: its language from the file name (the registry's naming: ..._enUS.pptx, ..._ptBR.pptx).
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".pptx")).sort()) {
      // Language of the deck.
      const lang = /ptBR/.test(f) ? "pt-BR" : "en";
      // The slide parts only (the notes reach the review through deck.json, which is read from the same notes).
      const parts = readZip(fs.readFileSync(path.join(dir, f)), (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
      if (!parts.size) problems.push(`public/materials/${slug}/${f}: no slide parts could be read`);
      for (const [name, data] of [...parts].sort((a, b) => Number(a[0].match(/\d+/)![0]) - Number(b[0].match(/\d+/)![0]))) {
        // The slide number as PowerPoint names the part (slideN.xml is the Nth slide in these decks; deck.json agrees).
        const n = Number(name.match(/slide(\d+)\.xml$/)![1]);
        const { units: u, tagged: t } = slideUnits(data.toString("utf8"), `public/materials/${slug}/${f}!${path.basename(name)}`, n, lang);
        units.push(...u);
        if (t) tagged.add(`${lang}:${n}`);
      }
    }
    // Each language's manifest.
    const deckDir = path.join(dir, "deck");
    for (const lang of fs.existsSync(deckDir) ? fs.readdirSync(deckDir).sort() : []) {
      // The manifest file.
      const mf = path.join(deckDir, lang, "deck.json");
      if (!fs.existsSync(mf)) continue;
      // Its slides: title and notes paragraphs, each one unit.
      let man: { slides?: { n: number; title?: string; notes?: string[] }[] } = {};
      try { man = JSON.parse(fs.readFileSync(mf, "utf8")); } catch { problems.push(`public/materials/${slug}/deck/${lang}/deck.json is not JSON`); continue; }
      for (const s of man.slides ?? []) {
        // Asset path for messages.
        const asset = `public/materials/${slug}/deck/${lang}/deck.json`;
        if (s.title) units.push({ asset, where: `slide ${s.n} title`, slide: s.n, lang, text: s.title });
        (s.notes ?? []).forEach((t, i) => units.push({ asset, where: `slide ${s.n} notes ${i + 1}`, slide: s.n, lang, text: t }));
      }
    }
  }
  // 4. The datasheet copy: the "materials" namespace of the two authored packs. A leaf string is a unit; an array of
  //    strings (a then-and-now row, a topics list) is one unit, its items joined by " | ".
  for (const loc of ["en", "pt-BR"]) {
    // The pack's materials namespace.
    const pack = JSON.parse(fs.readFileSync(path.join(root, "src/i18n/messages", `${loc}.json`), "utf8"));
    // Walk it, keeping the dotted key for messages.
    const walk = (v: unknown, key: string) => {
      // A string: one unit.
      if (typeof v === "string") units.push({ asset: `src/i18n/messages/${loc}.json`, where: key, text: v });
      // An array of strings only: one unit.
      else if (Array.isArray(v) && v.every((x) => typeof x === "string")) units.push({ asset: `src/i18n/messages/${loc}.json`, where: key, text: (v as string[]).join(" | ") });
      // Any other array or object: recurse.
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${key}[${i}]`));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${key}.${k}`);
    };
    walk(pack.materials ?? {}, "materials");
  }
  // Everything found.
  return { units, tagged, problems };
}

// ---------------------------------------------------------------------------
// The verdict.
// ---------------------------------------------------------------------------

/** The historical marker words of the convention (a), English and Portuguese. Matched whole-word, any case. */
export const MARKERS = [
  "historical", "historic", "historically", "legacy", "obsolete", "obsoleted", "obsoletes", "predecessor", "superseded",
  "histórico", "histórica", "históricos", "históricas", "historicamente", "legado", "obsoleto", "obsoleta", "obsoletos",
  "obsoletas", "obsoletou", "obsoletado", "obsoletada", "antecessor", "antecessora", "antecessores",
  "replaces", "replaced", "successor", "successors", "substitui", "substituiu", "substituída", "substituído", "sucessor", "sucessora",
  "sucessores",
];

/** A clause that opens with a history label and a colon is labelled as a whole ("History: RFC 1883 ...; RFC 2460 ..."). */
const LEAD_RE = /^\s*(history|historical|legacy|histórico|história|legado)\s*:/iu;

/** One ruling in PRIME's register (label d): this RFC, in this scope, is cited as history. */
export interface HistoricalRuling {
  /** The obsoleted RFC the ruling covers. */
  rfc: number;
  /** A deck slide (both languages, PPTX body and deck.json notes) ... */
  slide?: number;
  /** ... or one asset (repository-relative, as the guard prints it) ... */
  asset?: string;
  /** ... and, with it, one place in that asset, as the guard prints it ("materials.items.x.lede"). */
  where?: string;
  /** PRIME's reason, in a few words. */
  reason: string;
  /** Who decided and when ("PRIME 2026-10-27"). */
  decided: string;
}

/** The register's path (repository-relative). */
export const REGISTER_PATH = "src/content/materials/rfc-historical.json";

/** Does a ruling cover a citation? */
export function rulingCovers(r: HistoricalRuling, c: Citation): boolean {
  // Same RFC, and either the same deck slide or the same asset and place.
  if (r.rfc !== c.rfc) return false;
  if (r.slide !== undefined) return c.unit.slide === r.slide;
  return r.asset === c.unit.asset && r.where === c.unit.where;
}

/** One regular expression for the marker words, whole word under Unicode letters (so "histórico" is one word). */
const MARKER_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${MARKERS.join("|")})(?![\\p{L}\\p{N}])`, "iu");

/** The verdict on one citation. */
export type Verdict =
  /** Nothing obsoletes the RFC (it may be updated; see updatedBy). */
  | { state: "current"; updatedBy: number[] }
  /** Obsoleted, and the clause or slide labels it as history; `label` names which rule. */
  | { state: "historical"; successors: number[]; label: string }
  /** Obsoleted and not labelled: the guard fails. */
  | { state: "obsoleted"; successors: number[] }
  /** Not in the snapshot: the snapshot needs a refresh. */
  | { state: "unknown" };

/** Judge one citation against the snapshot and the set of history-tagged slides. */
export function judge(c: Citation, snap: RfcSnapshot, tagged: Set<string>, register: HistoricalRuling[] = []): Verdict {
  // The snapshot's lookup.
  const look = (n: number) => snap.rfcs[String(n)];
  // The cited RFC's record.
  const rec = look(c.rfc);
  // Not in the snapshot: cannot be judged.
  if (!rec) return { state: "unknown" };
  // Nothing obsoletes it: current (updates are reported by the caller).
  if (!rec.obsoletedBy.length) return { state: "current", updatedBy: rec.updatedBy };
  // Obsoleted: the whole successor chain, for the message and for label (b).
  const successors = successorsOf(c.rfc, look);
  // (a) a clause that opens with a history label, then a marker word in the segment(s) that carry the citation.
  const lead = c.clause.match(LEAD_RE);
  if (lead) return { state: "historical", successors, label: `clause opens with "${lead[1]}:"` };
  const word = c.scope.match(MARKER_RE);
  if (word) return { state: "historical", successors, label: `marker word "${word[1]}"` };
  // (b) the successor cited in the same clause.
  const cited = new Set(rfcNumbersIn(c.clause));
  const succ = successors.find((n) => cited.has(n));
  if (succ !== undefined) return { state: "historical", successors, label: `successor RFC ${succ} cited alongside` };
  // (c) the slide's history tag (deck units only).
  if (c.unit.slide !== undefined && c.unit.lang && tagged.has(`${c.unit.lang}:${c.unit.slide}`)) return { state: "historical", successors, label: `slide ${c.unit.slide} tagged ${c.unit.lang === "pt-BR" ? "HISTÓRICO" : "LEGACY"}` };
  // (d) PRIME's register.
  const ruling = register.find((r) => rulingCovers(r, c));
  if (ruling) return { state: "historical", successors, label: `PRIME's register (${ruling.decided}: ${ruling.reason})` };
  // No label: obsoleted.
  return { state: "obsoleted", successors };
}
