// ============================================================================
// src/lib/tools/health-snapshot-comparator/compute.ts
// ----------------------------------------------------------------------------
// BEFORE/AFTER HEALTH SNAPSHOT COMPARATOR - Operations & Fieldcraft tool 7
// (D-86 wave A-3, the LAST of wave A; SCOUT spec PKG-SCOUT-fieldcraft-6-12-v1
// §T7, ANVIL eval anvil-eval-2026-07-16-1430, naming-honesty condition
// binding).
//
// THE NAMING-HONESTY CONTRACT, STRUCTURAL: this tool never ingests state
// data and never diffs anything. YOU DECLARE THE STATES, THE TOOL GATES THE
// CONCLUSION. Seven closed enums describe the comparison you are making -
// why, against what, at what scope, how good the baseline actually is, how
// complete the after-capture is, how long you have observed, and how much
// the target churns on its own. A fixed, original rule registry (D-18) then
// produces the TIERED DELTA REPORT the canon spec names: baseline quality,
// the dimension catalog worth snapshotting (with churn classes), delta
// INTERPRETATION guidance per dimension (should-match / read-with-care /
// expected-drift, each with supports AND weakens), validation-completeness
// gaps, and the CONTINUE / OBSERVE / INVESTIGATE / HOLD-ROLLBACK-READY gate
// with explicit upgrade and downgrade conditions.
//
// BINDING RISK RULE (canon): never label a change successful on green
// components alone - the state-versus-service rule fires unconditionally
// and the gate's conditions carry it even at the best verdict.
//
// DETERMINISM & VERIFICATION: rule-firing snapshot vectors; the
// tool-specific pins are the GATE VERDICT and the selected DIMENSION SET,
// alongside fired rules and the warning set.
// ============================================================================

