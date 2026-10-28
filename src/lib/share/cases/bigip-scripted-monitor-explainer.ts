// ============================================================================
// src/lib/share/cases/bigip-scripted-monitor-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the BIG-IP Scripted monitor explainer: both boxes go with
// every PASS and LOGIN password as the page's bullets (the tool's own share
// vectors pin the copy and that the receiving page reads the same result); a
// password written with escape sequences gets no link.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { SCRIPTED_MONITOR_SHARE, type ScriptedMonitorShareState } from "../../tools/bigip-scripted-monitor-explainer/share"; // the spec
import { EXAMPLE, SHARE_BLOCKED, SHARE_VECTORS } from "../../tools/bigip-scripted-monitor-explainer/golden-vectors"; // the tool's own vectors

/** A share vector by id. */
const sv = (id: string) => SHARE_VECTORS.find((v) => v.id === id)!; // pinned there
/** The params a vector's copy gives: the script, and the transcript when there is one. */
const params = (id: string): Record<string, string> => (sv(id).expect.transcript.trim() === "" ? { input: sv(id).expect.script } : { input: sv(id).expect.script, transcript: sv(id).expect.transcript }); // as encode builds them

/** The cases. */
export const BIGIP_SCRIPTED_MONITOR_SHARE_CASES = defineShareCases<ScriptedMonitorShareState, ScriptedMonitorShareState>({
  spec: SCRIPTED_MONITOR_SHARE, // the spec
  accept: [
    { id: "example", state: EXAMPLE, params: { input: EXAMPLE.script, transcript: EXAMPLE.transcript }, restored: EXAMPLE }, // F5's SMTP script and an RFC 5321 session: nothing to replace
    ...["share-pop3-pass", "share-imap-login", "share-transcript-only"].map((id) => ({ id, state: sv(id).input, params: params(id), restored: sv(id).expect, mustNotContain: sv(id).secrets })), // the passwords never travel
    { id: "script-alone", state: sv("share-unquoted-pass").input, params: params("share-unquoted-pass"), restored: { script: sv("share-unquoted-pass").expect.script, transcript: "" }, mustNotContain: sv("share-unquoted-pass").secrets }, // no transcript: no "transcript" value
  ],
  arrive: [
    { id: "no-transcript", values: { input: "expect 220\n", transcript: null }, restored: { script: "expect 220\n", transcript: "" } }, // an absent transcript is an empty one
  ],
  empty: [
    { id: "nothing", state: { script: "", transcript: "" } }, // no script
    { id: "transcript-alone", state: { script: "  \n", transcript: "S: 220 ready\n" } }, // a transcript without a script
  ],
  blocked: SHARE_BLOCKED.map((b) => ({ id: b.id, state: b.input, code: "escaped" })), // a password written with escapes
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null, transcript: "S: 220 ready\n" } }, // a transcript without a script
    { id: "blank", values: { input: " \n " } }, // white space
  ],
});
