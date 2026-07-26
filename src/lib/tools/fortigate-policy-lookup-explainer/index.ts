// ============================================================================
// src/lib/tools/fortigate-policy-lookup-explainer/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE FIREWALL POLICY LOOKUP EXPLAINER.
// A {manifest, run, vectors} triple. Paste a policy list plus a packet tuple,
// get the policy that matches, a per-policy trace naming the FIRST criterion
// that eliminated each one, and the policies below the match that are
// genuinely unreachable as ordered.
//
// Pure and deterministic (D-49): a model of FortiOS's documented ordered,
// all-criteria, first-match-wins evaluation. It never contacts a device, never
// fetches, never evaluates input as code. Clean-room from Fortinet's own
// firewall policy documentation.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, lookup, evaluatePolicy, specificity, parseCli, parseTable, detectFormat } from "./compute";
export type {
  PolicyRule, PacketTuple, Evaluation, Verdict, Criterion, LookupResult, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { LookupVector } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-policy-lookup-explainer",
  canonicalAliases: [
    "fortigate-policy-lookup",
    "fortigate-policy-match",
    "fortigate-shadowed-policy",
    "firewall-policy-lookup",
    "policy-shadow-checker",
  ],
  inputDetectors: [
    {
      kind: "regex",
      pattern: "config\\s+firewall\\s+policy",
      priority: 9,
      example: "config firewall policy\\n  edit 1\\n    set srcintf \"port1\"\\n  next\\nend",
    },
    {
      kind: "regex",
      pattern: "^\\s*packet:\\s*srcintf\\s*=",
      priority: 8,
      example: "packet: srcintf=port1, dstintf=port2, srcaddr=all, dstaddr=WebSrv, service=HTTPS",
    },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // A policy list carries internal interface names, object names and topology.
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-firewall-policy-and-nat"],
  sources: [
    {
      id: "fgt-policy-admin",
      label: "Fortinet FortiGate Administration Guide: Firewall policies (ordered evaluation, first match wins, the match criteria, implicit deny)",
      url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/376059/firewall-policy",
    },
    {
      id: "fgt-policy-order",
      label: "Fortinet FortiGate Administration Guide: Policy views and policy lookup (why order determines which policy is applied)",
      url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/954635/policy-views-and-policy-lookup",
    },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
