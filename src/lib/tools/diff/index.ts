// ============================================================================
// src/lib/tools/diff/index.ts
// ----------------------------------------------------------------------------
// THE SELF-DESCRIBING DIFF MODULE - a {manifest, run, vectors} triple.
//
// run() takes an OBJECT ({a, b, opts}) because a diff needs two inputs, not a
// single pasted string, so it cannot be routed from one token (inputDetector is
// a low-priority heuristic). The engine is synchronous and pure - no Web Crypto,
// no clock, no network. The component imports diffLines and diffWords directly;
// run() is the registry-facing line-diff entry point.
// ============================================================================

import { diffLines, diffWords, type DiffOptions, type DiffResult } from "./compute";
import {
  GOLDEN_VECTOR_SET_ID,
  DIFF_GOLDEN_VECTORS,
  DIFF_WORD_GOLDEN_VECTORS,
} from "./golden-vectors";

export {
  GOLDEN_VECTOR_SET_ID,
  DIFF_GOLDEN_VECTORS,
  DIFF_WORD_GOLDEN_VECTORS,
} from "./golden-vectors";
export { diffLines, diffWords } from "./compute";
export type { DiffOp, DiffLine, WordPart, DiffStats, DiffOptions, DiffResult } from "./compute";

/** The inputs to one line diff. */
export interface DiffInput {
  a: string;
  b: string;
  opts?: DiffOptions;
}

/** The D-49 declarative manifest for the diff tool. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities",
  toolSlug: "diff",
  canonicalAliases: ["text-diff", "diff-checker", "compare-text", "lcs-diff", "unified-diff"],
  inputDetectors: [
    {
      // A diff needs two inputs, so it cannot be routed from one pasted string.
      // A low-priority heuristic carries the example the schema requires.
      kind: "heuristic",
      priority: 1,
      example: "original text vs revised text",
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser",
  executionClass: ["localOnly"],
  apiCapabilityClass: "local-equivalent",

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  dangerousInputHandling: [],
  // The compared text may be private, so a result permalink keeps inputs in the
  // URL fragment, never an indexable path.
  shareSafetyDefault: "fragment",

  // -- Teaching & provenance --
  learnLinks: ["learn/how-diff-works", "learn/reading-a-diff", "learn/diff-word-and-character-level", "learn/diff-three-way-and-merge-conflicts", "learn/diff-minimal-edits"],
  sources: [
    {
      id: "myers1986",
      label: "Myers (1986) - An O(ND) Difference Algorithm and Its Variations (Algorithmica 1:251-266)",
      type: "paper",
      url: "http://www.xmailserver.org/diff2.pdf",
      access_date: "2026-06-30",
      scope: "the LCS / shortest-edit-script algorithm behind diff",
      status: "active",
    },
    {
      id: "posix-diff",
      label: "POSIX diff utility - The Open Group Base Specifications",
      type: "spec",
      url: "https://pubs.opengroup.org/onlinepubs/009695399/utilities/diff.html",
      access_date: "2026-06-30",
      scope: "the diff utility and its minimal change-list output",
      status: "active",
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true },
  ],
});

/**
 * run - the registry-facing entry point. Synchronous and object-input: returns
 * the line diff of A against B under the given options.
 */
export function run(input: DiffInput): DiffResult {
  return diffLines(input.a, input.b, input.opts);
}

export const goldenVectors = DIFF_GOLDEN_VECTORS;
export const wordGoldenVectors = DIFF_WORD_GOLDEN_VECTORS;
