// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/roman-numerals/index.ts — engine surface + tool manifest.
// ============================================================================

export { analyzeRoman, toRoman, fromRoman, run, RomanInputError } from "./compute";
export type { RomanAnalysis, RomanPlace } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { RomanVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "roman-numerals",
  sources: [
    { id: "britannica-roman", label: "Encyclopaedia Britannica — Roman numeral", type: "reference", url: "https://www.britannica.com/topic/Roman-numeral", access_date: "2026-07-18", scope: "symbols, subtractive principle, history", status: "active" },
    { id: "unicode-numberforms", label: "Unicode — Number Forms block (Roman numeral characters)", type: "spec", url: "https://www.unicode.org/charts/PDF/U2150.pdf", access_date: "2026-07-18", scope: "dedicated Unicode code points vs plain letters", status: "active" },
    { id: "loc-clockfaces", label: "Library of Congress — Why do clock faces use IIII?", type: "reference", url: "https://www.loc.gov/everyday-mysteries/", access_date: "2026-07-18", scope: "the additive IIII tradition", status: "active" },
  ],
});
