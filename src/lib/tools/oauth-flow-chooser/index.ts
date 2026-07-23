// ============================================================================
// src/lib/tools/oauth-flow-chooser/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OAUTH FLOW CHOOSER - {manifest, run, vectors}.
// Three questions in; the modern grant out, RFC-cited, with implicit and
// ROPC retired by name (RFC 9700). Final tool of the Ping run; paired with
// the choosing-the-grant article and wired into the PingFederate, PingAM,
// and PingAccess guides. (D-19.)
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, CHOOSER_VECTORS } from "./golden-vectors";

export { choose, run } from "./compute";
export type { AppType, ChooserInput, ChooserResult, ChooserError, Avoided } from "./compute";
export { GOLDEN_VECTOR_SET_ID, CHOOSER_VECTORS, verifyVectors } from "./golden-vectors";
export type { ChooserVector } from "./golden-vectors";

/** The D-49 declarative manifest for the oauth-flow-chooser. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Identity & tokens",
  toolSlug: "oauth-flow-chooser",
  canonicalAliases: ["oauth-grant-chooser", "oauth-flow-selector", "which-oauth-flow"],
  inputDetectors: [
    {
      kind: "structured-form",
      pattern: "appType + wantsIdentity + needsOffline fields",
      priority: 1,
      example: '{"appType":"spa","wantsIdentity":true,"needsOffline":true}',
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "enumerated-app-types",
    "boolean-coercion",
    "retired-grants-invariant",
    "contradiction-warning-service-identity",
  ],
  shareSafetyDefault: "safe", // three enum/boolean answers carry no secrets

  // -- Teaching & provenance --
  learnLinks: [
    "learn/oauth-choosing-the-grant",
    "learn/oauth-client-types",
    "learn/oauth-code-flow",
  ],
  sources: [
    { id: "rfc6749", label: "RFC 6749 - The OAuth 2.0 Authorization Framework", url: "https://www.rfc-editor.org/rfc/rfc6749" },
    { id: "rfc7636", label: "RFC 7636 - Proof Key for Code Exchange (PKCE)", url: "https://www.rfc-editor.org/rfc/rfc7636" },
    { id: "rfc8252", label: "RFC 8252 - OAuth 2.0 for Native Apps", url: "https://www.rfc-editor.org/rfc/rfc8252" },
    { id: "rfc8628", label: "RFC 8628 - OAuth 2.0 Device Authorization Grant", url: "https://www.rfc-editor.org/rfc/rfc8628" },
    { id: "rfc9700", label: "RFC 9700 - Best Current Practice for OAuth 2.0 Security", url: "https://www.rfc-editor.org/rfc/rfc9700" },
  ],
  vectorsCount: CHOOSER_VECTORS.length,
});