import type {
  SnapshotDimension,
  SnapshotPair,
  DeltaFinding,
  ValidationGate,
  ChecklistItem,
  QualityWarning,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model - seven closed enums (canon §T7). Free text is export-only.
// ----------------------------------------------------------------------------

export type ComparisonContext =
  | "post-change-validation"
  | "post-incident-recovery"
  | "migration-cutover"
  | "periodic-drift-check"
  | "rollback-decision"
  | "unknown";

export type TargetClass =
  | "firewall"
  | "load-balancer"
  | "dns"
  | "switch-routing"
  | "proxy-sse"
  | "identity"
  | "server-app"
  | "unknown";

export type SnapshotScope = "single-device" | "ha-pair" | "cluster" | "service-population" | "site" | "unknown";

export type BeforeConfidence = "captured-verified" | "captured-unverified" | "from-memory" | "assumed-healthy" | "none";

export type AfterState = "captured-verified" | "captured-unverified" | "partial" | "none-yet";

export type ObservationWindow = "immediate" | "short" | "operational" | "extended" | "unknown";

export type ExpectedChurn = "none-frozen" | "low" | "normal" | "high-dynamic" | "unknown";

export type PresetId = "generic" | "load-balancer" | "dns" | "tls-pki" | "firewall";

export interface HscNotes {
  /** Change/ticket reference - export only. */
  changeRef?: string;
  /** Report title - export only. */
  title?: string;
  /** Free notes - export only. */
  notes?: string;
}

export interface HscInput {
  context: ComparisonContext;
  target: TargetClass;
  scope: SnapshotScope;
  beforeConfidence: BeforeConfidence;
  afterState: AfterState;
  window: ObservationWindow;
  churn: ExpectedChurn;
  preset: PresetId;
  notes?: HscNotes;
}

// ----------------------------------------------------------------------------
// The dimension catalog - fixed, original (D-18). appliesTo "all" or a target
// list; churnClass drives the delta-interpretation expectations.
// ----------------------------------------------------------------------------

interface DimensionDef extends SnapshotDimension {
  appliesTo: "all" | TargetClass[];
}

const DIMENSIONS: readonly DimensionDef[] = [
  { id: "DIM-CONFIG-STATE", title: "Configuration state", churnClass: "stable", appliesTo: "all", record: "The full running configuration (or its hash) from the same export path both times.", deltaMeaning: "Any difference is a real configuration change - intended or not. Attribute every line." },
  { id: "DIM-SERVICE-PROBE", title: "Service response, end to end", churnClass: "slow", appliesTo: "all", record: "The same scripted request from the same vantage: status, latency, and the identity presented.", deltaMeaning: "The service tier's own verdict - the dimension that keeps green components from being mistaken for a working service." },
  { id: "DIM-OBJECT-STATUS", title: "Managed-object status", churnClass: "slow", appliesTo: ["load-balancer", "firewall", "switch-routing", "proxy-sse"], record: "Operational status of the managed objects: pool members, interfaces, tunnels, peers - as a list, not a count.", deltaMeaning: "A member that changed state is a finding even when the aggregate still serves." },
  { id: "DIM-CONTROL-ADJ", title: "Control-plane adjacencies", churnClass: "slow", appliesTo: ["firewall", "switch-routing", "load-balancer"], record: "Routing neighbors and their states, with learned-prefix counts per neighbor.", deltaMeaning: "A missing or flapped adjacency explains reachability changes no data-plane counter will." },
  { id: "DIM-HA-SYNC", title: "HA / cluster sync state", churnClass: "slow", appliesTo: ["firewall", "load-balancer", "identity", "proxy-sse"], record: "Sync status, config epoch, and failover counters on EVERY member - not just the active.", deltaMeaning: "A healthy active with a broken standby is a change that passed validation and a failover that will not." },
  { id: "DIM-RESOLUTION-ANSWERS", title: "Resolution answers", churnClass: "slow", appliesTo: ["dns", "load-balancer", "identity", "server-app"], record: "What the relevant names resolve to, from each view that matters (internal, external).", deltaMeaning: "An answer change moves traffic somewhere else entirely - upstream of every other dimension." },
  { id: "DIM-CERT-CHAIN", title: "Presented certificates", churnClass: "stable", appliesTo: ["load-balancer", "proxy-sse", "identity", "server-app"], record: "The certificate chain each endpoint presents, with expiry dates.", deltaMeaning: "A changed chain is either the intended renewal or the wrong cert now in production - never noise." },
  { id: "DIM-AUTH-FLOW", title: "Authentication transaction", churnClass: "slow", appliesTo: ["identity", "proxy-sse", "server-app"], record: "A full test-principal login: redirect chain, token issuance, and the claims received.", deltaMeaning: "Auth can break while everything below it stays green - this dimension catches it." },
  { id: "DIM-SESSION-COUNTS", title: "Session / connection counts", churnClass: "fast", appliesTo: ["firewall", "load-balancer", "proxy-sse"], record: "Concurrent sessions and new-connection rate, same counter, same sampling method.", deltaMeaning: "Reads as load context, not pass/fail - a cliff or a void is the signal, not ordinary movement." },
  { id: "DIM-ERROR-COUNTERS", title: "Error counters", churnClass: "fast", appliesTo: "all", record: "Drops, resets, retransmits, denies - the same counters, with the time they were read.", deltaMeaning: "Rates matter, absolutes mislead: compare per-interval deltas, and expect movement on a live system." },
  { id: "DIM-POLICY-HITS", title: "Policy hit counters", churnClass: "fast", appliesTo: ["firewall", "proxy-sse", "identity"], record: "Hit counts on the policies the change touched, plus the default/deny rule.", deltaMeaning: "A policy that stopped (or started) matching is the change's real effect showing itself." },
  { id: "DIM-LOG-ERRORCLASS", title: "New log error classes", churnClass: "fast", appliesTo: "all", record: "The SET of distinct error classes in the window - not the volume.", deltaMeaning: "A brand-new error class after a change is a finding at any volume; familiar noise at familiar volume is not." },
  { id: "DIM-CAPACITY-HEADROOM", title: "Capacity headroom", churnClass: "fast", appliesTo: "all", record: "CPU, memory, and table utilization (connections, routes, sessions) at comparable load.", deltaMeaning: "A headroom step-change after a change outlives the validation window - it is tomorrow's incident." },
  { id: "DIM-NEIGHBOR-TOPOLOGY", title: "Neighbor topology", churnClass: "slow", appliesTo: ["switch-routing", "firewall"], record: "LLDP/CDP neighbors and the ARP/MAC entries for the affected segments.", deltaMeaning: "A neighbor that moved or vanished re-frames every other difference as possibly topological." },
];

// ----------------------------------------------------------------------------
// Warnings (fixed ids, vector-pinned).
// ----------------------------------------------------------------------------

const WARNINGS: Record<string, string> = {
  "W-DECLARED-STATES": "This report is gated on DECLARED state classes, not on data this tool has seen. You declare the states, the tool gates the conclusion - verify the declarations against the actual captures.",
  "W-GREEN-NOT-DONE": "Never label a change successful on green components alone: at least one service-tier dimension (end-to-end probe, auth transaction) must agree before any conclusion above 'observe' is honest.",
  "W-BASELINE-WEAK": "The baseline is memory or assumption, not a capture. Differences against it are stories, not evidence - the gate is capped until a real baseline exists.",
  "W-AFTER-INCOMPLETE": "The after-state is incomplete or unverified. Validation completeness is part of the conclusion: what was not captured cannot be declared unchanged.",
  "W-WIN-IMMEDIATE": "The observation window is immediate. Convergence, cache expiry, session re-establishment, and slow consumers have not spoken yet - a clean immediate picture upgrades nothing.",
  "W-WIN-UNKNOWN": "The observation window is unknown - the report cannot say whether time-dependent effects have had their chance to appear.",
  "W-CHURN-UNKNOWN": "Expected churn is unknown: fast-moving dimensions cannot be calibrated, so their differences can be neither dismissed nor trusted.",
  "W-CTX-UNKNOWN": "The comparison context is unknown - the gate can rank evidence quality but cannot tailor the decision it feeds.",
  "W-SCOPE-UNKNOWN": "The scope is unknown: whether one device or a population is being compared changes what 'the same state' even means.",
  "W-TARGET-UNKNOWN": "The target class is unknown - the dimension catalog falls back to the generic set; class-specific dimensions may be missing.",
};


// ----------------------------------------------------------------------------
// Rule registry - fixed order IS the firing order (vector-pinned). Original
// editorial work (D-18). Effects: gate severity bumps, gate reasons/conditions,
// checklist lines, warnings. Severity ladder: 0 continue, 1 observe,
// 2 investigate; the rollback-decision context converts >=2 into
// hold-rollback-ready at gate assembly.
// ----------------------------------------------------------------------------

interface RuleEffect {
  severity?: number; // bump the gate floor to at least this
  reasons?: string[];
  upgrade?: string[];
  downgrade?: string[];
  checklist?: string[];
  warnings?: string[];
}

interface Rule {
  id: string;
  reason: string;
  fire: (inp: HscInput) => RuleEffect | null;
}

const RULES: readonly Rule[] = [
  {
    id: "R-BASE-DECLARED",
    reason: "The report is gated on declared state classes, never on ingested data - the declarations themselves must be verified.",
    fire: () => ({
      warnings: ["W-DECLARED-STATES"],
      checklist: ["Verify each declaration against the actual capture: does the 'before' really exist, verified, where you think it is?"],
    }),
  },
  {
    id: "R-SVC-VS-STATE",
    reason: "Green components are not a working service, and unchanged configuration is not health - the two tiers must BOTH be compared.",
    fire: () => ({
      warnings: ["W-GREEN-NOT-DONE"],
      reasons: ["Any 'continue' is conditional on a service-tier dimension agreeing with the component tier."],
      checklist: ["Pair at least one service-tier dimension (end-to-end probe, auth transaction) with the component dimensions - and record BOTH verdicts."],
    }),
  },
  // ---- comparison context ----
  {
    id: "R-CTX-POSTCHANGE",
    reason: "Post-change validation compares the intended delta against everything else: intended differences confirmed, unintended differences hunted.",
    fire: (i) => (i.context === "post-change-validation" ? { checklist: ["List the differences the change was SUPPOSED to make - every other difference is a finding."] } : null),
  },
  {
    id: "R-CTX-POSTINCIDENT",
    reason: "Recovered is not restored: the honest baseline is the PRE-incident capture, not the mid-incident state everyone stared at.",
    fire: (i) => (i.context === "post-incident-recovery" ? { checklist: ["Compare against the pre-incident baseline, not the mid-incident state - and note where no pre-incident capture exists."], upgrade: ["A pre-incident baseline located and verified for every dimension raises what this comparison can conclude."] } : null),
  },
  {
    id: "R-CTX-MIGRATION",
    reason: "A cutover has TWO targets: the new platform's after must be captured, and the old platform's state preserved for the fallback window.",
    fire: (i) => (i.context === "migration-cutover" ? { checklist: ["Capture the after on the NEW target and freeze the OLD target's final state - the fallback depends on both existing."] } : null),
  },
  {
    id: "R-CTX-DRIFT",
    reason: "A drift check is only as honest as the baseline's age - a stale golden state turns drift detection into archaeology.",
    fire: (i) => (i.context === "periodic-drift-check" ? { checklist: ["Record the baseline's capture date and re-baseline on every approved change - drift is measured against the last KNOWN-GOOD, not the oldest file."] } : null),
  },
  {
    id: "R-CTX-ROLLBACK",
    reason: "A rollback decision needs one more comparison: the rollback path itself is a change, with its own before, after, and blast radius.",
    fire: (i) =>
      i.context === "rollback-decision"
        ? {
            reasons: ["The decision context is rollback: the gate speaks to whether the evidence justifies rolling back, staying, or holding ready."],
            checklist: ["Verify the rollback path itself: the artifact to restore exists, is the right version, and its application procedure is rehearsed."],
            downgrade: ["An unverified rollback artifact turns 'roll back' from a decision into a second incident."],
          }
        : null,
  },
  {
    id: "R-CTX-UNKNOWN",
    reason: "An unknown comparison context leaves the gate ranking evidence without knowing which decision it feeds.",
    fire: (i) => (i.context === "unknown" ? { warnings: ["W-CTX-UNKNOWN"], severity: 1 } : null),
  },
  // ---- baseline quality ----
  {
    id: "R-BEFORE-VERIFIED",
    reason: "A captured and verified baseline is the strongest position this comparison can start from.",
    fire: (i) => (i.beforeConfidence === "captured-verified" ? { upgrade: ["Keep capturing verified baselines on a cadence - the next comparison inherits this one's discipline."] } : null),
  },
  {
    id: "R-BEFORE-UNVERIFIED",
    reason: "A baseline captured but never verified may be the wrong device, the wrong partition, or a truncated export - verify it before trusting deltas against it.",
    fire: (i) => (i.beforeConfidence === "captured-unverified" ? { severity: 1, reasons: ["The baseline exists but is unverified."], checklist: ["Open the baseline capture and verify it: right target, right scope, complete content."], upgrade: ["Verifying the baseline capture raises the gate."] } : null),
  },
  {
    id: "R-BEFORE-MEMORY",
    reason: "A from-memory baseline caps the conclusion: differences against recollection are stories, not evidence.",
    fire: (i) => (i.beforeConfidence === "from-memory" ? { severity: 2, warnings: ["W-BASELINE-WEAK"], reasons: ["The baseline is human memory."], checklist: ["Capture a real baseline NOW - it cannot rescue this comparison, but it is the 'before' the next one deserves."] } : null),
  },
  {
    id: "R-BEFORE-ASSUMED",
    reason: "Assumed-healthy is not a baseline - it is the hypothesis the comparison was supposed to test.",
    fire: (i) => (i.beforeConfidence === "assumed-healthy" ? { severity: 2, warnings: ["W-BASELINE-WEAK"], reasons: ["The baseline is an assumption of health."], checklist: ["Capture a real baseline NOW and treat today's state as the reference for the future, not as proof about the past."] } : null),
  },
  {
    id: "R-BEFORE-NONE",
    reason: "With no baseline there is nothing to compare against - the honest output is a capture plan, not a comparison.",
    fire: (i) => (i.beforeConfidence === "none" ? { severity: 2, warnings: ["W-BASELINE-WEAK"], reasons: ["No baseline exists."], checklist: ["Capture the full dimension set NOW: today's capture is the baseline every future comparison will thank you for."] } : null),
  },
  // ---- after-state completeness ----
  {
    id: "R-AFTER-NONE",
    reason: "No after-capture yet: the comparison has one side - the gate can only say what to capture and wait.",
    fire: (i) => (i.afterState === "none-yet" ? { severity: 1, warnings: ["W-AFTER-INCOMPLETE"], reasons: ["The after-state has not been captured yet."], checklist: ["Capture the after across the SAME dimension set, same method, same vantage as the baseline."] } : null),
  },
  {
    id: "R-AFTER-PARTIAL",
    reason: "A partial after-capture means validation completeness is itself a finding: what was not captured cannot be declared unchanged.",
    fire: (i) => (i.afterState === "partial" ? { severity: 1, warnings: ["W-AFTER-INCOMPLETE"], reasons: ["The after-capture is partial."], checklist: ["List the dimensions with NO after-capture - they are open items, not passes."], upgrade: ["Completing the after-capture across the dimension set raises the gate."] } : null),
  },
  {
    id: "R-AFTER-UNVERIFIED",
    reason: "An unverified after-capture carries the same risks as an unverified baseline - wrong target, wrong scope, truncated.",
    fire: (i) => (i.afterState === "captured-unverified" ? { severity: 1, reasons: ["The after-capture is unverified."], checklist: ["Verify the after-capture: right target, right scope, complete content."] } : null),
  },
  // ---- observation window ----
  {
    id: "R-WIN-IMMEDIATE",
    reason: "An immediate window has not let convergence, caches, or slow consumers speak - a clean picture now upgrades nothing.",
    fire: (i) => (i.window === "immediate" ? { severity: 1, warnings: ["W-WIN-IMMEDIATE"], upgrade: ["Re-capture after an operational window (hours, spanning real load) to let time-dependent effects surface."] } : null),
  },
  {
    id: "R-WIN-EXTENDED",
    reason: "Over an extended window, unrelated drift accumulates - attribute each difference before charging it to the change.",
    fire: (i) => (i.window === "extended" ? { checklist: ["For each difference, ask: could ordinary drift over this window explain it? Attribute before you attribute-to-the-change."] } : null),
  },
  {
    id: "R-WIN-UNKNOWN",
    reason: "With an unknown window the report cannot say whether time-dependent effects have had their chance.",
    fire: (i) => (i.window === "unknown" ? { severity: 1, warnings: ["W-WIN-UNKNOWN"] } : null),
  },
  // ---- expected churn ----
  {
    id: "R-CHURN-HIGH",
    reason: "On a high-churn target, fast-moving dimensions are EXPECTED to differ - reading their movement as regression is the classic false alarm.",
    fire: (i) => (i.churn === "high-dynamic" ? { checklist: ["Judge fast-churn dimensions by rates and NEW classes, never by raw before/after inequality."] } : null),
  },
  {
    id: "R-CHURN-FROZEN",
    reason: "Under a freeze, even fast dimensions should hold still - any drift is sharp evidence precisely because churn was excluded.",
    fire: (i) => (i.churn === "none-frozen" ? { reasons: ["A freeze is declared: differences in ANY dimension are findings."] } : null),
  },
  {
    id: "R-CHURN-UNKNOWN",
    reason: "Unknown churn means fast dimensions can be neither dismissed nor trusted - calibrate before concluding from them.",
    fire: (i) => (i.churn === "unknown" ? { severity: 1, warnings: ["W-CHURN-UNKNOWN"] } : null),
  },
  // ---- scope ----
  {
    id: "R-SCOPE-HA",
    reason: "An HA pair is TWO devices: a healthy active with a broken standby is a validation pass and a failover failure.",
    fire: (i) => (i.scope === "ha-pair" ? { checklist: ["Capture BOTH members - status, sync state, config epoch - not just the active."] } : null),
  },
  {
    id: "R-SCOPE-CLUSTER",
    reason: "In a cluster, compare the same member to itself - cross-member comparison confuses drift with divergence.",
    fire: (i) => (i.scope === "cluster" ? { checklist: ["Compare per-member (same identity before and after) AND check members against each other for divergence."] } : null),
  },
  {
    id: "R-SCOPE-POPULATION",
    reason: "A service population needs an aggregate view plus a named exemplar - aggregates hide the one member that broke.",
    fire: (i) => (i.scope === "service-population" || i.scope === "site" ? { checklist: ["Capture the aggregate AND a named exemplar per role - the exemplar is where differences become explainable."] } : null),
  },
  {
    id: "R-SCOPE-UNKNOWN",
    reason: "With unknown scope, 'the same state' has no defined meaning.",
    fire: (i) => (i.scope === "unknown" ? { severity: 1, warnings: ["W-SCOPE-UNKNOWN"] } : null),
  },
  // ---- target ----
  {
    id: "R-TARGET-UNKNOWN",
    reason: "An unknown target class falls back to the generic dimension catalog - class-specific dimensions may be missing from the plan.",
    fire: (i) => (i.target === "unknown" ? { warnings: ["W-TARGET-UNKNOWN"] } : null),
  },
];

export const RULE_COUNT = RULES.length;
export const DIMENSION_COUNT = DIMENSIONS.length;

// ----------------------------------------------------------------------------
// Engine
// ----------------------------------------------------------------------------

export interface FiredRule {
  id: string;
  reason: string;
}

export interface HscResult {
  baseline: SnapshotPair;
  dimensions: SnapshotDimension[];
  findings: DeltaFinding[];
  gate: ValidationGate;
  completenessGaps: string[];
  warnings: QualityWarning[];
  checklist: ChecklistItem[];
  firedRules: FiredRule[];
  artifact: ExportArtifact;
}

const ENUMS: Record<keyof Omit<HscInput, "notes" | "preset">, readonly string[]> = {
  context: ["post-change-validation", "post-incident-recovery", "migration-cutover", "periodic-drift-check", "rollback-decision", "unknown"],
  target: ["firewall", "load-balancer", "dns", "switch-routing", "proxy-sse", "identity", "server-app", "unknown"],
  scope: ["single-device", "ha-pair", "cluster", "service-population", "site", "unknown"],
  beforeConfidence: ["captured-verified", "captured-unverified", "from-memory", "assumed-healthy", "none"],
  afterState: ["captured-verified", "captured-unverified", "partial", "none-yet"],
  window: ["immediate", "short", "operational", "extended", "unknown"],
  churn: ["none-frozen", "low", "normal", "high-dynamic", "unknown"],
};

export class HscError extends Error {
  constructor(public code: "empty" | "format", message: string) {
    super(message);
  }
}

/** Validate a candidate input; throws HscError on failure (API-parity gate). */
export function validateInput(raw: unknown): HscInput {
  if (raw == null || (typeof raw === "object" && Object.keys(raw as object).length === 0)) {
    throw new HscError("empty", "Empty input: all seven fields are required.");
  }
  if (typeof raw !== "object") throw new HscError("format", "Input must be a JSON object.");
  const o = raw as Record<string, unknown>;
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = o[field];
    if (typeof v !== "string" || !allowed.includes(v)) {
      throw new HscError("format", `Field "${field}" must be one of: ${allowed.join(", ")}.`);
    }
  }
  const presets: readonly string[] = ["generic", "load-balancer", "dns", "tls-pki", "firewall"];
  if (typeof o.preset !== "string" || !presets.includes(o.preset)) {
    throw new HscError("format", `Field "preset" must be one of: ${presets.join(", ")}.`);
  }
  const notes = (typeof o.notes === "object" && o.notes) || undefined;
  return {
    context: o.context as ComparisonContext,
    target: o.target as TargetClass,
    scope: o.scope as SnapshotScope,
    beforeConfidence: o.beforeConfidence as BeforeConfidence,
    afterState: o.afterState as AfterState,
    window: o.window as ObservationWindow,
    churn: o.churn as ExpectedChurn,
    preset: o.preset as PresetId,
    notes: notes as HscNotes | undefined,
  };
}

