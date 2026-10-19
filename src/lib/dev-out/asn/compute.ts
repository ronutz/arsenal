// ============================================================================
// src/lib/dev-out/asn/compute.ts
// ----------------------------------------------------------------------------
// ASN LOOKUP - the second /dev/out resident. Same room, same rule: NOTHING
// LEAVES THE BROWSER UNTIL THE PERSON PRESSES ASK.
//
// The deterministic layers this module owns:
//   1. classifyAsn   - accept "AS15169", "as 15169", or bare "15169";
//                      validate as an integer in 0..4294967295 (32-bit ASN
//                      space, RFC 6793). Out-of-vocabulary input is a format
//                      error, never a guess.
//                      Since 2026-10-19 it also accepts the dotted notations
//                      of RFC 5396 (asdot and asdot+: "1.10" is 1 x 65536 +
//                      10 = 65546), converts them to asplain for the lookup,
//                      and returns all three forms for display; a half above
//                      65535 or an empty half is refused with its own code.
//   2. SPECIAL_ASNS  - the IANA special-purpose AS numbers registry, vendored
//                      from the live CSV on 2026-07-08. A special ASN has no
//                      registry to ask: the tool says WHY (with the RFC) and
//                      performs NO egress at all - the most honest possible
//                      answer for AS0, AS112, AS_TRANS, documentation and
//                      private ranges, and the two RFC 7300 reserved ends.
//   3. planAsn       - for globally-assignable numbers, route through the
//                      SAME vendored IANA bootstrap walk the RDAP tool uses
//                      (rdap/compute.ts selectEndpoint over asn.json ranges)
//                      to the owning RIR's autnum endpoint (RFC 9082
//                      /autnum/<number>); unallocated gaps in the bootstrap
//                      come back as an explicit "unallocated" plan, not an
//                      error dressed as knowledge.
//   4. summarizeAutnum - a tolerant RFC 9083 autnum reader: handle, AS range,
//                      network name, holder (first entity fn), status, and
//                      the registration / last-changed events. Grounded in a
//                      live ARIN capture (AS15169), trimmed as the parse
//                      fixture in the golden vectors.
//
// LIVE-VERIFIED CORS MAP for autnum endpoints (Origin: https://ronutz.com,
// probed 2026-07-08): ARIN *, APNIC *, AFRINIC *, LACNIC * (note: LACNIC
// 307-redirects NIR-delegated ASNs - Brazilian ones land on rdap.registro.br,
// CORS on every hop, so browser-direct works and the component can honestly
// report who actually answered); RIPE sends no CORS header, so that path
// fails in-browser by design and hands over the exact curl command.
// ============================================================================

import {
  selectEndpoint,
  buildQueryUrl,
  curlCommand,
  RdapError,
  BOOTSTRAP_SNAPSHOT,
  type ClassifiedInput,
} from "@/lib/dev-out/rdap/compute";

export { curlCommand, BOOTSTRAP_SNAPSHOT };

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

// "dotRange": a dotted (asdot / asdot+, RFC 5396) part above 65535; "dotEmpty": a dotted input with an empty part
// (added 2026-10-19 with asdot input, PRIME "Accept asdot").
export type AsnErrorCode = "empty" | "format" | "range" | "dotRange" | "dotEmpty";

