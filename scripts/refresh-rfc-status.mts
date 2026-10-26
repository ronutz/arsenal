// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/refresh-rfc-status.mts  (manual; run with tsx; never in the build)
// ----------------------------------------------------------------------------
// REGENERATES THE RFC STATUS SNAPSHOT the standards-currency review reads
// (src/content/materials/rfc-status.json; Round 1 batch B, item B4,
// 2026-10-26). The build never touches the network, so the RFC Editor's
// verdicts reach it only through this committed snapshot, and the snapshot is
// only as fresh as its last refresh: run this whenever the course cites a new
// RFC (check-materials then fails with "not in the snapshot") and before each
// course release.
//
// Usage, from the repository root, with an index downloaded TODAY by hand
// (house recipe: cache-buster, no-cache headers, generic user agent):
//
//   curl -sS -L --max-time 120 -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' \
//     -A 'Mozilla/5.0 (X11; Linux x86_64) research-fetch' \
//     -o /path/outside/the/repo/rfc-index.xml "https://www.rfc-editor.org/rfc-index.xml?cb=$(date +%s)"
//   npx tsx scripts/refresh-rfc-status.mts /path/outside/the/repo/rfc-index.xml [--read-at 2026-10-26T00:31:58-03:00]
//
// --read-at records when the index was downloaded; without it the file's
// modification time is used. What it writes: for every RFC an open-course
// asset cites (found by the same code the guard uses, scripts/rfc-currency.mts)
// and every RFC in its obsoleted-by chain, the index's title, date, current
// status, obsoleted-by and updated-by; plus the index URL, the read time, and
// the index file's size and SHA-256. It prints what changed against the
// previous snapshot (an RFC newly obsoleted or updated is a decision for PRIME,
// not something this script resolves).
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseRfcIndex, collectUnits, citationsOf, successorsOf, SNAPSHOT_PATH, INDEX_URL, type RfcSnapshot, type RfcStatus } from "./rfc-currency.mts";

// The repository root (the script is run from it, as every guard is).
const ROOT = process.cwd();
const TAG = "[refresh-rfc-status]";

// Arguments: the index file, and optionally --read-at.
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const readAtFlag = args.indexOf("--read-at");
// Without an index there is nothing to read: say how to get one and stop.
if (!file || !fs.existsSync(file)) {
  console.error(`${TAG} usage: npx tsx scripts/refresh-rfc-status.mts <downloaded rfc-index.xml> [--read-at ISO-8601]`);
  process.exit(2);
}
// The index's bytes, digest and records.
const raw = fs.readFileSync(file);
const index = parseRfcIndex(raw.toString("utf8"));
// A truncated or wrong file would silently empty the snapshot; refuse anything implausibly small (the index lists
// well over 9,000 RFCs).
if (index.size < 9000) {
  console.error(`${TAG} ${file} holds only ${index.size} RFC entries; not the full index (truncated download?)`);
  process.exit(1);
}
// When the index was read: the flag, else the file's modification time, as ISO 8601.
const readAt = readAtFlag >= 0 ? args[readAtFlag + 1] : fs.statSync(file).mtime.toISOString();

// Every cited RFC, then the closure over obsoleted-by so the guard can name the current successor offline.
const { units, problems } = collectUnits(ROOT);
// Unreadable assets would hide citations: stop rather than write a partial snapshot.
if (problems.length) {
  console.error(`${TAG} FAIL: course text could not be read:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
const cited = new Set(citationsOf(units).map((c) => c.rfc));
const wanted = new Set<number>(cited);
for (const n of cited) for (const s of successorsOf(n, (k) => index.get(k))) wanted.add(s);

// The records, ascending; a cited number the index does not know is reported, not invented.
const rfcs: Record<string, RfcStatus> = {};
const missing: number[] = [];
for (const n of [...wanted].sort((a, b) => a - b)) {
  // The index's record, or a note that it has none.
  const rec = index.get(n);
  if (rec) rfcs[String(n)] = rec;
  else missing.push(n);
}

// The previous snapshot, for the change report.
const target = path.join(ROOT, SNAPSHOT_PATH);
const prev: RfcSnapshot | null = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, "utf8")) : null;

// The new snapshot.
const snap: RfcSnapshot = {
  about: "RFC Editor index records for every RFC the open course cites and every RFC that obsoletes one of them. Read by scripts/check-materials.mts (standards-currency review); regenerated only by scripts/refresh-rfc-status.mts from a freshly downloaded index. Do not edit by hand.",
  source: INDEX_URL,
  readAt,
  indexBytes: raw.length,
  indexSha256: crypto.createHash("sha256").update(raw).digest("hex"),
  rfcs,
};
// Written with two-space indentation and a trailing newline, like the other JSON files in the repository.
fs.writeFileSync(target, JSON.stringify(snap, null, 2) + "\n");

// The change report: added, removed, and any RFC whose obsoleted-by or updated-by changed.
const changes: string[] = [];
for (const [k, r] of Object.entries(rfcs)) {
  // The previous record of the same RFC.
  const p = prev?.rfcs[k];
  if (!p) changes.push(`+ RFC ${k} (${r.title}): ${r.obsoletedBy.length ? `obsoleted by ${r.obsoletedBy.join(", ")}` : "not obsoleted"}`);
  else if (p.obsoletedBy.join() !== r.obsoletedBy.join()) changes.push(`! RFC ${k}: obsoleted-by ${p.obsoletedBy.join(", ") || "none"} -> ${r.obsoletedBy.join(", ") || "none"}`);
  else if (p.updatedBy.join() !== r.updatedBy.join()) changes.push(`~ RFC ${k}: updated-by ${p.updatedBy.join(", ") || "none"} -> ${r.updatedBy.join(", ") || "none"}`);
}
for (const k of Object.keys(prev?.rfcs ?? {})) if (!rfcs[k]) changes.push(`- RFC ${k}: no longer cited`);

// Summary.
console.log(`${TAG} wrote ${SNAPSHOT_PATH}: ${Object.keys(rfcs).length} RFC record(s) (${cited.size} cited, the rest successors), index read ${readAt}, ${raw.length} bytes, SHA-256 ${snap.indexSha256}.`);
if (missing.length) console.log(`${TAG} not in the index (check the citation): ${missing.map((n) => `RFC ${n}`).join(", ")}`);
if (prev) console.log(changes.length ? `${TAG} changes since ${prev.readAt}:\n  ${changes.join("\n  ")}` : `${TAG} no change since ${prev.readAt}.`);
