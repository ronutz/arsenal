// ============================================================================
// src/lib/tools/flow-path-reasoner/compute.ts
// ----------------------------------------------------------------------------
// FLOW PATH REASONER - Operations & Fieldcraft tool 11 (D-86 wave A-2,
// PRIME "go wave A" 2026-07-16; SCOUT spec PKG-SCOUT-fieldcraft-6-12-v1 §10,
// ANVIL eval anvil-eval-2026-07-16-1430).
//
// WHAT IT IS: an advisory path-MODELING engine. The senior skill it encodes
// is not drawing boxes - it is refusing to troubleshoot until the actual
// path is understood. Seven closed enums describe the path as believed; a
// fixed, original rule registry (D-18) builds a canonical hop chain, the
// resolution and identity SIDE-FLOWS, the TLS segment map, the address
// transformation points, the evidence points - and, above all, the RANKED
// FAILURE-DOMAIN CANDIDATES the modeled ambiguities imply, each with what
// would SUPPORT and what would WEAKEN it. Unknown selections do not get
// papered over: they surface as an explicit unknowns list and as warnings.
//
// WHAT IT IS NOT (cluster guardrails, binding): the map is a PROPOSED MODEL
// assembled from the user's selections, never discovered topology - the
// engine's own baseline rule says so on every run. No network calls, no
// diagnosis, no control-bypass paths, no vendor packet-processing-order
// claims. Free text (labels, title, notes) flows ONLY to the export.
//
// DETERMINISM & VERIFICATION: rule-firing snapshot vectors (D-86 §3.1).
// FPR-specific pin: the exact forward HOP SEQUENCE, alongside fired rules,
// ranked domains, and the warning set. Node insertion follows ONE canonical
// order (client, sse-edge, firewall, load-balancer, proxy, vpn pair,
// server); when two or more middleboxes are modeled, a rule fires telling
// the user the order is assumed and must be verified - honesty about the
// model's own construction.
// ============================================================================

