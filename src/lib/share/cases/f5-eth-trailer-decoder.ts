// ============================================================================
// src/lib/share/cases/f5-eth-trailer-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the F5 Ethernet trailer decoder: the trailer text goes as
// pasted; a TLS provider section (or any secret or keylog line) gets no link,
// and neither do pasted bytes beyond the trailer's header.
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { ETH_TRAILER_SHARE, type TrailerArrival, type TrailerShareState } from "../../tools/f5-eth-trailer-decoder/share"; // the spec
import { TRAILER_VECTORS } from "../../tools/f5-eth-trailer-decoder/golden-vectors"; // the tool's own vectors

/** A vector's input by name. */
const input = (name: string) => TRAILER_VECTORS.find((v) => v.name === name)!.input; // pinned there
/** Low details (direction, slot, TMM, virtual server). */
const LOW = input("low details give direction, slot, TMM and VIP"); // pinned there
/** Medium details with an RST cause: the page's Example. */
const MED = input("*** a KNOWN RST cause is explained ***"); // pinned there
/** A TLS provider section with an early secret. */
const TLS = input("*** A TLS PROVIDER IS DETECTED AND WARNED ABOUT ***"); // pinned there

/** The cases. */
export const F5_ETH_TRAILER_SHARE_CASES = defineShareCases<TrailerShareState, TrailerArrival>({
  spec: ETH_TRAILER_SHARE, // the spec
  accept: [
    { id: "medium", state: { input: MED, tls: false }, params: { input: MED }, restored: { input: MED } }, // the Wireshark view
    { id: "low", state: { input: LOW, tls: false }, params: { input: LOW }, restored: { input: LOW } }, // low details only
    { id: "header-bytes", state: { input: "f5de b0f5 0348 0001", tls: false }, params: { input: "f5de b0f5 0348 0001" }, restored: { input: "f5de b0f5 0348 0001" } }, // the header alone: magic, length, version
  ],
  empty: [
    { id: "nothing", state: { input: "", tls: false } }, // nothing pasted
  ],
  blocked: [
    { id: "tls-provider", state: { input: TLS, tls: true }, code: "tls-secrets" }, // the page found the section
    { id: "secret-line", state: { input: `${LOW}\n    Master Secret: 4c6f6e67536563726574`, tls: false }, code: "tls-secrets" }, // a secret named outside a TLS label
    { id: "keylog-line", state: { input: `${LOW}\n    Keylog entry: CLIENT_RANDOM 00 11`, tls: false }, code: "tls-secrets" }, // a keylog entry
    { id: "frame-before", state: { input: "0000 0000 f5de b0f5 0348 01", tls: false }, code: "raw-bytes" }, // the golden vector's bytes: packet data before the magic
    { id: "bytes-after", state: { input: "f5deb0f5 0348 0001 0004 0030 7ee8 206f 5570 023e", tls: false }, code: "raw-bytes" }, // a provider section after the header
    { id: "no-magic", state: { input: "0011 2233 4455 6677 8899 aabb ccdd eeff", tls: false }, code: "raw-bytes" }, // bytes the page cannot place
  ],
  reject: [
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
  ],
});
