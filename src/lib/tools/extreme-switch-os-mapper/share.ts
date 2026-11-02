// ============================================================================
// src/lib/tools/extreme-switch-os-mapper/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Extreme switch OS-name mapper (posture
// "input", the inventory's, kept). The box takes a model series ("5520",
// "X440-G2") or an OS name ("VOSS", "Switch Engine"): product names Extreme
// publishes, nothing of the reader's network. The link carries `input`, the box
// as typed. The two naming pairs and the family list the page always shows are
// not part of a link: they are the page itself.
// Arrival: the box is filled as typing would and the page maps it.
// ============================================================================

import { mapOsName } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface OsMapperShareState {
  /** The model series or OS name, as typed. */
  input: string;
}


/** The spec. */
export const OS_MAPPER_SHARE: ShareSpec<OsMapperShareState> = Object.freeze({
  tool: "extreme-switch-os-mapper", // the slug
  posture: "input", // the box as typed
  carriesKey: "share.carries", // tools.extreme-switch-os-mapper.share.carries
  names: ["input"], // #input=
  /** The box, when the page maps it; nothing otherwise (the button is disabled). */
  encode(s: OsMapperShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" }; // nothing typed
    try { mapOsName(s.input); } catch { return { ok: false, reason: "empty" }; } // no answer: nothing to share
    return { ok: true, params: { input: s.input } }; // as typed
  },
  /** Any non-blank text: the page maps it as typing would, and says why when it cannot. */
  decode(v: Readonly<Record<string, string | null>>): OsMapperShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing
    return { input: v.input }; // the text
  },
});
