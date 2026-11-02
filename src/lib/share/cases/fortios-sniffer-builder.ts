// ============================================================================
// src/lib/share/cases/fortios-sniffer-builder.ts
// ----------------------------------------------------------------------------
// Share cases of the FortiOS packet sniffer builder (input-caution, two
// modes): Build carries every field of the form (the relative timestamp, an
// empty choice, is left out and comes back empty); Decode carries the pasted
// command, after the FortiOS check; a blank paste box has nothing to share; a
// link mixing the modes, an unknown choice or a missing count is malformed.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { FORTIOS_SNIFFER_SHARE, type SnifferArrival, type SnifferShareState } from "../../tools/fortios-sniffer-builder/share"; // the spec

/** The page's opening form (the component's initial state), in Build mode. */
const OPENING: SnifferShareState = { mode: "build", iface: "any", host: "", port: "", proto: "any", verbose: 4, count: 0, tsformat: "l", input: "" }; // as the page opens
/** The page's Decode Example (verbatim from the component). */
const EXAMPLE = "diagnose sniffer packet any 'host 192.168.1.10 and tcp port 443' 4 0 l"; // as the component holds it

/** The cases. */
export const FORTIOS_SNIFFER_BUILDER_SHARE_CASES = defineShareCases<SnifferShareState, SnifferArrival>({
  spec: FORTIOS_SNIFFER_SHARE, // the spec
  accept: [
    { id: "opening-form", state: OPENING, params: { iface: "any", host: "", port: "", proto: "any", verbose: "4", count: "0", timestamp: "l" }, restored: { mode: "build", iface: "any", host: "", port: "", proto: "any", verbose: 4, count: 0, tsformat: "l" } }, // the form as it opens is a command too
    { id: "built-relative", state: { ...OPENING, iface: "port1", host: "10.1.1.1", port: "443", proto: "tcp", verbose: 6, count: 100, tsformat: "" }, params: { iface: "port1", host: "10.1.1.1", port: "443", proto: "tcp", verbose: "6", count: "100", timestamp: "" }, restored: { mode: "build", iface: "port1", host: "10.1.1.1", port: "443", proto: "tcp", verbose: 6, count: 100, tsformat: "" } }, // relative: left out, back as relative
    { id: "decode-example", state: { ...OPENING, mode: "decode", input: EXAMPLE }, params: { input: EXAMPLE }, restored: { mode: "decode", input: EXAMPLE } }, // the pasted command
  ],
  arrive: [
    { id: "form-defaults", values: { input: null, iface: null, host: null, port: null, proto: null, verbose: "1", count: "5", timestamp: "a" }, restored: { mode: "build", iface: "", host: "", port: "", proto: "any", verbose: 1, count: 5, tsformat: "a" } }, // absent text fields empty, protocol any
  ],
  empty: [
    { id: "decode-blank", state: { ...OPENING, mode: "decode", input: "  " } }, // nothing pasted
  ],
  blocked: [
    { id: "decode-with-enc", state: { ...OPENING, mode: "decode", input: `${EXAMPLE}\nset psksecret ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==` }, code: "secret" }, // an ENC value pasted under the command
  ],
  reject: [
    { id: "mixed", values: { input: EXAMPLE, iface: null, host: null, port: null, proto: null, verbose: "4", count: null, timestamp: null } }, // both modes
    { id: "verbose-7", values: { input: null, iface: "any", host: null, port: null, proto: "any", verbose: "7", count: "0", timestamp: "l" } }, // no such level
    { id: "count-negative", values: { input: null, iface: "any", host: null, port: null, proto: "any", verbose: "4", count: "-1", timestamp: "l" } }, // not a count
    { id: "no-count", values: { input: null, iface: "any", host: null, port: null, proto: "any", verbose: "4", count: null, timestamp: "l" } }, // a form link always carries it
    { id: "unknown-proto", values: { input: null, iface: "any", host: null, port: null, proto: "sctp", verbose: "4", count: "0", timestamp: "l" } }, // not on the select
    { id: "unknown-timestamp", values: { input: null, iface: "any", host: null, port: null, proto: "any", verbose: "4", count: "0", timestamp: "z" } }, // not a code
    { id: "decode-credential", values: { input: `${EXAMPLE}\nset passwd ENC dGhpcyBpcyBub3QgYSByZWFsIHNlY3JldA==`, iface: null, host: null, port: null, proto: null, verbose: null, count: null, timestamp: null } }, // never sent
  ],
});
