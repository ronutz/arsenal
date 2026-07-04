// ============================================================================
// src/lib/tools/f5-awaf-learning-poisoning-estimator/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the AWAF automatic-learning poisoning estimator. Each
// vector pins a DOCUMENTED behaviour (a hard gate) or the deterministic
// threshold arithmetic. The gates are the load-bearing facts, straight from
// F5's Policy Builder documentation:
//   - Manual / Disabled learning never auto-applies a suggestion.
//   - Rating-5 / unlearnable violations never auto-relax.
//   - Loosening restricted to trusted traffic blocks an untrusted attacker.
//   - Trusted clients relax with ~1 session; untrusted needs the configured
//     number of different sources (F5 default 10).
// Checks assert on the derived result, never on internal representation.
// ============================================================================

import { estimatePoisoning, DEFAULTS, type PoisoningInput } from "./compute";

export const SET_ID = "f5-awaf-poisoning-golden-v1";

interface Vector {
  readonly id: string;
  readonly description: string;
  readonly check: () => string | null;
}

function expect(cond: boolean, msg: string): string | null {
  return cond ? null : msg;
}
function withInput(over: Partial<PoisoningInput>): PoisoningInput {
  return { ...DEFAULTS, ...over };
}

export const VECTORS: readonly Vector[] = [
  {
    id: "gate-disabled",
    description: "Learning Mode = Disabled: no automatic policy change is possible",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "disabled" }));
      return expect(r.gate === "learning-disabled" && !r.drillable, `gate=${r.gate}`);
    },
  },
  {
    id: "gate-manual",
    description: "Learning Mode = Manual: a human must accept every suggestion (no auto-drill)",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "manual" }));
      return expect(r.gate === "manual" && !r.drillable, `gate=${r.gate}`);
    },
  },
  {
    id: "gate-unlearnable-rating5",
    description: "Rating 5 is unlearnable: the policy never auto-relaxes it, even in Automatic",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "automatic", targetViolationRating: 5 }));
      return expect(r.gate === "unlearnable" && !r.drillable, `gate=${r.gate}`);
    },
  },
  {
    id: "gate-trusted-only-blocks-untrusted",
    description: "Loosen from trusted traffic only: an untrusted attacker cannot reach the loosen path",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "automatic", loosenFromUntrustedTraffic: false, attackerIsTrusted: false }));
      return expect(r.gate === "trusted-only-blocked" && !r.drillable, `gate=${r.gate}`);
    },
  },
  {
    id: "untrusted-default-needs-10-sources",
    description: "Untrusted default: needs the configured 10 distinct sources; an attacker with fewer cannot",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "automatic", untrustedDifferentSources: 10, ratingSlowdownFactor: 1, attackerDistinctSources: 4 }));
      return (
        expect(r.gate === "insufficient-sources", `gate=${r.gate} want insufficient-sources`) ??
        expect(r.minDistinctSources === 10, `minSources=${r.minDistinctSources} want 10`)
      );
    },
  },
  {
    id: "untrusted-feasible-computes-time",
    description: "Untrusted, attacker has enough sources: result is drillable with a computed time",
    check: () => {
      const r = estimatePoisoning(withInput({
        learningMode: "automatic",
        untrustedDifferentSources: 10,
        untrustedDifferentSessions: 10,
        ratingSlowdownFactor: 1,
        attackerDistinctSources: 20,
        requestsPerSourcePerHour: 100,
        timeSpreadHours: 0,
      }));
      // minRequests = max(10,10) = 10; throughput = 20*100 = 2000/h; hoursToVolume = 10/2000 = 0.005h; time spread 0 => minTime 0.005h
      return (
        expect(r.gate === "drillable" && r.drillable, `gate=${r.gate}`) ??
        expect(r.path === "untrusted", `path=${r.path}`) ??
        expect(r.minDistinctSources === 10, `minSources=${r.minDistinctSources}`) ??
        expect(r.minRequestsLowerBound === 10, `minReq=${r.minRequestsLowerBound}`) ??
        expect(Math.abs(r.attackerThroughputPerHour - 2000) < 1e-9, `throughput=${r.attackerThroughputPerHour}`)
      );
    },
  },
  {
    id: "time-spread-is-a-floor",
    description: "Elapsed time never drops below the configured time spread even at high throughput",
    check: () => {
      const r = estimatePoisoning(withInput({
        learningMode: "automatic",
        untrustedDifferentSources: 10,
        ratingSlowdownFactor: 1,
        attackerDistinctSources: 100000,
        requestsPerSourcePerHour: 100000,
        timeSpreadHours: 168, // 7 days
      }));
      return (
        expect(r.gate === "drillable", `gate=${r.gate}`) ??
        expect(Math.abs(r.minTimeHours - 168) < 1e-9, `minTime=${r.minTimeHours} want 168 (spread floor)`)
      );
    },
  },
  {
    id: "rating-factor-scales-sources",
    description: "An explicit rating slowdown factor multiplies the required sources/sessions",
    check: () => {
      const r = estimatePoisoning(withInput({
        learningMode: "automatic",
        untrustedDifferentSources: 10,
        untrustedDifferentSessions: 10,
        ratingSlowdownFactor: 3,
        attackerDistinctSources: 25,
      }));
      // 10*3 = 30 sources needed; attacker has 25 => insufficient
      return (
        expect(r.minDistinctSources === 30, `minSources=${r.minDistinctSources} want 30`) ??
        expect(r.gate === "insufficient-sources", `gate=${r.gate} want insufficient-sources`)
      );
    },
  },
  {
    id: "trusted-attacker-is-fast",
    description: "An attacker inside the trusted range drills with ~1 session (the trusted danger)",
    check: () => {
      const r = estimatePoisoning(withInput({
        learningMode: "automatic",
        attackerIsTrusted: true,
        trustedDifferentSessions: 1,
        ratingSlowdownFactor: 1,
        attackerDistinctSources: 1,
        requestsPerSourcePerHour: 60,
        timeSpreadHours: 0,
      }));
      return (
        expect(r.gate === "drillable" && r.path === "trusted", `gate=${r.gate} path=${r.path}`) ??
        expect(r.minDistinctSources === 1 && r.minDistinctSessions === 1, `sources=${r.minDistinctSources} sessions=${r.minDistinctSessions}`)
      );
    },
  },
  {
    id: "mitigations-always-present",
    description: "The five mitigations are always surfaced, drillable or not",
    check: () => {
      const r = estimatePoisoning(withInput({ learningMode: "automatic" }));
      const kinds = new Set(r.mitigations.map((m) => m.kind));
      return expect(
        kinds.has("use-manual-mode") && kinds.has("loosen-trusted-only") && kinds.has("raise-untrusted-thresholds") && kinds.has("keep-untrusted-out-of-trusted") && kinds.has("disable-after-build"),
        `mitigations=${[...kinds].join(",")}`,
      );
    },
  },
  {
    id: "clamps-absurd-input",
    description: "Absurd/NaN input is clamped, never producing NaN or Infinity",
    check: () => {
      const r = estimatePoisoning(withInput({
        learningMode: "automatic",
        untrustedDifferentSources: Number.NaN,
        attackerDistinctSources: 1e15,
        requestsPerSourcePerHour: -5,
        timeSpreadHours: Number.POSITIVE_INFINITY,
      }));
      const finite = Number.isFinite(r.minTimeHours) && Number.isFinite(r.minDistinctSources) && Number.isFinite(r.attackerThroughputPerHour);
      return expect(finite, "produced a non-finite number");
    },
  },
];

export function verifyVectors(): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check();
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.id}: ${msg}`);
  }
  return { ok: failures.length === 0, failures };
}
