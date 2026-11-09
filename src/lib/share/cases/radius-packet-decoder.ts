// ============================================================================
// src/lib/share/cases/radius-packet-decoder.ts
// ----------------------------------------------------------------------------
// Share cases of the RADIUS packet decoder (08/11/2026; posture "derived" since
// set 2026-11-08b). A link carries a copy of the packet with every hidden
// password, key, challenge response, Message-Authenticator and secret-keyed
// Authenticator replaced by zero octets of the same length, written as hex 16
// octets a line, with redacted=1; the box goes as typed when it is one of the
// RFCs' published examples or nothing in it needs zeroing. mode=attributes goes
// when the page reads attributes without the header. The copies pinned below
// were computed by the tool's independent oracle (work/oracle in the p37 U3
// hand-over), not by the engine: the course lab's 802.1X and Cisco
// Access-Accepts (Response Authenticator and Message-Authenticator zeroed), the
// lab's SSH login request (User-Password and Message-Authenticator zeroed: it
// was blocked before) and a CHAP-Password request (the response zeroed, the
// CHAP Ident kept). The page's Example (RFC 2865 section 7.1's Access-Request)
// and an RFC 6929 attribute example go as typed. Empty: a blank box and two
// refusals (a TACACS+ header, a truncated packet).
// ============================================================================

import { defineShareCases } from "./define"; // the case shape
import { RADIUS_SHARE, type RadiusShareArrival, type RadiusShareState } from "../../tools/radius-packet-decoder/share"; // the spec
import { EXAMPLE_INPUT, RFC_EXAMPLES, LAB_PACKETS } from "../../tools/radius-packet-decoder/examples"; // the vector inputs

/** The Cisco lab Accept as one run of hex digits (the vector format-stream's form). */
const CISCO_STREAM = LAB_PACKETS["lab-cisco-accept"].replace(/\s+/g, ""); // the same octets
/** RFC 6929's first Extended-Vendor-Specific example (attributes only). */
const EVS = RFC_EXAMPLES["rfc6929-241.26-evs-text"].hex; // f1 0c 1a 00 00 00 01 04 74 65 73 74
/** A CHAP-Password request built for the cases: CHAP Ident 0x16 and a 16-octet response of 0xcd. */
const CHAP = "01 01 00 3d 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff 01 0a 6e 65 74 61 64 6d 69 6e 20 0c 53 57 2d 43 4f 52 45 2d 30 31 03 13 16 cd cd cd cd cd cd cd cd cd cd cd cd cd cd cd cd"; // a CHAP response that is not zero

/** The copies the oracle computed (see the header). */
const COPY = Object.freeze({
  "lab-8021x-accept": "02 2a 00 49 00 00 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 40 06 01 00 00 0d 41 06 01 00 00 06\n51 05 01 31 30 1b 06 00 00 0e 10 1d 06 00 00 00\n01 4f 06 03 07 00 04 50 12 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00 00", // Response Authenticator and Message-Authenticator zeroed
  "lab-cisco-accept": "02 2c 00 45 00 00 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 06 06 00 00 00 06 1a 19 00 00 00 09\n01 13 73 68 65 6c 6c 3a 70 72 69 76 2d 6c 76 6c\n3d 31 35 50 12 00 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 00", // the same, shell:priv-lvl=15 kept
  "lab-admin-request": "01 2c 00 66 b5 19 3c e0 7a 4d 82 f1 6e 3b 9a 0c\n57 d2 e1 48 01 0a 6e 65 74 61 64 6d 69 6e 02 12\n00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\n20 0c 53 57 2d 43 4f 52 45 2d 30 31 3d 06 00 00\n00 05 06 06 00 00 00 06 1f 0c 31 39 32 2e 30 2e\n32 2e 35 30 50 12 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 00 00", // User-Password and Message-Authenticator zeroed; the random Request Authenticator kept
  chap: "01 01 00 3d 00 11 22 33 44 55 66 77 88 99 aa bb\ncc dd ee ff 01 0a 6e 65 74 61 64 6d 69 6e 20 0c\n53 57 2d 43 4f 52 45 2d 30 31 03 13 16 00 00 00\n00 00 00 00 00 00 00 00 00 00 00 00 00", // the CHAP response zeroed, the Ident 0x16 kept
}); // by case

