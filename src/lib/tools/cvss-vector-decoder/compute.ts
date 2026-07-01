// ============================================================================
// src/lib/tools/cvss-vector-decoder/compute.ts
// ----------------------------------------------------------------------------
// Deterministic decoder and calculator for CVSS v3.0 / v3.1 vector strings.
// Paste a vector (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H) and get the Base
// score computed and mapped to a severity band, plus Temporal and Environmental
// scores when those metrics are present, and every metric spelled out.
//
// The scoring is pure math, implemented directly from the official FIRST.org
// CVSS v3.1 specification (Section 7 formulas + the Appendix A floating-point
// safe Roundup). The v3.1 environmental modified-impact uses exponent 13 and the
// 0.9731 factor; v3.0 uses exponent 15 and a simple ceil-based round. The
// implementation is validated against known reference scores in golden-vectors.
//
// Local and zero-egress (D-49): parses the string you paste and computes; it
// fetches nothing and looks nothing up. It never throws; malformed input is
// reported.
//   Sources: FIRST.org CVSS v3.1 specification, Section 7 and Appendix A.
// ============================================================================

export interface MetricView {
  code: string; // e.g. "AV"
  label: string; // e.g. "Attack Vector"
  value: string; // e.g. "N"
  valueLabel: string; // e.g. "Network"
  group: "base" | "temporal" | "environmental";
}

export interface CvssParse {
  recognized: boolean;
  version: string | null; // "3.0" | "3.1"
  parseError: string | null;
  unsupportedVersion: string | null; // "2.0" | "4.0" etc.
  baseScore: number | null;
  baseSeverity: string | null;
  temporalScore: number | null;
  temporalSeverity: string | null;
  environmentalScore: number | null;
  environmentalSeverity: string | null;
  impactSubScore: number | null;
  exploitabilitySubScore: number | null;
  scopeChanged: boolean | null;
  metrics: MetricView[];
  warnings: string[];
  missingBase: string[];
  unknownMetrics: string[];
}

// ---- Metric metadata: order, friendly labels, allowed value labels ----------
interface MetricDef {
  code: string;
  label: string;
  group: "base" | "temporal" | "environmental";
  mandatory: boolean;
  values: Record<string, string>; // value code -> label
}

