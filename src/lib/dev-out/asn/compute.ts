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

export type AsnErrorCode = "empty" | "format" | "range";

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

export interface ClassifiedAsn {
  /** The number itself (fits Number: max is 2^32-1). */
  asn: number;
  /** Canonical display form, "AS15169". */
  normalized: string;
}

export function classifyAsn(raw: string): ClassifiedAsn {
  const s = raw.trim();
  if (s === "") throw new AsnError("empty");
  const m = ASN_INPUT_RE.exec(s);
  if (!m) throw new AsnError("format", "not an AS number");
  // Reject absurd digit runs before Number() to avoid precision lies.
  if (m[1].length > 10) throw new AsnError("range", "beyond 32-bit ASN space");
  const n = Number(m[1]);
  if (n > ASN_MAX) throw new AsnError("range", "beyond 32-bit ASN space");
  return { asn: n, normalized: `AS${n}` };
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

export type AsnPlan =
  | { kind: "special"; asn: number; normalized: string; special: SpecialAsnEntry }
  | {
      kind: "query";
      asn: number;
      normalized: string;
      registryHost: string;
      url: string;
      curl: string;
    }
  | { kind: "unallocated"; asn: number; normalized: string };

export function planAsn(raw: string): AsnPlan {
  const { asn, normalized } = classifyAsn(raw);

  const special = specialFor(asn);
  if (special) return { kind: "special", asn, normalized, special };

  const input: ClassifiedInput = { kind: "asn", value: String(asn) };
  try {
    const endpoint = selectEndpoint(input);
    const url = buildQueryUrl(input, endpoint);
    return {
      kind: "query",
      asn,
      normalized,
      registryHost: new URL(url).hostname,
      url,
      curl: curlCommand(url),
    };
  } catch (e) {
    // The vendored bootstrap has genuine gaps (unallocated / not yet
    // delegated blocks). That is an answer, not a failure.
    if (e instanceof RdapError && e.code === "noEndpoint") {
      return { kind: "unallocated", asn, normalized };
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
