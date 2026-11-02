// ============================================================================
// src/lib/share/cases/zdx-score-factor-explainer.ts
// ----------------------------------------------------------------------------
// Share cases of the ZDX score factor explainer (input-caution): the box goes as pasted once
// the page reads it; a credential in a comment line blocks the link; a
// secret-looking name is only named; text the page refuses has nothing to
// share.
// The credentials are published examples (RFC 7519 section 3.1's JWT, AWS's
// AKIAIOSFODNN7EXAMPLE, RFC 6750 section 2.1's Bearer token) or invented ones.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ZDX_SCORE_FACTOR_SHARE, type ZdxShareState } from "../../tools/zdx-score-factor-explainer/share"; // the spec

/** The page's Example (verbatim from the component). */
const EXAMPLE = "# <metric> = <value>   (score 0-100; times in ms; percentages 0-100)\nscore = 28\npft = 850\ndns = 120\npath-loss = 4"; // as the component holds it

/** The cases. */
export const ZDX_SCORE_FACTOR_EXPLAINER_SHARE_CASES = defineShareCases<ZdxShareState, ZdxShareState>({
  spec: ZDX_SCORE_FACTOR_SHARE, // the spec
  accept: [
    { id: "example", state: { input: EXAMPLE }, params: { input: EXAMPLE }, restored: { input: EXAMPLE } }, // the Example, as pasted
    { id: "good-score", state: { input: "score = 72" }, params: { input: "score = 72" }, restored: { input: "score = 72" } }, // a Good score alone (golden vector, verbatim)
    { id: "maybe-secret-name", state: { input: "# zdx_token=see-the-portal\nscore = 50\nsrt = 300" }, params: { input: "# zdx_token=see-the-portal\nscore = 50\nsrt = 300" }, restored: { input: "# zdx_token=see-the-portal\nscore = 50\nsrt = 300" } }, // a secret-looking name in a comment: named, not blocked
  ],
  empty: [
    { id: "blank", state: { input: "" } }, // nothing pasted
    { id: "refused", state: { input: "score = 101" } }, // out of the documented range: the page's own error
  ],
  blocked: [
    { id: "jwt-in-comment", state: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nscore = 28" }, code: "secret" }, // RFC 7519 section 3.1's example JWT in a comment
    { id: "url-password-in-comment", state: { input: "# probe https://user:not-a-real-password@app.example.com/health\nscore = 40" }, code: "secret" }, // a password in a URL (RFC 3986 section 3.2.1)
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "blank", values: { input: " \n" } }, // white space
    { id: "absent", values: { input: null } }, // not there
    { id: "credential", values: { input: "# eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk\nscore = 28" } }, // a link this encoder never builds
  ],
});
