// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-materials.mts  (prebuild; run with tsx)
// ----------------------------------------------------------------------------
// THE OPEN MATERIALS ARE WHAT THEIR DATASHEETS SAY THEY ARE (milestone (m1),
// 2026-10-06). A datasheet prints each file's size and SHA-256 so that a reader
// can check a copy; that promise is only as good as the numbers, so this guard
// recomputes them from the files at every build and fails on any difference. A
// replaced deck therefore cannot keep a stale fingerprint on its page.
//
// For every material in src/content/materials/materials.ts:
//   1. every file exists under public/ at its path, with the recorded size and
//      SHA-256, and no file sits in public/materials/ that the registry does
//      not list (an orphan would be served with no page describing it);
//   2. the parts' slide ranges lie inside the deck, in order, without gaps or
//      overlaps, and every file's page count is the deck's slide count;
//   3. the licence is one the datasheet knows how to state (CC0-1.0 today) and
//      its URL is that licence's canonical deed;
//   4. every related Learn article exists in English and in Portuguese;
//   5. both authored packs carry the material's copy, with a title and topics
//      for every part the registry declares and objectives for every module;
//   6. the slide images the datasheet shows (the cover and the gallery, PRIME
//      2026-10-06 16:02) exist as WebP for every language the material ships,
//      at the size the registry records, the slides inside the deck and in
//      order, each with its caption and alt text in both packs. These images
//      are listed files too, so the orphan check accepts them and no others;
//   7. the presenter's deck (milestone (m2), 2026-10-06): for every language,
//      one WebP per slide at the deck's recorded size, and the deck manifest
//      with one entry per slide, numbered in order, each with a title and (the
//      registry says every slide has notes) its notes. Listed files too.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { MATERIALS, slideImagePath, deckImageBase, deckManifestPath } from "../src/content/materials/materials";

const ROOT = process.cwd();
const TAG = "[check-materials]";
const problems: string[] = [];
const fail = (m: string) => problems.push(m);

// The licences the datasheet can state, with their canonical deeds.
const DEEDS: Record<string, string> = { "CC0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/" };

/** The pixel size a WebP file declares, read from its first chunk (lossy VP8, lossless VP8L or extended VP8X), or
 *  null when the bytes are not a WebP image. Read by hand so the guard needs no image library. */
function webpSize(buf: Buffer): { width: number; height: number } | null {
  // RIFF container with the WEBP form type.
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("ascii", 12, 16);
  // Lossy: after the 3-byte frame tag and the 9d 01 2a start code, two 14-bit little-endian dimensions.
  if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  // Lossless: after the 0x2f signature, 14 bits of width-1 then 14 bits of height-1.
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  // Extended: 24-bit canvas width-1 and height-1 after 4 bytes of flags.
  if (chunk === "VP8X") return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  return null;
}

const packs: Record<string, any> = {};
for (const loc of ["en", "pt-BR"]) packs[loc] = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/messages", `${loc}.json`), "utf8"));

