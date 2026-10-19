// ============================================================================
// src/lib/tools/nslookup-output-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING nslookup OUTPUT EXPLAINER - a {manifest, run, vectors}
// triple. Paste what nslookup printed and get a structured breakdown: the
// resolver it used, whether the answer is authoritative, each record decoded,
// and any failures, each with a plain-English explanation.
//
// Parses TEXT ONLY. Never resolves a name, contacts nothing (zero egress,
// D-49). The engine is pure and golden-vector tested.
// ============================================================================

import { parseNslookup } from "./compute";
import { GOLDEN_VECTOR_SET_ID, NS_VECTORS } from "./golden-vectors";

export {
  parseNslookup,
  breakdownValue,
  NS_TYPE_MEANINGS,
  SOA_FIELD_LABELS,
} from "./compute";
export type {
  NslookupServer,
  NslookupAuthority,
  NsField,
  NslookupRecord,
  NslookupError,
  NslookupParse,
} from "./compute";
export {
  NS_TYPE_MEANINGS_PT,
  FIELD_LABELS_PT,
} from "./meanings-pt";
export { GOLDEN_VECTOR_SET_ID, NS_VECTORS, verifyVectors } from "./golden-vectors";
export type { NsVector } from "./golden-vectors";

/** The D-49 declarative manifest for the nslookup-output-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing",
  toolSlug: "nslookup-output-explainer",
  canonicalAliases: ["nslookup-explainer", "nslookup-parser", "nslookup-reader", "read-nslookup"],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "^Non-authoritative answer:",
      priority: 7,
      example: "Non-authoritative answer:",
    },
    {
      kind: "regex",
      pattern: "(mail exchanger|canonical name|nameserver)\\s*=",
      priority: 6,
      example: "example.com  mail exchanger = 10 mail.example.com.",
    },
    {
      kind: "regex",
      pattern: "server can'?t find .+:",
      priority: 6,
      example: "** server can't find nonexistent.invalid: NXDOMAIN", // a .invalid name (RFC 6761 section 6.4), as in the golden vector
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-line-parse", "never-resolves"],
  shareSafetyDefault: "fragment", // nslookup output can reveal internal names and resolver IPs

  // -- Teaching & provenance --
  learnLinks: [
    "learn/reading-nslookup-output",
    "learn/nslookup-vs-dig",
    "learn/nslookup-record-types",
    "learn/authoritative-vs-non-authoritative-answers",
    "learn/nslookup-errors-explained",
    "learn/reverse-dns-lookups-with-nslookup",
    "learn/nslookup-interactive-mode",
  ],
  // Each source was downloaded and read on its access_date. AA and authority: RFC 1035 section
  // 4.1.1 and RFC 2181 section 6 define it by authority for the name, not by caching.
  sources: [
    { id: "rfc1035", label: "RFC 1035 - Domain Names (Implementation and Specification)", url: "https://www.rfc-editor.org/rfc/rfc1035", access_date: "2026-10-19" }, // message format; AA in section 4.1.1
    { id: "rfc2181", label: "RFC 2181 - Clarifications to the DNS Specification (section 6, zone authority)", url: "https://www.rfc-editor.org/rfc/rfc2181", access_date: "2026-10-19" }, // which servers are authoritative for a name
    { id: "rfc2308", label: "RFC 2308 - Negative Caching of DNS Queries", url: "https://www.rfc-editor.org/rfc/rfc2308", access_date: "2026-10-19" }, // NXDOMAIN, NODATA, the SOA minimum
    { id: "rfc2782", label: "RFC 2782 - A DNS RR for specifying the location of services (SRV)", url: "https://www.rfc-editor.org/rfc/rfc2782", access_date: "2026-10-19" }, // SRV fields
    { id: "rfc9499", label: "RFC 9499 - DNS Terminology (March 2024; obsoletes RFC 8499)", url: "https://www.rfc-editor.org/rfc/rfc9499", access_date: "2026-10-19" }, // authoritative server, resolver
    { id: "rfc6761", label: "RFC 6761 - Special-Use Domain Names (section 6.4, \"invalid.\")", url: "https://www.rfc-editor.org/rfc/rfc6761", access_date: "2026-10-19" }, // NXDOMAIN examples under .invalid
    { id: "rfc9824", label: "RFC 9824 - Compact Denial of Existence in DNSSEC", url: "https://www.rfc-editor.org/rfc/rfc9824", access_date: "2026-10-19" }, // why example.com answers NOERROR/NODATA
    { id: "rfc7505", label: "RFC 7505 - A \"Null MX\" No Service Resource Record for Domains That Accept No Mail", url: "https://www.rfc-editor.org/rfc/rfc7505", access_date: "2026-10-19" }, // the MX vector's "0 ."
  ],
});

/** Tool entry point. Deterministic; delegates to the pure parser. */
export function run(input: string) {
  return parseNslookup(input);
}
