// ============================================================================
// src/lib/tools/fortios-config-diff-explainer/index.ts
// ----------------------------------------------------------------------------
// FORTIOS CONFIG DIFF EXPLAINER.
// A {manifest, run, vectors} triple. Two configurations in, a STRUCTURAL diff
// out: section, object and setting, so a moved block is not reported as a
// deletion plus an insertion — except in the sections where order IS the
// behaviour, where a move is exactly the finding you need.
//
// Pure and deterministic (D-49). Never contacts a device, never fetches.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, diff, parseConfig, splitSides, isOrderSensitive } from "./compute";
export type {
  ConfigObject, ConfigTree, Change, ChangeKind, SettingChange, DiffResult, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { DiffVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortios-config-diff-explainer",
  canonicalAliases: [
    "fortigate-config-diff",
    "fortios-semantic-diff",
    "show-full-configuration-diff",
    "fortigate-change-review",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^config\\s+(firewall|system|router|vpn)\\s", priority: 9,
      example: "config firewall address\\n    edit \"LAN\"\\n        set subnet 10.1.0.0 255.255.0.0\\n    next\\nend" },
    { kind: "regex", pattern: "^\\s*(before|after)\\s*:?\\s*$", priority: 6,
      example: "BEFORE:" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // A configuration carries addresses, object names, topology and sometimes
  // credentials, so a shared link must never carry the input.
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-firewall-policy-and-nat"],
  sources: [
    { id: "fgt-cli-config", label: "Fortinet FortiOS CLI Reference: configuration structure (config / edit / set / next / end and nested blocks)", url: "https://docs.fortinet.com/document/fortigate/latest/cli-reference" },
    { id: "fgt-policy-order", label: "Fortinet FortiGate Administration Guide: firewall policy ordering (first match wins, so object order is behaviour)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/954635/policy-views-and-policy-lookup" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
