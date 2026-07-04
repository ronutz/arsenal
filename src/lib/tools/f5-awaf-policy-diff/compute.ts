// ============================================================================
// src/lib/tools/f5-awaf-policy-diff/compute.ts
// ----------------------------------------------------------------------------
// F5 AWAF - Advanced WAF (formerly BIG-IP ASM - Application Security Manager)
// POLICY-DIFF "DID THIS OPEN A HOLE?" CHECKER (arsenal-local, pure,
// deterministic). Paste two declarative WAF policies - a before and an after -
// and it classifies every security-relevant change as a relaxation or a
// tightening, and flags the relaxations that widen protection BEYOND A SINGLE
// ENTITY (the ones that can quietly open a hole) apart from a properly-scoped
// single-entity allow (the normal false-positive fix).
//
// THE DISTINCTION PRIME ASKED FOR: adding one allowed URL or parameter is a
// scoped, single-entity widening - the correct way to clear a false positive.
// Switching the policy to Transparent, disabling a violation or an evasion,
// turning Data Guard off, trusting X-Forwarded-For, or adding a wildcard entity
// widens protection across the whole policy. This tool separates the two so a
// tuning diff does not silently become a security regression.
//
// Pure, decode-only (D-49): it reads the two policy documents you paste,
// compares them, and never contacts a BIG-IP or fetches anything.
//
// Field paths are the same ones validated in the declarative-policy explainer
// and the evasion explainer, grounded in F5's declarative WAF policy schema
// (clouddocs.f5.com/products/waf-declarative-policy/): enforcementMode,
// signature-settings.signatureStaging, general.trustXff, data-guard.enabled,
// csrf-protection.enabled, blocking-settings.evasions[].{description,enabled},
// blocking-settings.violations[].{name,block}, and the urls/parameters/
// filetypes entity arrays (a name containing "*" is a wildcard).
// ============================================================================

const MAX_INPUT = 200_000;

// ---- helpers (same shape as the declarative explainer) --------------------
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
/** Unwrap the { "policy": {...} } envelope if present. */
function unwrap(root: unknown): Record<string, unknown> | null {
  if (isObject(root) && isObject(root["policy"])) return root["policy"] as Record<string, unknown>;
  if (isObject(root)) return root;
  return null;
}

// ---- normalized security profile ------------------------------------------
interface Entities {
  specific: Set<string>;
  wildcard: Set<string>;
}
interface SecProfile {
  enforcementMode?: string;
  signatureStaging?: boolean;
  trustXff?: boolean;
  dataGuard?: boolean;
  csrf?: boolean;
  evasions: Map<string, boolean>; // description -> enabled
  violations: Map<string, boolean>; // name -> block
  urls: Entities;
  parameters: Entities;
  filetypes: Entities;
}

function entitySet(arr: unknown): Entities {
  const specific = new Set<string>();
  const wildcard = new Set<string>();
  for (const e of asArray(arr)) {
    const name = isObject(e) ? asString(e["name"]) : typeof e === "string" ? e : undefined;
    if (!name) continue;
    if (name.includes("*")) wildcard.add(name);
    else specific.add(name);
  }
  return { specific, wildcard };
}

function profile(policy: Record<string, unknown>): SecProfile {
  const sigSettings = isObject(policy["signature-settings"]) ? (policy["signature-settings"] as Record<string, unknown>) : {};
  const general = isObject(policy["general"]) ? (policy["general"] as Record<string, unknown>) : {};
  const dg = isObject(policy["data-guard"]) ? (policy["data-guard"] as Record<string, unknown>) : {};
  const csrf = isObject(policy["csrf-protection"]) ? (policy["csrf-protection"] as Record<string, unknown>) : {};
  const blocking = isObject(policy["blocking-settings"]) ? (policy["blocking-settings"] as Record<string, unknown>) : {};

  const evasions = new Map<string, boolean>();
  for (const e of asArray(blocking["evasions"])) {
    if (!isObject(e)) continue;
    const name = asString(e["description"]);
    const en = asBool(e["enabled"]);
    if (name && en !== undefined) evasions.set(name, en);
  }
  const violations = new Map<string, boolean>();
  for (const v of asArray(blocking["violations"])) {
    if (!isObject(v)) continue;
    const name = asString(v["name"]) ?? asString(v["description"]);
    const block = asBool(v["block"]);
    if (name && block !== undefined) violations.set(name, block);
  }

  return {
    enforcementMode: asString(policy["enforcementMode"]),
    signatureStaging: asBool(sigSettings["signatureStaging"]),
    trustXff: asBool(general["trustXff"]),
    dataGuard: asBool(dg["enabled"]),
    csrf: asBool(csrf["enabled"]),
    evasions,
    violations,
    urls: entitySet(policy["urls"]),
    parameters: entitySet(policy["parameters"]),
    filetypes: entitySet(policy["filetypes"]),
  };
}

