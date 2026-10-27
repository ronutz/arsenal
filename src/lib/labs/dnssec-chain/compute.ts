// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/dnssec-chain/compute.ts
// ----------------------------------------------------------------------------
// THE DNSSEC CHAIN LAB'S MODEL (2026-10-26), the interactive companion of the
// article "DNSSEC end to end: from the root's key to a validated answer". A
// validating resolver asks for www.example.org. A and follows the chain from
// its trust anchor, the root's key, through the root (.), the TLD (org.) and
// the zone (example.org.) to the answer. The reader breaks the chain one way
// at a time, at one place, and the model checks each link in order and says
// which of the four states the answer ends in, what the client receives, and
// the rule that decided. It never computes a signature or a hash: key tags and
// digests are labels that match or do not.
//
// The rules (RFC 4033, 4034 and 4035, March 2005, Proposed Standards, read
// from www.rfc-editor.org on 2026-10-26; RFC 6840, which updates all three
// and which RFC 9364, BCP 237, section 2.1 counts as a core document; RFC 8624
// is obsoleted by RFC 9904, which moved algorithm guidance to the IANA
// registry, read the same day):
//   - Anchor to root: the configured key must be in the root's apex DNSKEY
//     RRset with the Zone Key flag, and some RRSIG over that RRset must verify
//     with it (RFC 4035 section 5).
//   - Each delegation: the DS, authenticated by the parent's keys, must match a
//     child DNSKEY in algorithm, key tag and digest, and that key must have
//     signed the child's apex DNSKEY RRset (RFC 4035 section 5.2).
//   - An RRSIG is usable only while the validator's time is between its
//     Inception and Expiration, and when its signer, algorithm and key tag
//     match a key of the zone's apex DNSKEY RRset (RFC 4035 section 5.3.1);
//     the answer is accepted once its RRSIG verifies (5.3.3). Any one valid
//     RRSIG is enough; an RRset is Bogus only when all fail (RFC 6840 5.4).
//   - No DS, proved by a signed NSEC (with NS, without DS or SOA in its bitmap,
//     RFC 6840 4.4): no authentication path into the child, which is Insecure
//     (RFC 4035 5.2; RFC 4033 section 5).
//   - No supported algorithm among the DS records: treated as if no DS existed,
//     so the child is unsigned (RFC 4035 5.2; RFC 6840 5.2 adds unsupported
//     digest types). The lab's unsupported algorithm is 12 (ECC-GOST), which
//     the IANA DNSSEC algorithm registry ("Last Updated 2026-08-10") marks MUST
//     NOT in all four columns, implementation for validation included.
//   - The four states: Secure, Insecure, Bogus, Indeterminate (RFC 4033 section
//     5; RFC 4035 section 4.3). No trust anchor: Indeterminate. A secure
//     delegation whose data fails to validate (a DS that matches no key, a
//     missing or expired RRSIG): Bogus.
//   - What the client gets: AD on Secure; Insecure and Indeterminate answers
//     without AD, not told apart (RFC 4033 section 5); Bogus as RCODE 2,
//     SERVFAIL, with the full response only when the query set CD (RFC 4035
//     section 5.5).
// What the model leaves out (the lab's scope note): computing any signature or
// digest, negative answers and NSEC/NSEC3 proofs beyond the no-DS proof, a DS
// RRset with several records or several algorithms, more than one RRSIG per
// RRset (a double-signature rollover), wildcards, CNAMEs, TTLs and caching,
// RFC 5011 trust anchor updates, local policy and negative trust anchors, and
// the RRSIG over the DS RRset itself.
//
// Pure and deterministic: the same input gives the same result, nothing is read
// from outside, and an invalid input is refused with a stable code.
// ============================================================================

