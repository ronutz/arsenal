// ============================================================================
// src/lib/tools/ldap-filter-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING LDAP FILTER EXPLAINER - {manifest, run, vectors}.
// A filter string in; the annotated RFC 4515 tree out - operators, match
// types, decoded escapes, recognized AD matching-rule OIDs, and anchored
// syntax errors. First tool of the Ping run; paired with the
// ldap-search-filters article and wired into the PingDirectory guides. (D-19.)
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, FILTER_VECTORS } from "./golden-vectors";

export { explainFilter, run } from "./compute";
export type {
  FilterNode,
  ExplainOk,
  ExplainErr,
  ExplainResult,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, FILTER_VECTORS, verifyVectors } from "./golden-vectors";
export type { FilterVector } from "./golden-vectors";

/** The D-49 declarative manifest for the ldap-filter-explainer. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & directory",
  toolSlug: "ldap-filter-explainer",
  canonicalAliases: ["ldap-filter-parser", "ldap-search-filter", "rfc4515-explainer"],
  inputDetectors: [
    {
      kind: "structured-form",
      pattern: "parenthesized LDAP search filter string",
      priority: 1,
      example: '{"filter":"(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"}',
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "length-guard-4000",
    "anchored-position-errors",
    "escape-validation-rfc4515",
    "no-network-no-eval",
  ],
  shareSafetyDefault: "safe", // filters may contain internal attribute names; nothing is transmitted

  // -- Teaching & provenance --
  learnLinks: ["learn/ldap-search-filters"],
  sources: [
    {
      id: "rfc4515",
      label: "RFC 4515 - LDAP: String Representation of Search Filters",
      url: "https://www.rfc-editor.org/rfc/rfc4515",
    },
    {
      id: "rfc4511",
      label: "RFC 4511 - LDAP: The Protocol",
      url: "https://www.rfc-editor.org/rfc/rfc4511",
    },
    {
      id: "ms-adts-rules",
      label: "Microsoft Learn - Search Filter Syntax (AD matching-rule OIDs)",
      url: "https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax",
    },
  ],
  vectorsCount: FILTER_VECTORS.length,
});
