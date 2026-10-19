// ============================================================================
// src/lib/tools/cidr/golden-vectors.ts
// ----------------------------------------------------------------------------
// Hand-computed golden vectors for the extended CIDR compute (VLSM, aggregate,
// overlap/gap, and since 2026-10-19 the special-purpose classification). Each case pins the load-bearing fields of the result; the
// arithmetic is verified by hand against RFC 4632 prefix math. verifyVectors()
// runs every case and is exercised both in CI-style checks and at dev time.
// ============================================================================

import {
  allocateVlsm,
  aggregate,
  analyzeOverlapGap,
  classifySpecialPurpose, // special-purpose classification (2026-10-19)
  CidrInputError, // the error class whose codes the rejection vectors pin (2026-10-19)
  type VlsmResult,
  type AggregateResult,
  type OverlapGapResult,
  type SpecialPurposeClassification, // the classification result (2026-10-19)
} from "./compute";

// Bumped 2026-10-19 from "cidr-subnetting-v1" (9 vectors, all kept unchanged) when the special-purpose classification
// and the VLSM fixes (RFC 3021 /31 option, 0-host rejection, masked-parent flag, free blocks) gained their vectors.
// Every classification expectation was computed independently the same day with CPython ipaddress against the IANA
// registry CSV read that day (tools-fix/cidr/expected-python-20261019.txt in the NF-2e work folder).
export const GOLDEN_VECTOR_SET_ID = "cidr-subnetting-golden-2026-10-19";

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

// --- VLSM fixes (2026-10-19) ------------------------------------------------

/** The free space of the classic plan, listed as blocks (28 free addresses = a /30, a /29 and a /28). */
function vlsmFreeBlocks(): string | null {
  // The same plan as vlsmClassic; only the new fields are pinned here.
  const r = allocateVlsm("192.168.1.0/24", [{ label: "A", hosts: 100 }, { label: "B", hosts: 50 }, { label: "C", hosts: 25 }, { label: "D", hosts: 2 }]);
  // The three blocks, in address order, and their sum equal to the free count.
  return (
    expect(r.freeBlocks.map((b) => b.cidr).join(",") === "192.168.1.228/30,192.168.1.232/29,192.168.1.240/28", `free=${r.freeBlocks.map((b) => b.cidr).join(",")}`) ?? // the blocks
    expect(r.freeBlocks.reduce((n, b) => n + b.size, 0) === r.freeAddresses, "free blocks do not sum to freeAddresses") ?? // the sum
    expect(r.placement === "largest-first" && r.parentMasked === false && r.parentInput === "192.168.1.0/24", "placement/parentMasked/parentInput wrong") // the stated facts
  ); // end of the checks
}

/** The RFC 3021 option: two 2-host links get /31s on the documentation block 203.0.113.0/24. */
function vlsmPointToPoint31(): string | null {
  // An office of 100, a guest LAN of 25, a management LAN of 10 and two router links, with the /31 option on.
  const r = allocateVlsm("203.0.113.0/24", [{ label: "Office", hosts: 100 }, { label: "Guest", hosts: 25 }, { label: "Mgmt", hosts: 10 }, { label: "L1", hosts: 2 }, { label: "L2", hosts: 2 }], { pointToPoint31: true });
  const s = r.subnets; // the placed blocks
  // Each block where the hand computation (and CPython) puts it; the links are /31 with both addresses usable.
  return (
    expect(s.map((x) => `${x.network}/${x.prefix}`).join(",") === "203.0.113.0/25,203.0.113.128/27,203.0.113.160/28,203.0.113.176/31,203.0.113.178/31", `plan=${s.map((x) => `${x.network}/${x.prefix}`).join(",")}`) ?? // the plan
    expect(s[3].usableHosts === 2 && s[3].firstHost === "203.0.113.176" && s[3].lastHost === "203.0.113.177" && s[3].pointToPoint31, "L1 /31 wrong") ?? // the first link
    expect(r.usedAddresses === 180 && r.freeAddresses === 76 && r.utilizationPct === 70.3, `used/free/util=${r.usedAddresses}/${r.freeAddresses}/${r.utilizationPct}`) ?? // the totals
    expect(r.freeBlocks.map((b) => b.cidr).join(",") === "203.0.113.180/30,203.0.113.184/29,203.0.113.192/26", `free=${r.freeBlocks.map((b) => b.cidr).join(",")}`) // the free blocks
  ); // end of the checks
}

