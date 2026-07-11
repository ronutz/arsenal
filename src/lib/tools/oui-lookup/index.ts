// ============================================================================
// src/lib/tools/oui-lookup/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING OUI / MAC LOOKUP - a {manifest, run, vectors} triple.
// Normalize a MAC address, read its unicast/multicast and universal/local bits,
// and resolve the 24-bit OUI to its registered organization from an embedded
// IEEE MA-L snapshot. Bounded, offline, computes what it shows.
//
// run() imports the full snapshot (server-side, via the tool registry); the
// client component lazy-loads the same snapshot so its page stays light.
// ============================================================================

import { analyzeMac } from "./compute";
import { getOuiMap } from "./oui-data";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { normalizeMac, analyzeMac } from "./compute";
export type { OuiResult } from "./compute";
export { getOuiMap, OUI_MA_L_SNAPSHOT_DATE } from "./oui-data";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/** D-49 run entrypoint (API parity): full MAC/OUI analysis with vendor lookup. */
export function run(input: string) {
  const map = getOuiMap();
  return analyzeMac(input, (oui) => map.get(oui) ?? null);
}

/** The D-49 declarative manifest for the oui-lookup tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Networking & addressing",
  toolSlug: "oui-lookup",
  canonicalAliases: ["mac-lookup", "mac-vendor", "oui-vendor", "mac-address-lookup", "oui-decoder"],
  inputDetectors: [
    {
      kind: "regex",
      // A MAC-48 in colon or hyphen form: 00:11:22:33:44:55.
      pattern: "^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$",
      priority: 7,
      example: "00:1b:54:11:22:33",
    },
    {
      kind: "regex",
      // Cisco dotted triple: 0011.2233.4455.
      pattern: "^([0-9a-fA-F]{4}\\.){2}[0-9a-fA-F]{4}$",
      priority: 7,
      example: "0000.0c11.2233",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param", // a MAC/OUI is a non-sensitive hardware identifier

  // -- Teaching & provenance --
  learnLinks: ["learn/what-is-an-oui"],
  sources: [
    {
      id: "ieee-oui-mal",
      label: "IEEE Registration Authority: MA-L (OUI) public listing",
      type: "registry",
      url: "https://standards-oui.ieee.org/oui/oui.csv",
      access_date: "2026-07-10",
      scope: "the OUI-to-organization assignments embedded as a point-in-time snapshot",
      status: "active",
    },
    {
      id: "ieee-802",
      label: "IEEE Std 802-2014: universal/local and individual/group bits of a MAC address",
      type: "spec",
      url: "https://standards.ieee.org/ieee/802/6847/",
      access_date: "2026-07-10",
      scope: "the two significant bits of the first octet that this tool reads",
      status: "active",
    },
  ],
  credits: [
    { handle: "ieee-ra", display_name: "IEEE Registration Authority", role: "OUI registry", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = ReturnType<typeof run>;
