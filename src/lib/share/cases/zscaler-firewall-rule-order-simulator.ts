// ============================================================================
// src/lib/share/cases/zscaler-firewall-rule-order-simulator.ts
// ----------------------------------------------------------------------------
// Share cases of the ZIA firewall rule-order simulator (input-caution): the box goes as
// pasted once the page reads it; a credential in a rule name or a comment
// blocks the link; a secret-looking name is only named; text the page
// refuses has nothing to share.
// The credentials are published examples (RFC 7519 section 3.1's JWT, AWS's
// AKIAIOSFODNN7EXAMPLE, RFC 6750 section 2.1's Bearer token) or invented ones.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ZSCALER_FIREWALL_RULE_ORDER_SHARE, type ZiaFirewallShareState } from "../../tools/zscaler-firewall-rule-order-simulator/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "# ZIA style: default blocks, granular allows above it\n10 | allow-web | allow | proto=tcp port=443\n20 | block-bad-subnet | block | proto=tcp port=443 dest=203.0.113.0/24\n30 | dns-out | allow | proto=udp port=53\n40 | old-rule | block | proto=tcp port=8080 disabled\nflow: proto=tcp port=443 dest=203.0.113.7"; // as the component holds it

/** The cases. */
export const ZSCALER_FIREWALL_RULE_ORDER_SIMULATOR_SHARE_CASES = defineShareCases<ZiaFirewallShareState, ZiaFirewallShareState>({
  spec: ZSCALER_FIREWALL_RULE_ORDER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "first-match-stops", state: { input: "10 | allow-web | allow | proto=tcp port=443\n20 | block-web | block | proto=tcp port=443\nflow: proto=tcp port=443 dest=203.0.113.7" }, params: { input: "10 | allow-web | allow | proto=tcp port=443\n20 | block-web | block | proto=tcp port=443\nflow: proto=tcp port=443 dest=203.0.113.7" }, restored: { input: "10 | allow-web | allow | proto=tcp port=443\n20 | block-web | block | proto=tcp port=443\nflow: proto=tcp port=443 dest=203.0.113.7" } }, // first match stops (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "# admin_password=not-in-this-box\n10 | allow-web | allow | proto=tcp port=443" }, params: { input: "# admin_password=not-in-this-box\n10 | allow-web | allow | proto=tcp port=443" }, restored: { input: "# admin_password=not-in-this-box\n10 | allow-web | allow | proto=tcp port=443" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "refused", state: { input: "10 | allow-web | permit" } }, // an action the grammar lacks: the page's own error
  ],
  blocked: [
    { id: "jwt-in-comment", state: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\n10 | allow-web | allow | proto=tcp port=443" }, code: "secret" }, // RFC 7519 section 3.1's example JWT in a comment
    { id: "authorization-in-comment", state: { input: "# Authorization: Bearer mF_9.B5f-4.1JqM\n10 | allow-web | allow | proto=tcp port=443" }, code: "secret" }, // RFC 6750 section 2.1's example Bearer token
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "credential", values: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\n10 | allow-web | allow | proto=tcp port=443" } }, // a link this encoder never builds
  ],
});
