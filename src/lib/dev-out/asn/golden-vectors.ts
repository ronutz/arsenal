// ============================================================================
// src/lib/dev-out/asn/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the deterministic layers of the ASN lookup. As with the
// RDAP tool: the LIVE answer from a registry carries no golden-vector
// guarantee (the room's notice says so out loud), but everything computed
// locally - classification, the special-purpose table, bootstrap routing,
// URL construction, and response summarization over a captured fixture - is
// pinned here exactly.
//
// Routing expectations were DERIVED by running the vendored-bootstrap walk
// (rdap/bootstrap/asn.json, IANA publication 2026-06-01) and then hard-coded;
// the fixture is a live ARIN capture for AS15169 trimmed on 2026-07-08.
// ============================================================================

import { classifyAsn, planAsn, summarizeAutnum, AsnError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "dev-out-asn/2026-07-08";

// ---- classification --------------------------------------------------------

const CLASSIFY_VECTORS: { id: string; input: string; asn: number; normalized: string }[] = [
  { id: "prefixed", input: "AS15169", asn: 15169, normalized: "AS15169" },
  { id: "prefixed-spaced-lower", input: "as 3320", asn: 3320, normalized: "AS3320" },
  { id: "bare", input: "15169", asn: 15169, normalized: "AS15169" },
  { id: "max", input: "4294967295", asn: 4294967295, normalized: "AS4294967295" },
];

// ---- the special-purpose table (IANA registry, accessed 2026-07-08) --------

const SPECIAL_VECTORS: { id: string; input: string; reasonKey: string; rfc: string }[] = [
  { id: "as0", input: "AS0", reasonKey: "reservedAs0", rfc: "RFC 7607" },
  { id: "as112", input: "112", reasonKey: "as112", rfc: "RFC 7534" },
  { id: "as-trans", input: "AS23456", reasonKey: "asTrans", rfc: "RFC 6793" },
  { id: "doc-16bit", input: "AS64500", reasonKey: "documentation", rfc: "RFC 5398" },
  { id: "private-16bit", input: "64512", reasonKey: "privateUse", rfc: "RFC 6996" },
  { id: "reserved-65535", input: "65535", reasonKey: "reservedLast", rfc: "RFC 7300" },
  { id: "doc-32bit", input: "AS65540", reasonKey: "documentation", rfc: "RFC 5398" },
  { id: "private-32bit", input: "4200000000", reasonKey: "privateUse", rfc: "RFC 6996" },
  { id: "reserved-last32", input: "AS4294967295", reasonKey: "reservedLast", rfc: "RFC 7300" },
];

// ---- routing: one pick per RIR, verified against the vendored walk ---------

const ROUTING_VECTORS: { id: string; input: string; url: string }[] = [
  { id: "arin", input: "AS15169", url: "https://rdap.arin.net/registry/autnum/15169" },
  { id: "ripe", input: "AS3320", url: "https://rdap.db.ripe.net/autnum/3320" },
  { id: "apnic", input: "AS9498", url: "https://rdap.apnic.net/autnum/9498" },
  { id: "lacnic", input: "AS28573", url: "https://rdap.lacnic.net/rdap/autnum/28573" },
  { id: "afrinic", input: "AS37100", url: "https://rdap.afrinic.net/rdap/autnum/37100" },
];

// ---- an honest bootstrap gap ------------------------------------------------

const UNALLOCATED_VECTOR = { id: "unallocated-gap", input: "4000000000" };

// ---- rejects ----------------------------------------------------------------

const REJECT_VECTORS: { id: string; input: string; code: "empty" | "format" | "range" }[] = [
  { id: "empty", input: "   ", code: "empty" },
  { id: "prefix-only", input: "AS", code: "format" },
  { id: "decimal", input: "AS15169.1", code: "format" },
  { id: "negative", input: "-5", code: "format" },
  { id: "beyond-32bit", input: "4294967296", code: "range" },
  { id: "absurd-digits", input: "99999999999999", code: "range" },
];

// ---- parse fixture: live ARIN capture for AS15169, trimmed 2026-07-08 ------

const ARIN_AS15169_FIXTURE = {
  objectClassName: "autnum",
  handle: "AS15169",
  startAutnum: 15169,
  endAutnum: 15169,
  name: "GOOGLE",
  status: ["active"],
  events: [
    { eventAction: "last changed", eventDate: "2012-02-24T09:44:34-05:00" },
    { eventAction: "registration", eventDate: "2000-03-30T00:00:00-05:00" },
  ],
  entities: [
    {
      roles: ["registrant"],
      vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Google LLC"], ["kind", {}, "text", "org"]]],
    },
  ],
  port43: "whois.arin.net",
};

export interface VectorReport {
  setId: string;
  total: number;
  passed: number;
  failures: string[];
}

export function verifyVectors(): VectorReport {
  const failures: string[] = [];

  for (const v of CLASSIFY_VECTORS) {
    try {
      const c = classifyAsn(v.input);
      if (c.asn !== v.asn || c.normalized !== v.normalized) {
        failures.push(`${v.id}: got ${c.normalized}/${c.asn}`);
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of SPECIAL_VECTORS) {
    try {
      const p = planAsn(v.input);
      if (p.kind !== "special" || p.special.reasonKey !== v.reasonKey || p.special.rfc !== v.rfc) {
        failures.push(`${v.id}: got ${JSON.stringify(p)}`);
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of ROUTING_VECTORS) {
    try {
      const p = planAsn(v.input);
      if (p.kind !== "query" || p.url !== v.url) {
        failures.push(`${v.id}: got ${JSON.stringify(p)}`);
      }
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  {
    const v = UNALLOCATED_VECTOR;
    try {
      const p = planAsn(v.input);
      if (p.kind !== "unallocated") failures.push(`${v.id}: got ${p.kind}`);
    } catch (e) {
      failures.push(`${v.id}: threw ${(e as Error).message}`);
    }
  }

  for (const v of REJECT_VECTORS) {
    try {
      planAsn(v.input);
      failures.push(`${v.id}: expected ${v.code}, got a plan`);
    } catch (e) {
      if (!(e instanceof AsnError) || e.code !== v.code) {
        failures.push(`${v.id}: expected ${v.code}, got ${(e as Error).message}`);
      }
    }
  }

  {
    const s = summarizeAutnum(ARIN_AS15169_FIXTURE);
    const ok =
      s.handle === "AS15169" &&
      s.range === "AS15169" &&
      s.name === "GOOGLE" &&
      s.holder === "Google LLC" &&
      s.status.length === 1 &&
      s.status[0] === "active" &&
      s.events["registration"] === "2000-03-30T00:00:00-05:00" &&
      s.events["last changed"] === "2012-02-24T09:44:34-05:00" &&
      s.port43 === "whois.arin.net";
    if (!ok) failures.push(`fixture-arin-as15169: got ${JSON.stringify(s)}`);
  }

  const total =
    CLASSIFY_VECTORS.length +
    SPECIAL_VECTORS.length +
    ROUTING_VECTORS.length +
    1 + // unallocated
    REJECT_VECTORS.length +
    1; // fixture
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures };
}
