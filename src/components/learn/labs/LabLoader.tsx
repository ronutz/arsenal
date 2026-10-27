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
  // ---- labs 2a, routing: BGP best path, OSPF neighbours and DR (2026-10-26) ----
  // The BGP best-path lab: "BGP: how the internet decides where traffic goes".
  "bgp-best-path": dynamic(() => import("./BgpBestPathLab")),
  // The OSPF neighbour and DR lab: "OSPF: the map, the math, and area 0".
  "ospf-neighbour-and-dr": dynamic(() => import("./OspfNeighbourAndDrLab")),
  // ---- labs 2b, web: HTTP freshness, cookie send decision (2026-10-26) ----
  // The HTTP freshness lab: "HTTP caching and personalised content".
  "http-freshness": dynamic(() => import("./HttpFreshnessLab")),
  // The cookie send-decision lab: "HTTP Cookies: State Over a Stateless Protocol" and "Cookie Security Flags".
  "cookie-send-decision": dynamic(() => import("./CookieSendDecisionLab")),
  // ---- labs 2c, TLS 1.3 handshake shapes, F5 monitor timing (2026-10-26) ----
  // The TLS 1.3 handshake shapes lab: "TLS 1.2 vs TLS 1.3 vs DTLS vs QUIC".
  "tls13-handshake-shapes": dynamic(() => import("./Tls13HandshakeShapesLab")),
  // The F5 monitor timing lab: "How LTM Health Monitors Decide Up or Down".
  "f5-monitor-timing": dynamic(() => import("./F5MonitorTimingLab")),
  // ---- labs 3a, transport and NAT: TCP states, TCP congestion window, NAT/PAT table (2026-10-26) ----
  // The TCP states lab: "TCP Connection Lifecycle".
  "tcp-states": dynamic(() => import("./TcpStatesLab")),
  // The TCP congestion window lab: "TCP Connection Lifecycle".
  "tcp-congestion-window": dynamic(() => import("./TcpCongestionWindowLab")),
  // The NAT/PAT table lab: "NAT Explained".
  "nat-pat-table": dynamic(() => import("./NatPatTableLab")),
  // ---- labs 3b, LAN and wireless: VRRP, LACP hashing, Wi-Fi airtime (2026-10-26) ----
  // The VRRP election lab: "First-hop redundancy: VRRP, HSRP, and the gateway that is a fiction".
  "vrrp-master-election": dynamic(() => import("./VrrpMasterElectionLab")),
  // The LACP hashing lab: "Link aggregation and LACP".
  "lacp-hashing": dynamic(() => import("./LacpHashingLab")),
  // The Wi-Fi airtime lab: "Wi-Fi: a shared medium pretending to be a cable".
  "wifi-airtime": dynamic(() => import("./WifiAirtimeLab")),
  // ---- labs 3c, web, identity and DNS: CORS preflight, Kerberos, DNSSEC chain (2026-10-26) ----
  // The CORS preflight lab: "CORS Explained: The Border Control of the Browser".
  "cors-preflight": dynamic(() => import("./CorsPreflightLab")),
  // The Kerberos exchanges lab: "Kerberos and SPNEGO: How Silent Desktop SSO Actually Works".
  "kerberos-exchanges": dynamic(() => import("./KerberosExchangesLab")),
  // The DNSSEC chain lab: "DNSSEC end to end: from the root's key to a validated answer".
  "dnssec-chain": dynamic(() => import("./DnssecChainLab")),
  // ---- labs 4, vendor: BIG-IP virtual server precedence, FortiGate session-dirty (2026-10-26) ----
  // The virtual server precedence lab: "How a BIG-IP Virtual Server Works".
  "bigip-vs-precedence": dynamic(() => import("./BigipVsPrecedenceLab")),
  // The session-dirty lab: "FortiGate Firewall Policies and NAT: Matching Order, SNAT, and DNAT".
  "fortigate-session-dirty": dynamic(() => import("./FortigateSessionDirtyLab")),
};

/** Render the lab with this id; an unknown id renders nothing (the build guard makes it impossible). */
export default function LabLoader({ id }: { id: string }) {
  // The component for the id.
  const Lab = LABS[id];
  // Nothing when unknown, the lab otherwise.
  return Lab ? <Lab /> : null;
}