/** The cases. */
export const RADIUS_PACKET_DECODER_SHARE_CASES = defineShareCases<RadiusShareState, RadiusShareArrival>({
  spec: RADIUS_SHARE, // the spec
  accept: [ // round trips: state, link, state again
    { id: "example-rfc-user-password", state: { input: EXAMPLE_INPUT, mode: "packet" }, params: { input: EXAMPLE_INPUT }, restored: { input: EXAMPLE_INPUT, mode: "packet", redacted: false } }, // the page's Example, an RFC example: as typed
    { id: "lab-8021x-accept", state: { input: LAB_PACKETS["lab-8021x-accept"], mode: "packet" }, params: { input: COPY["lab-8021x-accept"], redacted: "1" }, restored: { input: COPY["lab-8021x-accept"], mode: "packet", redacted: true }, mustNotContain: ["8d 2e 13 a9", "1f 8a 6c 0e"] }, // authenticators zeroed
    { id: "attributes-mode", state: { input: EVS, mode: "attributes" }, params: { input: EVS, mode: "attributes" }, restored: { input: EVS, mode: "attributes", redacted: false } }, // the mode travels; an RFC example: as typed
    { id: "stream", state: { input: CISCO_STREAM, mode: "packet" }, params: { input: COPY["lab-cisco-accept"], redacted: "1" }, restored: { input: COPY["lab-cisco-accept"], mode: "packet", redacted: true }, mustNotContain: ["3a7f05c9", "1f8a6c0e", "3a 7f 05 c9"] }, // a hex stream becomes the copy's layout
    { id: "lab-user-password", state: { input: LAB_PACKETS["lab-admin-request"], mode: "packet" }, params: { input: COPY["lab-admin-request"], redacted: "1" }, restored: { input: COPY["lab-admin-request"], mode: "packet", redacted: true }, mustNotContain: ["7e 2c 91 a4", "d0 3b 5f 86", "1f 8a 6c 0e"] }, // blocked before 2026-11-08b
    { id: "chap-password", state: { input: CHAP, mode: "packet" }, params: { input: COPY.chap, redacted: "1" }, restored: { input: COPY.chap, mode: "packet", redacted: true }, mustNotContain: ["cd cd"] }, // blocked before 2026-11-08b
  ],
  arrive: [ // decode-only arrivals
    { id: "mode-absent", values: { input: "02 00 00 14 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff" }, restored: { input: "02 00 00 14 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff", mode: "packet", redacted: false } }, // a packet by default, as typed
    { id: "refused-text-still-fills", values: { input: "zz" }, restored: { input: "zz", mode: "packet", redacted: false } }, // left to the engine, which refuses it on the page as a paste would be
    { id: "redacted-copy", values: { input: COPY["lab-admin-request"], redacted: "1" }, restored: { input: COPY["lab-admin-request"], mode: "packet", redacted: true } }, // the page marks the zeroed fields
  ],
  empty: [ // nothing to share: the button is disabled
    { id: "blank", state: { input: "", mode: "packet" } }, // a blank box
    { id: "tacacs-refused", state: { input: "c0 01 01 00 1a 2b 3c 4d 00 00 00 08 01 02 03 04 05 06 07 08", mode: "packet" } }, // a TACACS+ header: refused
    { id: "truncated-refused", state: { input: "01 00 00 28 00 11 22 33 44 55 66 77 88 99 aa bb cc dd ee ff", mode: "packet" } }, // shorter than its Length
  ],
  reject: [ // malformed arrivals: ignored and stripped
    { id: "empty", values: { input: "" } }, // nothing
    { id: "absent", values: { input: null } }, // not there
    { id: "blank", values: { input: "   " } }, // only spaces
    { id: "bad-mode", values: { input: EXAMPLE_INPUT, mode: "frames" } }, // an unknown mode
    { id: "too-long", values: { input: "0".repeat(24001) } }, // over the engine's bound
    { id: "bad-redacted", values: { input: COPY["lab-admin-request"], redacted: "yes" } }, // redacted is 1 or absent
  ],
});
