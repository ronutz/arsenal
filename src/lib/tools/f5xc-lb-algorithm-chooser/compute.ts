// ============================================================================
// src/lib/tools/f5xc-lb-algorithm-chooser/compute.ts
// ----------------------------------------------------------------------------
// Guided chooser for the F5 Distributed Cloud (XC) origin-pool load-balancing
// algorithm. Pure, offline, deterministic.
//
// The XC-specific twist this tool teaches: unlike BIG-IP, where the load-
// balancing method and the persistence profile are two separate knobs, XC folds
// persistence INTO the algorithm. The consistent-hashing choices - Source IP
// Stickiness, Cookie Based Stickiness, and Ring Hash (custom hash policy) - ARE
// the persistence method; there is no separate persistence profile object. The
// non-hash algorithms (Round Robin, Least Active Request, Random) do not
// persist. Load Balancer Override defers stickiness to a per-route Load
// Balancing Control instead of setting it pool-wide.
//
// Option set + persistence model verified 2026-07-11 against F5's Create HTTP
// Load Balancer guide, the "What is the Ring Hash algorithm" DevCentral article,
// and the "Setting up persistence in F5 XC" DevCentral article.
// ============================================================================

export type Algo =
  | "round-robin"
  | "least-active-request"
  | "random"
  | "source-ip-stickiness"
  | "cookie-stickiness"
  | "ring-hash-custom"
  | "lb-override";

export type Distribution = "even" | "least-loaded" | "random";
export type SessionKey = "source-ip" | "cookie" | "custom-header" | "per-route";

export interface AnswerState {
  needsPersistence: boolean | null;
  distribution: Distribution | null; // used when needsPersistence === false
  sessionKey: SessionKey | null; // used when needsPersistence === true
  dynamicPool: boolean | null; // k8s / autoscaling backends
}

export interface AlgoMeta {
  persists: boolean;
  hashFamily: boolean; // consistent-hashing (tolerates pool churn)
}
export const ALGO_META: Record<Algo, AlgoMeta> = {
  "round-robin": { persists: false, hashFamily: false },
  "least-active-request": { persists: false, hashFamily: false },
  random: { persists: false, hashFamily: false },
  "source-ip-stickiness": { persists: true, hashFamily: true },
  "cookie-stickiness": { persists: true, hashFamily: true },
  "ring-hash-custom": { persists: true, hashFamily: true },
  "lb-override": { persists: true, hashFamily: false },
};

export interface RecommendResult {
  complete: boolean;
  missing?: "persistence" | "distribution" | "sessionKey";
  algo?: Algo;
  persists?: boolean;
  caveatIds?: string[];
}

/** Deterministic recommendation from the questionnaire state. */
export function recommend(a: AnswerState): RecommendResult {
  if (a.needsPersistence === null) return { complete: false, missing: "persistence" };

  const caveats: string[] = [];

  if (a.needsPersistence === false) {
    if (a.distribution === null) return { complete: false, missing: "distribution" };
    let algo: Algo;
    switch (a.distribution) {
      case "even":
        algo = "round-robin";
        break;
      case "least-loaded":
        algo = "least-active-request";
        caveats.push("least-uneven-cost");
        break;
      case "random":
        algo = "random";
        caveats.push("random-large-pool");
        break;
    }
    caveats.push("no-persistence");
    if (a.dynamicPool === true) caveats.push("dynamic-no-persistence");
    return { complete: true, algo, persists: false, caveatIds: caveats };
  }

  // needsPersistence === true
  if (a.sessionKey === null) return { complete: false, missing: "sessionKey" };
  let algo: Algo;
  switch (a.sessionKey) {
    case "source-ip":
      algo = "source-ip-stickiness";
      caveats.push("low-client-diversity");
      break;
    case "cookie":
      algo = "cookie-stickiness";
      caveats.push("cookie-params");
      break;
    case "custom-header":
      algo = "ring-hash-custom";
      caveats.push("custom-header-session");
      break;
    case "per-route":
      algo = "lb-override";
      caveats.push("per-route-control");
      break;
  }
  if (a.dynamicPool === true && ALGO_META[algo].hashFamily) caveats.push("dynamic-hash-good");
  return { complete: true, algo, persists: ALGO_META[algo].persists, caveatIds: caveats };
}

/** D-49 run entrypoint: a JSON string of the answer state. */
export function run(input: string): RecommendResult | { complete: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { complete: false, error: "Provide the answer state as JSON, e.g. {\"needsPersistence\":true,\"sessionKey\":\"cookie\",\"dynamicPool\":false}" };
  }
  const p = (parsed ?? {}) as Record<string, unknown>;
  const state: AnswerState = {
    needsPersistence: typeof p.needsPersistence === "boolean" ? p.needsPersistence : null,
    distribution: (["even", "least-loaded", "random"] as const).includes(p.distribution as Distribution) ? (p.distribution as Distribution) : null,
    sessionKey: (["source-ip", "cookie", "custom-header", "per-route"] as const).includes(p.sessionKey as SessionKey) ? (p.sessionKey as SessionKey) : null,
    dynamicPool: typeof p.dynamicPool === "boolean" ? p.dynamicPool : null,
  };
  return recommend(state);
}
