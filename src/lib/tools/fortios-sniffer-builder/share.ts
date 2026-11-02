// ============================================================================
// src/lib/tools/fortios-sniffer-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the FortiOS packet sniffer builder and decoder
// (posture "input-caution", raised from "input" on 2026-11-01: the manifest
// says "A sniffer command can carry internal IPs / hostnames"). The page has
// two modes, and a link carries the open one:
//   - Build: a form, so named values only (ROLLOUT 11.3), every field always
//     (decisions of 2026-11-01): iface, host, port, proto, verbose, count and
//     timestamp ("a", "l", or left out for relative, the empty choice);
//   - Decode: the pasted command as "input", after the FortiOS check
//     (../fortios-cli-config-explainer/fortios-secrets.ts), since the box
//     takes any text: a credential blocks the link (code "secret"; the
//     popover names its line), and a value whose name only looks like a
//     secret is named in the caution line instead.
// Both modes carry the caution line: the interface and the filter name a
// network's interfaces and hosts. The presence of "input" says the mode; a
// link mixing the two is malformed.
//
// Arrival: the mode opens and its fields fill (the other mode's fields keep
// their values); the page builds or decodes as on typing (nothing runs).
// ============================================================================

import { TSFORMATS, VERBOSITY } from "./compute"; // the page's own choices
import { checkFortiosText, isSendableFortiosBox } from "../fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check
import { encodeCheckedBox, type ShareSecretReport } from "../../share/text-secrets"; // the shared check's encoding
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The protocols the form's select offers. */
export const SNIFFER_PROTOS: readonly string[] = ["any", "tcp", "udp", "icmp", "arp", "ip", "ip6", "gre", "esp"]; // as the page lists them

/** The build form's names in a link. */
const BUILD_NAMES = ["iface", "host", "port", "proto", "verbose", "count", "timestamp"] as const; // the form

/** The page's state: the open mode, the form and the paste box. */
export interface SnifferShareState {
  /** The open mode. */
  mode: "build" | "decode";
  /** Interface (build). */
  iface: string;
  /** Host (build). */
  host: string;
  /** Port (build). */
  port: string;
  /** Protocol (build). */
  proto: string;
  /** Verbosity 1 to 6 (build). */
  verbose: number;
  /** Packet count, 0 for unlimited (build). */
  count: number;
  /** Timestamp code: "a", "l" or "" for relative (build). */
  tsformat: string;
  /** The paste box (decode). */
  input: string;
} // SnifferShareState

/** What an arrival restores: one mode's fields. */
export type SnifferArrival =
  | { mode: "decode"; input: string } // the paste box
  | { mode: "build"; iface: string; host: string; port: string; proto: string; verbose: number; count: number; tsformat: string }; // the form

/**
 * Check the paste box (the page calls this once per change in Decode mode), or null when there is nothing to check.
 * @param s the state
 * @returns the report, or null outside Decode mode or for a blank box
 */
export function checkSnifferPaste(s: SnifferShareState): ShareSecretReport | null {
  return s.mode === "decode" && s.input.trim() !== "" ? checkFortiosText(s.input) : null; // only a pasted command is free text
} // checkSnifferPaste

/**
 * Encode from what the page already computed.
 * @param s the state
 * @param report the check on the paste box (Decode mode), or null
 * @returns the form or the box, nothing, or blocked
 */
export function encodeSniffer(s: SnifferShareState, report: ShareSecretReport | null): ShareEncoding {
  if (s.mode === "decode") return report ? encodeCheckedBox(s.input, report) : { ok: false, reason: "empty" }; // the box, blocked, or nothing
  return { ok: true, params: { iface: s.iface, host: s.host, port: s.port, proto: s.proto, verbose: String(s.verbose), count: String(s.count), timestamp: s.tsformat } }; // every field (empty ones are left out of the link)
} // encodeSniffer

/** The spec. */
export const FORTIOS_SNIFFER_SHARE: ShareSpec<SnifferShareState, SnifferArrival> = Object.freeze({
  tool: "fortios-sniffer-builder", // the slug
  posture: "input-caution", // the form or the box as typed, with a caution line
  carriesKey: "share.carries", // tools.fortios-sniffer-builder.share.carries
  names: ["input", ...BUILD_NAMES], // the box, or the form
  /** The open mode's values, nothing, or blocked. */
  encode(s: SnifferShareState): ShareEncoding {
    return encodeSniffer(s, checkSnifferPaste(s)); // checked, encoded
  },
  /** One mode: a box without a credential, or a form whose choices the page offers. */
  decode(v: Readonly<Record<string, string | null>>): SnifferArrival | null {
    const anyBuild = BUILD_NAMES.some((n) => v[n] !== null); // a form value present?
    if (v.input !== null) return !anyBuild && isSendableFortiosBox(v.input) ? { mode: "decode", input: v.input } : null; // Decode mode, never mixed
    if (v.verbose === null || v.count === null) return null; // a form link always carries both
    const verbose = /^[1-6]$/.test(v.verbose) ? Number(v.verbose) : NaN; // 1 to 6
    if (!VERBOSITY.some((x) => x.level === verbose)) return null; // a level the page does not offer
    if (!/^\d{1,9}$/.test(v.count)) return null; // a non-negative whole number, as the field keeps it
    const proto = v.proto ?? "any"; // absent: the page's default
    if (!SNIFFER_PROTOS.includes(proto)) return null; // a protocol the select does not offer
    const tsformat = v.timestamp ?? ""; // absent: relative (the empty choice is left out of a link)
    if (tsformat !== "" && !TSFORMATS.some((x) => x.code === tsformat)) return null; // a code the page does not offer
    return { mode: "build", iface: v.iface ?? "", host: v.host ?? "", port: v.port ?? "", proto, verbose, count: Number(v.count), tsformat }; // the form
  },
});
