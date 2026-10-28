// ============================================================================
// src/lib/tools/f5-persistence-method-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the persistence-method explainer (posture
// "derived", raised on 2026-10-27 from the inventory's "input-caution"): a
// cookie persistence profile can hold a cookie-encryption-passphrase (F5's
// tmsh reference, ltm persistence cookie, read 2026-10-27: "Specifies a
// passphrase to be used for cookie encryption"), and a pasted configuration
// can hold other secrets beside the profiles. This tool reads its text with
// the tmsh config explainer's parser, so it shares through that tool's copy:
// shareableTmsh() replaces every secret setting's value with "[redacted]",
// one tmsh word, and the copy parses into the same profiles, virtual servers
// and fields (pinned by the tmsh explainer's share vectors). Profile, virtual
// server, pool and cookie names stay as pasted; so do iRule bodies, and the
// popover says so when there is one.
//
// Arrival: the copy fills the box as a paste would, and the page explains it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import { shareableTmsh } from "../f5-tmsh-config-explainer/compute"; // the derived form, from the parser this tool reads with
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface PersistenceShareState {
  /** The profiles and virtual servers, as text. */
  input: string;
}

/** The spec. */
export const PERSISTENCE_SHARE: ShareSpec<PersistenceShareState> = Object.freeze({
  tool: "f5-persistence-method-explainer", // the slug
  posture: "derived", // the copy with every secret value replaced
  carriesKey: "share.carries", // tools.f5-persistence-method-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, when the box holds something. */
  encode(s: PersistenceShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    return { ok: true, params: { input: shareableTmsh(s.input).text } } as const; // the copy, never the paste
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): PersistenceShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
