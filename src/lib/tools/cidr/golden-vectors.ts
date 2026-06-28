// ============================================================================
// src/lib/tools/cidr/golden-vectors.ts
// ----------------------------------------------------------------------------
// Hand-computed golden vectors for the extended CIDR compute (VLSM, aggregate,
// overlap/gap). Each case pins the load-bearing fields of the result; the
// arithmetic is verified by hand against RFC 4632 prefix math. verifyVectors()
// runs every case and is exercised both in CI-style checks and at dev time.
// ============================================================================

import {
  allocateVlsm,
  aggregate,
  analyzeOverlapGap,
  type VlsmResult,
  type AggregateResult,
  type OverlapGapResult,
} from "./compute";

export const GOLDEN_VECTOR_SET_ID = "cidr-subnetting-v1";

interface Case {
  name: string;
  run: () => string | null; // returns null on pass, else an error description
}

function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}

// --- VLSM -------------------------------------------------------------------

function vlsmClassic(): string | null {
  const r: VlsmResult = allocateVlsm("192.168.1.0/24", [
    { label: "A", hosts: 100 },
    { label: "B", hosts: 50 },
    { label: "C", hosts: 25 },
    { label: "D", hosts: 2 },
  ]);
  const s = r.subnets;
  return (
    expect(s.length === 4, `subnets=${s.length} want 4`) ??
    expect(s[0].network === "192.168.1.0" && s[0].prefix === 25 && s[0].usableHosts === 126, "A != 192.168.1.0/25 (126)") ??
    expect(s[1].network === "192.168.1.128" && s[1].prefix === 26 && s[1].usableHosts === 62, "B != 192.168.1.128/26 (62)") ??
    expect(s[2].network === "192.168.1.192" && s[2].prefix === 27 && s[2].usableHosts === 30, "C != 192.168.1.192/27 (30)") ??
    expect(s[3].network === "192.168.1.224" && s[3].prefix === 30 && s[3].broadcast === "192.168.1.227", "D != 192.168.1.224/30") ??
    expect(r.usedAddresses === 228 && r.freeAddresses === 28, `used/free=${r.usedAddresses}/${r.freeAddresses} want 228/28`) ??
    expect(r.utilizationPct === 89.1, `util=${r.utilizationPct} want 89.1`) ??
    expect(r.unallocated.length === 0, "unallocated should be empty")
  );
}

function vlsmDoesNotFit(): string | null {
  const r = allocateVlsm("10.0.0.0/29", [{ label: "X", hosts: 10 }]);
  return (
    expect(r.subnets.length === 0, "should allocate nothing") ??
    expect(r.unallocated.length === 1, "should have 1 unallocated") ??
    expect(r.usedAddresses === 0 && r.freeAddresses === 8, `used/free=${r.usedAddresses}/${r.freeAddresses} want 0/8`)
  );
}

function vlsmMixed(): string | null {
  const r = allocateVlsm("172.16.0.0/22", [
    { label: "Big", hosts: 500 },
    { label: "Med", hosts: 200 },
    { label: "P2P", hosts: 2 },
    { label: "P2P2", hosts: 2 },
  ]);
  const s = r.subnets;
  return (
    expect(s.length === 4, `subnets=${s.length} want 4`) ??
    expect(s[0].network === "172.16.0.0" && s[0].prefix === 23, "Big != 172.16.0.0/23") ??
    expect(s[1].network === "172.16.2.0" && s[1].prefix === 24, "Med != 172.16.2.0/24") ??
    expect(s[2].network === "172.16.3.0" && s[2].prefix === 30, "P2P != 172.16.3.0/30") ??
    expect(s[3].network === "172.16.3.4" && s[3].prefix === 30, "P2P2 != 172.16.3.4/30") ??
    expect(r.usedAddresses === 776 && r.freeAddresses === 248, `used/free=${r.usedAddresses}/${r.freeAddresses} want 776/248`) ??
    expect(r.utilizationPct === 75.8, `util=${r.utilizationPct} want 75.8`)
  );
}

// --- Aggregate --------------------------------------------------------------

function aggAdjacentPair(): string | null {
  const r: AggregateResult = aggregate(["192.168.0.0/24", "192.168.1.0/24"]);
  return (
    expect(r.aggregatedCount === 1, `count=${r.aggregatedCount} want 1`) ??
    expect(r.aggregated[0].cidr === "192.168.0.0/23", `agg=${r.aggregated[0].cidr} want 192.168.0.0/23`) ??
    expect(r.singleSupernet?.cidr === "192.168.0.0/23", "single supernet != 192.168.0.0/23") ??
    expect(r.supernetExtraAddresses === 0, `extra=${r.supernetExtraAddresses} want 0`) ??
    expect(r.inputAddresses === 512, `union=${r.inputAddresses} want 512`)
  );
}

