// ============================================================================
// src/lib/tools/pkce/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the PKCE tool (posture "input-caution", the
// inventory's, with every real verifier blocked). The tool's one input is a
// code_verifier, and RFC 7636 makes it the secret of the flow: section 1 calls
// it a "cryptographically random key" that works against an intercepted
// authorization code "since the attacker would not know this one-time key",
// section 4.1 a "high-entropy cryptographic random STRING", and section 7.1
// rests the protocol's security on the verifier not being "learned or guessed
// by the attacker". Nothing derived can stand in for it: the page
// computes everything from the verifier itself, so leaving it out would leave
// no result at all. So no link carries a verifier (blocked "verifier"), with
// one exception: RFC 7636 Appendix B's published example
// (dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk), the page's own Example, which
// is a test value printed in the standard, not anyone's secret.
//
// Arrival: only that example is accepted; it fills the box and the page
// derives its challenges as a paste would (Web Crypto, in the browser). Any
// other value is malformed: ignored, and stripped from the address either way,
// so a link carrying a real verifier never fills anyone's page.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** RFC 7636 Appendix B's example code_verifier: the only verifier a link may carry. */
export const PKCE_PUBLISHED_VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // printed in the RFC; the page's Example

/** What the page encodes: the box, and whether the page derived a result from it. */
export interface PkceShareInput {
  /** The verifier box as typed. */
  verifier: string;
  /** True when the page shows a result for it. */
  hasResult: boolean;
}

/** What an arrival restores. */
export interface PkceShareState {
  /** The verifier (always the published example). */
  verifier: string;
}

/** The spec. */
export const PKCE_SHARE: ShareSpec<PkceShareInput, PkceShareState> = Object.freeze({
  tool: "pkce", // the slug
  posture: "input-caution", // the input as typed, but only RFC 7636's own example: every real verifier is blocked
  carriesKey: "share.carries", // tools.pkce.share.carries
  names: ["input"], // #input=<the published example>
  /** The published example as typed; any other verifier is blocked. */
  encode(s: PkceShareInput): ShareEncoding {
    if (!s.hasResult || s.verifier === "") return { ok: false, reason: "empty" } as const; // nothing derived yet
    if (s.verifier !== PKCE_PUBLISHED_VERIFIER) return { ok: false, reason: "blocked", code: "verifier" } as const; // a verifier is a secret
    return { ok: true, params: { input: s.verifier } } as const; // the RFC's example
  },
  /** Only the published example. */
  decode(v: Readonly<Record<string, string | null>>): PkceShareState | null {
    return v.input === PKCE_PUBLISHED_VERIFIER ? { verifier: v.input } : null; // anything else never fills the box
  },
});
