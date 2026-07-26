// ============================================================================
// src/lib/tools/fortigate-security-profile-coverage-checker/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE SECURITY PROFILE COVERAGE CHECKER.
// A {manifest, run, vectors} triple. Describe a policy's SSL inspection mode,
// inspection engine and attached profiles; find out which profiles can
// actually SEE the traffic and which are attached, configured, and blind.
//
// Pure and deterministic (D-49). Never contacts a device, never fetches.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, checkProfile, parseInput } from "./compute";
export type {
  SslMode, InspectionMode, TrafficKind, Coverage, ProfileFinding, CoverageResult, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { CoverageVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-security-profile-coverage-checker",
  canonicalAliases: [
    "fortigate-utm-coverage",
    "why-is-my-profile-not-working",
    "certificate-vs-deep-inspection",
    "fortigate-profile-blind-spots",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*ssl\\s*[:=]\\s*(none|certificate|deep)", priority: 9,
      example: "ssl: certificate" },
    { kind: "regex", pattern: "^\\s*profiles?\\s*[:=]\\s*", priority: 8,
      example: "profiles: antivirus, ips, application-control" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  shareSafetyDefault: "full",
  learnLinks: ["learn/fortigate-security-profiles-flow-vs-proxy", "learn/fortinet-ssl-inspection-modes"],
  sources: [
    { id: "fgt-ssl-inspection", label: "Fortinet FortiGate Administration Guide: SSL/SSH inspection (certificate inspection versus deep inspection and what each exposes)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/822452/ssl-ssh-inspection" },
    { id: "fgt-inspection-modes", label: "Fortinet FortiGate Administration Guide: Inspection modes (flow-based versus proxy-based and the features each supports)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/188323/inspection-modes" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
