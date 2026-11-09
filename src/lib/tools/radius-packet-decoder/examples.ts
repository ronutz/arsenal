// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/radius-packet-decoder/examples.ts
// ----------------------------------------------------------------------------
// The example packets, in one small module that the engine (which recognises
// the RFC examples by their octets), the golden vectors (which pin every one)
// and the component (whose Example button and chips fill them) all import, so
// the page can never drift from the vectors. GENERATED on 2026-11-08 by
// work/gen_examples.py (again for set 2026-11-08b, which adds the fifth lab
// packet, Huawei's):
//   - RFC_EXAMPLES: every example packet of RFC 2865 section 7 (eight, with
//     the shared secret "xyzzy5461" the RFC names), RFC 5997 section 6 (six,
//     the same secret) and RFC 5176 section 7 (the RADIUS octets of its three
//     traces, which mask the bytes before them), and the 18 attribute examples
//     of RFC 6929 section 9 (attributes only), extracted from the RFC texts read
//     that day, never typed; plus RFC 2865 section 7.3's second Access-Request
//     as verified erratum 6486 corrects it (State Length 0x10 -> 0x0a);
//   - LAB_PACKETS: five packets built for chapter 4.6 of the course "LAN Switch
//     Operations and Maintenance", with its lab names (netadmin, SW-CORE-01) and
//     documentation addresses (192.0.2.0/24, RFC 5737): their Authenticators,
//     User-Password and Message-Authenticator octets are placeholders with no
//     secret behind them, since no shared secret is ever involved.
// The page's Example (D-83) is RFC 2865 section 7.1's Access-Request.
// ============================================================================

/** One example packet: its hex as the RFC prints it, where it comes from, the shared secret the RFC names, and its mode. */
export interface ExamplePacket {
  /** The octets, in lines of 16. */
  readonly hex: string;
  /** Where it is printed (English, for the reader of this file). */
  readonly where: string;
  /** The RFC it is printed in. */
  readonly rfc: string;
  /** The section. */
  readonly section: string;
  /** The shared secret the RFC says it used, or null. */
  readonly secret: string | null;
  /** A whole packet, or attributes only. */
  readonly mode: "packet" | "attributes";
}

