// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/labs/payload-byte-offsets/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the payload byte-offsets lab (set 2026-10-26a). The two
// cases marked "checked" were run in the original interactive model on
// 2026-10-26 and compared figure for figure: "ação" is 4 code points and 6
// octets, and 8 KiB on 1,000 connections is 7.8 MiB; "Olá" is 3 code points
// and 4 octets, and 64 KiB on 2,000 connections is 125 MiB. The rest are worked
// by hand from RFC 3629's octet ranges. Reject vectors pin the stable error
// codes. verifyVectors() runs them all; scripts/run-golden-vectors runs it at
// prebuild and fails the build on any drift.
// ============================================================================

import { compute, PayloadError, type PayloadErrorCode, type PayloadInput, type PayloadResult } from "./compute";

/** The set's dated id: bump it whenever a vector or the model changes. */
export const GOLDEN_VECTOR_SET_ID = "payload-byte-offsets/2026-10-26a";

/** A case the model must answer exactly so (every listed field compared). */
interface AcceptVector {
  /** Short stable name. */
  id: string;
  /** The reader's settings. */
  input: PayloadInput;
  /** The fields of the result that must match. */
  expect: Partial<PayloadResult>;
}

/** A case the model must refuse with a given code. */
interface RejectVector {
  /** Short stable name. */
  id: string;
  /** Settings outside the lab's range. */
  input: PayloadInput;
  /** The code the refusal must carry. */
  code: PayloadErrorCode;
}

/** The accept cases. */
export const PAYLOAD_VECTORS: readonly AcceptVector[] = Object.freeze([
  // Checked: two two-octet letters make four code points six octets; 8 KiB on 1,000 connections is 8,192,000 bytes, 7.8125 MiB.
  { id: "checked-acao-8k-1000", input: { text: "ação", find: "", collectKiB: 8, connections: 1000 }, expect: { codePoints: 4, octets: 6, multibyte: true, found: null, charIndex: null, byteOffset: null, findCodePoints: null, findOctets: null, offsetsDiffer: false, collectBytes: 8192, memoryBytes: 8192000, memoryMiB: 7.8125 } },
  // Checked: one two-octet letter makes three code points four octets; 64 KiB on 2,000 connections is 125 MiB exactly.
  { id: "checked-ola-64k-2000", input: { text: "Olá", find: "", collectKiB: 64, connections: 2000 }, expect: { codePoints: 3, octets: 4, multibyte: true, collectBytes: 65536, memoryBytes: 131072000, memoryMiB: 125 } },
  // The opening state: plain ASCII, so the character index and the octet offset agree.
  { id: "ascii-agree", input: { text: "Hello, world", find: "world", collectKiB: 8, connections: 1000 }, expect: { codePoints: 12, octets: 12, multibyte: false, found: true, charIndex: 7, byteOffset: 7, findCodePoints: 5, findOctets: 5, offsetsDiffer: false } },
  // The Example: a three-octet euro sign moves the octet offset two past the character index, and "café" is five octets.
  { id: "euro-cafe", input: { text: "Price: €100, café included", find: "café", collectKiB: 64, connections: 2000 }, expect: { codePoints: 26, octets: 29, multibyte: true, found: true, charIndex: 13, byteOffset: 15, findCodePoints: 4, findOctets: 5, offsetsDiffer: true } },
  // A four-octet character outside the Basic Multilingual Plane is one code point (two UTF-16 units in a JavaScript string).
  { id: "astral-one-code-point", input: { text: "😀", find: "😀", collectKiB: 1, connections: 1 }, expect: { codePoints: 1, octets: 4, found: true, charIndex: 0, byteOffset: 0, findCodePoints: 1, findOctets: 4, offsetsDiffer: true, memoryBytes: 1024 } },
  // A piece that is not in the text: searched, not found, no positions.
  { id: "not-found", input: { text: "Hello, world", find: "café", collectKiB: 8, connections: 1000 }, expect: { found: false, charIndex: null, byteOffset: null, findCodePoints: 4, findOctets: 5, offsetsDiffer: false } },
  // The range boundaries: U+007F is one octet, U+0080 two, U+07FF two, U+0800 three.
  { id: "range-boundaries", input: { text: "\u007f\u0080߿ࠀ", find: "ࠀ", collectKiB: 1, connections: 1 }, expect: { codePoints: 4, octets: 8, charIndex: 3, byteOffset: 5, findOctets: 3, offsetsDiffer: true } },
]);

/** The reject cases. */
export const PAYLOAD_REJECTS: readonly RejectVector[] = Object.freeze([
  // More code points than the lab measures.
  { id: "too-long", input: { text: "a".repeat(201), find: "", collectKiB: 8, connections: 1 }, code: "too-long" },
  // A lone high surrogate has no UTF-8 encoding.
  { id: "lone-surrogate", input: { text: "\ud800", find: "", collectKiB: 8, connections: 1 }, code: "bad-text" },
  // A collect of zero KiB.
  { id: "zero-collect", input: { text: "abc", find: "", collectKiB: 0, connections: 1 }, code: "bad-collect" },
  // A collect that is not a whole number of KiB.
  { id: "fractional-collect", input: { text: "abc", find: "", collectKiB: 1.5, connections: 1 }, code: "bad-collect" },
  // No connections at all.
  { id: "zero-connections", input: { text: "abc", find: "", collectKiB: 8, connections: 0 }, code: "bad-connections" },
]);

/** Run every vector; return the failures (an empty list is a pass). */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  // Collected failures, one sentence each.
  const failures: string[] = [];
  // Each accept case: compute and compare every expected field.
  for (const v of PAYLOAD_VECTORS) {
    // The model's answer, or the refusal it should not have made.
    let got: PayloadResult;
    // Run it.
    try {
      // Should not throw.
      got = compute(v.input);
    } catch (e) {
      // An unexpected refusal fails the case.
      failures.push(`${v.id}: refused with ${e instanceof PayloadError ? e.code : String(e)}`);
      // Nothing to compare.
      continue;
    }
    // Each expected field in turn.
    for (const [k, want] of Object.entries(v.expect)) {
      // The answer's value for that field.
      const have = got[k as keyof PayloadResult];
      // A difference is a failure naming the case and the field.
      if (have !== want) failures.push(`${v.id}: ${k} is ${String(have)}, expected ${String(want)}`);
    }
  }
  // Each reject case: it must throw with the right code.
  for (const r of PAYLOAD_REJECTS) {
    // The code it threw with, or null when it did not throw.
    let code: string | null = null;
    // Run it and catch the refusal.
    try {
      // Should throw.
      compute(r.input);
    } catch (e) {
      // Our error carries a code; anything else is reported as such.
      code = e instanceof PayloadError ? e.code : `unexpected ${String(e)}`;
    }
    // Wrong code or no refusal is a failure.
    if (code !== r.code) failures.push(`${r.id}: refused with ${String(code)}, expected ${r.code}`);
  }
  // The report in the shape the runner reads.
  const total = PAYLOAD_VECTORS.length + PAYLOAD_REJECTS.length;
  // Passed is everything that did not fail (floored at zero).
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: Math.max(0, total - failures.length), failures };
}
