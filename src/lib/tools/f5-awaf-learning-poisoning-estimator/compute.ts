// ============================================================================
// src/lib/tools/f5-awaf-learning-poisoning-estimator/compute.ts
// ----------------------------------------------------------------------------
// F5 ADVANCED WAF — AUTOMATIC-LEARNING POISONING ESTIMATOR (arsenal-local,
// pure, deterministic). Answers one question a WAF instructor gets asked:
// "How many requests does an attacker need to drill a hole through your
// security policy?" — when the BIG-IP Advanced WAF (ASM) Policy Builder is
// left in Automatic learning mode against untrusted production traffic.
//
// THE MECHANISM (F5-documented, not invented):
//   - In Automatic learning mode, when a learning suggestion's score reaches
//     100% the Policy Builder ACCEPTS AND ENFORCES it, with no human in the
//     loop. Some suggestions RELAX the policy: the Loosen stage adds entities,
//     widens attributes (lengths, meta-characters), and DISABLES violations.
//   - A suggestion's score is driven up by traffic from MANY DIFFERENT SOURCES
//     and SESSIONS over a TIME SPREAD, by a LOW violation rating, and by
//     TRUSTED-IP origin. So an attacker who floods "legitimate-looking" traffic
//     (low-rated, recurring, multi-source) can push a relaxation to 100% and
//     get a control auto-disabled — manufacturing future false negatives.
//   - Two hard limits bound this: the most severe violations are UNLEARNABLE
//     (rating fixed at 5, no suggestion ever created), and a HIGHER violation
//     rating makes ASM require MORE sources/sessions before it will relax.
//   - Trusted clients relax with as little as ONE session; untrusted traffic
//     needs many more distinct sources over a period. An EMPTY trusted-IP list
//     means ALL traffic is untrusted. Manual mode never auto-applies anything.
//
// This engine is a MODEL of that documented behaviour, not a probe. It never
// contacts a BIG-IP, never fetches, and same input always yields same output
// (D-49). It reports what the DOCUMENTED gates imply and computes attacker
// effort from the Loosen thresholds the user supplies (defaults = F5 defaults).
// It invents no internal scoring multiplier: the "higher rating costs more"
// effect is surfaced as documented direction plus an explicit, user-set factor.
//
// Sources (see index.ts `sources` for URLs):
//   - K000134503 "Overview of Fully Automatic Policy Building learning mode"
//   - BIG-IP ASM Implementations, "Refining Security Policies with Learning"
//     (learning score; 100% => auto-accept/enforce; unlearnable violations)
//   - BIG-IP ASM Implementations, "Changing/Configuring How a Security Policy
//     is (Automatically) Built" (Loosen/Tighten/Track Site Changes; trusted vs
//     untrusted thresholds; rating slows learning; trusted default = 1 session)
//   - BIG-IP Next "Reference: WAF Policy Builder" (Learning Mode
//     Automatic/Manual/Disabled; auto-accept at 100%; Learning Speed sampling)
// ============================================================================

export type LearningMode = "automatic" | "manual" | "disabled";

/** The Policy Builder violation rating a manipulation would carry (1..5). */
export type ViolationRating = 1 | 2 | 3 | 4 | 5;

export interface PoisoningInput {
  /** Policy Builder Learning Mode. Only "automatic" auto-applies suggestions. */
  learningMode: LearningMode;
  /**
   * Whether the Loosen stage may relax the policy from UNTRUSTED traffic.
   * F5 default is "From Trusted and Untrusted Traffic" (true). Setting the
   * Track Site Changes source to "Only from Trusted Traffic" maps to false.
   */
  loosenFromUntrustedTraffic: boolean;
  /** Are the attacker's client IPs inside the policy's Trusted IP list? */
  attackerIsTrusted: boolean;
  /** Loosen rule: # of DIFFERENT SOURCES (IPs) required, untrusted. F5 default 10. */
  untrustedDifferentSources: number;
  /** Loosen rule: # of DIFFERENT SESSIONS required, untrusted. Modeled default 10. */
  untrustedDifferentSessions: number;
  /** Loosen rule: # of DIFFERENT SESSIONS required, trusted. F5 default 1. */
  trustedDifferentSessions: number;
  /** Loosen rule: minimum TIME SPREAD (hours) the samples must cover. */
  timeSpreadHours: number;
  /** Violation rating of the manipulation the attacker wants ASM to accept. */
  targetViolationRating: ViolationRating;
  /**
   * Explicit multiplier for the documented "higher rating requires more
   * sources/sessions" effect. F5 does not publish the exact curve, so this is
   * user-set (default 1 = model only the configured threshold). Rating 5 is a
   * hard unlearnable gate regardless of this value.
   */
  ratingSlowdownFactor: number;
  /** Distinct source IPs the attacker controls (e.g. botnet size). */
  attackerDistinctSources: number;
  /** Requests per hour the attacker can send FROM EACH distinct source. */
  requestsPerSourcePerHour: number;
}

