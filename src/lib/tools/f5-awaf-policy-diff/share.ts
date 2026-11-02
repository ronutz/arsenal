// ============================================================================
// src/lib/tools/f5-awaf-policy-diff/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 Advanced WAF policy diff (posture
// "input-caution", raised from "input" on 2026-10-27): a link carries both
// policies as pasted, "before" and "after", once the page has compared them.
// The page has two boxes of equal rank, so the link names each by its
// field, as the reader knows it (ROLLOUT section 1, rule 3), and carries no
// "input": calling one of the two policies the input would misname it.
// Like the declarative-policy explainer's (manifest: a WAF policy "can carry
// internal hostnames, URLs, parameter and cookie names, IPs, and file
// paths"), the popover adds a caution line, and the AWAF policy secrets check
// reads both boxes first: a credential blocks the link (the popover names the
// box and the line), a secret-looking name or a webhook URL is named in the
// caution line instead.
//
// Arrival: both boxes fill as a paste would, and the page compares them as
// usual. Both must be non-blank; anything else is ignored.
// ============================================================================

import { diffPolicies } from "./compute"; // the page's own comparison
import { checkAwafPolicyText } from "../f5-awaf-declarative-policy-explainer/share"; // the AWAF policy secrets check (with the webhook rule)
import { blockedBySecret, type ShareSecretFinding } from "../../share/text-secrets"; // the family's blocked encoding
import { MAX_SHARE_CHARS } from "../../share/format"; // the link bound
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the two boxes (as pasted when encoding, as the link carries them on arrival). */
export interface PolicyDiffShareState {
  /** The policy before the change. */
  before: string;
  /** The policy after it. */
  after: string;
}

/** What the check found in both boxes, field by field. */
export interface PolicyDiffSecrets {
  /** Credentials, each tagged with its box ("before" or "after"). */
  secrets: (ShareSecretFinding & { field: string })[];
  /** Secret-looking names and webhook URLs, tagged the same way. */
  maybe: (ShareSecretFinding & { field: string })[];
}

/**
 * The AWAF policy secrets check over both boxes (none is read when together they are over the link bound).
 * @param s the two boxes
 * @returns the findings of both, "before" first
 */
export function checkPolicyDiffText(s: PolicyDiffShareState): PolicyDiffSecrets {
  if (s.before.length + s.after.length > MAX_SHARE_CHARS) return { secrets: [], maybe: [] }; // no link can carry them: not read
  const out: PolicyDiffSecrets = { secrets: [], maybe: [] }; // the findings
  for (const [field, text] of [["before", s.before], ["after", s.after]] as const) { // in reading order
    const r = checkAwafPolicyText(text); // this box
    out.secrets.push(...r.secrets.map((f) => ({ ...f, field }))); // tagged
    out.maybe.push(...r.maybe.map((f) => ({ ...f, field }))); // tagged
  } // for
  return out; // done
} // checkPolicyDiffText

/**
 * Whether the page has a comparison to share: both boxes parse as JSON and diffPolicies reads them as policies.
 * @param s the two boxes
 * @returns true when there is a comparison
 */
export function policyDiffHasResult(s: PolicyDiffShareState): boolean {
  if (s.before.trim() === "" || s.after.trim() === "") return false; // one box is blank
  try { return diffPolicies(JSON.parse(s.before), JSON.parse(s.after)) !== null; } catch { return false; } // not JSON: the page shows its error, nothing to share
} // policyDiffHasResult

/**
 * Encode from what the page already computed (whether it compared them, and the check's findings).
 * @param s the two boxes
 * @param compared whether the page has a comparison
 * @param found the check's findings on both boxes
 * @returns both boxes, nothing, or blocked
 */
export function encodePolicyDiffShare(s: PolicyDiffShareState, compared: boolean, found: PolicyDiffSecrets): ShareEncoding {
  if (!compared) return { ok: false, reason: "empty" }; // nothing compared yet
  return blockedBySecret(found.secrets) ?? { ok: true, params: { before: s.before, after: s.after } }; // blocked, or both as pasted
} // encodePolicyDiffShare

/** The spec. */
export const POLICY_DIFF_SHARE: ShareSpec<PolicyDiffShareState> = Object.freeze({
  tool: "f5-awaf-policy-diff", // the slug
  posture: "input-caution", // both boxes as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.f5-awaf-policy-diff.share.carries
  names: ["before", "after"], // the two boxes by name: no "input" (two pastes of equal rank)
  /** Both boxes, nothing, or blocked (the spec compares and checks them itself). */
  encode(s: PolicyDiffShareState): ShareEncoding {
    return encodePolicyDiffShare(s, policyDiffHasResult(s), checkPolicyDiffText(s)); // compared, checked, then encoded
  },
  /** Both boxes, each non-blank text as a paste would be; one missing is malformed. */
  decode(v: Readonly<Record<string, string | null>>): PolicyDiffShareState | null {
    if (!v.before || v.before.trim() === "" || !v.after || v.after.trim() === "") return null; // a share carries both
    return { before: v.before, after: v.after }; // the two boxes
  },
});