import type {
  PathNode,
  PathEdge,
  SideFlow,
  TransformationPoint,
  EnforcementPoint,
  ChecklistItem,
  QualityWarning,
  SignalStrength,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model - seven closed enums (SCOUT §10.3). Free text is export-only.
// ----------------------------------------------------------------------------

export type FprArchetype =
  | "direct"
  | "internet-published"
  | "load-balancer"
  | "proxy-waf"
  | "site-to-site-vpn"
  | "outbound-sse"
  | "identity-federated"
  | "east-west"
  | "unknown-mixed";

export type NameResolution =
  | "public-dns"
  | "private-dns"
  | "split-horizon"
  | "hosts-static"
  | "service-discovery"
  | "multiple"
  | "unknown";

export type IntermediarySet =
  | "none"
  | "firewall"
  | "load-balancer"
  | "proxy-waf"
  | "vpn"
  | "sse-casb"
  | "multiple"
  | "unknown";

export type AddressTransformation =
  | "none"
  | "dnat"
  | "snat"
  | "both"
  | "proxy-source"
  | "multiple"
  | "unknown";

export type TlsBehavior =
  | "end-to-end"
  | "terminate-once"
  | "terminate-reencrypt"
  | "multiple-terminations"
  | "plaintext"
  | "unknown";

export type AuthFlow = "none" | "local" | "redirect-idp" | "agent-connector" | "multiple" | "unknown";

export type ReturnPath =
  | "known-symmetric"
  | "known-asymmetric"
  | "policy-routed"
  | "multiple-exits"
  | "unknown";

export type PresetId = "generic" | "load-balancer" | "dns" | "tls-pki" | "firewall";

export interface FprNotes {
  /** Friendly node labels - export only. */
  nodeLabels?: string;
  /** Diagram title - export only. */
  title?: string;
  /** Free notes - export only. */
  notes?: string;
}

export interface FprInput {
  archetype: FprArchetype;
  resolution: NameResolution;
  intermediaries: IntermediarySet;
  transformation: AddressTransformation;
  tls: TlsBehavior;
  auth: AuthFlow;
  returnPath: ReturnPath;
  preset: PresetId;
  notes?: FprNotes;
}

// ----------------------------------------------------------------------------
// Failure-domain candidates. Every candidate carries BOTH halves (supports
// AND weakens) - the cluster's evidence discipline, enforced structurally.
// ----------------------------------------------------------------------------

interface DomainDef {
  id: string;
  candidate: string;
  supports: string;
  weakens: string;
}

const DOMAINS: readonly DomainDef[] = [
  { id: "FD-UNKNOWN-PATH", candidate: "The path itself is not established; any localization is premature", supports: "Attempts to name the hop owners, addresses, or order come back inconsistent or blank - the model cannot be confirmed.", weakens: "Each hop, its owner, and where addresses or TLS change are confirmed - the model stops being a guess and this domain dissolves." },
  { id: "FD-RESOLUTION-SPLIT", candidate: "Inside and outside resolve the name differently (split-horizon divergence)", supports: "The same name returns different addresses from an internal and an external resolver, and the failing population maps to one of the views.", weakens: "Both views return the same records, or the failing population does not correlate with resolver view at all." },
  { id: "FD-RESOLUTION-DRIFT", candidate: "Static or hosts-file resolution has drifted from the real service address", supports: "The static entry differs from the authoritative record, and traffic goes to the stale address.", weakens: "The static entry matches the authoritative answer - drift is not in play." },
  { id: "FD-REGISTRY", candidate: "Service-discovery registry health, not the service, drives the failures", supports: "Registry lookups fail, lag, or return deregistered instances while the service itself answers when addressed directly.", weakens: "Discovery returns fresh, correct instances promptly - the registry is exonerated." },
  { id: "FD-STATEFUL-ASYM", candidate: "An asymmetric return path is breaking stateful devices mid-flow", supports: "Forward traffic takes one path while returns take another, and a stateful device on only one of them drops the unseen half.", weakens: "Forward and return demonstrably traverse the same devices, or no stateful device sits on either leg." },
  { id: "FD-RETURN-POLICY", candidate: "Policy routing or multiple exits steer returns somewhere the model does not expect", supports: "Return traffic exits through a different edge than assumed (routing table, policy route, or SD-WAN decision confirms it).", weakens: "The return route is confirmed identical to the assumption at every decision point." },
  { id: "FD-IDENTITY-SIDEFLOW", candidate: "The identity side-flow (IdP leg), not the application path, is failing", supports: "The redirect to the IdP is observed but the IdP leg fails - its own DNS, TLS, clock skew, or token validation - while direct application access works.", weakens: "The full redirect chain completes and tokens validate; the application itself then errors." },
  { id: "FD-IDENTITY-VISIBILITY", candidate: "Source rewriting hides the real client from backend policy and logs", supports: "Backend logs show the SNAT or proxy address where the client should be, and per-client policy behaves as if all traffic were one client.", weakens: "An identity-preserving header or log field carries the original client end to end, and policy keys on it." },
  { id: "FD-TLS-SEGMENT", candidate: "One specific TLS segment - not TLS in general - carries the failure", supports: "Handshakes complete on every segment except one, whose certificate, SNI, or cipher story differs at that boundary.", weakens: "Every segment's handshake completes cleanly with the expected identities - the failure lives above or below TLS." },
  { id: "FD-TWO-SESSION", candidate: "The proxy's two sessions diverge: the client-side conversation is not the origin-side conversation", supports: "The client-side session is healthy while the proxy's own upstream session fails (or carries different parameters), or vice versa.", weakens: "Both sessions are observed healthy and parameter-consistent end to end." },
  { id: "FD-SILENT-MIDDLEBOX", candidate: "A middlebox in the path acts on the flow without appearing in any log the team watches", supports: "Behavior changes across a device whose enforcement and logging status nobody can state; its counters or captures reveal decisions no log records.", weakens: "Every device in the path has confirmed enforcement AND logging status, and the logs account for the observed behavior." },
  { id: "FD-TUNNEL-SELECTORS", candidate: "Tunnel selectors or routing at a VPN gateway exclude part of the traffic", supports: "The affected traffic never appears inside the tunnel while other traffic between the same sites does - selectors, interesting-traffic ACLs, or routes carve it out.", weakens: "The affected flows are confirmed entering and leaving the tunnel at both gateways." },
  { id: "FD-CONNECTOR", candidate: "The access agent or connector layer, not the destination, gates the failure", supports: "The agent or connector is down, misrouted, or version-broken for the failing population, and bypassing it (where sanctioned) restores access.", weakens: "The agent path is confirmed healthy for the failing population - enrollment, tunnel, and steering all verified." },
];

// ----------------------------------------------------------------------------
// Warnings (fixed ids, vector-pinned).
// ----------------------------------------------------------------------------

const WARNINGS: Record<string, string> = {
  "W-PATH-UNKNOWN": "The path archetype itself is unknown or mixed. Everything downstream of this selection is provisional - establish the real chain before acting on the model.",
  "W-RES-UNKNOWN": "How the name resolves is unknown. Resolution is part of the path; until it is established, the client may not even be talking to the modeled destination.",
  "W-TR-UNKNOWN": "Whether addresses are rewritten is unknown. Every between-points comparison and every log correlation depends on knowing this - establish it first.",
  "W-TLS-UNKNOWN": "Where TLS terminates is unknown. Certificate identity, payload visibility, and evidence boundaries all hinge on it.",
  "W-AUTH-UNKNOWN": "The authentication flow is unknown. If a redirect or agent is involved, an entire side-flow is missing from this model.",
  "W-RET-UNKNOWN": "The return path is unknown while stateful or rewriting devices are modeled - asymmetry would break them silently. Treat the return leg as unverified.",
  "W-ENF-UNKNOWN": "The modeled intermediaries have unverified enforcement and logging status. Do not assume any of them observed or controlled the flow - or that their absence from a log means the flow bypassed them.",
  "W-ORDER-ASSUMED": "Two or more middleboxes are modeled: the chain shown uses a canonical assumed order. Verify the REAL insertion order - conclusions that depend on order inherit this assumption.",
  "W-TLS-NODES": "Multiple TLS terminations were declared, but the modeled path has fewer than two nodes capable of terminating - the TLS story and the path story disagree; reconcile them.",
  "W-TOPOLOGY-SENSITIVE": "This map and its export describe internal topology. Keep it local, prefer abstract labels, and share deliberately.",
};

// ----------------------------------------------------------------------------
// Rule registry - fixed order IS the firing order (vector-pinned). Original
// editorial work (D-18) encoding standard path-reasoning practice.
// ----------------------------------------------------------------------------

interface RuleEffect {
  domains?: { id: string; pts: number }[];
  checklist?: string[];
  warnings?: string[];
}

interface Rule {
  id: string;
  reason: string;
  fire: (inp: FprInput) => RuleEffect | null;
}

const RULES: readonly Rule[] = [
  {
    id: "R-BASE-MODEL",
    reason: "A map assembled from selections is a proposed model, not discovered topology - it must be verified before it is trusted.",
    fire: () => ({
      checklist: [
        "Confirm each modeled hop with its owner: does the device exist, in this position, doing what the model says?",
        "Mark every confirmed hop and keep the unconfirmed ones visibly provisional.",
      ],
      warnings: ["W-TOPOLOGY-SENSITIVE"],
    }),
  },
  // ---- resolution ----
  {
    id: "R-RES-SPLIT",
    reason: "Split-horizon DNS means inside and outside may resolve the same name differently - the divergence itself is a failure domain.",
    fire: (i) => (i.resolution === "split-horizon" ? { domains: [{ id: "FD-RESOLUTION-SPLIT", pts: 35 }], checklist: ["Resolve the name from an internal AND an external vantage and record both answers side by side."] } : null),
  },
  {
    id: "R-RES-STATIC",
    reason: "Hosts-file or static resolution drifts silently as services move.",
    fire: (i) => (i.resolution === "hosts-static" ? { domains: [{ id: "FD-RESOLUTION-DRIFT", pts: 30 }], checklist: ["Compare the static entry against the authoritative record before trusting any path conclusion."] } : null),
  },
  {
    id: "R-RES-SD",
    reason: "With service discovery, the registry's health is part of the path.",
    fire: (i) => (i.resolution === "service-discovery" ? { domains: [{ id: "FD-REGISTRY", pts: 30 }] } : null),
  },
  {
    id: "R-RES-MULTI",
    reason: "Multiple resolution mechanisms mean the answer can depend on who asks - document which population uses which.",
    fire: (i) => (i.resolution === "multiple" ? { domains: [{ id: "FD-RESOLUTION-SPLIT", pts: 20 }], checklist: ["Map which client populations use which resolution mechanism - the split may BE the symptom pattern."] } : null),
  },
  {
    id: "R-RES-UNKNOWN",
    reason: "Unknown resolution leaves the model's very first hop unestablished.",
    fire: (i) => (i.resolution === "unknown" ? { warnings: ["W-RES-UNKNOWN"], domains: [{ id: "FD-UNKNOWN-PATH", pts: 15 }] } : null),
  },
  // ---- archetype ----
  {
    id: "R-ARCH-UNKNOWN",
    reason: "An unknown or mixed archetype makes the whole chain provisional.",
    fire: (i) => (i.archetype === "unknown-mixed" ? { warnings: ["W-PATH-UNKNOWN"], domains: [{ id: "FD-UNKNOWN-PATH", pts: 35 }] } : null),
  },
  {
    id: "R-ARCH-VPN",
    reason: "A site-to-site tunnel adds gateway pair semantics: selectors decide what enters, and only the inner side shows the conversation.",
    fire: (i) => (i.archetype === "site-to-site-vpn" ? { domains: [{ id: "FD-TUNNEL-SELECTORS", pts: 30 }] } : null),
  },
  {
    id: "R-ARCH-FED",
    reason: "An identity-federated application carries a second flow to the IdP whose failures masquerade as application failures.",
    fire: (i) => (i.archetype === "identity-federated" ? { domains: [{ id: "FD-IDENTITY-SIDEFLOW", pts: 25 }] } : null),
  },
  {
    id: "R-ARCH-PROXY",
    reason: "A proxied path is two sessions; their divergence is its own failure domain.",
    fire: (i) => (i.archetype === "proxy-waf" || i.archetype === "outbound-sse" ? { domains: [{ id: "FD-TWO-SESSION", pts: 25 }] } : null),
  },
  // ---- transformation ----
  {
    id: "R-TR-SNAT",
    reason: "Source rewriting means backend policy and logs may never see the original client identity.",
    fire: (i) => (i.transformation === "snat" || i.transformation === "both" || i.transformation === "multiple" ? { domains: [{ id: "FD-IDENTITY-VISIBILITY", pts: 30 }], checklist: ["Identify where the original client identity survives (header, log field) past the rewrite point - if nowhere, say so in the model."] } : null),
  },
  {
    id: "R-TR-DNAT",
    reason: "Destination rewriting means the address the client dialed is not the address the server answers on - correlate flows by ports and sequence, not addresses.",
    fire: (i) => (i.transformation === "dnat" || i.transformation === "both" || i.transformation === "multiple" ? { checklist: ["Record the pre- and post-rewrite address pairs so captures and logs on both sides can be correlated."] } : null),
  },
  {
    id: "R-TR-PROXYSRC",
    reason: "A proxy-originated source means the upstream conversation is a NEW session bearing the proxy's identity.",
    fire: (i) => (i.transformation === "proxy-source" ? { domains: [{ id: "FD-IDENTITY-VISIBILITY", pts: 25 }, { id: "FD-TWO-SESSION", pts: 15 }] } : null),
  },
  {
    id: "R-TR-UNKNOWN",
    reason: "Unknown address transformation undermines every log correlation the model would otherwise support.",
    fire: (i) => (i.transformation === "unknown" ? { warnings: ["W-TR-UNKNOWN"], domains: [{ id: "FD-UNKNOWN-PATH", pts: 10 }] } : null),
  },
  // ---- TLS ----
  {
    id: "R-TLS-REENC",
    reason: "Terminate-and-re-encrypt splits the path into TLS segments with separate certificate, SNI, and cipher stories - each boundary is its own domain.",
    fire: (i) => (i.tls === "terminate-reencrypt" || i.tls === "multiple-terminations" ? { domains: [{ id: "FD-TLS-SEGMENT", pts: 30 }], checklist: ["For each TLS segment, record which certificate is presented and which name is expected - per segment, not per path."] } : null),
  },
  {
    id: "R-TLS-ONCE",
    reason: "A single mid-path termination still creates two evidence worlds: encrypted before it, exposed at it.",
    fire: (i) => (i.tls === "terminate-once" ? { domains: [{ id: "FD-TLS-SEGMENT", pts: 20 }] } : null),
  },
  {
    id: "R-TLS-E2E",
    reason: "End-to-end TLS means no mid-path device can see or generate application content - claims otherwise contradict the model.",
    fire: (i) => (i.tls === "end-to-end" ? { checklist: ["Note in the model: mid-path devices see transport only; any application-content claim must come from an endpoint."] } : null),
  },
  {
    id: "R-TLS-PLAIN",
    reason: "Plaintext on the wire makes every hop a full-content observer - an evidence convenience and an exposure fact, both worth recording.",
    fire: (i) => (i.tls === "plaintext" ? { checklist: ["Record that content is observable at every hop - and treat captures accordingly (exposure discipline applies)."] } : null),
  },
  {
    id: "R-TLS-UNKNOWN",
    reason: "Unknown TLS behavior leaves certificate identity and payload visibility unmodeled.",
    fire: (i) => (i.tls === "unknown" ? { warnings: ["W-TLS-UNKNOWN"], domains: [{ id: "FD-UNKNOWN-PATH", pts: 10 }] } : null),
  },
  // ---- auth ----
  {
    id: "R-AUTH-IDP",
    reason: "An IdP redirect adds DNS, TLS, clock, and token dependencies OUTSIDE the primary path - a whole side-flow with its own failure modes.",
    fire: (i) => (i.auth === "redirect-idp" || i.auth === "multiple" ? { domains: [{ id: "FD-IDENTITY-SIDEFLOW", pts: 30 }], checklist: ["Model the IdP leg's own path (resolution, TLS, reachability) as seriously as the application's."] } : null),
  },
  {
    id: "R-AUTH-AGENT",
    reason: "An agent or connector in the auth path is a component whose health gates everything behind it.",
    fire: (i) => (i.auth === "agent-connector" || i.auth === "multiple" ? { domains: [{ id: "FD-CONNECTOR", pts: 25 }] } : null),
  },
  {
    id: "R-AUTH-UNKNOWN",
    reason: "Unknown authentication flow may hide an entire side-flow from the model.",
    fire: (i) => (i.auth === "unknown" ? { warnings: ["W-AUTH-UNKNOWN"], domains: [{ id: "FD-UNKNOWN-PATH", pts: 10 }] } : null),
  },
  // ---- return path ----
  {
    id: "R-RET-ASYM",
    reason: "A known-asymmetric return with stateful or rewriting devices in the path is a standing failure domain, not a curiosity.",
    fire: (i) =>
      i.returnPath === "known-asymmetric" && (i.intermediaries !== "none" || i.transformation !== "none")
        ? { domains: [{ id: "FD-STATEFUL-ASYM", pts: 35 }] }
        : null,
  },
  {
    id: "R-RET-POLICY",
    reason: "Policy routing and multiple exits steer returns by rules the forward model never sees.",
    fire: (i) => (i.returnPath === "policy-routed" || i.returnPath === "multiple-exits" ? { domains: [{ id: "FD-RETURN-POLICY", pts: 30 }], checklist: ["Trace the RETURN route explicitly (routing table, policy rules, SD-WAN decisions) - do not mirror the forward assumption."] } : null),
  },
  {
    id: "R-RET-UNKNOWN",
    reason: "An unknown return path alongside stateful or rewriting devices is the classic silent breaker.",
    fire: (i) =>
      i.returnPath === "unknown" && (i.intermediaries !== "none" || i.transformation !== "none" || i.archetype === "load-balancer" || i.archetype === "site-to-site-vpn")
        ? { warnings: ["W-RET-UNKNOWN"], domains: [{ id: "FD-STATEFUL-ASYM", pts: 25 }] }
        : null,
  },
  // ---- enforcement / order ----
  {
    id: "R-ENF-UNKNOWN",
    reason: "In quick mode no intermediary's enforcement or logging status is established - none of them may be assumed to have observed or controlled the flow.",
    fire: (i) =>
      i.intermediaries !== "none" || !["direct", "east-west", "unknown-mixed"].includes(i.archetype)
        ? { warnings: ["W-ENF-UNKNOWN"], domains: [{ id: "FD-SILENT-MIDDLEBOX", pts: 20 }], checklist: ["For each middlebox: establish whether it ENFORCES, LOGS, both, or neither - and where those logs live."] }
        : null,
  },
  {
    id: "R-ORDER-ASSUMED",
    reason: "With two or more middleboxes the chain uses a canonical assumed order; the real insertion order must be verified.",
    fire: (i) => {
      const middles = middleCount(i);
      return middles >= 2 ? { warnings: ["W-ORDER-ASSUMED"] } : null;
    },
  },
];

export const RULE_COUNT = RULES.length;
export const DOMAIN_COUNT = DOMAINS.length;

// ----------------------------------------------------------------------------
// Canonical chain construction (pure, deterministic). Insertion order:
// client, sse-edge, firewall, load-balancer, proxy, vpn-a, vpn-b, server.
// ----------------------------------------------------------------------------

function middleKinds(i: FprInput): PathNode["kind"][] {
  const kinds: PathNode["kind"][] = [];
  const add = (k: PathNode["kind"]) => {
    if (!kinds.includes(k)) kinds.push(k);
  };
  // Archetype contributions.
  if (i.archetype === "outbound-sse") add("sse-edge");
  if (i.archetype === "internet-published") add("firewall");
  if (i.archetype === "load-balancer") add("load-balancer");
  if (i.archetype === "proxy-waf") add("proxy");
  if (i.archetype === "site-to-site-vpn") add("vpn-gateway");
  if (i.archetype === "unknown-mixed") add("unknown");
  // Intermediary contributions.
  if (i.intermediaries === "sse-casb") add("sse-edge");
  if (i.intermediaries === "firewall") add("firewall");
  if (i.intermediaries === "load-balancer") add("load-balancer");
  if (i.intermediaries === "proxy-waf") add("proxy");
  if (i.intermediaries === "vpn") add("vpn-gateway");
  if (i.intermediaries === "multiple") {
    add("firewall");
    add("unknown");
  }
  if (i.intermediaries === "unknown") add("unknown");
  // Canonical presentation order.
  const ORDER: PathNode["kind"][] = ["sse-edge", "firewall", "load-balancer", "proxy", "vpn-gateway", "unknown"];
  return ORDER.filter((k) => kinds.includes(k));
}

function middleCount(i: FprInput): number {
  // vpn-gateway models as a pair but counts once for order-ambiguity purposes.
  return middleKinds(i).length;
}

const KIND_LABEL: Record<PathNode["kind"], string> = {
  client: "Client",
  resolver: "Resolver",
  firewall: "Firewall",
  "load-balancer": "Load balancer",
  proxy: "Proxy / WAF",
  "vpn-gateway": "VPN gateway",
  "sse-edge": "SSE edge",
  idp: "Identity provider",
  server: "Server",
  unknown: "Unknown device",
};

// ----------------------------------------------------------------------------
// Engine
// ----------------------------------------------------------------------------

export interface FiredRule {
  id: string;
  reason: string;
}

export interface RankedDomain {
  id: string;
  candidate: string;
  supports: string;
  weakens: string;
  score: number;
  signal: SignalStrength;
  firedRules: string[];
}

export interface TlsSegment {
  id: string;
  fromNode: string;
  toNode: string;
  note: string;
}

export interface FprResult {
  nodes: PathNode[];
  edges: PathEdge[];
  sideFlows: SideFlow[];
  tlsSegments: TlsSegment[];
  transforms: TransformationPoint[];
  evidencePoints: EnforcementPoint[];
  domains: RankedDomain[];
  unknowns: string[];
  warnings: QualityWarning[];
  checklist: ChecklistItem[];
  firedRules: FiredRule[];
  artifact: ExportArtifact;
}

const SIGNAL = (score: number): SignalStrength => (score >= 60 ? "strong" : score >= 30 ? "moderate" : "weak");

const ENUMS: Record<keyof Omit<FprInput, "notes" | "preset">, readonly string[]> = {
  archetype: ["direct", "internet-published", "load-balancer", "proxy-waf", "site-to-site-vpn", "outbound-sse", "identity-federated", "east-west", "unknown-mixed"],
  resolution: ["public-dns", "private-dns", "split-horizon", "hosts-static", "service-discovery", "multiple", "unknown"],
  intermediaries: ["none", "firewall", "load-balancer", "proxy-waf", "vpn", "sse-casb", "multiple", "unknown"],
  transformation: ["none", "dnat", "snat", "both", "proxy-source", "multiple", "unknown"],
  tls: ["end-to-end", "terminate-once", "terminate-reencrypt", "multiple-terminations", "plaintext", "unknown"],
  auth: ["none", "local", "redirect-idp", "agent-connector", "multiple", "unknown"],
  returnPath: ["known-symmetric", "known-asymmetric", "policy-routed", "multiple-exits", "unknown"],
};

export class FprError extends Error {
  constructor(public code: "empty" | "format", message: string) {
    super(message);
  }
}

/** Validate a candidate input; throws FprError on failure (API-parity gate). */
export function validateInput(raw: unknown): FprInput {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    throw new FprError("empty", "Empty input: all seven fields are required.");
  }
  if (typeof raw !== "object") throw new FprError("format", "Input must be a JSON object.");
  const o = raw as Record<string, unknown>;
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = o[field];
    if (typeof v !== "string" || !allowed.includes(v)) {
      throw new FprError("format", `Field "${field}" must be one of: ${allowed.join(", ")}.`);
    }
  }
  const presets: readonly string[] = ["generic", "load-balancer", "dns", "tls-pki", "firewall"];
  if (typeof o.preset !== "string" || !presets.includes(o.preset)) {
    throw new FprError("format", `Field "preset" must be one of: ${presets.join(", ")}.`);
  }
  const notes = (typeof o.notes === "object" && o.notes) || undefined;
  return {
    archetype: o.archetype as FprArchetype,
    resolution: o.resolution as NameResolution,
    intermediaries: o.intermediaries as IntermediarySet,
    transformation: o.transformation as AddressTransformation,
    tls: o.tls as TlsBehavior,
    auth: o.auth as AuthFlow,
    returnPath: o.returnPath as ReturnPath,
    preset: o.preset as PresetId,
    notes: notes as FprNotes | undefined,
  };
}