function aggNonContiguous(): string | null {
  const r = aggregate(["10.0.0.0/24", "10.0.2.0/24"]);
  return (
    expect(r.aggregatedCount === 2, `count=${r.aggregatedCount} want 2`) ??
    expect(r.aggregated[0].cidr === "10.0.0.0/24" && r.aggregated[1].cidr === "10.0.2.0/24", "aggregated blocks wrong") ??
    expect(r.singleSupernet?.cidr === "10.0.0.0/22", "single supernet != 10.0.0.0/22") ??
    expect(r.supernetExtraAddresses === 512, `extra=${r.supernetExtraAddresses} want 512`)
  );
}

function aggOverlappingDedup(): string | null {
  const r = aggregate(["10.0.0.0/24", "10.0.0.0/25", "10.0.0.128/25"]);
  return (
    expect(r.aggregatedCount === 1, `count=${r.aggregatedCount} want 1`) ??
    expect(r.aggregated[0].cidr === "10.0.0.0/24", `agg=${r.aggregated[0].cidr} want 10.0.0.0/24`) ??
    expect(r.inputAddresses === 256, `union=${r.inputAddresses} want 256`)
  );
}

// --- Overlap / gap ----------------------------------------------------------

function ovContains(): string | null {
  const r: OverlapGapResult = analyzeOverlapGap(["10.0.0.0/24", "10.0.0.128/25"]);
  return (
    expect(r.hasOverlaps && r.overlaps.length === 1, `overlaps=${r.overlaps.length} want 1`) ??
    expect(r.overlaps[0].kind === "contains", `kind=${r.overlaps[0].kind} want contains`) ??
    expect(r.overlaps[0].overlapStart === "10.0.0.128" && r.overlaps[0].overlapEnd === "10.0.0.255", "overlap range wrong") ??
    expect(r.overlaps[0].overlapAddresses === 128, `overlapAddrs=${r.overlaps[0].overlapAddresses} want 128`) ??
    expect(r.gaps.length === 0, "no scope -> single covered range -> no gaps")
  );
}

function ovGapsInScope(): string | null {
  const r = analyzeOverlapGap(["10.0.0.0/26", "10.0.0.128/26"], "10.0.0.0/24");
  return (
    expect(r.overlaps.length === 0, "the two /26 should not overlap") ??
    expect(r.coveredAddresses === 128, `covered=${r.coveredAddresses} want 128`) ??
    expect(r.scopeAddresses === 256, `scope=${r.scopeAddresses} want 256`) ??
    expect(r.gaps.length === 2, `gaps=${r.gaps.length} want 2`) ??
    expect(r.gaps[0].cidr === "10.0.0.64/26" && r.gaps[1].cidr === "10.0.0.192/26", "gap blocks wrong")
  );
}

function ovIdentical(): string | null {
  const r = analyzeOverlapGap(["10.0.0.0/25", "10.0.0.0/25"]);
  return (
    expect(r.overlaps.length === 1 && r.overlaps[0].kind === "identical", "should detect identical overlap") ??
    expect(r.overlaps[0].overlapAddresses === 128, `overlapAddrs=${r.overlaps[0].overlapAddresses} want 128`)
  );
}

export const CASES: Case[] = [
  { name: "vlsm:classic 192.168.1.0/24 [100,50,25,2]", run: vlsmClassic },
  { name: "vlsm:does-not-fit /29 [10]", run: vlsmDoesNotFit },
  { name: "vlsm:mixed /22 [500,200,2,2]", run: vlsmMixed },
  { name: "agg:adjacent /24+/24 -> /23", run: aggAdjacentPair },
  { name: "agg:non-contiguous -> 2 blocks + /22 supernet", run: aggNonContiguous },
  { name: "agg:overlapping dedup -> /24", run: aggOverlappingDedup },
  { name: "overlap:contains", run: ovContains },
  { name: "overlap:gaps-in-scope", run: ovGapsInScope },
  { name: "overlap:identical", run: ovIdentical },
];

export interface VerifyReport {
  total: number;
  passed: number;
  failed: number;
  failures: Array<{ name: string; reason: string }>;
}

export function verifyVectors(): VerifyReport {
  const failures: Array<{ name: string; reason: string }> = [];
  for (const c of CASES) {
    let reason: string | null;
    try {
      reason = c.run();
    } catch (e) {
      reason = `threw: ${(e as Error).message}`;
    }
    if (reason) failures.push({ name: c.name, reason });
  }
  return { total: CASES.length, passed: CASES.length - failures.length, failed: failures.length, failures };
}
