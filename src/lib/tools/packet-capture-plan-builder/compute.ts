// ============================================================================
// src/lib/tools/packet-capture-plan-builder/compute.ts
// ----------------------------------------------------------------------------
// PACKET CAPTURE PLAN BUILDER - Operations & Fieldcraft tool 6 (D-86 wave A,
// PRIME "go wave A" 2026-07-16; SCOUT enumeration PKG-SCOUT-fieldcraft-6-12-v1,
// ANVIL eval anvil-eval-2026-07-16-1430).
//
// WHAT IT IS: an advisory, evidence-DESIGN engine. Command builders answer
// "how do I capture?"; this tool answers "WHERE, WHY, and WHAT WOULD IT
// MEAN?". You describe the path and the symptom through seven closed enums;
// a fixed, original rule registry (D-18) fires deterministically and produces
// a PHASED CAPTURE PLAN: ranked capture points on named boundaries, each with
// the observations it can establish, an interpretation matrix (what would
// SUPPORT and what would WEAKEN each candidate conclusion), a synchronization
// and authorization checklist, and minimal-exposure warnings.
//
// WHAT IT IS NOT (cluster guardrails, binding): it does not ingest packet
// files (privacy boundary - it PLANS collection, never receives it), does not
// diagnose, provides no interception/evasion/decryption-bypass guidance,
// makes no network calls, and never claims version-specific command accuracy
// (filter hints are vendor-neutral TEMPLATES with <placeholders>; preset
// notes name command families nominatively only).
//
// DETERMINISM & VERIFICATION: rule-firing snapshot vectors (the D-86 §3.1
// cluster ruling): same input -> same rules fire, same ranked points, same
// phases, same warnings. Free text (labels, notes) flows ONLY to the export
// artifact, never into rule matching - the determinism boundary is
// structural, exactly as in the pilot.
//
// SENIOR JUDGMENT ENCODED (the moat, per SCOUT §5.2): capture at boundaries,
// not convenient interfaces; two synchronized points beat one enormous file;
// transformations (NAT/TLS/proxy) create the boundaries that matter; decide
// IN ADVANCE what an observation would prove; absence of packets is evidence;
// minimize exposure of sensitive payloads.
//
// PAGE LANGUAGE (02/11/2026): every sentence the page shows or exports is
// built as an EngineText (src/lib/tools/engine-text.ts): a stable id, the
// English exactly as before, and its values. runLocalisable() returns the
// reading with those objects in place (the page shows the plan, and exports
// it, in its own language; the notes stay as typed, and the filter templates
// stay as written, being filter syntax); run(), the API's and the vectors'
// entry, returns plainText() of the same reading, byte for byte what it was.
// Catalogue texts keep their English here and get their ids where the plan is
// assembled (point.<id>.where, expect.<rule>.<point>.*, matrix.<id>.*,
// check.<rule>.<n>, presetNote.<preset>.<point>, rule.<id>, warn.<id>).
// ============================================================================

