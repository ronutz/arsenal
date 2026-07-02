// ============================================================================
// src/lib/tools/f5-awaf-declarative-policy-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the F5 Advanced WAF declarative-policy explainer. Inputs
// are F5's OWN published example policies, so they are ground-truth artifacts
// rather than reconstructions:
//   - "arcadia-api" is F5's Arcadia API declarative policy from the DevCentral
//     article "Advanced WAF v16.0 - Declarative API".
//   - "core-section" and "adjustments-bare" are F5's core-section and
//     adjustments examples from clouddocs "Overview: WAF Policies".
// The two synthetic vectors ("monitor-only", "dataguard-weak-cookie") use only
// field names and enum values taken verbatim from the v17.1 schema
// (enforcementMode=transparent, signatureStaging, trustXff, enforcementType
// "enforced", securedOverHttpsConnection, accessibleOnlyThroughTheHttpProtocol)
// and exercise the value-reading security callouts. Each check asserts on the
// derived decode, never on internal representation.
// ============================================================================

import { parseAwafPolicy } from "./compute";

export const SET_ID = "f5-awaf-declarative-policy-explainer/2026-07-02";

interface Vector {
  name: string;
  input: string;
  check: (r: ReturnType<typeof parseAwafPolicy>) => string | null; // null = pass
}

const eq = (label: string, got: unknown, want: unknown): string | null =>
  JSON.stringify(got) === JSON.stringify(want) ? null : `${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`;

/** Find a rendered section's detail/severity by key. */
const sec = (r: ReturnType<typeof parseAwafPolicy>, key: string) => r.sections.find((s) => s.key === key);

export const VECTORS: Vector[] = [
  {
    // F5 DevCentral: Advanced WAF v16.0 - Declarative API (Arcadia API policy).
    name: "arcadia-api-blocking",
    input: JSON.stringify({
      policy: {
        name: "policy-api-arcadia",
        description: "Arcadia API",
        template: { name: "POLICY_TEMPLATE_API_SECURITY" },
        enforcementMode: "blocking",
        "server-technologies": [{ serverTechnologyName: "MySQL" }, { serverTechnologyName: "Unix/Linux" }, { serverTechnologyName: "MongoDB" }],
        "signature-settings": { signatureStaging: false },
        "policy-builder": { learnOnlyFromNonBotTraffic: false },
      },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("name", r.policyName, "policy-api-arcadia") ??
      eq("template", r.templateName, "POLICY_TEMPLATE_API_SECURITY") ??
      eq("enforcement", r.enforcement, "blocking") ??
      eq("sectionCount", r.sectionCount, 7) ??
      // blocking + staging off + no XFF trust + no data-guard-off => no flags
      eq("flagCount", r.securityFlags.length, 0) ??
      eq("server-tech-detail", sec(r, "server-technologies")?.detail, "Declared: MySQL, Unix/Linux, MongoDB."),
  },
  {
    // F5 clouddocs "Overview: WAF Policies" - core section example.
    name: "core-section",
    input: JSON.stringify({
      policy: { name: "AppPolicy01", description: "AppV1.1 - DEMO", template: { name: "POLICY_TEMPLATE_FUNDAMENTAL" } },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("name", r.policyName, "AppPolicy01") ??
      eq("template", r.templateName, "POLICY_TEMPLATE_FUNDAMENTAL") ??
      // template-delta note always present for recognized policies
      (r.templateNote.length > 0 ? null : "expected templateNote"),
  },
  {
    // F5 clouddocs "Overview: WAF Policies" - adjustments example (BARE object,
    // no "policy" wrapper). Confirms the bare-policy detection path.
    name: "adjustments-bare",
    input: JSON.stringify({
      enforcementMode: "blocking",
      "server-technologies": [{ serverTechnologyName: "MySQL" }],
      "signature-settings": { signatureStaging: false },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("enforcement", r.enforcement, "blocking") ??
      eq("sig-detail-present", typeof sec(r, "signature-settings")?.detail === "string", true),
  },
  {
    // Monitor-only posture: transparent + signature staging + XFF trust +
    // Data Guard explicitly off. Must raise exactly four security flags.
    name: "monitor-only-flags",
    input: JSON.stringify({
      policy: {
        name: "mon",
        enforcementMode: "transparent",
        "signature-settings": { signatureStaging: true },
        general: { trustXff: true, enforcementReadinessPeriod: 7 },
        "data-guard": { enabled: false },
      },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("enforcement", r.enforcement, "transparent") ??
      eq("flagCount", r.securityFlags.length, 4) ??
      // the transparent flag is the only "warn"
      eq("warnCount", r.securityFlags.filter((f) => f.severity === "warn").length, 1) ??
      eq("enforcementMode-severity", sec(r, "enforcementMode")?.severity, "warn"),
  },
  {
    // Data Guard on (masking types), plus an enforced cookie missing Secure and
    // HttpOnly -> Data Guard reads "on", cookies section flags the weak cookie.
    name: "dataguard-weak-cookie",
    input: JSON.stringify({
      policy: {
        name: "dg",
        enforcementMode: "blocking",
        "data-guard": { enabled: true, creditCardNumbers: true, usSocialSecurityNumbers: true },
        cookies: [{ name: "SESSIONID", enforcementType: "enforced", securedOverHttpsConnection: false, accessibleOnlyThroughTheHttpProtocol: false }],
      },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("dataguard-severity", sec(r, "data-guard")?.severity, "info") ??
      (sec(r, "data-guard")?.detail?.includes("credit-card") ? null : "expected data-guard credit-card detail") ??
      eq("cookie-severity", sec(r, "cookies")?.severity, "note") ??
      (sec(r, "cookies")?.detail?.includes("Secure") ? null : "expected cookie Secure/HttpOnly note"),
  },
  {
    // Negatives: JSON that is not a policy, and malformed JSON.
    name: "negatives",
    input: JSON.stringify({ foo: "bar", hello: 1 }),
    check: (r) => {
      const notPolicy = eq("recognized", r.recognized, false) ?? (r.unrecognizedReason ? null : "expected unrecognizedReason");
      if (notPolicy) return notPolicy;
      const bad = parseAwafPolicy("{ this is not json ");
      return eq("bad.recognized", bad.recognized, false) ?? (bad.parseError ? null : "expected parseError for malformed JSON");
    },
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check(parseAwafPolicy(v.input));
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failures.length, failed: failures.length, failures };
}
