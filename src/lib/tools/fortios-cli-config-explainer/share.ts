// ============================================================================
// src/lib/tools/fortios-cli-config-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiOS CLI config explainer (posture
// "derived", raised from "input" on 2026-11-01). A pasted configuration block
// can hold the credentials FortiOS stores in its configuration: a pre-shared
// key, an administrator's password, a RADIUS secret, an SNMP community, an
// ENC value (Fortinet PSIRT FG-IR-19-007: decryptable once posted; see
// fortios-secrets.ts for every rule and its source). The page explains each
// line's verb and field, never the value of a secret, so a link carries a
// COPY with every such value replaced by a numbered mark ([redacted-1] ...):
// the tree, the warnings and the notes read the same, and the lines show the
// marks. A value that runs past its line (a PEM key in quotes) cannot be
// replaced, so it blocks the link (code "secret", the popover names the
// line); so does any credential the site's check still finds in the copy.
// No reveal switch: every value replaced is a credential Fortinet's own
// advisory says not to expose, and the reading never needs it.
//
// Arrival: the copy fills the box as a paste would and the page explains it.
// Any non-blank text with nothing left to replace is accepted; a text that
// still holds a secret is one this encoder never builds, and is ignored.
// ============================================================================

import { decodeConfig } from "./compute"; // the page's own parser (throws when it reads no verb)
import { encodeFortiosCopy, fortiosShareCopy, isFortiosCopy } from "./fortios-secrets"; // the FortiOS copy and check
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state: the box (the paste when encoding, the copy on arrival). */
export interface FortiosCliShareState {
  /** The box as pasted. */
  input: string;
} // FortiosCliShareState

/**
 * Whether the page has an explanation to share (it explains any block in which it reads at least one verb).
 * @param input the box
 * @returns true when the page explains it
 */
export function fortiosCliHasReading(input: string): boolean {
  if (input.trim() === "") return false; // nothing pasted
  try { decodeConfig(input); return true; } catch { return false; } // the page shows its own message instead
} // fortiosCliHasReading

/** The spec. */
export const FORTIOS_CLI_CONFIG_SHARE: ShareSpec<FortiosCliShareState> = Object.freeze({
  tool: "fortios-cli-config-explainer", // the slug
  posture: "derived", // a copy with every FortiOS secret value replaced, never the paste
  carriesKey: "share.carries", // tools.fortios-cli-config-explainer.share.carries
  names: ["input"], // #input=
  /** The copy, nothing, or blocked (the spec parses and copies the box itself). */
  encode(s: FortiosCliShareState): ShareEncoding {
    return encodeFortiosCopy(fortiosCliHasReading(s.input) ? fortiosShareCopy(s.input) : null); // read, copied, checked, encoded
  },
  /** Any non-blank text with nothing left to replace: the page explains it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): FortiosCliShareState | null {
    return v.input && v.input.trim() !== "" && isFortiosCopy(v.input) ? { input: v.input } : null; // a copy, or nothing
  },
});
