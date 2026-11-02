// ============================================================================
// src/lib/tools/p0f-signature-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the p0f signature explainer (posture "input", the
// inventory's, kept). A p0f v3 signature is eight colon-separated fields that
// describe a TCP SYN (p0f's docs/README grammar, which the engine follows):
// TTLs, option layouts, quirks, window sizes. It names no host, user or secret,
// and the engine refuses anything that is not eight fields, so the link
// carries `input`, the signature as typed (an optional "label = " in front is
// kept as typed too; the page reads only the signature side).
// Arrival: the box is filled as a paste would and the page decodes it.
// ============================================================================

import { analyzeP0f } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface P0fShareState {
  /** The signature, as typed. */
  input: string;
}

/** The spec. */
export const P0F_SHARE: ShareSpec<P0fShareState> = Object.freeze({
  tool: "p0f-signature-explainer", // the slug
  posture: "input", // the signature as typed
  carriesKey: "share.carries", // tools.p0f-signature-explainer.share.carries
  names: ["input"], // #input=
  /** The box, when the page decodes it; nothing otherwise (the button is disabled). */
  encode(s: P0fShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed
    try { analyzeP0f(s.input); } catch { return { ok: false, reason: "empty" }; } // no reading: nothing to share
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page decodes it as a paste, and says why when it cannot. */
  decode(v: Readonly<Record<string, string | null>>): P0fShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
