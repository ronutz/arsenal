// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/check-teaching-and-authorship-claims.mts
// ----------------------------------------------------------------------------
// POST-BUILD GUARD (2026-10-07, row 70): two kinds of sentence the site says
// about itself and its author, held to the data that makes them true.
//
// 1. WHAT IS TAUGHT. The training box ("I teach official F5 courses live at Red
//    Education...") said "these courses" on all 105 certification guides, the
//    34 of Check Point, Ping Identity and Zscaler included, whose courses are
//    not taught here (SCOUT's closeout review, verified live at 23:30; PRIME
//    23:3x: "Hide it there"). On every built guide page the box must appear
//    exactly when the guide's vendor is a platform of the teaching catalogue
//    (src/content/training/courses.ts), and must name that platform; on the
//    certifications hub it must name every platform of the catalogue.
// 2. WHO WRITES WHICH LANGUAGE. Four sentences told three stories (English
//    "written and reviewed by a person"; Portuguese "authored directly", or
//    "machine-translated", or "translated automatically"). PRIME's words of
//    23:5x now say it once: English is the source, written with AI and published
//    only when a person decides; Portuguese is written with AI and reviewed
//    gradually; the rest are machine-translated. On sample pages of every built
//    locale the notice must be the one the language registry's draftKind names
//    (none on English), and no pack may carry one of the retired claims again.
//
// Runs after the build (it reads out/); prints its counts; fails the build on
// any mismatch.
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { studyGuides } from "../src/content/certifications/study-guides";
import { PLATFORMS } from "../src/content/training/courses";
import { LOCALES } from "../src/i18n/locales";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const TAG = "[check-teaching-and-authorship-claims]";
const errors: string[] = [];

/** A message pack by locale code, as JSON. */
const pack = (loc: string): Record<string, unknown> => JSON.parse(readFileSync(path.join(ROOT, "src/i18n/messages", `${loc}.json`), "utf8"));

/** The visible text of an HTML fragment: tags dropped, the entities React writes decoded, whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** The training box's sentence on a page, or null when the page has no box; the count of boxes alongside. */
function trainingBox(html: string): { count: number; body: string | null } {
  // Each box is an <aside class="training-cta">; its sentence is the <p class="training-cta-body">.
  const count = (html.match(/class="training-cta"/g) ?? []).length;
  const m = /<p class="training-cta-body">([\s\S]*?)<\/p>/.exec(html);
  return { count, body: m ? text(m[1]) : null };
}

/** The language notice's text on a page, or null when the page carries none. */
function notice(html: string): string | null {
  // The notice is an <aside class="mt-notice"> (src/components/MachineTranslationNotice.tsx).
  const m = /<aside class="mt-notice"[\s\S]*?<\/aside>/.exec(html);
  return m ? text(m[0]) : null;
}

if (!existsSync(OUT)) {
  console.error(`${TAG} FAIL: out/ is missing (this guard runs after the build)`);
  process.exit(1);
}

// The locales this build produced: the registered codes that have a folder with a home page under out/.
const built = readdirSync(OUT).filter((d) => LOCALES.some((l) => l.code === d) && existsSync(path.join(OUT, d, "index.html")));
if (built.length === 0) errors.push("no built locale found under out/");
// The platform names, by vendor key, from the catalogue.
const platformName = new Map(PLATFORMS.map((p) => [p.slug, p.name]));
let guidePages = 0;
let boxes = 0;

