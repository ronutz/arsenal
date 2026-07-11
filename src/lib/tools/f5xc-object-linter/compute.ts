// ============================================================================
// src/lib/tools/f5xc-object-linter/compute.ts
// ----------------------------------------------------------------------------
// Deterministic linter for common F5 Distributed Cloud (XC) configuration
// hazards. Pure, offline. Paste an origin_pool, http_loadbalancer, or
// app_firewall (WAF) object and it flags risky or surprising settings, each
// grounded in a verified source. Findings are returned as structured codes +
// params so the component renders localized messages.
//
// Every rule's rationale is grounded (verified 2026-07-11):
//   - Origin pool TLS-to-origin skip verification, no_tls, SNI, health checks:
//     F5 Create Origin Pools guide.
//   - HTTP LB WAF attachment, HTTP->HTTPS redirect, per-route disable_waf,
//     first-match route shadowing, wildcard+apex: F5 Create HTTP LB guide,
//     per-route WAF article, DevCentral first-match, Listener Logic article.
//   - WAF enforcement mode (Blocking vs Monitoring): F5 Create WAF guide.
// This tool reuses schema knowledge already verified for the origin-pool,
// route, domain, and TLS tools in this family - it introduces no new schema.
// ============================================================================

export type Severity = "high" | "warn" | "info";
export type ObjectType = "origin_pool" | "http_loadbalancer" | "app_firewall" | "service_policy" | "unknown";

export interface LintFinding {
  code: string;
  severity: Severity;
  params: Record<string, string>;
}

