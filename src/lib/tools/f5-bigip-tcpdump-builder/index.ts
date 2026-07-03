// ============================================================================
// src/lib/tools/f5-bigip-tcpdump-builder/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING BIG-IP TCPDUMP BUILDER MODULE - {manifest, run, vectors}.
//
// run() takes an options OBJECT (there is no single input string to route from)
// and returns the assembled command plus advisories. The engine is synchronous
// and pure: it formats a command for the user to run on their own BIG-IP and
// executes nothing itself. The component imports buildCommand and DEFAULT_OPTIONS
// directly; run() is the registry-facing entry point.
// ============================================================================

import { buildCommand, DEFAULT_OPTIONS, type TcpdumpOptions, type TcpdumpResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, TCPDUMP_GOLDEN_VECTORS } from "./golden-vectors";

export { buildCommand, DEFAULT_OPTIONS } from "./compute";
export type {
  TcpdumpOptions,
  TcpdumpResult,
  TmmDetail,
  NameResolution,
  Snaplen,
  Verbosity,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, TCPDUMP_GOLDEN_VECTORS } from "./golden-vectors";

/** The D-49 declarative manifest for the BIG-IP tcpdump builder. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "F5 LTM, iRules & platform",
  toolSlug: "f5-bigip-tcpdump-builder",
  canonicalAliases: ["bigip-tcpdump-builder" /* pre-rename slug, 2026-07-03 */, "f5-tcpdump", "bigip-packet-capture", "tmm-tcpdump", "tcpdump-builder"],
  inputDetectors: [
    {
      // A builder assembles from controls; there is no pasted string to detect.
      kind: "heuristic",
      priority: 1,
      example: "interface 0.0, high detail, both sides, filtered by host",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [],
  // The filter/interface may contain internal IPs, so a result permalink keeps
  // options in the URL fragment, never an indexable path. The tool only FORMATS
  // a command; it never runs it.
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: [
    "learn/bigip-tcpdump-syntax",
    "learn/tmm-detail-and-peer-flows",
    "learn/capturing-on-vlans-and-trunks",
    "learn/reading-a-bigip-capture",
    "learn/bigip-tcpdump-safety",
  ],
  sources: [
    {
      id: "f5-k411",
      label: "F5 K411 - Overview of packet tracing with the tcpdump utility",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K411",
      access_date: "2026-06-30",
      scope: "BIG-IP tcpdump options, the 0.0 interface, snaplen, filters, file output",
      status: "active",
    },
    {
      id: "f5-k13637",
      label: "F5 K13637 - Capturing internal TMM information with tcpdump",
      type: "vendor-doc",
      url: "https://my.f5.com/manage/s/article/K13637",
      access_date: "2026-06-30",
      scope: "the :n / :nn / :nnn TMM detail suffix and the :p both-sides modifier",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/** run - the registry-facing entry point: assemble the command from options. */
export function run(input: TcpdumpOptions): TcpdumpResult {
  return buildCommand(input);
}

export const goldenVectors = TCPDUMP_GOLDEN_VECTORS;
