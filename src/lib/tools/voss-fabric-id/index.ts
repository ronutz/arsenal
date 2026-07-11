// ============================================================================
// src/lib/tools/voss-fabric-id/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING VOSS FABRIC-IDENTIFIER DECODER - a {manifest, run,
// vectors} triple. Decodes an SPBM I-SID (24-bit), nickname (20-bit, X.XX.XX),
// or system-id / B-MAC (48-bit), auto-detecting by shape. Pure, offline.
// ============================================================================

import { analyzeFabricId } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { analyzeFabricId } from "./compute";
export type { FabricIdResult, FabricIdKind } from "./compute";
export { FABRIC_ID_BOUNDS } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/** D-49 run entrypoint (API parity). */
export function run(input: string) {
  return analyzeFabricId(input);
}

export const manifest = Object.freeze({
  toolFamily: "Networking & addressing",
  toolSlug: "voss-fabric-id",
  canonicalAliases: ["i-sid", "isid", "isid-decoder", "spbm-nickname", "voss-nickname", "spbm-i-sid", "fabric-connect-id", "voss-i-sid"],
  inputDetectors: [
    { kind: "regex", pattern: "^[0-9a-fA-F]\\.[0-9a-fA-F]{2}\\.[0-9a-fA-F]{2}$", priority: 7, example: "C.30.00" },
    { kind: "regex", pattern: "^([0-9a-fA-F]{4}\\.){2}[0-9a-fA-F]{4}$", priority: 6, example: "00bb.0021.0001" },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/voss-i-sid-and-vsns"],
  sources: [
    {
      id: "voss-isid",
      label: "Extreme VOSS User Guide: I-SID (24-bit service identifier)",
      type: "docs",
      url: "https://documentation.extremenetworks.com/VOSS/SW/89/VOSSUserGuide/GUID-B71193C3-7579-4917-8FE3-839F01ABDCA9.shtml",
      access_date: "2026-07-11",
      scope: "the 24-bit I-SID and its role in Layer 2 and Layer 3 VSNs",
      status: "active",
    },
    {
      id: "voss-spbm-isis",
      label: "Extreme VOSS User Guide: SPBM and IS-IS Infrastructure Fundamentals",
      type: "docs",
      url: "https://documentation.extremenetworks.com/VOSS/SW/89/vossuserguide/GUID-1BC71501-66E0-4458-807F-CB320C884AD4.shtml",
      access_date: "2026-07-11",
      scope: "nicknames, B-VLANs, B-MAC forwarding, and the IS-IS control plane",
      status: "active",
    },
    {
      id: "voss-nickname-server",
      label: "Extreme VOSS User Guide: Configure Dynamic Nickname Assignment",
      type: "docs",
      url: "https://documentation.extremenetworks.com/VOSS/SW/89/VOSSUserGuide/GUID-227C21E8-9EA7-4AA7-891D-02A1A7F22C27.shtml",
      access_date: "2026-07-11",
      scope: "the X.XX.XX nickname format and nick-name server prefix ranges",
      status: "active",
    },
  ],
  credits: [
    { handle: "extreme-docs", display_name: "Extreme Networks documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = ReturnType<typeof run>;
