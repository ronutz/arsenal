// ============================================================================
// src/lib/tools/fortios-sniffer-builder/index.ts
// ----------------------------------------------------------------------------
// FORTIOS PACKET SNIFFER BUILDER + DECODER.
// A {manifest, run, vectors} triple. Build a "diagnose sniffer packet ..."
// command from parts (interface, filter, verbosity, count, timestamp), or
// paste an existing command to have every argument explained.
//
// Pure and deterministic (D-49): a model of the FortiOS sniffer command
// grammar and its documented verbosity/timestamp semantics, never a probe. It
// never runs a sniffer, never opens a socket, never fetches. Clean-room from
// Fortinet's own sniffer documentation and CLI reference.
// ============================================================================

import { run, build } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { run, build, VERBOSITY, TSFORMATS } from "./compute";
export type {
  SnifferParams, SnifferArg, SnifferNote, SnifferMode, SnifferResult,
  VerbosityInfo, TsFormatInfo, ToolRunResult,
} from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";
export type { SnifferVector } from "./golden-vectors";

/** The D-49 declarative manifest for the fortios-sniffer-builder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Fortinet FortiGate & FortiOS",
  toolSlug: "fortios-sniffer-builder",
  canonicalAliases: [
    "fortios-sniffer",
    "fortigate-sniffer",
    "sniffer-builder",
    "diagnose-sniffer-packet",
    "diag-sniffer-packet",
    "fortigate-packet-capture",
  ],
  inputDetectors: [
    {
      // The full command is unmistakable.
      kind: "regex",
      pattern: "diagnose\\s+sniffer\\s+packet",
      priority: 9,
      example: "diagnose sniffer packet any 'host 10.1.1.1 and icmp' 4 0 l",
    },
    {
      // The common abbreviation.
      kind: "regex",
      pattern: "diag\\s+sniff\\s+packet",
      priority: 8,
      example: "diag sniff packet port1 'tcp port 443' 6 100 a",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-connects"],
  // A sniffer command can carry internal IPs / hostnames -> shareable fragment.
  shareSafetyDefault: "fragment",

  learnLinks: [
    "learn/reading-a-fortigate-sniffer-trace",
  ],
  sources: [
    { id: "fgt-admin-sniffer", label: "Fortinet FortiGate Administration Guide: Performing a sniffer trace or packet capture (diagnose sniffer packet syntax; interface/filter/verbose/count/timestamp; 'any' interface; fgt2eth.pl for pcap)", url: "https://docs.fortinet.com/document/fortigate/latest/administration-guide/680228/performing-a-sniffer-trace-cli-and-packet-capture" },
    { id: "fgt-cli-sniffer", label: "Fortinet FortiOS CLI Reference: diagnose sniffer packet (verbosity levels 1-6 and what each prints; the a/l timestamp codes; packet count)", url: "https://help.fortinet.com/fa/cli-olh/5-6-1/Document/1600_diagnose/sniffer.htm" },
    { id: "fgt-community-sniffer", label: "Fortinet Community: Using the FortiOS built-in packet sniffer for capturing packets (worked examples; filter expressions; VLAN-tag and 'any'/cooked-capture notes; auto-asic-offload caveat)", url: "https://community.fortinet.com/t5/FortiGate/Troubleshooting-Tip-Using-the-FortiOS-built-in-packet-sniffer/ta-p/194222" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure engine. */
export { run as runTool };

export const __selftest = verifyVectors;
