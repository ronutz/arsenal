// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Vectors for the DLP match predictor.
//
// The card numbers are the PUBLISHED TEST VALUES that every payment processor
// documents for exactly this purpose; the CPF and CNPJ values are the standard
// worked examples used to demonstrate the check-digit algorithms. None is a
// real person's or a real cardholder's data, and none should ever be replaced
// with one.
//
// The set is built around the three stages that fail separately - no
// candidates, candidates that fail the checksum, and matches below threshold -
// because telling them apart is the entire purpose of the tool.
// ============================================================================

import { predictMatches, type DlpResult, type IdentifierKind } from "./compute";

export const GOLDEN_VECTOR_SET_ID = "netskope-dlp-match-predictor-golden-v1";

export interface DlpVector {
  id: string;
  description: string;
  text: string;
  kind: IdentifierKind;
  threshold: number;
  expectOk?: boolean;
  expectErrorIncludes?: string;
  expectCandidates?: number;
  expectMatches?: number;
  expectFires?: boolean;
  expectStage?: DlpResult["failedStage"];
  expectFindingIncludes?: string;
}

export const DLP_VECTORS: DlpVector[] = [
  {
    id: "valid-card-fires",
    description: "A published Visa test number, formatted in groups, meets a threshold of one.",
    text: "Card on file: 4111 1111 1111 1111",
    kind: "payment-card",
    threshold: 1,
    expectOk: true,
    expectCandidates: 1,
    expectMatches: 1,
    expectFires: true,
    expectStage: null,
  },
  {
    id: "checksum-stage-failure",
    description:
      "THE false-negative complaint: a sixteen-digit string that looks exactly like a card, fails Luhn, and is therefore not counted at all.",
    text: "Purchase order 1234567812345678 approved",
    kind: "payment-card",
    threshold: 1,
    expectOk: true,
    expectCandidates: 1,
    expectMatches: 0,
    expectFires: false,
    expectStage: "checksum",
  },
  {
    id: "threshold-stage-failure",
    description:
      "The identifier worked and the rule still did nothing, because it is set to require more.",
    text: "Card on file: 4111 1111 1111 1111",
    kind: "payment-card",
    threshold: 3,
    expectOk: true,
    expectMatches: 1,
    expectFires: false,
    expectStage: "threshold",
  },
  {
    id: "no-candidates-stage",
    description: "Nothing of the right shape, so the checksum never runs.",
    text: "There is no sensitive content in this sentence.",
    kind: "payment-card",
    threshold: 1,
    expectOk: true,
    expectCandidates: 0,
    expectFires: false,
    expectStage: "no-candidates",
  },
  {
    id: "mixed-valid-and-invalid",
    description:
      "Two candidates, one valid. The gap between what a person would count and what the engine counts is the finding.",
    text: "Cards 4111111111111111 and 4111111111111112 were submitted.",
    kind: "payment-card",
    threshold: 1,
    expectOk: true,
    expectCandidates: 2,
    expectMatches: 1,
    expectFires: true,
    expectFindingIncludes: "not the count a person reading the document would make",
  },
  {
    id: "second-published-test-card",
    description: "A published Mastercard test number, to show the rule is not Visa-specific.",
    text: "5500005555555559",
    kind: "payment-card",
    threshold: 1,
    expectOk: true,
    expectMatches: 1,
    expectFires: true,
  },
  {
    id: "cpf-formatted",
    description: "A CPF written with its usual punctuation is found and validated.",
    text: "CPF do titular: 529.982.247-25",
    kind: "cpf",
    threshold: 1,
    expectOk: true,
    expectCandidates: 1,
    expectMatches: 1,
    expectFires: true,
  },
  {
    id: "cpf-transposed-digit",
    description: "One digit changed and the check digits no longer agree.",
    text: "529.982.247-24",
    kind: "cpf",
    threshold: 1,
    expectOk: true,
    expectMatches: 0,
    expectStage: "checksum",
  },
  {
    id: "cpf-repeated-digits-rejected",
    description:
      "A repeated-digit sequence satisfies the arithmetic but is never issued, so it must not count.",
    text: "111.111.111-11",
    kind: "cpf",
    threshold: 1,
    expectOk: true,
    expectMatches: 0,
    expectStage: "checksum",
  },
  {
    id: "cnpj-formatted",
    description: "A CNPJ with its punctuation, validated against both check digits.",
    text: "CNPJ 11.222.333/0001-81",
    kind: "cnpj",
    threshold: 1,
    expectOk: true,
    expectMatches: 1,
    expectFires: true,
  },
  {
    id: "cnpj-invalid",
    description: "The second check digit disagrees.",
    text: "11.222.333/0001-82",
    kind: "cnpj",
    threshold: 1,
    expectOk: true,
    expectMatches: 0,
    expectStage: "checksum",
  },
  {
    id: "duplicates-counted-once",
    description:
      "The same number twice is one match, because counting it twice would inflate every threshold decision.",
    text: "4111111111111111 and again 4111 1111 1111 1111",
    kind: "payment-card",
    threshold: 2,
    expectOk: true,
    expectMatches: 1,
    expectFires: false,
    expectStage: "threshold",
  },
  {
    id: "error-threshold-zero",
    description: "A threshold below one is not a threshold.",
    text: "4111111111111111",
    kind: "payment-card",
    threshold: 0,
    expectOk: false,
    expectErrorIncludes: "at least 1",
  },
];

/** Run every vector. Returns failures, empty when all pass. */
export function verifyVectors(): string[] {
  const failures: string[] = [];
  for (const v of DLP_VECTORS) {
    let r: DlpResult | null = null;
    let error: string | null = null;
    try {
      r = predictMatches(v.text, v.kind, v.threshold);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    if (v.expectOk === false) {
      if (!error) failures.push(`${v.id}: expected an error, got a result`);
      else if (v.expectErrorIncludes && !error.includes(v.expectErrorIncludes)) {
        failures.push(`${v.id}: error "${error}" does not mention "${v.expectErrorIncludes}"`);
      }
      continue;
    }
    if (error) {
      failures.push(`${v.id}: unexpected error "${error}"`);
      continue;
    }
    if (!r) {
      failures.push(`${v.id}: no result`);
      continue;
    }
    if (v.expectCandidates !== undefined && r.candidates.length !== v.expectCandidates) {
      failures.push(`${v.id}: ${r.candidates.length} candidates, expected ${v.expectCandidates}`);
    }
    if (v.expectMatches !== undefined && r.matchCount !== v.expectMatches) {
      failures.push(`${v.id}: ${r.matchCount} matches, expected ${v.expectMatches}`);
    }
    if (v.expectFires !== undefined && r.fires !== v.expectFires) {
      failures.push(`${v.id}: fires ${r.fires}, expected ${v.expectFires}`);
    }
    if (v.expectStage !== undefined && r.failedStage !== v.expectStage) {
      failures.push(`${v.id}: stage ${r.failedStage}, expected ${v.expectStage}`);
    }
    if (v.expectFindingIncludes && !r.findings.some((f) => f.includes(v.expectFindingIncludes!))) {
      failures.push(`${v.id}: no finding mentioning "${v.expectFindingIncludes}"`);
    }
  }
  return failures;
}
