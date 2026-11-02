// ============================================================================
// src/lib/share/cases/fortigate-ipsec-phase-mismatch-analyzer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate IPsec phase mismatch analyzer (input-caution): the box goes
// as pasted once two peers are read; a pre-shared key, on a phase1 line or
// in a pasted phase1-interface block, blocks the link; one peer has nothing
// to share.
// The secrets are invented for these cases (the ENC value is base64 for "this
// is not a real secret") or published examples (RFC 7617 section 2).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_IPSEC_PHASE_SHARE, type IpsecShareState } from "../../tools/fortigate-ipsec-phase-mismatch-analyzer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "peer: name=SiteA\nphase1: version=ikev2, encryption=aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=86400\nphase2: encryption=aes256, hash=sha256, pfs=enable, dhgroup=14, lifetime=43200, src=10.1.0.0/16, dst=10.2.0.0/16\n\npeer: name=SiteB\nphase1: version=ikev2, encryption=aes128 aes256, hash=sha256, dhgroup=14, auth=psk, lifetime=28800\nphase2: encryption=aes256, hash=sha256, pfs=disable, lifetime=43200, src=10.2.0.0/16, dst=10.1.0.0/16"; // as the component holds it

/** The cases. */
export const FORTIGATE_IPSEC_PHASE_MISMATCH_ANALYZER_SHARE_CASES = defineShareCases<IpsecShareState, IpsecShareState>({
  spec: FORTIGATE_IPSEC_PHASE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "selector-mismatch-crlf", state: { input: "peer: name=HQ\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.1.0.0/16, dst=10.2.0.0/24\r\n\r\npeer: name=Branch\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.2.0.0/16, dst=10.1.0.0/16" }, params: { input: "peer: name=HQ\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.1.0.0/16, dst=10.2.0.0/24\r\n\r\npeer: name=Branch\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.2.0.0/16, dst=10.1.0.0/16" }, restored: { input: "peer: name=HQ\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.1.0.0/16, dst=10.2.0.0/24\r\n\r\npeer: name=Branch\r\nphase1: version=ikev2, auth=psk\r\nphase2: src=10.2.0.0/16, dst=10.1.0.0/16" } }, // a selector mismatch, CR LF kept
    { id: "maybe-secret-name", state: { input: "peer: name=HQ\nphase1: version=ikev2, auth=psk\npeer: name=Branch\nphase1: version=ikev2, auth=psk\n# vpn_password=see-the-vault" }, params: { input: "peer: name=HQ\nphase1: version=ikev2, auth=psk\npeer: name=Branch\nphase1: version=ikev2, auth=psk\n# vpn_password=see-the-vault" }, restored: { input: "peer: name=HQ\nphase1: version=ikev2, auth=psk\npeer: name=Branch\nphase1: version=ikev2, auth=psk\n# vpn_password=see-the-vault" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "one-peer", state: { input: "peer: name=SiteA\nphase1: version=ikev2, auth=psk" } }, // two peers are needed
  ],
  blocked: [
    { id: "psk-on-phase1-line", state: { input: "peer: name=HQ\nphase1: version=ikev2, auth=psk, psksecret=not-a-real-psk\npeer: name=Branch\nphase1: version=ikev2, auth=psk" }, code: "secret" }, // psksecret= on a directive line (CLI reference: psksecret, type password-3)
    { id: "phase1-interface-block", state: { input: "peer: name=HQ\nphase1: version=ikev2\npeer: name=Branch\nphase1: version=ikev2\nconfig vpn ipsec phase1-interface\n    edit \"hq\"\n        set psksecret ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==\n    next\nend" }, code: "secret" }, // an ENC pre-shared key in a pasted block
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-psk", values: { input: "peer: name=A\npeer: name=B\nphase1: psksecret=not-a-real-psk" } }, // a pre-shared key: never in a link
  ],
});
