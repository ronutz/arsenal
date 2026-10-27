// ============================================================================
// src/lib/share/cases/bfd-timers.ts
// ----------------------------------------------------------------------------
// Share cases of the BFD timer calculator and packet decoder: Decode mode's
// hex as #input=, Timers mode's fields by name; a packet with an
// Authentication Section is blocked (its data is never shown, so it is never
// put in a link).
// ============================================================================

import { defineShareCases, type ShareCases } from "./define"; // the case shape
import { BFD_TIMERS_SHARE, type BfdShareInput, type BfdShareState } from "../../tools/bfd-timers/share"; // the spec and its states
import { BFD_DECODE_VECTORS } from "../../tools/bfd-timers/golden-vectors"; // the tool's own vectors

/** A decode vector's hex by id. */
const hex = (id: string): string => BFD_DECODE_VECTORS.find((v) => v.id === id)?.packet ?? ""; // "" if renamed: the case then fails loudly

/** The page's Timers Example (BfdTimersTool's EXAMPLE_A and EXAMPLE_B: FRRouting's 900 ms example). */
const A = { tx: "300ms", rx: "300ms", mult: "3", echo: "", demand: false }; // the local system
const B = { tx: "300ms", rx: "200ms", mult: "3", echo: "", demand: false }; // the remote system

/** An Up packet with a Simple Password Authentication Section (RFC 5880 section 4.2: type 1, length 3 + 8, key ID 1, the password "p4ssw0rd"). */
const SIMPLE_PASSWORD = "20 c4 03 23 00 00 00 01 00 00 00 02 00 04 93 e0 00 04 93 e0 00 00 00 00 01 0b 01 70 34 73 73 77 30 72 64"; // 35 bytes, Length 0x23

/** The cases. */
export const BFD_TIMERS_SHARE_CASES = defineShareCases(Object.freeze<ShareCases<BfdShareInput, BfdShareState>>({ // typed, so cases carrying different values check as one list
  spec: BFD_TIMERS_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "timers-example", state: { mode: "timers" as const, a: A, b: B, sessionUp: true, path: "single-hop" as const }, params: { atx: "300ms", arx: "300ms", amult: "3", btx: "300ms", brx: "200ms", bmult: "3" }, restored: { mode: "timers" as const, a: A, b: B, sessionUp: true, path: "single-hop" as const } }, // defaults are not carried
    { id: "timers-everything", state: { mode: "timers" as const, a: { tx: "50 ms", rx: "50ms", mult: "3", echo: "100ms", demand: true }, b: { tx: "1s", rx: "1000000", mult: "5", echo: "", demand: true }, sessionUp: false, path: "multihop" as const }, params: { atx: "50 ms", arx: "50ms", amult: "3", aecho: "100ms", ademand: "1", btx: "1s", brx: "1000000", bmult: "5", bdemand: "1", up: "0", path: "multihop" }, restored: { mode: "timers" as const, a: { tx: "50 ms", rx: "50ms", mult: "3", echo: "100ms", demand: true }, b: { tx: "1s", rx: "1000000", mult: "5", echo: "", demand: true }, sessionUp: false, path: "multihop" as const } }, // every field, as typed
    { id: "decode-example", state: { mode: "decode" as const, packet: hex("up-300ms") }, params: { input: hex("up-300ms") }, restored: { mode: "decode" as const, packet: hex("up-300ms") } }, // the page's Decode Example, spaces included
    { id: "decode-discarded", state: { mode: "decode" as const, packet: hex("discard-version-2") }, params: { input: hex("discard-version-2") }, restored: { mode: "decode" as const, packet: hex("discard-version-2") } }, // a discarded packet is still a result
    { id: "decode-a-bit-no-section", state: { mode: "decode" as const, packet: "20c4031a00000001000000020004 93e0000493e000000000" }, params: { input: "20c4031a00000001000000020004 93e0000493e000000000" }, restored: { mode: "decode" as const, packet: "20c4031a00000001000000020004 93e0000493e000000000" } }, // A set, but the 24 bytes end before the section: no authentication data to keep out
  ],
  arrive: [ // decode only: defaults of absent optional values
    { id: "timers-defaults", values: { atx: "1s", arx: "1s", amult: "3", btx: "1s", brx: "1s", bmult: "3", up: null, path: null, ademand: null, aecho: null }, restored: { mode: "timers" as const, a: { tx: "1s", rx: "1s", mult: "3", echo: "", demand: false }, b: { tx: "1s", rx: "1s", mult: "3", echo: "", demand: false }, sessionUp: true, path: "single-hop" as const } }, // Up, single-hop, no echo, no Demand
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "timers-nothing", state: { mode: "timers" as const, a: { tx: "", rx: "", mult: "", echo: "", demand: false }, b: { tx: "", rx: "", mult: "", echo: "", demand: false }, sessionUp: true, path: "single-hop" as const } }, // the Clear state
    { id: "decode-nothing", state: { mode: "decode" as const, packet: "  " } }, // a blank box
    { id: "decode-malformed", state: { mode: "decode" as const, packet: "20 c0 zz" } }, // no result: nothing to share
  ],
  blocked: [ // a result no link may carry
    { id: "keyed-sha1", state: { mode: "decode" as const, packet: hex("keyed-sha1-authentication") }, code: "auth-data" }, // the tool's own Keyed SHA1 vector
    { id: "simple-password", state: { mode: "decode" as const, packet: SIMPLE_PASSWORD }, code: "auth-data" }, // the password itself would travel
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "absent", values: { input: null } }, // not there
    { id: "mixed-modes", values: { input: hex("up-300ms"), atx: "300ms" } }, // two modes in one link
    { id: "timers-incomplete", values: { atx: "300ms", arx: "300ms", amult: "3", btx: "300ms", brx: "200ms" } }, // B's Detect Mult missing
    { id: "unknown-path", values: { atx: "1s", arx: "1s", amult: "3", btx: "1s", brx: "1s", bmult: "3", path: "two-hop" } }, // not offered
    { id: "state-not-binary", values: { atx: "1s", arx: "1s", amult: "3", btx: "1s", brx: "1s", bmult: "3", up: "down" } }, // a switch is 1 or 0
    { id: "demand-not-binary", values: { atx: "1s", arx: "1s", amult: "3", btx: "1s", brx: "1s", bmult: "3", bdemand: "true" } }, // a switch is 1 or 0
    { id: "blank-packet", values: { input: " " } }, // nothing to fill
  ],
}));