const listed = new Set<string>();
let files = 0;
// Slide images verified (the cover and the gallery, per language).
let images = 0;
// Presenter images and manifests verified (every slide, per language).
let deckImages = 0;
let manifests = 0;
for (const m of MATERIALS) {
  // 1. Files: present, sized and digested as recorded.
  for (const f of m.files) {
    files++;
    listed.add(f.path);
    const disk = path.join(ROOT, "public", f.path);
    if (!fs.existsSync(disk)) { fail(`${m.slug}: ${f.path} is missing from public/`); continue; }
    const buf = fs.readFileSync(disk);
    if (buf.length !== f.bytes) fail(`${m.slug}: ${f.path} is ${buf.length} bytes, the registry says ${f.bytes}`);
    const digest = crypto.createHash("sha256").update(buf).digest("hex");
    if (digest !== f.sha256) fail(`${m.slug}: ${f.path} has SHA-256 ${digest}, the registry says ${f.sha256}`);
    if (f.pages !== m.slides) fail(`${m.slug}: ${f.path} records ${f.pages} pages for a ${m.slides}-slide deck`);
  }
  // 2. Parts: inside the deck, ascending, contiguous.
  let prev = 0;
  for (const p of m.parts) {
    const [from, to] = p.slides;
    if (!(from >= 1 && to <= m.slides && from <= to)) fail(`${m.slug}: part ${p.id} spans ${from}-${to}, outside the ${m.slides}-slide deck`);
    if (prev && from !== prev + 1) fail(`${m.slug}: part ${p.id} starts at ${from}, the previous part ended at ${prev} (gap or overlap)`);
    prev = to;
  }
  // 3. Licence: known, with its own deed.
  if (DEEDS[m.license] !== m.licenseUrl) fail(`${m.slug}: licence ${m.license} with URL ${m.licenseUrl}; expected ${DEEDS[m.license] ?? "a known licence"}`);
  // 4. Related reading: in both authored locales.
  for (const s of m.relatedArticles) {
    for (const loc of ["en", "pt-BR"]) {
      if (!fs.existsSync(path.join(ROOT, "src/content/learn", loc, `${s}.mdx`))) fail(`${m.slug}: related article ${s} has no ${loc} version`);
    }
  }
  // 5. Copy: both packs, every part and module.
  const modules = [...new Set(m.parts.map((p) => p.module))];
  for (const loc of ["en", "pt-BR"]) {
    const item = packs[loc].materials?.items?.[m.slug];
    if (!item) { fail(`${loc}: materials.items.${m.slug} is missing`); continue; }
    for (const key of ["title", "subtitle", "lede", "lineage", "level", "format", "notesValue", "languagesValue", "audienceLearners", "audienceInstructors", "frame", "thenNowNote", "licenceBody", "licenceCourtesy", "licenceDeed", "metaDescription"]) {
      if (typeof item[key] !== "string" || !item[key].trim()) fail(`${loc}: materials.items.${m.slug}.${key} is missing or empty`);
    }
    for (const p of m.parts) {
      const part = item.parts?.[p.id];
      if (!part?.title || !Array.isArray(part.topics) || part.topics.length === 0) fail(`${loc}: materials.items.${m.slug}.parts.${p.id} needs a title and topics`);
    }
    for (const mod of modules) {
      if (!Array.isArray(item.objectives?.[`m${mod}`]) || item.objectives[`m${mod}`].length === 0) fail(`${loc}: materials.items.${m.slug}.objectives.m${mod} is missing`);
    }
    if (!Array.isArray(item.thenNow) || item.thenNow.some((row: unknown) => !Array.isArray(row) || row.length !== 3)) fail(`${loc}: materials.items.${m.slug}.thenNow must be rows of three cells`);
    // 6b. The images' words: the cover's alt text and every gallery slide's title and alt text.
    if (typeof item.coverAlt !== "string" || !item.coverAlt.trim()) fail(`${loc}: materials.items.${m.slug}.coverAlt is missing or empty`);
    for (const n of m.images.gallery) {
      const g = item.gallery?.[`s${n}`];
      if (typeof g?.title !== "string" || !g.title.trim() || typeof g?.alt !== "string" || !g.alt.trim()) fail(`${loc}: materials.items.${m.slug}.gallery.s${n} needs a title and an alt text`);
    }
  }
  // 6. The images themselves: every shown slide inside the deck, the gallery in deck order without repeats, and one
  //    WebP per language at the recorded size.
  const shots = [m.images.cover, ...m.images.gallery];
  for (const n of shots) if (!(Number.isInteger(n) && n >= 1 && n <= m.slides)) fail(`${m.slug}: image of slide ${n} is outside the ${m.slides}-slide deck`);
  m.images.gallery.forEach((n, i) => {
    if (i > 0 && n <= m.images.gallery[i - 1]) fail(`${m.slug}: gallery slide ${n} is not after ${m.images.gallery[i - 1]} (deck order, no repeats)`);
  });
  for (const lang of new Set(m.files.map((f) => f.lang))) {
    for (const n of shots) {
      const rel = slideImagePath(m, lang, n);
      listed.add(rel);
      const disk = path.join(ROOT, "public", rel);
      if (!fs.existsSync(disk)) { fail(`${m.slug}: ${rel} is missing from public/`); continue; }
      const size = webpSize(fs.readFileSync(disk));
      if (!size) fail(`${m.slug}: ${rel} is not a WebP image`);
      else if (size.width !== m.images.width || size.height !== m.images.height) fail(`${m.slug}: ${rel} is ${size.width}x${size.height}, the registry says ${m.images.width}x${m.images.height}`);
      images++;
    }
  }
  // 7. The presenter's deck: every slide's image at the deck size, and the manifest that names and annotates them.
  for (const lang of new Set(m.files.map((f) => f.lang))) {
    for (let n = 1; n <= m.slides; n++) {
      const rel = `${deckImageBase(m, lang)}${String(n).padStart(3, "0")}.webp`;
      listed.add(rel);
      const disk = path.join(ROOT, "public", rel);
      if (!fs.existsSync(disk)) { fail(`${m.slug}: ${rel} is missing from public/`); continue; }
      const size = webpSize(fs.readFileSync(disk));
      if (!size) fail(`${m.slug}: ${rel} is not a WebP image`);
      else if (size.width !== m.deck.width || size.height !== m.deck.height) fail(`${m.slug}: ${rel} is ${size.width}x${size.height}, the deck is ${m.deck.width}x${m.deck.height}`);
      deckImages++;
    }
    const mrel = deckManifestPath(m, lang);
    listed.add(mrel);
    const mdisk = path.join(ROOT, "public", mrel);
    if (!fs.existsSync(mdisk)) { fail(`${m.slug}: ${mrel} is missing from public/`); continue; }
    let man: { slides?: { n?: number; title?: unknown; notes?: unknown }[] } = {};
    try { man = JSON.parse(fs.readFileSync(mdisk, "utf8")); } catch { fail(`${m.slug}: ${mrel} is not JSON`); continue; }
    const slides = Array.isArray(man.slides) ? man.slides : [];
    if (slides.length !== m.slides) fail(`${m.slug}: ${mrel} lists ${slides.length} slides, the deck has ${m.slides}`);
    slides.forEach((s, i) => {
      if (s.n !== i + 1) fail(`${m.slug}: ${mrel} entry ${i + 1} is numbered ${s.n}`);
      if (typeof s.title !== "string" || !s.title.trim()) fail(`${m.slug}: ${mrel} slide ${i + 1} has no title`);
      const notesOk = Array.isArray(s.notes) && s.notes.every((p) => typeof p === "string");
      if (!notesOk) fail(`${m.slug}: ${mrel} slide ${i + 1} has malformed notes`);
      else if (m.notesSlides === m.slides && (s.notes as string[]).length === 0) fail(`${m.slug}: ${mrel} slide ${i + 1} has no notes, the registry says every slide has them`);
    });
    manifests++;
  }
}

// 1b. Orphans: a file under public/materials/ that no material lists.
const walk = (dir: string): string[] =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])) : [];
for (const f of walk(path.join(ROOT, "public", "materials"))) {
  const rel = "/" + path.relative(path.join(ROOT, "public"), f).split(path.sep).join("/");
  if (!listed.has(rel)) fail(`orphan: ${rel} is in public/materials/ but no material lists it`);
}

if (problems.length) {
  console.error(`${TAG} FAIL: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`${TAG} OK: ${MATERIALS.length} material(s), ${files} file(s) matching their recorded sizes and SHA-256, ${images} slide image(s) present at their recorded size, ${deckImages} presenter image(s) and ${manifests} deck manifest(s) complete, parts contiguous, licence deeds canonical, related articles and copy present in en and pt-BR.`);
