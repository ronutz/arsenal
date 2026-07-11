// ============================================================================
// src/lib/tools/f5xc-object-linter/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: each object type triggering its rules (and a clean object
// producing none), plus severity sorting and negatives.
// ============================================================================

import { lintObject, run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-object-linter/2026-07-11";

const POOL_RISKY = JSON.stringify({ metadata: { name: "risky-pool" }, spec: { origin_servers: [{ public_name: { dns_name: "x.example.com" } }], use_tls: { skip_server_verification: {}, disable_sni: {} }, healthcheck: [] } });
const POOL_CLEARTEXT = JSON.stringify({ spec: { origin_servers: [{ public_ip: { ip: "1.2.3.4" } }, { public_ip: { ip: "5.6.7.8" } }], no_tls: {}, healthcheck: [{ name: "hc" }] } });
const LB_RISKY = JSON.stringify({ spec: { domains: ["*.example.com", "example.com"], http: {}, routes: [{ simple_route: { path: { prefix: "/" } } }, { simple_route: { path: { prefix: "/api" } } }] } });
const LB_WAF = JSON.stringify({ spec: { domains: ["app.example.com"], https_auto_cert: { http_redirect: false }, app_firewall: { name: "waf" }, routes: [{ simple_route: { path: { prefix: "/x" }, advanced_options: { disable_waf: {} } } }] } });
const WAF_MON = JSON.stringify({ spec: { monitoring: {}, detection_settings: { disable_threat_campaigns: {} } } });
const WAF_OK = JSON.stringify({ spec: { blocking: {}, detection_settings: {} } });

const has = (r: ReturnType<typeof lintObject>, code: string, sev?: string) => r.findings.some((f) => f.code === code && (sev === undefined || f.severity === sev));

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const pr = lintObject(POOL_RISKY);
  ok("pool-type", pr.objectType === "origin_pool" && pr.objectName === "risky-pool", JSON.stringify([pr.objectType, pr.objectName]));
  ok("pool-skip", has(pr, "op-skip-verify", "high"), JSON.stringify(pr.findings));
  ok("pool-nosni", has(pr, "op-no-sni", "info"));
  ok("pool-nohc", has(pr, "op-no-healthcheck", "info"));
  ok("pool-single", has(pr, "op-single-origin", "info"));
  ok("pool-sorted", pr.findings[0].severity === "high", JSON.stringify(pr.findings[0]));

  const pc = lintObject(POOL_CLEARTEXT);
  ok("pool-cleartext", has(pc, "op-cleartext", "warn"), JSON.stringify(pc.findings));
  ok("pool-no-single", !has(pc, "op-single-origin") && !has(pc, "op-no-healthcheck"), JSON.stringify(pc.findings));

  const lr = lintObject(LB_RISKY);
  ok("lb-type", lr.objectType === "http_loadbalancer", lr.objectType);
  ok("lb-nowaf", has(lr, "lb-no-waf", "warn"), JSON.stringify(lr.findings));
  ok("lb-cleartext", has(lr, "lb-cleartext", "warn"));
  ok("lb-shadow", has(lr, "lb-route-shadow", "warn"));
  ok("lb-wildcardapex", has(lr, "lb-wildcard-apex", "info"));

  const lw = lintObject(LB_WAF);
  ok("lb-has-waf", !has(lw, "lb-no-waf"), JSON.stringify(lw.findings));
  ok("lb-noredirect", has(lw, "lb-no-redirect", "info"));
  ok("lb-route-waf-off", has(lw, "lb-route-waf-off", "warn"));
  ok("lb-no-shadow", !has(lw, "lb-route-shadow"), JSON.stringify(lw.findings));

  const wm = lintObject(WAF_MON);
  ok("waf-type", wm.objectType === "app_firewall", wm.objectType);
  ok("waf-monitoring", has(wm, "waf-monitoring", "warn"), JSON.stringify(wm.findings));
  ok("waf-tc-off", has(wm, "waf-tc-off", "info"));

  const wo = lintObject(WAF_OK);
  ok("waf-clean", wo.recognized && wo.findings.length === 0 && wo.rulesRun === 2, JSON.stringify(wo));

  // run() + negatives
  ok("run-json", run(POOL_RISKY).objectType === "origin_pool");
  ok("reject-bad-json", lintObject("{nope").ok === false, "bad json not rejected");
  ok("reject-empty", lintObject("").ok === false);
  ok("unrecognized", lintObject(JSON.stringify({ spec: { foo: "bar" } })).recognized === false, "unknown object not flagged");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "pool-type", "pool-skip", "pool-nosni", "pool-nohc", "pool-single", "pool-sorted", "pool-cleartext", "pool-no-single",
  "lb-type", "lb-nowaf", "lb-cleartext", "lb-shadow", "lb-wildcardapex", "lb-has-waf", "lb-noredirect", "lb-route-waf-off", "lb-no-shadow",
  "waf-type", "waf-monitoring", "waf-tc-off", "waf-clean", "run-json", "reject-bad-json", "reject-empty", "unrecognized",
];
