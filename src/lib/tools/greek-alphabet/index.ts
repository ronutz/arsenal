// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/greek-alphabet/index.ts — engine surface + tool manifest.
// ============================================================================

export { analyzeGreek, decompose, byNames, hasGreek, run, GreekInputError, LETTERS } from "./compute";
export type { GreekAnalysis, GreekLetter, GreekChar } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { GreekVector, VerifyReport } from "./golden-vectors";

/** Tool manifest. `sources` are surfaced on the tool page as reference links. */
export const manifest = Object.freeze({
  toolSlug: "greek-alphabet",
  /** The Learn article written for this tool. Added 2026-08-12: this manifest
   *  had no learnLinks key at all, so the tool page offered no route back into
   *  the explanation. The link is the tool's OWN article, which is guaranteed
   *  to exist (check-tool-articles enforces it) rather than a judgement call. */
  learnLinks: [
    "learn/greek-alphabet-the-engineers-second-alphabet",
  ],
  sources: [
    { id: "unicode-greek", label: "Unicode — Greek and Coptic block (U+0370..U+03FF)", type: "spec", url: "https://www.unicode.org/charts/PDF/U0370.pdf", access_date: "2026-07-18", scope: "code points, final sigma, accented forms", status: "active" },
    { id: "iso843", label: "ISO 843 / ELOT 743 — transliteration of Greek", type: "spec", url: "https://www.iso.org/standard/5215.html", access_date: "2026-07-18", scope: "the modern romanization scheme", status: "active" },
    { id: "nist-symbols", label: "NIST — Greek letters used as symbols in science", type: "reference", url: "https://physics.nist.gov/cuu/Units/checklist.html", access_date: "2026-07-18", scope: "SI usage (μ, Ω) conventions", status: "active" },
  ],
});
