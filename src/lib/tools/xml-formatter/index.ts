// ============================================================================
// src/lib/tools/xml-formatter/index.ts
// ----------------------------------------------------------------------------
// Public surface + the D-49 declarative manifest for the XML formatter-
// validator: a well-formedness verdict with line, column and a plain message,
// then the document pretty-printed (two spaces, four spaces or a tab) or
// minified, with comments kept or dropped. It completes the site's JSON / XML /
// YAML formatting set beside json-formatter and json-yaml-convert; the
// xml-decoder (structure and attack surface) is a separate tool and is not
// changed by this one.
//
// Every source below was downloaded with curl on 2026-10-26 (generic
// User-Agent, no-cache headers, a cache-busting query) and answered HTTP 200;
// the files and the status log are in the build's work folder.
// ============================================================================

import { formatXml, run, type XmlFormatResult } from "./compute"; // the engine's two entry points
import { GOLDEN_VECTOR_SET_ID, XML_ACCEPT_VECTORS, XML_REJECT_VECTORS, API_EXAMPLE } from "./golden-vectors"; // the vectors

// The engine, re-exported for the component and the registry.
export { formatXml, run, XmlFormatError, DEFAULT_OPTIONS, MAX_INPUT_CHARS, MAX_DEPTH } from "./compute"; // values
export type { FormatOptions, IndentStyle, XmlFormatErrorCode, XmlFormatErrorInfo, XmlFormatNote, XmlFormatResult, XmlFormatStats } from "./compute"; // types
// The vectors, re-exported by the conventional names.
export { GOLDEN_VECTOR_SET_ID, XML_ACCEPT_VECTORS, XML_REJECT_VECTORS, SAML_COMPACT, API_EXAMPLE, verifyVectors } from "./golden-vectors"; // vectors and their runner
export type { XmlAcceptVector, XmlRejectVector } from "./golden-vectors"; // their shapes

