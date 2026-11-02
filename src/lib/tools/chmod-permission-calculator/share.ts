// ============================================================================
// src/lib/tools/chmod-permission-calculator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the chmod permission calculator (posture
// "input": a mode names nothing of the reader's). A link carries every field
// the reading depends on, once the page has read the mode: the mode as typed
// (octal, an ls string or chmod clauses), whether it is a file or a directory
// (always written: a form carries every field), and the base mode and umask
// for clauses when they are filled in (left blank, each means its default,
// which the page applies, so a blank field needs no value in the link).
//
// Arrival: the four fields fill as the reader would type them and the page
// reads the mode. A blank mode, an unknown kind or a field longer than the
// page's own field (64 characters) makes the whole share malformed; a mode
// the page refuses shows its error, as for a paste.
// ============================================================================

import { run, type Kind } from "./compute"; // the page's own engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The longest value each of the page's fields takes (its maxLength). */
const FIELD_MAX = 64; // characters

/** The state: the four fields. */
export interface ChmodShareState {
  /** The mode as typed. */
  input: string;
  /** File or directory. */
  kind: Kind;
  /** The base mode for clauses ("" for the kind's default). */
  base: string;
  /** The umask for clauses with no class ("" for 022). */
  umask: string;
}

/**
 * Encode from a reading the page already made.
 * @param s the state
 * @param read whether the page read the mode
 * @returns the fields, or nothing
 */
export function encodeChmodShare(s: ChmodShareState, read: boolean): ShareEncoding {
  if (s.input.trim() === "" || !read) return { ok: false, reason: "empty" }; // no reading: nothing to share
  return { ok: true, params: { input: s.input, kind: s.kind, base: s.base, umask: s.umask } }; // blank fields carry nothing (the link format leaves them out)
} // encodeChmodShare

/** The spec. */
export const CHMOD_SHARE: ShareSpec<ChmodShareState> = Object.freeze({
  tool: "chmod-permission-calculator", // the slug
  posture: "input", // a mode
  carriesKey: "share.carries", // tools.chmod-permission-calculator.share.carries
  names: ["input", "kind", "base", "umask"], // the mode first
  /** The fields, or nothing (the spec reads the mode itself, as the page does). */
  encode(s: ChmodShareState): ShareEncoding {
    return encodeChmodShare(s, run({ mode: s.input, kind: s.kind, base: s.base || undefined, umask: s.umask || undefined }).ok); // read, then encoded
  },
  /** A non-blank mode, a known kind, and fields no longer than the page's own. */
  decode(v: Readonly<Record<string, string | null>>): ChmodShareState | null {
    if (!v.input || v.input.trim() === "" || v.input.length > FIELD_MAX) return null; // a mode the field could hold
    if (v.kind !== "file" && v.kind !== "directory") return null; // an unknown kind
    const base = v.base ?? ""; // absent: the kind's default
    const umask = v.umask ?? ""; // absent: 022
    if (base.length > FIELD_MAX || umask.length > FIELD_MAX) return null; // longer than the fields
    return { input: v.input, kind: v.kind, base, umask }; // the four fields
  },
});