export class AsnError extends Error {
  code: AsnErrorCode;
  constructor(code: AsnErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AsnError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// 1. Classification
// ----------------------------------------------------------------------------

/** 32-bit ASN ceiling (RFC 6793 four-octet AS number space). */
export const ASN_MAX = 4294967295;

// Accepted forms: "AS15169" / "as15169" / "AS 15169" / "15169". Digits only
// after the optional prefix; anything else (dots, signs, letters) is format.
const ASN_INPUT_RE = /^(?:as\s*)?(\d+)$/i;

// Dotted forms (RFC 5396 section 2, read 2026-10-19): asdot+ writes every AS number as
// "<high order 16-bit value in decimal>.<low order 16-bit value in decimal>" ("1.10" is 65546),
// and asdot does the same for values of 65536 and above. The optional "AS" prefix is accepted
// as for asplain. Both parts are captured as possibly-empty digit runs so that an empty part
// gets its own message instead of a generic format error. Anchored, no nested quantifier, and
// "\s*" and "\d*" cannot match the same character: linear time, ReDoS-safe.
const ASN_DOT_RE = /^(?:as\s*)?(\d*)\.(\d*)$/i;

/** The largest value of one 16-bit half in dotted notation. */
export const ASN_DOT_PART_MAX = 65535;

/** Notation the input was written in. */
export type AsnNotation = "asplain" | "dotted";

export interface ClassifiedAsn {
  /** The number itself (fits Number: max is 2^32-1). */
  asn: number;
  /** Canonical display form, "AS15169" (asplain, the form RFC 5396 section 3 proposes). */
  normalized: string;
  /** asplain form, the decimal value: "65546". */
  asplain: string;
  /** asdot form: asplain below 65536, "<high>.<low>" from 65536 up ("1.10"). */
  asdot: string;
  /** asdot+ form: always "<high>.<low>" ("0.65535", "1.10"). */
  asdotPlus: string;
  /** How the input was written: plain decimal, or dotted (asdot or asdot+). */
  notation: AsnNotation;
  /** For dotted input, the two 16-bit halves as typed (leading zeros removed); null for asplain input. */
  dotted: { high: number; low: number } | null;
}

/** asdot and asdot+ for a number, per RFC 5396 section 2. */
export function asnForms(asn: number): { asplain: string; asdot: string; asdotPlus: string } {
  // High and low 16-bit halves; Math.floor keeps it exact for every 32-bit value.
  const high = Math.floor(asn / 65536);
  // The remainder is the low half.
  const low = asn % 65536;
  // asdot+ always dots.
  const asdotPlus = `${high}.${low}`;
  // asdot dots only from 65536 up, otherwise it is the asplain string.
  const asdot = asn >= 65536 ? asdotPlus : String(asn);
  // asplain is the decimal value.
  return { asplain: String(asn), asdot, asdotPlus };
}

/** Parse one dotted half: digits only (the regex guarantees it), at most 65535. */
function dotPart(digits: string): number {
  // An empty half ("1.", ".10", ".") is its own error.
  if (digits === "") throw new AsnError("dotEmpty", "a dotted AS number needs both parts");
  // Leading zeros carry no value; strip them so the length check below is about magnitude (linear regex).
  const trimmed = digits.replace(/^0+(?=\d)/, "");
  // More than five significant digits is above 65535 without converting (no precision question).
  if (trimmed.length > 5) throw new AsnError("dotRange", "a dotted part is above 65535");
  // Five digits or fewer is exact as a Number.
  const n = Number(trimmed);
  // Each half is a 16-bit value.
  if (n > ASN_DOT_PART_MAX) throw new AsnError("dotRange", "a dotted part is above 65535");
  // A valid half.
  return n;
}

export function classifyAsn(raw: string): ClassifiedAsn {
  const s = raw.trim();
  if (s === "") throw new AsnError("empty");
  // Dotted input first (asdot or asdot+): it contains exactly one "." and digits around it.
  const d = ASN_DOT_RE.exec(s);
  if (d) {
    // Each half validated on its own, so the message names what is wrong.
    const high = dotPart(d[1]);
    // The low half.
    const low = dotPart(d[2]);
    // RFC 5396: high-order 16 bits times 65536 plus the low-order 16 bits; at most 4294967295.
    const n = high * 65536 + low;
    // The three notations of the same number.
    const forms = asnForms(n);
    // asplain is the lookup form; the dotted halves are kept to show the arithmetic.
    return { asn: n, normalized: `AS${n}`, ...forms, notation: "dotted", dotted: { high, low } };
  }
  const m = ASN_INPUT_RE.exec(s);
  if (!m) throw new AsnError("format", "not an AS number");
  // Reject absurd digit runs before Number() to avoid precision lies.
  if (m[1].length > 10) throw new AsnError("range", "beyond 32-bit ASN space");
  const n = Number(m[1]);
  if (n > ASN_MAX) throw new AsnError("range", "beyond 32-bit ASN space");
  // asplain input: the same three notations, no dotted halves to show.
  return { asn: n, normalized: `AS${n}`, ...asnForms(n), notation: "asplain", dotted: null };
}

// ----------------------------------------------------------------------------
// 2. The IANA special-purpose table (vendored, provenance below)
// ----------------------------------------------------------------------------

export const SPECIAL_REGISTRY_SNAPSHOT = Object.freeze({
  source: "IANA Special-Purpose AS Numbers registry",
  url: "https://www.iana.org/assignments/iana-as-numbers-special-registry/",
  accessed: "2026-07-08",
});

export interface SpecialAsnEntry {
  start: number;
  end: number;
  /** Short editorial reason (the registry's wording, condensed). */
  reasonKey:
    | "reservedAs0"
    | "as112"
    | "asTrans"
    | "documentation"
    | "privateUse"
    | "reservedLast";
  rfc: string;
}

/** Vendored verbatim ranges from the live IANA CSV (accessed 2026-07-08):
 *  0 [RFC7607]; 112 [RFC7534]; 23456 [RFC6793]; 64496-64511 and 65536-65551
 *  documentation [RFC5398]; 64512-65534 and 4200000000-4294967294 private use
 *  [RFC6996]; 65535 and 4294967295 reserved [RFC7300]. */
export const SPECIAL_ASNS: readonly SpecialAsnEntry[] = Object.freeze([
  { start: 0, end: 0, reasonKey: "reservedAs0", rfc: "RFC 7607" },
  { start: 112, end: 112, reasonKey: "as112", rfc: "RFC 7534" },
  { start: 23456, end: 23456, reasonKey: "asTrans", rfc: "RFC 6793" },
  { start: 64496, end: 64511, reasonKey: "documentation", rfc: "RFC 5398" },
  { start: 64512, end: 65534, reasonKey: "privateUse", rfc: "RFC 6996" },
  { start: 65535, end: 65535, reasonKey: "reservedLast", rfc: "RFC 7300" },
  { start: 65536, end: 65551, reasonKey: "documentation", rfc: "RFC 5398" },
  { start: 4200000000, end: 4294967294, reasonKey: "privateUse", rfc: "RFC 6996" },
  { start: 4294967295, end: 4294967295, reasonKey: "reservedLast", rfc: "RFC 7300" },
]);

export function specialFor(asn: number): SpecialAsnEntry | null {
  for (const e of SPECIAL_ASNS) if (asn >= e.start && asn <= e.end) return e;
  return null;
}

// ----------------------------------------------------------------------------
// 3. The plan: special (no egress) | query (one URL, on Ask) | unallocated
// ----------------------------------------------------------------------------

// Every plan carries `classified` (added 2026-10-19) so the page can show the asplain, asdot and asdot+ forms.
export type AsnPlan =
  | { kind: "special"; asn: number; normalized: string; classified: ClassifiedAsn; special: SpecialAsnEntry }
  | {
      kind: "query";
      asn: number;
      normalized: string;
      // The three RFC 5396 notations and how the input was written.
      classified: ClassifiedAsn;
      registryHost: string;
      url: string;
      curl: string;
    }
  // Unallocated also carries the notations.
  | { kind: "unallocated"; asn: number; normalized: string; classified: ClassifiedAsn };

export function planAsn(raw: string): AsnPlan {
  // Classify once; dotted input is already converted to its asplain number here.
  const classified = classifyAsn(raw);
  // The asplain number and its display form drive everything below.
  const { asn, normalized } = classified;

  const special = specialFor(asn);
  // A special-purpose number: answered locally, with its notations.
  if (special) return { kind: "special", asn, normalized, classified, special };

  const input: ClassifiedInput = { kind: "asn", value: String(asn) };
  try {
    const endpoint = selectEndpoint(input);
    const url = buildQueryUrl(input, endpoint);
    return {
      kind: "query",
      asn,
      normalized,
      // The notations travel with the plan.
      classified,
      registryHost: new URL(url).hostname,
      url,
      curl: curlCommand(url),
    };
  } catch (e) {
    // The vendored bootstrap has genuine gaps (unallocated / not yet
    // delegated blocks). That is an answer, not a failure.
    if (e instanceof RdapError && e.code === "noEndpoint") {
      // An unallocated number still shows its notations.
      return { kind: "unallocated", asn, normalized, classified };
    }
    throw e;
  }
}

// ----------------------------------------------------------------------------
// 4. Tolerant RFC 9083 autnum summary
// ----------------------------------------------------------------------------

export interface AutnumSummary {
  handle: string | null;
  /** "AS15169", or "AS64496-AS64511" when the object covers a block. */
  range: string | null;
  /** The AS's registered network name, e.g. "GOOGLE". */
  name: string | null;
  /** The first entity's vCard fn (registrant preferred), e.g. "Google LLC". */
  holder: string | null;
  status: string[];
  /** eventAction -> ISO date, e.g. { registration: "2000-03-30..." }. */
  events: Record<string, string>;
  port43: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- tolerant reader over
   third-party JSON; every access is narrowed before use. */
export function summarizeAutnum(raw: unknown): AutnumSummary {
  const d = raw as any;
  const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

  const start = typeof d?.startAutnum === "number" ? d.startAutnum : null;
  const end = typeof d?.endAutnum === "number" ? d.endAutnum : null;
  const range =
    start !== null ? `AS${start}${end !== null && end !== start ? `-AS${end}` : ""}` : null;

  const events: Record<string, string> = {};
  if (Array.isArray(d?.events)) {
    for (const ev of d.events) {
      const action = str(ev?.eventAction);
      const date = str(ev?.eventDate);
      if (action && date && !(action in events)) events[action] = date;
    }
  }

  // Holder: prefer an entity carrying the "registrant" role; fall back to the
  // first entity exposing a vCard fn at all.
  let holder: string | null = null;
  const fnOf = (ent: any): string | null => {
    const arr = ent?.vcardArray?.[1];
    if (!Array.isArray(arr)) return null;
    for (const item of arr) {
      if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") return item[3];
    }
    return null;
  };
  if (Array.isArray(d?.entities)) {
    const registrant = d.entities.find(
      (e: any) => Array.isArray(e?.roles) && e.roles.includes("registrant"),
    );
    holder = fnOf(registrant) ?? d.entities.map(fnOf).find((x: string | null) => x !== null) ?? null;
  }

  return {
    handle: str(d?.handle),
    range,
    name: str(d?.name),
    holder,
    status: Array.isArray(d?.status) ? d.status.filter((s: unknown) => typeof s === "string") : [],
    events,
    port43: str(d?.port43),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
