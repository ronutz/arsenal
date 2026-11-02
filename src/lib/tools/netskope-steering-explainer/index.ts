// ============================================================================
// The {manifest, run, vectors} triple for the Netskope steering-method
// explainer. Deterministic and offline: it describes a design decision.
// ============================================================================

export { explainSteering, run, SteeringInputError } from "./compute";
export type { Situation, SteeringResult, Recommendation, Method } from "./compute";
export { verifyVectors, STEERING_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { SteeringVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "netskope-steering-explainer",
  learnLinks: [
    "learn/netskope-steering-methods",
    "learn/sse-single-pass-architecture",
  ],
  // Added 2026-11-01 with Share results: this manifest had no dangerousInputHandling key, and the entry records the
  // share (the form takes seven yes/no answers and contacts nothing).
  dangerousInputHandling: [
    "share-input", // Share results (2026-11-01) builds a link only when pressed, carrying the seven answers after the #, as 1 or 0
  ],
  sources: Object.freeze([
    Object.freeze({ id: "ns-choose", label: "Netskope - Choose a traffic steering method", url: "https://docs.netskope.com/en/choose-a-traffic-steering-method" }),
    Object.freeze({ id: "ns-steering", label: "Netskope - Steering configuration", url: "https://docs.netskope.com/en/steering-configuration" }),
    Object.freeze({ id: "ns-create", label: "Netskope - Creating a steering configuration", url: "https://docs.netskope.com/en/creating-a-steering-configuration" }),
  ]),
});
