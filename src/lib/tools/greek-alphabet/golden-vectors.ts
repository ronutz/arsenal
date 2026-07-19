// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/greek-alphabet/golden-vectors.ts
// ============================================================================

import { analyzeGreek, GreekInputError, LETTERS } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "greek-alphabet-v1";

export interface GreekVector {
  id: string;
  input: string;
  expect: { translit?: string; names?: string[]; glyphs?: string[]; errorIncludes?: string };
}

export const GOLDEN_VECTORS: GreekVector[] = [
  { id: "v1", input: "μ", expect: { names: ["mu"], translit: "m" } },
  { id: "v2", input: "Ω", expect: { names: ["omega"], translit: "O" } },
  { id: "v3", input: "ΤΕΧΝΗ", expect: { translit: "TECHNI" } },
  { id: "v4", input: "λόγος", expect: { translit: "logos" } },
  { id: "v5", input: "άλφα", expect: { translit: "alfa" } },
  { id: "v6", input: "lambda", expect: { glyphs: ["λ"] } },
  { id: "v7", input: "mu omega", expect: { glyphs: ["μ", "ω"] } },
  { id: "v8", input: "Pi", expect: { glyphs: ["π"] } },
  { id: "e1", input: "qwerty", expect: { errorIncludes: "not a Greek letter name" } },
];

export interface VerifyReport { pass: boolean; failures: string[] }

export function verifyVectors(): VerifyReport {
  const failures: string[] = [];
  if (LETTERS.length !== 24) failures.push(`alphabet: ${LETTERS.length} letters != 24`);
  for (const v of GOLDEN_VECTORS) {
    try {
      const r = analyzeGreek(v.input);
      if (v.expect.errorIncludes) { failures.push(`${v.id}: expected error`); continue; }
      if (v.expect.translit !== undefined) {
        const t = r.kind === "decompose" ? r.transliteration : undefined;
        if (t !== v.expect.translit) failures.push(`${v.id}: translit "${t}" != "${v.expect.translit}"`);
      }
      if (v.expect.names) {
        const names = r.kind === "decompose" ? r.chars!.filter((c) => c.isLetter).map((c) => c.name) : r.letters!.map((l) => l.name);
        if (JSON.stringify(names) !== JSON.stringify(v.expect.names)) failures.push(`${v.id}: names ${names} != ${v.expect.names}`);
      }
      if (v.expect.glyphs) {
        const g = r.letters!.map((l) => l.lower);
        if (JSON.stringify(g) !== JSON.stringify(v.expect.glyphs)) failures.push(`${v.id}: glyphs ${g} != ${v.expect.glyphs}`);
      }
    } catch (e) {
      if (!(e instanceof GreekInputError)) { failures.push(`${v.id}: unexpected ${String(e)}`); continue; }
      if (!v.expect.errorIncludes) { failures.push(`${v.id}: unexpected error ${e.message}`); continue; }
      if (!e.message.includes(v.expect.errorIncludes)) failures.push(`${v.id}: error mismatch`);
    }
  }
  return { pass: failures.length === 0, failures };
}
