// ============================================================================
// src/lib/tools/cvss-vector-decoder/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the CVSS decoder. These are not hand-picked to match the
// implementation; they are vectors with officially published scores, so they
// prove the scoring math is correct rather than merely self-consistent:
//   - AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H  = 9.8  (canonical unauthenticated RCE)
//   - same with S:C                        = 10.0 (scope change pushes to the cap)
//   - AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  = 6.1  (reflected XSS, the NVD value)
//   - AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H  = 7.8  (local privilege escalation)
//   - AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N  = 0.0  (no impact -> zero)
//   - the RCE vector with E:P/RL:O/RC:C    = 8.8  temporal (9.8 refined down)
// A v3.0-prefixed vector and an environmental-path vector are included so both
// code paths are exercised. Each vector asserts on the derived score, not on
// internal representation, so the checks stay stable across refactors.
//   Sources: FIRST.org CVSS v3.1 specification and calculator; NVD CVSS entries.
// ============================================================================

import { parseCvssVector } from "./compute";

export const SET_ID = "cvss-vector-decoder/2026-07-01";

interface Vector {
  name: string;
  input: string;
  check: (r: ReturnType<typeof parseCvssVector>) => string | null; // null = pass
}

const eq = (label: string, got: unknown, want: unknown): string | null =>
  got === want ? null : `${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`;

const all = (...results: (string | null)[]): string | null =>
  results.filter((r) => r !== null).join("; ") || null;

export const VECTORS: Vector[] = [
  {
    name: "rce-unchanged-9.8",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    check: (r) => all(eq("base", r.baseScore, 9.8), eq("severity", r.baseSeverity, "Critical"), eq("scopeChanged", r.scopeChanged, false)),
  },
  {
    name: "scope-changed-10.0",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
    check: (r) => all(eq("base", r.baseScore, 10.0), eq("severity", r.baseSeverity, "Critical"), eq("scopeChanged", r.scopeChanged, true)),
  },
  {
    name: "reflected-xss-6.1",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",
    check: (r) => all(eq("base", r.baseScore, 6.1), eq("severity", r.baseSeverity, "Medium")),
  },
  {
    name: "local-privesc-7.8",
    input: "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",
    check: (r) => all(eq("base", r.baseScore, 7.8), eq("severity", r.baseSeverity, "High")),
  },
  {
    name: "no-impact-0.0",
    input: "CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N",
    check: (r) => all(eq("base", r.baseScore, 0.0), eq("severity", r.baseSeverity, "None")),
  },
  {
    name: "temporal-8.8",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:P/RL:O/RC:C",
    check: (r) => all(eq("base", r.baseScore, 9.8), eq("temporal", r.temporalScore, 8.8), eq("temporalSeverity", r.temporalSeverity, "High")),
  },
  {
    name: "v30-prefix-parses",
    input: "CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    check: (r) => all(eq("version", r.version, "3.0"), eq("base", r.baseScore, 9.8)),
  },
  {
    name: "environmental-path-9.8",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/CR:H/IR:H/AR:H/MAV:N/MAC:L/MPR:N/MUI:N/MS:U/MC:H/MI:H/MA:H",
    check: (r) => all(eq("base", r.baseScore, 9.8), eq("environmental", r.environmentalScore, 9.8)),
  },
  {
    name: "incomplete-base-flagged",
    input: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N",
    check: (r) => all(
      r.warnings.includes("incomplete-base") ? null : "expected incomplete-base warning",
      eq("baseScore", r.baseScore, null),
      eq("missingBase", r.missingBase.join(","), "S,C,I,A"),
    ),
  },
  {
    name: "unsupported-v2-rejected",
    input: "CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P",
    check: (r) => all(eq("unsupportedVersion", r.unsupportedVersion, "2.0"), eq("recognized", r.recognized, false)),
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check(parseCvssVector(v.input));
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failures.length, failed: failures.length, failures };
}
