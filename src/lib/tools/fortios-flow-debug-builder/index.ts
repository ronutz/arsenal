// ============================================================================
// The {manifest, run, vectors} triple for the FortiOS debug flow builder.
// It generates text and contacts nothing.
// ============================================================================

export { buildFlowDebug, planToText, run, FlowDebugError } from "./compute";
export type { FlowDebugInput, FlowDebugPlan, CommandLine } from "./compute";
export { verifyVectors, FLOW_VECTORS, GOLDEN_VECTOR_SET_ID } from "./golden-vectors";
export type { FlowVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "fortios-flow-debug-builder",
  learnLinks: [
    "learn/fortigate-debug-flow",
  ],
  sources: Object.freeze([
    Object.freeze({ id: "fortios-debug-flow", label: "Fortinet - Debugging the packet flow", url: "https://docs.fortinet.com/document/fortigate/7.6.6/administration-guide/54688/debugging-the-packet-flow" }),
  ]),
});
