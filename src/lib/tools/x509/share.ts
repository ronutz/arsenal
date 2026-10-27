// ============================================================================
// src/lib/tools/x509/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the X.509 certificate decoder (posture
// "input"): a link carries the box as pasted. A certificate is public: a
// server sends it to every client. Its names may be internal ones, which the
// standard warning covers (anyone with the link can read it).
//
// One guard: the decoder reads the first CERTIFICATE block and ignores the
// rest, so a paste can hold a private key beside the certificate (a combined
// PEM file, say) without the page saying anything. No link is offered then
// (blocked, "private-key"), and the popover says to remove the key first.
// A private key is recognised by its PEM boundary, as RFC 7468 (sections 2,
// 3, 10, 11) and the traditional OpenSSL and OpenSSH forms write it: a
// "-----BEGIN ... PRIVATE KEY-----" line, the same rule code-to-image's
// secrets check applies.
//
// Arrival: this page already reads #input= with usePrefill (the handoff of
// src/lib/handoff.ts), and keeps it exactly as it was: the link IS that
// handoff, so no second arrival hook is added (ROLLOUT.md section 5). Encode
// gives what usePrefill's apply takes, the box's text; decode mirrors what
// readHandoff accepts (any non-empty value), for the central harness.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/**
 * A PEM private-key boundary: RFC 7468's label grammar restricted to labels ending in PRIVATE KEY (PRIVATE KEY,
 * ENCRYPTED PRIVATE KEY, OpenSSL's traditional RSA/EC/DSA PRIVATE KEY, OpenSSH's OPENSSH PRIVATE KEY), and OpenPGP's
 * armour (RFC 4880 section 6.2: PGP PRIVATE KEY BLOCK; PGP 2.x wrote PGP SECRET KEY BLOCK). Labels read 2026-10-27.
 */
export const PEM_PRIVATE_KEY = /-----BEGIN (?:[A-Z0-9]+[ -])*(?:PRIVATE|SECRET) KEY(?: BLOCK)?-----/; // the separators make it linear

/** The state: the box. */
export interface X509ShareState {
  /** The box as pasted. */
  input: string;
}

/** The spec. */
export const X509_SHARE: ShareSpec<X509ShareState> = Object.freeze({
  tool: "x509", // the slug
  posture: "input", // the certificate as pasted
  carriesKey: "share.carries", // tools.x509.share.carries
  names: ["input"], // #input=, the handoff usePrefill reads
  /** The box, when it holds something and no private key. */
  encode(s: X509ShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    if (PEM_PRIVATE_KEY.test(s.input)) return { ok: false, reason: "blocked", code: "private-key" } as const; // never a key in a link
    return { ok: true, params: { input: s.input } } as const; // the one value
  },
  /** Any non-empty value, as readHandoff hands it to usePrefill. */
  decode(v: Readonly<Record<string, string | null>>): X509ShareState | null {
    return v.input ? { input: v.input } : null; // the value, or nothing
  },
});
