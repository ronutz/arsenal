// ============================================================================
// src/lib/tools/as3-explainer-validator/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the AS3 declaration explainer (posture
// "derived", raised from "input" on 2026-10-27): a link carries a copy of the
// declaration with every value AS3's schema reference calls a secret replaced
// by "[redacted]" (the rules are AS3_SHARE_RULES in compute.ts: Secret
// ciphertexts, passphrases and passwords, inlined private keys and PKCS #12
// bundles, the AS3 request's targetPassphrase and targetTokens, and the
// Service Discovery credentials), never the paste as typed.
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
import type { ShareableJson } from "./json-secrets"; // what it gives

/** What encode reads: the box, and the copy the page already made of it (optional: made here when absent). */
export interface As3ShareStateInput {
  /** The paste. */
  input: string;
  /** shareableDeclaration(input), when the page has it already (it shows the count of replaced values). */
  copy?: ShareableJson;
}

/** What an arrival restores: the box (the copy). */
export interface As3ShareState {
  /** The declaration text. */
  input: string;
}

/** The spec. */
export const AS3_SHARE: ShareSpec<As3ShareStateInput, As3ShareState> = Object.freeze({
  tool: "as3-explainer-validator", // the slug
  posture: "derived", // the copy with every secret value replaced
  carriesKey: "share.carries", // tools.as3-explainer-validator.share.carries
  names: ["input"], // #input=
  /** The copy, never the paste; nothing while the box is blank; no link for broken JSON that names a secret. */
  encode(state: As3ShareStateInput): ShareEncoding {
    if (state.input.trim() === "") return { ok: false, reason: "empty" }; // nothing pasted: the button is disabled
    const copy = state.copy ?? shareableDeclaration(state.input); // the derived form
    if (!copy.ok) return { ok: false, reason: "blocked", code: "unparsed-secret", values: { name: copy.name } }; // no link; the popover names the setting
    return { ok: true, params: { input: copy.text } }; // the copy
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(values: Readonly<Record<string, string | null>>): As3ShareState | null {
    const v = values.input; // the arriving value
    return v && v.trim() !== "" ? { input: v } : null; // the text, or nothing
  },
});
