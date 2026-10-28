// ============================================================================
// src/lib/tools/f5-bigip-tcpdump-builder/share.ts
// ----------------------------------------------------------------------------
// The "Share results" spec of the BIG-IP tcpdump builder (posture
// "input-caution"; the manifest: "The filter/interface may contain internal
// IPs", shareSafetyDefault "fragment"). The tool is a form with nothing to
// paste, so a link carries named values only (no "input"):
//   iface, filter, file   the three text fields, as typed, when not empty
//                          (file only while "write to file" is on)
//   detail                 none | n | nn | nnn (the ":n" suffix)
//   both                   1 | 0 (the trailing "p")
//   names                  default | no-dns | no-dns-port (-n, -nn)
//   snaplen                default | full | custom
//   snapbytes              the custom snap length, as the engine uses it
//   count                  -c, as the engine uses it (a whole number from 1)
//   verbose                none | v | vv | vvv
//   ether, hex             1 | 0 (-e, -X)
//   write                  1 | 0 (-w)
// A choice goes only when it differs from the form's default (DEFAULT_OPTIONS:
// 0.0, nnn, both sides, -nn, -s0, written to /var/tmp/capture.pcap, filtered
// on host 10.1.1.1); the untouched default form has nothing to share, and the
// button is disabled. The form holds no secret: the builder formats a command
// and runs nothing (D-49), so the caution line asks the reader to check the
// interface and the filter for internal addresses.
//
// Arrival: the link's values replace the whole form: a text field the link
// does not carry is emptied (the sender's was empty), a choice it does not
// carry takes its default, and the page assembles the command. Nothing is
// captured, run or sent. A choice the form does not offer, a switch other
// than 1 or 0, or a number out of range makes the whole share malformed.
// ============================================================================

import { DEFAULT_OPTIONS, type NameResolution, type Snaplen, type TcpdumpOptions, type TmmDetail, type Verbosity } from "./compute"; // the form's shape and default
import type { ShareEncoding, ShareSpec } from "../../share/spec"; // the spec shape and what encode returns

/** The detail suffix by its id in a link ("" has none of its own, so it goes as "none"). */
const DETAIL: readonly { id: string; value: TmmDetail }[] = [{ id: "none", value: "" }, { id: "n", value: "n" }, { id: "nn", value: "nn" }, { id: "nnn", value: "nnn" }]; // the four buttons
/** The verbosity by its id in a link. */
const VERBOSE: readonly { id: string; value: Verbosity }[] = [{ id: "none", value: "" }, { id: "v", value: "v" }, { id: "vv", value: "vv" }, { id: "vvv", value: "vvv" }]; // the four buttons
/** The name-resolution choices. */
const NAMES: readonly NameResolution[] = ["default", "no-dns", "no-dns-port"]; // the three buttons
/** The snap-length choices. */
const SNAPLEN: readonly Snaplen[] = ["default", "full", "custom"]; // the three buttons
/** The largest number a link may carry for the snap length or the count (well past any real capture). */
const MAX_NUMBER = 999_999_999; // nine digits

/** Whether two forms are the same (every field compared). */
function sameForm(a: TcpdumpOptions, b: TcpdumpOptions): boolean {
  const keys = Object.keys(DEFAULT_OPTIONS) as (keyof TcpdumpOptions)[]; // every field
  return keys.every((k) => a[k] === b[k]) && a.snaplenValue === b.snaplenValue && a.count === b.count; // field by field, the optional numbers too
} // sameForm

/**
 * A whole number from a link, or null.
 * @param s the value
 * @param min the smallest allowed
 * @returns the number, or null when it is not a whole number in range
 */
function wholeNumber(s: string, min: number): number | null {
  if (!/^\d{1,9}$/.test(s)) return null; // digits only, bounded
  const n = Number(s); // the number
  return n >= min && n <= MAX_NUMBER ? n : null; // in range
} // wholeNumber

