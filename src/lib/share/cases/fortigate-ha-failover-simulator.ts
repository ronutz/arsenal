// ============================================================================
// src/lib/share/cases/fortigate-ha-failover-simulator.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiGate FGCP HA election simulator (input-caution): the box goes as
// pasted once two members are read; a cluster password or an ENC value in a
// pasted config system ha block blocks the link; a secret-looking name is
// only named; one member, or none, has nothing to share.
// The secrets are invented for these cases (the ENC value is base64 for "this
// is not a real secret") or published examples (RFC 7617 section 2).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIGATE_HA_FAILOVER_SHARE, type HaShareState } from "../../tools/fortigate-ha-failover-simulator/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "override: disable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0"; // as the component holds it

/** The cases. */
export const FORTIGATE_HA_FAILOVER_SIMULATOR_SHARE_CASES = defineShareCases<HaShareState, HaShareState>({
  spec: FORTIGATE_HA_FAILOVER_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "override-enabled-three-units", state: { input: "override: enable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\nmember: name=FGT-C, serial=FG100C, priority=100, age=9000, failed=1" }, params: { input: "override: enable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\nmember: name=FGT-C, serial=FG100C, priority=100, age=9000, failed=1" }, restored: { input: "override: enable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\nmember: name=FGT-C, serial=FG100C, priority=100, age=9000, failed=1" } }, // override on, a third unit with a failed monitored interface
    { id: "maybe-token-name", state: { input: "override: disable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\n# api_token=lab-note-only" }, params: { input: "override: disable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\n# api_token=lab-note-only" }, restored: { input: "override: disable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\n# api_token=lab-note-only" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "one-member", state: { input: "member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0" } }, // no election to run
  ],
  blocked: [
    { id: "ha-password-enc", state: { input: "override: disable\nmember: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\nconfig system ha\n    set group-name \"lab\"\n    set password ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==\nend" }, code: "secret" }, // the cluster password as FortiOS writes it (CLI reference: password, type password; PSIRT FG-IR-19-007)
    { id: "ha-password-plain", state: { input: "member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0\nmember: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0\nset password not-a-real-password" }, code: "secret" }, // a cluster password typed in clear
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "still-enc", values: { input: "member: name=A\nmember: name=B\nset password ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==" } }, // a credential: never in a link
  ],
});
