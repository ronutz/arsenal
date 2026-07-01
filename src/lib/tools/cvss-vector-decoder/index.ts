// ============================================================================
// src/lib/tools/cvss-vector-decoder/index.ts
// ----------------------------------------------------------------------------
// CVSS VECTOR DECODER - a {manifest, run, vectors} triple. Paste a CVSS v3.0 or
// v3.1 vector string (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H) and get the
// Base score computed and mapped to None / Low / Medium / High / Critical, with
// Temporal and Environmental scores when those metrics are present, the Impact
// and Exploitability sub-scores, and every metric spelled out in plain words.
//
// Pure scoring math, implemented straight from the FIRST.org CVSS v3.1
// specification (Section 7 formulas + the Appendix A floating-point-safe
// Roundup), and validated against officially published reference scores. It
// fetches nothing and looks nothing up (zero egress, D-49); the vector you paste
// is scored locally in the browser.
// ============================================================================

import { parseCvssVector } from "./compute";
import { SET_ID, verifyVectors } from "./golden-vectors";

export { parseCvssVector } from "./compute";
export type { MetricView, CvssParse } from "./compute";
export { SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest for the cvss-vector-decoder tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Security & WAF",
  toolSlug: "cvss-vector-decoder",
  canonicalAliases: [
    "cvss",
    "cvss-decoder",
    "cvss-calculator",
    "cvss-vector",
    "cvss-score",
    "cvss3",
  ],
  inputDetectors: [
    { kind: "regex", pattern: "CVSS:3\\.[01]/", priority: 9, example: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" },
    { kind: "regex", pattern: "\\bAV:[NALP]/AC:[LH]/PR:[NLH]/UI:[NR]\\b", priority: 5, example: "AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: SET_ID,
  dangerousInputHandling: ["bounded-parse", "never-fetches"],
  shareSafetyDefault: "safe", // a CVSS vector is a public severity descriptor; it carries no secrets or PII

  // -- Teaching & provenance --
  learnLinks: [
    "learn/how-cvss-scoring-works",
    "learn/cvss-base-metrics-explained",
    "learn/cvss-temporal-and-environmental",
    "learn/cvss-vector-string-format",
    "learn/cvss-severity-bands-and-limits",
    "learn/cvss-v3-vs-v4",
  ],
  sources: [
    { id: "cvss-v31-spec", label: "FIRST.org - CVSS v3.1 Specification Document", url: "https://www.first.org/cvss/v3.1/specification-document" },
    { id: "cvss-v31-calc", label: "FIRST.org - CVSS v3.1 Calculator", url: "https://www.first.org/cvss/calculator/3.1" },
    { id: "nvd-cvss-v31-equations", label: "NVD - CVSS v3.1 Equations", url: "https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator/v31/equations" },
  ],
});

/** Tool entry point. Deterministic; delegates to the pure, decode-only engine. */
export function run(input: string) {
  return parseCvssVector(input);
}

// Surface verifyVectors on the manifest namespace for the test harness.
export const __selftest = verifyVectors;
