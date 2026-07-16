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
// ============================================================================

/** How strongly the fired rules point at a hypothesis. Deliberately named
 *  "signal", not "confidence" or "probability": it is a deterministic score
 *  band over which rules fired, not a statistical claim about the world. */
export type SignalStrength = "strong" | "moderate" | "weak";

/** One piece of evidence worth collecting for a hypothesis: a concrete check
 *  an engineer can run. Advisory: collecting it TESTS the hypothesis. */
export interface EvidenceItem {
  id: string;
  /** The check itself, imperative and concrete ("Compare interface counters
   *  at the incident hour against the same hour last week"). */
  action: string;
  /** Optional command-level hint, preset-flavored where a DomainPreset
   *  applies (named nominatively, e.g. an F5 tmsh line). */
  command?: string;
}

/** A hypothesis to test - the cluster's core advisory unit. */
export interface Hypothesis {
  id: string;
  /** Short name, phrased as a fault DOMAIN to investigate, not a verdict. */
  title: string;
  /** One-paragraph framing: why this domain is worth testing given the
   *  described situation. */
  rationale: string;
  /** Deterministic score accumulated from fired rules (see the engine). */
  score: number;
  signal: SignalStrength;
  /** Checks that would test this hypothesis. */
  evidence: EvidenceItem[];
  /** Observations that would SUPPORT the hypothesis if seen. */
  supports: string[];
  /** Observations that would WEAKEN it - the honest other half. */
  weakens: string[];
  /** Which rules contributed, in firing order - feeds the "Why this
   *  result?" panel so the ranking is inspectable, never oracular. */
  firedRules: { ruleId: string; points: number; because: string }[];
}

/** A structured caution about the INPUT quality itself - e.g. "you said
 *  nothing changed; verify that against the change record". */
export interface QualityWarning {
  id: string;
  message: string;
}

/** A risk factor attached to an action or a window (used lightly by the
 *  pilot; the runbook and blast-radius tools are its main consumers). */
export interface RiskFactor {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  note?: string;
}

/** One line of a working checklist (evidence collection, runbook step).
 *  `checked` is client-side state; engines emit items unchecked. */
export interface ChecklistItem {
  id: string;
  text: string;
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
export interface ExportArtifact {
  /** Artifact kind, e.g. "fault-hypothesis-worksheet", "runbook". */
  kind: string;
  /** Human title line. */
  title: string;
  /** ISO date the artifact was generated (client-side; the engine itself
   *  never reads a clock - the component supplies it at export time). */
  generated?: string;
  /** Ordered Markdown sections: [heading, body]. */
  sections: [string, string][];
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
export interface ObservationExpectation {
  /** What to look for (canonical English, vector-pinned). */
  observe: string;
  /** What seeing it (or its absence) would establish - evidence language. */
  means: string;
}

/** A ranked capture point in the plan. */
export interface CapturePoint {
  id: string;
  boundary: CaptureBoundary;
  /** Human placement description (canonical English). */
  where: string;
  /** Vendor-neutral filter TEMPLATE with <placeholders>; never real addresses. */
  filterHint: string;
  /** Both directions unless a rule narrows it. */
  direction: "both" | "toward-server" | "toward-client";
  score: number;
  signal: SignalStrength;
  expects: ObservationExpectation[];
  /** Rule ids that contributed points here (the Why-panel trail). */
  firedRules: string[];
  /** Optional preset flavor note (command family, nominative vendor). */
  presetNote?: string;
}

/** A phase of the plan: minimum viable first, expansion second. */
export interface CapturePlanPhase {
  id: "phase-1" | "phase-2";
  title: string;
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
export interface PathNode {
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
  label: string;
  /** Address/identity transformations happening AT this node. */
  transforms: string[];
  /** TLS boundary behavior at this node, when any. */
  tlsBoundary?: "terminates" | "terminates-and-reoriginates";
  /** What this node does to the flow, as far as the model knows. */
  enforcement: "enforces" | "logs" | "enforces-and-logs" | "none" | "unknown";
}

/** A directed edge in the modeled path. */
export interface PathEdge {
  from: string;
  to: string;
  note?: string;
}

/** A flow that runs OUTSIDE the primary request path (resolution, identity). */
export interface SideFlow {
  id: string;
  title: string;
  /** Node ids participating, in order. */
  nodeIds: string[];
  note: string;
}

/** A point where addresses (and therefore log identity) change. */
export interface TransformationPoint {
  nodeId: string;
  kind: "dnat" | "snat" | "proxy-source";
  effect: string;
}

/** A point where evidence may live (enforcement decisions, logs). */
export interface EnforcementPoint {
  nodeId: string;
  kind: "enforcement" | "logging" | "both" | "unknown";
  note: string;
}

// ---------------------------------------------------------------------------
// SNAPSHOT COMPARATOR additions (fieldcraft tool 7, 2026-07-16). The tool
// never ingests state data: the user DECLARES the before/after state classes
// and the engine GATES what conclusion those declarations can carry - the
// naming-honesty contract, structural. Dimensions are a fixed catalog with
// churn classes; findings are interpretation guidance, never diffs.
// ---------------------------------------------------------------------------

/** One dimension worth snapshotting, from the fixed catalog. */
export interface SnapshotDimension {
  id: string;
  title: string;
  /** How fast this dimension changes under normal operation. */
  churnClass: "stable" | "slow" | "fast";
  /** What to actually record for it, before AND after. */
  record: string;
  /** How to read a difference in this dimension. */
  deltaMeaning: string;
}

/** The declared before/after pair - state CLASSES, never state data. */
export interface SnapshotPair {
  beforeConfidence: string;
  afterState: string;
  note: string;
}

/** Interpretation guidance for one dimension's potential delta. */
export interface DeltaFinding {
  dimensionId: string;
  /** What a difference here should be presumed to be, given declared churn. */
  expectation: "should-match" | "read-with-care" | "expected-drift";
  meaning: string;
  supports: string;
  weakens: string;
}

/** The gated conclusion: what the declared evidence can actually carry. */
export interface ValidationGate {
  verdict: "continue" | "observe" | "investigate" | "hold-rollback-ready";
  reasons: string[];
  /** What would raise the justified conclusion tier. */
  upgradeConditions: string[];
  /** What would drop it. */
  downgradeConditions: string[];
}
