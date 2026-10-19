// ============================================================================
// src/lib/tools/dig-output-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING dig OUTPUT EXPLAINER - a self-contained {manifest, run,
// vectors} triple. Paste what `dig` printed and get a structured breakdown of
// the header, flags, EDNS OPT, the four sections with every record decoded,
// and the query stats, each with a plain-English explanation.
//
// It parses the text only. It never resolves a name and contacts nothing
// (zero egress, D-49). The engine is pure and golden-vector tested.
// ============================================================================

import { parseDig } from "./compute";
import { GOLDEN_VECTOR_SET_ID, DIG_VECTORS } from "./golden-vectors";

export {
  parseDig, // the parser
  parseTtlToken, // TTL token reader (seconds or +ttlunits form)
  breakdownRdata, // rdata field breakdowns
  RCODE_MEANINGS, // status meanings
  OPCODE_MEANINGS, // opcode meanings
  OPCODE_IANA_NAMES, // RESERVED6 -> DSO (RFC 8490)
  RCODE_IANA_NAMES, // RESERVED11 -> DSOTYPENI (RFC 8490)
  FLAG_MEANINGS, // flag meanings
  RRTYPE_MEANINGS, // record type meanings
} from "./compute";
export {
  RCODE_MEANINGS_PT,
  OPCODE_MEANINGS_PT,
  FLAG_MEANINGS_PT,
  RRTYPE_MEANINGS_PT,
  FIELD_LABELS_PT,
} from "./meanings-pt";
export type {
  DigFlag,
  DigHeader,
  DigFlags,
  DigOpt,
  DigRecord,
  DigSection,
  SectionName,
  DigFooter,
  DigNegativeTtl, // the RFC 2308 section 5 negative-caching TTL
  DigParse,
  RdataField,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, DIG_VECTORS, verifyVectors } from "./golden-vectors";
export type { DigVector } from "./golden-vectors";

/** The D-49 declarative manifest for the dig-output-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing",
  toolSlug: "dig-output-explainer",
  canonicalAliases: ["dig-explainer", "dig-parser", "dig-reader", "dig-output-reader", "read-dig"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "->>HEADER<<-",
      priority: 8,
      example: ";; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4321",
    },
    {
      kind: "regex",
      pattern: "<<>>\\s*DiG",
      priority: 7,
      example: "; <<>> DiG 9.20.29 <<>> example.com A", // the version line of the golden vectors' dig
    },
    {
      kind: "regex",
      pattern: "^;;\\s*(QUESTION|ANSWER|AUTHORITY|ADDITIONAL) SECTION:",
      priority: 5,
      example: ";; ANSWER SECTION:",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-line-parse", "never-resolves"], // text only; contacts nothing
  shareSafetyDefault: "fragment", // dig output can reveal internal names and resolver IPs

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-dig-output",
    "learn/dns-message-header-and-flags",
    "learn/dns-record-types-in-answers",
    "learn/edns-and-the-opt-pseudosection",
    "learn/dnssec-records-in-dig",
    "learn/dig-query-options",
    "learn/dig-trace-and-delegation",
  ],
  // Each source was downloaded and read on its access_date (the 2026-10-19 set backs the
  // +ttlunits / +nottlid / +multiline parsing, the RESERVED6 and RESERVED11 names, the RFC 2308
  // section 5 negative TTL and the move of the example names to .invalid).
  sources: [
    { id: "rfc1035", label: "RFC 1035 - Domain Names (Implementation and Specification)", url: "https://www.rfc-editor.org/rfc/rfc1035", access_date: "2026-10-19" }, // message format, header, AA (4.1.1)
    { id: "rfc6891", label: "RFC 6891 - Extension Mechanisms for DNS (EDNS(0))", url: "https://www.rfc-editor.org/rfc/rfc6891", access_date: "2026-10-19" }, // the OPT pseudo-section
    { id: "rfc2308", label: "RFC 2308 - Negative Caching of DNS Queries", url: "https://www.rfc-editor.org/rfc/rfc2308", access_date: "2026-10-19" }, // section 5: min(SOA TTL, MINIMUM)
    { id: "rfc4034", label: "RFC 4034 - Resource Records for the DNS Security Extensions", url: "https://www.rfc-editor.org/rfc/rfc4034", access_date: "2026-10-19" }, // RRSIG, DNSKEY, DS, NSEC
    { id: "rfc9499", label: "RFC 9499 - DNS Terminology (March 2024; obsoletes RFC 8499)", url: "https://www.rfc-editor.org/rfc/rfc9499", access_date: "2026-10-19" }, // terminology
    { id: "rfc8490", label: "RFC 8490 - DNS Stateful Operations (opcode 6 DSO, RCODE 11 DSOTYPENI)", url: "https://www.rfc-editor.org/rfc/rfc8490", access_date: "2026-10-19" }, // sections 10.1 and 10.2
    { id: "rfc6761", label: "RFC 6761 - Special-Use Domain Names (section 6.4, \"invalid.\")", url: "https://www.rfc-editor.org/rfc/rfc6761", access_date: "2026-10-19" }, // NXDOMAIN examples under .invalid
    { id: "rfc9824", label: "RFC 9824 - Compact Denial of Existence in DNSSEC", url: "https://www.rfc-editor.org/rfc/rfc9824", access_date: "2026-10-19" }, // why example.com answers NOERROR/NODATA
    { id: "bind9-dig-manual", label: "ISC, BIND 9 9.20.29 documentation, Manual Pages: dig (+ttlunits, +ttlid, +multiline, +opcode)", url: "https://bind9.readthedocs.io/en/stable/manpages.html", access_date: "2026-10-19" }, // the output options parsed here
    { id: "bind9-dig-source", label: "ISC, BIND 9 source at tag v9.20.29, bin/dig/dig.c (opcodetext: RESERVED6) and lib/dns/rcode.c (RESERVED11)", url: "https://github.com/isc-projects/bind9/blob/v9.20.29/bin/dig/dig.c", access_date: "2026-10-19" }, // how dig spells opcode 6 and RCODE 11
  ],
});

/** Tool entry point. Deterministic; delegates to the pure parser. */
export function run(input: string) {
  return parseDig(input);
}
