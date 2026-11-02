// ============================================================================
// src/lib/tools/tcpdump-filter-explainer/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the tcpdump command and filter explainer.
// Posture "input-caution" (the tool is newer than the inventory; its manifest
// keeps shareSafetyDefault "fragment" because "a filter can name internal hosts
// and networks", which ROLLOUT section 2 maps to input-caution). The link
// carries `input`, the command or filter as pasted: the explanation (the
// option table, the parse tree, the positions of errors) reads every
// character, so nothing can be replaced without changing it. A caution line
// says the text can name hosts, networks and interfaces.
//
// Two tcpdump options take a secret on the command line, defined by the
// tcpdump(1) manual (tcpdump.org, the 4.99.7 page the engine follows, read 2026-11-01):
//   -E spi@ipaddr algo:secret,...   "Use spi@ipaddr algo:secret for decrypting
//                                   IPsec ESP packets that are addressed to addr
//                                   and contain Security Parameter Index value
//                                   spi" (the manual warns that a secret on the
//                                   command line is visible "to others, via
//                                   ps(1)", and offers a file name instead);
//   -M secret                       "Use secret as a shared secret for
//                                   validating the digests found in TCP
//                                   segments with the TCP-MD5 option (RFC 2385)".
// A command holding either, as the engine reads it (an -E argument with a
// colon, the engine's own test for its warning; any -M argument), gets no link,
// and the popover names the option: replace the secret with a placeholder (or
// use -E's file form) and press again. The text also goes through the site's
// text secrets check (src/lib/share/text-secrets.ts): a value that is a
// credential by its format (a password in a URL, a PEM private key, a JWT ...)
// means no link, naming its line (ANVIL, 01/11/2026: a box sent as pasted
// blocks on a definite credential rather than replacing it).
// Arrival: the text fills the box as a paste would; nothing is run.
// ============================================================================

import { findShareSecrets } from "../../share/text-secrets"; // the site's text secrets check, reused as is
import { explain, type TcpdumpExplanation } from "./compute"; // the engine
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The state the link carries and an arrival restores: the box. */
export interface TcpdumpShareState {
  /** The command or filter, as pasted. */
  input: string;
}

/**
 * The first option of a command that carries a secret, as the engine read it.
 * @param r the engine's explanation
 * @returns the option as written ("-E", "-M"), or null
 */
export function tcpdumpSecretOption(r: TcpdumpExplanation): string | null {
  for (const o of r.command?.options ?? []) { // each option, in order
    if (o.key === "E" && o.arg !== null && o.arg.includes(":")) return "-E"; // an inline ESP secret (the file form has no algo:secret)
    if (o.key === "M" && o.arg !== null && o.arg !== "") return "-M"; // the TCP-MD5 shared secret
  } // options
  return null; // none
} // tcpdumpSecretOption

/**
 * The encoding of a box the page explains.
 * @param input the box as pasted
 * @param r the page's explanation (null when it refused the text, or the box is blank)
 * @returns nothing, blocked (an option's secret, or a credential by its format), or the box
 */
export function encodeTcpdumpShare(input: string, r: TcpdumpExplanation | null): ShareEncoding {
  if (input.trim() === "" || !r) return { ok: false, reason: "empty" }; // nothing explained
  const opt = tcpdumpSecretOption(r); // -E or -M with a secret
  if (opt) return { ok: false, reason: "blocked", code: "option", values: { option: opt } }; // no link
  const found = findShareSecrets(input).secrets[0]; // a credential by its format
  if (found) return { ok: false, reason: "blocked", code: "secret", values: { line: found.line, label: found.label } }; // no link
  return { ok: true, params: { input } }; // as pasted
} // encodeTcpdumpShare

/**
 * The engine's explanation, or null when it refuses the text (as the page catches it).
 * @param input the box
 * @returns the explanation, or null
 */
function explained(input: string): TcpdumpExplanation | null {
  if (input.trim() === "") return null; // nothing pasted
  try { return explain(input); } catch { return null; } // refused as a whole
} // explained

/** The spec. */
export const TCPDUMP_SHARE: ShareSpec<TcpdumpShareState> = Object.freeze({
  tool: "tcpdump-filter-explainer", // the slug
  posture: "input-caution", // as pasted, with the tool's caution
  carriesKey: "share.carries", // tools.tcpdump-filter-explainer.share.carries
  names: ["input"], // #input=
  /** The box, nothing, or blocked. */
  encode(s: TcpdumpShareState): ShareEncoding {
    return encodeTcpdumpShare(s.input, explained(s.input)); // explained, checked, encoded
  },
  /** Any non-blank text without a secret the encoder refuses: the page explains it as a paste. */
  decode(v: Readonly<Record<string, string | null>>): TcpdumpShareState | null {
    if (!v.input || v.input.trim() === "") return null; // nothing
    const r = explained(v.input); // the engine's reading, if any
    if (r && tcpdumpSecretOption(r)) return null; // the encoder never builds one with -E's or -M's secret
    return findShareSecrets(v.input).secrets.length === 0 ? { input: v.input } : null; // nor one with a credential
  },
});
