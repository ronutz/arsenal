// ============================================================================
// src/lib/tools/rpki-origin-validation/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the route origin validation calculator.
//
// Every vector names the document (and section) whose definition fixes its
// expected output, or says it is computed and from which rule. Addresses and
// AS numbers are documentation values only: IPv4 192.0.2.0/24, 198.51.100.0/24
// and 203.0.113.0/24 (RFC 5737 section 3), IPv6 2001:db8::/32 (RFC 3849), AS
// 64496 to 64511 and 65536 to 65551 (RFC 5398 section 4). All documents were
// read on 2026-10-19 from www.rfc-editor.org.
//
// The groups:
//   * RFC 6811 section 2: the three states and the four ways a Route meets a
//     VRP (Match, another AS, too long for maxLength, not covered), plus the
//     NONE origin; the VRP 192.0.2.0/24, maxLength 24, AS 64496 is the one the
//     Learn article bgp-and-the-routing-chokepoint tabulates.
//   * RFC 6483 section 4 with RFC 6811 section 2: AS 0 VRPs.
//   * RFC 9582 section 4.3.2.2: the maxLength example (203.0.113.0/24, 26) and
//     Appendix A's IPv6 ROA (AS 65536, 2001:db8::/32), with RFC 5396 asdot.
//   * RFC 8416 sections 3.2 and 3.4.1: SLURM prefixAssertions, Figures 5 and 7.
//   * RFC 9319 section 5: the maxLength note and its computed prefix count.
// Reject vectors pin stable error codes, each tied to the rule it enforces.
// verifyVectors() runs the whole set and throws on the first drift.
// ============================================================================

import { run, RovError, type RovErrorCode, type RovInput } from "./compute";

/** The set id; bump it (and scripts/api-sync.json after re-checking the docs) when an expectation changes. */
export const GOLDEN_VECTOR_SET_ID = "rpki-origin-validation/2026-10-19a"; // first set, 2026-10-19

/** One accept vector: an input and the fields its result must carry. */
interface AcceptVector {
  /** Stable id, cited by the docs and the API examples. */
  id: string;
  /** The document and section that fix the expected output, or "computed: <rule>". */
  source: string;
  /** The engine input. */
  input: RovInput;
  /** Partial expectations, compared field by field. */
  expect: {
    /** The RFC 6811 state. */
    state: "Valid" | "Invalid" | "NotFound";
    /** Each VRP's relation, in order. */
    relations?: string[];
    /** How many VRPs Cover. */
    covering?: number;
    /** How many VRPs Match. */
    matching?: number;
    /** The notes, in the engine's fixed order. */
    notes?: string[];
    /** authorisedPrefixes of each maxLength note, in order. */
    authorised?: string[];
    /** The canonical Route prefix. */
    routePrefix?: string;
    /** The origin rendered in asdot. */
    originAsdot?: string;
    /** The canonical prefix of each VRP, in order. */
    vrpPrefixes?: string[];
    /** Dropped duplicates. */
    duplicatesRemoved?: number;
    /** SLURM filters present and not applied. */
    slurmFiltersIgnored?: number;
    /** Where the VRPs came from. */
    vrpFormat?: "text" | "slurm";
  };
}

/** One reject vector: an input the engine must refuse with a given code. */
interface RejectVector {
  /** Stable id. */
  id: string;
  /** The rule the refusal enforces. */
  source: string;
  /** The engine input. */
  input: RovInput;
  /** The expected error code. */
  code: RovErrorCode;
}

/** The single VRP RFC 6811's cases are worked against (also in the Learn article's table). */
const ONE_VRP = "192.0.2.0/24 24 AS64496"; // prefix, maxLength, AS

/** RFC 9582 section 4.3.2.2's maxLength example, with a documentation AS. */
const RFC9582_RANGE = "203.0.113.0/24 26 AS64496"; // /24 up to /26

/** RFC 8416 Figure 5, the prefixAssertions example, verbatim. */
const SLURM_FIG5 = `"prefixAssertions": [
  {
    "asn": 64496,
    "prefix": "198.51.100.0/24",
    "comment": "My other important route"
  },
  {
    "asn": 64496,
    "prefix": "2001:DB8::/32",
    "maxPrefixLength": 48,
    "comment": "My other important de-aggregated routes"
  }
]`; // the member as printed; wrapped in braces below to make a JSON object

