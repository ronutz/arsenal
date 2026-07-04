// ============================================================================
// src/lib/tools/f5-l4-profile-explainer/compute.ts
// ----------------------------------------------------------------------------
// EXPLAINS LTM'S L4 PROTOCOL PROFILES THE WAY F5'S OWN SOURCES TELL THE
// STORY. Three families, one decision:
//
//   FULL-PROXY TCP: the standard tcp profile and its tuned descendants, two
//   independent TCP stacks with every LTM feature available. The 13.0
//   announcement (F5's own DevCentral) reorganized this family into LIVING
//   and LEGACY: f5-tcp-wan, f5-tcp-lan, and f5-tcp-mobile are updated
//   versions of tcp-wan-optimized, tcp-lan-optimized, and
//   tcp-mobile-optimized; f5-tcp-progressive is the general-use profile
//   carrying the very latest features. The four f5-* profiles plus the
//   default tcp are "living": F5 continually updates them with best
//   practices, new features land in progressive immediately and in the
//   conservative ones after a couple of releases, and all five are
//   read-only, so tuning means creating a child profile (where the custom
//   flag pins a setting against future pushes). The legacy trio is frozen
//   where it stood and still ships (the 21.0 reference lists both families
//   side by side) for configurations that depend on it.
//
//   FASTL4: not a TCP proxy at all. The profiles reference: assigning a
//   Fast L4 profile lets the Packet Velocity ASIC (PVA) hardware, where
//   supported, process some or all of the Layer 4 traffic; it pairs with
//   Performance (Layer 4), Forwarding (Layer 2), and Forwarding (IP)
//   virtual servers, and the operations guide states the when plainly:
//   little or no L4/L7 processing required, with load-balancing decisions
//   limited in scope since minimal L7 information is available. The man
//   page supplies the knobs this card carries with their defaults:
//   pva-acceleration (full | none | partial | dedicated), the loose pair
//   for asymmetric paths (loose-initialization accepts any TCP packet
//   rather than requiring a SYN; loose-close closes on the first FIN from
//   either side; both default disabled), tcp-timestamp-mode and
//   tcp-wscale-mode both defaulting to preserve (pass-through posture),
//   and late-binding, the ePVA gem where an iRule reads a FIX packet to
//   pick a pool and then hands the stream to hardware.
//
//   FASTHTTP: the profiles reference calls it a configuration tool that
//   combines selected features from the TCP Express, HTTP, and OneConnect
//   profiles into a single profile optimized for network performance, and
//   its when-to-use list is the card: no SSL traffic management, no
//   compression, pipelining, or RAM Cache, no need to maintain source IP
//   addresses, servers supporting keep-alive, and basic iRule support only
//   (CLIENT_ACCEPTED, SERVER_CONNECTED, HTTP_REQUEST are the reference's
//   own examples). The operations guide's verdict: possibly the fastest
//   way to pass HTTP under certain circumstances, with specific
//   requirements and limitations, read K8024 before deploying.
//
// Reference posture, like the APM SSO explainer: curated cards, alias
// lookup, full catalogue. Stanza parsing with a full option audit is a
// documented roadmap enhancement, not silently absent.
//
// Sources: DevCentral "F5 Unveils New Built-In TCP Profiles" (the living
// story, verbatim), techdocs LTM Profiles Reference Protocol Profiles
// (13.1 for FastL4 purpose and FastHTTP composition and criteria; 21.0
// confirming both TCP families still ship), tmsh ltm_profile_fastl4 v13
// man page (option semantics and defaults), K93100324 LTM operations
// guide chapter 4 (virtual-server pairings and the FastL4/FastHTTP
// verdicts), with K8024 and K09948701 as the canonical overview K
// articles. All accessed 2026-07-03.
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileFamily = "full-proxy" | "living" | "legacy" | "accelerated" | "light-proxy";

export interface L4Profile {
  id: string;
  name: string;
  aliases: string[];
  family: ProfileFamily;
  story: string;
  whenToUse: string[];
  tradeoffs: string[];
  quirks: string[];
}