/** The ways the reader can break the chain (one at a time). */
export type Fault = "none" | "rrsig-expired" | "rrsig-missing" | "ds-mismatch" | "no-ds" | "unsupported-alg" | "no-anchor";
/** Every value the fault control can take. */
export const FAULTS: readonly Fault[] = ["none", "rrsig-expired", "rrsig-missing", "ds-mismatch", "no-ds", "unsupported-alg", "no-anchor"];
/** Where a fault applies: a zone's DNSKEY RRset (or the delegation into it), or the answer. */
export type Place = "root" | "tld" | "zone" | "answer";
/** Every place, top down. */
export const PLACES: readonly Place[] = ["root", "tld", "zone", "answer"];

/** The places each fault can apply to (an empty list: the fault has no place). */
export const PLACES_FOR: Readonly<Record<Fault, readonly Place[]>> = {
  // Nothing broken: no place.
  none: [],
  // An RRSIG over a zone's DNSKEY RRset, or over the answer.
  "rrsig-expired": ["root", "tld", "zone", "answer"],
  // The same places.
  "rrsig-missing": ["root", "tld", "zone", "answer"],
  // A delegation: into the TLD (DS in the root) or into the zone (DS in the TLD).
  "ds-mismatch": ["tld", "zone"],
  // The same delegations.
  "no-ds": ["tld", "zone"],
  // The same delegations.
  "unsupported-alg": ["tld", "zone"],
  // The validator itself: no place.
  "no-anchor": [],
};

/** The reader's settings. */
export interface DnssecInput {
  /** What is broken. */
  fault: Fault;
  /** Where (ignored, and should be "root", for faults without a place). */
  place: Place;
}

/** One DNSKEY in a zone's apex set, as the lab labels it. */
export interface KeyLabel {
  /** The key tag (a label: nothing is computed). */
  tag: number;
  /** The algorithm number. */
  alg: number;
  /** Its role by convention (the validator does not care, RFC 4033 section 2). */
  role: "ksk" | "zsk";
}

/** One of the three zones of the chain. */
export interface ZoneLabels {
  /** The zone's name. */
  name: string;
  /** Its key-signing key (the one the DS or the anchor points at). */
  ksk: KeyLabel;
  /** Its zone-signing key (signs the zone's other RRsets: the child's DS, or the answer). */
  zsk: KeyLabel;
}

/** How one link of the chain ended. */
export type LinkStatus = "holds" | "bogus" | "insecure" | "indeterminate" | "not-checked";
/** What decided a link (and, for the deciding link, the whole answer). */
export type Rule =
  | "anchor-ok"
  | "anchor-none"
  | "dnskey-rrsig-expired"
  | "dnskey-rrsig-missing"
  | "ds-ok"
  | "ds-mismatch"
  | "no-ds"
  | "unsupported-alg"
  | "answer-ok"
  | "answer-rrsig-expired"
  | "answer-rrsig-missing"
  | "below-insecure"
  | "below-indeterminate"
  | "above-failed";

/** One link: what was compared and how it ended. */
export interface LinkResult {
  /** Which link: the anchor into the root, the delegation into the TLD or the zone, or the answer. */
  link: Place;
  /** The DS (or, for the root, the trust anchor) as labelled: key tag, algorithm, and the key whose digest it holds; null for the answer or when absent. */
  ds: { tag: number; alg: number; digestOf: number } | null;
  /** The parent's key whose RRSIG authenticates the DS (or the NSEC proving there is none); null for the anchor and the answer. */
  dsSigner: number | null;
  /** The child's apex DNSKEY RRset as labelled (for the answer: the zone's keys). */
  keys: KeyLabel[];
  /** The RRSIG this link relies on: valid, expired or missing (null when not reached). */
  rrsig: "valid" | "expired" | "missing" | null;
  /** The key the RRSIG is by. */
  signer: number;
  /** How the link ended. */
  status: LinkStatus;
  /** What decided it. */
  rule: Rule;
}

/** The four validation states. */
export type Verdict = "secure" | "insecure" | "bogus" | "indeterminate";
/** What the stub resolver receives. */
export type ClientGets = "answer-ad" | "answer-no-ad" | "servfail";

