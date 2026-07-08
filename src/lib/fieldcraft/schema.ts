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