/** The same requests with the option off (the default): the links stay /30, exactly as before 2026-10-19. */
function vlsmPointToPointDefault30(): string | null {
  // The default plan.
  const r = allocateVlsm("203.0.113.0/24", [{ label: "Office", hosts: 100 }, { label: "Guest", hosts: 25 }, { label: "Mgmt", hosts: 10 }, { label: "L1", hosts: 2 }, { label: "L2", hosts: 2 }]);
  // The two /30s and the two free blocks the e6 worked example computed (203.0.113.184/29 and 203.0.113.192/26).
  return (
    expect(r.subnets[3].network === "203.0.113.176" && r.subnets[3].prefix === 30 && !r.subnets[3].pointToPoint31, "L1 != 203.0.113.176/30") ?? // first link
    expect(r.subnets[4].network === "203.0.113.180" && r.subnets[4].prefix === 30, "L2 != 203.0.113.180/30") ?? // second link
    expect(r.freeBlocks.map((b) => b.cidr).join(",") === "203.0.113.184/29,203.0.113.192/26" && r.freeAddresses === 72, `free=${r.freeBlocks.map((b) => b.cidr).join(",")}`) // the free blocks
  ); // end of the checks
}

/** With the option on, a /31 must not precede a 1-host /30 (that would leave a 2-address hole). */
function vlsmPointToPointOrder(): string | null {
  // A 2-host link entered before a 1-host segment, in a /29.
  const r = allocateVlsm("192.0.2.0/29", [{ label: "P", hosts: 2 }, { label: "H", hosts: 1 }], { pointToPoint31: true });
  // The /30 is placed first at .0, the /31 at .4, and the one free block is .6/31.
  return (
    expect(r.subnets.map((x) => `${x.label}=${x.network}/${x.prefix}`).join(",") === "H=192.0.2.0/30,P=192.0.2.4/31", `plan=${r.subnets.map((x) => `${x.label}=${x.network}/${x.prefix}`).join(",")}`) ?? // the order
    expect(r.freeBlocks.length === 1 && r.freeBlocks[0].cidr === "192.0.2.6/31", "free != 192.0.2.6/31") // the free block
  ); // end of the checks
}

/** A 0-host request is refused with the zeroHosts code (it used to get a /31 shown as 2 usable). */
function vlsmZeroHostsRejected(): string | null {
  // The refusal is a thrown CidrInputError, so the vector catches it.
  try {
    allocateVlsm("10.0.0.0/24", [{ label: "A", hosts: 10 }, { label: "Z", hosts: 0 }]); // a plan with one 0-host row
    return "a 0-host request was accepted"; // reaching here is the failure
  } catch (e) {
    // The code is the contract the UI maps to its message.
    return expect(e instanceof CidrInputError && e.code === "zeroHosts", `wrong error: ${(e as Error).message}`);
  } // end of the refusal check
}

/** A parent typed with host bits set is masked AND says so (parentMasked), no longer silently. */
function vlsmMaskedParent(): string | null {
  // 192.0.2.77/24 is not a network address; the plan is carved from 192.0.2.0/24.
  const r = allocateVlsm("192.0.2.77/24", [{ label: "X", hosts: 10 }]);
  // The flag, the typed text and the normalized parent; the /28 lands at the start of the masked parent.
  return (
    expect(r.parentMasked === true && r.parentInput === "192.0.2.77/24" && r.parent === "192.0.2.0/24", `parent=${r.parent} masked=${r.parentMasked}`) ?? // the flag
    expect(r.subnets[0].network === "192.0.2.0" && r.subnets[0].prefix === 28, "X != 192.0.2.0/28") // the placement
  ); // end of the checks
}

