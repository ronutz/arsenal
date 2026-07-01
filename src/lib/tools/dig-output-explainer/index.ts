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
  parseDig,
  breakdownRdata,
  RCODE_MEANINGS,
  OPCODE_MEANINGS,
  FLAG_MEANINGS,
  RRTYPE_MEANINGS,
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
      example: "; <<>> DiG 9.18.1 <<>> example.com A",
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
  sources: [
    { id: "rfc1035", label: "RFC 1035 - Domain Names (Implementation and Specification)", url: "https://www.rfc-editor.org/rfc/rfc1035" },
    { id: "rfc6891", label: "RFC 6891 - Extension Mechanisms for DNS (EDNS(0))", url: "https://www.rfc-editor.org/rfc/rfc6891" },
    { id: "rfc2308", label: "RFC 2308 - Negative Caching of DNS Queries", url: "https://www.rfc-editor.org/rfc/rfc2308" },
    { id: "rfc4034", label: "RFC 4034 - Resource Records for the DNS Security Extensions", url: "https://www.rfc-editor.org/rfc/rfc4034" },
    { id: "rfc8499", label: "RFC 8499 - DNS Terminology", url: "https://www.rfc-editor.org/rfc/rfc8499" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure parser. */
export function run(input: string) {
  return parseDig(input);
}
