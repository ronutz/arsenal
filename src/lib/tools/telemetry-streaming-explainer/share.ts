// ============================================================================
// src/lib/tools/telemetry-streaming-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the Telemetry Streaming explainer (posture
// "derived", raised from "input" on 2026-10-27): a link carries a copy of the
// declaration with every value TS keeps as a secret replaced by "[redacted]"
// (the rules are TS_SHARE_RULES in compute.ts: every cipherText, every
// plain-string passphrase, apiKey and privateKey, and every header value),
// never the paste as typed.
// shareableDeclaration (compute.ts, with its share vectors in
// golden-vectors.ts) makes the copy; this page never shows those values, so
// the receiving page reads the same declaration.
//
// A paste that is not JSON cannot be cut apart safely. If it names one of
// those settings anywhere, there is no link (code "unparsed-secret", the
// popover names the setting and asks for the JSON to be fixed first); if it
// names none, it goes as typed, and the receiving page shows the same parse
// error.
//
// Arrival (useShareArrival in the component): the copy fills the box as a
// paste would and the page explains it. Nothing is sent anywhere. Any
// non-blank text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { shareableDeclaration } from "./compute"; // the derived form
import type { ShareableJson } from "../as3-explainer-validator/json-secrets"; // what it gives

/** What encode reads: the box, and the copy the page already made of it (optional: made here when absent). */
export interface TsShareStateInput {
  /** The paste. */
  input: string;
  /** shareableDeclaration(input), when the page has it already (it shows the count of replaced values). */
  copy?: ShareableJson;
}

/** What an arrival restores: the box (the copy). */
export interface TsShareState {
  /** The declaration text. */
  input: string;
}

/** The spec. */
export const TS_SHARE: ShareSpec<TsShareStateInput, TsShareState> = Object.freeze({
  tool: "telemetry-streaming-explainer", // the slug
  posture: "derived", // the copy with every secret value replaced
  carriesKey: "share.carries", // tools.telemetry-streaming-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, never the paste; nothing while the box is blank; no link for broken JSON that names a secret. */
  encode(state: TsShareStateInput): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
    const copy = state.copy ?? shareableDeclaration(state.input); // the derived form
    if (!copy.ok) return { ok: false, reason: "blocked", code: "unparsed-secret", values: { name: copy.name } }; // no link; the popover names the setting
    return { ok: true, params: { input: copy.text } }; // the copy
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): TsShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
