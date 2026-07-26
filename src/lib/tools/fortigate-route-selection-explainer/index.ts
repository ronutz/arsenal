// ============================================================================
// src/lib/tools/fortigate-route-selection-explainer/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE ROUTE SELECTION EXPLAINER.
// A {manifest, run, vectors} triple. Give a destination and a set of routes;
// see which install, which is selected, and — the part people get wrong —
// which are floating backups that are ABSENT from the table rather than merely
// deprioritised.
//
// Pure and deterministic (D-49). Never contacts a device, never fetches.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, select, parseInput, contains, parsePrefix, ipToInt } from "./compute";
export type {
  RouteEntry, RouteEvaluation, RouteVerdict, RouteResult, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { RouteVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-route-selection-explainer",
  canonicalAliases: [
    "fortigate-route-lookup",
    "administrative-distance-vs-priority",
    "floating-route-explainer",
    "fortigate-ecmp",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*route\\s*:\\s*prefix\\s*=", priority: 9,
      example: "route: prefix=10.2.0.0/16, gw=10.1.1.1, dev=port3, distance=10, priority=0" },
    { kind: "regex", pattern: "^\\s*destination\\s*[:=]\\s*\\d", priority: 8,
      example: "destination: 10.2.5.10" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-routing-and-sdwan-selection"],
  sources: [
    { id: "fgt-route-lookup", label: "Fortinet FortiGate Administration Guide: Routing concepts and the routing table (administrative distance, priority, ECMP)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/218610/routing-concepts" },
    { id: "fgt-static-routes", label: "Fortinet FortiGate Administration Guide: Static routing, distance and priority, and link health monitoring", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/927853/static-routing" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