export interface L4ProfileResult {
  ok: boolean;
  mode: "profile" | "catalog";
  profile?: L4Profile;
  catalog?: L4Profile[];
  observations: string[];
  notes: string[];
}

export type ToolRunResult = L4ProfileResult;

// ---------------------------------------------------------------------------
// The curated table
// ---------------------------------------------------------------------------

const LIVING_NOTE =
  "The living contract, from F5's own announcement: the four f5-* profiles and the default tcp are living, continually updated with best practices; brand-new features appear in f5-tcp-progressive immediately and in the more conservative living profiles after a couple of releases; all five are read-only, so tuning means a child profile, where the custom flag pins a setting against future pushes.";

export const PROFILES: readonly L4Profile[] = Object.freeze([
  {
    id: "tcp",
    name: "tcp (the full-proxy default)",
    aliases: ["tcp", "tcp-default", "standard-tcp"],
    family: "full-proxy",
    story:
      "The standard virtual server's baseline: two independent TCP stacks, one facing the client and one facing the servers, each negotiated and tuned separately. Every LTM feature that reads or rewrites traffic rides on this full proxy. Since the 13.0 reorganization it is also one of the five living profiles: F5 updates its best practices over releases, and it is read-only, tuned via child profiles.",
    whenToUse: [
      "Any virtual server that needs L7 features: HTTP profiles, SSL termination, full iRules, WAF, compression, caching.",
      "When client-side and server-side link characteristics differ and each stack should be tuned to its own side.",
    ],
    tradeoffs: ["Full proxying costs more CPU per connection than FastL4's packet-by-packet path; that cost buys every feature the platform has."],
    quirks: ["Living and read-only: modifying it means creating a descendant profile, which also aids troubleshooting by making local tuning explicit."],
  },
  {
    id: "f5-tcp-progressive",
    name: "f5-tcp-progressive",
    aliases: ["f5-tcp-progressive", "progressive"],
    family: "living",
    story:
      "The announcement's own definition: a general-use profile, like the tcp default, but containing the very latest features for early adopters. New generally-applicable TCP features land here first, immediately; the conservative living profiles receive them a couple of releases later.",
    whenToUse: [
      "A modern default for mixed or unknown client populations when you want current TCP behavior without hand-tuning.",
      "F5's published benchmark criterion: equal or higher throughput than the default tcp profile across all representative network types.",
    ],
    tradeoffs: ["Early-adopter posture by design: features arrive here before the conservative profiles, which is the point and the risk in one sentence."],
    quirks: ["Living and read-only, tuned via child profiles like the rest of the five."],
  },
  {
    id: "f5-tcp-lan",
    name: "f5-tcp-lan",
    aliases: ["f5-tcp-lan", "tcp-lan"],
    family: "living",
    story:
      "The living, updated version of tcp-lan-optimized: all settings adapted to LAN-grade links, without enabling the very newest features. The profiles reference pairs it with LAN-based or highly interactive traffic behind a standard virtual server.",
    whenToUse: ["Server-side profiles on fast, low-loss data-center links.", "Interactive LAN traffic where latency dominates."],
    tradeoffs: ["Link-type-tuned: the wrong side of a WAN gets WAN behavior from a LAN profile, so split-profile virtual servers (LAN inside, WAN outside) exist for exactly this."],
    quirks: ["Benchmark claim from the announcement: throughput at least as high, and often better, than the default tcp profile for its link type."],
  },
  {
    id: "f5-tcp-wan",
    name: "f5-tcp-wan",
    aliases: ["f5-tcp-wan", "tcp-wan"],
    family: "living",
    story:
      "The living, updated version of tcp-wan-optimized, adapted to slower, lossier wide-area links. The reference's classic example: clients arrive over a WAN generally slower than the BIG-IP-to-server path, and a WAN-tuned client side lets the system accept data efficiently while server resources stay available.",
    whenToUse: ["Client-side profiles for internet or WAN-facing virtual servers.", "Anywhere round-trip time and loss, not bandwidth, bound performance."],
    tradeoffs: ["Same link-type caveat as its LAN sibling, mirrored."],
    quirks: ["Same living benchmark claim, for WAN link types."],
  },
  {
    id: "f5-tcp-mobile",
    name: "f5-tcp-mobile",
    aliases: ["f5-tcp-mobile", "tcp-mobile"],
    family: "living",
    story: "The living, updated version of tcp-mobile-optimized, tuned for cellular client behavior: variable latency, radio-state-driven loss patterns, and battery-conscious pacing.",
    whenToUse: ["Client-side profiles where the population is predominantly mobile."],
    tradeoffs: ["Mobile tuning on fixed-line clients trades throughput for resilience those clients do not need."],
    quirks: ["The legacy mobile pair carries the reference's sizing note: for files under 1 MB, tcp-mobile-optimized generally beats mptcp-mobile-optimized."],
  },
  {
    id: "legacy",
    name: "The legacy trio (tcp-lan-optimized, tcp-wan-optimized, tcp-mobile-optimized)",
    aliases: ["legacy", "tcp-lan-optimized", "tcp-wan-optimized", "tcp-mobile-optimized", "mptcp-mobile-optimized"],
    family: "legacy",
    story:
      "The pre-13.0 tuned family, frozen where it stood when the living profiles arrived. The announcement is explicit that f5-tcp-wan, f5-tcp-lan, and f5-tcp-mobile are their updated versions; the legacy names still ship (the 21.0 profiles reference lists both families side by side) so existing configurations keep working unchanged.",
    whenToUse: [
      "Existing deployments that depend on the exact frozen values and change control that forbids behavioral drift.",
      "Nothing new: for new work the living family is the vendor's own upgrade path.",
    ],
    tradeoffs: ["Frozen means frozen: best-practice updates F5 pushes to the living profiles never arrive here."],
    quirks: [
      "mptcp-mobile-optimized adds Multipath TCP for reverse-proxy mobile fronts; the reference's own sizing note says tcp-mobile-optimized is generally better below 1 MB.",
      "These are not read-only like the living five, which is exactly how configurations drifted before the child-profile discipline existed.",
    ],
  },
  {
    id: "fastl4",
    name: "FastL4",
    aliases: ["fastl4", "fast-l4", "pva", "performance-l4"],
    family: "accelerated",
    story:
      "Not a TCP proxy: a packet-path profile. The profiles reference states its purpose, assigning a Fast L4 profile lets the Packet Velocity ASIC (PVA) hardware, where the platform supports it, process some or all of the Layer 4 traffic, raising performance and throughput for L4 routing and switching. It pairs with Performance (Layer 4), Forwarding (Layer 2), and Forwarding (IP) virtual servers, and dynamic offload can hand established flows to ePVA hardware mid-connection.",
    whenToUse: [
      "The operations guide's own clause: when little or no L4 or L7 processing is required.",
      "Stateless or semi-stateless forwarding: Forwarding (IP) virtual servers require FastL4 options for it.",
      "Steering traffic to inspection devices (firewall, IDS), with address and port translation disabled per the guide.",
    ],
    tradeoffs: [
      "Minimal L7 information is available, the guide's words, so load-balancing decisions are limited in scope: no HTTP profile, no content-aware features, and iRule events are the L4 set (the event-order explainer on this site flags exactly which).",
      "One flow, not two stacks: client and server see essentially the same TCP conversation, with the profile's IP/TCP field modes (TTL, DF, timestamp, window-scale) governing what is preserved or rewritten.",
    ],
    quirks: [
      "pva-acceleration: full | none | partial | dedicated (man page); dynamic offload adds packet-count thresholds and an offload state of embryonic or establish.",
      "The loose pair, defaults disabled: loose-initialization accepts any TCP packet rather than requiring a SYN, loose-close closes on the first FIN from either side; together they are the asymmetric-routing survival kit.",
      "tcp-timestamp-mode and tcp-wscale-mode default to preserve: the pass-through posture in two option defaults.",
      "late-binding: an iRule reads a Layer 7 FIX packet to select the pool, then the ePVA carries the stream at hardware latency; the man page requires a FIX profile on the Performance (Layer 4) virtual server for it.",
    ],
  },
  {
    id: "fasthttp",
    name: "FastHTTP",
    aliases: ["fasthttp", "fast-http", "performance-http"],
    family: "light-proxy",
    story:
      "The profiles reference's definition: a configuration tool designed to speed up certain types of HTTP connections, combining selected features from the TCP Express, HTTP, and OneConnect profiles into a single profile optimized for the best possible network performance. It pairs with the Performance (HTTP) virtual server type, and its signature benefit is connection reuse: the system can transform or add the HTTP Connection header to keep server-side connections open.",
    whenToUse: [
      "The reference's own criteria, all of them: you do not need remote server authentication, SSL traffic management, or TCP optimizations; nor compression, pipelining, or RAM Cache.",
      "You do not need to maintain source IP addresses (translation to a BIG-IP-owned address is part of the design).",
      "You want fewer connections opened to servers, and the servers support keep-alive (HTTP/1.1, or HTTP/1.0 with Keep-Alive; IIS by default).",
      "Basic iRule support suffices: CLIENT_ACCEPTED, SERVER_CONNECTED, and HTTP_REQUEST are the reference's own event examples.",
    ],
    tradeoffs: [
      "Every criterion above is a limitation read backwards: SSL termination, compression, caching, full iRules, or source-IP preservation each disqualify FastHTTP, and the standard virtual server with tcp+http (+OneConnect where wanted) is the answer instead.",
      "The operations guide's verdict, worth quoting in reviews: possibly the fastest way to pass HTTP traffic under certain circumstances, with specific requirements and limitations, and K8024 is the required pre-deployment reading.",
    ],
    quirks: ["The OneConnect-style reuse is built in rather than layered on, which is why the OneConnect article on this site is its natural companion reading."],
  },
]);

