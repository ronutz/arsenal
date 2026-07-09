// ============================================================================
// src/lib/tools/incident-timeline-rca-builder/compute.ts
// ----------------------------------------------------------------------------
// INCIDENT TIMELINE & RCA BUILDER - Operations & Fieldcraft, tool 3 (D-86),
// built on the shared fieldcraft foundation the FHB pilot established.
//
// WHAT IT IS: an advisory structuring engine for the after-incident write-up.
// You enter the incident's events as a small structured timeline (each event
// a kind + an ordered position + optional note) and mark which contributing-
// factor DOMAINS you observed; a fixed, original rule set (D-18: original by
// construction) fires deterministically and produces (a) an ORDERED, LABELLED
// TIMELINE with the detection/mitigation/resolution milestones and the derived
// duration bands, (b) a set of CONTRIBUTING-FACTOR CANDIDATES to investigate,
// each with the evidence that would confirm or rule it out, and (c) quality
// warnings about the timeline itself. One click exports a Markdown RCA
// scaffold for the incident review.
//
// THE HARD LANGUAGE CONSTRAINT (D-86 §3.2 + §3.5, binding, and the reason
// this tool needed the most care): it NEVER names a root cause. It structures
// CANDIDATE contributing factors and the evidence each would need. A factor is
// only ever echoed as "confirmed" when the USER explicitly marks it confirmed
// (the `confirmed` flag on a factor observation) - and even then the tool
// attributes the confirmation to the user, never asserts it itself. Field
// names, output strings, and the export all hold this line: "candidate
// contributing factor", "evidence to confirm or rule out", never "root cause
// found". An RCA is written by people from evidence; this scaffolds that work.
//
// WHAT IT IS NOT: it does not diagnose, does not assign blame, makes no
// network calls, asks for no credentials, and replaces neither a real
// post-incident review nor vendor RCA. It structures; humans conclude.
//
// DETERMINISM & VERIFICATION (D-86 §3.1 - the pilot's ruling, cluster-wide):
// same structured input -> same rules fire, same ordered timeline, same
// candidate set, same warnings. Verification model: RULE-FIRING SNAPSHOT
// VECTORS. The D-49 manifest carries `verificationModel:
// "rule-firing-snapshot"`.
//
// I18N NOTE: timeline labels / candidate / evidence text is canonical English
// from the engine (vector-pinned); all form chrome is localized. Same posture
// as the FHB and the runbook builder.
// ============================================================================

import type {
  RiskFactor,
  QualityWarning,
  ExportArtifact,
} from "@/lib/fieldcraft/schema";
import { artifactToMarkdown } from "@/lib/fieldcraft/markdown";

// ----------------------------------------------------------------------------
// Input model. A timeline is a LIST of events (each a closed-enum kind + an
// integer order the user controls) plus a set of contributing-factor
// observations (closed-enum domains, each optionally user-confirmed). Free
// text lives only in per-event notes and the summary, and flows ONLY to the
// export - never into rule matching.
// ----------------------------------------------------------------------------

/** The kind of a timeline event. Closed enum so milestone detection is
 *  deterministic. The milestone kinds (detected/mitigated/resolved) drive the
 *  duration bands; the rest are context. */
export type EventKind =
  | "change-made"
  | "symptom-began"
  | "alert-fired"
  | "detected"
  | "investigation-step"
  | "escalated"
  | "mitigated"
  | "resolved"
  | "other";

export interface TimelineEvent {
  /** Stable id for the event (client-assigned; used for ordering + checklist). */
  id: string;
  kind: EventKind;
  /** Integer order controlled by the user (ascending = earlier -> later).
   *  The engine sorts by this; it never reads a clock. */
  order: number;
  /** Optional free text: what happened at this event. Artifact-only. */
  note?: string;
}

/** A contributing-factor DOMAIN the user observed. Never a "root cause". */
export type FactorDomain =
  | "recent-change"
  | "capacity-saturation"
  | "dependency-failure"
  | "configuration-error"
  | "expired-credential"
  | "human-process-gap"
  | "monitoring-gap"
  | "external-provider"
  | "unknown-still";