/** Requests are placed largest first whatever the entry order, and a request larger than IPv4 does not fit. */
function vlsmLargestFirstAndTooBig(): string | null {
  // Entered smallest first; and a 5,000,000,000-host request inside 0.0.0.0/0, which a /0 cannot hold.
  const r = allocateVlsm("10.0.0.0/24", [{ label: "s", hosts: 2 }, { label: "m", hosts: 25 }, { label: "l", hosts: 100 }]);
  const huge = allocateVlsm("0.0.0.0/0", [{ label: "huge", hosts: 5000000000 }]);
  // The placement order is l, m, s; the huge request is unfit and the whole /0 stays free as one block.
  return (
    expect(r.subnets.map((x) => x.label).join(",") === "l,m,s", `order=${r.subnets.map((x) => x.label).join(",")}`) ?? // largest first
    expect(huge.subnets.length === 0 && huge.unallocated.length === 1, "a 5e9-host request was allocated") ?? // the old /0 bug
    expect(huge.freeBlocks.length === 1 && huge.freeBlocks[0].cidr === "0.0.0.0/0", "free != 0.0.0.0/0") // the free block
  ); // end of the checks
}

// --- Special-purpose classification (2026-10-19) ----------------------------

/** Check one classification against its status, address counts and first matches (block:relation:name). */
function cls(input: string, status: SpecialPurposeClassification["status"], special: number, total: number, count: number, first: string[]): string | null {
  const c = classifySpecialPurpose(input); // the classification
  const got = c.matches.slice(0, first.length).map((m) => `${m.block}:${m.relation}:${m.name}`); // the leading matches
  // Every pinned field, with the observed value in the failure text.
  return (
    expect(c.status === status, `${input}: status=${c.status} want ${status}`) ?? // the verdict
    expect(c.specialAddresses === special && c.totalAddresses === total, `${input}: special/total=${c.specialAddresses}/${c.totalAddresses} want ${special}/${total}`) ?? // the counts
    expect(c.matches.length === count, `${input}: matches=${c.matches.length} want ${count}`) ?? // how many rows
    expect(got.join(" | ") === first.join(" | "), `${input}: matches=${got.join(" | ")}`) // which rows
  ); // end of the checks
}

/** The flags of the first match, as S/D/F/G letters (T, F or - for not listed). */
function flagsOf(input: string): string {
  const m = classifySpecialPurpose(input).matches[0]; // the most specific row
  const l = (v: boolean | null) => (v === null ? "-" : v ? "T" : "F"); // one letter per flag
  return m ? [m.source, m.destination, m.forwardable, m.globallyReachable].map(l).join("") : "none"; // Source, Destination, Forwardable, Globally Reachable
}

/** RFC 1918: the three Private-Use blocks, flags True/True/True/False. */
function clsPrivate(): string | null {
  // Equal to the 24-bit block, inside the 20-bit and 16-bit blocks (the tool's Example is 192.168.1.0/24).
  return (
    cls("10.0.0.0/8", "special", 16777216, 16777216, 1, ["10.0.0.0/8:equal:Private-Use"]) ?? // 10/8
    cls("172.20.1.0/24", "special", 256, 256, 1, ["172.16.0.0/12:inside:Private-Use"]) ?? // inside 172.16/12
    cls("192.168.1.0/24", "special", 256, 256, 1, ["192.168.0.0/16:inside:Private-Use"]) ?? // inside 192.168/16
    expect(flagsOf("10.0.0.0/8") === "TTTF", `10/8 flags=${flagsOf("10.0.0.0/8")}`) // the registry's flags
  ); // end of the checks
}

/** RFC 6598 shared address space, and its two neighbours, which are not special-purpose. */
function clsShared(): string | null {
  // 100.64.0.0/10 is the row; 100.63.255.255 and 100.128.0.0/10 sit just outside it.
  return (
    cls("100.64.0.0/10", "special", 4194304, 4194304, 1, ["100.64.0.0/10:equal:Shared Address Space"]) ?? // the row
    cls("100.63.255.255/32", "none", 0, 1, 0, []) ?? // one below
    cls("100.128.0.0/10", "none", 0, 4194304, 0, []) // one above
  ); // end of the checks
}

/** Loopback (footnote 1, every flag False) and link local (forwardable False). */
function clsLoopbackLinkLocal(): string | null {
  // 127.0.0.1 and a /24 of 169.254/16.
  const lo = classifySpecialPurpose("127.0.0.1/32").matches[0]; // the loopback row
  return (
    cls("127.0.0.1/32", "special", 1, 1, 1, ["127.0.0.0/8:inside:Loopback"]) ?? // inside loopback
    expect(lo.footnote === "1" && flagsOf("127.0.0.1/32") === "FFFF" && lo.reservedByProtocol === true, "loopback flags/footnote wrong") ?? // "False [1]"
    cls("169.254.1.0/24", "special", 256, 256, 1, ["169.254.0.0/16:inside:Link Local"]) ?? // inside link local
    expect(flagsOf("169.254.1.0/24") === "TTFF", `link-local flags=${flagsOf("169.254.1.0/24")}`) // not forwardable
  ); // end of the checks
}

