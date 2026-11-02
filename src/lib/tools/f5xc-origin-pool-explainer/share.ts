// ============================================================================
// src/lib/tools/f5xc-origin-pool-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the F5 XC origin pool explainer (posture
// "derived", raised on 2026-11-01 from the inventory's "input-caution"). A
// pasted origin_pool can hold the private key of its mTLS client
// certificates (SecretType: "TLS Private Key data in unencrypted PEM format
// ... may be optionally secured using BlindFold", XC API reference for
// ves.io.schema.views.origin_pool, read 2026-11-01; see
// f5xc-object-linter/xc-share-secrets.ts). The page reads whether mTLS is on,
// never the key. So a link carries a COPY of the pool, every SecretType secret
// (clear_secret_info.url, blindfold_secret_info.location) as [redacted];
// the copy must read the same, or there is no link (code "copy"); then the
// site's check (with the XC findings) reads the copy: a credential left in it
// blocks the link (code "secret"), a secret-looking name with a value is
// named in a maybe line. No reveal switch: an origin pool holds no header or
// cookie values, and the secrets XC's schema defines are never revealed.
//
// Arrival: the copy fills the box as a paste would, and the page reads it.
// ============================================================================

import { explainOriginPool, type PoolView } from "./compute"; // the page's own reading
import { blockedBySecret } from "../../share/text-secrets"; // the site's share check: the blocked encoding
import { xcObjectCopy, type XcObjectCopy } from "../f5xc-object-linter/xc-share-secrets"; // the F5 XC copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding; the copy on arrival). */
export interface OriginPoolShareState {
  /** The box. */
  input: string;
}

/** The copy of a pool and whether it reads the same. */
export interface PoolShareCopy {
  /** The copy and its check (or no copy). */
  copy: XcObjectCopy;
  /** True when the copy reads as the paste does. */
  readsSame: boolean;
}

/**
 * The page's reading of a box, or null when it has none to share (blank, not JSON, or not a pool).
 * @param input the box
 * @returns the reading, or null
 */
export function poolReading(input: string): PoolView | null {
  if (input.trim() === "") return null; // nothing pasted
  const r = explainOriginPool(input); // as the page reads it
  return r.recognized ? r : null; // a pool, or nothing
} // poolReading

/**
 * Make the copy of a pool and check it (the page calls this once per change, with its own reading).
 * @param input the box as pasted
 * @param r the page's reading of the box
 * @returns the copy and whether it reads the same
 */
export function poolShareCopy(input: string, r: PoolView): PoolShareCopy {
  const copy = xcObjectCopy(input); // the copy and its check
  return { copy, readsSame: copy.ok && (copy.replaced === 0 || JSON.stringify(explainOriginPool(copy.copy)) === JSON.stringify(r)) }; // read again only when something changed
} // poolShareCopy

/**
 * The encoding of a copy the page already made.
 * @param c the copy (null while the page has no reading)
 * @returns the copy, nothing, or blocked
 */
export function encodePoolShare(c: PoolShareCopy | null): ShareEncoding {
  if (!c) return { ok: false, reason: "empty" }; // no reading: nothing to share
  if (!c.copy.ok || !c.readsSame) return { ok: false, reason: "blocked", code: "copy" }; // no copy that reads the same
  return blockedBySecret(c.copy.report.secrets) ?? { ok: true, params: { input: c.copy.copy } }; // blocked, or the copy
} // encodePoolShare

/** The spec. */
export const ORIGIN_POOL_SHARE: ShareSpec<OriginPoolShareState> = Object.freeze({
  tool: "f5xc-origin-pool-explainer", // the slug
  posture: "derived", // a copy with SecretType secrets replaced, never the paste
  carriesKey: "share.carries", // tools.f5xc-origin-pool-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec reads, copies and checks itself). */
  encode(s: OriginPoolShareState): ShareEncoding {
    const r = poolReading(s.input); // the reading
    return encodePoolShare(r ? poolShareCopy(s.input, r) : null); // copied, checked, encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): OriginPoolShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
