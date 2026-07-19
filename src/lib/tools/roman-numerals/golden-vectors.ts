// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/roman-numerals/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the Roman numerals engine. Values are standard arithmetic
// facts of the subtractive system (verifiable against any reference table);
// the error vectors pin the validator's rules.
// ============================================================================

import { analyzeRoman, RomanInputError } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "roman-numerals-v1";

export interface RomanVector {
  id: string;
  input: string;
  /** Expected value + canonical, or the expected error rule keyword. */
  expect: { value?: number; canonical?: string; isCanonical?: boolean; errorIncludes?: string };
}

export const GOLDEN_VECTORS: RomanVector[] = [
  { id: "v1", input: "1", expect: { value: 1, canonical: "I" } },
  { id: "v2", input: "4", expect: { value: 4, canonical: "IV" } },
  { id: "v3", input: "9", expect: { value: 9, canonical: "IX" } },
  { id: "v4", input: "14", expect: { value: 14, canonical: "XIV" } },
  { id: "v5", input: "40", expect: { value: 40, canonical: "XL" } },
  { id: "v6", input: "90", expect: { value: 90, canonical: "XC" } },
  { id: "v7", input: "400", expect: { value: 400, canonical: "CD" } },
  { id: "v8", input: "900", expect: { value: 900, canonical: "CM" } },
  { id: "v9", input: "1994", expect: { value: 1994, canonical: "MCMXCIV" } },
  { id: "v10", input: "2026", expect: { value: 2026, canonical: "MMXXVI" } },
  { id: "v11", input: "3999", expect: { value: 3999, canonical: "MMMCMXCIX" } },
  { id: "v12", input: "MMXXVI", expect: { value: 2026, canonical: "MMXXVI", isCanonical: true } },
  { id: "v13", input: "mcmxciv", expect: { value: 1994, canonical: "MCMXCIV", isCanonical: true } },
  // Historical additive spelling: valid, valued, flagged non-canonical.
  { id: "v14", input: "IIII", expect: { value: 4, canonical: "IV", isCanonical: false } },
  { id: "v15", input: "MDCCCCX", expect: { value: 1910, canonical: "MCMX", isCanonical: false } },
  // Rule breakers.
  { id: "e1", input: "IL", expect: { errorIncludes: "subtractive pair" } },
  { id: "e2", input: "VX", expect: { errorIncludes: "subtractive pair" } },
  { id: "e3", input: "IIX", expect: { errorIncludes: "single symbol" } },
  { id: "e4", input: "VV", expect: { errorIncludes: "never repeats" } },
  { id: "e5", input: "0", expect: { errorIncludes: "no zero" } },
  { id: "e6", input: "4000", expect: { errorIncludes: "vinculum" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

/** Re-run every vector against the engine; used by tests and the API. */
export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = analyzeRoman(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error, got value ${r.value}`); continue; }
      if (v.expect.value !== undefined && r.value !== v.expect.value) failures.push(`${v.id}: value ${r.value} != ${v.expect.value}`);
      if (v.expect.canonical && r.canonical !== v.expect.canonical) failures.push(`${v.id}: canonical ${r.canonical} != ${v.expect.canonical}`);
      if (v.expect.isCanonical !== undefined && r.isCanonical !== v.expect.isCanonical) failures.push(`${v.id}: isCanonical ${r.isCanonical} != ${v.expect.isCanonical}`);
    } catch (e) {
      if (!(e instanceof RomanInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error "${e.message}" lacks "${v.expect.errorIncludes}"`);
    }
  }
  return { pass: failures.length === 0, failures };
}