// ---- change model ---------------------------------------------------------
export type ChangeKind = "relaxation" | "tightening";
export type Scope = "policy-wide" | "single-entity";
export type Concern = "high" | "medium" | "low";

export interface Change {
  readonly dimension: string; // i18n key under "dim"
  readonly detail: string; // human phrase (already localized upstream? no - key + args)
  readonly labelKey: string; // i18n key for the change label
  readonly args?: Record<string, string>;
  readonly kind: ChangeKind;
  readonly scope: Scope;
  readonly concern: Concern;
}

export type Verdict = "opened-hole" | "scoped-only" | "tightened-only" | "no-change" | "mixed-scoped";

export interface DiffResult {
  readonly verdict: Verdict;
  readonly changes: readonly Change[];
  readonly policyWideRelaxations: number;
  readonly singleEntityRelaxations: number;
  readonly tightenings: number;
}

function boolChange(
  dim: string,
  before: boolean | undefined,
  after: boolean | undefined,
  relaxWhen: "true-to-false" | "false-to-true",
  relaxLabel: string,
  tightenLabel: string,
  concern: Concern,
  args?: Record<string, string>,
): Change | null {
  if (before === after) return null;
  // Only speak when both sides are defined OR the after flips it meaningfully.
  const relaxed = relaxWhen === "true-to-false" ? before !== false && after === false : before !== true && after === true;
  // Determine direction precisely.
  if (relaxWhen === "true-to-false") {
    if (after === false && before !== false) return mk(dim, relaxLabel, "relaxation", "policy-wide", concern, args);
    if (after === true && before === false) return mk(dim, tightenLabel, "tightening", "policy-wide", "low", args);
  } else {
    if (after === true && before !== true) return mk(dim, relaxLabel, "relaxation", "policy-wide", concern, args);
    if (after === false && before === true) return mk(dim, tightenLabel, "tightening", "policy-wide", "low", args);
  }
  void relaxed;
  return null;
}

function mk(dim: string, labelKey: string, kind: ChangeKind, scope: Scope, concern: Concern, args?: Record<string, string>): Change {
  return { dimension: dim, detail: labelKey, labelKey, kind, scope, concern, args };
}

