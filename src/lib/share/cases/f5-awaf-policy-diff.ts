// ============================================================================
// src/lib/share/cases/f5-awaf-policy-diff.ts
// ----------------------------------------------------------------------------
// Share cases of the AWAF policy diff: both policies go as pasted, by name
// ("before", "after"), once the page has compared them; a credential in
// either blocks the link; a share that lacks one of the two is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { POLICY_DIFF_SHARE, type PolicyDiffShareState } from "../../tools/f5-awaf-policy-diff/share"; // the spec

/** The page's Example: blocking to transparent, Data Guard off, a URL added. */
const BEFORE = JSON.stringify({ policy: { enforcementMode: "blocking", "data-guard": { enabled: true }, urls: [{ name: "/app" }] } }, null, 2); // as the component builds it
/** The page's Example, after. */
const AFTER = JSON.stringify({ policy: { enforcementMode: "transparent", "data-guard": { enabled: false }, urls: [{ name: "/app" }, { name: "/reports" }] } }, null, 2); // as the component builds it
/** RFC 6265 section 4.2.1's session identifier, standing in for a live one. */
const SID = "31d4d96e407aad42"; // never in a link

/** The cases. */
export const F5_AWAF_POLICY_DIFF_SHARE_CASES = defineShareCases<PolicyDiffShareState, PolicyDiffShareState>({
  spec: POLICY_DIFF_SHARE, // the spec
  accept: [
    { id: "example", state: { before: BEFORE, after: AFTER }, params: { before: BEFORE, after: AFTER }, restored: { before: BEFORE, after: AFTER } }, // both as pasted
    { id: "bare-policies", state: { before: '{"enforcementMode":"blocking"}', after: '{"enforcementMode":"blocking","urls":[{"name":"*"}]}' }, params: { before: '{"enforcementMode":"blocking"}', after: '{"enforcementMode":"blocking","urls":[{"name":"*"}]}' }, restored: { before: '{"enforcementMode":"blocking"}', after: '{"enforcementMode":"blocking","urls":[{"name":"*"}]}' } }, // unwrapped policies, a wildcard added
  ],
  empty: [
    { id: "after-blank", state: { before: BEFORE, after: " " } }, // one box empty
    { id: "parse-error", state: { before: BEFORE, after: '{ "policy": ' } }, // the page shows its error
    { id: "not-objects", state: { before: "[]", after: "[]" } }, // JSON, but no policy to compare
  ],
  blocked: [
    { id: "cookie-in-after", state: { before: BEFORE, after: JSON.stringify({ policy: { enforcementMode: "transparent", description: `Cookie: SID=${SID}` } }) }, code: "secret" }, // RFC 6265 4.2.1
  ],
  reject: [
    { id: "after-missing", values: { before: BEFORE, after: null } }, // a share carries both
    { id: "before-blank", values: { before: "  ", after: AFTER } }, // a blank box
    { id: "both-missing", values: { before: null, after: null } }, // nothing
  ],
});
