// ============================================================================
// src/lib/tools/f5xc-object-linter/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC object linter (posture "derived",
// raised on 2026-11-01 from the inventory's "input-caution"). A pasted
// origin_pool, http_loadbalancer or app_firewall object can hold secrets the
// linter never reads: a certificate's private key (SecretType, in clear or
// blindfolded), the secret_value of a header or cookie a load balancer adds,
// and the plain values of those headers and cookies (XC API reference, read
// 2026-11-01; see xc-share-secrets.ts beside this file). The linter reads
// which settings are present and a few names and domains, never those
// values. So a link carries a COPY of the object, every SecretType secret
// and every plain added header or cookie value as [redacted]; the copy must
// lint the same, or there is no link (code "copy"); then the site's check
// (with the XC findings) reads the copy: a credential left in it blocks the
// link (code "secret"), a secret-looking name with a value is named in a
// maybe line.
//
// The reveal switch (THE REVEAL SWITCH, 01/11/2026): when the copy replaced
// only header or cookie values (no SecretType secret, no Authorization or
// secret-looking name among them) and the object as pasted passes the check,
// the popover may offer to include them; ticked, the link carries the object
// as pasted (posture input-caution, OBJECT_LINTER_SHARE_REVEALED).
//
// Arrival: the copy (or the object) fills the box as a paste would, and the
// page lints it.
// ============================================================================

import { lintObject, type LintResult } from "./compute"; // the page's own linter
import { blockedBySecret } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { xcObjectCopy, xcRevealable, type XcObjectCopy } from "./xc-share-secrets"; // the F5 XC copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding; the copy or the paste on arrival). */
export interface ObjectLinterShareState {
  /** The box. */
  input: string;
}

/** The copy of an object: the copy and its check, and two decisions about it. */
export interface LinterShareCopy {
  /** The copy and its check (or no copy). */
  copy: XcObjectCopy;
  /** True when the copy lints as the paste does. */
  readsSame: boolean;
  /** True when the popover may offer its reveal switch. */
  revealable: boolean;
}

/**
 * The page's reading of a box, or null when it has none to share (blank, not JSON, or not an XC object it knows).
 * @param input the box
 * @returns the reading, or null
 */
export function linterReading(input: string): LintResult | null {
  if (input.trim() === "") return null; // nothing pasted
  const r = lintObject(input); // as the page lints it
  return r.recognized ? r : null; // a known object, or nothing
} // linterReading

/**
 * Make the copy of an object and check it (the page calls this once per change, with its own reading).
 * @param input the box as pasted
 * @param r the page's reading of the box
 * @returns the copy, its check, and the two decisions
 */
export function linterShareCopy(input: string, r: LintResult): LinterShareCopy {
  const copy = xcObjectCopy(input); // the copy and its check
  const readsSame = copy.ok && (copy.replaced === 0 || JSON.stringify(lintObject(copy.copy)) === JSON.stringify(r)); // linted again only when something changed
  return { copy, readsSame, revealable: readsSame && xcRevealable(input, copy) }; // checked
} // linterShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy and its checks (null while the page has no reading)
 * @returns the copy, nothing, or blocked
 */
export function encodeLinterShare(c: LinterShareCopy | null): ShareEncoding {
  if (!c) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (!c.copy.ok || !c.readsSame) return { ok: false, reason: "blocked", code: "copy" }; // no copy that lints the same
  return blockedBySecret(c.copy.report.secrets) ?? { ok: true, params: { input: c.copy.copy } }; // blocked, or the copy
} // encodeLinterShare

/**
 * The object as pasted, every value included: what the reveal switch carries (offered only when `revealable`).
 * @param input the box as pasted
 * @param c the copy and its checks
 * @returns the object as pasted, or nothing
 */
export function encodeLinterRevealed(input: string, c: LinterShareCopy | null): ShareEncoding {
  if (!c || !c.revealable) return { ok: false, reason: "empty" }; // not offered
  return { ok: true, params: { input } }; // as pasted
} // encodeLinterRevealed

/**
 * Decode the shared box: any non-blank text, as a paste.
 * @param v the values
 * @returns the state, or null
 */
function decodeLinter(v: Readonly<Record<string, string | null>>): ObjectLinterShareState | null {
  return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
} // decodeLinter

/** The spec. */
export const OBJECT_LINTER_SHARE: ShareSpec<ObjectLinterShareState> = Object.freeze({
  tool: "f5xc-object-linter", // the slug
  posture: "derived", // a copy with SecretType secrets and added header and cookie values replaced, never the paste
  carriesKey: "share.carries", // tools.f5xc-object-linter.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec lints, copies and checks itself). */
  encode(s: ObjectLinterShareState): ShareEncoding {
    const r = linterReading(s.input); // the reading
    return encodeLinterShare(r ? linterShareCopy(s.input, r) : null); // copied, checked, encoded
  },
  /** Any non-blank text: the page lints it as a paste. */
  decode: decodeLinter,
});

/** The spec of the reveal switch: the object as pasted (posture input-caution: the reader ticked it). */
export const OBJECT_LINTER_SHARE_REVEALED: ShareSpec<ObjectLinterShareState> = Object.freeze({
  tool: "f5xc-object-linter", // the slug
  posture: "input-caution", // the object as pasted, with the tool's caution, by the reader's explicit choice
  carriesKey: "share.carriesRevealed", // tools.f5xc-object-linter.share.carriesRevealed
  names: ["input"], // the same name: an arrival is the same paste either way
  /** The object as pasted, or nothing (offered only when the copy replaced header or cookie values alone). */
  encode(s: ObjectLinterShareState): ShareEncoding {
    const r = linterReading(s.input); // the reading
    return encodeLinterRevealed(s.input, r ? linterShareCopy(s.input, r) : null); // as pasted, or nothing
  },
  /** One decode rule for both. */
  decode: decodeLinter,
});
