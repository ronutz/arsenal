// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/lib/tools/checkpoint-policy-layer-evaluator/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING CHECK POINT ORDERED-LAYER EVALUATOR - the
// {manifest, run, vectors} triple.
//
// Paste a policy of one or more ordered layers, plus a connection to test, and
// watch the layers execute: which rule matched in each, whether an accept
// meant "allowed" or merely "proceed to the next layer", where a drop ended
// evaluation, and where the implicit cleanup rule dropped something without
// logging it.
//
// This is the first native Check Point tool on the site, and it deliberately
// does NOT duplicate the ZIA firewall rule-order simulator. That one teaches
// first-match on a single ordered rule base, which Check Point also does.
// This one teaches the dimension Check Point adds and ZIA does not have:
// SEVERAL rule bases in sequence, each of which must accept.
//
// Bounded, evaluates nothing, contacts nothing. Paired article:
// learn/checkpoint-policy-layers-ordered-and-inline.
// ============================================================================

import { GOLDEN_VECTOR_SET_ID, CP_VECTORS } from "./golden-vectors";

export { evaluatePolicy, parsePolicy, longToIp, CpParseError } from "./compute";
export type {
  CpRule,
  CpLayer,
  CpConnection,
  CpStep,
  CpReport,
  CpFinding,
  Cidr,
} from "./compute";
export { GOLDEN_VECTOR_SET_ID, CP_VECTORS, verifyVectors } from "./golden-vectors";

export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Check Point Quantum",
  toolSlug: "checkpoint-policy-layer-evaluator",
  canonicalAliases: [
    "checkpoint-layers",
    "ordered-layer-evaluator",
    "policy-layer-simulator",
    "checkpoint-inline-layer",
  ],
  inputDetectors: [
    {
      kind: "regex",
      // The tool's own grammar: a "layer <name> ordered|inline" declaration.
      pattern: "^\\s*layer\\s+\\S+\\s+(ordered|inline)\\b",
      priority: 6,
      example: "layer Network ordered",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [
    "No evaluation of any kind: the grammar is parsed into a fixed rule shape and nothing in the input is executed.",
    "No network access. Addresses are matched arithmetically against CIDR masks; nothing is resolved or contacted.",
    "Bounded work: evaluation is linear in the number of rules, and the shadow analysis is pairwise within a layer.",
  ],
  shareSafetyDefault: "fragment",

  // -- What it deliberately does NOT do, stated so nobody assumes otherwise --
  knownLimitations: [
    "Service NAMES are not resolved - 443 is 443, not \"https\". A name table would be a guess about someone's object database.",
    "Shadowing analysis is PAIRWISE: a rule covered jointly by several earlier rules, but by none alone, is not flagged.",
    "IPv4 only.",
    "A deliberately small teaching subset of the rule grammar. Real rules add VPN, content, time, install-on and negation; the layer semantics taught here apply to all of them identically.",
  ],

  sources: [
    {
      id: "cp-ccsa-prep-guide",
      label: "Check Point CCSA R82 Exam Prep Guide",
      type: "vendor-docs",
      url: "https://www.checkpoint.com/downloads/training/CCSA-Exam-Prep-Guide.pdf",
      access_date: "2026-07-26",
      scope:
        "Module 5: the policy layer concept, the traffic inspection flow through layers, and ordered versus inline layers",
      status: "active",
    },
    {
      id: "cp-ccse-prep-guide",
      label: "Check Point CCSE R82 Exam Prep Guide",
      type: "vendor-docs",
      url: "https://www.checkpoint.com/downloads/training/CCSE-Exam-Prep-Guide.pdf",
      access_date: "2026-07-26",
      scope: "Advanced policy management, for the layer behaviour the expert material assumes",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

export const goldenVectors = CP_VECTORS;
