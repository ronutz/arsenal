// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/content/learn/labs.ts
// ----------------------------------------------------------------------------
// THE LEARN LAB REGISTRY (PRIME, 2026-10-26 15:20: "Merge the useful parts into
// the existing structure, selectively ... keep one thing: an 'Interactive'
// marker on the Learn index and the series rails, so learners can still find
// every lab").
//
// A LAB is a small interactive model that lives INSIDE a Learn article, as the
// article's interactive companion: a few controls, a computed result that says
// what happens and why, an Example and a Reset button, and a note on what the
// model leaves out. It is not a tool (tools stand alone at /tools/<slug> and
// carry the full D-49 manifest); it is part of the article it explains, written
// into the article's MDX as <Lab id="<id>" /> in English and in Portuguese.
//
// Each lab has, by convention (guarded by scripts/check-learn-labs.mjs):
//   - src/lib/labs/<id>/compute.ts        the pure, deterministic model;
//   - src/lib/labs/<id>/golden-vectors.ts  its checked cases, with a dated set id
//     and verifyVectors(), which scripts/run-golden-vectors.mts runs at prebuild;
//   - a client component registered in src/components/learn/labs/LabLoader.tsx;
//   - its words in the "learnLabs.<id>" namespace of the en and pt-BR packs.
//
// WHY A SIGNED LIST: the marker on the Learn index, the series rails and the
// article header is derived from the articles' bodies (an article that embeds a
// lab is interactive), and this list is what the guard checks the bodies
// against: every <Lab id> names a lab registered here, every lab registered here
// is embedded in the article it names, in both authored languages.
// ============================================================================

/** One lab: its id (also its message namespace and its anchor, #lab-<id>) and the articles that embed it. */
export interface LearnLab {
  /** Stable id: lower-case words joined by hyphens. */
  id: string;
  /** The article slugs that embed this lab with <Lab id="..." />, the first being its home article. */
  articles: string[];
}

/** Every lab, in the order they were added. */
export const LEARN_LABS: LearnLab[] = [
  // The framework's reference lab (2026-10-26): a frame crossing an 802.1Q trunk, tagged or untagged, and where it lands.
  { id: "vlan-trunk", articles: ["vlans-and-8021q-trunking"] },
  // ---- NetFun labs (2026-10-26) ----
  // One HTTPS request on the LAN, through a router or through a reverse proxy: addresses, TTL, connections and TLS per link.
  { id: "request-through-layers", articles: ["osi-model-in-practice"] },
  // One file cut into packets and Ethernet frames: the short last packet, padding, tag, preamble and gap, and the time on the wire.
  { id: "ethernet-transfer-budget", articles: ["bits-bytes-and-the-two-kinds-of-kilo"] },
  // One frame built field by field: the destination's I/G and U/L bits, padding, the tag, and frames per second at line rate.
  { id: "ethernet-frame-builder", articles: ["the-ethernet-frame-field-by-field"] },
  // One packet through A's ARP cache and the switch's MAC table: ARP, learning, flooding, and a stale entry after a move.
  { id: "arp-and-switch-tables", articles: ["arp-and-mac-addresses"] },
  // Four switches in a square with a diagonal: root election, root ports, designated ports and the links that block.
  { id: "stp-root-election", articles: ["spanning-tree-in-one-article"] },
  // The article's five requests placed largest first, as they arrived or smallest first, with every address accounted for.
  { id: "vlsm-allocation-order", articles: ["vlsm-worked-example"] },
  // A host's IPv6 addresses, default route and DNS servers from RAs, SLAAC, stateless or stateful DHCPv6 and RDNSS.
  { id: "ipv6-host-configuration-sources", articles: ["ipv6-address-configuration"] },
  // One DHCP client through T1, T2 and expiry, with the server on its subnet, behind a relay agent or out of reach.
  { id: "dhcp-lease-states", articles: ["dhcp-lease-lifecycle"] },
  // The zone's server and two resolvers asked at the same moment after a change: TTLs, AA, SERVFAIL and serve-stale.
  { id: "dns-two-caches", articles: ["authoritative-vs-non-authoritative-answers"] },
  // Candidate routes installed by resolution, metric and distance, then a packet routed by the longest installed match.
  { id: "rib-to-fib", articles: ["static-routes-and-longest-match"] },
  // A dead path behind an up port: BFD's detection time against OSPF's dead interval, BGP's hold time or a static route.
  { id: "bfd-versus-hellos", articles: ["bfd-when-a-link-is-up-and-dead"] },
  // ---- protocol labs: transport, HTTP, TLS, identity, regex, VPN (2026-10-26) ----
  // Retries multiplying down a chain of services: the calls a failing service receives for one failed user action.
  { id: "retry-fan-out", articles: ["retries-timeouts-and-idempotency"] },
  // One TCP connection: the window ceiling, the bandwidth-delay product, and which of the two limits the throughput.
  { id: "tcp-window-ceiling", articles: ["tcp-connection-lifecycle", "bigip-l4-protocol-profiles"] },
  // The ways (a+)+ can split a run of a's, counted (never run): the doubling behind catastrophic backtracking.
  { id: "regex-partitions", articles: ["regex-catastrophic-backtracking"] },
  // ---- operations, NGINX and Extreme labs (2026-10-26) ----
  // ---- vendor platform labs (2026-10-26) ----
  // ---- BIG-IP labs (2026-10-26) ----
  // A parent profile's edit and two children: who follows it, and why an override equal to the parent stays put.
  { id: "profile-inheritance", articles: ["bigip-profiles-on-a-virtual-server"] },
  // Characters against UTF-8 octets in a body, the byte offset an HTTP::payload edit needs, and a collect's memory bound.
  { id: "payload-byte-offsets", articles: ["bigip-content-rewriting"] },
  // Where the member's reply goes with and without SNAT, and the source-port budget towards one busy member.
  { id: "snat-port-budget", articles: ["bigip-snat-and-return-traffic"] },
  // How a global variable demotes a virtual server to one TMM, and how one subtable concentrates its table work.
  { id: "cmp-concentration", articles: ["irules-cmp-and-static-namespace"] },
];

/** The MDX tag that embeds a lab: exactly <Lab id="<id>" />, one per line, nothing else on the tag. */
export const LAB_TAG_RE = /<Lab\s+id="([a-z0-9]+(?:-[a-z0-9]+)*)"\s*\/>/g;

/** The lab ids an article body embeds, in order of appearance, each once. */
export function labIdsIn(body: string): string[] {
  // Every match of the tag, its id captured.
  const ids = [...body.matchAll(LAB_TAG_RE)].map((m) => m[1]);
  // De-duplicated, first appearance kept.
  return [...new Set(ids)];
}

/** The registry entry for an id, or undefined. */
export function findLab(id: string): LearnLab | undefined {
  // A linear scan: the list is short and read at build time only.
  return LEARN_LABS.find((l) => l.id === id);
}