/** RFC 8416 Figure 7, the full SLURM file example, verbatim. */
const SLURM_FIG7 = `{
  "slurmVersion": 1,
  "validationOutputFilters": {
    "prefixFilters": [
      {
        "prefix": "192.0.2.0/24",
        "comment": "All VRPs encompassed by prefix"
      },
      {
        "asn": 64496,
        "comment": "All VRPs matching ASN"
      },
      {
        "prefix": "198.51.100.0/24",
        "asn": 64497,
        "comment": "All VRPs encompassed by prefix, matching ASN"
      }
    ],
    "bgpsecFilters": [
      {
        "asn": 64496,
        "comment": "All keys for ASN"
      },
      {
        "SKI": "Zm9v",
        "comment": "Key matching Router SKI"
      },
      {
        "asn": 64497,
        "SKI": "YmFy",
        "comment": "Key for ASN 64497 matching Router SKI"
      }
    ]
  },
  "locallyAddedAssertions": {
    "prefixAssertions": [
      {
        "asn": 64496,
        "prefix": "198.51.100.0/24",
        "comment": "My other important route"
      },
      {
        "asn": 64496,
        "prefix": "2001:DB8::/32",
        "maxPrefixLength": 48,
        "comment": "My other important de-aggregated routes"
      }
    ],
    "bgpsecAssertions": [
      {
        "asn": 64496,
        "comment" : "My known key for my important ASN",
        "SKI": "<some base64 SKI>",
        "routerPublicKey": "<some base64 public key>"
      }
    ]
  }
}`; // RFC 8416 section 3.5