/** Delta expectation per dimension churn class x declared environment churn. */
function expectationFor(dim: SnapshotDimension, churn: ExpectedChurn): DeltaFinding["expectation"] {
  if (dim.churnClass === "stable") return "should-match";
  if (dim.churnClass === "slow") {
    return churn === "none-frozen" || churn === "low" ? "should-match" : "read-with-care";
  }
  // fast dimensions
  return churn === "none-frozen" ? "read-with-care" : "expected-drift";
}

const EXPECTATION_TEXT: Record<DeltaFinding["expectation"], { supports: string; weakens: string }> = {
  "should-match": {
    supports: "Any difference here is a material finding: this dimension should not move on its own under the declared conditions - attribute it fully before concluding anything.",
    weakens: "An exact match here genuinely supports 'no unintended change' for this dimension - it is the kind of evidence the gate can lean on.",
  },
  "read-with-care": {
    supports: "A difference here is a lead, not a verdict: normal operation can move this dimension, so corroborate with a stable dimension before treating it as the change's effect.",
    weakens: "A match here is comforting but not conclusive - the dimension could have moved and returned within the window.",
  },
  "expected-drift": {
    supports: "A difference here is EXPECTED under the declared churn: only rate cliffs, voids, or brand-new classes count as findings.",
    weakens: "Neither a match nor a difference here settles anything on its own - this dimension is context, not verdict, at this churn level.",
  },
};

