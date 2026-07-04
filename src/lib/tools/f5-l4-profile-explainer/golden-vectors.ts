// ============================================================================
// src/lib/tools/f5-l4-profile-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Vectors pin: the eight-card catalogue, alias resolution across all three
// families, the living contract on tcp and the f5-* profiles, the legacy
// mapping observation, FastL4's loose pair and PVA modes and the minimal-L7
// tradeoff, FastHTTP's criteria list including the no-source-IP and
// keep-alive clauses and the basic-iRule trio, and the error paths.
// ============================================================================

import { run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5-l4-profile-explainer-golden-v1";

export interface L4Vector {
  id: string;
  description: string;
  input: string;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectMode?: "profile" | "catalog";
  expectProfileId?: string;
  expectFamily?: string;
  expectStoryIncludes?: string;
  expectWhenIncludes?: string;
  expectTradeoffIncludes?: string;
  expectQuirkIncludes?: string;
  expectObsIncludes?: string;
  expectCatalogCount?: number;
}

export const L4_VECTORS: L4Vector[] = [
  { id: "catalog", description: "profiles renders all eight cards with the living note", input: "profiles", expectOk: true, expectMode: "catalog", expectCatalogCount: 8, expectObsIncludes: "read-only" },
  { id: "tcp-living", description: "The default tcp card carries the living contract", input: "tcp", expectOk: true, expectProfileId: "tcp", expectObsIncludes: "living" },
  { id: "progressive", description: "Progressive is the latest-features general-use profile", input: "f5-tcp-progressive", expectOk: true, expectStoryIncludes: "very latest features" },
  { id: "progressive-alias", description: "Bare progressive resolves", input: "progressive", expectOk: true, expectProfileId: "f5-tcp-progressive" },
  { id: "lan-updated-version", description: "f5-tcp-lan names itself the updated tcp-lan-optimized", input: "f5-tcp-lan", expectOk: true, expectStoryIncludes: "updated version of tcp-lan-optimized" },
  { id: "wan-when", description: "f5-tcp-wan carries the client-over-WAN example", input: "f5-tcp-wan", expectOk: true, expectFamily: "living", expectWhenIncludes: "Client-side" },
  { id: "legacy-lookup", description: "A legacy name resolves to the trio card", input: "tcp-wan-optimized", expectOk: true, expectProfileId: "legacy", expectObsIncludes: "updated versions" },
  { id: "legacy-frozen", description: "The legacy card states the frozen tradeoff", input: "legacy", expectOk: true, expectTradeoffIncludes: "Frozen means frozen" },
  { id: "mptcp-sizing", description: "The under-1MB sizing note lives on the legacy card", input: "mptcp-mobile-optimized", expectOk: true, expectQuirkIncludes: "1 MB" },
  { id: "fastl4-pva", description: "FastL4 states the PVA purpose and the acceleration modes", input: "fastl4", expectOk: true, expectStoryIncludes: "Packet Velocity ASIC", expectQuirkIncludes: "full | none | partial | dedicated" },
  { id: "fastl4-loose", description: "The loose pair with defaults-disabled is on the card", input: "fastl4", expectOk: true, expectQuirkIncludes: "any TCP packet rather than requiring a SYN" },
  { id: "fastl4-tradeoff", description: "Minimal-L7 tradeoff stated in the guide's words", input: "pva", expectOk: true, expectProfileId: "fastl4", expectTradeoffIncludes: "Minimal L7 information" },
  { id: "fastl4-vs-pairing", description: "The virtual-server pairing observation fires", input: "fastl4", expectOk: true, expectObsIncludes: "Forwarding (IP)" },
  { id: "fasthttp-composition", description: "FastHTTP names its three-profile composition", input: "fasthttp", expectOk: true, expectStoryIncludes: "TCP Express, HTTP, and OneConnect" },
  { id: "fasthttp-criteria", description: "The no-SSL and keep-alive criteria are on the card", input: "fasthttp", expectOk: true, expectWhenIncludes: "SSL traffic management" },
  { id: "fasthttp-irules", description: "The basic-iRule event trio is the reference's own", input: "performance-http", expectOk: true, expectProfileId: "fasthttp", expectWhenIncludes: "HTTP_REQUEST" },
  { id: "fasthttp-k8024", description: "K8024 named as required reading", input: "fasthttp", expectOk: true, expectTradeoffIncludes: "K8024" },
  { id: "error-unknown", description: "Unknown profile names the families", input: "warp-speed", expectOk: false, expectErrorIncludes: "living four" },
  { id: "error-empty", description: "Empty input names the shapes", input: "  ", expectOk: false, expectErrorIncludes: "fastl4" },
];

export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of L4_VECTORS) {
    try {
      const r = run(v.input);
      if (v.expectOk === false) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expectMode && r.mode !== v.expectMode) failures.push(`${v.id}: mode ${r.mode}`);
      if (v.expectCatalogCount !== undefined && (r.catalog?.length ?? -1) !== v.expectCatalogCount) failures.push(`${v.id}: catalog ${r.catalog?.length}`);
      const p = r.profile;
      if (v.expectProfileId && p?.id !== v.expectProfileId) failures.push(`${v.id}: id ${p?.id}`);
      if (v.expectFamily && p?.family !== v.expectFamily) failures.push(`${v.id}: family ${p?.family}`);
      if (v.expectStoryIncludes && !(p?.story ?? "").includes(v.expectStoryIncludes)) failures.push(`${v.id}: story missing`);
      if (v.expectWhenIncludes && !(p?.whenToUse ?? []).some((w) => w.includes(v.expectWhenIncludes!))) failures.push(`${v.id}: when missing`);
      if (v.expectTradeoffIncludes && !(p?.tradeoffs ?? []).some((t) => t.includes(v.expectTradeoffIncludes!))) failures.push(`${v.id}: tradeoff missing`);
      if (v.expectQuirkIncludes && !(p?.quirks ?? []).some((q) => q.includes(v.expectQuirkIncludes!))) failures.push(`${v.id}: quirk missing`);
      if (v.expectObsIncludes && !r.observations.some((o) => o.includes(v.expectObsIncludes!))) failures.push(`${v.id}: obs missing`);
    } catch (e) {
      if (v.expectOk !== false) { failures.push(`${v.id}: unexpected ${(e as Error).message}`); continue; }
      if (v.expectErrorIncludes && !(e as Error).message.includes(v.expectErrorIncludes)) failures.push(`${v.id}: error msg "${(e as Error).message}"`);
    }
  }
  return failures;
}
