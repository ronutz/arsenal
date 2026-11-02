// ============================================================================
// src/lib/fieldcraft/schema.ts
// ----------------------------------------------------------------------------
// OPERATIONS & FIELDCRAFT - shared schemas (D-86 §2).
//
// The cluster's common vocabulary, pioneered by the Fault Hypothesis Builder
// pilot and reused by every later fieldcraft tool (runbook builder, RCA
// builder, blast-radius mapper, escalation packet builder). This is the
// SCOUT §11.1 subset the pilot actually needs; types the pilot does not
// need land with the tools that need them (D-86 §2).
//
// LANGUAGE DISCIPLINE (D-86 §3.2, binding): these are ADVISORY structures.
// A Hypothesis is a thing to TEST, never a diagnosis; evidence "supports" or
// "weakens", it never "confirms the root cause". Field names and doc comments
// hold that line on purpose.
//
// PAGE LANGUAGE (02/11/2026): the types that carry sentences take a type
// parameter S, the sentence type: string (the default) in the API's reading,
// EngineText (src/lib/tools/engine-text.ts) in the page's reading, which the
// engines' localisable functions return. Ids, enums and numbers stay as they
// were; only human sentences change type.
// ============================================================================

/** How strongly the fired rules point at a hypothesis. Deliberately named
 *  "signal", not "confidence" or "probability": it is a deterministic score
 *  band over which rules fired, not a statistical claim about the world. */
export type SignalStrength = "strong" | "moderate" | "weak";

/** One piece of evidence worth collecting for a hypothesis: a concrete check
 *  an engineer can run. Advisory: collecting it TESTS the hypothesis. */
export interface EvidenceItem<S = string> {
  id: string;
  /** The check itself, imperative and concrete ("Compare interface counters
   *  at the incident hour against the same hour last week"). */
  action: S;
  /** Optional command-level hint, preset-flavored where a DomainPreset
   *  applies (named nominatively, e.g. an F5 tmsh line). */
  command?: S;
}

/** A hypothesis to test - the cluster's core advisory unit. */
export interface Hypothesis<S = string> {
  id: string;
  /** Short name, phrased as a fault DOMAIN to investigate, not a verdict. */
  title: S;
  /** One-paragraph framing: why this domain is worth testing given the
   *  described situation. */
  rationale: S;
  /** Deterministic score accumulated from fired rules (see the engine). */
  score: number;
  signal: SignalStrength;
  /** Checks that would test this hypothesis. */
  evidence: EvidenceItem<S>[];
  /** Observations that would SUPPORT the hypothesis if seen. */
  supports: S[];
  /** Observations that would WEAKEN it - the honest other half. */
  weakens: S[];
  /** Which rules contributed, in firing order - feeds the "Why this
   *  result?" panel so the ranking is inspectable, never oracular. */
  firedRules: { ruleId: string; points: number; because: S }[];
}

/** A structured caution about the INPUT quality itself - e.g. "you said
 *  nothing changed; verify that against the change record". */
export interface QualityWarning<S = string> {
  id: string;
  message: S;
}

/** A risk factor attached to an action or a window (used lightly by the
 *  pilot; the runbook and blast-radius tools are its main consumers). */
export interface RiskFactor<S = string> {
  id: string;
  label: S;
  severity: "low" | "medium" | "high";
  note?: S;
}

/** One line of a working checklist (evidence collection, runbook step).
 *  `checked` is client-side state; engines emit items unchecked. */
export interface ChecklistItem<S = string> {
  id: string;
  text: S;
  checked: boolean;
}

/** A named domain preset that flavors evidence phrasing (vendor-neutral core,
 *  preset-specific command hints). The pilot ships four. */
export interface DomainPreset {
  id: string;
  /** i18n key suffix for the preset's display label. */
  labelKey: string;
}

/** The exportable artifact every fieldcraft tool ends in - usable, not
 *  decorative (D-86 §2 / SCOUT §4.6): something an engineer can paste into a
 *  ticket, a bridge chat, or a TAC case as-is. */
export interface ExportArtifact<S = string> {
  /** Artifact kind, e.g. "fault-hypothesis-worksheet", "runbook". */
  kind: string;
  /** Human title line. */
  title: S;
  /** ISO date the artifact was generated (client-side; the engine itself
   *  never reads a clock - the component supplies it at export time). */
  generated?: string;
  /** Ordered Markdown sections: [heading, body]. */
  sections: [S, S][];
}

// ---------------------------------------------------------------------------
// PACKET CAPTURE PLAN BUILDER additions (fieldcraft tool 6, 2026-07-16).
// The plan is deterministic structure: WHERE to observe (CapturePoint at a
// CaptureBoundary), in which PHASE, and WHAT each observation can establish
// (ObservationExpectation). Nothing here ingests packets - the tool plans
// collection; it never receives captures (privacy boundary, MVP).
// ---------------------------------------------------------------------------

