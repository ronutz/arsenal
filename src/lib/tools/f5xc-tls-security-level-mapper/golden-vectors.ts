// ============================================================================
// src/lib/tools/f5xc-tls-security-level-mapper/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: forward level -> cipher-count + version snapshots, and
// reverse cipher -> level lookups. Counts follow the verbatim TLS Reference
// table (High 9, Medium 13, Low 17; cumulative).
// ============================================================================

import { forwardLevel, reverseLookup, run, type Level } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-tls-security-level-mapper/2026-07-11";

interface FwdVec { id: string; level: Level; count: number; min: string; max: string; addedCount: number; }
interface RevVec { id: string; query: string; levels: Level[] | null; matchCount: number; }

const FWD: FwdVec[] = [
  { id: "high", level: "High", count: 9, min: "TLS 1.2", max: "TLS 1.3", addedCount: 9 },
  { id: "medium", level: "Medium", count: 13, min: "TLS 1.0", max: "TLS 1.3", addedCount: 4 },
  { id: "low", level: "Low", count: 17, min: "TLS 1.0", max: "TLS 1.3", addedCount: 4 },
];

const REV: RevVec[] = [
  { id: "tls13-all-levels", query: "TLS_AES_128_GCM_SHA256", levels: ["High", "Medium", "Low"], matchCount: 1 },
  { id: "ecdhe-gcm-all-levels", query: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", levels: ["High", "Medium", "Low"], matchCount: 1 },
  { id: "ecdhe-cbc-medium-low", query: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA", levels: ["Medium", "Low"], matchCount: 1 },
  { id: "rsa-low-only", query: "TLS_RSA_WITH_AES_128_CBC_SHA", levels: ["Low"], matchCount: 1 },
  { id: "openssl-form", query: "ECDHE-RSA-AES128-GCM-SHA256", levels: ["High", "Medium", "Low"], matchCount: 1 },
  { id: "scanner-line", query: "TLSv1.0  (0xc013)  ECDHE-RSA-AES128-SHA  medium", levels: ["Medium", "Low"], matchCount: 1 },
  { id: "not-in-any-level", query: "TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA", levels: null, matchCount: 0 },
];

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  for (const v of FWD) {
    const r = forwardLevel(v.level);
    const e: string[] = [];
    if (r.ciphers.length !== v.count) e.push(`count: got ${r.ciphers.length} want ${v.count}`);
    if (r.minTls !== v.min) e.push(`min: got ${r.minTls} want ${v.min}`);
    if (r.maxTls !== v.max) e.push(`max: got ${r.maxTls} want ${v.max}`);
    if (r.addedByThisLevel.length !== v.addedCount) e.push(`added: got ${r.addedByThisLevel.length} want ${v.addedCount}`);
    if (e.length) failures.push(`[fwd:${v.id}] ${e.join("; ")}`);
    else passed++;
  }

  for (const v of REV) {
    const r = reverseLookup(v.query);
    const e: string[] = [];
    if (!r.ok) {
      e.push(`unexpected error`);
    } else {
      if (r.matches.length !== v.matchCount) e.push(`matchCount: got ${r.matches.length} want ${v.matchCount}`);
      if (v.levels !== null) {
        const got = r.matches[0]?.levels ?? [];
        if (JSON.stringify(got) !== JSON.stringify(v.levels)) e.push(`levels: got ${JSON.stringify(got)} want ${JSON.stringify(v.levels)}`);
      }
    }
    if (e.length) failures.push(`[rev:${v.id}] ${e.join("; ")}`);
    else passed++;
  }

  // run() dispatch: "medium" -> forward, cipher -> reverse
  const rf = run("medium");
  if (!(rf.ok && rf.mode === "forward" && rf.level === "Medium")) failures.push(`[run:medium] dispatch wrong`);
  else passed++;
  const rr = run("AES128-SHA");
  if (!(rr.ok && rr.mode === "reverse" && rr.matches.length === 1)) failures.push(`[run:openssl-low] dispatch wrong`);
  else passed++;

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [...FWD.map((v) => `fwd:${v.id}`), ...REV.map((v) => `rev:${v.id}`), "run:medium", "run:openssl-low"];