/** The D-49 declarative manifest for the XML formatter-validator. */
export const manifest = Object.freeze({
  // -- Identity & routing --
  toolFamily: "Text & utilities", // must equal the catalogue family (D-73); the JSON formatter's family
  toolSlug: "xml-formatter", // the route segment and API path
  canonicalAliases: [
    "xml formatter", // the obvious search
    "xml pretty print", // the verb people use
    "xml beautifier", // another name for it
    "xml validator", // well-formedness, which is what it checks
    "xml minify", // the other mode
    "xml well-formed check", // the precise name of the check
  ],
  // The paste box lists the LOWEST priority number first (S4 sweep, 2026-10-27). The declaration ranks above the XML
  // decoder's own declaration detector (8) and below the SAML decoder's (6), so a SAML message, which often starts
  // with a declaration, still goes to the SAML decoder first; a bare start tag ranks below both decoders (5 and 6).
  inputDetectors: [
    {
      // An XML declaration at the start. Anchored, fixed prefix: linear (ReDoS-safe).
      kind: "regex",
      pattern: "^\\s*<\\?xml\\s",
      priority: 7, // a sure sign of XML, but not of which kind: the SAML decoder (6) reads one kind more closely
      example: API_EXAMPLE, // golden vector api-example; also the OpenAPI example
    },
    {
      // A start tag at the start: "<", a name, then white space, "/" or ">". Anchored, one bounded class run: linear.
      kind: "regex",
      pattern: "^\\s*<[A-Za-z_:][\\w.:\\-]*[\\s/>]",
      priority: 7, // also matches HTML and SAML, so after the HTML explainer (2) and both decoders (5, 6)
      example: "<note><to>Ana</to><from>Bia</from></note>", // the body of the api-example vector
    },
  ],

  // -- Capability & execution --
  capabilityBadge: "browser", // runs client-side
  executionClass: ["localOnly"], // a character loop over the pasted text; no network, no clock, no randomness
  apiCapabilityClass: "local-equivalent", // the API runs the same engine with the default options

  // -- Correctness & security --
  goldenVectors: GOLDEN_VECTOR_SET_ID, // the set id
  goldenVectorCount: XML_ACCEPT_VECTORS.length + XML_REJECT_VECTORS.length, // accept and reject vectors
  dangerousInputHandling: [
    "never-expands-entities", // references are copied as written; no replacement text is ever built
    "never-fetches", // no DTD, SYSTEM or PUBLIC identifier is read; the DOCTYPE is kept as text
    "bounded-parse", // one pass, an explicit element stack, no recursion while parsing
    "length-bound", // at most 2,000,000 characters
    "depth-guard", // at most 1,000 nested elements
    "redos-guard", // names matched by one sticky, anchored pattern of two character classes
  ],
  shareSafetyDefault: "fragment", // XML often carries tokens, assertions, internal host names and personal data

  // -- Teaching & provenance --
  // The well-formedness article teaches what the verdict checks; the CDATA article the constructs kept verbatim.
  learnLinks: ["learn/xml-well-formedness", "learn/cdata-comments-and-processing-instructions"],
  sources: [
    {
      id: "w3c-xml10-5e", // the grammar and every rule the engine applies
      label: "W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008: sections 2.1 to 2.11, 3.1, 3.2.2, 4.1 and 4.2", // what the engine applies
      type: "standard", // W3C Recommendation
      url: "https://www.w3.org/TR/xml/", // fetched 2026-10-26, HTTP 200
      access_date: "2026-10-26", // read the day the tool was built
      scope: "well-formedness (2.1); Char (2.2); S and Name (2.3); character data, & and < and ]]> (2.4); comments (2.5); processing instructions (2.6); CDATA sections (2.7); the XML declaration and the DOCTYPE (2.8); white space handling and xml:space (2.10); end-of-line handling (2.11); tags and attributes, Element Type Match, Unique Att Spec, No External Entity References (3.1); mixed content (3.2.2); references, Legal Character, Entity Declared, Parsed Entity (4.1); entity declarations (4.2)", // what it pins
      status: "active", // the current edition
    },
    {
      id: "w3c-xml10-5e-errata", // read for anything that changes the rules
      label: "W3C, Errata in REC-xml-20081126 (XML 1.0 Fifth Edition Specification Errata)", // the record
      type: "reference", // an errata listing
      url: "https://www.w3.org/XML/xml-V10-5e-errata", // fetched 2026-10-26, HTTP 200
      access_date: "2026-10-26", // read with the Recommendation
      scope: "S01 (proposed, not normative until approved) rewords the reserved names and says the PI target \"xml\" is forbidden, which production [17] already excludes; E01 adds a note on Unicode normalisation. Neither changes a rule the engine applies", // why the engine follows the published text
      status: "active", // current
    },
    {
      id: "w3c-c14n11", // why a signed document must not be reformatted
      label: "W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008 (served at w3.org/TR/xml-c14n/): section 1.1 and example 3.2", // the summary list and the white space example
      type: "standard", // W3C Recommendation
      url: "https://www.w3.org/TR/xml-c14n/", // fetched 2026-10-26, HTTP 200; the address now serves version 1.1
      access_date: "2026-10-26", // read the day the tool was built
      scope: "\"All whitespace in character content is retained\"; the white space between tags in example 3.2 is kept in the canonical form", // what the docs rely on
      status: "active", // current
    },
    {
      id: "w3c-exc-c14n", // the canonicalisation SAML signatures usually name
      label: "W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002: sections 1.1 and 3", // the relation to Canonical XML
      type: "standard", // W3C Recommendation
      url: "https://www.w3.org/TR/xml-exc-c14n/", // fetched 2026-10-26, HTTP 200
      access_date: "2026-10-26", // read the day the tool was built
      scope: "its data model and processing are those of Canonical XML except for namespace nodes and the import of xml: attributes, so white space in character content is kept the same way", // what the docs rely on
      status: "active", // current
    },
    {
      id: "w3c-xmldsig11", // how a signature covers the bytes
      label: "W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013: section 3.2.1", // reference validation
      type: "standard", // W3C Recommendation
      url: "https://www.w3.org/TR/xmldsig-core1/", // fetched 2026-10-26, HTTP 200
      access_date: "2026-10-26", // read the day the tool was built
      scope: "reference validation digests the transformed (canonicalised) data and fails on any mismatch with DigestValue", // what the docs rely on
      status: "active", // current
    },
    {
      id: "oasis-saml-core-2.0", // the example's names
      label: "OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005 (saml-core-2.0-os)", // the SAML core
      type: "standard", // OASIS Standard
      url: "https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf", // fetched 2026-10-26, HTTP 200
      access_date: "2026-10-26", // read the day the tool was built
      scope: "section 5.4.3 (implementations SHOULD use Exclusive Canonicalization for SignedInfo and as a transform), and the saml and samlp namespace names, the Success status code and the emailAddress NameID format used in the SAML-like golden vector and the Example", // what it pins
      status: "active", // current
    },
  ],
  credits: [
    { handle: "ronutz", display_name: "Rodolfo Nützmann", role: "implementation", public: true }, // the site's author
  ],
});

/**
 * runTool: the registry-facing entry point, with the default options (pretty, two spaces, comments kept).
 * @param input the XML document
 * @returns the result
 */
export function runTool(input: string): XmlFormatResult {
  return run(input); // the same engine
} // runTool

/**
 * format: the page's entry point, with the reader's options.
 * @param input the XML document
 * @param options mode, indent and comments
 * @returns the result
 */
export function format(input: string, options: Parameters<typeof formatXml>[1]): XmlFormatResult {
  return formatXml(input, options); // the same engine
} // format

/** The accept vectors, by the conventional name. */
export const goldenVectors = XML_ACCEPT_VECTORS; // re-exported
/** The reject vectors, by the conventional name. */
export const rejectVectors = XML_REJECT_VECTORS; // re-exported
