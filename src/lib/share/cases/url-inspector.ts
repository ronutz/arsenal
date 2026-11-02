// ============================================================================
// src/lib/share/cases/url-inspector.ts
// ----------------------------------------------------------------------------
// Share cases of the URL inspector: the URL goes as a copy with the userinfo's
// password and every secret parameter replaced by REDACTED (the tool's own
// share vectors pin the copy and that the receiving page reads the same
// parts). The link is the #input= handoff usePrefill reads, so the runner's
// readHandoff check applies to every accept case. A URL still holding a secret
// no rule can name gets no link.
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { URL_INSPECTOR_SHARE, type UrlInspectorShareState } from "../../tools/url-inspector/share"; // the spec and its state
import { SHARE_VECTORS } from "../../tools/url-inspector/golden-vectors"; // the tool's own share vectors

/** The cases. */
export const URL_INSPECTOR_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<UrlInspectorShareState, UrlInspectorShareState>>({ // typed, so the cases check as one list
  spec: URL_INSPECTOR_SHARE, // the spec
  accept: SHARE_VECTORS.filter((v) => v.expect !== null).map((v) => ({ id: v.id, state: { input: v.input }, params: { input: v.expect! }, restored: { input: v.expect! }, mustNotContain: v.secrets })), // each copy, never a credential
  empty: [ // nothing to share
    { id: "nothing", state: { input: "" } }, // after Clear
    { id: "blank", state: { input: "   " } }, // blanks only
  ],
  blocked: SHARE_VECTORS.filter((v) => v.residual !== undefined).map((v) => ({ id: v.id, state: { input: v.input }, code: "secret" })), // a secret no rule can name
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing (readHandoff hands nothing over either)
    { id: "absent", values: { input: null } }, // not there
  ],
}));