/** The spec. */
export const TCPDUMP_SHARE: ShareSpec<TcpdumpOptions> = Object.freeze({
  tool: "f5-bigip-tcpdump-builder", // the slug
  posture: "input-caution", // the form as filled in, with a caution line
  carriesKey: "share.carries", // tools.f5-bigip-tcpdump-builder.share.carries
  names: ["iface", "filter", "file", "detail", "both", "names", "snaplen", "snapbytes", "count", "verbose", "ether", "hex", "write"], // no "input": a form
  /** The form's values, or nothing for the untouched default. */
  encode(o: TcpdumpOptions): ShareEncoding {
    if (sameForm(o, DEFAULT_OPTIONS)) return { ok: false, reason: "empty" } as const; // nothing the reader chose: the button is disabled
    const p: Record<string, string> = {}; // the values
    if (o.iface !== "") p.iface = o.iface; // the interface, as typed
    if (o.filter !== "") p.filter = o.filter; // the filter, as typed
    if (o.writeFile && o.fileName !== "") p.file = o.fileName; // the file, while it is written
    if (o.detail !== DEFAULT_OPTIONS.detail) p.detail = DETAIL.find((d) => d.value === o.detail)?.id ?? "none"; // the suffix
    if (o.bothSides !== DEFAULT_OPTIONS.bothSides) p.both = o.bothSides ? "1" : "0"; // the trailing p
    if (o.nameResolution !== DEFAULT_OPTIONS.nameResolution) p.names = o.nameResolution; // -n / -nn
    if (o.snaplen !== DEFAULT_OPTIONS.snaplen) p.snaplen = o.snaplen; // -s
    if (o.snaplen === "custom" && o.snaplenValue !== undefined && Number.isFinite(o.snaplenValue)) p.snapbytes = String(Math.min(MAX_NUMBER, Math.max(0, Math.trunc(o.snaplenValue)))); // as the engine uses it
    if (o.count !== undefined && Number.isFinite(o.count) && o.count > 0 && Math.trunc(o.count) >= 1) p.count = String(Math.min(MAX_NUMBER, Math.trunc(o.count))); // as the engine uses it
    if (o.verbosity !== DEFAULT_OPTIONS.verbosity) p.verbose = VERBOSE.find((d) => d.value === o.verbosity)?.id ?? "none"; // -v
    if (o.etherHeader !== DEFAULT_OPTIONS.etherHeader) p.ether = o.etherHeader ? "1" : "0"; // -e
    if (o.hexAscii !== DEFAULT_OPTIONS.hexAscii) p.hex = o.hexAscii ? "1" : "0"; // -X
    if (o.writeFile !== DEFAULT_OPTIONS.writeFile) p.write = o.writeFile ? "1" : "0"; // -w
    return { ok: true, params: p } as const; // the values (never empty: the form differs from the default)
  },
  /** The whole form: carried values validated, the rest emptied or defaulted. */
  decode(v: Readonly<Record<string, string | null>>): TcpdumpOptions | null {
    const sw = (s: string | null | undefined, dflt: boolean): boolean | null => (s === null || s === undefined ? dflt : s === "1" ? true : s === "0" ? false : null); // a switch, or null when malformed
    const detail = v.detail == null ? DEFAULT_OPTIONS.detail : DETAIL.find((d) => d.id === v.detail)?.value; // the suffix
    const verbosity = v.verbose == null ? DEFAULT_OPTIONS.verbosity : VERBOSE.find((d) => d.id === v.verbose)?.value; // -v
    const nameResolution = v.names == null ? DEFAULT_OPTIONS.nameResolution : NAMES.find((n) => n === v.names); // -n
    const snaplen = v.snaplen == null ? DEFAULT_OPTIONS.snaplen : SNAPLEN.find((n) => n === v.snaplen); // -s
    const both = sw(v.both, DEFAULT_OPTIONS.bothSides); // the trailing p
    const ether = sw(v.ether, DEFAULT_OPTIONS.etherHeader); // -e
    const hex = sw(v.hex, DEFAULT_OPTIONS.hexAscii); // -X
    const write = sw(v.write, DEFAULT_OPTIONS.writeFile); // -w
    if (detail === undefined || verbosity === undefined || nameResolution === undefined || snaplen === undefined) return null; // a choice the form does not offer
    if (both === null || ether === null || hex === null || write === null) return null; // a switch other than 1 or 0
    const snapbytes = v.snapbytes == null ? undefined : wholeNumber(v.snapbytes, 0); // the custom snap length
    const count = v.count == null ? undefined : wholeNumber(v.count, 1); // -c
    if (snapbytes === null || count === null) return null; // a number out of range
    if (snapbytes !== undefined && snaplen !== "custom") return null; // a snap length without the custom choice
    if (v.file != null && !write) return null; // a file name while nothing is written
    const allEmpty = [v.iface, v.filter, v.file, v.detail, v.both, v.names, v.snaplen, v.snapbytes, v.count, v.verbose, v.ether, v.hex, v.write].every((x) => x == null); // nothing at all
    if (allEmpty) return null; // not a share
    return {
      iface: v.iface ?? "", // as typed, or empty
      detail, // the suffix
      bothSides: both, // the trailing p
      nameResolution, // -n / -nn
      snaplen, // -s
      snaplenValue: snapbytes, // the custom snap length, or none
      count, // -c, or none
      verbosity, // -v
      etherHeader: ether, // -e
      hexAscii: hex, // -X
      writeFile: write, // -w
      fileName: v.file ?? (write ? "" : DEFAULT_OPTIONS.fileName), // as typed; empty while written (the engine then uses its default path); the default while not written
      filter: v.filter ?? "", // as typed, or empty
    };
  },
});
