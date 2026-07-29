// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// THE SELF-DESCRIBING DLP MATCH PREDICTOR - {manifest, run, vectors}.
//
// Separates the three stages of a DLP decision because they fail separately:
// candidates found, checksum passed, threshold reached. A rule that did not
// fire failed at exactly one of them, and which one tells you what to change.
//
// Paired article: learn/dlp-checksums-and-why-the-rule-did-not-fire.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, DLP_VECTORS } from "./golden-vectors";

export { predictMatches, luhnValid, cpfValid, cnpjValid, DlpParseError } from "./compute";
export type { DlpResult, DlpCandidate, IdentifierKind } from "./compute";
export { GOLDEN_VECTOR_SET_ID, DLP_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  toolFamily: "Netskope",
  toolSlug: "netskope-dlp-match-predictor",
  canonicalAliases: ["dlp-false-positive", "luhn-checker", "cpf-cnpj-validator"],
  inputDetectors: [],

  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "Everything stays in the browser. Text pasted here is never transmitted, stored or logged - which matters more for this tool than for most, because the whole point is pasting content you suspect is sensitive.",
    "No network access of any kind.",
    "Arithmetic only: a fixed shape scan followed by a checksum. Nothing is executed.",
  ],
  shareSafetyDefault: "never",

  knownLimitations: [
    "*** THIS IS NOT NETSKOPE'S ENGINE. *** It models the checksum step, which is the one that surprises people. Proximity keywords, dictionaries, document fingerprinting, exact data match, OCR and file-type detection are all out of scope and none of them is approximated here.",
    "Three identifiers only - payment card, CPF and CNPJ - because those are the ones whose validation is a published, unambiguous algorithm. An identifier whose rules are not public cannot be modelled honestly.",
    "Shape detection is deliberately simple. A production engine finds candidates this will miss, so a result of zero candidates means 'this tool found none', not 'the platform would find none'.",
    "It counts a repeated number once. Whether a given platform counts occurrences or distinct values changes threshold behaviour, and that is a configuration question this does not model.",
  ],

  sources: [
    {
      id: "iso-7812-luhn",
      label: "ISO/IEC 7812: identification cards, issuer identification, and the Luhn check digit",
      type: "standard",
      url: "https://www.iso.org/standard/70484.html",
      access_date: "2026-07-28",
      scope: "the Luhn algorithm as the check-digit scheme for payment card numbers",
      status: "active",
    },
    {
      id: "netskope-dlp-predefined",
      label: "Netskope: predefined DLP data identifiers",
      type: "vendor-docs",
      url: "https://docs.netskope.com/en/netskope-help/data-security/data-loss-prevention/",
      access_date: "2026-07-28",
      scope:
        "that predefined identifiers combine a pattern with validation, and that rules act on a match count rather than on candidates",
      status: "active",
    },
  ],
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

export const goldenVectors = DLP_VECTORS;
