// ============================================================================
// src/lib/tools/fortigate-session-table-explainer/index.ts
// ----------------------------------------------------------------------------
// FORTIGATE SESSION TABLE EXPLAINER.
// A {manifest, run, vectors} triple. Paste `diagnose sys session list` output
// and get it read back: protocol and state, which policy admitted the flow,
// what was translated on each leg, and — the reading people skip — whether the
// far side ever replied.
//
// Pure and deterministic (D-49): a model of the documented session-table
// format. Never contacts a device, never fetches, never evaluates input.
// Clean-room from Fortinet's own session-table documentation.
// ============================================================================

import { run } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, parseSession, explainStateFlag } from "./compute";
export type {
  ParsedSession, SessionResult, SessionStat, NatHook, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { SessionVector } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortigate-session-table-explainer",
  canonicalAliases: [
    "fortigate-session-list",
    "diagnose-sys-session-list",
    "fortigate-session-decoder",
    "fortios-session-table",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "^session info:\\s*proto=", priority: 9,
      example: "session info: proto=6 proto_state=01 duration=125 expire=3590 timeout=3600" },
    { kind: "regex", pattern: "statistic\\(bytes/packets/allow_err\\)", priority: 9,
      example: "statistic(bytes/packets/allow_err): org=1024/12/0 reply=8192/14/0 tuples=2" },
  ],
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // Session output carries internal addresses, ports and topology.
  shareSafetyDefault: "fragment",
  learnLinks: ["learn/fortigate-firewall-policy-and-nat", "learn/reading-a-fortigate-sniffer-trace"],
  sources: [
    { id: "fgt-session-life", label: "Fortinet FortiGate Administration Guide: Life of a packet and session table (session states, the statistic counters, the NAT hook lines)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/54688/life-of-a-packet" },
    { id: "fgt-session-tt", label: "Fortinet Community: Troubleshooting Tip - FortiGate session table information (diagnose sys session list fields and how to read them)", url: "https://community.fortinet.com/t5/FortiGate/Troubleshooting-Tip-FortiGate-session-table-information/ta-p/196988" },
  ],
});

export { run as runTool };
export const __selftest = verifyVectors;
