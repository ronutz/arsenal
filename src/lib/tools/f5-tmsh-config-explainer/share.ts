// ============================================================================
// src/lib/tools/f5-tmsh-config-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the tmsh config explainer (posture "derived",
// raised on 2026-10-27 from the inventory's "input-caution"): a bigip.conf
// snippet holds secrets in plain sight (a monitor's password, a key's pass
// phrase, a RADIUS secret, an SNMP community), and this page shows every
// field's value. So a link carries a copy, never the paste: shareableTmsh()
// in compute.ts replaces the value of every secret setting (and the
// credentials of an Authorization header in a monitor's send string) with
// "[redacted]", one tmsh word, so the copy parses into the same objects,
// fields and nesting (pinned by the tool's own share vectors). Names,
// addresses and partitions stay as pasted; iRule bodies stay as pasted too,
// and the popover says so when there is one, so the reader can check them.
//
// Arrival: the copy fills the box as a paste would, and the page explains it.
// Any non-empty text is accepted, exactly as a paste is.
// ============================================================================

import { shareableTmsh } from "./compute"; // the derived form
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface TmshShareState {
  /** The configuration text. */
  input: string;
}

/** The spec. */
export const TMSH_CONFIG_SHARE: ShareSpec<TmshShareState> = Object.freeze({
  tool: "f5-tmsh-config-explainer", // the slug
  posture: "derived", // the copy with every secret value replaced
  carriesKey: "share.carries", // tools.f5-tmsh-config-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, when the box holds something. */
  encode(s: TmshShareState): ShareEncoding {
    if (s.input.trim() === "") return { ok: false, reason: "empty" } as const; // nothing pasted: the button is disabled
    return { ok: true, params: { input: shareableTmsh(s.input).text } } as const; // the copy, never the paste
  },
  /** Any non-empty text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): TmshShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the copy, or nothing
  },
});
