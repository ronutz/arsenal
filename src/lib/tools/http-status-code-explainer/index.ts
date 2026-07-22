// ============================================================================
// src/lib/tools/http-status-code-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING HTTP STATUS CODE EXPLAINER - {manifest, run, vectors}.
// Deterministic decoder for status codes and families: registered name,
// documented meaning, operational notes, and - for valid-but-unregistered
// codes - the protocol's own forward-compatibility rule as the answer.
// Paired article: learn/http-status-codes-the-five-families. API-included:
// run(text) is a stable text->JSON contract like its sibling
// http-methods-comparison.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, STATUS_VECTORS } from "./golden-vectors";

export { run, parseTokens } from "./compute";
export type { CodeExplanation, FamilyExplanation, StatusExplainResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, STATUS_VECTORS, verifyVectors } from "./golden-vectors";
export type { StatusVector } from "./golden-vectors";

/** The D-49 declarative manifest for the http-status-code-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "HTTP",
  toolSlug: "http-status-code-explainer",
  canonicalAliases: ["status-code-explainer", "http-status", "status-codes", "response-codes"],
  inputDetectors: [
    {
      kind: "regex",
      // Bare three-digit codes and family queries.
      pattern: "^\\s*([1-5]\\d{2}|[1-5]xx)(\\s+([1-5]\\d{2}|[1-5]xx))*\\s*$",
      priority: 4,
      example: "301 302 307",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "full",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["token-anchored-errors", "range-validation", "20-token-cap", "dedupe"],
  shareSafetyDefault: "open", // status codes carry no secrets

  // -- Teaching & provenance --
  learnLinks: [
    "learn/http-status-codes-the-five-families",
    "learn/http-methods-the-verbs",
  ],
  sources: [
    {
      id: "rfc-9110",
      label: "RFC 9110: HTTP Semantics - the status code catalogue and family rules",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc9110",
      access_date: "2026-07-21",
      scope: "the core status registry (1xx-5xx families, forward-compatibility fallback to x00, the redirect method-preservation semantics, 401's WWW-Authenticate requirement, 422's promotion into the core catalogue)",
      status: "active",
    },
    {
      id: "rfc-6585",
      label: "RFC 6585: Additional HTTP Status Codes",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc6585",
      access_date: "2026-07-21",
      scope: "428 Precondition Required, 429 Too Many Requests, 431 Request Header Fields Too Large, 511 Network Authentication Required",
      status: "active",
    },
    {
      id: "rfc-7725",
      label: "RFC 7725: An HTTP Status Code to Report Legal Obstacles",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc7725",
      access_date: "2026-07-21",
      scope: "451 Unavailable For Legal Reasons",
      status: "active",
    },
    {
      id: "rfc-8297",
      label: "RFC 8297: An HTTP Status Code for Indicating Hints",
      type: "standard",
      url: "https://www.rfc-editor.org/rfc/rfc8297",
      access_date: "2026-07-21",
      scope: "103 Early Hints",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = STATUS_VECTORS;
