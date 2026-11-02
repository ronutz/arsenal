// ============================================================================
// src/lib/share/cases/f5xc-security-event-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 XC security event explainer (2026-11-01, wave 4B): a
// copy holding only the fields the page reads goes, as indented JSON; request
// headers, body, parameters, the user identifier, the tenant and a
// signature's matching_info never do; an envelope gives its one event; a
// credential in a field the page shows blocks the link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SEC_EVENT_SHARE, type SecEventShareState } from "../../tools/f5xc-security-event-explainer/share"; // the spec

/** The page's Example, built as the component builds it (every field one the page reads, so its copy is itself). */
const EXAMPLE = JSON.stringify(
  {
    sec_event_type: "waf_sec_event", // the type
    sec_event_name: "WAF", // its name
    action: "block", // what happened
    calculated_action: "block", // the recommendation
    method: "GET", // the request
    authority: "app.example.com", // its host
    req_path: "/search", // its path
    src_ip: "212.150.5.74", // the client (F5's own example address)
    vh_name: "prod-lb", // the load balancer
    vh_type: "HTTP_LOAD_BALANCER", // its type
    namespace: "prod", // the namespace
    req_id: "18205860747014045721", // the request id
    signatures: [{ id: "200021069", name: "SQL-injc SELECT", accuracy: "high_accuracy", attack_type: "ATTACK_TYPE_SQL_INJECTION" }], // the signature
    violations: [{ name: "VIOL_ATTACK_SIGNATURE", context: "request" }], // the violation
    attack_types: ["ATTACK_TYPE_SQL_INJECTION"], // the attack type
  },
  null,
  2,
); // as the component holds it

/** RFC 6265 section 4.2.1's session identifier and RFC 7617 section 2's credentials (read 2026-11-01). */
const SID = "31d4d96e407aad42"; // never in a link
const BASIC = "QWxhZGRpbjpvcGVuIHNlc2FtZQ=="; // never in a link
/** RFC 7519 section 3.1's example JWT (read 2026-11-01). */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // never in a link

/** An { events: [...] } page from the API, the event as the Console gives it: headers, body, user, tenant and more. */
const FULL_PAGE = JSON.stringify({
  events: [
    {
      tenant: "acmecorp-xyzw", // the tenant: stays out
      namespace: "shop", // shown
      app_type: "ves-io-http-loadbalancer-shop-lb", // stays out
      sec_event_type: "waf_sec_event", // shown
      sec_event_name: "WAF", // shown
      action: "report", // shown
      calculated_action: "block", // shown
      method: "POST", // shown
      authority: "shop.example.com", // shown
      req_path: "/login", // shown
      src_ip: "198.51.100.23", // shown
      user: "alice@example.com", // the user identifier: stays out
      req_headers: `{"Cookie":"SID=${SID}","Authorization":"Basic ${BASIC}","User-Agent":"curl/8.5.0"}`, // stays out
      req_body: "username=alice&password=hunter2", // stays out
      req_params: "next=%2Faccount", // stays out
      vh_name: "shop-lb", // shown
      req_id: "c0ffee00-1234", // shown
      time: "2026-10-31T23:58:01.123Z", // shown
      signatures: [{ id: "200001475", name: "XSS script tag end (Parameter)", accuracy: "high_accuracy", attack_type: "ATTACK_TYPE_CROSS_SITE_SCRIPTING", matching_info: "Matched 7 chars on offset 9 against value: 'password=hunter2'", context: "parameter (password)" }], // matching_info and context stay out
      violations: [{ name: "VIOL_ATTACK_SIGNATURE", context: "parameter" }], // shown
      attack_types: [{ name: "ATTACK_TYPE_CROSS_SITE_SCRIPTING" }], // objects: the page reads none of them
      country: "BR", // stays out
      ja4_tls_fingerprint: "t13d1516h2_8daaf6152771_02713d6af862", // stays out
    },
    { sec_event_type: "bot_defense_sec_event" }, // a second event: the page reads the first only
  ],
}); // as the API pages events
/** Its copy: the read fields, in the copy's order, indented. */
const FULL_COPY = JSON.stringify({ sec_event_type: "waf_sec_event", sec_event_name: "WAF", action: "report", calculated_action: "block", method: "POST", authority: "shop.example.com", req_path: "/login", src_ip: "198.51.100.23", vh_name: "shop-lb", namespace: "shop", req_id: "c0ffee00-1234", time: "2026-10-31T23:58:01.123Z", signatures: [{ id: "200001475", name: "XSS script tag end (Parameter)", accuracy: "high_accuracy", attack_type: "ATTACK_TYPE_CROSS_SITE_SCRIPTING" }], violations: [{ name: "VIOL_ATTACK_SIGNATURE", context: "parameter" }], attack_types: [] }, null, 2); // as the spec writes it

/** A service policy event inside a { message } envelope (a log receiver's shape). */
const ENVELOPE = JSON.stringify({ message: JSON.stringify({ sec_event_type: "svc_policy_sec_event", action: "deny", result: "deny", policy: "block-bad-asn", policy_rule: "deny-asn-64512", policy_set: "ves-io-active-service-policies-shop", src_ip: "192.0.2.10", vh_name: "shop-lb", user: "IP-192.0.2.10" }), source: "xc-global-log-receiver" }); // the message holds the event
/** Its copy. */
const ENVELOPE_COPY = JSON.stringify({ sec_event_type: "svc_policy_sec_event", action: "deny", result: "deny", src_ip: "192.0.2.10", vh_name: "shop-lb", policy: "block-bad-asn", policy_rule: "deny-asn-64512", policy_set: "ves-io-active-service-policies-shop" }, null, 2); // the event's read fields

/** The cases. */
export const F5XC_SECURITY_EVENT_SHARE_CASES = defineShareCases<SecEventShareState, SecEventShareState>({
  spec: SEC_EVENT_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // every field read: the copy is the Example
    { id: "full-page", state: { input: FULL_PAGE }, params: { input: FULL_COPY }, restored: { input: FULL_COPY }, mustNotContain: [SID, BASIC, "hunter2", "alice@example.com", "acmecorp-xyzw", "matching_info", "ja4", "next=%2Faccount"] }, // headers, body, user, tenant out
    { id: "message-envelope", state: { input: ENVELOPE }, params: { input: ENVELOPE_COPY }, restored: { input: ENVELOPE_COPY }, mustNotContain: ["xc-global-log-receiver", "IP-192.0.2.10"] }, // the event inside the message
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "not-json", state: { input: "action=block" } }, // the page's parse error
    { id: "unrecognised", state: { input: "{\"hello\": \"world\"}" } }, // no event the page knows
  ],
  blocked: [
    { id: "jwt-in-path", state: { input: EXAMPLE.replace("\"/search\"", `"/search?token=${JWT}"`) }, code: "secret" }, // a JWS in a field the page shows
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\n\n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
  ],
});
