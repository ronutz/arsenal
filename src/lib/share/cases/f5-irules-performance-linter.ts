// ============================================================================
// src/lib/share/cases/f5-irules-performance-linter.ts
// ----------------------------------------------------------------------------
// Share cases of the iRules performance linter: the box goes as pasted; an
// iRule with a key or credential written out gets no link (the iRule secrets
// check, pinned rule by rule in the command/context explainer's cases).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { IRULES_PERFORMANCE_LINTER_SHARE, type IrulesPerformanceLinterShareState } from "../../tools/f5-irules-performance-linter/share"; // the spec and its state

/** The page's Example (F5IrulesPerformanceLinterTool's EXAMPLE). */
const EXAMPLE = `when RULE_INIT {
    set ::maxcpu 60
}
when HTTP_REQUEST {
    if { [matchclass [HTTP::uri] starts_with $::blocked] } {
        set n [expr $::maxcpu * 2]
    }
    if { [regexp {^/api/} [HTTP::path]] } { pool api_pool }
}`;

/** The cases. */
export const IRULES_PERFORMANCE_LINTER_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<IrulesPerformanceLinterShareState, IrulesPerformanceLinterShareState>>({ // typed, so the cases check as one list
  spec: IRULES_PERFORMANCE_LINTER_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the page's Example
    { id: "braced-regex", state: { input: "when HTTP_REQUEST {\n    if { [HTTP::uri] matches_regex {^/a+b?#[0-9]&x=1} } { drop }\n}" }, params: { input: "when HTTP_REQUEST {\n    if { [HTTP::uri] matches_regex {^/a+b?#[0-9]&x=1} } { drop }\n}" }, restored: { input: "when HTTP_REQUEST {\n    if { [HTTP::uri] matches_regex {^/a+b?#[0-9]&x=1} } { drop }\n}" } }, // "#", "&", "+" and "?" travel exactly
  ],
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // an empty box
  ],
  blocked: [ // a key or credential written out: no link
    { id: "cookie-passphrase", state: { input: `when HTTP_RESPONSE {\n    if { [HTTP::cookie exists session] } {\n        HTTP::cookie encrypt session {my pass phrase} 256\n    }\n}` }, code: "secret" }, // HTTP::cookie encrypt <name> <pass phrase>
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
}));
