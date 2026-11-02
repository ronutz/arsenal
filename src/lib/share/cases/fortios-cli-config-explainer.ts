// ============================================================================
// src/lib/share/cases/fortios-cli-config-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiOS CLI config explainer (derived): the link carries
// a copy of the block with every FortiOS secret value replaced by a numbered
// mark; the page's Example has nothing to replace; a value that runs past its
// line (a PEM key) or a credential left in the copy blocks the link; text the
// page cannot read has nothing to share; an arriving text that still holds a
// secret is malformed. The secrets below are invented for these cases (the
// ENC value is base64 for "this is not a real secret") or published test
// values (RFC 7468 section 10's private key, RFC 7519 section 3.1's JWT).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIOS_CLI_CONFIG_SHARE, type FortiosCliShareState } from "../../tools/fortios-cli-config-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = `config firewall policy
    edit 10
        set name "allow-web"
        set srcintf "port1"
        set dstintf "port2"
        set srcaddr "internal-net"
        set dstaddr "all"
        set service "HTTPS"
        set action accept
    next
end`; // as the component holds it
/** An invented ENC value: base64 for "this is not a real secret". */
const ENC = "dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA=="; // never in a link
/** An invented plain pre-shared key. */
const PSK = "not-a-real-psk"; // never in a link
/** A phase1-interface block with both pre-shared keys, then an SNMP community (RFC 1157 3.2.5: the name is the credential). */
const VPN = `config vpn ipsec phase1-interface
    edit "to-branch"
        set interface "wan1"
        set remote-gw 198.51.100.7
        set psksecret ENC ${ENC}
        set psksecret-remote "${PSK}"
    next
end
config system snmp community
    edit 1
        set name "campus-ro-7f3a"
        set status enable
    next
end`; // as pasted
/** Its copy: the three values numbered, everything else as pasted. */
const VPN_COPY = `config vpn ipsec phase1-interface
    edit "to-branch"
        set interface "wan1"
        set remote-gw 198.51.100.7
        set psksecret ENC [redacted-1]
        set psksecret-remote "[redacted-2]"
    next
end
config system snmp community
    edit 1
        set name "[redacted-3]"
        set status enable
    next
end`; // what the link carries
/** An administrator with an ENC password hash and an API user's key, CR LF line ends: the same value gets the same mark. */
const ADMIN = `config system admin\r\n    edit "ops"\r\n        set accprofile "super_admin"\r\n        set password ENC ${ENC}\r\n    next\r\nend\r\nconfig system api-user\r\n    edit "automation"\r\n        set api-key ENC ${ENC}\r\n    next\r\nend`; // as pasted, CR LF kept
/** Its copy: one mark for the one value, line ends kept. */
const ADMIN_COPY = `config system admin\r\n    edit "ops"\r\n        set accprofile "super_admin"\r\n        set password ENC [redacted-1]\r\n    next\r\nend\r\nconfig system api-user\r\n    edit "automation"\r\n        set api-key ENC [redacted-1]\r\n    next\r\nend`; // what the link carries
/** RFC 7468 section 10's PKCS #8 example key, as FortiOS writes a local certificate's key (a quoted value over several lines). */
const PEM_KEY = `config vpn certificate local
    edit "web-cert"
        set password ENC ${ENC}
        set private-key "-----BEGIN PRIVATE KEY-----
MIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgVcB/UNPxalR9zDYAjQIf
jojUDiQuGnSJrFEEzZPT/92hRANCAASc7UJtgnF/abqWM60T3XNJEzBv5ez9TdwK
H0M6xpM2q+53wmsN/eYLdgtjgBd3DBmHtPilCkiFICXyaA8z9LkJ
-----END PRIVATE KEY-----"
    next
end`; // a key cannot be replaced on one line
/** RFC 7519 section 3.1's example JWT. */
const JWT = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // a bearer token by shape

/** The cases. */
export const FORTIOS_CLI_CONFIG_EXPLAINER_SHARE_CASES = defineShareCases<FortiosCliShareState, FortiosCliShareState>({
  spec: FORTIOS_CLI_CONFIG_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: as pasted
    { id: "psk-and-community", state: { input: VPN }, params: { input: VPN_COPY }, restored: { input: VPN_COPY }, mustNotContain: [ENC, PSK, "campus-ro-7f3a"] }, // three values, three marks
    { id: "crlf-equal-values", state: { input: ADMIN }, params: { input: ADMIN_COPY }, restored: { input: ADMIN_COPY }, mustNotContain: [ENC] }, // one value, one mark; CR LF kept
    { id: "copy-of-copy", state: { input: VPN_COPY }, params: { input: VPN_COPY }, restored: { input: VPN_COPY } }, // a copy has nothing left to replace
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-verb", state: { input: "just some notes about a firewall" } }, // the page reads no verb: its own message, nothing to share
  ],
  blocked: [
    { id: "pem-key", state: { input: PEM_KEY }, code: "secret" }, // a key over several lines cannot be replaced
    { id: "jwt-in-comments", state: { input: `config system automation-action\n    edit "notify"\n        set comments "${JWT}"\n    next\nend` }, code: "secret" }, // a credential the copy cannot name
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "  \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: `config vpn ipsec phase1-interface\n    edit "x"\n        set psksecret ENC ${ENC}\n    next\nend` } }, // an ENC value: never in a link
    { id: "still-plain", values: { input: `config user local\n    edit "guest"\n        set passwd "${PSK}"\n    next\nend` } }, // a plain password: never in a link
  ],
});
