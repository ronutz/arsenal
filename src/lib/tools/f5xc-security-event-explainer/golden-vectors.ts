// ============================================================================
// src/lib/tools/f5xc-security-event-explainer/golden-vectors.ts
// ----------------------------------------------------------------------------
// Golden vectors: one representative event per type (WAF, Bot Defense, Service
// Policy, API), the Sekoia { message } envelope, disposition derivation, and
// negatives. Field shapes match F5's Security Events Reference (2026-07-01).
// ============================================================================

import { explainSecurityEvent, run } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "f5xc-security-event-explainer/2026-07-11";

const WAF = {
  sec_event_type: "waf_sec_event",
  sec_event_name: "WAF",
  action: "block",
  calculated_action: "block",
  method: "GET",
  authority: "app.example.com",
  req_path: "/search",
  src_ip: "212.150.5.74",
  vh_name: "prod-lb",
  vh_type: "HTTP_LOAD_BALANCER",
  namespace: "prod",
  req_id: "18205860747014045721",
  signatures: [{ id: "200021069", name: "SQL-injc SELECT", accuracy: "high_accuracy", attack_type: "ATTACK_TYPE_SQL_INJECTION" }],
  violations: [{ name: "VIOL_ATTACK_SIGNATURE", context: "request" }],
  attack_types: ["ATTACK_TYPE_SQL_INJECTION"],
};
const BOT = {
  sec_event_type: "bot_defense_sec_event",
  sec_event_name: "BOT Defense Violation",
  action: "block",
  method: "POST",
  authority: "app.example.com",
  req_path: "/login",
  src_ip: "1.2.3.4",
  vh_name: "prod-lb",
  bot_defense: { insight: "MALICIOUS", automation_type: "Token Missing", recommendation: "Action_block" },
};
const SVC = {
  sec_event_type: "svc_policy_sec_event",
  action: "deny",
  result: "deny",
  method: "GET",
  authority: "api.example.com",
  req_path: "/admin",
  src_ip: "9.9.9.9",
  vh_name: "api-lb",
  policy: "geo-block",
  policy_rule: "block-anon-proxy",
  policy_set: "edge-policies",
  rate_limiter_action: "none",
};
const API = {
  sec_event_type: "api_sec_event",
  sec_event_name: "OpenAPI Validation Failure",
  action: "block",
  method: "POST",
  authority: "api.example.com",
  api_endpoint: "/api/orders",
  src_ip: "5.5.5.5",
  vh_name: "api-lb",
  oas_req_status: "OpenAPIViolation",
  policy_hits: { policy: "api-protect", policy_rule: "orders-rule", result: "deny" },
};
const REPORTED = { sec_event_type: "waf_sec_event", action: "report", authority: "x.example.com", vh_name: "lb", signatures: [], violations: [], attack_types: [] };

export function verifyVectors(): { passed: number; failed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  const ok = (name: string, cond: boolean, detail = "") => {
    if (cond) passed++;
    else failures.push(`[${name}] ${detail}`);
  };

  const w = explainSecurityEvent(JSON.stringify(WAF));
  ok("waf-type", w.eventType === "waf", w.eventType);
  ok("waf-disp", w.disposition === "blocked", w.disposition);
  ok("waf-action", w.action === "block" && w.recommended === "block", JSON.stringify([w.action, w.recommended]));
  ok("waf-req", w.request.method === "GET" && w.request.host === "app.example.com" && w.request.path === "/search" && w.request.srcIp === "212.150.5.74" && w.request.lb === "prod-lb", JSON.stringify(w.request));
  ok("waf-sig", w.waf?.signatures[0]?.id === "200021069" && w.waf?.signatures[0]?.accuracy === "high_accuracy" && w.waf?.signatures[0]?.attackType === "ATTACK_TYPE_SQL_INJECTION", JSON.stringify(w.waf?.signatures));
  ok("waf-viol", w.waf?.violations[0]?.name === "VIOL_ATTACK_SIGNATURE" && w.waf?.violations[0]?.context === "request", JSON.stringify(w.waf?.violations));
  ok("waf-attack", w.waf?.attackTypes.includes("ATTACK_TYPE_SQL_INJECTION") === true, JSON.stringify(w.waf?.attackTypes));
  ok("waf-note", w.notes.some((n) => n.includes("support id")), JSON.stringify(w.notes));

  const b = explainSecurityEvent(JSON.stringify(BOT));
  ok("bot-type", b.eventType === "bot", b.eventType);
  ok("bot-disp", b.disposition === "blocked", b.disposition);
  ok("bot-insight", b.bot?.insight === "MALICIOUS" && b.bot?.automationType === "Token Missing" && b.bot?.recommendation === "Action_block", JSON.stringify(b.bot));

  const sv = explainSecurityEvent(JSON.stringify(SVC));
  ok("svc-type", sv.eventType === "svc_policy", sv.eventType);
  ok("svc-disp", sv.disposition === "blocked", sv.disposition);
  ok("svc-policy", sv.svcPolicy?.policy === "geo-block" && sv.svcPolicy?.rule === "block-anon-proxy" && sv.svcPolicy?.set === "edge-policies", JSON.stringify(sv.svcPolicy));

  const a = explainSecurityEvent(JSON.stringify(API));
  ok("api-type", a.eventType === "api", a.eventType);
  ok("api-disp", a.disposition === "blocked", a.disposition);
  ok("api-policy", a.api?.policy === "api-protect" && a.api?.rule === "orders-rule" && a.api?.result === "deny", JSON.stringify(a.api));
  ok("api-oas", a.api?.oasReq === "OpenAPIViolation", a.api?.oasReq);
  ok("api-path", a.request.path === "/api/orders", a.request.path);

  const r = explainSecurityEvent(JSON.stringify(REPORTED));
  ok("reported-disp", r.disposition === "reported", r.disposition);

  // Sekoia { message } envelope
  const env = explainSecurityEvent(JSON.stringify({ message: JSON.stringify(WAF) }));
  ok("envelope", env.eventType === "waf" && env.request.lb === "prod-lb", JSON.stringify([env.eventType, env.request.lb]));

  // run() + negatives
  ok("run-json", run(JSON.stringify(WAF)).eventType === "waf");
  ok("reject-bad-json", explainSecurityEvent("{nope").ok === false, "bad json not rejected");
  ok("reject-empty", explainSecurityEvent("").ok === false);
  ok("unrecognized", explainSecurityEvent(JSON.stringify({ hello: "world" })).recognized === false, "non-event not flagged");

  return { passed, failed: failures.length, failures };
}

export const goldenVectors = [
  "waf-type", "waf-disp", "waf-action", "waf-req", "waf-sig", "waf-viol", "waf-attack", "waf-note", "bot-type", "bot-disp", "bot-insight",
  "svc-type", "svc-disp", "svc-policy", "api-type", "api-disp", "api-policy", "api-oas", "api-path", "reported-disp", "envelope",
  "run-json", "reject-bad-json", "reject-empty", "unrecognized",
];