/** The model's answer. */
export interface DnssecResult {
  /** The state of www.example.org. A. */
  verdict: Verdict;
  /** What the client receives. */
  client: ClientGets;
  /** The link that decided (for Secure: the answer). */
  decidedAt: Place;
  /** The rule that decided. */
  rule: Rule;
  /** Every link, top down. */
  links: LinkResult[];
}

/** The stable codes an invalid input is refused with. */
export type DnssecErrorCode = "bad-fault" | "bad-place";

/** An invalid input, refused with a stable code the interface can word. */
export class DnssecError extends Error {
  /** The stable code. */
  readonly code: DnssecErrorCode;
  /** Build the refusal with its code and an English message for logs. */
  constructor(code: DnssecErrorCode, message: string) {
    // The message, for developers.
    super(message);
    // The code, for the interface.
    this.code = code;
  }
}

/** The root's trust anchor: KSK-2024, as IANA publishes it (key tag 38696, algorithm 8, RSA/SHA-256). */
export const ROOT_ANCHOR = 38696;
/** The algorithm the lab's validator does not implement: 12, ECC-GOST (IANA: MUST NOT implement for validation). */
export const UNSUPPORTED_ALG = 12;
/** The zone's new KSK after the roll, in the DS-mismatch case (an invented label). */
export const ROLLED_KSK = 47005;
/** The queried name and type. */
export const QNAME = "www.example.org.";

/** The zones as labelled: the root's KSK is the real anchor; every other key tag is an invented label. */
export function zoneLabels(input: DnssecInput): Record<"root" | "tld" | "zone", ZoneLabels> {
  // The TLD's algorithm: 12 when its delegation is the unsupported one.
  const tldAlg = input.fault === "unsupported-alg" && input.place === "tld" ? UNSUPPORTED_ALG : 8;
  // The zone's algorithm: 12 when its delegation is the unsupported one, else 13.
  const zoneAlg = input.fault === "unsupported-alg" && input.place === "zone" ? UNSUPPORTED_ALG : 13;
  // After a KSK roll in the zone, its set holds the new key, not the one the parent's DS names.
  const zoneKsk = input.fault === "ds-mismatch" && input.place === "zone" ? ROLLED_KSK : 31589;
  // After a KSK roll in the TLD, the same.
  const tldKsk = input.fault === "ds-mismatch" && input.place === "tld" ? 60485 : 17883;
  // The three zones.
  return {
    root: { name: ".", ksk: { tag: ROOT_ANCHOR, alg: 8, role: "ksk" }, zsk: { tag: 21831, alg: 8, role: "zsk" } },
    tld: { name: "org.", ksk: { tag: tldKsk, alg: tldAlg, role: "ksk" }, zsk: { tag: 40245, alg: tldAlg, role: "zsk" } },
    zone: { name: "example.org.", ksk: { tag: zoneKsk, alg: zoneAlg, role: "ksk" }, zsk: { tag: 52012, alg: zoneAlg, role: "zsk" } },
  };
}

/** Why a link below a decision is not checked: below Insecure, below Indeterminate, or below a failure. */
function belowRule(v: Verdict): Rule {
  // One rule per state that stops the walk.
  return v === "insecure" ? "below-insecure" : v === "indeterminate" ? "below-indeterminate" : "above-failed";
}

