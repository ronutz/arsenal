// ============================================================================
// src/lib/share/cases/fortios-config-diff-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiOS config diff explainer (derived): the link carries
// a copy of the box with every FortiOS secret value replaced by a numbered
// mark, equal values sharing a number, so a changed secret still reads as
// changed and an unchanged one still does not; the page's Example has nothing
// to replace; a PEM key blocks; a box without two sides has nothing to share.
// The secrets are invented for these cases.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIOS_CONFIG_DIFF_SHARE, type FortiosDiffShareState } from "../../tools/fortios-config-diff-explainer/share"; // the spec

/** The page's Example (verbatim from the component): policies 1 and 2 swap places. */
const EXAMPLE = `config firewall policy
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
end
---
config firewall policy
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
end`; // as the component holds it
/** Invented ENC values: the key before and after a rotation, and a RADIUS secret that did not change. */
const OLD = "b2xkLW5vdC1yZWFsLWtleQ==", NEW = "bmV3LW5vdC1yZWFsLWtleQ==", RAD = "cmFkaXVzLW5vdC1yZWFs"; // never in a link
/** A pre-shared key rotated, a RADIUS secret kept, with BEFORE: and AFTER: labels. */
const ROTATE = `BEFORE:
config vpn ipsec phase1-interface
    edit "hq"
        set psksecret ENC ${OLD}
    next
end
config user radius
    edit "nps"
        set server "10.0.0.20"
        set secret ENC ${RAD}
    next
end
AFTER:
config vpn ipsec phase1-interface
    edit "hq"
        set psksecret ENC ${NEW}
    next
end
config user radius
    edit "nps"
        set server "10.0.0.20"
        set secret ENC ${RAD}
    next
end`; // as pasted
/** Its copy: the two keys differ (1, 2), the RADIUS secret is one value on both sides (3). */
const ROTATE_COPY = `BEFORE:
config vpn ipsec phase1-interface
    edit "hq"
        set psksecret ENC [redacted-1]
    next
end
config user radius
    edit "nps"
        set server "10.0.0.20"
        set secret ENC [redacted-2]
    next
end
AFTER:
config vpn ipsec phase1-interface
    edit "hq"
        set psksecret ENC [redacted-3]
    next
end
config user radius
    edit "nps"
        set server "10.0.0.20"
        set secret ENC [redacted-2]
    next
end`; // what the link carries

/** The cases. */
export const FORTIOS_CONFIG_DIFF_EXPLAINER_SHARE_CASES = defineShareCases<FortiosDiffShareState, FortiosDiffShareState>({
  spec: FORTIOS_CONFIG_DIFF_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // nothing to replace: as pasted
    { id: "rotated-key", state: { input: ROTATE }, params: { input: ROTATE_COPY }, restored: { input: ROTATE_COPY }, mustNotContain: [OLD, NEW, RAD] }, // the change still reads as a change
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "one-side", state: { input: "config firewall policy\n    edit 1\n        set action accept\n    next\nend" } }, // no second side: the page asks for one
  ],
  blocked: [
    { id: "pem-key", state: { input: `config vpn certificate local\n    edit "c"\n        set private-key "-----BEGIN PRIVATE KEY-----\nMIGEAgEAMBAGByqGSM49AgEGBSuBBAAKBG0wawIBAQQgVcB/UNPxalR9zDYAjQIf\n-----END PRIVATE KEY-----"\n    next\nend\n---\nconfig vpn certificate local\nend` }, code: "secret" }, // RFC 7468 section 10's key, cut: cannot be replaced on one line
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: "\n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: `config user radius\n    edit "nps"\n        set secret ENC ${RAD}\n    next\nend\n---\nconfig user radius\nend` } }, // an ENC value: never in a link
  ],
});
