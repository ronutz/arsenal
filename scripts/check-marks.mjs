// ============================================================================
// scripts/check-marks.mjs
// ----------------------------------------------------------------------------
// BUILD GUARD: the vendor wordmark registry must stay honest.
//
// Context: until 2026-09-09 this site published no vendor logo at all, by
// design (see src/components/TechIcons.tsx). PRIME then supplied a curated set
// he had personally verified against each vendor's brand guidelines, for a
// specific purpose: the history pages span four decades, and a company's mark
// is dated evidence. Showing a current mark beside a 1996 story is an
// anachronism.
//
// A registry that drifts is worse than no registry, because the whole value is
// the claim that the mark shown is the mark that was official at the time. So
// this gate enforces the machine-checkable half of the rules written at the top
// of src/content/vendors/marks.ts:
//
//   1. every registered mark resolves to a file that exists under public/;
//   2. every file in public/img/marks/ is registered (no orphan artwork
//      shipping in the asset manifest that nothing accounts for);
//   3. eras are coherent: from <= to, no era starts in the future, and no two
//      marks for the same vendor overlap - a year must resolve to exactly one
//      mark or to none;
//   4. at most one CURRENT mark (to: null) per vendor;
//   5. every entry carries a non-empty note, because provenance that is not
//      written down is provenance that is lost.
//
// What it deliberately does NOT check: nominative use. No script can tell
// whether a mark is identifying a company or decorating a page. That rule is
// written in the registry header and is PRIME's to hold.
// ============================================================================

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAG = "[check-marks]";
const MARKS_DIR = path.join(ROOT, "public", "img", "marks");

const { VENDOR_MARKS } = await import(
  path.join(ROOT, "src", "content", "vendors", "marks.ts")
).catch(async () => {
  // marks.ts is TypeScript; Node cannot import it directly in every version.
  // Parse the literal instead, which is enough for the structural checks and
  // keeps this guard dependency-free like its siblings.
  const { readFile } = await import("node:fs/promises");
  const src = await readFile(
    path.join(ROOT, "src", "content", "vendors", "marks.ts"),
    "utf8"
  );
  const entries = [];
  const re =
    /\{\s*vendor:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*src:\s*"([^"]+)",\s*from:\s*(\d+),\s*to:\s*(null|\d+),\s*note:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({
      vendor: m[1],
      label: m[2],
      src: m[3],
      from: Number(m[4]),
      to: m[5] === "null" ? null : Number(m[5]),
      note: m[6],
    });
  }
  return { VENDOR_MARKS: entries };
});

const errors = [];
const YEAR = new Date().getUTCFullYear();

if (!VENDOR_MARKS.length) {
  errors.push("the registry parsed to zero entries - the parser or the file shape changed");
}

// 1 + 5: files resolve; notes present.
for (const m of VENDOR_MARKS) {
  const abs = path.join(ROOT, "public", m.src.replace(/^\//, ""));
  if (!existsSync(abs)) {
    errors.push(`${m.vendor} (${m.from}): src does not exist -> ${m.src}`);
  }
  if (!m.note || !m.note.trim()) {
    errors.push(`${m.vendor} (${m.from}): empty note; provenance must be written down`);
  }
  // 3a: era sanity.
  if (m.to !== null && m.to < m.from) {
    errors.push(`${m.vendor}: era ends before it starts (${m.from} -> ${m.to})`);
  }
  if (m.from > YEAR) {
    errors.push(`${m.vendor}: era starts in the future (${m.from})`);
  }
}

// 2: no orphan artwork.
const onDisk = existsSync(MARKS_DIR)
  ? (await readdir(MARKS_DIR)).filter((f) => !f.startsWith("."))
  : [];
const registered = new Set(VENDOR_MARKS.map((m) => path.basename(m.src)));
for (const f of onDisk) {
  if (!registered.has(f)) {
    errors.push(`public/img/marks/${f} is not registered in marks.ts`);
  }
}

// 3b + 4: per-vendor era coherence.
const byVendor = new Map();
for (const m of VENDOR_MARKS) {
  if (!byVendor.has(m.vendor)) byVendor.set(m.vendor, []);
  byVendor.get(m.vendor).push(m);
}
for (const [vendor, list] of byVendor) {
  const current = list.filter((m) => m.to === null);
  if (current.length > 1) {
    errors.push(`${vendor}: ${current.length} marks are marked current (to: null); at most one`);
  }
  const sorted = [...list].sort((a, b) => a.from - b.from);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const prevEnd = prev.to === null ? Infinity : prev.to;
    if (cur.from < prevEnd) {
      errors.push(
        `${vendor}: eras overlap - "${prev.label}" (${prev.from}-${prev.to ?? "current"}) ` +
          `and "${cur.label}" (${cur.from}-${cur.to ?? "current"}); a year must resolve to one mark`
      );
    }
  }
}

if (errors.length) {
  console.error(`\n${TAG} FAIL: ${errors.length} problem(s) in the wordmark registry:\n`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(
    `\n  See the header of src/content/vendors/marks.ts for the rules. Note that\n` +
      `  NOMINATIVE USE - a mark identifies the company written about, never\n` +
      `  decorates a page and never implies endorsement - is not machine-checkable\n` +
      `  and remains a human responsibility.\n`
  );
  process.exit(1);
}

const historic = VENDOR_MARKS.filter((m) => m.to !== null).length;
console.log(
  `${TAG} OK: ${VENDOR_MARKS.length} mark(s) across ${byVendor.size} vendor(s) ` +
    `(${historic} historic/retired); all files present, eras coherent, notes recorded.`
);