/** The accept vectors. */
export const ROV_GOLDEN_VECTORS: readonly AcceptVector[] = Object.freeze([
  // ---- RFC 6811 section 2: the states ------------------------------------------------------------------------------
  { id: "rfc6811-valid", source: "RFC 6811 s2: Covered, length <= maxLength, origin equal: Matched, so Valid", input: { route: "192.0.2.0/24 AS64496", vrps: ONE_VRP }, expect: { state: "Valid", relations: ["match"], covering: 1, matching: 1, notes: [] } }, // the plain Valid
  { id: "rfc6811-invalid-as", source: "RFC 6811 s2: Covered, origin differs: no VRP Matches, so Invalid", input: { route: "192.0.2.0/24 AS64497", vrps: ONE_VRP }, expect: { state: "Invalid", relations: ["wrong-as"], covering: 1, matching: 0 } }, // another AS
  { id: "rfc6811-invalid-length", source: "RFC 6811 s2: Covered, /25 longer than maxLength 24: no VRP Matches, so Invalid", input: { route: "192.0.2.128/25 AS64496", vrps: ONE_VRP }, expect: { state: "Invalid", relations: ["too-specific"], covering: 1, matching: 0 } }, // too specific
  { id: "rfc6811-invalid-both", source: "RFC 6811 s2: Covered, both the length and the origin fail: Invalid", input: { route: "192.0.2.128/25 AS64497", vrps: ONE_VRP }, expect: { state: "Invalid", relations: ["wrong-as-and-too-specific"] } }, // both
  { id: "rfc6811-notfound", source: "RFC 6811 s2: no VRP Covers 198.51.100.0/24, so NotFound", input: { route: "198.51.100.0/24 AS64497", vrps: ONE_VRP }, expect: { state: "NotFound", relations: ["not-covering"], covering: 0, matching: 0 } }, // nothing covers
  { id: "rfc6811-notfound-shorter", source: "RFC 6811 s2: a /25 VRP does not Cover a /24 Route (VRP length must be <= Route length), so NotFound", input: { route: "192.0.2.0/24 AS64496", vrps: "192.0.2.128/25 AS64496" }, expect: { state: "NotFound", relations: ["not-covering"] } }, // the covering direction
  { id: "rfc6811-origin-none", source: "RFC 6811 s2: a Route whose Origin ASN is NONE cannot be Matched; Covered, so Invalid", input: { route: "192.0.2.0/24 NONE", vrps: ONE_VRP }, expect: { state: "Invalid", relations: ["origin-none"], notes: ["origin-none"] } }, // AS_SET at the end of the path
  { id: "rfc6811-one-match-wins", source: "RFC 6811 s2: Valid when at least one VRP Matches, whatever the others say", input: { route: "192.0.2.0/24 AS64497", vrps: "192.0.2.0/24 AS64496\n192.0.2.0/24 AS64497" }, expect: { state: "Valid", relations: ["wrong-as", "match"], covering: 2, matching: 1 } }, // two origins authorised
  { id: "rfc6811-other-family", source: "RFC 6811 s2 with RFC 9582 s4.3.1: an IPv6 VRP never Covers an IPv4 Route, so NotFound", input: { route: "192.0.2.0/24 AS64496", vrps: "2001:db8::/32 AS64496" }, expect: { state: "NotFound", relations: ["other-family"], covering: 0 } }, // families do not mix
  { id: "rfc7115-super-block", source: "RFC 7115 s3: a ROA for a super-block makes sub-allocations announced by other ASes without their own ROAs Invalid; RFC 6811 s2: Covered, another AS and too long", input: { route: "198.51.100.128/25 AS64500", vrps: "198.51.100.0/24 AS64496" }, expect: { state: "Invalid", relations: ["wrong-as-and-too-specific"] } }, // the customer's route under the provider's ROA
  // ---- RFC 6483 section 4 and RFC 6811 section 2: AS 0 ----------------------------------------------------------
  { id: "as0-only", source: "RFC 6811 s2 (no Route can be Matched by a VRP whose ASN is zero) and RFC 6483 s4 (an AS 0 ROA says the prefix should not be routed): Invalid", input: { route: "203.0.113.0/24 AS64496", vrps: "203.0.113.0/24 32 AS0" }, expect: { state: "Invalid", relations: ["as0"], notes: ["as0-only"] } }, // the disavowal
  { id: "as0-no-maxlength", source: "RFC 6483 s4: the same outcome with the maxLength omitted, because Covered ignores maxLength (RFC 6811 s2)", input: { route: "203.0.113.64/26 AS64496", vrps: "203.0.113.0/24 AS0" }, expect: { state: "Invalid", relations: ["as0"], notes: ["as0-only"], authorised: [] } }, // AS 0 without maxLength
  { id: "as0-overridden", source: "RFC 6483 s4: an AS 0 ROA has a lower relative preference; another ROA can make a more specific Valid", input: { route: "203.0.113.128/25 AS64497", vrps: "203.0.113.0/24 32 AS0\n203.0.113.128/25 AS64497" }, expect: { state: "Valid", relations: ["as0", "match"], notes: ["as0-overridden"], authorised: [] } }, // AS 0 plus a real ROA
  // ---- RFC 9582 section 4.3.2.2: maxLength --------------------------------------------------------------------------
  { id: "rfc9582-range-24", source: "RFC 9582 s4.3.2.2: with maxLength 26 the AS may advertise 203.0.113.0/24", input: { route: "203.0.113.0/24 AS64496", vrps: RFC9582_RANGE }, expect: { state: "Valid", relations: ["match"], notes: [], authorised: ["7"] } }, // the prefix itself; 7 = 2^3 - 1 (computed)
  { id: "rfc9582-range-25", source: "RFC 9582 s4.3.2.2: ... or 203.0.113.128/25", input: { route: "203.0.113.128/25 AS64496", vrps: RFC9582_RANGE }, expect: { state: "Valid", relations: ["match"], notes: ["valid-via-maxlength"] } }, // a /25
  { id: "rfc9582-range-26", source: "RFC 9582 s4.3.2.2: ... or 203.0.113.192/26", input: { route: "203.0.113.192/26 AS64496", vrps: RFC9582_RANGE }, expect: { state: "Valid", relations: ["match"], notes: ["valid-via-maxlength"] } }, // a /26
  { id: "rfc9582-range-27", source: "RFC 9582 s4.3.2.2: ... but not 203.0.113.0/27; RFC 6811 s2: Covered, too long, so Invalid", input: { route: "203.0.113.0/27 AS64496", vrps: RFC9582_RANGE }, expect: { state: "Invalid", relations: ["too-specific"] } }, // beyond the range
  { id: "rfc9319-notation", source: "RFC 9319 s3 writes a ROA as (prefix-maxLength, AS 64496); computed: 2^(26 - 24 + 1) - 1 = 7 prefixes authorised (RFC 9582 s4.3.2.2)", input: { route: "203.0.113.64/26 AS64496", vrps: "203.0.113.0/24-26, AS 64496" }, expect: { state: "Valid", relations: ["match"], authorised: ["7"], vrpPrefixes: ["203.0.113.0/24"] } }, // the notation
  // ---- RFC 9582 Appendix A: IPv6, AS 65536, and RFC 5396 asdot ------------------------------------------------
  { id: "rfc9582-appendix-a", source: "RFC 9582 Appendix A: asID 65536, addresses 2001:db8::/32; RFC 6811 s2: Matched, so Valid", input: { route: "2001:db8::/32 AS65536", vrps: "2001:db8::/32 AS65536" }, expect: { state: "Valid", relations: ["match"], originAsdot: "1.0" } }, // asdot of 65536 (RFC 5396 s2, computed)
  { id: "rfc5396-asdot-origin", source: "RFC 5396 s2: asdot 1.0 is 65536; RFC 9582 Appendix A's ROA Matches, so Valid", input: { route: "2001:DB8:0:0::/32 AS1.0", vrps: "2001:db8::/32 AS65536" }, expect: { state: "Valid", routePrefix: "2001:db8::/32", originAsdot: "1.0" } }, // asdot in, RFC 5952 out
  { id: "ipv6-too-specific", source: "RFC 9582 s4.3.2.2: without maxLength only the exact prefix is authorised; RFC 6811 s2: a /48 inside is Covered and too long, so Invalid", input: { route: "2001:db8:1::/48 AS65536", vrps: "2001:db8::/32 AS65536" }, expect: { state: "Invalid", relations: ["too-specific"] } }, // IPv6 length
  { id: "ipv6-wrong-as", source: "RFC 6811 s2: Covered, AS 65537 is not the VRP ASN, so Invalid", input: { route: "2001:db8::/32 AS65537", vrps: "2001:db8::/32 AS65536" }, expect: { state: "Invalid", relations: ["wrong-as"] } }, // IPv6 origin
  // ---- RFC 8416: SLURM prefixAssertions -------------------------------------------------------------------------------
  { id: "rfc8416-fig5-v6", source: "RFC 8416 Figure 5: 2001:DB8::/32 maxPrefixLength 48 for AS 64496; RFC 6811 s2: a /48 inside Matches, so Valid", input: { route: "2001:db8:ffff::/48 AS64496", vrps: `{${SLURM_FIG5}}` }, expect: { state: "Valid", vrpFormat: "slurm", relations: ["other-family", "match"], notes: ["valid-via-maxlength"], vrpPrefixes: ["198.51.100.0/24", "2001:db8::/32"], authorised: ["131071"] } }, // 2^17 - 1 (computed)
  { id: "rfc8416-fig7-filters", source: "RFC 8416 s3.2: Locally Added Assertions MUST NOT be removed by output filtering; Figure 7's 198.51.100.0/24 AS 64496 Matches, so Valid", input: { route: "198.51.100.0/24 AS64496", vrps: SLURM_FIG7 }, expect: { state: "Valid", relations: ["match", "other-family"], notes: ["slurm-filters-not-applied"], slurmFiltersIgnored: 3 } }, // filters reported, not applied
  { id: "rfc8416-fig7-notfound", source: "RFC 8416 Figure 7: no assertion covers 192.0.2.0/24 (a prefixFilter removes VRPs, it adds none); RFC 6811 s2: NotFound", input: { route: "192.0.2.0/24 AS64496", vrps: SLURM_FIG7 }, expect: { state: "NotFound", covering: 0 } }, // a filter is not a ROA
  // ---- Housekeeping ----------------------------------------------------------------------------------------------------------
  { id: "duplicates", source: "RFC 8416 s3.4.1: the VRP set is sent excluding duplicates; computed: two identical lines count once", input: { route: "198.51.100.0/24 AS64496", vrps: "# two identical VRPs\n198.51.100.0/24 24 AS64496\n198.51.100.0/24 AS64496 # same, maxLength implied\n" }, expect: { state: "Valid", relations: ["match"], duplicatesRemoved: 1, notes: ["duplicates-removed"] } }, // dedup
  { id: "as-first-csv", source: "computed: an AS written with its AS prefix may stand first, as in AS64496,198.51.100.0/24,24", input: { route: "198.51.100.0/24 64496", vrps: "AS64496,198.51.100.0/24,24" }, expect: { state: "Valid", relations: ["match"] } }, // field order
]);

