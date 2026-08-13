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
  sources: Object.freeze([
    Object.freeze({ id: "netskope-zte", label: "Netskope - Zero Trust Engine", url: "https://www.netskope.com/netskope-one/zero-trust-engine" }),
    Object.freeze({ id: "netskope-sse", label: "Netskope One Security Service Edge", url: "https://www.netskope.com/products/security-service-edge" }),
    Object.freeze({ id: "netskope-one", label: "Netskope One platform", url: "https://www.netskope.com/netskope-one" }),
  ]),
});