/** The deterministic core. */
export function run(input: FprInput): FprResult {
  // ---- 1. Build the canonical forward chain. ----
  const middles = middleKinds(input);
  const chainKinds: PathNode["kind"][] = ["client", ...middles.flatMap((k) => (k === "vpn-gateway" ? (["vpn-gateway", "vpn-gateway"] as PathNode["kind"][]) : [k])), "server"];

  let vpnSeen = 0;
  const nodes: PathNode[] = chainKinds.map((kind, idx) => {
    let id = `N-${kind.toUpperCase()}`;
    let label = KIND_LABEL[kind];
    if (kind === "vpn-gateway") {
      vpnSeen += 1;
      id = `N-VPN-${vpnSeen === 1 ? "A" : "B"}`;
      label = `VPN gateway ${vpnSeen === 1 ? "A (near)" : "B (far)"}`;
    }
    if (kind === "unknown") id = `N-UNKNOWN-${idx}`;
    return { id, kind, label, transforms: [], enforcement: kind === "client" || kind === "server" ? "none" : "unknown" };
  });

  const nodeByKind = (k: PathNode["kind"]) => nodes.find((n) => n.kind === k);

  // ---- 2. Attach transformations to the most plausible node. ----
  const transforms: TransformationPoint[] = [];
  const attachTransform = (kind: TransformationPoint["kind"], effect: string) => {
    // Preference order for where rewriting happens in the canonical chain.
    const pref: PathNode["kind"][] =
      kind === "proxy-source" ? ["proxy", "sse-edge"] : ["firewall", "load-balancer", "proxy", "sse-edge", "vpn-gateway", "unknown"];
    const host = pref.map(nodeByKind).find(Boolean);
    if (host) {
      host.transforms.push(kind.toUpperCase());
      transforms.push({ nodeId: host.id, kind, effect });
    }
  };
  if (input.transformation === "dnat" || input.transformation === "both" || input.transformation === "multiple")
    attachTransform("dnat", "Destination address rewritten: the dialed address is not the answering address.");
  if (input.transformation === "snat" || input.transformation === "both" || input.transformation === "multiple")
    attachTransform("snat", "Source address rewritten: downstream devices see the rewrite point, not the client.");
  if (input.transformation === "proxy-source")
    attachTransform("proxy-source", "Upstream session originates at the proxy with its own source identity.");

  // ---- 3. TLS segments. ----
  const tlsSegments: TlsSegment[] = [];
  const tlsCapable = nodes.filter((n) => ["proxy", "load-balancer", "sse-edge"].includes(n.kind));
  const warnIds: string[] = [];
  if (input.tls === "terminate-once" || input.tls === "terminate-reencrypt") {
    const term = tlsCapable[0];
    if (term) {
      term.tlsBoundary = input.tls === "terminate-once" ? "terminates" : "terminates-and-reoriginates";
      tlsSegments.push({ id: "TLS-1", fromNode: "N-CLIENT", toNode: term.id, note: "Client-side TLS segment: the certificate presented HERE is what the client judges." });
      if (input.tls === "terminate-reencrypt")
        tlsSegments.push({ id: "TLS-2", fromNode: term.id, toNode: "N-SERVER", note: "Upstream TLS segment: a separate handshake with its own certificate, SNI, and cipher story." });
    } else {
      warnIds.push("W-TLS-NODES");
    }
  } else if (input.tls === "multiple-terminations") {
    if (tlsCapable.length >= 2) {
      let prev = "N-CLIENT";
      tlsCapable.forEach((n, i2) => {
        n.tlsBoundary = "terminates-and-reoriginates";
        tlsSegments.push({ id: `TLS-${i2 + 1}`, fromNode: prev, toNode: n.id, note: `TLS segment ${i2 + 1}: separate identity and cipher story.` });
        prev = n.id;
      });
      tlsSegments.push({ id: `TLS-${tlsCapable.length + 1}`, fromNode: prev, toNode: "N-SERVER", note: "Final TLS segment to the server." });
    } else {
      warnIds.push("W-TLS-NODES");
    }
  } else if (input.tls === "end-to-end") {
    tlsSegments.push({ id: "TLS-1", fromNode: "N-CLIENT", toNode: "N-SERVER", note: "One TLS world end to end: mid-path devices see transport only." });
  }

  // ---- 4. Side-flows. ----
  const sideFlows: SideFlow[] = [];
  const resolverNode: PathNode = { id: "N-RESOLVER", kind: "resolver", label: KIND_LABEL.resolver, transforms: [], enforcement: "unknown" };
  if (input.resolution !== "hosts-static") {
    nodes.push(resolverNode);
    sideFlows.push({
      id: "SF-RESOLUTION",
      title: "Resolution side-flow",
      nodeIds: ["N-CLIENT", "N-RESOLVER"],
      note:
        input.resolution === "split-horizon"
          ? "Split-horizon: the answer depends on which view the client reaches - model both."
          : input.resolution === "service-discovery"
            ? "Service discovery: the registry's health and freshness are part of this path."
            : input.resolution === "unknown"
              ? "Resolution mechanism unknown - this side-flow is unverified."
              : "Name resolution happens before the first packet of the primary flow.",
    });
  }
  if (input.auth === "redirect-idp" || input.auth === "multiple" || input.archetype === "identity-federated") {
    const idpNode: PathNode = { id: "N-IDP", kind: "idp", label: KIND_LABEL.idp, transforms: [], enforcement: "unknown" };
    nodes.push(idpNode);
    sideFlows.push({
      id: "SF-IDENTITY",
      title: "Identity side-flow",
      nodeIds: ["N-CLIENT", "N-IDP"],
      note: "The redirect chain runs client -> IdP -> back: its own resolution, TLS, clock, and token dependencies - outside the primary path.",
    });
  }

  // ---- 5. Fire the rules. ----
  const domainScores = new Map<string, number>();
  const domainRules = new Map<string, string[]>();
  const checklist: ChecklistItem[] = [];
  const fired: FiredRule[] = [];
  for (const rule of RULES) {
    const eff = rule.fire(input);
    if (!eff) continue;
    fired.push({ id: rule.id, reason: rule.reason });
    for (const d of eff.domains ?? []) {
      domainScores.set(d.id, (domainScores.get(d.id) ?? 0) + d.pts);
      domainRules.set(d.id, [...(domainRules.get(d.id) ?? []), rule.id]);
    }
    for (const c of eff.checklist ?? []) checklist.push({ id: `${rule.id}-CL${checklist.length}`, text: c, checked: false });
    for (const w of eff.warnings ?? []) if (!warnIds.includes(w)) warnIds.push(w);
  }

  // ---- 6. Rank domains (score desc, definition order tie-break). ----
  const domains: RankedDomain[] = DOMAINS.filter((d) => (domainScores.get(d.id) ?? 0) > 0)
    .map((d) => {
      const score = domainScores.get(d.id) ?? 0;
      return { ...d, score, signal: SIGNAL(score), firedRules: domainRules.get(d.id) ?? [] };
    })
    .sort((a, b) => b.score - a.score || DOMAINS.findIndex((d) => d.id === a.id) - DOMAINS.findIndex((d) => d.id === b.id));

  // ---- 7. Explicit unknowns (the honesty list). ----
  const unknowns: string[] = [];
  if (input.archetype === "unknown-mixed") unknowns.push("Path archetype");
  if (input.resolution === "unknown") unknowns.push("Name resolution");
  if (input.intermediaries === "unknown") unknowns.push("Intermediary set");
  if (input.transformation === "unknown") unknowns.push("Address transformation");
  if (input.tls === "unknown") unknowns.push("TLS termination");
  if (input.auth === "unknown") unknowns.push("Authentication flow");
  if (input.returnPath === "unknown") unknowns.push("Return path");

  // ---- 8. Evidence points: every middle node is a potential log/enforcement site. ----
  const evidencePoints: EnforcementPoint[] = nodes
    .filter((n) => !["client", "server", "resolver", "idp"].includes(n.kind))
    .map((n) => ({ nodeId: n.id, kind: "unknown" as const, note: `Establish whether ${n.label} enforces, logs, both, or neither - and where the logs live.` }));

  // ---- 9. Edges (forward chain). ----
  const chainIds = nodes.filter((n) => !["resolver", "idp"].includes(n.kind)).map((n) => n.id);
  const edges: PathEdge[] = chainIds.slice(0, -1).map((id, i2) => ({ from: id, to: chainIds[i2 + 1] }));

  const warnings: QualityWarning[] = warnIds.map((id) => ({ id, message: WARNINGS[id] }));

  // ---- 10. Export artifact (free text enters HERE and only here). ----
  const n = input.notes ?? {};
  const chainLabels = chainIds.map((id) => nodes.find((x) => x.id === id)!.label);
  const artifact: ExportArtifact = {
    kind: "flow-path-map",
    title: n.title?.trim() ? n.title.trim() : "Flow path map",
    sections: [
      ["Context", [
        `Archetype: ${input.archetype} | Resolution: ${input.resolution} | Intermediaries: ${input.intermediaries}`,
        `Transformation: ${input.transformation} | TLS: ${input.tls} | Auth: ${input.auth} | Return: ${input.returnPath} | Preset: ${input.preset}`,
        ...(n.nodeLabels ? [`Node labels: ${n.nodeLabels}`] : []),
      ].join("\n")],
      ["Forward path (canonical assumed order)", chainLabels.map((l, i2) => `${i2 + 1}. ${l}`).join("\n")],
      ["Side-flows", sideFlows.map((sf) => `- ${sf.title}: ${sf.note}`).join("\n") || "(none)"],
      ["TLS segments", tlsSegments.map((t) => `- ${t.id}: ${t.fromNode} -> ${t.toNode}. ${t.note}`).join("\n") || (input.tls === "plaintext" ? "(plaintext: no TLS segments - content observable at every hop)" : "(unknown)")],
      ["Address transformations", transforms.map((t) => `- ${t.kind.toUpperCase()} at ${t.nodeId}: ${t.effect}`).join("\n") || "(none declared)"],
      ["Failure-domain candidates (ranked)", domains.map((d) => `${d.id} [${d.signal}] ${d.candidate}\n- supports: ${d.supports}\n- weakens: ${d.weakens}`).join("\n\n") || "(none)"],
      ["Evidence points", evidencePoints.map((e) => `- ${e.nodeId}: ${e.note}`).join("\n") || "(none)"],
      ["Explicit unknowns", unknowns.map((u) => `- ${u}`).join("\n") || "(none - every dimension declared)"],
      ["Checklist", checklist.map((c) => `- [ ] ${c.text}`).join("\n") || "(none)"],
      ["Warnings", warnings.map((w) => `- ${w.id}: ${w.message}`).join("\n") || "(none)"],
      ...(n.notes ? [["Notes", n.notes] as [string, string]] : []),
    ],
  };

  return { nodes, edges, sideFlows, tlsSegments, transforms, evidencePoints, domains, unknowns, warnings, checklist, firedRules: fired, artifact };
}

/** JSON string entry point (API parity, D-72). */
export function runFromJson(json: string): FprResult {
  if (!json || !json.trim()) throw new FprError("empty", "Empty input.");
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new FprError("format", "Input is not valid JSON.");
  }
  return run(validateInput(raw));
}

export { artifactToMarkdown };
