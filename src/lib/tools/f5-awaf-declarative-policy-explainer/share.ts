// ============================================================================
// src/lib/tools/f5-awaf-declarative-policy-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 Advanced WAF declarative-policy
// explainer (posture "input-caution", raised from "input" on 2026-10-27): a
// link carries the policy as pasted, only once the page has read it as a
// policy. The manifest says a WAF policy "can carry internal hostnames, URLs,
// parameter and cookie names, IPs, and file paths", so the popover adds a
// caution line. F5's declarative policy schema (v17.1, read 2026-10-27)
// defines no property that holds a password or a key, but a policy can hold
// URLs (webhooks[].url, open-api-files[].link) and anything pasted with it,
// so before a link is offered the family's secrets check reads the box
// (src/lib/share/text-secrets.ts):
//   - a credential in a place a standard defines (a JWT, a password in a URL,
//     an Authorization or Cookie line ...) blocks the link (code "secret"),
//     and the popover names its line, so the reader replaces it first;
//   - a value whose name looks like a secret, and a webhook's URL (receivers
//     often put their token in it), are named in the caution line instead.
//
// Arrival: the box fills as a paste would, and the page reads it as it reads
// a paste. Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { parseAwafPolicy } from "./compute"; // the page's own reading
import { lineAt, findShareSecrets, encodeCheckedBox, type ShareSecretFinding, type ShareSecretReport } from "../../share/text-secrets"; // the family's secrets check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface AwafPolicyShareState {
  /** The box as pasted. */
  input: string;
}

/** Whether a value is a plain JSON object. */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v); // not null, not an array
} // isObject

/**
 * The AWAF policy rule this tool adds to the family's check: a webhook's URL (F5 declarative WAF schema v17.1:
 * webhooks[] has "url string"), named as a maybe-secret because a receiving service often puts its token in it.
 * It reads the box only when it parses as JSON; the policy may be wrapped in {"policy": ...} or bare.
 * @param norm the box with line feeds only
 * @returns one maybe finding per webhook with a URL, at the line of that URL (or of "webhooks")
 */
export function awafWebhookFindings(norm: string): ShareSecretFinding[] {
  let doc: unknown; // the parsed JSON
  try { doc = JSON.parse(norm); } catch { return []; } // not JSON: nothing to read here
  const policy = isObject(doc) && isObject(doc.policy) ? doc.policy : doc; // wrapped or bare
  if (!isObject(policy) || !Array.isArray(policy.webhooks)) return []; // no webhooks
  const out: ShareSecretFinding[] = []; // the findings
  const anchor = Math.max(0, norm.indexOf('"webhooks"')); // where the section starts (a fallback for the line)
  for (const w of policy.webhooks) { // each webhook
    if (!isObject(w) || typeof w.url !== "string" || w.url.trim() === "") continue; // no URL
    const at = norm.indexOf(JSON.stringify(w.url), anchor); // the URL as JSON writes it, after the section's start
    const start = at >= 0 ? at + 1 : anchor; // inside its quotes, or the section
    out.push({ rule: "webhook-url", kind: "maybe", line: lineAt(norm, start), label: "webhooks url", start, end: start + (at >= 0 ? w.url.length : 0) }); // named, never the URL
  } // for
  return out; // done
} // awafWebhookFindings

/**
 * The secrets check for a box holding an AWAF policy (the family's check, with the webhook rule).
 * @param input the box as pasted
 * @returns the report
 */
export function checkAwafPolicyText(input: string): ShareSecretReport {
  return findShareSecrets(input, awafWebhookFindings); // the family's rules and this one
} // checkAwafPolicyText

/**
 * Encode from what the page already computed (its reading and the check's report, made once per change).
 * @param s the state
 * @param recognized whether the page read the box as a WAF policy (only then is there a reading to share)
 * @param report the secrets check's report on the box
 * @returns the box, nothing (no reading), or blocked
 */
export function encodeAwafPolicyShare(s: AwafPolicyShareState, recognized: boolean, report: ShareSecretReport): ShareEncoding {
  if (!recognized) return { ok: false, reason: "empty" }; // no reading yet (blank, not JSON, not a policy)
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as pasted
} // encodeAwafPolicyShare

/** The spec. */
export const AWAF_POLICY_SHARE: ShareSpec<AwafPolicyShareState> = Object.freeze({
  tool: "f5-awaf-declarative-policy-explainer", // the slug
  posture: "input-caution", // the box as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.f5-awaf-declarative-policy-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: AwafPolicyShareState): ShareEncoding {
    return encodeAwafPolicyShare(s, parseAwafPolicy(s.input).recognized, checkAwafPolicyText(s.input)); // read, checked, then encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): AwafPolicyShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