export function diffPolicies(beforeRaw: unknown, afterRaw: unknown): DiffResult | null {
  const b = unwrap(beforeRaw);
  const a = unwrap(afterRaw);
  if (!b || !a) return null;

  const pb = profile(b);
  const pa = profile(a);
  const changes: Change[] = [];

  // 1. enforcementMode (the big one)
  if (pb.enforcementMode !== pa.enforcementMode && (pb.enforcementMode || pa.enforcementMode)) {
    if (pa.enforcementMode === "transparent" && pb.enforcementMode === "blocking")
      changes.push(mk("enforcementMode", "enforcementToTransparent", "relaxation", "policy-wide", "high"));
    else if (pa.enforcementMode === "blocking" && pb.enforcementMode === "transparent")
      changes.push(mk("enforcementMode", "enforcementToBlocking", "tightening", "policy-wide", "low"));
  }

  // 2-5. policy-wide boolean toggles
  const c2 = boolChange("signatureStaging", pb.signatureStaging, pa.signatureStaging, "false-to-true", "sigStagingOn", "sigStagingOff", "medium");
  if (c2) changes.push(c2);
  const c3 = boolChange("trustXff", pb.trustXff, pa.trustXff, "false-to-true", "trustXffOn", "trustXffOff", "medium");
  if (c3) changes.push(c3);
  const c4 = boolChange("dataGuard", pb.dataGuard, pa.dataGuard, "true-to-false", "dataGuardOff", "dataGuardOn", "medium");
  if (c4) changes.push(c4);
  const c5 = boolChange("csrf", pb.csrf, pa.csrf, "true-to-false", "csrfOff", "csrfOn", "medium");
  if (c5) changes.push(c5);

  // 6. evasions (per technique)
  const evNames = new Set([...pb.evasions.keys(), ...pa.evasions.keys()]);
  for (const name of evNames) {
    const before = pb.evasions.get(name);
    const after = pa.evasions.get(name);
    if (before === after || before === undefined || after === undefined) continue;
    if (before === true && after === false) changes.push(mk("evasion", "evasionDisabled", "relaxation", "policy-wide", "medium", { name }));
    else if (before === false && after === true) changes.push(mk("evasion", "evasionEnabled", "tightening", "policy-wide", "low", { name }));
  }

  // 7. violations (per violation, block flag)
  const vNames = new Set([...pb.violations.keys(), ...pa.violations.keys()]);
  for (const name of vNames) {
    const before = pb.violations.get(name);
    const after = pa.violations.get(name);
    if (before === after || before === undefined || after === undefined) continue;
    if (before === true && after === false) changes.push(mk("violation", "violationBlockOff", "relaxation", "policy-wide", "medium", { name }));
    else if (before === false && after === true) changes.push(mk("violation", "violationBlockOn", "tightening", "policy-wide", "low", { name }));
  }

  // 8. entities (urls / parameters / filetypes)
  for (const [dim, be, af] of [
    ["url", pb.urls, pa.urls],
    ["parameter", pb.parameters, pa.parameters],
    ["filetype", pb.filetypes, pa.filetypes],
  ] as const) {
    // wildcard additions/removals = policy-wide
    for (const w of af.wildcard) if (!be.wildcard.has(w)) changes.push(mk(dim, "wildcardAdded", "relaxation", "policy-wide", "high", { name: w, type: dim }));
    for (const w of be.wildcard) if (!af.wildcard.has(w)) changes.push(mk(dim, "wildcardRemoved", "tightening", "policy-wide", "low", { name: w, type: dim }));
    // specific additions = single-entity widening; removals = tightening
    for (const s of af.specific) if (!be.specific.has(s)) changes.push(mk(dim, "entityAdded", "relaxation", "single-entity", "low", { name: s, type: dim }));
    for (const s of be.specific) if (!af.specific.has(s)) changes.push(mk(dim, "entityRemoved", "tightening", "single-entity", "low", { name: s, type: dim }));
  }

  // ---- verdict ----
  const policyWideRelaxations = changes.filter((c) => c.kind === "relaxation" && c.scope === "policy-wide").length;
  const singleEntityRelaxations = changes.filter((c) => c.kind === "relaxation" && c.scope === "single-entity").length;
  const tightenings = changes.filter((c) => c.kind === "tightening").length;

  let verdict: Verdict;
  if (changes.length === 0) verdict = "no-change";
  else if (policyWideRelaxations > 0) verdict = "opened-hole";
  else if (singleEntityRelaxations > 0) verdict = "scoped-only";
  else if (tightenings > 0) verdict = "tightened-only";
  else verdict = "mixed-scoped";

  // Sort: policy-wide relaxations first (highest concern), then single-entity, then tightenings.
  const order = (c: Change) => (c.kind === "relaxation" && c.scope === "policy-wide" ? (c.concern === "high" ? 0 : 1) : c.kind === "relaxation" ? 2 : 3);
  const sorted = [...changes].sort((x, y) => order(x) - order(y));

  return { verdict, changes: sorted, policyWideRelaxations, singleEntityRelaxations, tightenings };
}

/** Bounded string entry (registry path parses { before, after }). */
export function diffFromJson(input: string): DiffResult | null {
  const raw = input.length > MAX_INPUT ? input.slice(0, MAX_INPUT) : input;
  const parsed = JSON.parse(raw);
  if (!isObject(parsed)) return null;
  return diffPolicies(parsed["before"], parsed["after"]);
}
