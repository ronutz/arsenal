// ============================================================================
// src/lib/tools/f5-awaf-learning-suggestion-interpreter/compute.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager)
// LEARNING-SUGGESTION INTERPRETER (arsenal-local, pure, deterministic). Ties
// the poisoning estimator and the false-positive triage together: given a
// Traffic Learning suggestion, it says whether accepting it LOOSENS (relaxes)
// or TIGHTENS the policy, whether a loosening is a genuine false-positive fix
// or a security relaxation, and whether Automatic learning is about to enforce
// it for you - the exact poisoning vector.
//
// THE MODEL (F5-documented, not invented):
//   - Suggestions are either TIGHTENING (make the policy more specific: remove
//     a wildcard and add explicit entities, enforce a staged entity) or
//     LOOSENING (relax it: add an allowed entity, allow a meta-character,
//     relax an attribute, disable a violation or signature). K03513854.
//   - Each suggestion has a LEARNING SCORE (0-100%) that shows how close the
//     system is to accepting it. The score is influenced by the violation
//     rating: the LOWER the rating, the HIGHER the score. So low-rated
//     suggestions (most likely false positives) reach auto-accept fastest, by
//     design - and an attacker feeding low-rated violations from many sources
//     drives that same score up. (Refining Security Policies with Learning.)
//   - In AUTOMATIC learning, when the score reaches 100% the system accepts and
//     enforces most suggestions on its own. In MANUAL learning a human must
//     accept every suggestion.
//   - THE DISCIPLINE: relax the policy only where a false positive occurred,
//     never where a real attack caused the violation.
//
// Pure and deterministic (D-49): a model of documented behaviour, never a
// probe. It never contacts a BIG-IP and never fetches. It does not depend on
// the exact (community-contributed, version-variable) REST suggestion JSON;
// you characterise the suggestion from the Traffic Learning screen.
//
// Sources (see index.ts): K03513854 (tightening and loosening suggestions);
// "Refining Security Policies with Learning" (learning score, rating influence,
// auto-apply at 100%, relax only genuine false positives); K70544352.
// ============================================================================

export type ActionType =
  // loosening
  | "add-entity" // add a valid URL / parameter / file type / cookie / host name
  | "add-meta-char" // allow a meta-character on an entity
  | "relax-attribute" // relax an entity attribute (allow longer length, change type)
  | "disable-violation" // disable a violation / clear its Learn flag
  | "disable-signature" // disable or relax an attack signature
  // tightening
  | "remove-wildcard" // remove a wildcard entity, add explicit entities
  | "enforce-entity" // enforce a staged entity (staging -> blocking)
  | "specify-attribute"; // make an attribute more specific

export type LearningMode = "automatic" | "manual";
export type SourceTrust = "trusted" | "untrusted" | "mixed";
export type Rating = 1 | 2 | 3 | 4 | 5 | null;

export interface SuggInput {
  action: ActionType;
  learningScore: number; // 0-100
  violationRating: Rating; // null for tightening / non-violation-driven adds
  mode: LearningMode;
  sourceTrust: SourceTrust;
}

export type Direction = "loosening" | "tightening";
export type Assessment =
  | "add-legitimate" // adding a legitimate entity the policy simply had not learned
  | "fp-fix" // a loosening that resolves a genuine false positive
  | "investigate" // ambiguous; check the request first
  | "likely-relaxing-attack" // a loosening for a high-rated request = relaxing an attack
  | "beneficial-tightening"; // increases specificity / enforcement

export type SuggNote =
  | { kind: "score-rating-inverse" }
  | { kind: "auto-enforce-at-100" }
  | { kind: "poisoning-vector" }
  | { kind: "fp-discipline" }
  | { kind: "enforce-check-fp" }
  | { kind: "tightening-safe" }
  | { kind: "manual-human" }
  | { kind: "score-near-accept"; score: number };

export interface SuggResult {
  readonly direction: Direction;
  readonly assessment: Assessment;
  /** Automatic learning + a relaxing loosening + untrusted + climbing score. */
  readonly autoApplyRisk: boolean;
  /** Automatic mode will accept+enforce at 100%. */
  readonly willAutoEnforceAt100: boolean;
  readonly notes: readonly SuggNote[];
}

const LOOSENING: ReadonlySet<ActionType> = new Set([
  "add-entity", "add-meta-char", "relax-attribute", "disable-violation", "disable-signature",
]);
// Violation-relaxing loosenings (reduce enforcement) vs a plain legitimate add.
const RELAXES_ENFORCEMENT: ReadonlySet<ActionType> = new Set([
  "add-meta-char", "relax-attribute", "disable-violation", "disable-signature",
]);

const SCORE_NEAR = 75; // "near auto-accept" threshold for messaging

export function interpretSuggestion(input: SuggInput): SuggResult {
  const direction: Direction = LOOSENING.has(input.action) ? "loosening" : "tightening";
  const notes: SuggNote[] = [];

  let assessment: Assessment;

  if (direction === "tightening") {
    assessment = "beneficial-tightening";
    notes.push({ kind: "tightening-safe" });
    if (input.action === "enforce-entity") notes.push({ kind: "enforce-check-fp" });
  } else if (input.action === "add-entity") {
    // Adding a legitimate entity the policy had not learned yet (not a relax of a check).
    assessment = "add-legitimate";
  } else {
    // A loosening that reduces enforcement: judge by the violation rating.
    const r = input.violationRating;
    if (r === null || r <= 2) assessment = "fp-fix";
    else if (r === 3) assessment = "investigate";
    else assessment = "likely-relaxing-attack";
  }

  // Score behaviour notes.
  notes.push({ kind: "score-rating-inverse" });
  if (input.learningScore >= SCORE_NEAR) notes.push({ kind: "score-near-accept", score: input.learningScore });

  const willAutoEnforceAt100 = input.mode === "automatic";
  if (willAutoEnforceAt100) notes.push({ kind: "auto-enforce-at-100" });
  if (input.mode === "manual") notes.push({ kind: "manual-human" });

  // The poisoning vector: automatic + a relaxing loosening + untrusted-ish + climbing score.
  const autoApplyRisk =
    input.mode === "automatic" &&
    direction === "loosening" &&
    RELAXES_ENFORCEMENT.has(input.action) &&
    input.sourceTrust !== "trusted" &&
    input.learningScore >= 50;
  if (autoApplyRisk) notes.push({ kind: "poisoning-vector" });

  // The discipline always applies to loosenings that reduce enforcement.
  if (direction === "loosening" && RELAXES_ENFORCEMENT.has(input.action)) notes.push({ kind: "fp-discipline" });

  return { direction, assessment, autoApplyRisk, willAutoEnforceAt100, notes };
}

export const DEFAULTS: SuggInput = Object.freeze({
  action: "disable-signature",
  learningScore: 80,
  violationRating: 2,
  mode: "automatic",
  sourceTrust: "untrusted",
});

export const ACTIONS: readonly ActionType[] = Object.freeze([
  "add-entity", "add-meta-char", "relax-attribute", "disable-violation", "disable-signature",
  "remove-wildcard", "enforce-entity", "specify-attribute",
]);