export type Gate =
  | "learning-disabled" // Learning Mode = Disabled: no auto-changes at all
  | "manual" // Learning Mode = Manual: a human must accept every suggestion
  | "unlearnable" // rating 5 / unlearnable violation: never auto-relaxes
  | "trusted-only-blocked" // untrusted attacker, loosening restricted to trusted
  | "insufficient-sources" // attacker lacks the required distinct sources
  | "drillable"; // automatic drill is possible; numbers computed

export interface PoisoningResult {
  readonly gate: Gate;
  /** True only when gate === "drillable". */
  readonly drillable: boolean;
  /** Which path applies: trusted (fast) or untrusted (slow). */
  readonly path: "trusted" | "untrusted";
  /** Minimum DISTINCT SOURCE IPs the attacker must originate from. */
  readonly minDistinctSources: number;
  /** Minimum DISTINCT SESSIONS required. */
  readonly minDistinctSessions: number;
  /**
   * Minimum request count to register the pattern — at least one distinct hit
   * per required source/session. Real campaigns need more (recurrence), so this
   * is a documented LOWER BOUND, not a promise.
   */
  readonly minRequestsLowerBound: number;
  /** Minimum elapsed time (hours) — the greater of the time spread and the
   *  volume delivery time at the attacker's throughput. */
  readonly minTimeHours: number;
  /** Human-readable form of minTimeHours. */
  readonly minTimeHuman: string;
  /** Attacker throughput actually used (distinct sources x per-source rate). */
  readonly attackerThroughputPerHour: number;
  /** The rating factor actually applied (echoes the input, clamped). */
  readonly ratingFactorApplied: number;
  /** Structured findings for the UI to localize. */
  readonly notes: readonly Note[];
  /** Config changes that would flip a drillable result to safe. */
  readonly mitigations: readonly Mitigation[];
}

export type Note =
  | { kind: "auto-enforce-at-100" }
  | { kind: "unlearnable-set" }
  | { kind: "rating-raises-cost"; rating: ViolationRating }
  | { kind: "trusted-one-session" }
  | { kind: "empty-trusted-list" }
  | { kind: "attacker-trusted-fast" }
  | { kind: "lower-bound-caveat" };

export type Mitigation =
  | { kind: "use-manual-mode" }
  | { kind: "loosen-trusted-only" }
  | { kind: "raise-untrusted-thresholds" }
  | { kind: "keep-untrusted-out-of-trusted" }
  | { kind: "disable-after-build" };

// The F5-documented defaults, exported for the UI's initial state.
export const DEFAULTS: PoisoningInput = Object.freeze({
  learningMode: "automatic",
  loosenFromUntrustedTraffic: true,
  attackerIsTrusted: false,
  untrustedDifferentSources: 10, // F5 default surfaced in the scenario5 lab
  untrustedDifferentSessions: 10,
  trustedDifferentSessions: 1, // F5: trusted needs "only 1 user session"
  timeSpreadHours: 24,
  targetViolationRating: 3,
  ratingSlowdownFactor: 1,
  attackerDistinctSources: 25,
  requestsPerSourcePerHour: 120,
});

