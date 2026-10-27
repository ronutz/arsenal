// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dnssec-chain/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the DNSSEC chain lab (set 2026-10-26a). Every fault at
// every place the lab allows is worked by hand from RFC 4033 section 5,
// RFC 4035 sections 4.3, 5, 5.2, 5.3.1, 5.3.3 and 5.5, and RFC 6840 sections
// 4.4, 5.2 and 5.4 (read 2026-10-26), and pins: the state, what the client
// receives, the deciding link and rule, and each link as a short string
// (status, rule, the DS as key tag/algorithm/digest-of, the keys, the RRSIG).
// The reject vectors pin the stable error codes, including a fault at a place
// it cannot apply to. verifyVectors() runs them all; scripts/run-golden-vectors
// runs it at prebuild and fails on any drift.
// ============================================================================

import { compute, DEFAULT_INPUT, DnssecError, EXAMPLE_INPUT, type DnssecErrorCode, type DnssecInput, type DnssecResult, type LinkResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "dnssec-chain/2026-10-26a";

/** The scalar fields a case can pin. */
type Scalars = Omit<DnssecResult, "links">;

/** A case the model must answer exactly so. */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: DnssecInput;
  /** The scalar fields that must match. */
  expect: Partial<Scalars>;
  /** The four links as linkOf() writes them, joined with " | ". */
  links: string;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: DnssecInput;
  /** The code the refusal must carry. */
  code: DnssecErrorCode;
}

/** One link as a short stable string. */
function linkOf(l: LinkResult): string {
  // The DS as tag/algorithm/digest-of, or the word none.
  const ds = l.ds ? `${l.ds.tag}/${l.ds.alg}/${l.ds.digestOf}` : "none";
  // The keys as tag/algorithm.
  const keys = l.keys.map((k) => `${k.tag}/${k.alg}`).join(",");
  // Everything in a fixed order.
  return `${l.link} ${l.status} ${l.rule} ds=${ds} by=${l.dsSigner ?? "none"} keys=${keys} rrsig=${l.rrsig ?? "none"} signer=${l.signer}`;
}

/** Every link of a result as one string. */
function linksOf(r: DnssecResult): string {
  // Top down.
  return r.links.map(linkOf).join(" | ");
}

/** The root link when it holds. */
const ROOT_OK = "root holds anchor-ok ds=38696/8/38696 by=none keys=38696/8,21831/8 rrsig=valid signer=38696";
/** The TLD link when it holds. */
const TLD_OK = "tld holds ds-ok ds=17883/8/17883 by=21831 keys=17883/8,40245/8 rrsig=valid signer=17883";
/** The zone link when it holds. */
const ZONE_OK = "zone holds ds-ok ds=31589/13/31589 by=40245 keys=31589/13,52012/13 rrsig=valid signer=31589";

