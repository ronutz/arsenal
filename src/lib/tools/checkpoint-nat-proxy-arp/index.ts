// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// THE SELF-DESCRIBING CHECK POINT NAT BLACK-HOLE PREDICTOR.
//
// Answers why a correct-looking NAT delivers nothing, which is usually a layer
// below the rule base: an address in a connected subnet that no device is
// answering ARP for.
//
// Paired article: learn/checkpoint-nat-proxy-arp-and-the-silent-black-hole.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, NAT_VECTORS } from "./golden-vectors";

export { evaluateNat, NatParseError } from "./compute";
export type { NatScenario, NatVerdict, NatMethod, NatType } from "./compute";
export { GOLDEN_VECTOR_SET_ID, NAT_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Check Point",
  toolSlug: "checkpoint-nat-proxy-arp",
  canonicalAliases: ["nat-black-hole", "proxy-arp-checker", "manual-nat-not-working"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Subnet arithmetic on two addresses. Nothing is executed, resolved or contacted.",
    "No network access: no ARP is sent and no gateway is queried.",
    "Bounded work regardless of input.",
  ],
  shareSafetyDefault: "fragment",

  knownLimitations: [
    "*** IT DOES NOT RANK THE NAT RULE BASE. *** Published sources contradict each other on whether manual rules are evaluated before or after the automatic ones, and Check Point's own administration guide describes them as enforced differently without settling the order. Ranking them would mean presenting a guess as a computation.",
    "One interface at a time. A gateway with several interfaces facing the same traffic is a topology question this does not model.",
    "IPv4 only. NAT64 and IPv6 addressing are out of scope.",
    "It reasons about layer 2 reachability, not about whether the access policy permits the connection once it arrives.",
  ],

  sources: [
    {
      id: "cp-automatic-manual-nat",
      label: "Check Point Security Management Administration Guide: Automatic and Manual NAT Rules",
      type: "vendor-docs",
      url: "https://sc1.checkpoint.com/documents/R80.30/WebAdminGuides/EN/CP_R80.30_SecurityManagement_AdminGuide/94349.htm",
      access_date: "2026-07-28",
      scope:
        "how automatic rules are generated for static and hide NAT, and that automatic and manual rules are enforced differently",
      status: "active",
    },
    {
      id: "checkmates-proxy-arp",
      label: "Check Point CheckMates: proxy ARP behaviour for automatic NAT at policy install",
      type: "community",
      url: "https://community.checkpoint.com/t5/General-Topics/Proxy-arp-issue-automatic-NAT-rule/td-p/261369",
      access_date: "2026-07-28",
      scope:
        "automatic static NAT adds the proxy ARP during policy install; the Global Properties settings that govern it",
      status: "active",
    },
    {
      id: "wwt-nat-guide",
      label: "WWT: complete guide to Check Point Network Address Translation",
      type: "third-party",
      url: "https://www.wwt.com/blog/complete-guide-to-check-point-network-address-translation",
      access_date: "2026-07-28",
      scope:
        "manual NAT rules do not generate supporting ARP entries, so the administrator must create them",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = NAT_VECTORS;
