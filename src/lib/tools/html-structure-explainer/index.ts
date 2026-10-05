// ============================================================================
// src/lib/tools/html-structure-explainer/index.ts
// ----------------------------------------------------------------------------
// THE HTML STRUCTURE & DOM EXPLAINER: the self-describing {manifest, run, vectors} triple.
//
// HTML in; out comes the tree the standard's parser builds (every node with its
// line and what the parser did to it: created, end supplied, split, moved), the
// document mode, the parse errors by the standard's codes, the heading outline,
// and findings tied to sentences of the HTML Standard and WCAG 2.2. Parsing
// only, with parse5; nothing is executed, fetched or rendered. Local and
// deterministic.
// ============================================================================

import { run as compute, type HtmlInput, type HtmlStructureResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and constants.
export type { HtmlInput, HtmlStructureResult, TreeNode, ParseErrorRow, Finding, HeadingRow, NodeKind, Closing } from "./compute";
export { HTML_MAX_CHARS, NODE_LIST_MAX, VOID_ELEMENTS, OPTIONAL_END_TAG, STANDARD_CODES, PARSE5_CODES, RULES } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "Web front-end & CSS",
  // The slug.
  toolSlug: "html-structure-explainer",
  // Other names it answers to.
  canonicalAliases: ["html", "dom", "html-parser", "dom-tree", "html-validator", "html-explainer"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 2, pattern: "<!DOCTYPE\\s+html|<html[\\s>]|<(?:div|p|span|body|head|table|ul|li|a|img)[\\s>/]", example: "{\"html\":\"<!DOCTYPE html><title>Hi</title><p>Hello<p>World\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed inertly, never executed, never fetched.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-renders"],
  // The default for share links: pasted HTML may carry anything.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/how-the-html-parser-repairs-your-markup"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["css-specificity-calculator", "xml-decoder", "secure-headers", "color-contrast-format"],
  // Sources, each read live on its access date.
  sources: [
    // The HTML Standard: syntax, parsing, the error codes, the element rules.
    { id: "html-parsing", label: "HTML Living Standard (WHATWG): 13 The HTML syntax, 13.2.2 Parse errors, 13.2.6 Tree construction", type: "standard", url: "https://html.spec.whatwg.org/multipage/parsing.html#parse-errors", access_date: "2026-10-05", scope: "void, raw text and escapable raw text elements; optional tags; the trailing solidus; the 52 named parse errors and their non-normative descriptions; implied end tags; the initial insertion mode and quirks mode", status: "active" },
    { id: "html-semantics", label: "HTML Living Standard (WHATWG): 3.2.6 Global attributes (id), 4.1.1 html (lang), 4.2 Document metadata (head, title, meta charset), 4.3.11 Headings and outlines, 4.8.4.4 Alternative text for images, 4.10.4 label", type: "standard", url: "https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines", access_date: "2026-10-05", scope: "id uniqueness; lang encouraged on the root; exactly one title; the encoding declaration within 1024 bytes; heading levels less than, equal to, or one greater than the previous; alt must be specified, empty for decorative images; links and buttons made of images; labelable elements", status: "active" },
    { id: "html-obsolete", label: "HTML Living Standard (WHATWG): 16.2 Non-conforming features", type: "standard", url: "https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features", access_date: "2026-10-05", scope: "the 29 elements that are entirely obsolete and must not be used by authors, and the obsolete attributes, each with the standard's replacement advice", status: "active" },
    // WCAG 2.2: the criteria the findings cite.
    { id: "wcag22", label: "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation 12 December 2024", type: "standard", url: "https://www.w3.org/TR/WCAG22/", access_date: "2026-10-05", scope: "SC 1.1.1 Non-text Content, 1.3.1 Info and Relationships, 2.4.2 Page Titled, 2.4.6 Headings and Labels, 3.1.1 Language of Page; 4.1.1 Parsing obsolete and removed", status: "active" },
    // parse5: the parser.
    { id: "parse5", label: "parse5 8.0.1, the HTML parser (MIT), with its parse-error codes", type: "implementation", url: "https://github.com/inikulin/parse5", access_date: "2026-10-05", scope: "parse() with sourceCodeLocationInfo and onParseError; the default tree adapter; the 60 error codes (48 of the standard's, 12 named by parse5)", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, { handle: "parse5", display_name: "The parse5 project (the WHATWG HTML parser in TypeScript, MIT)", role: "engine", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: HtmlInput): HtmlStructureResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
