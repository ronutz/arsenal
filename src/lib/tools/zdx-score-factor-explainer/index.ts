// ============================================================================
// src/lib/tools/zdx-score-factor-explainer/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING ZDX SCORE FACTOR EXPLAINER - the {manifest, run,
// vectors} triple. Paste the metrics ZDX exposes (score, page fetch time,
// DNS time, server response time, availability, CloudPath latency and loss)
// and receive the documented reading of each: probe-family attribution, the
// metric's documented meaning, classification of the score against the three
// documented bands (Good 66-100, Okay 34-65, Poor 0-33, on a 0-100 scale), the
// web-versus-path diagnostic split, and the honesty calibrations. The composite formula is not published, so the tool computes
// no score - it explains what the documentation grounds and says so.
// Bounded, evaluates nothing, contacts nothing.
//
// Fourth native tool of the Zscaler program (PKG-ZSCALER v2, wave 3);
// paired article: learn/zdx-score-anatomy-and-probes.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, ZDX_VECTORS } from "./golden-vectors";

export { run, parseMetrics } from "./compute";
export type { MetricKey, ProbeFamily, MetricReading, ExplainResult } from "./compute";
export { GOLDEN_VECTOR_SET_ID, ZDX_VECTORS, verifyVectors } from "./golden-vectors";
export type { ZdxVector } from "./golden-vectors";

/** The D-49 declarative manifest for the zdx-score-factor-explainer tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Zscaler Zero Trust Exchange",
  toolSlug: "zdx-score-factor-explainer",
  canonicalAliases: [
    "zdx-explainer",
    "zdx-score-explainer",
    "digital-experience-score-explainer",
    "zdx-factor-explainer",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // The tool's own metric grammar: "<metric> = <number>".
      pattern: "^(score|pft|dns|srt|availability|path-latency|path-loss)\\s*=\\s*-?[0-9]",
      priority: 6,
      example: "score = 28",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: ["line-anchored-errors", "duplicate-detection", "documented-bounds-validation"],
  shareSafetyDefault: "fragment", // pasted metrics can describe internal application performance

  // -- Teaching & provenance --
  learnLinks: [
    "learn/zdx-score-anatomy-and-probes",
    "learn/troubleshooting-zcc-connectivity",
  ],
  sources: [
    {
      id: "zs-zdx-reference-architecture",
      label: "Zscaler Reference Architecture: Zscaler Digital Experience (ZDX)",
      type: "vendor-docs",
      url: "https://help.zscaler.com/downloads/zdx/reference-architecture/zscaler-digital-experience-zdx/zscaler-digital-experience-zdx-reference-architecture.pdf",
      access_date: "2026-07-21",
      scope: "Web Probe metrics (Page Fetch Time requesting only the top-level page document, DNS Time, Server Response Time, Availability); probes every 5 minutes for most plans; the lowest score of the hour as the displayed hourly score; group scores averaging each user's lowest over the timeframe",
      status: "active",
    },
    {
      id: "zs-zdx-evaluating-user-details",
      label: "Zscaler Help: Evaluating User Details (ZDX)",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zdx/evaluating-user-details",
      access_date: "2026-07-21",
      scope: "the documented Poor band (scores 0-33) and the automatic root-cause analysis run on the most recent Poor score",
      status: "active",
    },
    {
      id: "zs-zdx-api",
      label: "Zscaler Help: Understanding the ZDX API",
      type: "vendor-docs",
      url: "https://help.zscaler.com/zdx/understanding-zdx-api",
      access_date: "2026-07-21",
      scope: "the ~20-minute estimated telemetry reporting delay and the ~2% approximate-aggregation variance between API and dashboard values",
      status: "active",
    },
    {
      // Read 2026-10-26: the scale, the three bands, the roll-up rules, rounding and the score types.
      id: "zs-zdx-understanding-score",
      // The page title as Zscaler publishes it.
      label: "Zscaler Help: Understanding the ZDX Score",
      // A vendor documentation page.
      type: "vendor-docs",
      // The current URL (the older about-zdx-score address redirects here).
      url: "https://help.zscaler.com/zdx/understanding-zdx-score",
      // The day the page was read.
      access_date: "2026-10-26",
      // What this source grounds in the tool.
      scope: "the 0-100 scale; the three bands (Good 66-100, Okay 34-65, Poor 0-33); five-minute measurements with the lowest value of the hour as the hourly value; application scores averaging each user's lowest value and per-interval lowest values averaged for departments, locations, cities and the organisation; whole-number rounding; the Synthetic Probe, RUM and Combined score types",
      // The page is live.
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = ZDX_VECTORS;