// Sane bounds so the calculator never emits NaN/Infinity or absurd values.
const BOUNDS = {
  sources: { min: 1, max: 1_000_000_000 },
  sessions: { min: 1, max: 1_000_000_000 },
  timeHours: { min: 0, max: 8760 }, // up to a year
  ratingFactor: { min: 1, max: 1000 },
  attackerSources: { min: 1, max: 10_000_000 },
  rate: { min: 1, max: 1_000_000 },
};

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function humanizeHours(h: number): string {
  if (h <= 0) return "immediate";
  if (h < 1) return `${Math.ceil(h * 60)} min`;
  if (h < 48) return `${round1(h)} h`;
  const days = h / 24;
  if (days < 60) return `${round1(days)} days`;
  return `${round1(days / 30)} months`;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Pure, deterministic estimate. Applies the documented hard gates first, then
 * computes attacker effort from the (user-supplied, F5-defaulted) thresholds.
 */
export function estimatePoisoning(inputRaw: PoisoningInput): PoisoningResult {
  // Normalize/clamp all numeric inputs.
  const untrustedSources = Math.round(clamp(inputRaw.untrustedDifferentSources, BOUNDS.sources.min, BOUNDS.sources.max));
  const untrustedSessions = Math.round(clamp(inputRaw.untrustedDifferentSessions, BOUNDS.sessions.min, BOUNDS.sessions.max));
  const trustedSessions = Math.round(clamp(inputRaw.trustedDifferentSessions, BOUNDS.sessions.min, BOUNDS.sessions.max));
  const timeSpreadHours = clamp(inputRaw.timeSpreadHours, BOUNDS.timeHours.min, BOUNDS.timeHours.max);
  const ratingFactor = clamp(inputRaw.ratingSlowdownFactor, BOUNDS.ratingFactor.min, BOUNDS.ratingFactor.max);
  const attackerSources = Math.round(clamp(inputRaw.attackerDistinctSources, BOUNDS.attackerSources.min, BOUNDS.attackerSources.max));
  const rate = clamp(inputRaw.requestsPerSourcePerHour, BOUNDS.rate.min, BOUNDS.rate.max);
  const rating = inputRaw.targetViolationRating;

  const notesBase: Note[] = [{ kind: "auto-enforce-at-100" }];

  // The mitigations are always worth showing (they are the lesson).
  const mitigations: Mitigation[] = [
    { kind: "use-manual-mode" },
    { kind: "loosen-trusted-only" },
    { kind: "raise-untrusted-thresholds" },
    { kind: "keep-untrusted-out-of-trusted" },
    { kind: "disable-after-build" },
  ];

  const shell = (gate: Gate, extra: Note[], over: Partial<PoisoningResult> = {}): PoisoningResult => ({
    gate,
    drillable: gate === "drillable",
    path: "untrusted",
    minDistinctSources: 0,
    minDistinctSessions: 0,
    minRequestsLowerBound: 0,
    minTimeHours: 0,
    minTimeHuman: "n/a",
    attackerThroughputPerHour: attackerSources * rate,
    ratingFactorApplied: ratingFactor,
    notes: [...notesBase, ...extra],
    mitigations,
    ...over,
  });

  // ---- Hard gates, in documented order ---------------------------------

  // 1. Learning off entirely.
  if (inputRaw.learningMode === "disabled") {
    return shell("learning-disabled", []);
  }
  // 2. Manual mode: suggestions accrue but require a human to accept.
  if (inputRaw.learningMode === "manual") {
    return shell("manual", []);
  }
  // 3. Unlearnable: rating 5 (and the fixed-5 protocol violations) never relax.
  if (rating >= 5) {
    return shell("unlearnable", [{ kind: "unlearnable-set" }]);
  }

  // ---- Automatic + learnable: choose the path --------------------------

  if (inputRaw.attackerIsTrusted) {
    // Trusted path: the fast, dangerous one — as little as 1 session.
    const minSources = Math.max(1, Math.ceil(1 * ratingFactor));
    const minSessions = Math.max(1, Math.ceil(trustedSessions * ratingFactor));
    const minRequests = Math.max(minSources, minSessions);
    const throughput = attackerSources * rate;
    const hoursToVolume = minRequests / throughput;
    const minTime = Math.max(timeSpreadHours, hoursToVolume);
    return shell(
      "drillable",
      [
        { kind: "attacker-trusted-fast" },
        { kind: "rating-raises-cost", rating },
        { kind: "lower-bound-caveat" },
      ],
      {
        path: "trusted",
        minDistinctSources: minSources,
        minDistinctSessions: minSessions,
        minRequestsLowerBound: minRequests,
        minTimeHours: minTime,
        minTimeHuman: humanizeHours(minTime),
        attackerThroughputPerHour: throughput,
      },
    );
  }

  // Untrusted attacker, but loosening restricted to trusted traffic only.
  if (!inputRaw.loosenFromUntrustedTraffic) {
    return shell("trusted-only-blocked", [{ kind: "trusted-one-session" }, { kind: "empty-trusted-list" }]);
  }

  // Untrusted path: the anti-poisoning thresholds apply.
  const minSources = Math.max(1, Math.ceil(untrustedSources * ratingFactor));
  const minSessions = Math.max(1, Math.ceil(untrustedSessions * ratingFactor));
  const minRequests = Math.max(minSources, minSessions);

  // Feasibility: the binding constraint is distinct sources.
  if (attackerSources < minSources) {
    return shell("insufficient-sources", [{ kind: "rating-raises-cost", rating }, { kind: "trusted-one-session" }], {
      minDistinctSources: minSources,
      minDistinctSessions: minSessions,
      minRequestsLowerBound: minRequests,
    });
  }

  const throughput = attackerSources * rate;
  const hoursToVolume = minRequests / throughput;
  const minTime = Math.max(timeSpreadHours, hoursToVolume);
  return shell(
    "drillable",
    [{ kind: "rating-raises-cost", rating }, { kind: "trusted-one-session" }, { kind: "lower-bound-caveat" }],
    {
      minDistinctSources: minSources,
      minDistinctSessions: minSessions,
      minRequestsLowerBound: minRequests,
      minTimeHours: minTime,
      minTimeHuman: humanizeHours(minTime),
      attackerThroughputPerHour: throughput,
    },
  );
}