export interface LintResult {
  ok: boolean;
  error?: string;
  recognized: boolean;
  objectType: ObjectType;
  objectName?: string;
  findings: LintFinding[];
  rulesRun: number;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const SEV_ORDER: Record<Severity, number> = { high: 3, warn: 2, info: 1 };

/** Detect the object type from the shape of its spec. */
function detectType(spec: Record<string, unknown>): ObjectType {
  if (Array.isArray(spec.origin_servers)) return "origin_pool";
  if (Array.isArray(spec.domains) || spec.default_route_pools !== undefined || (Array.isArray(spec.routes) && (spec.https_auto_cert !== undefined || spec.http !== undefined || spec.https !== undefined))) return "http_loadbalancer";
  if (spec.blocking !== undefined || spec.monitoring !== undefined || spec.detection_settings !== undefined || spec.enforcement_mode !== undefined) return "app_firewall";
  if (Array.isArray(spec.rules) || spec.allow_list !== undefined || spec.deny_list !== undefined) return "service_policy";
  return "unknown";
}

function lintOriginPool(spec: Record<string, unknown>, f: LintFinding[]): number {
  let rules = 0;
  // TLS to origin
  rules++;
  if (isObj(spec.use_tls)) {
    const u = spec.use_tls;
    if (u.skip_server_verification !== undefined) f.push({ code: "op-skip-verify", severity: "high", params: {} });
    if (u.disable_sni !== undefined) f.push({ code: "op-no-sni", severity: "info", params: {} });
  } else if (spec.no_tls !== undefined) {
    f.push({ code: "op-cleartext", severity: "warn", params: {} });
  }
  // health checks
  rules++;
  if (!Array.isArray(spec.healthcheck) || (spec.healthcheck as unknown[]).length === 0) f.push({ code: "op-no-healthcheck", severity: "info", params: {} });
  // origin server count
  rules++;
  if (Array.isArray(spec.origin_servers) && spec.origin_servers.length === 1) f.push({ code: "op-single-origin", severity: "info", params: {} });
  return rules;
}

/** Is a route a catch-all (path prefix "/" or empty)? */
function isCatchAll(route: Record<string, unknown>): boolean {
  for (const key of ["simple_route", "custom_route_object", "direct_response_route", "redirect_route"]) {
    const r = route[key];
    if (isObj(r)) {
      const path = isObj(r.path) ? r.path : undefined;
      if (path) {
        const prefix = typeof path.prefix === "string" ? path.prefix : undefined;
        if (prefix === "/" || prefix === "") return true;
      }
    }
  }
  return false;
}
function routeDisablesWaf(route: Record<string, unknown>): boolean {
  for (const key of Object.keys(route)) {
    const r = route[key];
    if (isObj(r)) {
      if (r.disable_waf !== undefined) return true;
      const adv = isObj(r.advanced_options) ? r.advanced_options : undefined;
      if (adv && adv.disable_waf !== undefined) return true;
    }
  }
  return false;
}

function lintLoadBalancer(spec: Record<string, unknown>, f: LintFinding[]): number {
  let rules = 0;
  // WAF attached?
  rules++;
  if (spec.app_firewall === undefined && spec.disable_waf === undefined) f.push({ code: "lb-no-waf", severity: "warn", params: {} });
  // cleartext listener / redirect
  rules++;
  if (spec.http !== undefined && spec.https === undefined && spec.https_auto_cert === undefined) {
    f.push({ code: "lb-cleartext", severity: "warn", params: {} });
  } else if (spec.https_auto_cert !== undefined || spec.https !== undefined) {
    const hac = isObj(spec.https_auto_cert) ? spec.https_auto_cert : isObj(spec.https) ? spec.https : {};
    if (hac.http_redirect !== true && spec.http_redirect !== true) f.push({ code: "lb-no-redirect", severity: "info", params: {} });
  }
  // routes: shadowing + per-route WAF off
  rules++;
  if (Array.isArray(spec.routes)) {
    const routes = spec.routes.filter(isObj);
    routes.forEach((r, i) => {
      if (routeDisablesWaf(r)) f.push({ code: "lb-route-waf-off", severity: "warn", params: { index: String(i + 1) } });
      if (isCatchAll(r) && i < routes.length - 1) f.push({ code: "lb-route-shadow", severity: "warn", params: { index: String(i + 1) } });
    });
  }
  // wildcard + apex
  rules++;
  if (Array.isArray(spec.domains)) {
    const doms = (spec.domains as unknown[]).map((d) => (typeof d === "string" ? d.toLowerCase() : "")).filter(Boolean);
    const apex = new Set(doms.filter((d) => !d.startsWith("*.")));
    for (const d of doms) {
      if (d.startsWith("*.") && apex.has(d.slice(2))) {
        f.push({ code: "lb-wildcard-apex", severity: "info", params: { base: d.slice(2) } });
        break;
      }
    }
  }
  return rules;
}

function lintWaf(spec: Record<string, unknown>, f: LintFinding[]): number {
  let rules = 0;
  // enforcement mode
  rules++;
  const mode = typeof spec.enforcement_mode === "string" ? spec.enforcement_mode.toUpperCase() : undefined;
  if (spec.monitoring !== undefined || mode === "MONITORING") f.push({ code: "waf-monitoring", severity: "warn", params: {} });
  // threat campaigns / detection settings
  rules++;
  const ds = isObj(spec.detection_settings) ? spec.detection_settings : undefined;
  if (ds && ds.disable_threat_campaigns !== undefined) f.push({ code: "waf-tc-off", severity: "info", params: {} });
  return rules;
}

function locateSpec(root: unknown): { spec: Record<string, unknown>; name?: string } | null {
  if (!isObj(root)) return null;
  const name = isObj(root.metadata) ? (typeof (root.metadata as Record<string, unknown>).name === "string" ? ((root.metadata as Record<string, unknown>).name as string) : undefined) : undefined;
  if (isObj(root.spec)) return { spec: root.spec, name };
  if (isObj(root.get_spec)) return { spec: root.get_spec, name };
  return { spec: root, name };
}

export function lintObject(text: string): LintResult {
  const empty: LintResult = { ok: false, recognized: false, objectType: "unknown", findings: [], rulesRun: 0 };
  const t = text.trim();
  if (t === "") return { ...empty, error: "Paste an F5XC config object (origin_pool, http_loadbalancer, or app_firewall)." };

  let root: unknown;
  try {
    root = JSON.parse(t);
  } catch {
    return { ...empty, error: "That is not valid JSON. Paste the object from the Console (JSON view) or the API." };
  }

  const found = locateSpec(root);
  if (!found) return { ...empty, ok: true, recognized: false };
  const spec = found.spec;
  const objectType = detectType(spec);

  const findings: LintFinding[] = [];
  let rulesRun = 0;
  if (objectType === "origin_pool") rulesRun = lintOriginPool(spec, findings);
  else if (objectType === "http_loadbalancer") rulesRun = lintLoadBalancer(spec, findings);
  else if (objectType === "app_firewall") rulesRun = lintWaf(spec, findings);

  findings.sort((a, b) => SEV_ORDER[b.severity] - SEV_ORDER[a.severity]);

  return {
    ok: true,
    recognized: objectType !== "unknown",
    objectType,
    objectName: found.name,
    findings,
    rulesRun,
  };
}

/** D-49 run entrypoint: a JSON string. */
export function run(input: string): LintResult {
  return lintObject(input);
}