/** Follow the chain for the reader's settings. */
export function compute(input: DnssecInput): DnssecResult {
  // The fault must be one the lab offers.
  if (!FAULTS.includes(input.fault)) throw new DnssecError("bad-fault", `not a lab fault: ${String(input.fault)}`);
  // The place must be one of the four.
  if (!PLACES.includes(input.place)) throw new DnssecError("bad-place", `not a lab place: ${String(input.place)}`);
  // And, for a fault that has places, one of its own.
  const allowed = PLACES_FOR[input.fault];
  // A DS fault at the root or at the answer has no meaning: refused.
  if (allowed.length > 0 && !allowed.includes(input.place)) throw new DnssecError("bad-place", `${input.fault} cannot apply at ${input.place}`);

  // The labels.
  const z = zoneLabels(input);
  /** True when the fault is this one, at this place. */
  const at = (f: Fault, p: Place) => input.fault === f && input.place === p;
  // The links, top down.
  const links: LinkResult[] = [];
  // The verdict once decided, and where and why.
  let verdict: Verdict | null = null;
  // The deciding link.
  let decidedAt: Place = "answer";
  // The deciding rule.
  let rule: Rule = "answer-ok";

  // ---- Link 1: the trust anchor into the root's DNSKEY RRset (RFC 4035 section 5) ----
  if (input.fault === "no-anchor") {
    // No anchor: nothing says any of the tree should be signed (RFC 4033 section 5).
    links.push({ link: "root", ds: null, dsSigner: null, keys: [z.root.ksk, z.root.zsk], rrsig: null, signer: z.root.ksk.tag, status: "indeterminate", rule: "anchor-none" });
    // Decided at the root.
    verdict = "indeterminate";
    // Where.
    decidedAt = "root";
    // Why.
    rule = "anchor-none";
  } else {
    // The RRSIG over the root's DNSKEY RRset, by the anchored key.
    const rrsig = at("rrsig-expired", "root") ? "expired" : at("rrsig-missing", "root") ? "missing" : "valid";
    // Its rule.
    const r: Rule = rrsig === "expired" ? "dnskey-rrsig-expired" : rrsig === "missing" ? "dnskey-rrsig-missing" : "anchor-ok";
    // The anchor, written as a DS for the same key.
    links.push({ link: "root", ds: { tag: ROOT_ANCHOR, alg: 8, digestOf: ROOT_ANCHOR }, dsSigner: null, keys: [z.root.ksk, z.root.zsk], rrsig, signer: z.root.ksk.tag, status: rrsig === "valid" ? "holds" : "bogus", rule: r });
    // A failure here makes everything Bogus: the anchor says the root is signed.
    if (rrsig !== "valid") {
      // Decided.
      verdict = "bogus";
      // At the root.
      decidedAt = "root";
      // By its rule.
      rule = r;
    }
  }

  // ---- Links 2 and 3: the delegations into the TLD and into the zone (RFC 4035 section 5.2) ----
  for (const [place, parent, child] of [
    ["tld", z.root, z.tld],
    ["zone", z.tld, z.zone],
  ] as const) {
    // Above, a decision has been made: this link is not checked (below Insecure, or below a failure).
    if (verdict !== null) {
      // Not checked, with the reason.
      links.push({ link: place, ds: null, dsSigner: null, keys: [child.ksk, child.zsk], rrsig: null, signer: child.ksk.tag, status: "not-checked", rule: belowRule(verdict) });
      // Next link.
      continue;
    }
    // No DS, with a signed NSEC proving it: no path into the child, Insecure (RFC 4035 5.2, RFC 6840 4.4).
    if (at("no-ds", place)) {
      // The link, insecure.
      links.push({ link: place, ds: null, dsSigner: parent.zsk.tag, keys: [child.ksk, child.zsk], rrsig: "valid", signer: parent.zsk.tag, status: "insecure", rule: "no-ds" });
      // Decided.
      verdict = "insecure";
      // Here.
      decidedAt = place;
      // By the NSEC proof.
      rule = "no-ds";
      // Next link (not checked).
      continue;
    }
    // The DS the parent publishes: for the child's KSK, except after a roll, when it still names the old key.
    const dsTag = at("ds-mismatch", place) ? (place === "zone" ? 31589 : 17883) : child.ksk.tag;
    // The DS record as labelled (its digest is "of" the key it was made from).
    const ds = { tag: dsTag, alg: child.ksk.alg, digestOf: dsTag };
    // An algorithm the validator does not implement: the DS is disregarded, the child is unsigned (RFC 4035 5.2, RFC 6840 5.2).
    if (ds.alg === UNSUPPORTED_ALG) {
      // The link, insecure.
      links.push({ link: place, ds, dsSigner: parent.zsk.tag, keys: [child.ksk, child.zsk], rrsig: null, signer: child.ksk.tag, status: "insecure", rule: "unsupported-alg" });
      // Decided.
      verdict = "insecure";
      // Here.
      decidedAt = place;
      // By the algorithm rule.
      rule = "unsupported-alg";
      // Next link (not checked).
      continue;
    }
    // Algorithm, key tag and digest must match a key of the child's set (5.2, second condition).
    const matched = [child.ksk, child.zsk].some((k) => k.tag === ds.tag && k.alg === ds.alg && ds.digestOf === k.tag);
    // No match: the delegation says the child is signed, and its keys cannot be authenticated: Bogus.
    if (!matched) {
      // The link, bogus.
      links.push({ link: place, ds, dsSigner: parent.zsk.tag, keys: [child.ksk, child.zsk], rrsig: null, signer: child.ksk.tag, status: "bogus", rule: "ds-mismatch" });
      // Decided.
      verdict = "bogus";
      // Here.
      decidedAt = place;
      // By the DS rule.
      rule = "ds-mismatch";
      // Next link (not checked).
      continue;
    }
    // The matched key's RRSIG over the child's DNSKEY RRset (5.2, third condition; 5.3.1).
    const rrsig = at("rrsig-expired", place) ? "expired" : at("rrsig-missing", place) ? "missing" : "valid";
    // Its rule.
    const r: Rule = rrsig === "expired" ? "dnskey-rrsig-expired" : rrsig === "missing" ? "dnskey-rrsig-missing" : "ds-ok";
    // The link.
    links.push({ link: place, ds, dsSigner: parent.zsk.tag, keys: [child.ksk, child.zsk], rrsig, signer: child.ksk.tag, status: rrsig === "valid" ? "holds" : "bogus", rule: r });
    // A failed RRSIG under a matching DS: Bogus.
    if (rrsig !== "valid") {
      // Decided.
      verdict = "bogus";
      // Here.
      decidedAt = place;
      // By the RRSIG rule.
      rule = r;
    }
  }

  // ---- Link 4: the answer's RRSIG, by a key of the zone's authenticated set (RFC 4035 5.3.1, 5.3.3) ----
  if (verdict !== null) {
    // Not checked against the chain.
    links.push({ link: "answer", ds: null, dsSigner: null, keys: [z.zone.ksk, z.zone.zsk], rrsig: null, signer: z.zone.zsk.tag, status: "not-checked", rule: belowRule(verdict) });
  } else {
    // The RRSIG over www.example.org. A, by the zone's ZSK.
    const rrsig = at("rrsig-expired", "answer") ? "expired" : at("rrsig-missing", "answer") ? "missing" : "valid";
    // Its rule.
    const r: Rule = rrsig === "expired" ? "answer-rrsig-expired" : rrsig === "missing" ? "answer-rrsig-missing" : "answer-ok";
    // The link.
    links.push({ link: "answer", ds: null, dsSigner: null, keys: [z.zone.ksk, z.zone.zsk], rrsig, signer: z.zone.zsk.tag, status: rrsig === "valid" ? "holds" : "bogus", rule: r });
    // Decided at the answer, either way.
    verdict = rrsig === "valid" ? "secure" : "bogus";
    // Here.
    decidedAt = "answer";
    // By its rule.
    rule = r;
  }

  // What the stub receives: AD when Secure, SERVFAIL when Bogus, the answer without AD otherwise.
  const client: ClientGets = verdict === "secure" ? "answer-ad" : verdict === "bogus" ? "servfail" : "answer-no-ad";
  // The full answer.
  return { verdict, client, decidedAt, rule, links };
}

/** The opening state: nothing broken, a Secure answer. */
export const DEFAULT_INPUT: DnssecInput = { fault: "none", place: "root" };

/** The Example: example.org. is signed, but org. has no DS for it: Insecure, which people read as a failure. */
export const EXAMPLE_INPUT: DnssecInput = { fault: "no-ds", place: "zone" };
