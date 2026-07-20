// ============================================================================
// src/lib/glossaryHints.ts
// ----------------------------------------------------------------------------
// GLOSSARY HINTS — surface eligibility (build-time).
//
// The feature: in Learn prose, the FIRST occurrence per page of a high-value
// glossary term gets a subtle dashed underline; hover (desktop) / tap (mobile)
// opens a small popup with the term's def + context and an "Expand" link to the
// full /glossary/<slug> page. A global off-switch (default on) suppresses the
// whole affordance site-wide.
//
// This module owns ONE question: which surface strings are eligible to be
// marked, and to which slug each maps. It does NOT do first-occurrence logic
// (that is the rehype plugin's job, per document) and it does NOT style
// anything (that is the GlossaryTerm component + CSS).
//
// WHY a curated set, not all ~814 entries (decision, PRIME 2026-07-19):
// underlining every glossary term on every page would bury the prose in noise
// and defeat itself. Two filters keep the density honest (measured: median ~2
// marks/page, mean ~3 across the 316 EN Learn articles):
//
//   1. SHAPE — a surface must look like a term worth defining: an ACRONYM
//      (mostly-uppercase, e.g. SNAT, EDNS), a CamelCase proper name
//      (BlueKeep, ProxyShell), a Named concept (Diffie-Hellman, Lucky
//      Thirteen), or a hyphenated technical token (forward-secrecy). Plain
//      lowercase words never qualify.
//
//   2. COLLISION / COMMONNESS — a surface is dropped if it collides with an
//      everyday English word (so the glossary's "AS" never underlines the word
//      "as", "REST" never underlines "rest"), or if it is an ultra-common
//      protocol/format token a technical reader already knows cold (TLS, DNS,
//      IP, HTTP...). Those add nothing and only clutter.
//
// The list is DERIVED from the glossary registry on every build, never hand-
// maintained, so it can never drift from the glossary itself.
// ============================================================================

import { getAllGlossaryEntries } from "@/content/glossary/glossary";

// ---- filter vocabulary -----------------------------------------------------

// Everyday English words that also happen to be glossary headwords or aliases.
// If a surface (lowercased) is in here, or every word of a multiword surface
// is, it is NOT markable — this is what stops "as", "first", "rest", "hash",
// "byte", "pin", "signing" etc. from underlining ordinary prose.
const COMMON_EN = new Set<string>(
  (
    "as first rest hash byte bit pin signing fallback metadata public key load balancer " +
    "balancing provisioning trim done set any type label down up allow deny event begin end " +
    "address query header section answer this with not and or off on no is fix map path root " +
    "leaf branch tree node edge core pool member class group user admin token bearer salt " +
    "pepper block chain link lock unlock trust state flag scope claim issuer subject audience " +
    "nonce cookie session cache proxy origin route listener domain record zone prefix suffix " +
    "mask gateway tunnel interface account image policy signature secret private public window " +
    "field schedule criteria"
  ).split(/\s+/),
);

// Ultra-common protocol/format tokens a technical reader knows cold. Excluded
// by SLUG so the surface never even enters the map. Underlining "TLS" for an
// audience that lives in TLS is pure noise.
const KNOWN_COLD = new Set<string>(
  "tls dns ip http https url uri tcp udp html css json xml api ssl".split(/\s+/),
);

/** A single markable surface: the literal text and the glossary slug it opens. */
export interface HintSurface {
  /** The exact string to match in prose (word-boundary). */
  surface: string;
  /** The glossary slug this surface resolves to. */
  slug: string;
  /**
   * Case sensitivity for matching. Acronyms and CamelCase names must match
   * case-sensitively (so "AES" the cipher does not match "aes" mid-word, and
   * "Mirai" does not match a lowercase accident); named/hyphenated lowercase
   * terms match case-insensitively.
   */
  caseSensitive: boolean;
}

// ---- shape test ------------------------------------------------------------

function isEligibleSurface(surface: string): { ok: boolean; caseSensitive: boolean } {
  const reject = { ok: false, caseSensitive: false };
  if (surface.length < 2) return reject;
  if (/^CVE-/i.test(surface)) return reject; // CVE ids are not prose terms
  if (/^\d/.test(surface)) return reject;

  const words = surface.split(/\s+/);
  if (words.length > 4) return reject; // overlong phrases are not inline-markable

  const low = surface.toLowerCase();
  if (KNOWN_COLD.has(low)) return reject;
  if (COMMON_EN.has(low)) return reject;
  if (words.every((w) => COMMON_EN.has(w.toLowerCase()))) return reject;

  const hasSpace = surface.includes(" ");
  const letters = surface.replace(/[^A-Za-z]/g, "");
  const uppers = surface.replace(/[^A-Z]/g, "");

  // ACRONYM: no spaces, >=2 letters, at least half uppercase (SNAT, EDNS, L4).
  const isAcronym =
    !hasSpace && letters.length >= 2 && uppers.length >= Math.max(2, letters.length * 0.5);

  // CamelCase proper name: an internal lower->upper transition (BlueKeep).
  const isCamel = !hasSpace && /[a-z][A-Z]/.test(surface);

  // Named concept: any word starts uppercase (Diffie-Hellman, Lucky Thirteen).
  const isNamed = words.some((w) => w.length > 0 && /[A-Z]/.test(w[0]));

  // Hyphenated single technical token (forward-secrecy).
  const isHyphen = surface.includes("-") && !hasSpace;

  if (isAcronym || isCamel) return { ok: true, caseSensitive: true };
  if (isNamed || isHyphen) return { ok: true, caseSensitive: false };
  return reject;
}

// ---- the derived map -------------------------------------------------------

let CACHE: HintSurface[] | null = null;

/**
 * Every eligible surface across the whole glossary, first-surface-wins per
 * string (a surface never maps to two slugs). Sorted longest-first so a
 * multiword surface ("Server Name Indication") is preferred over a substring
 * ("SNI") when both could match at the same spot — the plugin matches greedily.
 */
export function getHintSurfaces(): HintSurface[] {
  if (CACHE) return CACHE;
  const seen = new Set<string>();
  const out: HintSurface[] = [];
  for (const entry of getAllGlossaryEntries()) {
    if (KNOWN_COLD.has(entry.slug)) continue;
    const candidates = [entry.headword, ...(entry.aliases ?? [])];
    for (const c of candidates) {
      if (seen.has(c)) continue;
      const verdict = isEligibleSurface(c);
      if (!verdict.ok) continue;
      seen.add(c);
      out.push({ surface: c, slug: entry.slug, caseSensitive: verdict.caseSensitive });
    }
  }
  out.sort((a, b) => b.surface.length - a.surface.length);
  CACHE = out;
  return out;
}