const METRIC_DEFS: MetricDef[] = [
  // Base (mandatory, in canonical order)
  { code: "AV", label: "Attack Vector", group: "base", mandatory: true, values: { N: "Network", A: "Adjacent", L: "Local", P: "Physical" } },
  { code: "AC", label: "Attack Complexity", group: "base", mandatory: true, values: { L: "Low", H: "High" } },
  { code: "PR", label: "Privileges Required", group: "base", mandatory: true, values: { N: "None", L: "Low", H: "High" } },
  { code: "UI", label: "User Interaction", group: "base", mandatory: true, values: { N: "None", R: "Required" } },
  { code: "S", label: "Scope", group: "base", mandatory: true, values: { U: "Unchanged", C: "Changed" } },
  { code: "C", label: "Confidentiality Impact", group: "base", mandatory: true, values: { H: "High", L: "Low", N: "None" } },
  { code: "I", label: "Integrity Impact", group: "base", mandatory: true, values: { H: "High", L: "Low", N: "None" } },
  { code: "A", label: "Availability Impact", group: "base", mandatory: true, values: { H: "High", L: "Low", N: "None" } },
  // Temporal (optional)
  { code: "E", label: "Exploit Code Maturity", group: "temporal", mandatory: false, values: { X: "Not Defined", H: "High", F: "Functional", P: "Proof-of-Concept", U: "Unproven" } },
  { code: "RL", label: "Remediation Level", group: "temporal", mandatory: false, values: { X: "Not Defined", U: "Unavailable", W: "Workaround", T: "Temporary Fix", O: "Official Fix" } },
  { code: "RC", label: "Report Confidence", group: "temporal", mandatory: false, values: { X: "Not Defined", C: "Confirmed", R: "Reasonable", U: "Unknown" } },
  // Environmental (optional)
  { code: "CR", label: "Confidentiality Requirement", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", M: "Medium", L: "Low" } },
  { code: "IR", label: "Integrity Requirement", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", M: "Medium", L: "Low" } },
  { code: "AR", label: "Availability Requirement", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", M: "Medium", L: "Low" } },
  { code: "MAV", label: "Modified Attack Vector", group: "environmental", mandatory: false, values: { X: "Not Defined", N: "Network", A: "Adjacent", L: "Local", P: "Physical" } },
  { code: "MAC", label: "Modified Attack Complexity", group: "environmental", mandatory: false, values: { X: "Not Defined", L: "Low", H: "High" } },
  { code: "MPR", label: "Modified Privileges Required", group: "environmental", mandatory: false, values: { X: "Not Defined", N: "None", L: "Low", H: "High" } },
  { code: "MUI", label: "Modified User Interaction", group: "environmental", mandatory: false, values: { X: "Not Defined", N: "None", R: "Required" } },
  { code: "MS", label: "Modified Scope", group: "environmental", mandatory: false, values: { X: "Not Defined", U: "Unchanged", C: "Changed" } },
  { code: "MC", label: "Modified Confidentiality Impact", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", L: "Low", N: "None" } },
  { code: "MI", label: "Modified Integrity Impact", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", L: "Low", N: "None" } },
  { code: "MA", label: "Modified Availability Impact", group: "environmental", mandatory: false, values: { X: "Not Defined", H: "High", L: "Low", N: "None" } },
];
const DEF_BY_CODE = new Map(METRIC_DEFS.map((d) => [d.code, d]));
const METRIC_ORDER = new Map(METRIC_DEFS.map((d, i) => [d.code, i]));

// ---- Numeric weights (FIRST.org CVSS v3.1 Section 7) ------------------------
const AV_W: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_W: Record<string, number> = { L: 0.77, H: 0.44 };
const UI_W: Record<string, number> = { N: 0.85, R: 0.62 };
const CIA_W: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
const E_W: Record<string, number> = { X: 1, H: 1, F: 0.97, P: 0.94, U: 0.91 };
const RL_W: Record<string, number> = { X: 1, U: 1, W: 0.97, T: 0.96, O: 0.95 };
const RC_W: Record<string, number> = { X: 1, C: 1, R: 0.96, U: 0.92 };
const REQ_W: Record<string, number> = { X: 1, H: 1.5, M: 1, L: 0.5 };

// PR is scope-dependent.
function prWeight(code: string, scopeChanged: boolean): number {
  if (code === "N") return 0.85;
  if (code === "L") return scopeChanged ? 0.68 : 0.62;
  return scopeChanged ? 0.5 : 0.27; // H
}

// v3.1 floating-point-safe Roundup (Appendix A).
function roundup31(x: number): number {
  const i = Math.round(x * 100000);
  if (i % 10000 === 0) return i / 100000;
  return (Math.floor(i / 10000) + 1) / 10;
}
// v3.0 round: ceil to one decimal.
function roundup30(x: number): number {
  return Math.ceil(x * 10) / 10;
}

function severityBand(score: number): string {
  if (score <= 0) return "None";
  if (score < 4.0) return "Low";
  if (score < 7.0) return "Medium";
  if (score < 9.0) return "High";
  return "Critical";
}

export function parseCvssVector(input: string): CvssParse {
  const out: CvssParse = {
    recognized: false, version: null, parseError: null, unsupportedVersion: null,
    baseScore: null, baseSeverity: null, temporalScore: null, temporalSeverity: null,
    environmentalScore: null, environmentalSeverity: null,
    impactSubScore: null, exploitabilitySubScore: null, scopeChanged: null,
    metrics: [], warnings: [], missingBase: [], unknownMetrics: [],
  };
  const text = input.trim();
  if (!text) return out;

  // Split off an optional CVSS:x.y prefix.
  let body = text;
  const prefixMatch = /^CVSS:(\d+\.\d+)\/(.*)$/i.exec(text);
  if (prefixMatch) {
    const ver = prefixMatch[1];
    if (ver === "3.1" || ver === "3.0") {
      out.version = ver;
    } else {
      out.unsupportedVersion = ver;
      out.parseError = `unsupported-version:${ver}`;
      return out;
    }
    body = prefixMatch[2];
  } else if (/^(AV|CVSS):/i.test(text) || /\bAV:[NALP]\b/i.test(text)) {
    // Bare vector without a version prefix: assume 3.1 and note it.
    out.version = "3.1";
    out.warnings.push("no-version-prefix");
  } else {
    return out; // not a CVSS vector
  }

  // Parse metric:value pairs.
  const seen = new Map<string, string>();
  const parts = body.split("/").filter((p) => p.length > 0);
  if (parts.length === 0) return out;
  for (const part of parts) {
    const m = /^([A-Za-z]+):([A-Za-z]+)$/.exec(part);
    if (!m) {
      out.parseError = `malformed-component:${part}`;
      return out;
    }
    const code = m[1].toUpperCase();
    const val = m[2].toUpperCase();
    const def = DEF_BY_CODE.get(code);
    if (!def) {
      out.unknownMetrics.push(code);
      continue;
    }
    if (!(val in def.values)) {
      out.parseError = `invalid-value:${code}:${val}`;
      return out;
    }
    if (seen.has(code)) {
      out.warnings.push("duplicate-metric");
    }
    seen.set(code, val);
  }

  // Recognized as a CVSS vector at this point.
  out.recognized = true;

  // Build the decoded metric views in canonical order.
  const views: MetricView[] = [];
  for (const [code, val] of seen) {
    const def = DEF_BY_CODE.get(code)!;
    views.push({ code, label: def.label, value: val, valueLabel: def.values[val], group: def.group });
  }
  views.sort((a, b) => (METRIC_ORDER.get(a.code)! - METRIC_ORDER.get(b.code)!));
  out.metrics = views;

  // Check mandatory base metrics.
  const missing = METRIC_DEFS.filter((d) => d.mandatory && !seen.has(d.code)).map((d) => d.code);
  out.missingBase = missing;
  if (missing.length > 0) {
    out.warnings.push("incomplete-base");
    return out; // cannot score without a complete base
  }

  const roundup = out.version === "3.0" ? roundup30 : roundup31;

  // ---- Base score ----
  const scopeChanged = seen.get("S") === "C";
  out.scopeChanged = scopeChanged;
  const av = AV_W[seen.get("AV")!];
  const ac = AC_W[seen.get("AC")!];
  const pr = prWeight(seen.get("PR")!, scopeChanged);
  const ui = UI_W[seen.get("UI")!];
  const c = CIA_W[seen.get("C")!];
  const i = CIA_W[seen.get("I")!];
  const a = CIA_W[seen.get("A")!];

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  let impact: number;
  if (scopeChanged) {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  } else {
    impact = 6.42 * iss;
  }
  const exploitability = 8.22 * av * ac * pr * ui;
  out.impactSubScore = Math.round(impact * 10) / 10;
  out.exploitabilitySubScore = Math.round(exploitability * 10) / 10;

  let base: number;
  if (impact <= 0) {
    base = 0;
  } else if (scopeChanged) {
    base = roundup(Math.min(1.08 * (impact + exploitability), 10));
  } else {
    base = roundup(Math.min(impact + exploitability, 10));
  }
  out.baseScore = base;
  out.baseSeverity = severityBand(base);

  // ---- Temporal score (only if any temporal metric is present) ----
  const hasTemporal = ["E", "RL", "RC"].some((k) => seen.has(k));
  const e = E_W[seen.get("E") ?? "X"];
  const rl = RL_W[seen.get("RL") ?? "X"];
  const rc = RC_W[seen.get("RC") ?? "X"];
  if (hasTemporal) {
    const temporal = roundup(base * e * rl * rc);
    out.temporalScore = temporal;
    out.temporalSeverity = severityBand(temporal);
  }

  // ---- Environmental score (only if any environmental metric is present) ----
  const envCodes = ["CR", "IR", "AR", "MAV", "MAC", "MPR", "MUI", "MS", "MC", "MI", "MA"];
  const hasEnv = envCodes.some((k) => seen.has(k));
  if (hasEnv) {
    // Modified metrics fall back to their base counterpart when X / absent.
    const mavCode = pick(seen, "MAV", "AV");
    const macCode = pick(seen, "MAC", "AC");
    const muiCode = pick(seen, "MUI", "UI");
    const msCode = pick(seen, "MS", "S");
    const mcCode = pick(seen, "MC", "C");
    const miCode = pick(seen, "MI", "I");
    const maCode = pick(seen, "MA", "A");
    const mScopeChanged = msCode === "C";
    const mprCode = pick(seen, "MPR", "PR");

    const cr = REQ_W[seen.get("CR") ?? "X"];
    const ir = REQ_W[seen.get("IR") ?? "X"];
    const ar = REQ_W[seen.get("AR") ?? "X"];

    const mav = AV_W[mavCode];
    const mac = AC_W[macCode];
    const mpr = prWeight(mprCode, mScopeChanged);
    const mui = UI_W[muiCode];
    const mc = CIA_W[mcCode];
    const mi = CIA_W[miCode];
    const ma = CIA_W[maCode];

    const missMod = Math.min(1 - (1 - mc * cr) * (1 - mi * ir) * (1 - ma * ar), 0.915);
    let modImpact: number;
    if (mScopeChanged) {
      if (out.version === "3.0") {
        modImpact = 7.52 * (missMod - 0.029) - 3.25 * Math.pow(missMod - 0.02, 15);
      } else {
        modImpact = 7.52 * (missMod - 0.029) - 3.25 * Math.pow(missMod * 0.9731 - 0.02, 13);
      }
    } else {
      modImpact = 6.42 * missMod;
    }
    const modExploit = 8.22 * mav * mac * mpr * mui;

    let env: number;
    if (modImpact <= 0) {
      env = 0;
    } else if (mScopeChanged) {
      env = roundup(roundup(Math.min(1.08 * (modImpact + modExploit), 10)) * e * rl * rc);
    } else {
      env = roundup(roundup(Math.min(modImpact + modExploit, 10)) * e * rl * rc);
    }
    out.environmentalScore = env;
    out.environmentalSeverity = severityBand(env);
  }

  // De-dupe warnings, keep order.
  out.warnings = Array.from(new Set(out.warnings));
  return out;
}

// Returns the modified metric value code, falling back to the base metric when
// the modified metric is absent or explicitly Not Defined (X).
function pick(seen: Map<string, string>, modCode: string, baseCode: string): string {
  const mv = seen.get(modCode);
  if (mv && mv !== "X") return mv;
  return seen.get(baseCode)!;
}
