// ============================================================================
// The {manifest, run, vectors} triple for the Fabric Connect / SPB explainer.
// Deterministic and offline: it explains identifiers, it does not query a
// fabric.
// ============================================================================

export { explainSpb, run, SpbInputError } from "./compute";
export type { SpbInput, SpbResult, SpbFact } from "./compute";
export { verifyVectors, SPB_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { SpbVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "fabric-connect-spb-explainer",
  /* Both Extreme fabric tools point at the same article, which states the
     division of labour between them: this one explains the arrangement, the
     fabric identifier decoder validates a value. */
  learnLinks: [
    "learn/spb-fabric-vocabulary",
    "learn/voss-fabric-connect-spbm",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "ieee-8021aq", label: "IEEE 802.1aq - Shortest Path Bridging", url: "https://standards.ieee.org/ieee/802.1aq/4507/" }),
    Object.freeze({ id: "rfc6329", label: "RFC 6329 - IS-IS Extensions Supporting IEEE 802.1aq", url: "https://www.rfc-editor.org/rfc/rfc6329" }),
    Object.freeze({ id: "extreme-fabric", label: "Extreme Networks - Configuring Fabric Connect", url: "https://documentation.extremenetworks.com/" }),
  ]),
});