import type {
  CapturePoint,
  CapturePlanPhase,
  CaptureBoundary,
  ObservationExpectation,
  ChecklistItem,
  QualityWarning,
  SignalStrength,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";
import { say, plainText, type EngineText } from "../engine-text"; // sentences with ids (02/11/2026)
import { joined, raw, opt, todo } from "@/lib/fieldcraft/text"; // the export's sentences with ids

// ----------------------------------------------------------------------------
// Input model - seven closed enums (SCOUT §5.3). Free text is export-only.
// ----------------------------------------------------------------------------

export type PathArchetype =
  | "direct"
  | "load-balancer"
  | "firewall-nat"
  | "proxy-waf"
  | "site-to-site-vpn"
  | "outbound-sse"
  | "east-west"
  | "unknown-mixed";

export type CaptureSymptom =
  | "timeout"
  | "reset"
  | "tls-failure"
  | "http-error"
  | "packet-loss"
  | "intermittent-latency"
  | "one-way"
  | "connect-failure";

export type TrafficClass = "tcp" | "udp" | "icmp" | "dns" | "tls" | "http" | "mixed";

export type Intermediaries =
  | "none"
  | "firewall"
  | "nat-snat"
  | "load-balancer"
  | "proxy-waf"
  | "vpn-gateway"
  | "multiple"
  | "unknown";

export type Transformation =
  | "none"
  | "address-translation"
  | "tls-termination"
  | "protocol-proxying"
  | "auth-redirect"
  | "multiple"
  | "unknown";

export type CaptureAccess =
  | "client-only"
  | "server-only"
  | "one-intermediary"
  | "both-endpoints"
  | "endpoint-plus-intermediary"
  | "multiple-points"
  | "unknown";

export type TimeBehavior =
  | "constant"
  | "intermittent"
  | "change-related"
  | "load-related"
  | "client-specific"
  | "location-specific"
  | "unknown";

export type PresetId = "generic" | "load-balancer" | "dns" | "tls-pki" | "firewall";

export interface PcpbNotes {
  /** Friendly endpoint labels - export only. */
  labels?: string;
  /** Incident/maintenance reference - export only. */
  reference?: string;
  /** Free notes - export only. */
  notes?: string;
}

export interface PcpbInput {
  archetype: PathArchetype;
  symptom: CaptureSymptom;
  trafficClass: TrafficClass;
  intermediaries: Intermediaries;
  transformation: Transformation;
  access: CaptureAccess;
  timeBehavior: TimeBehavior;
  preset: PresetId;
  notes?: PcpbNotes;
}

// ----------------------------------------------------------------------------
// The fixed capture-point CATALOG. Rules add points to catalog entries;
// ranking is score-desc with catalog order as the deterministic tie-break.
// `where` and every expectation string are canonical English (vector-pinned).
// ----------------------------------------------------------------------------

interface CatalogPoint {
  id: string;
  boundary: CaptureBoundary;
  where: string;
  filterHint: string;
  direction: CapturePoint["direction"];
}

const CATALOG: readonly CatalogPoint[] = [
  { id: "P-CLIENT", boundary: "endpoint", where: "On the client itself (or its access switch port)", filterHint: "host <client-ip> and host <target>", direction: "both" },
  { id: "P-SERVER", boundary: "endpoint", where: "On the server itself (or its access switch port)", filterHint: "host <server-ip> and port <service-port>", direction: "both" },
  { id: "P-RESOLVER", boundary: "resolver", where: "Between the client and its DNS resolver", filterHint: "port 53 and host <client-ip>", direction: "both" },
  { id: "P-FW-OUT", boundary: "pre-firewall", where: "Outside interface of the firewall (before enforcement/NAT)", filterHint: "host <client-ip> and host <public-target>", direction: "both" },
  { id: "P-FW-IN", boundary: "post-firewall", where: "Inside interface of the firewall (after enforcement/NAT)", filterHint: "host <translated-src> and host <server-ip>", direction: "both" },
  { id: "P-LB-FRONT", boundary: "vip-front", where: "Client side of the load balancer (traffic to the VIP)", filterHint: "host <vip> and port <service-port>", direction: "both" },
  { id: "P-LB-BACK", boundary: "member-side", where: "Server side of the load balancer (traffic to pool members)", filterHint: "host <member-ip> and port <member-port>", direction: "both" },
  { id: "P-PROXY-FRONT", boundary: "proxy-front", where: "Client side of the proxy or WAF", filterHint: "host <client-ip> and host <proxy-vip>", direction: "both" },
  { id: "P-PROXY-BACK", boundary: "proxy-back", where: "Origin side of the proxy or WAF", filterHint: "host <proxy-egress> and host <origin-ip>", direction: "both" },
  { id: "P-VPN-OUTER", boundary: "vpn-outer", where: "Outer (encrypted) side of the VPN gateway", filterHint: "host <peer-gw> and (esp or udp port 4500)", direction: "both" },
  { id: "P-VPN-INNER", boundary: "vpn-inner", where: "Inner (cleartext) side of the VPN gateway", filterHint: "host <remote-subnet-host> and port <service-port>", direction: "both" },
  { id: "P-EGRESS", boundary: "egress", where: "At the outbound egress / SSE tunnel head", filterHint: "host <client-ip> and (port 443 or port 80)", direction: "both" },
  { id: "P-MIRROR", boundary: "mirror", where: "A SPAN/mirror or tap on the east-west segment", filterHint: "host <src-ip> and host <dst-ip>", direction: "both" },
];

// ----------------------------------------------------------------------------
// Interpretation-matrix candidates: what an observation pattern would mean.
// Every candidate carries BOTH halves (supports AND weakens) - the cluster's
// evidence discipline, enforced structurally.
// ----------------------------------------------------------------------------

export interface MatrixCandidate<S = string> {
  id: string;
  candidate: S;
  supports: S;
  weakens: S;
}

// ----------------------------------------------------------------------------
// Warnings (fixed ids, vector-pinned).
// ----------------------------------------------------------------------------

const WARNINGS: Record<string, string> = {
  "W-PATH-UNKNOWN": "The path itself is not established. A capture plan built on an unknown path risks observing the wrong boundary entirely - map the hops and their owners first, then plan the captures.",
  "W-SINGLE-POINT": "Only one side of the path is reachable while an intermediary sits between the endpoints. Absence of packets at a single point cannot localize where they were lost - it can only prove they did not arrive there.",
  "W-TLS-CLAIMS": "TLS terminates mid-path: transport evidence and decrypted application evidence are different things. A capture on the encrypted side can prove handshake and flow behaviour, never payload content - do not let the plan's readers claim otherwise.",
  "W-SENSITIVE": "This traffic class can carry credentials, tokens, cookies, or user content. Truncate capture length (snaplen) to headers where possible, cap duration, control file access, and redact before sharing.",
  "W-SYNC": "The symptom is not constant and more than one capture point is in play: without clock synchronization and overlapping windows, multi-point comparison will mislead rather than localize.",
  "W-INT-UNKNOWN": "The intermediary inventory is unknown. Every unlisted middlebox is a boundary the plan cannot see - enumerate the path's devices before trusting any two-point comparison.",
};

// ----------------------------------------------------------------------------
// Rule registry - fixed order IS the firing order (vector-pinned). Each rule
// is original editorial work (D-18) encoding standard capture practice.
// ----------------------------------------------------------------------------

interface RuleEffect {
  addPoints?: { point: string; pts: number; expect?: ObservationExpectation }[];
  checklist?: string[];
  warnings?: string[];
  matrix?: MatrixCandidate[];
}

interface Rule {
  id: string;
  reason: string;
  fire: (inp: PcpbInput) => RuleEffect | null;
}

const RULES: readonly Rule[] = [
  // ---- authorization baseline: always fires ----
  {
    id: "R-BASE-AUTHZ",
    reason: "Capture authorization, retention, and access control are the operator's responsibility on every plan.",
    fire: () => ({
      checklist: [
        "Confirm capture authorization for every point in this plan (owner sign-off where the interface is not yours).",
        "Agree retention and access control for the capture files before collection starts.",
      ],
    }),
  },
  // ---- archetype seeding ----
  {
    id: "R-ARCH-DIRECT",
    reason: "A direct path is localized by comparing the two endpoints.",
    fire: (i) =>
      i.archetype === "direct"
        ? {
            addPoints: [
              { point: "P-CLIENT", pts: 20, expect: { observe: "The flow as the client sends and receives it", means: "The client-side truth to compare against the server side, packet for packet." } },
              { point: "P-SERVER", pts: 20, expect: { observe: "The flow as the server sees it", means: "Present here but absent effects at the client localizes the return path; absent here localizes the forward path." } },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-LB",
    reason: "A load-balanced path has two conversations: client-to-VIP and LB-to-member. Capture both sides of the balancer.",
    fire: (i) =>
      i.archetype === "load-balancer"
        ? {
            addPoints: [
              { point: "P-LB-FRONT", pts: 30, expect: { observe: "Client connections to the VIP: SYN, handshake, and any resets", means: "Separates 'client cannot reach the VIP' from everything behind it." } },
              { point: "P-LB-BACK", pts: 30, expect: { observe: "The balancer's own connections to pool members (often from a SNAT address)", means: "Failures here with a healthy front side localize to member selection, member health, or the server segment." } },
              { point: "P-CLIENT", pts: 10 },
              { point: "P-SERVER", pts: 10 },
            ],
            matrix: [
              {
                id: "C-LB-SPLIT",
                candidate: "The fault sits behind the VIP (member side), not in front of it",
                supports: "Clean, completed handshakes at the VIP front while the member-side capture shows failures, retransmissions, or no corresponding member connection.",
                weakens: "The front-side capture already shows the failure (no SYN-ACK from the VIP, resets from the VIP address) - then the balancer or the path to it is implicated instead.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-FWNAT",
    reason: "A firewalled/NATted path is localized by pairing captures across the enforcement boundary.",
    fire: (i) =>
      i.archetype === "firewall-nat"
        ? {
            addPoints: [
              { point: "P-FW-OUT", pts: 25, expect: { observe: "The flow before enforcement and translation", means: "Arrival here proves the network delivered it to the boundary." } },
              { point: "P-FW-IN", pts: 25, expect: { observe: "The flow after enforcement and translation (addresses rewritten)", means: "Present outside, absent inside: the device dropped it - policy, NAT exhaustion, or inspection. Match flows by ports and TCP sequence numbers, not by addresses." } },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-PROXY",
    reason: "A proxied path is TWO TCP sessions; the proxy's two sides are separate conversations that must be captured separately.",
    fire: (i) =>
      i.archetype === "proxy-waf"
        ? {
            addPoints: [
              { point: "P-PROXY-FRONT", pts: 25, expect: { observe: "The client-to-proxy session, including TLS handshake if the proxy terminates it", means: "Separates client-side failures from anything the proxy does upstream." } },
              { point: "P-PROXY-BACK", pts: 25, expect: { observe: "The proxy-to-origin session (new source address, often new TLS)", means: "A healthy front with a failing back localizes to the origin or the proxy's upstream policy - and the two sessions will NOT share ports or sequence numbers." } },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-VPN",
    reason: "A site-to-site VPN path has an encrypted outside and a cleartext inside; only the inner side shows the application flow.",
    fire: (i) =>
      i.archetype === "site-to-site-vpn"
        ? {
            addPoints: [
              { point: "P-VPN-INNER", pts: 30, expect: { observe: "The application flow in clear, entering/leaving the tunnel", means: "The only place near the gateway where the actual conversation is visible." } },
              { point: "P-VPN-OUTER", pts: 20, expect: { observe: "ESP or UDP/4500 between the gateways - and nothing else of the flow", means: "Healthy, symmetric ESP with an absent inner flow localizes to selectors/routing at a gateway; absent ESP localizes to the underlay or IKE." } },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-SSE",
    reason: "An outbound SSE/proxy path is localized between the client agent/tunnel and the egress the provider sees.",
    fire: (i) =>
      i.archetype === "outbound-sse"
        ? {
            addPoints: [
              { point: "P-CLIENT", pts: 25, expect: { observe: "The client's tunnel or proxy session establishment (and the SNI it offers)", means: "Separates 'agent/tunnel never built' from policy applied inside the service." } },
              { point: "P-EGRESS", pts: 25, expect: { observe: "What actually leaves the site (tunneled, or direct on bypass)", means: "Traffic bypassing the tunnel here, while policy assumes steering, is a steering fault - not a provider fault." } },
            ],
          }
        : null,
  },
  {
    id: "R-ARCH-EW",
    reason: "East-west traffic rarely crosses a natural capture boundary; create one with a mirror/tap, and capture the endpoints.",
    fire: (i) =>
      i.archetype === "east-west"
        ? {
            addPoints: [
              { point: "P-CLIENT", pts: 15 },
              { point: "P-SERVER", pts: 15 },
              { point: "P-MIRROR", pts: 20, expect: { observe: "The segment's traffic at a SPAN/mirror or tap", means: "The neutral third view that arbitrates when the two endpoints disagree." } },
            ],
            checklist: ["Confirm SPAN/mirror or tap availability on the east-west segment (and its packet-drop behaviour under load) before scheduling."],
          }
        : null,
  },
  {
    id: "R-ARCH-UNKNOWN",
    reason: "An unknown or mixed path cannot be planned with confidence; establish the path first.",
    fire: (i) =>
      i.archetype === "unknown-mixed"
        ? {
            addPoints: [
              { point: "P-CLIENT", pts: 10 },
              { point: "P-SERVER", pts: 10 },
            ],
            warnings: ["W-PATH-UNKNOWN"],
            checklist: ["Map the path first: list every hop, its owner, and where addresses or TLS change - then rebuild this plan against the real path."],
          }
        : null,
  },
  // ---- intermediary refinements ----
  {
    id: "R-INT-FW",
    reason: "A firewall in the path adds an enforcement boundary worth pairing across.",
    fire: (i) =>
      i.intermediaries === "firewall" || i.intermediaries === "multiple"
        ? { addPoints: [{ point: "P-FW-OUT", pts: 10 }, { point: "P-FW-IN", pts: 10 }] }
        : null,
  },
  {
    id: "R-INT-NAT",
    reason: "Address translation breaks address-based matching; pair across the NAT and match by ports and sequence numbers.",
    fire: (i) =>
      i.intermediaries === "nat-snat" || i.transformation === "address-translation"
        ? {
            addPoints: [
              { point: "P-FW-OUT", pts: 15, expect: { observe: "Pre-translation addressing of the flow", means: "One half of the correlation pair." } },
              { point: "P-FW-IN", pts: 15, expect: { observe: "Post-translation addressing of the same flow", means: "Correlate to the pre-NAT capture by ports, TCP sequence numbers, and timing - never by IP addresses." } },
            ],
          }
        : null,
  },
  {
    id: "R-INT-LB",
    reason: "A load balancer among the intermediaries adds the VIP/member boundary even off the LB archetype.",
    fire: (i) =>
      i.archetype !== "load-balancer" && (i.intermediaries === "load-balancer")
        ? { addPoints: [{ point: "P-LB-FRONT", pts: 15 }, { point: "P-LB-BACK", pts: 15 }] }
        : null,
  },
  {
    id: "R-INT-PROXY",
    reason: "A proxy/WAF among the intermediaries adds the two-session boundary even off the proxy archetype.",
    fire: (i) =>
      i.archetype !== "proxy-waf" && i.intermediaries === "proxy-waf"
        ? { addPoints: [{ point: "P-PROXY-FRONT", pts: 15 }, { point: "P-PROXY-BACK", pts: 15 }] }
        : null,
  },
  {
    id: "R-INT-VPN",
    reason: "A VPN gateway among the intermediaries adds the outer/inner boundary even off the VPN archetype.",
    fire: (i) =>
      i.archetype !== "site-to-site-vpn" && i.intermediaries === "vpn-gateway"
        ? { addPoints: [{ point: "P-VPN-INNER", pts: 15 }, { point: "P-VPN-OUTER", pts: 10 }] }
        : null,
  },
  {
    id: "R-INT-MULTI",
    reason: "Multiple intermediaries mean multiple boundaries; the plan must name their order before two-point comparisons mean anything.",
    fire: (i) =>
      i.intermediaries === "multiple"
        ? { checklist: ["Enumerate the intermediaries IN ORDER (client -> ... -> server) and note at which of them addresses or TLS change - the phase-2 pairs depend on that order."] }
        : null,
  },
  {
    id: "R-INT-UNKNOWN",
    reason: "An unknown middlebox inventory undermines every between-points inference.",
    fire: (i) => (i.intermediaries === "unknown" ? { warnings: ["W-INT-UNKNOWN"] } : null),
  },
  // ---- transformation rules ----
  {
    id: "R-TR-TLS",
    reason: "Mid-path TLS termination splits the path into separate TLS worlds; transport evidence must not be presented as payload evidence.",
    fire: (i) =>
      i.transformation === "tls-termination" || i.transformation === "multiple"
        ? {
            warnings: ["W-TLS-CLAIMS"],
            matrix: [
              {
                id: "C-TLS-BOUNDARY",
                candidate: "The failure sits at a TLS boundary (handshake, certificate, SNI, or ALPN mismatch at one termination point)",
                supports: "A capture on the client side of the terminator shows the handshake failing (alert visible, or handshake never completes) while the terminator's upstream side shows either no attempt or a separately healthy session.",
                weakens: "Handshakes complete cleanly at every termination point in the plan - the failure then lives above TLS (application) or below it (transport), not at the boundary.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-TR-AUTHRED",
    reason: "An authentication redirect creates a SECOND flow (to the IdP) whose failure masquerades as an application failure.",
    fire: (i) =>
      i.transformation === "auth-redirect"
        ? {
            addPoints: [
              { point: "P-RESOLVER", pts: 10, expect: { observe: "Resolution of the identity provider's name, separately from the application's", means: "An IdP-side DNS or reachability failure explains an 'application' login failure without the application being at fault." } },
              { point: "P-CLIENT", pts: 10, expect: { observe: "The 302 chain: application -> IdP -> application", means: "Where the chain stalls is where the evidence should focus next." } },
            ],
            matrix: [
              {
                id: "C-IDENTITY-SIDEFLOW",
                candidate: "The failure is in the identity side-flow, not the application path",
                supports: "The redirect to the IdP is observed but the IdP leg fails (DNS, TCP, TLS, or an error response on the IdP host) while direct application requests succeed.",
                weakens: "The full redirect chain completes and the application itself then errors - the identity leg is exonerated.",
              },
            ],
          }
        : null,
  },
  // ---- symptom rules ----
  {
    id: "R-SY-TIMEOUT",
    reason: "For timeouts, ABSENCE is the evidence: the last point where packets are seen bounds the loss.",
    fire: (i) =>
      i.symptom === "timeout"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 10 }, { point: "P-SERVER", pts: 10 }],
            matrix: [
              {
                id: "C-UPSTREAM-LOSS",
                candidate: "The traffic is lost between two adjacent capture points",
                supports: "The flow (or its retransmissions) is present at the upstream point and absent at the next one downstream, within a synchronized window.",
                weakens: "The flow appears at both points - the loss, if any, is further along; move the pair and repeat.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-SY-RESET",
    reason: "A reset has an ORIGINATOR; captures on both sides of the nearest stateful device reveal which side manufactured it.",
    fire: (i) =>
      i.symptom === "reset"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 10 }, { point: "P-SERVER", pts: 10 }],
            matrix: [
              {
                id: "C-RST-ORIGIN",
                candidate: "A middle device, not the server, is originating the resets",
                supports: "The RST appears on the client side but the server-side capture shows no corresponding RST leaving the server (or shows the session healthy) - TTL and timing of the RST further separate a nearby middlebox from the far endpoint.",
                weakens: "The server-side capture shows the server itself sending the RST for that exact session (sequence numbers match).",
              },
            ],
          }
        : null,
  },
  {
    id: "R-SY-TLSFAIL",
    reason: "A TLS failure is best observed where the handshake actually happens - on the client side of whichever hop terminates it.",
    fire: (i) =>
      i.symptom === "tls-failure"
        ? {
            addPoints: [
              { point: "P-CLIENT", pts: 15, expect: { observe: "ClientHello (with SNI) and whatever answers it: ServerHello, an alert, or silence", means: "An alert names the layer; silence after ClientHello points at the path or a device eating the handshake." } },
            ],
          }
        : null,
  },
  {
    id: "R-SY-HTTPERR",
    reason: "An HTTP error is generated WHERE the request is decrypted and processed; the capture must sit where that status is visible.",
    fire: (i) =>
      i.symptom === "http-error"
        ? {
            addPoints: [{ point: "P-SERVER", pts: 10 }],
            matrix: [
              {
                id: "C-ERROR-ORIGIN",
                candidate: "An intermediary, not the origin, is generating the error status",
                supports: "The origin-side capture shows no matching request reaching the origin (or a different status leaving it) while the client receives the error - the device in between wrote it.",
                weakens: "The origin-side capture shows the same request arriving and the same error status leaving the origin itself.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-SY-LOSS",
    reason: "Packet loss is proven by pairwise comparison: the same flow, two points, one delta.",
    fire: (i) =>
      i.symptom === "packet-loss"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 15 }, { point: "P-SERVER", pts: 15 }],
            checklist: ["Compare interface drop/error counters at each hop alongside the captures - counters localize cheaply before packets confirm."],
          }
        : null,
  },
  {
    id: "R-SY-LATENCY",
    reason: "Latency decomposes into client think-time, network transit, and server first-byte - two synchronized points separate them.",
    fire: (i) =>
      i.symptom === "intermittent-latency"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 10 }, { point: "P-SERVER", pts: 10 }],
            matrix: [
              {
                id: "C-DELAY-SPLIT",
                candidate: "The delay is server-side (first-byte), not network transit",
                supports: "Request leaves the client and arrives at the server with ordinary transit time, but the first response byte lags at the SERVER capture itself.",
                weakens: "The request-to-arrival gap between the two captures carries the delay - transit (or a middle device) owns it instead.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-SY-ONEWAY",
    reason: "One-way traffic is a return-path problem until proven otherwise; capture BOTH directions at two points.",
    fire: (i) =>
      i.symptom === "one-way"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 15 }, { point: "P-SERVER", pts: 15 }],
            matrix: [
              {
                id: "C-ASYM-RETURN",
                candidate: "The forward path works and the return path takes a different, failing route",
                supports: "Requests arrive at the server and responses leave it, but those responses never appear at the client-side capture - the return leg is dropping them.",
                weakens: "Responses never leave the server at all, or the forward leg itself is incomplete - the asymmetry story collapses.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-SY-CONNFAIL",
    reason: "Connection-establishment failures begin before the connection: resolution first, then the SYN's journey.",
    fire: (i) =>
      i.symptom === "connect-failure"
        ? {
            addPoints: [
              { point: "P-RESOLVER", pts: 15, expect: { observe: "The DNS query and its answer: NXDOMAIN, timeout, or an unexpected address", means: "A resolution failure ends the investigation before any packet-path work; an unexpected address redirects it." } },
              { point: "P-CLIENT", pts: 10 },
            ],
          }
        : null,
  },
  // ---- traffic-class rules ----
  {
    id: "R-TC-DNS",
    reason: "DNS-class traffic makes the resolver leg a first-phase point in its own right.",
    fire: (i) => (i.trafficClass === "dns" ? { addPoints: [{ point: "P-RESOLVER", pts: 25 }] } : null),
  },
  {
    id: "R-TC-SENSITIVE",
    reason: "TLS, HTTP, and mixed classes can carry secrets; the plan must minimize exposure by construction.",
    fire: (i) =>
      i.trafficClass === "tls" || i.trafficClass === "http" || i.trafficClass === "mixed"
        ? {
            warnings: ["W-SENSITIVE"],
            checklist: ["Prefer header-length snaplen and bounded duration; store captures with restricted access and redact before any sharing."],
          }
        : null,
  },
  {
    id: "R-TC-MIXED",
    reason: "A mixed/unknown traffic class needs the flow defined before filters mean anything.",
    fire: (i) =>
      i.trafficClass === "mixed"
        ? { checklist: ["Pin down the 5-tuple (or at least protocol and port) of the affected flow before capture - unfiltered captures on busy links bury the evidence."] }
        : null,
  },
  // ---- access rules ----
  {
    id: "R-AC-SINGLE",
    reason: "Single-point access with an intermediary present cannot localize loss - the plan says so out loud.",
    fire: (i) =>
      (i.access === "client-only" || i.access === "server-only") && i.intermediaries !== "none"
        ? {
            warnings: ["W-SINGLE-POINT"],
            checklist: ["Request access to at least one more point across the nearest boundary - phase 2 of this plan depends on it."],
          }
        : null,
  },
  {
    id: "R-AC-UNKNOWN",
    reason: "Unknown capture access makes scheduling premature.",
    fire: (i) =>
      i.access === "unknown"
        ? { checklist: ["Establish WHO can capture WHERE (and with what approval) before scheduling any window."] }
        : null,
  },
  // ---- time-behavior rules ----
  {
    id: "R-TM-SYNC",
    reason: "Non-constant symptoms with multi-point plans demand synchronized clocks and overlapping windows.",
    fire: (i) =>
      i.timeBehavior === "intermittent" || i.timeBehavior === "load-related"
        ? {
            warnings: ["W-SYNC"],
            checklist: [
              "Synchronize clocks (NTP) on every capture host and record the offset before starting.",
              "Run overlapping ring-buffer captures at all points until the symptom reproduces - never sequential windows.",
            ],
          }
        : null,
  },
  {
    id: "R-TM-CHANGE",
    reason: "Change-aligned symptoms want BEFORE/AFTER evidence pairs, not just a single failing capture.",
    fire: (i) =>
      i.timeBehavior === "change-related"
        ? {
            checklist: ["Capture the same points in a known-good window (rollback or a healthy peer) as the comparison baseline - one failing capture proves little without its pair."],
            matrix: [
              {
                id: "C-CHANGE-ALIGNED",
                candidate: "The change altered on-the-wire behaviour at a specific boundary",
                supports: "The before/after pair at one boundary differs exactly where the change plausibly acts (new resets, new path, new TLS parameters) while other boundaries match.",
                weakens: "Before and after captures are materially identical at every planned point - the change's wire effect is elsewhere or absent.",
              },
            ],
          }
        : null,
  },
  {
    id: "R-TM-CLIENT",
    reason: "Client-specific symptoms are localized fastest by differential capture: one failing client, one working one.",
    fire: (i) =>
      i.timeBehavior === "client-specific"
        ? {
            addPoints: [{ point: "P-CLIENT", pts: 15, expect: { observe: "The failing client's flow, side by side with a working client's capture of the same operation", means: "The first packet where the two diverge names the layer to investigate." } }],
          }
        : null,
  },
  {
    id: "R-TM-LOCATION",
    reason: "Location-specific symptoms mean path-specific captures: pair a failing site with a working one.",
    fire: (i) =>
      i.timeBehavior === "location-specific"
        ? { checklist: ["Plan the same capture points at one FAILING site and one WORKING site - the comparison is the evidence; a single-site capture is only half of it."] }
        : null,
  },
];

export const RULE_COUNT = RULES.length;
export const POINT_CATALOG_COUNT = CATALOG.length;

// ----------------------------------------------------------------------------
// Preset flavor: command-family notes only (nominative vendor naming, no
// version-specific accuracy claims), attached to relevant points.
// ----------------------------------------------------------------------------

const PRESET_NOTES: Record<PresetId, Partial<Record<string, string>>> = {
  generic: {},
  "load-balancer": {
    "P-LB-FRONT": "Command family: on BIG-IP, tcpdump on interface 0.0 sees both sides of the proxy in one capture (with p-flags for peer flows); other ADCs expose equivalent VIP-side capture.",
    "P-LB-BACK": "Command family: capture on the server-side VLAN/interface of the ADC, or on the member itself, to see the balancer-originated (often SNATed) session.",
  },
  dns: {
    "P-RESOLVER": "Command family: tcpdump/tshark 'port 53' near the client, and query logging on the resolver, together cover both halves of the resolution leg.",
  },
  "tls-pki": {
    "P-CLIENT": "Command family: a client-side tcpdump/tshark of the handshake plus the browser/openssl s_client view of the presented chain covers transport and certificate evidence together.",
  },
  firewall: {
    "P-FW-OUT": "Command family: most firewalls expose an on-box packet capture per interface/zone; capture the OUTSIDE zone here and pair it with the inside capture.",
    "P-FW-IN": "Command family: the INSIDE-zone on-box capture, plus the device's session/flow table for the same tuple, pairs with the outside view.",
  },
};

// ----------------------------------------------------------------------------
// Engine
// ----------------------------------------------------------------------------

export interface FiredRule<S = string> {
  id: string;
  reason: S;
}

/** S is string in the API's reading and EngineText in the page's (runLocalisable). */
export interface PcpbResult<S = string> {
  points: CapturePoint<S>[];
  phases: CapturePlanPhase<S>[];
  checklist: ChecklistItem<S>[];
  matrix: MatrixCandidate<S>[];
  warnings: QualityWarning<S>[];
  firedRules: FiredRule<S>[];
  artifact: ExportArtifact<S>;
}

const SIGNAL = (score: number): SignalStrength => (score >= 60 ? "strong" : score >= 30 ? "moderate" : "weak");

const ENUMS: Record<keyof Omit<PcpbInput, "notes" | "preset">, readonly string[]> = {
  archetype: ["direct", "load-balancer", "firewall-nat", "proxy-waf", "site-to-site-vpn", "outbound-sse", "east-west", "unknown-mixed"],
  symptom: ["timeout", "reset", "tls-failure", "http-error", "packet-loss", "intermittent-latency", "one-way", "connect-failure"],
  trafficClass: ["tcp", "udp", "icmp", "dns", "tls", "http", "mixed"],
  intermediaries: ["none", "firewall", "nat-snat", "load-balancer", "proxy-waf", "vpn-gateway", "multiple", "unknown"],
  transformation: ["none", "address-translation", "tls-termination", "protocol-proxying", "auth-redirect", "multiple", "unknown"],
  access: ["client-only", "server-only", "one-intermediary", "both-endpoints", "endpoint-plus-intermediary", "multiple-points", "unknown"],
  timeBehavior: ["constant", "intermittent", "change-related", "load-related", "client-specific", "location-specific", "unknown"],
};

export class PcpbError extends Error {
  constructor(public code: "empty" | "format", message: string) {
    super(message);
  }
}

/** Validate a candidate input; throws PcpbError on failure (API-parity gate). */
export function validateInput(raw: unknown): PcpbInput {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    throw new PcpbError("empty", "Empty input: all seven fields are required.");
  }
  if (typeof raw !== "object") throw new PcpbError("format", "Input must be a JSON object.");
  const o = raw as Record<string, unknown>;
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = o[field];
    if (typeof v !== "string" || !allowed.includes(v)) {
      throw new PcpbError("format", `Field "${field}" must be one of: ${allowed.join(", ")}.`);
    }
  }
  const preset = o.preset;
  const presets: readonly string[] = ["generic", "load-balancer", "dns", "tls-pki", "firewall"];
  if (typeof preset !== "string" || !presets.includes(preset)) {
    throw new PcpbError("format", `Field "preset" must be one of: ${presets.join(", ")}.`);
  }
  // Notes are export-only free text; sanitize shape but never let it near rules.
  const notes = (typeof o.notes === "object" && o.notes) || undefined;
  return {
    archetype: o.archetype as PathArchetype,
    symptom: o.symptom as CaptureSymptom,
    trafficClass: o.trafficClass as TrafficClass,
    intermediaries: o.intermediaries as Intermediaries,
    transformation: o.transformation as Transformation,
    access: o.access as CaptureAccess,
    timeBehavior: o.timeBehavior as TimeBehavior,
    preset: preset as PresetId,
    notes: notes as PcpbNotes | undefined,
  };
}

/** The deterministic core: rules fire in registry order; ranking is score desc, catalog order tie-break (02/11/2026: the reading of runLocalisable() with every sentence as its English). */
export function run(input: PcpbInput): PcpbResult {
  return plainText(runLocalisable(input)) as PcpbResult; // the same reading, sentences as their English (the cast: Plain<> widens the artifact's [heading, body] tuples to arrays; the values are the same)
}

/**
 * runLocalisable - the page's reading (02/11/2026): run()'s reading with every sentence an EngineText (its id, its
 * English, its values), so the page can show the plan, and export it, in its own language.
 * @param input the structured input
 * @returns the reading with sentences as EngineTexts
 */
export function runLocalisable(input: PcpbInput): PcpbResult<EngineText> {
  const scores = new Map<string, number>();
  const pointRules = new Map<string, string[]>();
  const pointExpects = new Map<string, ObservationExpectation<EngineText>[]>();
  const checklist: ChecklistItem<EngineText>[] = [];
  const matrix: MatrixCandidate<EngineText>[] = [];
  const warnIds: string[] = [];
  const fired: FiredRule<EngineText>[] = [];
  for (const rule of RULES) {
    const eff = rule.fire(input);
    if (!eff) continue;
    fired.push({ id: rule.id, reason: say(`rule.${rule.id}`, rule.reason) }); // pack key engine.rule.<id>
    for (const ap of eff.addPoints ?? []) {
      scores.set(ap.point, (scores.get(ap.point) ?? 0) + ap.pts);
      pointRules.set(ap.point, [...(pointRules.get(ap.point) ?? []), rule.id]);
      if (ap.expect) pointExpects.set(ap.point, [...(pointExpects.get(ap.point) ?? []), { observe: say(`expect.${rule.id}.${ap.point}.observe`, ap.expect.observe), means: say(`expect.${rule.id}.${ap.point}.means`, ap.expect.means) }]); // pack keys engine.expect.<rule id>.<point id>.*
    }
    (eff.checklist ?? []).forEach((c, k) => checklist.push({ id: `${rule.id}-CL${checklist.length}`, text: say(`check.${rule.id}.${k}`, c), checked: false })); // pack keys engine.check.<rule id>.<n>
    for (const m of eff.matrix ?? []) matrix.push({ id: m.id, candidate: say(`matrix.${m.id}.candidate`, m.candidate), supports: say(`matrix.${m.id}.supports`, m.supports), weakens: say(`matrix.${m.id}.weakens`, m.weakens) }); // pack keys engine.matrix.<id>.*
    for (const w of eff.warnings ?? []) if (!warnIds.includes(w)) warnIds.push(w);
  }

  // Rank: catalog order carries the tie-break by construction.
  const points: CapturePoint<EngineText>[] = CATALOG.filter((c) => (scores.get(c.id) ?? 0) > 0)
    .map((c) => {
      const score = scores.get(c.id) ?? 0;
      const note = PRESET_NOTES[input.preset][c.id]; // the preset's command-family note, if any
      return {
        id: c.id,
        boundary: c.boundary,
        where: say(`point.${c.id}.where`, c.where), // pack key engine.point.<id>.where
        filterHint: c.filterHint,
        direction: c.direction,
        score,
        signal: SIGNAL(score),
        expects: pointExpects.get(c.id) ?? [],
        firedRules: pointRules.get(c.id) ?? [],
        presetNote: note === undefined ? undefined : say(`presetNote.${input.preset}.${c.id}`, note), // pack key engine.presetNote.<preset>.<point id>
      };
    })
    .sort((a, b) => b.score - a.score || CATALOG.findIndex((c) => c.id === a.id) - CATALOG.findIndex((c) => c.id === b.id));

  // Phases: phase 1 = the minimum viable set (top scored >= 30, capped at 4,
  // floor of 2 when anything scored); phase 2 = every remaining scored point.
  const strongish = points.filter((p) => p.score >= 30).slice(0, 4);
  const phase1 = (strongish.length >= 2 ? strongish : points.slice(0, Math.min(2, points.length))).map((p) => p.id);
  const phase2 = points.map((p) => p.id).filter((id) => !phase1.includes(id));
  const phases: CapturePlanPhase<EngineText>[] = [
    { id: "phase-1", title: say("phase.1", "Minimum viable capture set"), pointIds: phase1 },
    { id: "phase-2", title: say("phase.2", "Expansion if phase 1 is inconclusive"), pointIds: phase2 },
  ];

  const warnings: QualityWarning<EngineText>[] = warnIds.map((id) => ({ id, message: say(`warn.${id}`, WARNINGS[id]) })); // pack key engine.warn.<id>

  // Export artifact (free text enters HERE and only here).
  const n = input.notes ?? {};
  /** "(none)" for an empty section. */
  const none = (): EngineText => say("md.none", "(none)"); // the shared placeholder
  /** One planned point as the export lists it: id, signal, placement, and its filter template on the next line. */
  const pointLine = (id: string): EngineText => {
    const p = points.find((x) => x.id === id)!;
    return say("md.point", `- ${p.id} [${p.signal}] ${p.where.text}\n  filter: \`${p.filterHint}\``, { id: p.id, signal: say(`signal.${p.signal}`, p.signal), where: p.where, filter: p.filterHint }); // the filter template stays as written
  };
  const artifact: ExportArtifact<EngineText> = {
    kind: "packet-capture-plan",
    title: say("md.title", "Packet capture plan"),
    sections: [
      [say("md.h.context", "Context"), joined([
        say("md.context1", `Path: ${input.archetype} | Symptom: ${input.symptom} | Class: ${input.trafficClass}`, { archetype: opt("archetype", input.archetype), symptom: opt("symptom", input.symptom), trafficClass: opt("trafficClass", input.trafficClass) }),
        say("md.context2", `Intermediaries: ${input.intermediaries} | Transformation: ${input.transformation}`, { intermediaries: opt("intermediaries", input.intermediaries), transformation: opt("transformation", input.transformation) }),
        say("md.context3", `Access: ${input.access} | Time behaviour: ${input.timeBehavior} | Preset: ${input.preset}`, { access: opt("access", input.access), timeBehavior: opt("timeBehavior", input.timeBehavior), preset: opt("preset", input.preset) }),
        ...(n.labels ? [say("md.labels", `Labels: ${n.labels}`, { text: n.labels })] : []),
        ...(n.reference ? [say("md.reference", `Reference: ${n.reference}`, { text: n.reference })] : []),
      ])],
      [say("md.h.phase1", "Phase 1 - minimum viable capture set"), joined(phase1.length ? phase1.map(pointLine) : [say("md.noScored", "(no scored points - establish the path and access first)")])],
      [say("md.h.phase2", "Phase 2 - expansion"), joined(phase2.length ? phase2.map(pointLine) : [none()])],
      [say("md.h.expected", "Expected observations"), points.some((p) => p.expects.length) ? joined(points.flatMap((p) => p.expects.map((e) => say("md.expect", `- ${p.id}: ${e.observe.text}\n  -> ${e.means.text}`, { id: p.id, observe: e.observe, means: e.means })))) : none()],
      [say("md.h.matrix", "Interpretation matrix"), matrix.length ? joined(matrix.map((m) => say("md.candidate", `CANDIDATE: ${m.candidate.text}\n- supports: ${m.supports.text}\n- weakens: ${m.weakens.text}`, { candidate: m.candidate, supports: m.supports, weakens: m.weakens })), "\n\n") : none()],
      [say("md.h.checklist", "Checklist"), checklist.length ? joined(checklist.map((c) => todo(c.text))) : none()],
      [say("md.h.warnings", "Warnings"), warnings.length ? joined(warnings.map((w) => say("md.warning", `- ${w.id}: ${w.message.text}`, { id: w.id, message: w.message }))) : none()],
      ...(n.notes ? [[say("md.h.notes", "Notes"), raw(n.notes)] as [EngineText, EngineText]] : []),
    ],
  };

  return { points, phases, checklist, matrix, warnings, firedRules: fired, artifact };
}

/** JSON string entry point (API parity, D-72). */
export function runFromJson(json: string): PcpbResult {
  let raw: unknown;
  if (!json || !json.trim()) throw new PcpbError("empty", "Empty input.");
  try {
    raw = JSON.parse(json);
  } catch {
    throw new PcpbError("format", "Input is not valid JSON.");
  }
  return run(validateInput(raw));
}

export { artifactToMarkdown };
