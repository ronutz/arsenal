// ============================================================================
// The {manifest, run, vectors} triple for the SSE single-pass architecture
// explainer. Deterministic and offline: it describes an architecture, it does
// not query one.
// ============================================================================

export { explainPass, run, SseInputError } from "./compute";
export type { RequestShape, PassResult, Stage, StageKind, Steering, Destination } from "./compute";
export { verifyVectors, SSE_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { SseVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "sse-architecture-explainer",
  learnLinks: [
    "learn/sse-single-pass-architecture",
  ],
  // Added 2026-11-01 with Share results: this manifest had no dangerousInputHandling key, and the entry records the
  // share (the form takes two choices and four yes/no answers and contacts nothing).
  dangerousInputHandling: [
    "share-input", // Share results (2026-11-01) builds a link only when pressed, carrying every field of the form after the #
  ],
  sources: Object.freeze([
    Object.freeze({ id: "netskope-zte", label: "Netskope - Zero Trust Engine", url: "https://www.netskope.com/netskope-one/zero-trust-engine" }),
    Object.freeze({ id: "netskope-sse", label: "Netskope One Security Service Edge", url: "https://www.netskope.com/products/security-service-edge" }),
    Object.freeze({ id: "netskope-one", label: "Netskope One platform", url: "https://www.netskope.com/netskope-one" }),
  ]),
});
