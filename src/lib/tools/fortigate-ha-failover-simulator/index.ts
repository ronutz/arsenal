// ============================================================================
// src/lib/tools/fortigate-ha-failover-simulator/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE FGCP HA ELECTION SIMULATOR.
// A {manifest, run, vectors} triple. Describe a cluster and see which unit
// becomes primary, which criterion decided it, and who would be primary if
// override were toggled.
//
// Pure and deterministic (D-49): a model of FGCP's documented election order.
// Never contacts a device, never fetches, never evaluates input.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, elect, parseMembers, criterionOrder } from "./compute";
export type {
  HaMember, HaResult, HaCriterion, Comparison, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { HaVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-ha-failover-simulator",
  canonicalAliases: [
    "fgcp-election",
    "fortigate-ha-election",
    "fortigate-failover",
    "ha-override-explainer",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*member\\s*:\\s*name\\s*=", priority: 9,
      example: "member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0" },
    { kind: "regex", pattern: "^\\s*override\\s*[:=]\\s*(enable|disable)", priority: 8,
      example: "override: disable" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // Serial numbers and hostnames are identifying.
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-fgcp-ha-clustering"],
  sources: [
    { id: "fgt-ha-election", label: "Fortinet FortiGate Administration Guide: FGCP primary unit selection (monitored interfaces, age, priority, serial number; the override setting)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/662886/primary-unit-selection" },
    { id: "fgt-ha-override", label: "Fortinet FortiGate Administration Guide: HA override and failover behaviour", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/220372/ha-override" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