export interface FactorObservation {
  domain: FactorDomain;
  /** TRUE only when the USER has confirmed this factor from their own
   *  evidence. The engine never sets this; it only echoes what the user
   *  marked, and always attributes the confirmation to the user. */
  confirmed: boolean;
}

export interface RcaNotes {
  /** One-line incident summary. Artifact-only. */
  summary?: string;
  /** What is still open / owed follow-up. Artifact-only. */
  followups?: string;
}

export interface RcaInput {
  events: TimelineEvent[];
  factors: FactorObservation[];
  notes?: RcaNotes;
}

// ----------------------------------------------------------------------------
// Output.
// ----------------------------------------------------------------------------

export interface OrderedEvent {
  id: string;
  kind: EventKind;
  order: number;
  /** Human label for the kind (canonical English). */
  label: string;
  note?: string;
  /** True if this event is one of the milestone kinds. */
  milestone: boolean;
}

/** A derived duration band between two milestones (e.g. detect -> mitigate).
 *  Expressed in EVENT-COUNT terms, never wall-clock: the engine has no clock,
 *  and the user controls order, so the band reports "N events between" plus
 *  the labelled endpoints. */
export interface DurationBand {
  id: string;
  label: string;
  fromKind: EventKind;
  toKind: EventKind;
  /** Number of events strictly between the two milestones (inclusive of the
   *  span endpoints is stated in the label). */
  eventsSpanned: number;
}

/** A candidate contributing factor - never a root cause. */
export interface FactorCandidate {
  id: string;
  domain: FactorDomain;
  /** Canonical-English label, phrased as a domain to investigate. */
  title: string;
  /** Why this domain is worth investigating given the timeline. */
  rationale: string;
  /** Evidence that would CONFIRM this factor (collected by a human). */
  confirmEvidence: string[];
  /** Evidence that would RULE IT OUT - the honest other half. */
  ruleOutEvidence: string[];
  /** Whether the USER marked this factor confirmed. Attributed to the user
   *  everywhere it is shown; the engine never asserts it. */
  userConfirmed: boolean;
}

export interface RcaResult {
  timeline: OrderedEvent[];
  bands: DurationBand[];
  candidates: FactorCandidate[];
  warnings: QualityWarning[];
  /** Non-blocking structural notes (e.g. "no detection milestone recorded"). */
  risks: RiskFactor[];
  firedRuleIds: string[];
  artifact: ExportArtifact;
}

