// ============================================================================
// src/lib/tools/meta-og-jsonld-inspector/index.ts
// ----------------------------------------------------------------------------
// THE META, OPEN GRAPH & JSON-LD INSPECTOR: the self-describing {manifest, run,
// vectors} triple.
//
// A page (or its head) in; out come the title and encoding, every meta and
// link element classified, the Open Graph object, the twitter:* card, the
// robots rules, the viewport, every JSON-LD block outlined, and the findings
// with the sentence each rests on. parse5 for the tree; inert, local,
// deterministic.
// ============================================================================

import { run as compute, type HeadInput, type HeadResult } from "./compute";
import { GOLDEN_VECTOR_SET_ID, VECTORS } from "./golden-vectors";

// The compute layer's public types and constants.
export type { HeadInput, HeadResult, MetaRow, MetaKind, MetaClass, LinkRow, OgProperty, OgMedia, TwitterProperty, RobotsToken, RobotsRow, JsonLdBlock, JsonLdNode, Finding } from "./compute";
export { HTML_MAX_CHARS, JSONLD_NODES_MAX, STANDARD_META_NAMES, REGISTERED_META_NAMES, TWITTER_REGISTERED, TWITTER_CARD_TYPES, PRAGMAS, HTML_LINK_TYPES, OG_ROOT, OG_STRUCTURED, OG_TYPES, OG_VERTICAL, ROBOTS_RULES, ROBOTS_NAMES } from "./compute";
// The vector set and its runner.
export { GOLDEN_VECTOR_SET_ID, VECTORS, verifyVectors } from "./golden-vectors";

