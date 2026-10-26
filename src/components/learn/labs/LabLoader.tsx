"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/LabLoader.tsx
// ----------------------------------------------------------------------------
// FROM A LAB ID TO ITS COMPONENT (2026-10-26). Every Learn article is served by
// one route, so a static import of every lab here would put every lab's code on
// every interactive article. Each lab is therefore its own dynamic chunk: the
// page that embeds <Lab id="vlan-trunk" /> loads the VLAN lab's code and no
// other's. Rendered on the server at build time too, so the lab's opening state
// is in the exported HTML before any script runs.
//
// A new lab adds ONE line to LABS (its id and its import). The id must match
// src/content/learn/labs.ts; scripts/check-learn-labs.mjs checks both lists.
// ============================================================================

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Every lab's component, each loaded as its own chunk. */
const LABS: Record<string, ComponentType> = {
  // The VLAN trunk lab: "VLANs and 802.1Q trunking".
  "vlan-trunk": dynamic(() => import("./VlanTrunkLab")),
  // ---- NetFun labs (2026-10-26) ----
  // The request-through-layers lab: "The OSI Model in Practice".
  "request-through-layers": dynamic(() => import("./RequestThroughLayersLab")),
  // The Ethernet transfer budget lab: "Bits, bytes and the two kinds of kilo".
  "ethernet-transfer-budget": dynamic(() => import("./EthernetTransferBudgetLab")),
  // The Ethernet frame builder lab: "The Ethernet frame, field by field".
  "ethernet-frame-builder": dynamic(() => import("./EthernetFrameBuilderLab")),
  // The ARP and switch tables lab: "ARP and MAC Addresses: How IP Finds Ethernet".
  "arp-and-switch-tables": dynamic(() => import("./ArpAndSwitchTablesLab")),
  // The spanning tree lab: "Spanning tree in one article".
  "stp-root-election": dynamic(() => import("./StpRootElectionLab")),
  // The VLSM allocation-order lab: "A VLSM allocation, worked end to end".
  "vlsm-allocation-order": dynamic(() => import("./VlsmAllocationOrderLab")),
  // The IPv6 host configuration lab: "How IPv6 hosts get addresses: SLAAC and DHCPv6".
  "ipv6-host-configuration-sources": dynamic(() => import("./Ipv6HostConfigurationSourcesLab")),
  // The DHCP lease lab: "DHCP: the Lease Lifecycle Behind Automatic Addressing".
  "dhcp-lease-states": dynamic(() => import("./DhcpLeaseStatesLab")),
  // The two-caches lab: "Authoritative vs Non-Authoritative Answers".
  "dns-two-caches": dynamic(() => import("./DnsTwoCachesLab")),
  // The RIB-to-FIB lab: "Static routes, longest prefix match and administrative distance".
  "rib-to-fib": dynamic(() => import("./RibToFibLab")),
  // The BFD-versus-hellos lab: "BFD: when a link is up and dead at the same time".
  "bfd-versus-hellos": dynamic(() => import("./BfdVersusHellosLab")),
  // ---- protocol labs: transport, HTTP, TLS, identity, regex, VPN (2026-10-26) ----
  // The retry fan-out lab: "Retries, timeouts and idempotency: when the answer never arrives".
  "retry-fan-out": dynamic(() => import("./RetryFanOutLab")),
  // The TCP window ceiling lab: "TCP Connection Lifecycle".
  "tcp-window-ceiling": dynamic(() => import("./TcpWindowCeilingLab")),
  // The regex partitions lab: "Catastrophic Backtracking and ReDoS".
  "regex-partitions": dynamic(() => import("./RegexPartitionsLab")),
  // ---- operations, NGINX and Extreme labs (2026-10-26) ----
  // ---- vendor platform labs (2026-10-26) ----
  // ---- BIG-IP labs (2026-10-26) ----
  // The profile inheritance lab: "Profiles on a Virtual Server".
  "profile-inheritance": dynamic(() => import("./ProfileInheritanceLab")),
  // The payload byte-offsets lab: "Rewriting Content on BIG-IP".
  "payload-byte-offsets": dynamic(() => import("./PayloadByteOffsetsLab")),
  // The SNAT port budget lab: "SNAT and the Return-Traffic Problem".
  "snat-port-budget": dynamic(() => import("./SnatPortBudgetLab")),
  // The CMP concentration lab: "iRules, CMP, and the static:: namespace".
  "cmp-concentration": dynamic(() => import("./CmpConcentrationLab")),
};

/** Render the lab with this id; an unknown id renders nothing (the build guard makes it impossible). */
export default function LabLoader({ id }: { id: string }) {
  // The component for the id.
  const Lab = LABS[id];
  // Nothing when unknown, the lab otherwise.
  return Lab ? <Lab /> : null;
}
