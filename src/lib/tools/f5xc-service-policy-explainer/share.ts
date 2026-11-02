// ============================================================================
// src/lib/tools/f5xc-service-policy-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC service policy explainer (posture
// "input-caution", as the inventory gives it; the manifest: "a policy can
// carry internal hostnames, IP prefixes, ASNs, header/cookie names"). A link
// carries the policy as pasted, once the page recognises it, with a caution
// line. The page renders every matcher with its values, so nothing can be
// cut out without changing the reading: a value that is a credential blocks
// the link instead (2026-11-01, wave 4B). The check is the site's
// (src/lib/share/text-secrets.ts) with the F5 XC findings
// (f5xc-object-linter/xc-share-secrets.ts): an Authorization or
// Proxy-Authorization header matcher with a literal value (RFC 9110 sections
// 11.6.2 and 11.7.2: the value "consists of credentials") blocks, as do a
// private key, a JWT, a password in a URL and a SecretType secret; a cookie
// matcher, a Cookie header matcher, or a header, query or argument matcher
// whose name looks secret, with a literal value, is named in the caution line
// instead (a static API key allowed by a header matcher is the common case).
//
// Arrival: the box fills as a paste would and the page reads it (decode-only,
// never evaluated). Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import { parseServicePolicy } from "./compute"; // the page's own parser
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check: the encoding of a checked box
import { checkXcBox } from "../f5xc-object-linter/xc-share-secrets"; // the site's check with the F5 XC findings
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface ServicePolicyShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Whether the page shows a reading for a box (as the component decides).
 * @param input the box
 * @returns true when the policy is recognised
 */
export function servicePolicyHasReading(input: string): boolean {
  return input.trim().length > 0 && parseServicePolicy(input).recognized; // the component's `show`
} // servicePolicyHasReading

/**
 * Encode from what the page already computed (whether it shows a reading, and the check's report).
 * @param s the state
 * @param shown true when the page shows a reading
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeServicePolicyShare(s: ServicePolicyShareState, shown: boolean, report: ShareSecretReport): ShareEncoding {
  if (!shown) return { ok: false, reason: "empty" }; // no reading: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as pasted
} // encodeServicePolicyShare

/** The spec. */
export const SERVICE_POLICY_SHARE: ShareSpec<ServicePolicyShareState> = Object.freeze({
  tool: "f5xc-service-policy-explainer", // the slug
  posture: "input-caution", // the policy as pasted, with a caution line, after the check
  carriesKey: "share.carries", // tools.f5xc-service-policy-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec reads and checks the box itself). */
  encode(s: ServicePolicyShareState): ShareEncoding {
    const shown = servicePolicyHasReading(s.input); // a reading shows
    return encodeServicePolicyShare(s, shown, shown ? checkXcBox(s.input) : { secrets: [], maybe: [], skipped: false }); // read, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ServicePolicyShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