/** The D-49 declarative manifest. */
export const manifest = Object.freeze({
  // The family the tool is listed under (the catalogue uses the same name).
  toolFamily: "HTTP & web",
  // The slug.
  toolSlug: "meta-og-jsonld-inspector",
  // Other names it answers to.
  canonicalAliases: ["meta-inspector", "open-graph-inspector", "og-inspector", "jsonld-inspector", "head-inspector", "seo-head-checker"],
  // What pasted input it recognises (the example is a valid API body).
  inputDetectors: [
    { kind: "regex", priority: 1, pattern: "<(meta|link|title|script[^>]*application/ld\\+json)[\\s>]", example: "{\"html\":\"<title>T</title><meta name=\\\"description\\\" content=\\\"d\\\"><meta property=\\\"og:title\\\" content=\\\"T\\\">\"}" },
  ],
  // Runs in the browser.
  capabilityBadge: "browser",
  // Nothing leaves the page.
  executionClass: ["localOnly"],
  // Where an API exists for it, it runs this same code.
  apiCapabilityClass: "local-equivalent",
  // The vector set.
  goldenVectors: GOLDEN_VECTOR_SET_ID,
  // How hostile or oversized input is handled: bounded text, parsed inertly, JSON parsed never evaluated, no URL fetched or resolved, nothing rendered.
  dangerousInputHandling: ["bounded-parse", "never-evaluates", "never-fetches", "never-renders"],
  // The default for share links: a pasted head may carry anything.
  shareSafetyDefault: "review",
  // The Learn articles written for it.
  learnLinks: ["learn/what-a-page-head-declares-and-who-reads-it"],
  // Tools that teach the neighbouring ideas.
  relatedTools: ["html-structure-explainer", "csp-evaluator", "secure-headers", "json-formatter", "css-selector-tester"],
  // Sources, each read live on its access date.
  sources: [
    { id: "html-meta", label: "HTML Living Standard (WHATWG): 4.2.2 the title element; 4.2.5 the meta element; 4.2.5.1 standard metadata names; 4.2.5.2 other metadata names; 4.2.5.3 pragma directives; 4.2.5.4 specifying the document's character encoding", type: "standard", url: "https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element", access_date: "2026-10-05", scope: "one title; exactly one of name, http-equiv, charset, itemprop; the eight standard names and their once-only rules; the pragma states and the non-conforming ones; UTF-8, once, within 1024 bytes", status: "active" },
    { id: "html-links", label: "HTML Living Standard (WHATWG): 4.6.7 link types; 4.1.1 the html element (lang)", type: "standard", url: "https://html.spec.whatwg.org/multipage/links.html#linkTypes", access_date: "2026-10-05", scope: "the rel tokens the standard defines on link; the lang encouragement", status: "active" },
    { id: "metaextensions", label: "WHATWG wiki, MetaExtensions (last edited 12 October 2023)", type: "registry", url: "https://wiki.whatwg.org/wiki/MetaExtensions", access_date: "2026-10-05", scope: "viewport, robots, google-site-verification, msvalidate.01 and the twitter:* card properties as registered extensions", status: "active" },
    { id: "ogp", label: "The Open Graph protocol (ogp.me)", type: "specification", url: "https://ogp.me/", access_date: "2026-10-05", scope: "the four required properties; optional properties; structured properties of og:image, og:video, og:audio; arrays (first wins) and the rule that structured properties follow their root; object types and the vertical namespaces", status: "active" },
    { id: "html-rdfa", label: "HTML+RDFa 1.1, Second Edition, W3C Recommendation 17 March 2015: 4 Extensions to the HTML5 Syntax", type: "standard", url: "https://www.w3.org/TR/html-rdfa/", access_date: "2026-10-05", scope: "the property attribute on meta (the Open Graph form) is conforming through RDFa Lite's attributes", status: "active" },
    { id: "jsonld", label: "JSON-LD 1.1, W3C Recommendation 16 July 2020: 3.1 the context; 4 keywords; 7 embedding JSON-LD in HTML documents; 7.2 restrictions for contents of JSON-LD script elements", type: "standard", url: "https://www.w3.org/TR/json-ld11/#embedding-json-ld-in-html-documents", access_date: "2026-10-05", scope: "a data block is a script of type application/ld+json; @context, @type, @id, @graph; the sequences to escape", status: "active" },
    { id: "rfc6596", label: "RFC 6596, The Canonical Link Relation (April 2012)", type: "rfc", url: "https://www.rfc-editor.org/rfc/rfc6596", access_date: "2026-10-05", scope: "the preferred IRI from resources with duplicative content; a relative, self-referential or cross-host target is allowed", status: "active" },
    { id: "google-tags", label: "Google Search Central, Meta tags and attributes that Google supports (last updated 2025-12-10)", type: "vendor-doc", url: "https://developers.google.com/search/docs/crawling-indexing/special-tags", access_date: "2026-10-05", scope: "description in snippets; robots and googlebot; charset recommendation; meta refresh advice; viewport; rating; google-site-verification", status: "active" },
    { id: "google-robots", label: "Google Search Central, Robots meta tag, data-nosnippet, and X-Robots-Tag specifications (last updated 2026-03-24)", type: "vendor-doc", url: "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag", access_date: "2026-10-05", scope: "the rules and their values; conflicts resolved by the more restrictive rule; retired rules; the user agent tokens", status: "active" },
    { id: "wcag-144", label: "WCAG 2.2, W3C Recommendation 12 December 2024: SC 1.4.4 Resize Text", type: "standard", url: "https://www.w3.org/TR/WCAG22/#resize-text", access_date: "2026-10-05", scope: "text resizable up to 200 percent, the sentence behind the zoom-restricting viewport finding", status: "active" },
    { id: "parse5", label: "parse5 8.0.1, the HTML parser (MIT)", type: "implementation", url: "https://github.com/inikulin/parse5", access_date: "2026-10-05", scope: "parse() with sourceCodeLocationInfo; the default tree adapter", status: "active" },
  ],
  // Credits.
  credits: [{ handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, { handle: "parse5", display_name: "The parse5 project (the WHATWG HTML parser in TypeScript, MIT)", role: "engine", public: true }],
});

/** run: the registry-facing entry point. */
export function run(input: HeadInput): HeadResult {
  // The compute layer does the work.
  return compute(input);
}

/** The vectors (the page's Example button uses one verbatim, D-83). */
export const goldenVectors = VECTORS;
