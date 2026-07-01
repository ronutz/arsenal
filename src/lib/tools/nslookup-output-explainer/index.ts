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
      example: "** server can't find example.com: NXDOMAIN",
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
  sources: [
    { id: "rfc1035", label: "RFC 1035 - Domain Names (Implementation and Specification)", url: "https://www.rfc-editor.org/rfc/rfc1035" },
    { id: "rfc2308", label: "RFC 2308 - Negative Caching of DNS Queries", url: "https://www.rfc-editor.org/rfc/rfc2308" },
    { id: "rfc2782", label: "RFC 2782 - A DNS RR for specifying the location of services (SRV)", url: "https://www.rfc-editor.org/rfc/rfc2782" },
    { id: "rfc8499", label: "RFC 8499 - DNS Terminology", url: "https://www.rfc-editor.org/rfc/rfc8499" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure parser. */
export function run(input: string) {
  return parseNslookup(input);
}