/** A topological boundary a capture point sits on. */
export type CaptureBoundary =
  | "endpoint"
  | "pre-firewall"
  | "post-firewall"
  | "vip-front"
  | "member-side"
  | "proxy-front"
  | "proxy-back"
  | "vpn-outer"
  | "vpn-inner"
  | "resolver"
  | "egress"
  | "mirror";

/** One expected observation at a point, and what it would establish. */
export interface ObservationExpectation<S = string> {
  /** What to look for (canonical English, vector-pinned). */
  observe: S;
  /** What seeing it (or its absence) would establish - evidence language. */
  means: S;
}

/** A ranked capture point in the plan. */
export interface CapturePoint<S = string> {
  id: string;
  boundary: CaptureBoundary;
  /** Human placement description (canonical English). */
  where: S;
  /** Vendor-neutral filter TEMPLATE with <placeholders>; never real addresses. */
  filterHint: string;
  /** Both directions unless a rule narrows it. */
  direction: "both" | "toward-server" | "toward-client";
  score: number;
  signal: SignalStrength;
  expects: ObservationExpectation<S>[];
  /** Rule ids that contributed points here (the Why-panel trail). */
  firedRules: string[];
  /** Optional preset flavor note (command family, nominative vendor). */
  presetNote?: S;
}

/** A phase of the plan: minimum viable first, expansion second. */
export interface CapturePlanPhase<S = string> {
  id: "phase-1" | "phase-2";
  title: S;
  pointIds: string[];
}

// ---------------------------------------------------------------------------
// FLOW PATH REASONER additions (fieldcraft tool 11, 2026-07-16). The map is
// deterministic structure: a canonical forward hop chain (PathNode/PathEdge),
// side-flows that run OUTSIDE the primary path (resolution, identity),
// transformation points where addresses change meaning, and evidence points
// where enforcement or logging may live. A map assembled from selections is
// a PROPOSED model, never discovered topology - the engine says so itself.
// ---------------------------------------------------------------------------

/** One node on the modeled path (or in a side-flow). */
export interface PathNode<S = string> {
  id: string;
  kind:
    | "client"
    | "resolver"
    | "firewall"
    | "load-balancer"
    | "proxy"
    | "vpn-gateway"
    | "sse-edge"
    | "idp"
    | "server"
    | "unknown";
  /** Canonical English label (vector-pinned). */
  label: S;
  /** Address/identity transformations happening AT this node (codes such as DNAT, SNAT: not sentences). */
  transforms: string[];
  /** TLS boundary behavior at this node, when any. */
  tlsBoundary?: "terminates" | "terminates-and-reoriginates";
  /** What this node does to the flow, as far as the model knows. */
  enforcement: "enforces" | "logs" | "enforces-and-logs" | "none" | "unknown";
}

/** A directed edge in the modeled path. */
export interface PathEdge<S = string> {
  from: string;
  to: string;
  note?: S;
}

/** A flow that runs OUTSIDE the primary request path (resolution, identity). */
export interface SideFlow<S = string> {
  id: string;
  title: S;
  /** Node ids participating, in order. */
  nodeIds: string[];
  note: S;
}

/** A point where addresses (and therefore log identity) change. */
export interface TransformationPoint<S = string> {
  nodeId: string;
  kind: "dnat" | "snat" | "proxy-source";
  effect: S;
}

/** A point where evidence may live (enforcement decisions, logs). */
export interface EnforcementPoint<S = string> {
  nodeId: string;
  kind: "enforcement" | "logging" | "both" | "unknown";
  note: S;
}

// ---------------------------------------------------------------------------
// SNAPSHOT COMPARATOR additions (fieldcraft tool 7, 2026-07-16). The tool
// never ingests state data: the user DECLARES the before/after state classes
// and the engine GATES what conclusion those declarations can carry - the
// naming-honesty contract, structural. Dimensions are a fixed catalog with
// churn classes; findings are interpretation guidance, never diffs.
// ---------------------------------------------------------------------------

/** One dimension worth snapshotting, from the fixed catalog. */
export interface SnapshotDimension<S = string> {
  id: string;
  title: S;
  /** How fast this dimension changes under normal operation. */
  churnClass: "stable" | "slow" | "fast";
  /** What to actually record for it, before AND after. */
  record: S;
  /** How to read a difference in this dimension. */
  deltaMeaning: S;
}

/** The declared before/after pair - state CLASSES, never state data. */
export interface SnapshotPair<S = string> {
  beforeConfidence: string;
  afterState: string;
  note: S;
}

/** Interpretation guidance for one dimension's potential delta. */
export interface DeltaFinding<S = string> {
  dimensionId: string;
  /** What a difference here should be presumed to be, given declared churn. */
  expectation: "should-match" | "read-with-care" | "expected-drift";
  meaning: S;
  supports: S;
  weakens: S;
}

/** The gated conclusion: what the declared evidence can actually carry. */
export interface ValidationGate<S = string> {
  verdict: "continue" | "observe" | "investigate" | "hold-rollback-ready";
  reasons: S[];
  /** What would raise the justified conclusion tier. */
  upgradeConditions: S[];
  /** What would drop it. */
  downgradeConditions: S[];
}