/** The reject vectors. */
export const ROV_REJECT_VECTORS: readonly RejectVector[] = Object.freeze([
  { id: "route-host-bits", source: "RFC 6811 s2 reads a Prefix as RFC 4632 does: 192.0.2.1/24 is not a prefix", input: { route: "192.0.2.1/24 AS64496", vrps: ONE_VRP }, code: "host-bits" }, // bits beyond /24
  { id: "route-origin-as0", source: "RFC 7607 s2: a route with AS 0 in the AS_PATH is malformed and MUST NOT be originated or propagated", input: { route: "192.0.2.0/24 AS0", vrps: ONE_VRP }, code: "origin-as0" }, // AS 0 origin
  { id: "route-no-origin", source: "RFC 6811 s2: a Route has a Prefix and an Origin ASN", input: { route: "192.0.2.0/24", vrps: ONE_VRP }, code: "route-format" }, // missing origin
  { id: "route-as-range", source: "RFC 6811 s3: four-octet AS numbers, so at most 4294967295", input: { route: "192.0.2.0/24 AS4294967296", vrps: ONE_VRP }, code: "as-range" }, // beyond 32 bits
  { id: "route-asdot-range", source: "RFC 5396 s2: asdot halves are 16-bit values", input: { route: "192.0.2.0/24 AS1.65536", vrps: ONE_VRP }, code: "as-range" }, // low half too big
  { id: "route-prefix-length", source: "an IPv4 prefix length is at most 32", input: { route: "192.0.2.0/33 AS64496", vrps: ONE_VRP }, code: "prefix-format" }, // /33
  { id: "vrp-maxlength-short", source: "RFC 9582 s4.3.2.2: maxLength MUST be greater than or equal to the prefix length", input: { route: "192.0.2.0/24 AS64496", vrps: "192.0.2.0/24 23 AS64496" }, code: "maxlength-range" }, // 23 < 24
  { id: "vrp-maxlength-long", source: "RFC 9582 s4.3.2.2: maxLength MUST be at most 32 for IPv4", input: { route: "192.0.2.0/24 AS64496", vrps: "192.0.2.0/24 33 AS64496" }, code: "maxlength-range" }, // 33 > 32
  { id: "vrp-no-as", source: "RFC 6811 s2: a VRP carries an origin AS number", input: { route: "192.0.2.0/24 AS64496", vrps: "192.0.2.0/24" }, code: "vrp-format" }, // missing AS
  { id: "vrp-two-as", source: "RFC 6480 s3.2 via RFC 9582 s4.2: one AS per ROA, so one AS per VRP", input: { route: "192.0.2.0/24 AS64496", vrps: "192.0.2.0/24 AS64496 AS64497" }, code: "vrp-format" }, // two ASes
  { id: "vrps-empty", source: "nothing to compare with", input: { route: "192.0.2.0/24 AS64496", vrps: "# only a comment\n" }, code: "vrps-empty" }, // no VRPs
  { id: "slurm-version", source: "RFC 8416 s3.2: slurmVersion MUST be set to 1", input: { route: "192.0.2.0/24 AS64496", vrps: '{"slurmVersion": 2, "locallyAddedAssertions": {"prefixAssertions": [], "bgpsecAssertions": []}}' }, code: "slurm-version" }, // version 2
  { id: "slurm-member", source: "RFC 8416 s3.1: JSON members that are not defined MUST NOT be used (maxLength is not one; maxPrefixLength is)", input: { route: "192.0.2.0/24 AS64496", vrps: '[{"asn": 64496, "prefix": "192.0.2.0/24", "maxLength": 24}]' }, code: "slurm-member" }, // wrong member name
]);