/** The RFCs' own example packets, by id. */
export const RFC_EXAMPLES: Readonly<Record<string, ExamplePacket>> = Object.freeze({
  "rfc2865-7.1-request": { hex: "01 00 00 38 0f 40 3f 94 73 97 80 57 bd 83 d5 cb\n98 f4 22 7a 01 06 6e 65 6d 6f 02 12 0d be 70 8d\n93 d4 13 ce 31 96 e4 3f 78 2a 0a ee 04 06 c0 a8\n01 10 05 06 00 00 00 03", where: "RFC 2865, section 7.1", rfc: "RFC 2865", section: "7.1", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.1
  "rfc2865-7.1-accept": { hex: "02 00 00 26 86 fe 22 0e 76 24 ba 2a 10 05 f6 bf\n9b 55 e0 b2 06 06 00 00 00 01 0f 06 00 00 00 00\n0e 06 c0 a8 01 03", where: "RFC 2865, section 7.1", rfc: "RFC 2865", section: "7.1", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.1
  "rfc2865-7.2-request": { hex: "01 01 00 47 2a ee 86 f0 8d 0d 55 96 9c a5 97 8e\n0d 33 67 a2 01 08 66 6c 6f 70 73 79 03 13 16 e9\n75 57 c3 16 18 58 95 f2 93 ff 63 44 07 72 75 04\n06 c0 a8 01 10 05 06 00 00 00 14 06 06 00 00 00\n02 07 06 00 00 00 01", where: "RFC 2865, section 7.2", rfc: "RFC 2865", section: "7.2", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.2
  "rfc2865-7.2-accept": { hex: "02 01 00 38 15 ef bc 7d ab 26 cf a3 dc 34 d9 c0\n3c 86 01 a4 06 06 00 00 00 02 07 06 00 00 00 01\n08 06 ff ff ff fe 0a 06 00 00 00 02 0d 06 00 00\n00 01 0c 06 00 00 05 dc", where: "RFC 2865, section 7.2", rfc: "RFC 2865", section: "7.2", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.2
  "rfc2865-7.3-request-1": { hex: "01 02 00 39 f3 a4 7a 1f 6a 6d 76 71 0b 94 7a b9\n30 41 a0 39 01 07 6d 6f 70 73 79 02 12 33 65 75\n73 77 82 89 b5 70 88 5e 15 08 48 25 c5 04 06 c0\na8 01 10 05 06 00 00 00 07", where: "RFC 2865, section 7.3", rfc: "RFC 2865", section: "7.3", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.3
  "rfc2865-7.3-challenge": { hex: "0b 02 00 4e 36 f3 c8 76 4a e8 c7 11 57 40 3c 0c\n71 ff 9c 45 12 30 43 68 61 6c 6c 65 6e 67 65 20\n33 32 37 36 39 34 33 30 2e 20 20 45 6e 74 65 72\n20 72 65 73 70 6f 6e 73 65 20 61 74 20 70 72 6f\n6d 70 74 2e 18 0a 33 32 37 36 39 34 33 30", where: "RFC 2865, section 7.3", rfc: "RFC 2865", section: "7.3", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.3
  "rfc2865-7.3-request-2-published": { hex: "01 03 00 43 b1 22 55 6d 42 8a 13 d0 d6 25 38 07\nc4 57 ec f0 01 07 6d 6f 70 73 79 02 12 69 2c 1f\n20 5f c0 81 b9 19 b9 51 95 f5 61 a5 81 04 06 c0\na8 01 10 05 06 00 00 00 07 18 10 33 32 37 36 39\n34 33 30", where: "RFC 2865, section 7.3", rfc: "RFC 2865", section: "7.3", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.3
  "rfc2865-7.3-reject": { hex: "03 03 00 14 a4 2f 4f ca 45 91 6c 4e 09 c8 34 0f\n9e 74 6a a0", where: "RFC 2865, section 7.3", rfc: "RFC 2865", section: "7.3", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.3
  "rfc2865-7.3-request-2-corrected": { hex: "01 03 00 43 b1 22 55 6d 42 8a 13 d0 d6 25 38 07\nc4 57 ec f0 01 07 6d 6f 70 73 79 02 12 69 2c 1f\n20 5f c0 81 b9 19 b9 51 95 f5 61 a5 81 04 06 c0\na8 01 10 05 06 00 00 00 07 18 0a 33 32 37 36 39\n34 33 30", where: "RFC 2865, section 7.3, as verified erratum 6486 corrects it", rfc: "RFC 2865", section: "7.3", secret: "xyzzy5461", mode: "packet" }, // RFC 2865, section 7.3, as verified erratum 6486 corrects it
  "rfc5997-6.1-status": { hex: "0c da 00 26 8a 54 f4 68 6f b3 94 c5 28 66 e3 02\n18 5d 06 23 50 12 5a 66 5e 2e 1e 84 11 f3 e2 43\n82 20 97 c8 4f a3", where: "RFC 5997, section 6.1", rfc: "RFC 5997", section: "6.1", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.1
  "rfc5997-6.1-accept": { hex: "02 da 00 14 ef 0d 55 2a 4b f2 d6 93 ec 2b 6f e8\nb5 41 1d 66", where: "RFC 5997, section 6.1", rfc: "RFC 5997", section: "6.1", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.1
  "rfc5997-6.2-status": { hex: "0c b3 00 26 92 5f 6b 66 dd 5f ed 57 1f cb 1d b7\nad 38 82 60 50 12 e8 d6 ea bd a9 10 87 5c d9 1f\nda de 26 36 78 58", where: "RFC 5997, section 6.2", rfc: "RFC 5997", section: "6.2", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.2
  "rfc5997-6.2-reply": { hex: "02 b3 00 14 0f 6f 92 14 5f 10 7e 2f 50 4e 86 0a\n48 60 66 9c", where: "RFC 5997, section 6.2", rfc: "RFC 5997", section: "6.2", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.2
  "rfc5997-6.3-status": { hex: "0c 47 00 2c bf 58 de 56 ae 40 8a d3 b7 0c 85 13\nf9 b0 3f be 04 06 c0 00 02 10 50 12 85 2d 6f ec\n61 e7 ed 74 b8 e3 2d ac 2f 2a 5f b2", where: "RFC 5997, section 6.3", rfc: "RFC 5997", section: "6.3", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.3
  "rfc5997-6.3-accept": { hex: "02 47 00 34 46 f4 3e 62 fd 03 54 42 4c bb eb fd\n6d 21 4e 06 12 20 52 41 44 49 55 53 20 53 65 72\n76 65 72 20 75 70 20 32 20 64 61 79 73 2c 20 31\n38 3a 34 30", where: "RFC 5997, section 6.3", rfc: "RFC 5997", section: "6.3", secret: "xyzzy5461", mode: "packet" }, // RFC 5997, section 6.3
  "rfc5176-7-user-name": { hex: "28 01 00 1c 1b 23 62 4c 35 43 ce ba 55 f1 be 55\na7 14 ca 5e 01 08 6d 63 68 69 62 61", where: "RFC 5176, section 7 (the RADIUS octets of its trace)", rfc: "RFC 5176", section: "7", secret: null, mode: "packet" }, // RFC 5176, section 7 (the RADIUS octets of its trace)
  "rfc5176-7-session-id": { hex: "28 01 00 1e ad 0d 8e 53 55 b6 bd 02 a0 cb ac e6\n4e 38 77 bd 2c 0a 39 30 32 33 34 35 36 37", where: "RFC 5176, section 7 (the RADIUS octets of its trace)", rfc: "RFC 5176", section: "7", secret: null, mode: "packet" }, // RFC 5176, section 7 (the RADIUS octets of its trace)
  "rfc5176-7-framed-ip": { hex: "28 01 00 1a 0b da 33 fe 76 5b 05 f0 fd 9c c3 2a\n2f 6b 51 82 08 06 0a 00 02 03", where: "RFC 5176, section 7 (the RADIUS octets of its trace)", rfc: "RFC 5176", section: "7", secret: null, mode: "packet" }, // RFC 5176, section 7 (the RADIUS octets of its trace)
  "rfc6929-241.1-text": { hex: "f1 06 01 62 6f 62", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.2-tlv": { hex: "f1 07 02 01 04 23 45", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.2-two-tlvs": { hex: "f1 0b 02 01 04 23 45 02 04 67 89", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.2-nested": { hex: "f1 0d 02 01 04 23 45 03 06 01 04 ab cd", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.2-nested-two": { hex: "f1 12 02 01 04 23 45 03 0b 01 04 ab cd 02 05 66\n6f 6f", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.1-depth5": { hex: "f1 0f 01 01 0c 02 0a 03 08 04 06 05 04 cd ef", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.26-evs-text": { hex: "f1 0c 1a 00 00 00 01 04 74 65 73 74", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-241.26-evs-tlv": { hex: "f1 0e 1a 00 00 00 01 05 03 06 74 65 73 74", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.1-text": { hex: "f5 07 01 00 62 6f 62", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.2-tlv": { hex: "f5 08 02 00 01 04 23 45", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.2-two-tlvs": { hex: "f5 0c 02 00 01 04 23 45 02 04 67 89", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.2-nested": { hex: "f5 0e 02 00 01 04 23 45 03 06 01 04 ab cd", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.2-nested-two": { hex: "f5 13 02 00 01 04 23 45 03 0b 01 04 ab cd 02 05\n66 6f 6f", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.1-depth5": { hex: "f5 10 01 00 01 0c 02 0a 03 08 04 06 05 04 cd ef", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.26-evs-text": { hex: "f5 0d 1a 00 00 00 00 01 04 74 65 73 74", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.26-evs-tlv": { hex: "f5 0f 1a 00 00 00 00 01 05 03 06 74 65 73 74", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.4-long": { hex: "f5 ff 04 80 aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa ab bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb f5\n13 04 00 cc cc cc cc cc cc cc cc cc cc cc cc cc\ncc cc", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
  "rfc6929-245.26-evs-long": { hex: "f5 ff 1a 80 00 00 00 01 06 aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa aa aa aa aa aa aa aa aa aa aa\naa aa aa aa aa aa ab bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb bb\nbb bb bb bb bb bb bb bb bb bb bb bb bb bb bb f5\n18 1a 00 bb bb bb bb bb cc cc cc cc cc cc cc cc\ncc cc cc cc cc cc cc", where: "RFC 6929, section 9 (attributes only)", rfc: "RFC 6929", section: "9", secret: null, mode: "attributes" }, // RFC 6929, section 9 (attributes only)
});

/** The course-lab packets, by id (built field by field; no secret behind any of their octets). */
export const LAB_PACKETS: Readonly<Record<string, string>> = Object.freeze({
  "lab-8021x-accept": "02 2a 00 49 8d 2e 13 a9 47 b0 6c 51 e2 9f 03 7a\nc4 18 d6 65 40 06 01 00 00 0d 41 06 01 00 00 06\n51 05 01 31 30 1b 06 00 00 0e 10 1d 06 00 00 00\n01 4f 06 03 07 00 04 50 12 1f 8a 6c 0e 5b 32 d9\na4 7e 01 c8 5f 3a 96 b2 d4", // the 802.1X Access-Accept of the course lab (VLAN 10)
  "lab-acct-start": "04 2b 00 58 4c 0f 9e 2a 71 d3 b8 65 5a 02 e7 c1\n93 8f d4 b6 28 06 00 00 00 01 2c 0a 30 30 30 30\n30 30 32 42 01 0a 6e 65 74 61 64 6d 69 6e 20 0c\n53 57 2d 43 4f 52 45 2d 30 31 3d 06 00 00 00 05\n1f 0c 31 39 32 2e 30 2e 32 2e 35 30 2d 06 00 00\n00 01 37 06 6a e9 cc c0", // the accounting Start of the course lab
  "lab-admin-request": "01 2c 00 66 b5 19 3c e0 7a 4d 82 f1 6e 3b 9a 0c\n57 d2 e1 48 01 0a 6e 65 74 61 64 6d 69 6e 02 12\n7e 2c 91 a4 d0 3b 5f 86 e1 a7 09 4c b8 2d 6f 35\n20 0c 53 57 2d 43 4f 52 45 2d 30 31 3d 06 00 00\n00 05 06 06 00 00 00 06 1f 0c 31 39 32 2e 30 2e\n32 2e 35 30 50 12 1f 8a 6c 0e 5b 32 d9 a4 7e 01\nc8 5f 3a 96 b2 d4", // the SSH login request of the course lab
  "lab-cisco-accept": "02 2c 00 45 3a 7f 05 c9 e2 61 8d b4 70 9c 4e 1f\na3 5b 86 d2 06 06 00 00 00 06 1a 19 00 00 00 09\n01 13 73 68 65 6c 6c 3a 70 72 69 76 2d 6c 76 6c\n3d 31 35 50 12 1f 8a 6c 0e 5b 32 d9 a4 7e 01 c8\n5f 3a 96 b2 d4", // the Cisco Access-Accept of the course lab
  "lab-huawei-accept": "02 2d 00 38 5c 1e 7a 93 d2 08 4b f6 a1 7c 3e 95\nb0 4d 28 e1 06 06 00 00 00 06 1a 0c 00 00 07 db\n1d 06 00 00 00 0f 50 12 1f 8a 6c 0e 5b 32 d9 a4\n7e 01 c8 5f 3a 96 b2 d4", // the Huawei Access-Accept of the course lab (HW-Exec-Privilege 15)
});

/** The page's Example (D-83): RFC 2865 section 7.1's Access-Request, verbatim. */
export const EXAMPLE_INPUT: string = RFC_EXAMPLES["rfc2865-7.1-request"].hex; // pinned by the golden vector example-rfc2865-7.1-request

/** The sample chips: [chip id (the label's key), hex, mode]. Every one is a golden-vector input. */
export const SAMPLES: readonly (readonly [string, string, "packet" | "attributes"])[] = [
  ["rfc2865-7.1-accept", RFC_EXAMPLES["rfc2865-7.1-accept"].hex, RFC_EXAMPLES["rfc2865-7.1-accept"].mode], // RFC 2865, section 7.1
  ["rfc2865-7.2-request", RFC_EXAMPLES["rfc2865-7.2-request"].hex, RFC_EXAMPLES["rfc2865-7.2-request"].mode], // RFC 2865, section 7.2
  ["rfc2865-7.3-challenge", RFC_EXAMPLES["rfc2865-7.3-challenge"].hex, RFC_EXAMPLES["rfc2865-7.3-challenge"].mode], // RFC 2865, section 7.3
  ["lab-8021x-accept", LAB_PACKETS["lab-8021x-accept"], "packet"], // the 802.1X Access-Accept of the course lab (VLAN 10)
  ["lab-acct-start", LAB_PACKETS["lab-acct-start"], "packet"], // the accounting Start of the course lab
  ["lab-admin-request", LAB_PACKETS["lab-admin-request"], "packet"], // the SSH login request of the course lab
  ["lab-cisco-accept", LAB_PACKETS["lab-cisco-accept"], "packet"], // the Cisco Access-Accept of the course lab
  ["lab-huawei-accept", LAB_PACKETS["lab-huawei-accept"], "packet"], // the Huawei Access-Accept of the course lab (HW-Exec-Privilege 15)
  ["rfc5997-6.3-status", RFC_EXAMPLES["rfc5997-6.3-status"].hex, RFC_EXAMPLES["rfc5997-6.3-status"].mode], // RFC 5997, section 6.3
  ["rfc5176-7-user-name", RFC_EXAMPLES["rfc5176-7-user-name"].hex, RFC_EXAMPLES["rfc5176-7-user-name"].mode], // RFC 5176, section 7 (the RADIUS octets of its trace)
  ["rfc6929-245.26-evs-long", RFC_EXAMPLES["rfc6929-245.26-evs-long"].hex, RFC_EXAMPLES["rfc6929-245.26-evs-long"].mode], // RFC 6929, section 9 (attributes only)
  ["rfc2865-7.3-request-2-published", RFC_EXAMPLES["rfc2865-7.3-request-2-published"].hex, RFC_EXAMPLES["rfc2865-7.3-request-2-published"].mode], // RFC 2865, section 7.3
];
