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
  sources: Object.freeze([
    Object.freeze({ id: "ns-choose", label: "Netskope - Choose a traffic steering method", url: "https://docs.netskope.com/en/choose-a-traffic-steering-method" }),
    Object.freeze({ id: "ns-steering", label: "Netskope - Steering configuration", url: "https://docs.netskope.com/en/steering-configuration" }),
    Object.freeze({ id: "ns-create", label: "Netskope - Creating a steering configuration", url: "https://docs.netskope.com/en/creating-a-steering-configuration" }),
  ]),
});
