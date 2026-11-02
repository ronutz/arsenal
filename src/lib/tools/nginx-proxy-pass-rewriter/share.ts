// ============================================================================
// src/lib/tools/nginx-proxy-pass-rewriter/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the NGINX proxy_pass rewriter (posture
// "input-caution", raised on 2026-11-01 from the inventory's "input": the
// proxy_pass value names a backend, a host name or an address that is
// usually internal, and the page shows it back in the flipped counterpart).
// A link carries the box as typed (a location, a proxy_pass and a request
// line), once the page has a result, with a caution line. The page shows the
// proxy_pass value whole, so nothing can be cut out without changing the
// reading: the site's check (src/lib/share/text-secrets.ts) reads the box
// first, and a credential (a password in the upstream's URL, RFC 3986
// section 3.2.1; a JWT in the request) blocks the link and names its line,
// while a secret-looking name with a value (a `token=` argument) is named in
// the caution line instead (wave 4B).
//
// Arrival: the box fills as a paste would and the page computes the path
// (the upstream is never resolved or contacted). Any non-blank text is
// accepted, exactly as a paste is.
// ============================================================================

import { rewriteProxyPass } from "./compute"; // the page's own rewriter (it throws on a malformed case)
import { encodeCheckedBox, findShareSecrets, type ShareSecretReport } from "../../share/text-secrets"; // the site's share check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface ProxyPassShareState {
  /** The box as typed. */
  input: string;
}

/**
 * Whether the page shows a result for a box (it parses).
 * @param input the box
 * @returns true when the page shows the backend path
 */
export function proxyPassHasResult(input: string): boolean {
  if (input.trim() === "") return false; // nothing typed
  try { rewriteProxyPass(input.trim()); return true; } catch { return false; } // a parse error shows instead
} // proxyPassHasResult

/**
 * Encode from what the page already computed (whether it shows a result, and the check's report).
 * @param s the state
 * @param computed true when the page shows a result
 * @param report the check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeProxyPassShare(s: ProxyPassShareState, computed: boolean, report: ShareSecretReport): ShareEncoding {
  if (!computed) return { ok: false, reason: "empty" }; // no result: nothing to share
  return encodeCheckedBox(s.input, report); // blocked by a credential, or the box as typed
} // encodeProxyPassShare

/** The spec. */
export const PROXY_PASS_SHARE: ShareSpec<ProxyPassShareState> = Object.freeze({
  tool: "nginx-proxy-pass-rewriter", // the slug
  posture: "input-caution", // the box as typed, with a caution line, after the check
  carriesKey: "share.carries", // tools.nginx-proxy-pass-rewriter.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec computes and checks the box itself). */
  encode(s: ProxyPassShareState): ShareEncoding {
    const computed = proxyPassHasResult(s.input); // the page's result
    return encodeProxyPassShare(s, computed, computed ? findShareSecrets(s.input) : { secrets: [], maybe: [], skipped: false }); // computed, checked, encoded
  },
  /** Any non-blank text: the page computes it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): ProxyPassShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