/** RFC 5737 documentation blocks and RFC 2544 benchmarking. */
function clsDocumentationBenchmarking(): string | null {
  // One equal, one inside, one half of a block; then benchmarking.
  return (
    cls("192.0.2.0/24", "special", 256, 256, 1, ["192.0.2.0/24:equal:Documentation (TEST-NET-1)"]) ?? // TEST-NET-1
    cls("198.51.100.7/32", "special", 1, 1, 1, ["198.51.100.0/24:inside:Documentation (TEST-NET-2)"]) ?? // TEST-NET-2
    cls("203.0.113.0/25", "special", 128, 128, 1, ["203.0.113.0/24:inside:Documentation (TEST-NET-3)"]) ?? // TEST-NET-3
    expect(flagsOf("192.0.2.0/24") === "FFFF", `documentation flags=${flagsOf("192.0.2.0/24")}`) ?? // all False
    cls("198.19.0.0/16", "special", 65536, 65536, 1, ["198.18.0.0/15:inside:Benchmarking"]) // benchmarking
  ); // end of the checks
}

/** 192.0.0.0/24 and its sub-entries: the most specific row first; the /24 itself carries footnote 2. */
function clsIetfProtocolAssignments(): string | null {
  // 192.0.0.9 is PCP anycast (globally reachable) inside the /24; the /24 holds six more specific rows.
  const pcp = classifySpecialPurpose("192.0.0.9/32").matches[0]; // the PCP row
  const whole = classifySpecialPurpose("192.0.0.0/24").matches[0]; // the /24 row
  return (
    cls("192.0.0.9/32", "special", 1, 1, 2, ["192.0.0.9/32:equal:Port Control Protocol Anycast", "192.0.0.0/24:inside:IETF Protocol Assignments"]) ?? // nested
    expect(pcp.globallyReachable === true, "PCP anycast should be globally reachable") ?? // the registry's True
    cls("192.0.0.0/24", "special", 256, 256, 7, ["192.0.0.0/24:equal:IETF Protocol Assignments", "192.0.0.0/29:contains:IPv4 Service Continuity Prefix"]) ?? // the /24
    expect(whole.footnote === "2", "192.0.0.0/24 should carry footnote 2") // "Not useable unless by virtue of a more specific reservation"
  ); // end of the checks
}

/** "This network", "this host", class E (Reserved) and the limited broadcast. */
function clsZeroReservedBroadcast(): string | null {
  // 0.0.0.0/32 sits in two rows; 255.255.255.255/32 too; 240.0.0.0/4 holds the broadcast row.
  return (
    cls("0.0.0.0/8", "special", 16777216, 16777216, 2, ["0.0.0.0/8:equal:\"This network\"", "0.0.0.0/32:contains:\"This host on this network\""]) ?? // 0/8
    cls("0.0.0.0/32", "special", 1, 1, 2, ["0.0.0.0/32:equal:\"This host on this network\"", "0.0.0.0/8:inside:\"This network\""]) ?? // 0.0.0.0
    cls("240.0.0.0/4", "special", 268435456, 268435456, 2, ["240.0.0.0/4:equal:Reserved", "255.255.255.255/32:contains:Limited Broadcast"]) ?? // class E
    cls("255.255.255.255/32", "special", 1, 1, 2, ["255.255.255.255/32:equal:Limited Broadcast", "240.0.0.0/4:inside:Reserved"]) ?? // limited broadcast
    expect(flagsOf("255.255.255.255/32") === "FTFF", `broadcast flags=${flagsOf("255.255.255.255/32")}`) // destination only
  ); // end of the checks
}

/** Multicast comes from the multicast registry, with no flags (the registry has no such columns). */
function clsMulticast(): string | null {
  // 224.0.0.0/24, the Local Network Control Block, inside 224.0.0.0/4.
  const m = classifySpecialPurpose("224.0.0.0/24").matches[0]; // the multicast row
  return (
    cls("224.0.0.0/24", "special", 256, 256, 1, ["224.0.0.0/4:inside:Multicast"]) ?? // inside multicast
    expect(m.registry === "ipv4-multicast" && flagsOf("224.0.0.0/24") === "----", "multicast row should have no flags") // not listed
  ); // end of the checks
}

