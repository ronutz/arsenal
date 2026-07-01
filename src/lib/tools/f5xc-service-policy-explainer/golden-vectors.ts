// ============================================================================
// src/lib/tools/f5xc-service-policy-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors for the F5 XC service_policy explainer. Inputs are built from
// the official ves.io.schema.service_policy OpenAPI schema: every field name and
// most literal values come straight from the schema's own `x-ves-example`
// entries (server_name database.production.customer.volterra.us, header
// Accept-Encoding, path prefixes under /api/, ip prefix 192.168.20.0/24, TLS
// classes ADWARE/TRICKBOT, etc.), so these are ground-truth artifacts rather
// than reconstructions. Each vector asserts on the derived decode, not on
// internal representation, so the checks stay stable across refactors.
// ============================================================================

import { parseServicePolicy } from "./compute";

export const SET_ID = "f5xc-service-policy-explainer/2026-07-01";

interface Vector {
  name: string;
  input: string;
  check: (r: ReturnType<typeof parseServicePolicy>) => string | null; // null = pass
}

const eq = (label: string, got: unknown, want: unknown): string | null =>
  JSON.stringify(got) === JSON.stringify(want) ? null : `${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`;

export const VECTORS: Vector[] = [
  {
    name: "rule-list-basic",
    input: JSON.stringify({
      metadata: { name: "acmecorp-web", namespace: "staging" },
      spec: {
        server_name: "database.production.customer.volterra.us",
        rule_list: {
          rules: [
            { metadata: { name: "allow-api-get", description: "Allow GET to the API" },
              spec: { action: "ALLOW", path: { prefix_values: ["/api/"] }, http_method: { methods: ["GET"] },
                headers: [{ name: "Accept-Encoding", item: { exact_values: ["gzip"] } }] } },
            { metadata: { name: "deny-bad-asn" }, spec: { action: "DENY", asn_list: { as_numbers: [64512, 65000] } } },
            { metadata: { name: "allow-all" }, spec: { action: "ALLOW" } },
          ],
        },
      },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("name", r.name, "acmecorp-web") ??
      eq("namespace", r.namespace, "staging") ??
      eq("serverScope.kind", r.serverScope?.kind, "server_name") ??
      eq("disposition", r.disposition.kind, "rule_list") ??
      eq("ruleCount", r.rules.length, 3) ??
      eq("rule0.action", r.rules[0].action, "ALLOW") ??
      eq("rule0.predicateKeys", r.rules[0].predicates.map((p) => p.key), ["path", "http_method", "headers"]) ??
      eq("rule1.action", r.rules[1].action, "DENY") ??
      eq("rule1.asn", r.rules[1].predicates[0].lines[0].values, ["64512", "65000"]) ??
      eq("rule2.noPredicates", r.rules[2].predicates.length, 0) ??
      (r.warnings.includes("allow-all-rule") ? null : "missing allow-all-rule warning") ??
      (r.warnings.includes("case-sensitive-exact") ? null : "missing case-sensitive-exact warning"),
  },
  {
    name: "allow-all-requests",
    input: JSON.stringify({ spec: { any_server: {}, allow_all_requests: {} } }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("serverScope.kind", r.serverScope?.kind, "any_server") ??
      eq("disposition", r.disposition.kind, "allow_all") ??
      eq("ruleCount", r.rules.length, 0) ??
      (r.warnings.includes("allow-all-policy") ? null : "missing allow-all-policy warning"),
  },
  {
    name: "deny-list-sources",
    input: JSON.stringify({
      metadata: { name: "geo-block" },
      spec: { any_server: {}, deny_list: { country_list: ["COUNTRY_CN", "COUNTRY_RU"], default_action_deny: {} } },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("disposition", r.disposition.kind, "deny_list") ??
      eq("countries", r.disposition.sourceList?.lines[0].values, ["COUNTRY_CN", "COUNTRY_RU"]) ??
      eq("defaultAction", r.disposition.sourceList?.defaultAction, "DENY"),
  },
  {
    name: "header-and-logic",
    input: JSON.stringify({
      spec: {
        any_server: {},
        rule_list: { rules: [
          { metadata: { name: "combo" }, spec: { action: "DENY", headers: [
            { name: "partner-name", item: { exact_values: ["GOOGLE"] } },
            { name: "User-Agent", item: { exact_values: ["GoogleMobile-9.1.76", "GoogleMobile-9.1.77"] } },
          ] } },
        ] },
      },
    }),
    check: (r) =>
      eq("recognized", r.recognized, true) ??
      eq("ruleCount", r.rules.length, 1) ??
      // two header matchers => two subject lines (AND across them)
      eq("headerLineCount", r.rules[0].predicates[0].lines.length, 2) ??
      eq("subject0", r.rules[0].predicates[0].lines[0].subject, "partner-name") ??
      // one header carrying two exact values (OR within it)
      eq("ua-or-values", r.rules[0].predicates[0].lines[1].values, ["GoogleMobile-9.1.76", "GoogleMobile-9.1.77"]),
  },
  {
    name: "not-a-policy-and-malformed",
    input: JSON.stringify({ foo: "bar", hello: 1 }),
    check: (r) => {
      const notPolicy = eq("recognized", r.recognized, false) ?? eq("disposition", r.disposition.kind, "unknown");
      if (notPolicy) return notPolicy;
      const bad = parseServicePolicy("{ this is not json ");
      return eq("bad.recognized", bad.recognized, false) ?? (bad.parseError ? null : "expected parseError for malformed JSON");
    },
  },
];

export function verifyVectors(): { setId: string; passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  for (const v of VECTORS) {
    let msg: string | null;
    try {
      msg = v.check(parseServicePolicy(v.input));
    } catch (e) {
      msg = e instanceof Error ? e.message : String(e);
    }
    if (msg) failures.push(`${v.name}: ${msg}`);
  }
  return { setId: SET_ID, passed: VECTORS.length - failures.length, failed: failures.length, failures };
}