export class RcaError extends Error {
  code: "empty" | "format";
  constructor(code: "empty" | "format", message?: string) {
    super(message ?? code);
    this.name = "RcaError";
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// Event-kind labels (canonical English).
// ----------------------------------------------------------------------------

const EVENT_LABELS: Record<EventKind, string> = {
  "change-made": "Change made",
  "symptom-began": "Symptom began",
  "alert-fired": "Alert fired",
  detected: "Detected (human aware)",
  "investigation-step": "Investigation step",
  escalated: "Escalated",
  mitigated: "Mitigated (impact reduced)",
  resolved: "Resolved (service restored)",
  other: "Other",
};

const MILESTONE_KINDS: EventKind[] = ["detected", "mitigated", "resolved"];

// ----------------------------------------------------------------------------
// Contributing-factor registry. Titles are DOMAINS to investigate, never
// verdicts. Each carries the evidence that would confirm or rule it out.
// Original editorial content (D-18); no external framework reproduced.
// ----------------------------------------------------------------------------

interface FactorDef {
  domain: FactorDomain;
  title: string;
  rationale: string;
  confirmEvidence: string[];
  ruleOutEvidence: string[];
}

const FACTORS: FactorDef[] = [
  {
    domain: "recent-change",
    title: "A recent change",
    rationale: "A change close to the symptom onset is the most common contributing factor and the first to test against the timeline - alignment is a hypothesis to confirm, not a verdict.",
    confirmEvidence: [
      "The change record's timestamp sits just before the first symptom event in the timeline",
      "Rolling the change back cleared the symptom",
      "Only surfaces the change touched were affected",
    ],
    ruleOutEvidence: [
      "The first symptom event precedes the change",
      "Unchanged, unrelated systems showed the same symptom",
    ],
  },
  {
    domain: "capacity-saturation",
    title: "Capacity or saturation",
    rationale: "If the incident tracked load or growth, a saturated resource (link, CPU, memory, connection table, queue) is a domain to investigate.",
    confirmEvidence: [
      "Utilization at the incident window sat at or near a ceiling",
      "Symptom intensity tracked traffic volume",
      "A growth or event (campaign, batch, new site) coincided with onset",
    ],
    ruleOutEvidence: [
      "Resources sat well below limits throughout the window",
      "The symptom occurred at negligible load",
    ],
  },
  {
    domain: "dependency-failure",
    title: "A failed dependency",
    rationale: "If a downstream service, database, or shared component degraded, the incident may be a symptom of its failure rather than of the affected service itself.",
    confirmEvidence: [
      "A dependency's own health signals degraded in the same window",
      "The affected service recovered when the dependency did",
      "Errors point at calls to the dependency specifically",
    ],
    ruleOutEvidence: [
      "Every dependency stayed healthy through the window",
      "The service failed even on paths that do not touch the dependency",
    ],
  },
  {
    domain: "configuration-error",
    title: "A configuration error",
    rationale: "A wrong or drifted configuration is a domain to test, distinct from the act of change: config can be wrong without a recent change (drift, a latent error surfaced by conditions).",
    confirmEvidence: [
      "The running configuration differs from the intended or last-known-good version",
      "Correcting the configuration cleared the symptom",
    ],
    ruleOutEvidence: [
      "The configuration matches the intended version exactly",
      "The symptom persisted after the configuration was corrected",
    ],
  },
  {
    domain: "expired-credential",
    title: "An expired certificate or credential",
    rationale: "Certificates and credentials expire on their own schedule with no change made; if the timeline shows TLS or auth failures, this is a domain to check against expiry instants.",
    confirmEvidence: [
      "A certificate or credential's expiry instant matches the symptom onset",
      "Renewing it cleared the symptom",
    ],
    ruleOutEvidence: [
      "All relevant certificates and credentials were valid through the window",
      "The failure was not authentication or handshake related",
    ],
  },
  {
    domain: "human-process-gap",
    title: "A process or human-factors gap",
    rationale: "Sometimes the contributing factor is in the process - a missed step, an unclear runbook, a handoff that dropped - and naming it is how the process improves, not how blame is assigned.",
    confirmEvidence: [
      "A defined step was skipped or a runbook was ambiguous at the decision point",
      "The same gap has contributed to a prior incident",
    ],
    ruleOutEvidence: [
      "The process was followed as written and the outcome still occurred",
    ],
  },
  {
    domain: "monitoring-gap",
    title: "A detection or monitoring gap",
    rationale: "If the timeline shows a long gap between symptom onset and detection, the monitoring itself is a domain to investigate - not as the cause of the incident, but as why it ran longer than it needed to.",
    confirmEvidence: [
      "The symptom began well before any alert fired or a human noticed",
      "No monitor covered the failing signal",
    ],
    ruleOutEvidence: [
      "An alert fired promptly at or near symptom onset",
      "Detection was immediate and the delay was elsewhere",
    ],
  },
  {
    domain: "external-provider",
    title: "An external provider",
    rationale: "If a provider (cloud, transit, DNS, upstream API) had an incident in the same window, the contributing factor may be theirs; the evidence is their status history, checked against your timeline.",
    confirmEvidence: [
      "The provider's status history shows an incident overlapping your window",
      "Your symptom cleared when theirs did",
    ],
    ruleOutEvidence: [
      "The provider reported healthy throughout the window",
      "The symptom appeared on paths that do not traverse the provider",
    ],
  },
  {
    domain: "unknown-still",
    title: "Still unknown",
    rationale: "An honest RCA scaffold names what is still not understood. Leaving this open is a finding, not a failure: it marks the evidence still owed before the review can close.",
    confirmEvidence: [
      "The evidence needed to distinguish the remaining candidates has not yet been collected",
    ],
    ruleOutEvidence: [
      "Evidence has confirmed one of the other candidates and closed the question",
    ],
  },
];

const FACTOR_BY_DOMAIN = new Map(FACTORS.map((f) => [f.domain, f]));

// ----------------------------------------------------------------------------
// Structural risks (non-blocking notes about the TIMELINE, not the incident).
// ----------------------------------------------------------------------------

const RISKS: { id: string; label: string; severity: RiskFactor["severity"]; note?: string }[] = [
  { id: "RK-NO-DETECT", label: "No detection milestone recorded", severity: "low", note: "Add when the incident became known so detection time can be reasoned about." },
  { id: "RK-NO-RESOLVE", label: "No resolution milestone recorded", severity: "low", note: "Add when service was restored so the incident duration is bounded." },
  { id: "RK-LONG-DETECT-GAP", label: "Long gap before detection", severity: "medium", note: "Several events passed between the symptom beginning and it being detected; the monitoring-gap candidate is worth investigating." },
  { id: "RK-NO-CHANGE-EVENT", label: "No change recorded in the timeline", severity: "low", note: "If a change contributed, adding it to the timeline lets its alignment be reasoned about; if none, that is itself a finding." },
];

// ----------------------------------------------------------------------------
// Rule registry. Rules key candidate factors and structural risks off the
// timeline shape and the observed factor domains. A factor observed by the
// user is always surfaced as a candidate; rules ADD candidates the timeline
// implies and attach structural risks. Original editorial work (D-18).
// ----------------------------------------------------------------------------

interface Rule {
  id: string;
  when: (i: RcaInput, ctx: TimelineContext) => boolean;
  /** Factor domains this rule surfaces as candidates. */
  factors?: FactorDomain[];
  /** Structural risk id this rule attaches. */
  risk?: string;
  because: string;
}

interface TimelineContext {
  kinds: Set<EventKind>;
  hasDetect: boolean;
  hasResolve: boolean;
  hasChange: boolean;
  hasSymptom: boolean;
  /** events strictly between symptom-began and the first detection event. */
  detectGap: number;
  observedDomains: Set<FactorDomain>;
  confirmedDomains: Set<FactorDomain>;
}

const RULES: Rule[] = [
  // Every user-observed factor becomes a candidate (the spine).
  {
    id: "R-OBSERVED-FACTORS",
    when: (_i, ctx) => ctx.observedDomains.size > 0,
    // factors resolved dynamically in run() from the observation list
    because: "Each contributing-factor domain you observed is surfaced as a candidate to investigate, with the evidence that would confirm or rule it out.",
  },
  // A change event in the timeline implies the recent-change candidate (the
  // dedup in run() prevents duplicating an already-observed factor).
  {
    id: "R-CHANGE-IN-TIMELINE",
    when: (_i, ctx) => ctx.hasChange,
    factors: ["recent-change"],
    because: "The timeline records a change; its alignment with the symptom onset is a candidate to test even though it was not listed as an observed factor.",
  },
  // A long detect gap attaches the structural risk (always, on the gap) and
  // implies the monitoring-gap candidate (only if the user did not already
  // observe it, so the candidate is not duplicated).
  {
    id: "R-DETECT-GAP",
    when: (_i, ctx) => ctx.hasSymptom && ctx.hasDetect && ctx.detectGap >= 2,
    factors: ["monitoring-gap"],
    risk: "RK-LONG-DETECT-GAP",
    because: "Several events passed between the symptom beginning and detection; the monitoring/detection domain is a candidate for why the incident ran as long as it did.",
  },
  // No detection milestone -> structural risk.
  {
    id: "R-NO-DETECT",
    when: (_i, ctx) => !ctx.hasDetect,
    risk: "RK-NO-DETECT",
    because: "No detection milestone is recorded, so detection time cannot be reasoned about; add when the incident became known.",
  },
  // No resolution milestone -> structural risk.
  {
    id: "R-NO-RESOLVE",
    when: (_i, ctx) => !ctx.hasResolve,
    risk: "RK-NO-RESOLVE",
    because: "No resolution milestone is recorded, so the incident duration is unbounded; add when service was restored.",
  },
  // No change event -> gentle structural note.
  {
    id: "R-NO-CHANGE",
    when: (_i, ctx) => !ctx.hasChange,
    risk: "RK-NO-CHANGE-EVENT",
    because: "No change is recorded in the timeline; if one contributed, adding it lets its alignment be reasoned about, and if none did, that absence is itself a finding.",
  },
  // If nothing else surfaced a candidate and no factor was observed, keep the
  // scaffold honest with the still-unknown candidate.
  {
    id: "R-STILL-UNKNOWN",
    when: (_i, ctx) => ctx.observedDomains.size === 0 && !ctx.hasChange,
    factors: ["unknown-still"],
    because: "No contributing factor was observed and none is implied by the timeline yet, so the scaffold names the question as still open - the evidence to close it is still owed.",
  },
];

// ----------------------------------------------------------------------------
// Validation (closed-enum; free text never enters rule matching).
// ----------------------------------------------------------------------------

const VALID_EVENT_KINDS: EventKind[] = ["change-made", "symptom-began", "alert-fired", "detected", "investigation-step", "escalated", "mitigated", "resolved", "other"];
const VALID_FACTOR_DOMAINS: FactorDomain[] = ["recent-change", "capacity-saturation", "dependency-failure", "configuration-error", "expired-credential", "human-process-gap", "monitoring-gap", "external-provider", "unknown-still"];

export function validateInput(raw: unknown): RcaInput {
  const i = raw as Partial<RcaInput>;
  if (!i || typeof i !== "object") throw new RcaError("format", "input must be an object");
  if (!Array.isArray(i.events)) throw new RcaError("format", "events must be an array");
  if (i.events.length === 0) throw new RcaError("format", "events must not be empty");
  for (const e of i.events) {
    if (!e || typeof e !== "object") throw new RcaError("format", "each event must be an object");
    if (typeof e.id !== "string" || e.id === "") throw new RcaError("format", "each event needs an id");
    if (!VALID_EVENT_KINDS.includes(e.kind as EventKind)) throw new RcaError("format", `invalid event kind: ${(e as TimelineEvent).kind}`);
    if (typeof e.order !== "number" || !Number.isFinite(e.order)) throw new RcaError("format", "each event needs a numeric order");
  }
  if (!Array.isArray(i.factors)) throw new RcaError("format", "factors must be an array");
  for (const f of i.factors) {
    if (!f || typeof f !== "object") throw new RcaError("format", "each factor must be an object");
    if (!VALID_FACTOR_DOMAINS.includes(f.domain as FactorDomain)) throw new RcaError("format", `invalid factor domain: ${(f as FactorObservation).domain}`);
    if (typeof f.confirmed !== "boolean") throw new RcaError("format", "each factor needs a boolean confirmed flag");
  }
  return i as RcaInput;
}

// ----------------------------------------------------------------------------
// run - order the timeline, derive milestone bands, assemble candidate
// contributing factors (NEVER a root cause), attach structural risks and
// warnings, and build the RCA scaffold artifact. Fully deterministic.
// ----------------------------------------------------------------------------

export function run(rawInput: RcaInput | unknown): RcaResult {
  const input = validateInput(rawInput);

  // 1. Order the timeline by the user-controlled `order` (stable for ties by
  //    original index). The engine never reads a clock.
  const indexed = input.events.map((e, idx) => ({ e, idx }));
  indexed.sort((a, b) => a.e.order - b.e.order || a.idx - b.idx);
  const timeline: OrderedEvent[] = indexed.map(({ e }) => ({
    id: e.id,
    kind: e.kind,
    order: e.order,
    label: EVENT_LABELS[e.kind],
    note: e.note,
    milestone: MILESTONE_KINDS.includes(e.kind),
  }));

  // 2. Build the timeline context.
  const kinds = new Set(timeline.map((t) => t.kind));
  const firstIndexOf = (k: EventKind) => timeline.findIndex((t) => t.kind === k);
  const symptomIdx = firstIndexOf("symptom-began");
  const detectIdx = firstIndexOf("detected");
  const detectGap = symptomIdx >= 0 && detectIdx > symptomIdx ? detectIdx - symptomIdx - 1 : 0;

  const observedDomains = new Set(input.factors.map((f) => f.domain));
  const confirmedDomains = new Set(input.factors.filter((f) => f.confirmed).map((f) => f.domain));

  const ctx: TimelineContext = {
    kinds,
    hasDetect: kinds.has("detected"),
    hasResolve: kinds.has("resolved"),
    hasChange: kinds.has("change-made"),
    hasSymptom: kinds.has("symptom-began"),
    detectGap,
    observedDomains,
    confirmedDomains,
  };

  // 3. Fire rules in registry order.
  const fired = RULES.filter((r) => r.when(input, ctx));

  // 4. Assemble candidate domains: user-observed first (registry-stable order),
  //    then any implied by fired rules, deduped, in a stable canonical order.
  const candidateDomains: FactorDomain[] = [];
  const seen = new Set<FactorDomain>();
  // user-observed, in the canonical registry order
  for (const f of FACTORS) {
    if (observedDomains.has(f.domain)) {
      candidateDomains.push(f.domain);
      seen.add(f.domain);
    }
  }
  // rule-implied
  for (const r of fired) {
    for (const d of r.factors ?? []) {
      if (!seen.has(d)) {
        candidateDomains.push(d);
        seen.add(d);
      }
    }
  }

  const candidates: FactorCandidate[] = candidateDomains.map((domain) => {
    const def = FACTOR_BY_DOMAIN.get(domain)!;
    return {
      id: `F-${domain}`,
      domain,
      title: def.title,
      rationale: def.rationale,
      confirmEvidence: def.confirmEvidence,
      ruleOutEvidence: def.ruleOutEvidence,
      userConfirmed: confirmedDomains.has(domain),
    };
  });

  // 5. Milestone duration bands (event-count terms, never wall-clock).
  const bands: DurationBand[] = [];
  const detectPos = firstIndexOf("detected");
  const mitigatePos = firstIndexOf("mitigated");
  const resolvePos = firstIndexOf("resolved");
  if (symptomIdx >= 0 && detectPos > symptomIdx) {
    bands.push({ id: "B-SYMPTOM-DETECT", label: "Symptom to detection", fromKind: "symptom-began", toKind: "detected", eventsSpanned: detectPos - symptomIdx - 1 });
  }
  if (detectPos >= 0 && mitigatePos > detectPos) {
    bands.push({ id: "B-DETECT-MITIGATE", label: "Detection to mitigation", fromKind: "detected", toKind: "mitigated", eventsSpanned: mitigatePos - detectPos - 1 });
  }
  if (mitigatePos >= 0 && resolvePos > mitigatePos) {
    bands.push({ id: "B-MITIGATE-RESOLVE", label: "Mitigation to resolution", fromKind: "mitigated", toKind: "resolved", eventsSpanned: resolvePos - mitigatePos - 1 });
  } else if (detectPos >= 0 && resolvePos > detectPos && mitigatePos < 0) {
    // No explicit mitigation recorded: report detect -> resolve directly.
    bands.push({ id: "B-DETECT-RESOLVE", label: "Detection to resolution", fromKind: "detected", toKind: "resolved", eventsSpanned: resolvePos - detectPos - 1 });
  }

  // 6. Structural risks (registry order within the fired set), deduped.
  const riskIds: string[] = [];
  const seenRisk = new Set<string>();
  for (const r of fired) {
    if (r.risk && !seenRisk.has(r.risk)) {
      seenRisk.add(r.risk);
      riskIds.push(r.risk);
    }
  }
  const risks: RiskFactor[] = RISKS.filter((r) => seenRisk.has(r.id)).map((r) => ({ id: r.id, label: r.label, severity: r.severity, note: r.note }));
  risks.sort((a, b) => riskIds.indexOf(a.id) - riskIds.indexOf(b.id));

  // 7. Quality warnings about the timeline (deterministic).
  const warnings: QualityWarning[] = [];
  if (timeline.length < 3) {
    warnings.push({ id: "W-SPARSE", message: "The timeline has very few events. A useful RCA usually needs at least the change (if any), the symptom onset, detection, and resolution." });
  }
  if (ctx.hasChange && ctx.hasSymptom) {
    const changePos = firstIndexOf("change-made");
    if (symptomIdx >= 0 && changePos > symptomIdx) {
      warnings.push({ id: "W-CHANGE-AFTER-SYMPTOM", message: "The change is ordered after the symptom began. If the change did not precede the symptom, it is unlikely to be a contributing factor - check the ordering against your records." });
    }
  }
  if (confirmedDomains.size > 1) {
    warnings.push({ id: "W-MULTI-CONFIRMED", message: "More than one factor is marked confirmed. Incidents often have several contributing factors; make sure each confirmation rests on its own evidence rather than a single assumption." });
  }

  // 8. The RCA scaffold artifact (usable, not decorative). The language holds
  //    the line: candidates and evidence, never "root cause found".
  const timelineLines = timeline.map((t) => `- ${t.label}${t.note ? `: ${t.note}` : ""}`);
  const bandLines = bands.map((b) => `- ${b.label}: ${b.eventsSpanned} event(s) in between`);

  const sections: [string, string][] = [];
  if (input.notes?.summary) {
    sections.push(["Incident summary", input.notes.summary]);
  }
  sections.push(["Timeline", timelineLines.join("\n")]);
  if (bandLines.length) {
    sections.push(["Milestone spans (event-count, not wall-clock)", bandLines.join("\n")]);
  }
  if (risks.length) {
    sections.push([
      "Timeline completeness",
      risks.map((r) => `- (${r.severity}) ${r.label}${r.note ? ` - ${r.note}` : ""}`).join("\n"),
    ]);
  }
  if (warnings.length) {
    sections.push(["Cautions", warnings.map((w) => `- ${w.message}`).join("\n")]);
  }
  // Candidate contributing factors - the heart of the scaffold. Never a verdict.
  sections.push([
    "Candidate contributing factors (to investigate - not conclusions)",
    candidates
      .map((c) => {
        const status = c.userConfirmed ? " [marked confirmed by you]" : "";
        return [
          `### ${c.title}${status}`,
          c.rationale,
          "",
          "Evidence that would confirm:",
          ...c.confirmEvidence.map((e) => `- [ ] ${e}`),
          "",
          "Evidence that would rule it out:",
          ...c.ruleOutEvidence.map((e) => `- [ ] ${e}`),
        ].join("\n");
      })
      .join("\n\n"),
  ]);
  if (input.notes?.followups) {
    sections.push(["Follow-ups still owed", input.notes.followups]);
  }
  sections.push([
    "Method note",
    "This is an RCA scaffold, not a root-cause statement. It orders the timeline and structures CANDIDATE contributing factors with the evidence each would need; the factors marked confirmed are the ones you confirmed from your own evidence, attributed to you. A root cause is concluded by people from evidence, in a real review. Generated locally in the browser; nothing was uploaded.",
  ]);

  const artifact: ExportArtifact = {
    kind: "rca-scaffold",
    title: "Incident RCA scaffold",
    sections,
  };

  return {
    timeline,
    bands,
    candidates,
    warnings,
    risks,
    firedRuleIds: fired.map((r) => r.id),
    artifact,
  };
}

/** API-parity entry (D-72): structured JSON string in, result out. */
export function runFromJson(json: string): RcaResult {
  const trimmed = json.trim();
  if (trimmed === "") throw new RcaError("empty");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new RcaError("format", "input must be a JSON object (see the tool doc for the schema)");
  }
  return run(parsed);
}

export { artifactToMarkdown };
export const RULE_COUNT = RULES.length;
export const FACTOR_COUNT = FACTORS.length;

/** Rule id -> its human reason, for the "Why these candidates?" panel. */
export const RULE_REASONS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(RULES.map((r) => [r.id, r.because])),
);
