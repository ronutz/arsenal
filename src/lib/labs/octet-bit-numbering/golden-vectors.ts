// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/octet-bit-numbering/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the octet bit numbering lab (set 2026-11-08). Each case is
// worked by hand from the article's rules: RFC 791's 1 0 1 0 1 0 1 0 is 170;
// Huawei's PortState 10111100, printed Bit 1 first, is 0x3D, and read as if it
// were written most significant bit first it is 0xBC; the MAC first octet 0x01
// has I/G set (a group address) and 0x02 has U/L set (local); TCP's SYN and
// ACK are 0x02 and 0x10, so SYN+ACK is 0x12; Huawei's Unselect row 10100000 is
// 0x05 (LACP_Activity and Aggregation). Reject vectors pin the stable error
// codes. verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on drift.
// ============================================================================

import { compute, toggle, OctetError, type OctetErrorCode, type OctetInput, type OctetResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "octet-bit-numbering/2026-11-08";

/** A case the model must answer exactly so (every listed field compared as JSON). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: OctetInput;
  /** The fields of the result that must match. */
  expect: Partial<OctetResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range (cast where the interface could never send them). */
  input: OctetInput;
  /** The code the refusal must carry. */
  code: OctetErrorCode;
}

/** The accept cases. */
export const OCTET_VECTORS: readonly AcceptVector[] = Object.freeze([
  // RFC 791 Appendix B: the octet drawn 1 0 1 0 1 0 1 0 is 170; LSB first on the wire it is 01010101, misread 0x55.
  { id: "rfc791-170", input: { value: 170, readAs: "none" }, expect: { hex: "0xAA", decimal: 170, rfcDrawing: "10101010", wireOrder: "01010101", misread: { hex: "0x55", decimal: 85 }, ones: 4, setNames: [], mac: null } },
  // Huawei's PortState: 0x3D is printed Bit 1 first as 10111100; misread most significant first it is 0xBC.
  { id: "huawei-3d", input: { value: 0x3d, readAs: "lacp" }, expect: { hex: "0x3D", rfcDrawing: "00111101", wireOrder: "10111100", misread: { hex: "0xBC", decimal: 188 }, setNames: ["LACP_Activity", "Aggregation", "Synchronization", "Collecting", "Distributing"] } },
  // Huawei's Unselect actor row 10100000: LACP_Activity and Aggregation, 0x05.
  { id: "huawei-05", input: { value: 0x05, readAs: "lacp" }, expect: { wireOrder: "10100000", setNames: ["LACP_Activity", "Aggregation"] } },
  // A MAC first octet with I/G set: a group address, universal.
  { id: "mac-group", input: { value: 0x01, readAs: "mac" }, expect: { mac: { group: true, local: false }, setNames: ["I/G"], wireOrder: "10000000" } },
  // A MAC first octet with U/L set: local, individual.
  { id: "mac-local", input: { value: 0x02, readAs: "mac" }, expect: { mac: { group: false, local: true }, setNames: ["U/L"] } },
  // RFC 2469's 12: local (U/L), individual; bit-reversed it is 0x48, which reads as universal.
  { id: "mac-12", input: { value: 0x12, readAs: "mac" }, expect: { mac: { group: false, local: true }, misread: { hex: "0x48", decimal: 72 } } },
  // TCP SYN and ACK: 0x12.
  { id: "tcp-synack", input: { value: 0x12, readAs: "tcp" }, expect: { setNames: ["SYN", "ACK"], ones: 2 } },
  // The top bit alone: MSB 0's bit 0, LSB 0's bit 7, 1-based bit 8, weight 128.
  { id: "top-bit", input: { value: 0x80, readAs: "none" }, expect: { bits: [{ lsb0: 7, msb0: 0, one: 8, weight: 128, set: true, name: null }, { lsb0: 6, msb0: 1, one: 7, weight: 64, set: false, name: null }, { lsb0: 5, msb0: 2, one: 6, weight: 32, set: false, name: null }, { lsb0: 4, msb0: 3, one: 5, weight: 16, set: false, name: null }, { lsb0: 3, msb0: 4, one: 4, weight: 8, set: false, name: null }, { lsb0: 2, msb0: 5, one: 3, weight: 4, set: false, name: null }, { lsb0: 1, msb0: 6, one: 2, weight: 2, set: false, name: null }, { lsb0: 0, msb0: 7, one: 1, weight: 1, set: false, name: null }], wireOrder: "00000001", misread: { hex: "0x01", decimal: 1 } } },
  // Zero and all ones read the same either way.
  { id: "zero", input: { value: 0, readAs: "none" }, expect: { hex: "0x00", misread: { hex: "0x00", decimal: 0 }, ones: 0 } },
  // All ones, read as the TCP flags: every flag, least significant (FIN) first.
  { id: "all-ones", input: { value: 255, readAs: "tcp" }, expect: { hex: "0xFF", misread: { hex: "0xFF", decimal: 255 }, ones: 8, setNames: ["FIN", "SYN", "RST", "PSH", "ACK", "URG", "ECE", "CWR"] } },
]);

/** The reject cases. */
export const OCTET_REJECTS: readonly RejectVector[] = Object.freeze([
  // Above one octet.
  { id: "bad-256", input: { value: 256, readAs: "none" }, code: "bad-value" },
  // Not a whole number.
  { id: "bad-fraction", input: { value: 1.5, readAs: "none" }, code: "bad-value" },
  // Negative.
  { id: "bad-negative", input: { value: -1, readAs: "none" }, code: "bad-value" },
  // A reading the select cannot produce.
  { id: "bad-choice", input: { value: 1, readAs: "dns" as unknown as "none" }, code: "bad-choice" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of OCTET_VECTORS) {
    // The model's answer.
    const got = compute(v.input);
    // Each expected field in turn, compared as JSON.
    for (const [k, want] of Object.entries(v.expect)) {
      // The field as computed.
      const have = got[k as keyof OctetResult];
      // A difference is a failure naming the case and the field.
      if (JSON.stringify(have) !== JSON.stringify(want)) failures.push(`${v.id}: ${k} is ${JSON.stringify(have)}, expected ${JSON.stringify(want)}`);
    }
  }
  // Toggling: flipping bit 0 of 0x3C gives 0x3D, flipping bit 7 of 0x3D gives 0xBD.
  if (toggle(0x3c, 0) !== 0x3d || toggle(0x3d, 7) !== 0xbd) failures.push("toggle: a flip did not change exactly one bit");
  // Each reject case: it must throw with the right code.
  for (const r of OCTET_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof OctetError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads (the toggle check counts as one case).
  const total = OCTET_VECTORS.length + OCTET_REJECTS.length + 1;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
