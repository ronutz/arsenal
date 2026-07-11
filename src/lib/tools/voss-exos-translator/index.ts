// ============================================================================
// src/lib/tools/voss-exos-translator/index.ts
// ----------------------------------------------------------------------------
// THE VOSS <-> EXOS COMMAND TRANSLATOR - a {manifest, run, vectors} triple.
// A curated, grounded reference (not a config generator): run(query) filters
// the mapping table so you can look up how a fabric task is expressed in each
// CLI. Pure and offline.
// ============================================================================

import { searchMappings } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { MAPPINGS, searchMappings, searchIds } from "./compute";
export type { CliMapping } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/** D-49 run entrypoint: filter the mapping table by a free-text query. */
export function run(query: string) {
  return searchMappings(query);
}

export const manifest = Object.freeze({
  toolFamily: "Networking & addressing",
  toolSlug: "voss-exos-translator",
  canonicalAliases: ["voss-exos", "exos-voss", "fabric-cli-translator", "spbm-cli-map", "voss-exos-cli", "fabric-attach-cli"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/voss-vs-exos"],
  sources: [
    {
      id: "exos-no-spbm-fa",
      label: "Extreme Fabric Installation & Configuration Student Guide (2024): EXOS does not support SPBM; works with fabric via Fabric Attach",
      type: "docs",
      url: "https://documentation.extremenetworks.com/FABRICENGINE/SW/91/FabricEngineUserGuide/",
      access_date: "2026-07-11",
      scope: "the EXOS-does-not-run-SPBM fact and the Fabric Attach integration model",
      status: "active",
    },
    {
      id: "voss-l3vsn-howto",
      label: "Extreme Portal How To: Configure L3VSN (VOSS SPBM/IS-IS, L2 VSN, and L3 VSN CLI)",
      type: "docs",
      url: "https://extreme-networks.my.site.com/ExtrArticleDetail?an=000082930",
      access_date: "2026-07-11",
      scope: "verified VOSS router isis / spbm / nick-name / b-vid / vlan i-sid / ipvpn commands",
      status: "active",
    },
    {
      id: "voss-l2-cmdref",
      label: "Extreme VOSS command reference: vlan i-sid and vlan members syntax",
      type: "docs",
      url: "https://documentation.extremenetworks.com/VOSS/SW/89/vossuserguide/GUID-1BC71501-66E0-4458-807F-CB320C884AD4.shtml",
      access_date: "2026-07-11",
      scope: "vlan i-sid <vid> <isid> and vlan members add syntax",
      status: "active",
    },
    {
      id: "exos-cmdref",
      label: "ExtremeXOS Command Reference / User Guide: create vlan, configure vlan add ports, Fabric Attach, IS-IS",
      type: "docs",
      url: "https://documentation.extremenetworks.com/exos_30.4/GUID-AC9E8550-3F33-409F-9689-E85BF305B749.shtml",
      access_date: "2026-07-11",
      scope: "EXOS VLAN, Fabric Attach, and IS-IS command syntax",
      status: "active",
    },
  ],
  credits: [
    { handle: "extreme-docs", display_name: "Extreme Networks documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = ReturnType<typeof run>;
