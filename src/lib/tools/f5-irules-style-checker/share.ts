// ============================================================================
// src/lib/tools/f5-irules-style-checker/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the iRules style checker (posture
// "input-caution"): a link carries the box as pasted.
// An iRule can name internal hosts, pools and data groups, and it can hold
// keys and credentials: the pass phrase of HTTP::cookie encrypt, the key of
// AES::encrypt or CRYPTO::sign, an Authorization header written out (F5's
// own references, read 2026-10-27). So before a link is offered, the iRule
// secrets check (src/lib/tcl84/irule-secrets.ts) reads the box:
//   - a value in a place a standard or F5 defines as a key or credential
//     blocks the link (code "secret"), and the popover names its line, so
//     the reader puts a placeholder there and presses again;
//   - a value whose name looks like a secret (set static::api_token "...")
//     is named in the caution line instead of the general one.
// The page parses the iRule and never runs it.
//
// Arrival: the box fills as a paste would, and the page reads it as it reads
// a paste. Any non-blank text is accepted, exactly as a paste is.
// ============================================================================

import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns
import { encodeIruleBox, findIruleSecrets, type IruleSecretReport } from "../../tcl84/irule-secrets"; // the iRule secrets check

/** The state: the box (the paste when encoding, the link's text on arrival). */
export interface IrulesStyleCheckerShareState {
  /** The box as pasted. */
  input: string;
}

/**
 * Encode from a report the page already made (the page computes one for the button and the caution line).
 * @param s the state
 * @param report the iRule secrets check's report on the box
 * @returns the box, nothing, or blocked
 */
export function encodeIrulesStyleChecker(s: IrulesStyleCheckerShareState, report: IruleSecretReport): ShareEncoding {
  return encodeIruleBox(s.input, report); // empty, blocked by a key or credential, or the box as pasted
} // encodeIrulesStyleChecker

/** The spec. */
export const IRULES_STYLE_CHECKER_SHARE: ShareSpec<IrulesStyleCheckerShareState> = Object.freeze({
  tool: "f5-irules-style-checker", // the slug
  posture: "input-caution", // the box as pasted, with a caution line, after the secrets check
  carriesKey: "share.carries", // tools.f5-irules-style-checker.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked (the spec checks the box itself). */
  encode(s: IrulesStyleCheckerShareState): ShareEncoding {
    return encodeIrulesStyleChecker(s, findIruleSecrets(s.input)); // checked, then encoded
  },
  /** Any non-blank text: the page reads it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): IrulesStyleCheckerShareState | null {
    return v.input && v.input.trim() !== "" ? { input: v.input } : null; // the text, or nothing
  },
});
