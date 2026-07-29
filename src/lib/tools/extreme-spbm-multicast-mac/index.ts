// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// THE SELF-DESCRIBING SPBM MULTICAST B-MAC TOOL - {manifest, run, vectors}.
//
// Works both ways: build the group address a node will compute for a service,
// or take an address out of `show isis spbm multicast-fib` and get back whose
// tree it is and which service it carries.
//
// Paired article: learn/spbm-multicast-addresses-are-computed-not-learned.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, SPBM_VECTORS } from "./golden-vectors";

export {
  buildMulticastMac,
  decodeMulticastMac,
  parseNickname,
  parseIsid,
  formatNickname,
  analyse,
  SpbmParseError,
} from "./compute";
export type { Nickname, SpbmMulticastResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, SPBM_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Extreme Networks",
  toolSlug: "extreme-spbm-multicast-mac",
  canonicalAliases: ["spbm-group-mac", "isid-to-mac", "spb-multicast-fib-decoder"],
  inputDetectors: [
    { kind: "regex", pattern: "^\\s*03([:.-][0-9a-f]{2}){5}", priority: 7, example: "03:00:41:00:04:4d" },
    { kind: "regex", pattern: "^\\s*[0-9a-f]\\.[0-9a-f]{2}\\.[0-9a-f]{2}\\s*$", priority: 5, example: "0.00.10" },
  ],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Pure arithmetic on two integers. Nothing is executed, fetched or resolved.",
    "No network access: the address is derived, never looked up.",
    "Bounded work regardless of input.",
  ],
  shareSafetyDefault: "fragment",

  knownLimitations: [
    "Computes the group address only. B-VID selection, the shortest path tree itself, IS-IS adjacency and the unicast backbone MAC are all out of scope - the unicast B-MAC is the chassis address and is not derived from anything.",
    "A nickname whose first field collides with the fixed 0x30000 prefix produces an address that cannot be decoded back to one nickname. Every documented example uses a first field of 0; anything else is flagged as unverified rather than answered.",
    "The I-SID is treated as a number. Whether a given value is a Layer 2 VSN, a Layer 3 VSN or something else is a configuration question this does not model.",
  ],

  sources: [
    {
      id: "voss-spbm-multicast-fib",
      label: "Extreme Networks VOSS User Guide: SPBM Multicast FIB",
      type: "vendor-docs",
      url: "https://documentation.extremenetworks.com/VOSS/SW/89/vossuserguide/GUID-5A2D62D9-C3C9-47FF-BF6B-96C6886BA3E0.shtml",
      access_date: "2026-07-28",
      scope:
        "the construction rule (nickname OR 0x30000, then the I-SID in hex), the worked example for nickname 0.00.10 with I-SID 100, and sample multicast FIB output",
      status: "active",
    },
    {
      id: "ieee-8021aq",
      label: "IEEE 802.1aq Shortest Path Bridging",
      type: "standard",
      url: "https://standards.ieee.org/ieee/802.1aq/4508/",
      access_date: "2026-07-28",
      scope: "SPBM group addressing: source-specific group MAC formed from SPSourceID and I-SID",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = SPBM_VECTORS;