/** The deterministic core. */
export function run(input: HscInput): HscResult {
  // ---- 1. Fire the rules. ----
  let severity = 0;
  const reasons: string[] = [];
  const upgrade: string[] = [];
  const downgrade: string[] = [];
  const checklist: ChecklistItem[] = [];
  const warnIds: string[] = [];
  const fired: FiredRule[] = [];
  for (const rule of RULES) {
    const eff = rule.fire(input);
    if (!eff) continue;
    fired.push({ id: rule.id, reason: rule.reason });
    if (eff.severity !== undefined && eff.severity > severity) severity = eff.severity;
    for (const r of eff.reasons ?? []) reasons.push(r);
    for (const u of eff.upgrade ?? []) upgrade.push(u);
    for (const d of eff.downgrade ?? []) downgrade.push(d);
    for (const c of eff.checklist ?? []) checklist.push({ id: `${rule.id}-CL${checklist.length}`, text: c, checked: false });
    for (const w of eff.warnings ?? []) if (!warnIds.includes(w)) warnIds.push(w);
  }

  // ---- 2. Assemble the gate. Severity ladder -> verdict. Under a
  // rollback-decision context, ANY evidence gap (severity >= 1) converts to
  // hold-rollback-ready: when the question on the table is "roll back?",
  // anything short of clean evidence means keep the rollback armed while the
  // gaps close; clean evidence (severity 0) stays "continue" - do not roll. ----
  let verdict: ValidationGate["verdict"] = severity >= 2 ? "investigate" : severity === 1 ? "observe" : "continue";
  if (input.context === "rollback-decision" && severity >= 1) verdict = "hold-rollback-ready";
  const gate: ValidationGate = {
    verdict,
    reasons: reasons.length ? reasons : ["The declared evidence classes support this tier - conditional on the checklist and the service-tier pairing."],
    upgradeConditions: upgrade,
    downgradeConditions: downgrade.length ? downgrade : ["Any dimension found different where the expectation is should-match drops the verdict until it is attributed."],
  };

  // ---- 3. Dimension selection (fixed order; unknown target -> generic set). ----
  const dimensions: SnapshotDimension[] = DIMENSIONS.filter((d) => d.appliesTo === "all" || (input.target !== "unknown" && (d.appliesTo as TargetClass[]).includes(input.target))).map(
    ({ appliesTo: _a, ...dim }) => dim,
  );

  // ---- 4. Delta-interpretation findings per selected dimension. ----
  const findings: DeltaFinding[] = dimensions.map((d) => {
    const expectation = expectationFor(d, input.churn);
    return { dimensionId: d.id, expectation, meaning: d.deltaMeaning, ...EXPECTATION_TEXT[expectation] };
  });

  // ---- 5. Validation-completeness gaps. ----
  const completenessGaps: string[] = [];
  if (input.beforeConfidence === "none") completenessGaps.push("No baseline capture exists.");
  if (input.beforeConfidence === "from-memory" || input.beforeConfidence === "assumed-healthy") completenessGaps.push("The baseline is not a capture (memory / assumption).");
  if (input.beforeConfidence === "captured-unverified") completenessGaps.push("The baseline capture is unverified.");
  if (input.afterState === "none-yet") completenessGaps.push("No after-capture exists yet.");
  if (input.afterState === "partial") completenessGaps.push("The after-capture does not cover the full dimension set.");
  if (input.afterState === "captured-unverified") completenessGaps.push("The after-capture is unverified.");
  if (input.window === "immediate") completenessGaps.push("Time-dependent effects have not had their window.");
  if (input.window === "unknown") completenessGaps.push("The observation window is undeclared.");
  if (input.churn === "unknown") completenessGaps.push("Expected churn is undeclared - fast dimensions are uncalibrated.");

  const baseline: SnapshotPair = {
    beforeConfidence: input.beforeConfidence,
    afterState: input.afterState,
    note:
      input.beforeConfidence === "captured-verified" && input.afterState === "captured-verified"
        ? "Both sides are captured and verified - the comparison stands on real state."
        : "At least one side of this comparison is weaker than a verified capture - the gate reflects it.",
  };

  const warnings: QualityWarning[] = warnIds.map((id) => ({ id, message: WARNINGS[id] }));

  // ---- 6. Export artifact (free text enters HERE and only here). ----
  const n = input.notes ?? {};
  const artifact: ExportArtifact = {
    kind: "snapshot-comparison-report",
    title: n.title?.trim() ? n.title.trim() : "Before/after health comparison report",
    sections: [
      ["Context", [
        `Context: ${input.context} | Target: ${input.target} | Scope: ${input.scope}`,
        `Before: ${input.beforeConfidence} | After: ${input.afterState} | Window: ${input.window} | Churn: ${input.churn} | Preset: ${input.preset}`,
        ...(n.changeRef ? [`Change reference: ${n.changeRef}`] : []),
      ].join("\n")],
      ["Baseline quality", `${baseline.note} (before: ${baseline.beforeConfidence}; after: ${baseline.afterState})`],
      ["Gate", [`Verdict: ${gate.verdict.toUpperCase()}`, ...gate.reasons.map((r) => `- ${r}`), "Raises the tier:", ...gate.upgradeConditions.map((u) => `- ${u}`), "Drops the tier:", ...gate.downgradeConditions.map((d) => `- ${d}`)].join("\n")],
      ["Dimensions to compare", dimensions.map((d) => `- ${d.id} [${d.churnClass}] ${d.title}: ${d.record}`).join("\n")],
      ["Delta interpretation", findings.map((f) => `${f.dimensionId} [${f.expectation}] ${f.meaning}\n- supports a finding: ${f.supports}\n- weakens a conclusion: ${f.weakens}`).join("\n\n")],
      ["Validation completeness", completenessGaps.map((g) => `- ${g}`).join("\n") || "(no declared gaps)"],
      ["Checklist", checklist.map((c) => `- [ ] ${c.text}`).join("\n") || "(none)"],
      ["Warnings", warnings.map((w) => `- ${w.id}: ${w.message}`).join("\n") || "(none)"],
      ...(n.notes ? [["Notes", n.notes] as [string, string]] : []),
    ],
  };

  return { baseline, dimensions, findings, gate, completenessGaps, warnings, checklist, firedRules: fired, artifact };
}

/** JSON string entry point (API parity, D-72). */
export function runFromJson(json: string): HscResult {
  if (!json || !json.trim()) throw new HscError("empty", "Empty input.");
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new HscError("format", "Input is not valid JSON.");
  }
  return run(validateInput(raw));
}

export { artifactToMarkdown };
