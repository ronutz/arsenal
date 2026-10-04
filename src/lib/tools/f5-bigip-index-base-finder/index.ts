// ============================================================================
// src/lib/tools/f5-bigip-index-base-finder/index.ts
// ----------------------------------------------------------------------------
// ZERO OR ONE ON BIG-IP: the self-describing {manifest, run, vectors} triple.
//
// Look up where each Tcl command, iRules command, configuration object, API
// and on-box tool on a BIG-IP starts counting, with F5's own wording and the
// date each source was read, then translate a position ("the 3rd field") into
// each command's own number and see what the command returns.
//
// Engine: src/lib/tcl84 (Tcl 8.4.6 semantics, the base F5 names for iRules in
// K6091), differential-tested against a real Tcl 8.4.6 interpreter. Local and
// deterministic: nothing leaves the browser.
// ============================================================================

import { run as compute, SOURCES, type IndexBaseInput, type IndexBaseResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and tables.
export type { IndexBaseInput, IndexBaseResult, Base, Area, Confidence, Entry, Source, Question, Row, Note, LookupInput, LookupResult, TranslateInput, TranslateResult } from "./compute";
// The catalogue, the question list and the helpers the page uses.
export { ENTRIES, SOURCES, BASES, AREAS, QUESTIONS, lookup, translate, sourceOf, sourceIntegrity } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "F5 LTM, iRules & platform",
  // The slug.
  toolSlug: "f5-bigip-index-base-finder",
  // Other names it answers to.
  canonicalAliases: ["bigip-zero-or-one", "irules-index-base", "bigip-index-base", "zero-based-or-one-based"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 3, pattern: "\\b(zero|0)[- ]based\\b|\\b(one|1)[- ]based\\b|\\bindex (0|1)\\b", example: "{\"mode\":\"translate\",\"question\":\"segment\",\"value\":\"/api/v2/users\",\"n\":2}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled.
  dangerousInputHandling: ["bounded-parse", "step-limit", "generated-code-only", "never-fetches"],
  // The default for share links.
  shareSafetyDefault: "fragment",
  // The Learn articles written for it.
  learnLinks: ["learn/bigip-zero-or-one"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["f5-irules-string-extract", "f5-irules-string-workbench", "f5-irules-scan-explainer"],
  // Sources, each read live on its access date (the same records the entries cite).
  sources: SOURCES.map((s) => ({ ...s, status: "active" as const })),
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: IndexBaseInput): IndexBaseResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
