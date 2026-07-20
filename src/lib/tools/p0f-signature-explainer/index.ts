// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/p0f-signature-explainer/index.ts — engine surface + manifest.
// ============================================================================

export { analyzeP0f, parseP0f, run, P0fInputError } from "./compute";
export type { P0fAnalysis, P0fFields, FieldNote, OptionNote, QuirkNote, OsHint } from "./compute";
export { GOLDEN_VECTOR_SET_ID, GOLDEN_VECTORS, verifyVectors } from "./golden-vectors";
export type { P0fVector, VerifyReport } from "./golden-vectors";

export const manifest = Object.freeze({
  toolSlug: "p0f-signature-explainer",
  sources: [
    { id: "p0f-readme", label: "p0f v3 — signature format (docs/README)", type: "spec", url: "https://github.com/p0f/p0f/blob/master/docs/README", access_date: "2026-07-19", scope: "the ver:ittl:olen:mss:wsize,scale:olayout:quirks:pclass grammar, option tokens, quirk flags", status: "active" },
    { id: "p0f-db", label: "p0f — bundled p0f.fp signature database", type: "reference", url: "https://github.com/p0f/p0f/blob/master/p0f.fp", access_date: "2026-07-19", scope: "the reference OS signatures used for the family hints", status: "active" },
  ],
});