/** The accept cases. */
export const DNSSEC_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Nothing broken: Secure, with AD.
  {
    id: "secure",
    input: { fault: "none", place: "root" },
    expect: { verdict: "secure", client: "answer-ad", decidedAt: "answer", rule: "answer-ok" },
    links: `${ROOT_OK} | ${TLD_OK} | ${ZONE_OK} | answer holds answer-ok ds=none by=none keys=31589/13,52012/13 rrsig=valid signer=52012`,
  },
  // The Example: no DS for example.org. in org., proved by a signed NSEC: Insecure, the answer without AD.
  {
    id: "example-no-ds-zone",
    input: { fault: "no-ds", place: "zone" },
    expect: { verdict: "insecure", client: "answer-no-ad", decidedAt: "zone", rule: "no-ds" },
    links: `${ROOT_OK} | ${TLD_OK} | zone insecure no-ds ds=none by=40245 keys=31589/13,52012/13 rrsig=valid signer=40245 | answer not-checked below-insecure ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // No DS for org. in the root: everything below is Insecure.
  {
    id: "no-ds-tld",
    input: { fault: "no-ds", place: "tld" },
    expect: { verdict: "insecure", client: "answer-no-ad", decidedAt: "tld", rule: "no-ds" },
    links: `${ROOT_OK} | tld insecure no-ds ds=none by=21831 keys=17883/8,40245/8 rrsig=valid signer=21831 | zone not-checked below-insecure ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked below-insecure ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // After a KSK roll in example.org., org.'s DS still names 31589; the set holds 47005: Bogus, SERVFAIL.
  {
    id: "ds-mismatch-zone",
    input: { fault: "ds-mismatch", place: "zone" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "zone", rule: "ds-mismatch" },
    links: `${ROOT_OK} | ${TLD_OK} | zone bogus ds-mismatch ds=31589/13/31589 by=40245 keys=47005/13,52012/13 rrsig=none signer=47005 | answer not-checked above-failed ds=none by=none keys=47005/13,52012/13 rrsig=none signer=52012`,
  },
  // The same in org.: the root's DS names 17883, org.'s set holds 60485.
  {
    id: "ds-mismatch-tld",
    input: { fault: "ds-mismatch", place: "tld" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "tld", rule: "ds-mismatch" },
    links: `${ROOT_OK} | tld bogus ds-mismatch ds=17883/8/17883 by=21831 keys=60485/8,40245/8 rrsig=none signer=60485 | zone not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // example.org. signed with algorithm 12, which the validator does not implement: treated as unsigned, Insecure.
  {
    id: "unsupported-alg-zone",
    input: { fault: "unsupported-alg", place: "zone" },
    expect: { verdict: "insecure", client: "answer-no-ad", decidedAt: "zone", rule: "unsupported-alg" },
    links: `${ROOT_OK} | ${TLD_OK} | zone insecure unsupported-alg ds=31589/12/31589 by=40245 keys=31589/12,52012/12 rrsig=none signer=31589 | answer not-checked below-insecure ds=none by=none keys=31589/12,52012/12 rrsig=none signer=52012`,
  },
  // org. signed with algorithm 12: Insecure from org. down.
  {
    id: "unsupported-alg-tld",
    input: { fault: "unsupported-alg", place: "tld" },
    expect: { verdict: "insecure", client: "answer-no-ad", decidedAt: "tld", rule: "unsupported-alg" },
    links: `${ROOT_OK} | tld insecure unsupported-alg ds=17883/12/17883 by=21831 keys=17883/12,40245/12 rrsig=none signer=17883 | zone not-checked below-insecure ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked below-insecure ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // The RRSIG over the root's DNSKEY RRset has expired: the anchor cannot authenticate the root's keys.
  {
    id: "rrsig-expired-root",
    input: { fault: "rrsig-expired", place: "root" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "root", rule: "dnskey-rrsig-expired" },
    links: "root bogus dnskey-rrsig-expired ds=38696/8/38696 by=none keys=38696/8,21831/8 rrsig=expired signer=38696 | tld not-checked above-failed ds=none by=none keys=17883/8,40245/8 rrsig=none signer=17883 | zone not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012",
  },
  // No RRSIG over the root's DNSKEY RRset (RFC 4035 section 5, second step).
  {
    id: "rrsig-missing-root",
    input: { fault: "rrsig-missing", place: "root" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "root", rule: "dnskey-rrsig-missing" },
    links: "root bogus dnskey-rrsig-missing ds=38696/8/38696 by=none keys=38696/8,21831/8 rrsig=missing signer=38696 | tld not-checked above-failed ds=none by=none keys=17883/8,40245/8 rrsig=none signer=17883 | zone not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012",
  },
  // org.'s DNSKEY RRset: the DS matches, its RRSIG has expired.
  {
    id: "rrsig-expired-tld",
    input: { fault: "rrsig-expired", place: "tld" },
    expect: { verdict: "bogus", decidedAt: "tld", rule: "dnskey-rrsig-expired" },
    links: `${ROOT_OK} | tld bogus dnskey-rrsig-expired ds=17883/8/17883 by=21831 keys=17883/8,40245/8 rrsig=expired signer=17883 | zone not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // org.'s DNSKEY RRset carries no RRSIG by the matched key (RFC 4035 5.2, third condition).
  {
    id: "rrsig-missing-tld",
    input: { fault: "rrsig-missing", place: "tld" },
    expect: { verdict: "bogus", decidedAt: "tld", rule: "dnskey-rrsig-missing" },
    links: `${ROOT_OK} | tld bogus dnskey-rrsig-missing ds=17883/8/17883 by=21831 keys=17883/8,40245/8 rrsig=missing signer=17883 | zone not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // example.org.'s DNSKEY RRset: the DS matches, its RRSIG has expired.
  {
    id: "rrsig-expired-zone",
    input: { fault: "rrsig-expired", place: "zone" },
    expect: { verdict: "bogus", decidedAt: "zone", rule: "dnskey-rrsig-expired" },
    links: `${ROOT_OK} | ${TLD_OK} | zone bogus dnskey-rrsig-expired ds=31589/13/31589 by=40245 keys=31589/13,52012/13 rrsig=expired signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // example.org.'s DNSKEY RRset with no RRSIG by the matched key.
  {
    id: "rrsig-missing-zone",
    input: { fault: "rrsig-missing", place: "zone" },
    expect: { verdict: "bogus", decidedAt: "zone", rule: "dnskey-rrsig-missing" },
    links: `${ROOT_OK} | ${TLD_OK} | zone bogus dnskey-rrsig-missing ds=31589/13/31589 by=40245 keys=31589/13,52012/13 rrsig=missing signer=31589 | answer not-checked above-failed ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012`,
  },
  // The answer's RRSIG has expired: the chain holds to the last link, and the answer is Bogus.
  {
    id: "rrsig-expired-answer",
    input: { fault: "rrsig-expired", place: "answer" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "answer", rule: "answer-rrsig-expired" },
    links: `${ROOT_OK} | ${TLD_OK} | ${ZONE_OK} | answer bogus answer-rrsig-expired ds=none by=none keys=31589/13,52012/13 rrsig=expired signer=52012`,
  },
  // The answer arrives without an RRSIG from a zone the chain says is signed: Bogus.
  {
    id: "rrsig-missing-answer",
    input: { fault: "rrsig-missing", place: "answer" },
    expect: { verdict: "bogus", client: "servfail", decidedAt: "answer", rule: "answer-rrsig-missing" },
    links: `${ROOT_OK} | ${TLD_OK} | ${ZONE_OK} | answer bogus answer-rrsig-missing ds=none by=none keys=31589/13,52012/13 rrsig=missing signer=52012`,
  },
  // No trust anchor: Indeterminate, the answer without AD, nothing checked.
  {
    id: "no-anchor",
    input: { fault: "no-anchor", place: "root" },
    expect: { verdict: "indeterminate", client: "answer-no-ad", decidedAt: "root", rule: "anchor-none" },
    links: "root indeterminate anchor-none ds=none by=none keys=38696/8,21831/8 rrsig=none signer=38696 | tld not-checked below-indeterminate ds=none by=none keys=17883/8,40245/8 rrsig=none signer=17883 | zone not-checked below-indeterminate ds=none by=none keys=31589/13,52012/13 rrsig=none signer=31589 | answer not-checked below-indeterminate ds=none by=none keys=31589/13,52012/13 rrsig=none signer=52012",
  },
]);

/** The reject cases. */
export const DNSSEC_REJECTS: readonly RejectVector[] = Object.freeze([
  // A fault the control cannot produce.
  { id: "bad-fault", input: { fault: "nsec3-opt-out" as unknown as "none", place: "root" }, code: "bad-fault" },
  // A place the control cannot produce.
  { id: "bad-place", input: { fault: "none", place: "glue" as unknown as "root" }, code: "bad-place" },
  // A DS fault at the root: the root has a trust anchor, not a DS.
  { id: "ds-at-root", input: { fault: "ds-mismatch", place: "root" }, code: "bad-place" },
  // A delegation fault at the answer: there is no delegation there.
  { id: "no-ds-at-answer", input: { fault: "no-ds", place: "answer" }, code: "bad-place" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // The opening state and the Example must be vectors too.
  if (!DNSSEC_VECTORS.some((v) => v.input.fault === DEFAULT_INPUT.fault && v.input.place === DEFAULT_INPUT.place)) failures.push("DEFAULT_INPUT has no vector");
  // The Example.
  if (!DNSSEC_VECTORS.some((v) => v.id.startsWith("example-") && v.input.fault === EXAMPLE_INPUT.fault && v.input.place === EXAMPLE_INPUT.place)) failures.push("EXAMPLE_INPUT differs from the example vector");
  // Each accept case: compute, compare every expected field, then the links.
  for (const v of DNSSEC_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected scalar in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof Scalars];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
    // The links.
    const l = linksOf(got);
    // A difference is a failure showing both.
    if (l !== v.links) failures.push(`${v.id}: links are "${l}", expected "${v.links}"`);
  }
  // Each reject case: it must throw with the right code.
  for (const r of DNSSEC_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof DnssecError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads (the two state checks count too).
  const total = DNSSEC_VECTORS.length + DNSSEC_REJECTS.length + 2;
  // Passed is everything that did not fail (a case can fail on several fields, so floor at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
