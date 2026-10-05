// ============================================================================
// src/lib/tools/css-specificity-calculator/index.ts
// ----------------------------------------------------------------------------
// THE CSS SPECIFICITY CALCULATOR: the self-describing {manifest, run, vectors} triple.
//
// One or more selectors in; out comes each one's (A, B, C) with every simple
// selector named and its column shown, the selectors ranked the way the
// cascade ranks them, ties noted, and the special rules of Selectors Level 4
// (:is(), :where(), :not(), :has(), :nth-child(of), the universal selector,
// repeated selectors, legacy pseudo-elements) and of the Shadow module
// (:host(), ::slotted()) spelled out. Pure parsing, local and deterministic.
// ============================================================================

import { run as compute, type SpecificityInput, type SpecificityResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and helpers.
export type { SpecificityInput, SpecificityResult, SelectorAnalysis, Piece, PieceKind, Specificity } from "./compute";
// The single-selector analyser and the comparison, for pages that need them.
export { analyseSelector, compare, SELECTORS_MAX_CHARS } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Web front-end & CSS",
  // The slug.
  toolSlug: "css-specificity-calculator",
  // Other names it answers to.
  canonicalAliases: ["specificity", "css-specificity", "selector-specificity", "specificity-calculator"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "^\\s*[.#]?[-\\w]+(\\s*[>+~]\\s*|\\s+)?[-\\w.#:\\[\\]*]*\\s*\\{", example: "{\"selectors\":\"nav a:hover\\n#site-nav a\\n.nav .link\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed by grammar, nothing evaluated.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches"],
  // The default for share links: selectors carry nothing private.
  shareSafetyDefault: "safe",
  // The Learn articles written for it.
  learnLinks: ["learn/css-specificity-and-the-cascade"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["color-contrast-format", "http-message-decoder", "regex"],
  // Sources, each read live on its access date.
  sources: [
    // Selectors Level 4: the counting rules and examples.
    { id: "selectors-4", label: "Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity", type: "standard", url: "https://www.w3.org/TR/selectors-4/#specificity-rules", access_date: "2026-10-05", scope: "A counts ID selectors, B class, attribute and pseudo-class selectors, C type selectors and pseudo-elements, the universal selector ignored; :is(), :not() and :has() take the most specific argument; :nth-child() and :nth-last-child() count as one pseudo-class plus their argument; :where() is zero; comparison column by column; repeated occurrences increase specificity; the examples table", status: "active" },
    // CSS Cascade Level 5: where specificity sits.
    { id: "css-cascade-5", label: "CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: 6.1 Cascade Sorting Order", type: "standard", url: "https://www.w3.org/TR/css-cascade-5/#cascade-sort", access_date: "2026-10-05", scope: "origin and importance, context, element-attached styles, cascade layers, specificity, order of appearance, in descending order of priority; each declaration has the specificity of its style rule", status: "active" },
    // CSS Shadow Module Level 1: :host and ::slotted.
    { id: "css-shadow-1", label: "CSS Shadow Module Level 1, Editor's Draft 28 April 2026: the specificity of :host, :host(), :host-context() and ::slotted()", type: "draft", url: "https://drafts.csswg.org/css-shadow-1/", access_date: "2026-10-05", scope: ":host is a pseudo-class; :host() and :host-context() are a pseudo-class plus the argument; ::slotted() is a pseudo-element plus the argument; ::part() deferred to CSS Pseudo-Elements Level 4", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: SpecificityInput): SpecificityResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
