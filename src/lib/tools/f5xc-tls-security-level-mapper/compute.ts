// ============================================================================
// src/lib/tools/f5xc-tls-security-level-mapper/compute.ts
// ----------------------------------------------------------------------------
// F5 Distributed Cloud (XC) TLS security-level <-> cipher-suite mapper. Pure
// logic, offline.
//
// Forward:  pick a predefined level (High / Medium / Low) -> its exact min/max
//           TLS versions and full cipher list, with PFS + strength annotations.
// Reverse:  paste a cipher suite (IANA TLS_* or OpenSSL dash form) or a scanner
//           line -> which XC levels include it.
//
// The cipher table is transcribed VERBATIM from F5's TLS Reference
// (docs.cloud.f5.com/docs-v2/web-app-and-api-protection/reference/tls-reference,
// last modified 2026-06-24; retrieved 2026-07-11). Two facts from that table
// that surprise people:
//   - "Default" IS the High level: minimum TLS 1.2, maximum TLS 1.3. It is what
//     an HTTPS load balancer with automatic certificate uses by default.
//   - The lists are CUMULATIVE. Medium = Default + 4 ECDHE-CBC ciphers; Low =
//     Medium + 4 static-RSA ciphers. Every level's maximum is TLS 1.3.
// TCP LB guide level semantics (retrieved 2026-07-11): High = TLS 1.2 + PFS +
// strong; Medium = TLS 1.0 + PFS + medium; Low = TLS 1.0 + non-PFS + weak.
// ============================================================================

export type Level = "High" | "Medium" | "Low";
export type Strength = "strong" | "medium" | "weak";

export interface CipherEntry {
  iana: string; // canonical IANA name as printed by F5
  openssl: string; // common OpenSSL / scanner name
  kx: string; // key exchange family
  pfs: boolean; // forward secrecy?
  strength: Strength;
  introducedAt: Level; // the highest-security level that first includes it
}

