// ============================================================================
// src/lib/share/cases/fortigate-session-table-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate session table explainer (input-caution): the sessions go as
// pasted once one is read; a credential pasted with them blocks the link; a
// box without a session block has nothing to share.
// The secrets are invented for these cases (the ENC value is base64 for "this
// is not a real secret") or published examples (RFC 7617 section 2).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_SESSION_TABLE_SHARE, type SessionShareState } from "../../tools/fortigate-session-table-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "session info: proto=6 proto_state=02 duration=31 expire=10 timeout=3600 flags=00000000\nstate=log may_dirty\nstatistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0 tuples=2\norgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1\nhook=post dir=org act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)\nhook=pre dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)\nmisc=0 policy_id=7 auth_info=0 chk_client_info=0 vd=0"; // as the component holds it

/** The cases. */
export const FORTIGATE_SESSION_TABLE_EXPLAINER_SHARE_CASES = defineShareCases<SessionShareState, SessionShareState>({
  spec: FORTIGATE_SESSION_TABLE_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "healthy", state: { input: "session info: proto=6 proto_state=01 duration=125 expire=3590 timeout=3600 flags=00000000\nstate=log may_dirty ndr\nstatistic(bytes/packets/allow_err): org=1024/12/0 reply=8192/14/0 tuples=2\norgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1\nhook=post dir=org act=snat 192.168.1.10:52346->93.184.216.34:443(203.0.113.5:52346)\nmisc=0 policy_id=12 auth_info=0 chk_client_info=0 vd=0" }, params: { input: "session info: proto=6 proto_state=01 duration=125 expire=3590 timeout=3600 flags=00000000\nstate=log may_dirty ndr\nstatistic(bytes/packets/allow_err): org=1024/12/0 reply=8192/14/0 tuples=2\norgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1\nhook=post dir=org act=snat 192.168.1.10:52346->93.184.216.34:443(203.0.113.5:52346)\nmisc=0 policy_id=12 auth_info=0 chk_client_info=0 vd=0" }, restored: { input: "session info: proto=6 proto_state=01 duration=125 expire=3590 timeout=3600 flags=00000000\nstate=log may_dirty ndr\nstatistic(bytes/packets/allow_err): org=1024/12/0 reply=8192/14/0 tuples=2\norgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1\nhook=post dir=org act=snat 192.168.1.10:52346->93.184.216.34:443(203.0.113.5:52346)\nmisc=0 policy_id=12 auth_info=0 chk_client_info=0 vd=0" } }, // a healthy session (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "session info: proto=17 proto_state=00 duration=5 expire=175 timeout=180 flags=00000000\nstate=log\nmisc=0 policy_id=3 auth_info=0 chk_client_info=0 vd=0\n# session_token=redacted-by-hand" }, params: { input: "session info: proto=17 proto_state=00 duration=5 expire=175 timeout=180 flags=00000000\nstate=log\nmisc=0 policy_id=3 auth_info=0 chk_client_info=0 vd=0\n# session_token=redacted-by-hand" }, restored: { input: "session info: proto=17 proto_state=00 duration=5 expire=175 timeout=180 flags=00000000\nstate=log\nmisc=0 policy_id=3 auth_info=0 chk_client_info=0 vd=0\n# session_token=redacted-by-hand" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "no-session", state: { input: "state=log may_dirty" } }, // no session info: line
  ],
  blocked: [
    { id: "authorization-line", state: { input: "session info: proto=6 proto_state=01 duration=1 expire=3599 timeout=3600 flags=00000000\nmisc=0 policy_id=5 auth_info=0 chk_client_info=0 vd=0\nAuthorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==" }, code: "secret" }, // RFC 7617 section 2's example credentials in an Authorization line (RFC 9110 11.6.2)
    { id: "enc-value", state: { input: "session info: proto=6 proto_state=01 duration=1 expire=3599 timeout=3600 flags=00000000\nmisc=0 policy_id=5 auth_info=0 chk_client_info=0 vd=0\nset psksecret ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" }, code: "secret" }, // an ENC value pasted with the sessions
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: "session info: proto=6\nset passwd ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" } }, // a credential: never in a link
  ],
});
