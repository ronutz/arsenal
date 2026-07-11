// ============================================================================
// src/lib/tools/f5xc-rate-limit-calculator/index.ts
// ----------------------------------------------------------------------------
// THE F5XC RATE-LIMIT CALCULATOR - a {manifest, run, vectors} triple. Turns a
// rate-limiter configuration (Number / Per Period / Periods / Burst Multiplier /
// Mitigation) into its effective rate, burst ceiling, and exact behavior. Pure
// and offline.
// ============================================================================

import { calculateRateLimit } from "./compute";
import { GOLDEN_VECTOR_SET_ID } from "./golden-vectors";

export { calculateRateLimit } from "./compute";
export type { RateLimitInput, RateLimitResult, PerPeriod, Mitigation, DurationUnit } from "./compute";
export { RATE_LIMIT_MAX_LOCKOUT_SECONDS } from "./compute";
export { GOLDEN_VECTOR_SET_ID, verifyVectors, goldenVectors } from "./golden-vectors";

/**
 * D-49 run entrypoint. The API registry passes a string, so accept a JSON
 * object describing the rate limiter. The UI calls calculateRateLimit directly.
 */
export function run(input: string) {
  let parsed: Parameters<typeof calculateRateLimit>[0];
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "Input must be a JSON object with number, perPeriod, and periods." };
  }
  return calculateRateLimit(parsed);
}

export const manifest = Object.freeze({
  toolFamily: "F5 Distributed Cloud (XC)",
  toolSlug: "f5xc-rate-limit-calculator",
  canonicalAliases: ["xc-rate-limit", "f5xc-rate-limiter", "distributed-cloud-rate-limit", "xc-429-calculator", "f5xc-burst-multiplier"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["bounded-parse"],
  shareSafetyDefault: "param",

  learnLinks: ["learn/f5xc-rate-limiting-explained"],
  sources: [
    {
      id: "xc-user-rate-limit",
      label: "F5 Distributed Cloud: Configure Rate Limiting per User (Number / Per Period / Periods / Burst Multiplier)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs/how-to/advanced-security/user-rate-limit",
      access_date: "2026-07-11",
      scope: "the rate-limiter tuple, burst multiplier as a multiple of the rate, and mitigation duration (max 48h)",
      status: "active",
    },
    {
      id: "k000161473",
      label: "F5 K000161473: Rate Limiting Behavior, Mitigation Actions, and Log Visibility",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000161473",
      access_date: "2026-07-11",
      scope: "leaky bucket returns 429; Disabled is not a bypass; Block adds a lockout until the timer expires",
      status: "active",
    },
    {
      id: "k000146642",
      label: "F5 K000146642: What is the burst multiplier setting on Rate Limit configuration?",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000146642",
      access_date: "2026-07-11",
      scope: "burst multiplier definition",
      status: "active",
    },
    {
      id: "k000157944",
      label: "F5 K000157944: distributed rate-limit counting can overshoot before enforcement",
      type: "kb",
      url: "https://my.f5.com/manage/s/article/K000157944",
      access_date: "2026-07-11",
      scope: "per-RE / per-proxy counting overshoot caveat",
      status: "active",
    },
    {
      id: "xc-api-rate-limiting",
      label: "F5 Distributed Cloud: Configure API Rate Limiting (Server URL + API endpoint rules, first-match)",
      type: "docs",
      url: "https://docs.cloud.f5.com/docs-v2/web-app-and-api-protection/how-to/api-security/configure-api-rate-limiting",
      access_date: "2026-07-11",
      scope: "layered rules processed in the order configured (first-match)",
      status: "active",
    },
  ],
  credits: [
    { handle: "f5-docs", display_name: "F5 Distributed Cloud documentation", role: "reference", public: true },
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export type ToolRunResult = ReturnType<typeof run>;