// -- The verbatim table, in F5's own order. introducedAt encodes the cumulative
//    structure: a High cipher is in all levels; a Medium cipher is in Medium and
//    Low; a Low cipher is in Low only. --
export const CIPHERS: readonly CipherEntry[] = Object.freeze([
  // Default / High level (min TLS 1.2). All PFS, AEAD, strong.
  { iana: "TLS_AES_128_GCM_SHA256", openssl: "TLS_AES_128_GCM_SHA256", kx: "TLS 1.3", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_AES_256_GCM_SHA384", openssl: "TLS_AES_256_GCM_SHA384", kx: "TLS 1.3", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_CHACHA20_POLY1305_SHA256", openssl: "TLS_CHACHA20_POLY1305_SHA256", kx: "TLS 1.3", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256", openssl: "ECDHE-ECDSA-AES128-GCM-SHA256", kx: "ECDHE-ECDSA", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384", openssl: "ECDHE-ECDSA-AES256-GCM-SHA384", kx: "ECDHE-ECDSA", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256", openssl: "ECDHE-ECDSA-CHACHA20-POLY1305", kx: "ECDHE-ECDSA", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", openssl: "ECDHE-RSA-AES128-GCM-SHA256", kx: "ECDHE-RSA", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384", openssl: "ECDHE-RSA-AES256-GCM-SHA384", kx: "ECDHE-RSA", pfs: true, strength: "strong", introducedAt: "High" },
  { iana: "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256", openssl: "ECDHE-RSA-CHACHA20-POLY1305", kx: "ECDHE-RSA", pfs: true, strength: "strong", introducedAt: "High" },
  // Medium adds these (min TLS 1.0). PFS (ECDHE) but CBC/SHA-1 -> medium.
  { iana: "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA", openssl: "ECDHE-ECDSA-AES128-SHA", kx: "ECDHE-ECDSA", pfs: true, strength: "medium", introducedAt: "Medium" },
  { iana: "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA", openssl: "ECDHE-ECDSA-AES256-SHA", kx: "ECDHE-ECDSA", pfs: true, strength: "medium", introducedAt: "Medium" },
  { iana: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA", openssl: "ECDHE-RSA-AES128-SHA", kx: "ECDHE-RSA", pfs: true, strength: "medium", introducedAt: "Medium" },
  { iana: "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA", openssl: "ECDHE-RSA-AES256-SHA", kx: "ECDHE-RSA", pfs: true, strength: "medium", introducedAt: "Medium" },
  // Low adds these (min TLS 1.0). Static RSA key exchange -> no forward secrecy.
  { iana: "TLS_RSA_WITH_AES_128_CBC_SHA", openssl: "AES128-SHA", kx: "RSA", pfs: false, strength: "weak", introducedAt: "Low" },
  { iana: "TLS_RSA_WITH_AES_128_GCM_SHA256", openssl: "AES128-GCM-SHA256", kx: "RSA", pfs: false, strength: "weak", introducedAt: "Low" },
  { iana: "TLS_RSA_WITH_AES_256_CBC_SHA", openssl: "AES256-SHA", kx: "RSA", pfs: false, strength: "weak", introducedAt: "Low" },
  { iana: "TLS_RSA_WITH_AES_256_GCM_SHA384", openssl: "AES256-GCM-SHA384", kx: "RSA", pfs: false, strength: "weak", introducedAt: "Low" },
]);

const LEVEL_ORDER: Record<Level, number> = { High: 3, Medium: 2, Low: 1 };
export const LEVEL_TLS: Record<Level, { min: string; max: string; summary: string }> = {
  High: { min: "TLS 1.2", max: "TLS 1.3", summary: "TLS 1.2 with PFS ciphers and strong algorithms. This is the Default level, used by an HTTPS load balancer with automatic certificate." },
  Medium: { min: "TLS 1.0", max: "TLS 1.3", summary: "TLS 1.0 with PFS ciphers and medium-strength algorithms. Includes every High cipher plus four ECDHE-CBC suites." },
  Low: { min: "TLS 1.0", max: "TLS 1.3", summary: "TLS 1.0 with non-PFS ciphers and weak algorithms. Includes every High and Medium cipher plus four static-RSA suites." },
};

/** Ciphers a level negotiates (cumulative: a level includes all higher-order intro ciphers). */
function ciphersForLevel(level: Level): CipherEntry[] {
  const floor = LEVEL_ORDER[level];
  return CIPHERS.filter((c) => LEVEL_ORDER[c.introducedAt] >= floor);
}

/** Which levels include a given cipher (by its introducedAt). */
function levelsIncluding(introducedAt: Level): Level[] {
  const cut = LEVEL_ORDER[introducedAt];
  return (["High", "Medium", "Low"] as Level[]).filter((l) => LEVEL_ORDER[l] <= cut);
}

export interface ForwardResult {
  ok: true;
  mode: "forward";
  level: Level;
  minTls: string;
  maxTls: string;
  summary: string;
  ciphers: CipherEntry[];
  addedByThisLevel: CipherEntry[];
}

export interface ReverseMatch {
  iana: string;
  openssl: string;
  pfs: boolean;
  strength: Strength;
  introducedAt: Level;
  levels: Level[];
}
export interface ReverseResult {
  ok: true;
  mode: "reverse";
  query: string;
  matches: ReverseMatch[];
}
export interface ErrorResult {
  ok: false;
  error: string;
  code: string;
}
export type MapperResult = ForwardResult | ReverseResult | ErrorResult;

export function forwardLevel(level: Level): ForwardResult {
  const ciphers = ciphersForLevel(level);
  return {
    ok: true,
    mode: "forward",
    level,
    minTls: LEVEL_TLS[level].min,
    maxTls: LEVEL_TLS[level].max,
    summary: LEVEL_TLS[level].summary,
    ciphers,
    addedByThisLevel: CIPHERS.filter((c) => c.introducedAt === level),
  };
}

/** Normalize a name for matching: uppercase, unify -/_/space runs to one "_". */
function norm(s: string): string {
  return s.trim().toUpperCase().replace(/[-_\s]+/g, "_");
}

// Build a normalized-name -> cipher lookup once (both IANA and OpenSSL forms).
const NAME_INDEX: Map<string, CipherEntry> = (() => {
  const m = new Map<string, CipherEntry>();
  for (const c of CIPHERS) {
    m.set(norm(c.iana), c);
    m.set(norm(c.openssl), c);
  }
  return m;
})();

export function reverseLookup(raw: string): ReverseResult | ErrorResult {
  const query = raw.trim();
  if (query === "") return { ok: false, error: "Paste a cipher suite (IANA TLS_* or OpenSSL form) or a scanner line.", code: "empty" };
  // Tokenize on whitespace and common scanner delimiters, then match each token
  // EXACTLY (not by substring - short names like AES256-SHA are substrings of
  // longer ECDHE names, which would over-match).
  const tokens = query.split(/[\s,;:()[\]{}"']+/).filter(Boolean);
  const matches: ReverseMatch[] = [];
  const seen = new Set<string>();
  for (const tok of tokens) {
    const c = NAME_INDEX.get(norm(tok));
    if (c && !seen.has(c.iana)) {
      seen.add(c.iana);
      matches.push({ iana: c.iana, openssl: c.openssl, pfs: c.pfs, strength: c.strength, introducedAt: c.introducedAt, levels: levelsIncluding(c.introducedAt) });
    }
  }
  return { ok: true, mode: "reverse", query, matches };
}

/** D-49 run entrypoint: a string. "High"/"Medium"/"Low" runs forward; else reverse. */
export function run(input: string): MapperResult {
  const t = input.trim();
  const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  if (cap === "High" || cap === "Medium" || cap === "Low") return forwardLevel(cap as Level);
  return reverseLookup(input);
}