for (const loc of built) {
  // ---- 1. The training box on every guide, and on the hub. ----------------------------------------------------------
  for (const g of studyGuides) {
    const file = path.join(OUT, loc, "certifications", g.slug, "index.html");
    if (!existsSync(file)) {
      errors.push(`${loc}: the guide ${g.slug} was not built`);
      continue;
    }
    guidePages++;
    const box = trainingBox(readFileSync(file, "utf8"));
    const name = platformName.get(g.vendor);
    if (name) {
      // A taught vendor: one box, naming it.
      if (box.count !== 1) errors.push(`${loc}/${g.slug}: ${box.count} training boxes, expected 1 (${g.vendor} is taught)`);
      else if (!box.body?.includes(name)) errors.push(`${loc}/${g.slug}: the training box does not name ${name}: "${box.body}"`);
      else boxes++;
    } else if (box.count !== 0) {
      // A vendor not in the catalogue: no box, so no claim.
      errors.push(`${loc}/${g.slug}: a training box on a ${g.vendor} guide, whose courses are not taught: "${box.body}"`);
    }
  }
  // The hub names every platform of the catalogue.
  const hub = path.join(OUT, loc, "certifications", "index.html");
  if (existsSync(hub)) {
    const box = trainingBox(readFileSync(hub, "utf8"));
    const missing = PLATFORMS.filter((p) => !box.body?.includes(p.name)).map((p) => p.name);
    if (box.count !== 1 || missing.length) errors.push(`${loc}/certifications: ${box.count} training box(es), missing ${missing.join(", ") || "nothing"}`);
  } else {
    errors.push(`${loc}: the certifications hub was not built`);
  }

  // ---- 2. The notice the registry names, on three sample pages. -----------------------------------------------------
  const meta = LOCALES.find((l) => l.code === loc)!;
  const mt = pack(loc).machineTranslation as Record<string, string> | undefined;
  // English and any reviewed locale: no notice. A draft: the notice of its kind, in its own pack.
  const expected = meta.status === "machine-draft" ? mt?.[meta.draftKind === "written-with-ai" ? "noticeWrittenWithAi" : "notice"] ?? null : null;
  if (meta.status === "machine-draft" && !expected) errors.push(`${loc}: the pack has no notice for draftKind ${meta.draftKind ?? "machine-translated"}`);
  for (const page of ["index.html", "privacy/index.html", "contact/index.html"]) {
    const file = path.join(OUT, loc, page);
    if (!existsSync(file)) continue;
    const got = notice(readFileSync(file, "utf8"));
    if (expected === null && got !== null) errors.push(`${loc}/${page}: a notice on a locale that carries none: "${got}"`);
    if (expected !== null && !(got ?? "").includes(expected)) errors.push(`${loc}/${page}: notice "${got}", expected "${expected}"`);
  }
}

// ---- 3. The retired claims stay retired, in every pack. --------------------------------------------------------------
const RETIRED: Array<[RegExp, string]> = [
  [/these courses live at/i, "the training box's old \"these courses\""],
  [/Eu dou estes cursos/i, "the Portuguese training box's old \"estes cursos\""],
  [/authored in English and Brazilian Portuguese/i, "Portuguese described as authored"],
  [/English and Brazilian Portuguese are authored/i, "Portuguese described as authored"],
  [/written and reviewed by a person/i, "English credited to a person's writing"],
  [/escrito e revisado por uma pessoa/i, "English credited to a person's writing"],
  [/escrito em inglês e português do Brasil/i, "Portuguese described as authored"],
  [/Instructor and Advisor at Red Education|Instructor and Advisor<\/r>/i, "the title PRIME withdrew (\"Instructor only\")"],
  // P1b (2026-10-13): the Contribute page still called every language but English a machine draft, Portuguese
  // included; row 70 had missed it. The old wordings, in English and in Portuguese, stay out.
  [/Every language (here )?(other than|but) English is a machine-made first draft/i, "Portuguese described as a machine draft"],
  [/Todos os idiomas aqui além do inglês são um primeiro rascunho|Toda língua além do inglês é um primeiro rascunho/i, "Portuguese described as a machine draft"],
  // P1b (2026-10-13): "Senior Instructor" in the Red Education page's own copy, where PRIME's title is Senior Technical
  // Instructor. Only the site's sentences: PRIME's quoted tribute ("joined full-time as a Senior Instructor in 2023")
  // is his own words about the day he joined, and stays as he wrote it.
  [/teaches there as a Senior Instructor\b|full-time as a Senior Instructor since\b|leciona lá como Instrutor Sênior\b|em tempo integral como Instrutor Sênior desde\b/i, "the title without \"Technical\" (PRIME 2026-10-07: Senior Technical Instructor)"],
];
/** Every string of a pack with its dotted key. */
function* strings(o: unknown, p = ""): Generator<[string, string]> {
  if (typeof o === "string") yield [p, o];
  else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) yield* strings(v, p ? `${p}.${k}` : k);
}
const packs = readdirSync(path.join(ROOT, "src/i18n/messages")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
for (const loc of packs) {
  for (const [key, value] of strings(pack(loc))) {
    for (const [re, what] of RETIRED) if (re.test(value)) errors.push(`${loc} ${key}: ${what}`);
  }
}

if (errors.length) {
  console.error(`${TAG} FAIL: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 40)) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`${TAG} OK: ${built.join(", ")}; ${guidePages} guide page(s), ${boxes} training box(es) each naming a taught vendor and none on the others; the hub names all ${PLATFORMS.length} platforms; every sample page carries the notice its locale's registry entry names; ${packs.length} packs free of ${RETIRED.length} retired claims.`);