/** The deprecated 6to4 relay row: a termination date, blank flags, and the live 6a44 row inside it. */
function clsDeprecated6to4(): string | null {
  // 192.88.99.0/24 equal the deprecated row and contains 192.88.99.2/32.
  const d = classifySpecialPurpose("192.88.99.0/24").matches[0]; // the deprecated row
  return (
    cls("192.88.99.0/24", "special", 256, 256, 2, ["192.88.99.0/24:equal:Deprecated (6to4 Relay Anycast)", "192.88.99.2/32:contains:6a44-relay anycast address"]) ?? // the two rows
    expect(d.terminated === "2015-03" && flagsOf("192.88.99.0/24") === "----", "deprecated row should be terminated 2015-03 with blank flags") // the registry's blanks
  ); // end of the checks
}

/** Ordinary unicast space: no special-purpose range (and the edges of 172.16.0.0/12). */
function clsNone(): string | null {
  // 8.8.8.0/24, and the /24s just below and above 172.16.0.0/12.
  return (
    cls("8.8.8.0/24", "none", 0, 256, 0, []) ?? // ordinary space
    cls("172.15.255.0/24", "none", 0, 256, 0, []) ?? // one /24 below 172.16/12
    cls("172.32.0.0/24", "none", 0, 256, 0, []) // one /24 above it
  ); // end of the checks
}

/** Partial overlaps: a block that holds a special range and more says how much of it is special. */
function clsPartial(): string | null {
  // 10.0.0.0/7 is half RFC 1918; 192.168.0.0/15 likewise; 192.0.0.0/23 holds the /24 and its six sub-rows, counted once.
  return (
    cls("10.0.0.0/7", "partial", 16777216, 33554432, 1, ["10.0.0.0/8:contains:Private-Use"]) ?? // half private
    cls("192.168.0.0/15", "partial", 65536, 131072, 1, ["192.168.0.0/16:contains:Private-Use"]) ?? // half private
    cls("192.0.0.0/23", "partial", 256, 512, 7, ["192.0.0.0/24:contains:IETF Protocol Assignments"]) ?? // nested rows counted once
    cls("0.0.0.0/0", "partial", 592709632, 4294967296, 27, ["0.0.0.0/8:contains:\"This network\""]) // every row, union 592,709,632
  ); // end of the checks
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
  // Added 2026-10-19 (set cidr-subnetting-golden-2026-10-19): the VLSM fixes.
  { name: "vlsm:free blocks of the classic plan", run: vlsmFreeBlocks },
  { name: "vlsm:/31 option for 2-host links (RFC 3021)", run: vlsmPointToPoint31 },
  { name: "vlsm:/31 option off keeps /30 (default)", run: vlsmPointToPointDefault30 },
  { name: "vlsm:/31 never precedes a 1-host /30", run: vlsmPointToPointOrder },
  { name: "vlsm:0-host request rejected", run: vlsmZeroHostsRejected },
  { name: "vlsm:parent with host bits is masked and flagged", run: vlsmMaskedParent },
  { name: "vlsm:largest first, and a request larger than IPv4 does not fit", run: vlsmLargestFirstAndTooBig },
  // Added 2026-10-19: the special-purpose classification, one vector per class and the partial overlaps.
  { name: "classify:private-use (RFC 1918)", run: clsPrivate },
  { name: "classify:shared address space (RFC 6598)", run: clsShared },
  { name: "classify:loopback and link local", run: clsLoopbackLinkLocal },
  { name: "classify:documentation (RFC 5737) and benchmarking", run: clsDocumentationBenchmarking },
  { name: "classify:192.0.0.0/24 and its sub-entries", run: clsIetfProtocolAssignments },
  { name: "classify:this network, this host, reserved, limited broadcast", run: clsZeroReservedBroadcast },
  { name: "classify:multicast 224.0.0.0/4", run: clsMulticast },
  { name: "classify:deprecated 6to4 relay row", run: clsDeprecated6to4 },
  { name: "classify:no special-purpose range", run: clsNone },
  { name: "classify:partial overlaps", run: clsPartial },
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
