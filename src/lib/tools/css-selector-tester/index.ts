// ============================================================================
// src/lib/tools/css-selector-tester/index.ts
// ----------------------------------------------------------------------------
// THE CSS SELECTOR TESTER: the self-describing {manifest, run, vectors} triple.
//
// HTML and selectors in; out come the matched elements (highlighted in the
// parsed tree with path and line), each selector's count, specificity, parse
// error or notes. parse5 for the tree, an in-house Selectors Level 4 matcher
// checked against Chromium's querySelectorAll (139 of 146 vector selectors
// agree; the seven differences are documented and deliberate). Inert, local,
// deterministic.
// ============================================================================

import { run as compute, type SelectorTestInput, type SelectorTestResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and constants.
export type { SelectorTestInput, SelectorTestResult, SelectorReport, ElementRow } from "./compute";
export { HTML_MAX_CHARS, SELECTORS_MAX_CHARS, SELECTORS_MAX_LINES, MATCHES_MAX_LISTED, CASE_INSENSITIVE_ATTRS, splitSelectors } from "./compute";
export { parseSelectorList, parseNth, SelectorError } from "./selector";
export type { SelectorList, Complex, Compound, Simple, Combinator, Nth, Relative, PseudoElement } from "./selector";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Web front-end & CSS",
  // The slug.
  toolSlug: "css-selector-tester",
  // Other names it answers to.
  canonicalAliases: ["selector-tester", "css-selectors", "queryselector", "selector-matcher"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 1, pattern: "^[.#]?[-\\w]+(?:[ >+~][.#]?[-\\w]+)*(?::[a-z-]+(?:\\([^)]*\\))?)*$", example: "{\"html\":\"<ul><li class=\\\"a\\\">one</li><li>two</li></ul>\",\"selectors\":\"li.a\\nli:nth-child(2)\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed inertly, never executed, never fetched, never rendered.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-renders"],
  // The default for share links: pasted HTML may carry anything.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/how-a-selector-finds-its-elements"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["html-structure-explainer", "css-specificity-calculator", "color-contrast-format", "regex"],
  // Sources, each read live on its access date.
  sources: [
    { id: "selectors-4", label: "Selectors Level 4, W3C Working Draft 22 January 2026", type: "standard", url: "https://www.w3.org/TR/selectors-4/", access_date: "2026-10-05", scope: "3.7 case sensitivity; 3.9 invalid selectors; 4 logical combinations (:is, :not, :where, :has); 5 elemental selectors; 6 attribute selectors with the i and s flags; 7.2 :lang(); 8 location pseudo-classes; 9 user-action pseudo-classes never match in non-interactive user agents; 12 input pseudo-classes; 13 tree-structural pseudo-classes including :nth-child(An+B of S); 14 combinators; 15 specificity; 16.1 forgiving selector lists; 17.3 matching right to left", status: "active" },
    { id: "css-syntax-3", label: "CSS Syntax Module Level 3, W3C Candidate Recommendation Draft 1 October 2026", type: "standard", url: "https://www.w3.org/TR/css-syntax-3/", access_date: "2026-10-05", scope: "4.3.5 a string ended by the end of input is a parse error and is still returned; 4.3.7 a hex escape consumes one following whitespace; 5.5.9 and 5.5.10 a block or function left open is closed at the end of input", status: "active" },
    { id: "html-selectors", label: "HTML Living Standard (WHATWG): Case-sensitivity of selectors; the pseudo-classes :enabled, :disabled, :checked, :required, :optional, :read-write, :open, :defined, :link", type: "standard", url: "https://html.spec.whatwg.org/multipage/semantics-other.html#selectors", access_date: "2026-10-05", scope: "type and attribute names lower-cased for HTML elements; the 46 attribute names whose values match ASCII case-insensitively; what each HTML pseudo-class matches", status: "active" },
    { id: "quirks", label: "Quirks Mode Standard (WHATWG), Living Standard, last updated 30 September 2026", type: "standard", url: "https://quirks.spec.whatwg.org/", access_date: "2026-10-05", scope: "no class or id case-sensitivity quirk is defined any more; class and id match case-sensitively in every mode", status: "active" },
    { id: "parse5", label: "parse5 8.0.1, the HTML parser (MIT)", type: "implementation", url: "https://github.com/inikulin/parse5", access_date: "2026-10-05", scope: "parse() with sourceCodeLocationInfo; the default tree adapter", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, { handle: "parse5", display_name: "The parse5 project (the WHATWG HTML parser in TypeScript, MIT)", role: "engine", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: SelectorTestInput): SelectorTestResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