const BY_ALIAS = new Map<string, L4Profile>();
for (const p of PROFILES) for (const a of p.aliases) BY_ALIAS.set(a, p);

// ---------------------------------------------------------------------------
// run()
// ---------------------------------------------------------------------------

export function run(input: string): L4ProfileResult {
  const text = (input ?? "").trim().toLowerCase();
  if (!text) {
    throw new Error('Name a profile (for example "fastl4", "fasthttp", "f5-tcp-progressive", "tcp-wan-optimized", "legacy"), or type "profiles" for the full table.');
  }

  if (/^(profiles|catalog|list|all)$/.test(text)) {
    return {
      ok: true,
      mode: "catalog",
      catalog: [...PROFILES],
      observations: [LIVING_NOTE],
      notes: [
        "The decision spine in one line: full-proxy tcp for features, FastL4 for the packet path when little or no L4/L7 processing is required, FastHTTP for the narrow HTTP case that clears every criterion on its list.",
        "Stanza parsing with a per-option audit (the OneConnect tool's pattern) is this tool's documented roadmap enhancement.",
      ],
    };
  }

  const p = BY_ALIAS.get(text.replace(/\s+/g, "-"));
  if (!p) {
    throw new Error(`"${input.trim()}" is not in the curated table. Type "profiles" to see the families: full-proxy tcp, the living four, the legacy trio, FastL4, FastHTTP.`);
  }

  const observations: string[] = [];
  if (p.family === "living" || p.id === "tcp") observations.push(LIVING_NOTE);
  if (p.family === "legacy") {
    observations.push(
      "The vendor's own mapping: f5-tcp-wan, f5-tcp-lan, and f5-tcp-mobile are the updated versions of this trio; new work belongs on the living family, and these remain for configurations that depend on their frozen values.",
    );
  }
  if (p.id === "fastl4") {
    observations.push("Virtual-server pairing per the operations guide: Performance (Layer 4), Forwarding (Layer 2), and Forwarding (IP); the Performance type is the one F5 recommends when little or no L4/L7 processing is required.");
  }
  if (p.id === "fasthttp") {
    observations.push("Pairing: the Performance (HTTP) virtual server type; the operations guide sends every deployment to K8024 first, and this card's when-to-use list is that reading in criterion form.");
  }
  return { ok: true, mode: "profile", profile: p, observations, notes: [] };
}
