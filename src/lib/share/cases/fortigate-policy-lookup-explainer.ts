// ============================================================================
// src/lib/share/cases/fortigate-policy-lookup-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate policy lookup explainer (derived): the link
// carries a copy of the box with every FortiOS secret value of the sections
// the lookup skips replaced by a numbered mark; the page's Example has
// nothing to replace; a PEM key blocks; a box without a policy has nothing to
// share. The secrets are invented for these cases.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_POLICY_LOOKUP_SHARE, type PolicyLookupShareState } from "../../tools/fortigate-policy-lookup-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = `config firewall policy
    edit 1
        set name "allow-any-outbound"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
        set action accept
    next
    edit 2
        set name "web-servers-https"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "LAN"
        set dstaddr "WebSrv"
        set service "HTTPS"
        set action accept
    next
end

packet: srcintf=port1, dstintf=port2, srcaddr=LAN, dstaddr=WebSrv, service=HTTPS`; // as the component holds it
/** An invented WPA pre-shared key and LDAP bind password. */
const WPA = "not-a-real-wifi-key", BIND = "bm90LWEtcmVhbC1iaW5k"; // never in a link
/** A larger paste: an SSID and an LDAP server before the policies (the lookup skips them), a table-free packet line after. */
const WHOLE = `config wireless-controller vap
    edit "corp"
        set ssid "corp"
        set passphrase "${WPA}"
    next
end
config user ldap
    edit "ad"
        set server "10.0.0.10"
        set password ENC ${BIND}
    next
end
config firewall policy
    edit 7
        set srcintf "corp"
        set dstintf "wan1"
        set srcaddr "all"
        set dstaddr "all"
        set service "ALL"
        set action accept
    next
end
packet: srcintf=corp, dstintf=wan1, srcaddr=all, dstaddr=all, service=HTTPS`; // as pasted
/** Its copy. */
const WHOLE_COPY = WHOLE.replace(`"${WPA}"`, `"[redacted-1]"`).replace(`ENC ${BIND}`, "ENC [redacted-2]"); // the two values numbered, the rest as pasted

/** The cases. */
export const FORTIGATE_POLICY_LOOKUP_EXPLAINER_SHARE_CASES = defineShareCases<PolicyLookupShareState, PolicyLookupShareState>({
  spec: FORTIGATE_POLICY_LOOKUP_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: as pasted
    { id: "whole-paste", state: { input: WHOLE }, params: { input: WHOLE_COPY }, restored: { input: WHOLE_COPY }, mustNotContain: [WPA, BIND] }, // the skipped sections' secrets replaced
    { id: "policies-only", state: { input: EXAMPLE.split("\n\n")[0] }, params: { input: EXAMPLE.split("\n\n")[0] }, restored: { input: EXAMPLE.split("\n\n")[0] } }, // no packet: the policies are listed, still a reading
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-policy", state: { input: "packet: srcintf=port1, dstintf=port2, srcaddr=all, dstaddr=all, service=ALL" } }, // no policy read
  ],
  blocked: [
    { id: "pem-key", state: { input: `${EXAMPLE}\nconfig vpn certificate local\n    edit "c"\n        set private-key "-----BEGIN PRIVATE KEY-----\nMIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgVcB/UNPxalR9zDYAjQIf\n-----END PRIVATE KEY-----"\n    next\nend` }, code: "secret" }, // RFC 7468 section 10's key, cut
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " " } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-plain", values: { input: `${EXAMPLE}\nconfig wireless-controller vap\n    edit "corp"\n        set passphrase "${WPA}"\n    next\nend` } }, // a WPA key: never in a link
  ],
});
