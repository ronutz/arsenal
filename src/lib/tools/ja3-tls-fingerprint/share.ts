// ============================================================================
// src/lib/tools/ja3-tls-fingerprint/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the JA3 / JA3N fingerprint. Posture "derived",
// raised on 2026-11-01 from the inventory's "input-caution" (manifest "manual").
//
// A JA3 string is five comma-separated fields of decimal numbers taken from a
// TLS ClientHello (version, ciphers, extensions, curves, point formats;
// Salesforce's JA3 specification, as the engine's header records): no name, no
// address, no token. But the engine reads only the numbers: in each field it
// skips any dash-separated piece that is not an integer, so a box can hold text
// the reading never uses (a word, a value pasted from a log line), and a link
// of the box as typed would carry it unseen. So the link carries the string as
// the engine reads it: each field's integer pieces as written (GREASE values
// included, since the page flags them), the version as written, every other
// piece and the surrounding blanks left out. The receiving page reads the same
// version, values, GREASE flags, hashes and permutation note. When the box holds
// nothing else (the common case) the copy is the box, trimmed.
// No caution line: the copy holds numbers only. No reveal switch: what it drops
// is what the reading ignores.
// Arrival: the copy fills the box and the page computes; nothing is sent.
// ============================================================================

import { computeJa3 } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface Ja3ShareState {
  /** The JA3 string (as typed when encoding; the copy after an arrival). */
  input: string;
}

/**
 * The JA3 string as the engine reads it: the five fields, each one's integer pieces as written, nothing else.
 * @param text the box as typed
 * @returns the copy, or null when the engine refuses the text (no reading, nothing to share)
 */
export function ja3ShareCopy(text: string): string | null {
  if (!computeJa3(text).ok) return null; // no reading
  const fields = text.trim().split(","); // the five fields (the engine's own split)
  const version = fields[0].trim(); // the version, as written (the engine requires an integer here)
  const rest = fields.slice(1).map((f) => f.split("-").map((p) => p.trim()).filter((p) => p !== "" && Number.isInteger(Number(p))).join("-")); // the integer pieces, as the engine keeps them
  return [version, ...rest].join(","); // the string as read
} // ja3ShareCopy

/** The spec. */
export const JA3_SHARE: ShareSpec<Ja3ShareState> = Object.freeze({
  tool: "ja3-tls-fingerprint", // the slug
  posture: "derived", // the string as the engine reads it, never the box as typed
  carriesKey: "share.carries", // tools.ja3-tls-fingerprint.share.carries
  names: ["input"], // #input=
  /** The copy of a string the engine reads; nothing otherwise. */
  encode(s: Ja3ShareState): ShareEncoding {
    const copy = ja3ShareCopy(s.input); // what the engine reads
    return copy === null ? { ok: false, reason: "empty" } : { ok: true, params: { input: copy } }; // nothing, or the copy
  },
  /** Only what the encoder builds: a string the engine reads and that is already its own copy. */
  decode(v: Readonly<Record<string, string | null>>): Ja3ShareState | null {
    if (!v.input) return null; // nothing
    return ja3ShareCopy(v.input) === v.input ? { input: v.input } : null; // the copy, or malformed
  },
});