/** Run every vector; throw with a precise message on the first mismatch. */
export function verifyVectors(): { accepted: number; rejected: number } {
  for (const v of ROV_GOLDEN_VECTORS) { // each accept vector
    const r = run(v.input); // the engine's answer
    const flat: Record<string, unknown> = { // the comparable fields
      state: r.state, // the verdict
      relations: r.vrps.map((x) => x.relation), // per-VRP relations
      covering: r.covering, // Covers
      matching: r.matching, // Matches
      notes: r.notes, // notes
      authorised: r.maxLengthNotes.map((n) => n.authorisedPrefixes), // RFC 9319 counts
      routePrefix: r.route.prefix, // canonical Route prefix
      originAsdot: r.route.originAsdot, // asdot origin
      vrpPrefixes: r.vrps.map((x) => x.prefix), // canonical VRP prefixes
      duplicatesRemoved: r.duplicatesRemoved, // dropped duplicates
      slurmFiltersIgnored: r.slurmFiltersIgnored, // filters reported
      vrpFormat: r.vrpFormat, // text or slurm
    }; // flattened
    for (const [k, want] of Object.entries(v.expect)) { // each expectation
      if (JSON.stringify(flat[k]) !== JSON.stringify(want)) { // compared as JSON
        throw new Error(`[${v.id}] ${k}: expected ${JSON.stringify(want)}, got ${JSON.stringify(flat[k])}`); // drift
      } // matched
    } // all fields
  } // accept vectors pass
  for (const v of ROV_REJECT_VECTORS) { // each reject vector
    let threw = false; // did the engine refuse?
    try { run(v.input); } catch (e) { // run it
      threw = true; // it refused
      if (!(e instanceof RovError) || e.code !== v.code) { // the wrong refusal
        throw new Error(`[${v.id}] expected code "${v.code}", got ${e instanceof RovError ? e.code : String(e)}`); // drift
      } // right code
    } // ran
    if (!threw) throw new Error(`[${v.id}] expected rejection "${v.code}", but the input was accepted`); // accepted wrongly
  } // reject vectors pass
  return { accepted: ROV_GOLDEN_VECTORS.length, rejected: ROV_REJECT_VECTORS.length }; // counts
}
