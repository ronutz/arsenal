// ============================================================================
// src/lib/tools/xml-formatter/golden-vectors.ts
// ----------------------------------------------------------------------------
// The pinned truth for the XML formatter-validator, byte for byte.
//
// Accept vectors fix the exact output text for a SAML-like message (compact as
// it arrives from a binding, then pretty-printed with two spaces, four spaces
// and a tab, and minified back), a document with mixed content, one with
// xml:space="preserve" (and an xml:space="default" override inside it), one
// with CDATA sections, comments and processing instructions (comments kept and
// dropped, pretty and minified), a DOCTYPE with character and entity
// references, the empty-element and white-space-only forms with CR LF line
// breaks, and the notes. Every expected text was written out by hand from the
// rules in compute.ts (W3C XML 1.0 Fifth Edition, sections 2.10, 3.1, 3.2.2)
// before the engine was run against it.
//
// Two properties are checked on EVERY accept vector as well:
//   - idempotence: formatting the expected output again, with the same
//     options, gives it back unchanged;
//   - minify agreement: minifying the expected output gives the same text as
//     minifying the original input (the formatter only ever touched white space
//     a minifier removes).
//
// Reject vectors fix one malformed input per error code, with the line and the
// column (counted in characters, so an astral character counts once) where the
// failure is reported.
// ============================================================================

import { formatXml, MAX_DEPTH, MAX_INPUT_CHARS, type FormatOptions, type XmlFormatErrorCode, type XmlFormatNote, type XmlFormatStats } from "./compute"; // the engine

/** The set id: changes whenever any vector changes (scripts/check-api-sync.mjs reads it). */
export const GOLDEN_VECTOR_SET_ID = "xml-formatter-golden-2026-10-26"; // dated the day the set was written

/** An accepted document and the exact text it must produce. */
export interface XmlAcceptVector {
  /** Stable name. */
  id: string;
  /** The input as pasted. */
  input: string;
  /** The options applied. */
  options: FormatOptions;
  /** The exact expected output. */
  output: string;
  /** The exact expected notes (an empty list when omitted). */
  notes?: XmlFormatNote[];
  /** Counts that must match (only those listed are compared). */
  stats?: Partial<XmlFormatStats>;
}

/** A malformed document and where it must be refused. */
export interface XmlRejectVector {
  /** Stable name. */
  id: string;
  /** The input, or a function that builds it (the two bound vectors are large, so they are built only when run). */
  input: string | (() => string);
  /** The expected code. */
  code: XmlFormatErrorCode;
  /** The expected 1-based line. */
  line: number;
  /** The expected 1-based column, in characters. */
  column: number;
}

/**
 * Join lines with LF: expected outputs are written one line per argument so every byte is visible.
 * @param lines the lines
 * @returns the text
 */
const L = (...lines: string[]): string => lines.join("\n"); // LF only, no trailing newline (the engine writes none)

/** Pretty, two spaces, comments kept. */
const P2: FormatOptions = { mode: "pretty", indent: 2, comments: "keep" }; // the defaults
/** Pretty, four spaces, comments kept. */
const P4: FormatOptions = { mode: "pretty", indent: 4, comments: "keep" }; // four spaces
/** Pretty, one tab, comments kept. */
const PT: FormatOptions = { mode: "pretty", indent: "tab", comments: "keep" }; // tabs
/** Pretty, two spaces, comments dropped. */
const P2D: FormatOptions = { mode: "pretty", indent: 2, comments: "drop" }; // comments dropped
/** Minify, comments kept. */
const MK: FormatOptions = { mode: "minify", indent: 2, comments: "keep" }; // minified
/** Minify, comments dropped. */
const MD: FormatOptions = { mode: "minify", indent: 2, comments: "drop" }; // minified, comments dropped
/** The options reject vectors run with (a refusal does not depend on them). */
const DEFAULT_CHECK_OPTIONS: FormatOptions = P2; // the defaults

// ---------------------------------------------------------------------------
// The documents
// ---------------------------------------------------------------------------

/**
 * A SAML 2.0-like Response, unsigned, on one line as it arrives from a binding. The namespace names, the
 * Success status code and the emailAddress NameID format are those of OASIS saml-core-2.0-os (read 2026-10-26).
 * This is also the page's Example (D-83).
 */
export const SAML_COMPACT =
  '<?xml version="1.0" encoding="UTF-8"?><samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z" Destination="https://sp.example.com/acs"><saml:Issuer>https://idp.example.com</saml:Issuer><samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status><saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z"><saml:Issuer>https://idp.example.com</saml:Issuer><saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">ana@example.com</saml:NameID></saml:Subject><saml:AttributeStatement><saml:Attribute Name="role"><saml:AttributeValue>admin &amp; auditor</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>'; // one line

/** The SAML-like Response, pretty-printed with two spaces. */
const SAML_PRETTY_2 = L(
  '<?xml version="1.0" encoding="UTF-8"?>', // the declaration, as written
  '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z" Destination="https://sp.example.com/acs">', // the root's start tag on one line
  "  <saml:Issuer>https://idp.example.com</saml:Issuer>", // text content stays inline
  "  <samlp:Status>", // element content: children below
  '    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>', // empty-element tag as written
  "  </samlp:Status>", // back one level
  '  <saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z">', // element content
  "    <saml:Issuer>https://idp.example.com</saml:Issuer>", // text
  "    <saml:Subject>", // element content
  '      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">ana@example.com</saml:NameID>', // text
  "    </saml:Subject>", // back
  "    <saml:AttributeStatement>", // element content
  '      <saml:Attribute Name="role">', // element content
  "        <saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>", // the reference kept as written
  "      </saml:Attribute>", // back
  "    </saml:AttributeStatement>", // back
  "  </saml:Assertion>", // back
  "</samlp:Response>", // the root's end tag
); // SAML_PRETTY_2

/** The same, four spaces per level. */
const SAML_PRETTY_4 = L(
  '<?xml version="1.0" encoding="UTF-8"?>', // declaration
  '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z" Destination="https://sp.example.com/acs">', // root
  "    <saml:Issuer>https://idp.example.com</saml:Issuer>", // level 1
  "    <samlp:Status>", // level 1
  '        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>', // level 2
  "    </samlp:Status>", // level 1
  '    <saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z">', // level 1
  "        <saml:Issuer>https://idp.example.com</saml:Issuer>", // level 2
  "        <saml:Subject>", // level 2
  '            <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">ana@example.com</saml:NameID>', // level 3
  "        </saml:Subject>", // level 2
  "        <saml:AttributeStatement>", // level 2
  '            <saml:Attribute Name="role">', // level 3
  "                <saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>", // level 4
  "            </saml:Attribute>", // level 3
  "        </saml:AttributeStatement>", // level 2
  "    </saml:Assertion>", // level 1
  "</samlp:Response>", // root
); // SAML_PRETTY_4

/** The same, one tab per level. */
const SAML_PRETTY_TAB = L(
  '<?xml version="1.0" encoding="UTF-8"?>', // declaration
  '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z" Destination="https://sp.example.com/acs">', // root
  "\t<saml:Issuer>https://idp.example.com</saml:Issuer>", // level 1
  "\t<samlp:Status>", // level 1
  '\t\t<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>', // level 2
  "\t</samlp:Status>", // level 1
  '\t<saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-10-26T12:00:00Z">', // level 1
  "\t\t<saml:Issuer>https://idp.example.com</saml:Issuer>", // level 2
  "\t\t<saml:Subject>", // level 2
  '\t\t\t<saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">ana@example.com</saml:NameID>', // level 3
  "\t\t</saml:Subject>", // level 2
  "\t\t<saml:AttributeStatement>", // level 2
  '\t\t\t<saml:Attribute Name="role">', // level 3
  "\t\t\t\t<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>", // level 4
  "\t\t\t</saml:Attribute>", // level 3
  "\t\t</saml:AttributeStatement>", // level 2
  "\t</saml:Assertion>", // level 1
  "</samlp:Response>", // root
); // SAML_PRETTY_TAB

/** Mixed content (3.2.2): text and elements together stay exactly as written; element content around them is reindented. */
const MIXED = L(
  "<article>", // element content
  "<title>Release notes</title>", // text only
  "<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>", // text and elements together
  "<para>", // text only, over three lines
  "  Two spaces  stay   as written.", // the text, white space included
  "</para>", // its end tag
  "<list><item>one</item>  <item>two</item></list>", // element content on one line
  "</article>", // the root's end tag
); // MIXED

/** xml:space="preserve" (2.10), inherited by descendants and overridden by xml:space="default". */
const PRESERVE = L(
  "<doc>", // element content
  '<poem xml:space="preserve"><line>Roses</line>', // preserve: copied as written
  "   <line>are red</line>", // the indentation is data here
  "</poem>", // its end tag where it was
  '<listing xml:space="preserve"><stanza><line>a</line> <line>b</line></stanza><meta xml:space="default"><k>1</k>   <v>2</v></meta></listing>', // preserve, inherited by stanza, overridden by meta
  "<settings><item>x</item>   <item>y</item></settings>", // ordinary element content
  "</doc>", // the root's end tag
); // PRESERVE

/** CDATA sections, comments and processing instructions, inside and outside the root. */
const CDATA_COMMENTS_PIS = L(
  '<?xml version="1.0"?>', // declaration
  "<!-- build manifest -->", // a comment in the prolog
  '<?xml-stylesheet type="text/xsl" href="view.xsl"?>', // a PI in the prolog (a target beginning "xml-" is not the reserved "xml")
  "<build>", // the root
  "<!-- steps run in order -->", // a comment in element content
  '<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>', // a CDATA section: character data, so its element is copied as written
  '<?audit level="full"?>', // a PI in element content
  "<step id='2'>", // single quotes, kept
  "<!--   inline note   -->", // the comment's own spaces are its text
  "<cmd>make  all</cmd>", // two spaces in text, kept
  "</step>", // end
  "</build>", // the root's end tag
  "<!-- end -->", // a comment after the root (Misc)
); // CDATA_COMMENTS_PIS

/** A DOCTYPE with an internal subset, kept as text; character and entity references left as written; tag white space normalised. */
const DOCTYPE_REFS = L(
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', // standalone="yes": entity names are checked against the internal subset
  "<!DOCTYPE note [", // the DOCTYPE, over three lines
  '  <!ENTITY org "Example Org">', // a general entity: declared, never expanded
  "]>", // its end
  "<note>", // the root
  "<from>&org;</from>", // an entity reference
  '<to   lang = "pt-BR" >Ana &amp; Bia</to>', // white space inside the tag, around "=" and before ">"
  "<sign>&#169; 2026 &#x2122; &lt;draft&gt;</sign>", // decimal and hexadecimal character references, predefined entities
  "</note>", // end
); // DOCTYPE_REFS

/** Empty elements and a white-space-only element, with CR LF line breaks. */
const EMPTY_FORMS_CRLF = "<r>\r\n<a>   </a>\r\n<b/>\r\n<c></c>\r\n<d  />\r\n</r>"; // CR LF throughout

// ---------------------------------------------------------------------------
// Accept vectors
// ---------------------------------------------------------------------------

/** A short document: the API example in the manifest's first input detector. */
export const API_EXAMPLE = '<?xml version="1.0"?><note><to>Ana</to><from>Bia</from></note>'; // one line

/** The documents that must be accepted, with their exact output. */
export const XML_ACCEPT_VECTORS: readonly XmlAcceptVector[] = [
  { id: "api-example", input: API_EXAMPLE, options: P2, output: L('<?xml version="1.0"?>', "<note>", "  <to>Ana</to>", "  <from>Bia</from>", "</note>") }, // the default options, as the API runs them
  { id: "saml-pretty-2", input: SAML_COMPACT, options: P2, output: SAML_PRETTY_2, stats: { elements: 11, attributes: 12, maxDepth: 5, mixedContentElements: 4, insignificantWhitespaceNodes: 0 } }, // the Example
  { id: "saml-pretty-4", input: SAML_COMPACT, options: P4, output: SAML_PRETTY_4 }, // four spaces
  { id: "saml-pretty-tab", input: SAML_COMPACT, options: PT, output: SAML_PRETTY_TAB }, // tabs
  { id: "saml-minify-roundtrip", input: SAML_PRETTY_2, options: MK, output: SAML_COMPACT, stats: { insignificantWhitespaceNodes: 16 } }, // minifying the pretty form gives the compact one back
  {
    id: "mixed-pretty", input: MIXED, options: P2, // mixed content
    output: L(
      "<article>", // root
      "  <title>Release notes</title>", // text content, inline
      "  <para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>", // mixed: no white space inserted
      "  <para>", // text only: copied as written,
      "  Two spaces  stay   as written.", // so its own line breaks and spaces stay,
      "</para>", // and its end tag stays at the start of the line
      "  <list>", // element content
      "    <item>one</item>", // reindented
      "    <item>two</item>", // reindented
      "  </list>", // back
      "</article>", // root
    ),
    stats: { elements: 9, mixedContentElements: 7, insignificantWhitespaceNodes: 6 }, // 5 white-space nodes in article, 1 in list
  },
  {
    id: "mixed-minify", input: MIXED, options: MK, // the same, minified
    output: "<article><title>Release notes</title><para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para><para>\n  Two spaces  stay   as written.\n</para><list><item>one</item><item>two</item></list></article>", // only the white space between elements removed
  },
  {
    id: "preserve-pretty", input: PRESERVE, options: P2, // xml:space
    output: L(
      "<doc>", // root
      '  <poem xml:space="preserve"><line>Roses</line>', // preserve: content as written
      "   <line>are red</line>", // its own indentation
      "</poem>", // its own line break before the end tag
      '  <listing xml:space="preserve"><stanza><line>a</line> <line>b</line></stanza><meta xml:space="default">', // preserve inherited by stanza; meta overrides it
      "      <k>1</k>", // meta's element content, at depth 3
      "      <v>2</v>", // reindented
      "    </meta></listing>", // meta's end tag at depth 2; listing's content otherwise as written
      "  <settings>", // ordinary element content
      "    <item>x</item>", // reindented
      "    <item>y</item>", // reindented
      "  </settings>", // back
      "</doc>", // root
    ),
    stats: { preserveElements: 2, insignificantWhitespaceNodes: 6 }, // doc 4, meta 1, settings 1
  },
  {
    id: "preserve-minify", input: PRESERVE, options: MK, // the same, minified
    output: '<doc><poem xml:space="preserve"><line>Roses</line>\n   <line>are red</line>\n</poem><listing xml:space="preserve"><stanza><line>a</line> <line>b</line></stanza><meta xml:space="default"><k>1</k><v>2</v></meta></listing><settings><item>x</item><item>y</item></settings></doc>', // preserved white space survives minify
  },
  {
    id: "cdata-comments-pis-pretty", input: CDATA_COMMENTS_PIS, options: P2, // comments kept
    output: L(
      '<?xml version="1.0"?>', // declaration
      "<!-- build manifest -->", // prolog comment
      '<?xml-stylesheet type="text/xsl" href="view.xsl"?>', // prolog PI
      "<build>", // root
      "  <!-- steps run in order -->", // comment on its own line
      '  <step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>', // CDATA verbatim, inline
      '  <?audit level="full"?>', // PI verbatim
      "  <step id='2'>", // single quotes kept
      "    <!--   inline note   -->", // comment verbatim
      "    <cmd>make  all</cmd>", // text verbatim
      "  </step>", // back
      "</build>", // root
      "<!-- end -->", // epilog comment
    ),
    stats: { comments: 4, commentsDropped: 0, cdataSections: 1, processingInstructions: 2 }, // four comments; the declaration is not a PI
  },
  {
    id: "cdata-comments-pis-pretty-drop", input: CDATA_COMMENTS_PIS, options: P2D, // comments dropped
    output: L(
      '<?xml version="1.0"?>', // declaration
      '<?xml-stylesheet type="text/xsl" href="view.xsl"?>', // PI kept
      "<build>", // root
      '  <step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>', // CDATA kept
      '  <?audit level="full"?>', // PI kept
      "  <step id='2'>", // element
      "    <cmd>make  all</cmd>", // text
      "  </step>", // back
      "</build>", // root; the epilog comment is gone
    ),
    stats: { comments: 4, commentsDropped: 4 }, // all four dropped
  },
  {
    id: "cdata-comments-pis-minify", input: CDATA_COMMENTS_PIS, options: MK, // minified, comments kept
    output: '<?xml version="1.0"?><!-- build manifest --><?xml-stylesheet type="text/xsl" href="view.xsl"?><build><!-- steps run in order --><step id="1"><![CDATA[if (a < b && c) { go(); }]]></step><?audit level="full"?><step id=\'2\'><!--   inline note   --><cmd>make  all</cmd></step></build><!-- end -->', // one line
  },
  {
    id: "cdata-comments-pis-minify-drop", input: CDATA_COMMENTS_PIS, options: MD, // minified, comments dropped
    output: '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="view.xsl"?><build><step id="1"><![CDATA[if (a < b && c) { go(); }]]></step><?audit level="full"?><step id=\'2\'><cmd>make  all</cmd></step></build>', // one line, no comments
  },
  {
    id: "doctype-references-pretty", input: DOCTYPE_REFS, options: P2, // DOCTYPE kept, references as written
    output: L(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', // declaration
      "<!DOCTYPE note [", // DOCTYPE, verbatim
      '  <!ENTITY org "Example Org">', // its internal subset, verbatim
      "]>", // its end
      "<note>", // root
      "  <from>&org;</from>", // entity reference, not expanded
      '  <to lang="pt-BR">Ana &amp; Bia</to>', // tag white space normalised; value and quotes as written
      "  <sign>&#169; 2026 &#x2122; &lt;draft&gt;</sign>", // character references as written
      "</note>", // root
    ),
    notes: ["doctype-kept"], // said in the result
  },
  {
    id: "empty-forms-crlf-pretty", input: EMPTY_FORMS_CRLF, options: P2, // CR LF read as LF (2.11)
    output: L("<r>", "  <a>   </a>", "  <b/>", "  <c></c>", "  <d/>", "</r>"), // <a> keeps its white space (no child element); <d  /> loses the space before "/>"
    notes: ["line-endings-normalised"], // said in the result
  },
  {
    id: "empty-forms-crlf-minify", input: EMPTY_FORMS_CRLF, options: MK, // the same, minified
    output: "<r><a>   </a><b/><c></c><d/></r>", // the white space inside <a> is not between elements, so it stays
    notes: ["line-endings-normalised"], // said in the result
  },
  {
    id: "external-dtd-entities-unchecked", input: '<!DOCTYPE page SYSTEM "page.dtd">\n<page>&copyright;</page>', options: P2, // an external subset: declarations this tool never reads
    output: '<!DOCTYPE page SYSTEM "page.dtd">\n<page>&copyright;</page>', // unchanged; nothing fetched, nothing expanded
    notes: ["doctype-kept", "entities-unchecked"], // the name could be declared in page.dtd
  },
  {
    id: "xml-space-invalid-ignored", input: '<list xml:space="keep"><a/> <b/></list>', options: P2, // a value 2.10 gives no meaning to
    output: L('<list xml:space="keep">', "  <a/>", "  <b/>", "</list>"), // ignored: ordinary element content
    notes: ["xml-space-invalid"], // said in the result
  },
  {
    id: "bom-removed", input: "﻿<a><b/></a>", options: P2, // a byte order mark
    output: L("<a>", "  <b/>", "</a>"), // dropped from the output
    notes: ["bom-removed"], // said in the result
  },
  {
    id: "comment-only-element-drop", input: "<a>\n  <!-- c -->\n</a>", options: P2D, // no child element: the white space is not between elements
    output: "<a>\n  \n</a>", // the comment goes; the white space around it stays, as written
    stats: { commentsDropped: 1, insignificantWhitespaceNodes: 0 }, // nothing replaced
  },
]; // XML_ACCEPT_VECTORS

// ---------------------------------------------------------------------------
// Reject vectors: one per error code (and a few positions worth pinning)
// ---------------------------------------------------------------------------

/** The documents that must be refused, with the code, line and column. */
export const XML_REJECT_VECTORS: readonly XmlRejectVector[] = [
  { id: "empty", input: "  \n\t ", code: "empty", line: 1, column: 1 }, // white space only
  { id: "too-large", input: () => "<a>" + "x".repeat(MAX_INPUT_CHARS) + "</a>", code: "too-large", line: 1, column: 1 }, // one character past the bound and more
  { id: "too-deep", input: () => "<a>".repeat(MAX_DEPTH + 1), code: "too-deep", line: 1, column: MAX_DEPTH * 3 + 1 }, // the 1001st start tag
  { id: "illegal-character", input: "<a>\u0001</a>", code: "illegal-character", line: 1, column: 4 }, // a C0 control character
  { id: "bad-xml-declaration", input: '<?xml version="2.0"?><a/>', code: "bad-xml-declaration", line: 1, column: 1 }, // VersionNum is 1.x
  { id: "bad-xml-declaration-order", input: '<?xml version="1.0" standalone="yes" encoding="UTF-8"?><a/>', code: "bad-xml-declaration", line: 1, column: 1 }, // encoding must come before standalone
  { id: "misplaced-xml-declaration", input: '\n<?xml version="1.0"?><a/>', code: "misplaced-xml-declaration", line: 2, column: 1 }, // a line break before it
  { id: "bad-pi", input: "<a><?1x data?></a>", code: "bad-pi", line: 1, column: 6 }, // a target cannot start with a digit
  { id: "unterminated-pi", input: "<a><?go </a>", code: "unterminated-pi", line: 1, column: 4 }, // no "?>"
  { id: "unterminated-comment", input: "<a><!-- x </a>", code: "unterminated-comment", line: 1, column: 4 }, // no "-->"
  { id: "comment-double-hyphen", input: "<a><!-- a--b --></a>", code: "comment-double-hyphen", line: 1, column: 10 }, // "--" inside
  { id: "comment-triple-hyphen-end", input: "<a><!-- x ---></a>", code: "comment-double-hyphen", line: 1, column: 11 }, // "--->" is not allowed
  { id: "unterminated-cdata", input: "<a><![CDATA[x</a>", code: "unterminated-cdata", line: 1, column: 4 }, // no "]]>"
  { id: "cdata-outside-root", input: "<![CDATA[x]]><a/>", code: "cdata-outside-root", line: 1, column: 1 }, // before the root
  { id: "bad-doctype", input: "<!DOCTYPE><a/>", code: "bad-doctype", line: 1, column: 10 }, // no name
  { id: "bad-doctype-external-id", input: "<!DOCTYPE a SYSTEM><a/>", code: "bad-doctype", line: 1, column: 19 }, // SYSTEM needs a quoted system literal
  { id: "bad-doctype-pubid", input: '<!DOCTYPE r PUBLIC "-//X//DTD {R}//EN" "r.dtd"><r/>', code: "bad-doctype", line: 1, column: 20 }, // "{" is not a PubidChar
  { id: "unterminated-doctype", input: '<!DOCTYPE a [ <!ENTITY e "x">', code: "unterminated-doctype", line: 1, column: 1 }, // the subset never ends
  { id: "bad-internal-subset", input: '<!DOCTYPE a [<!ENT>ITY e "v">]><a/>', code: "bad-internal-subset", line: 1, column: 14 }, // not a markup declaration keyword
  { id: "pe-reference-inside-declaration", input: '<!DOCTYPE r [<!ENTITY % p "(#PCDATA)"><!ELEMENT r %p;>]><r/>', code: "bad-internal-subset", line: 1, column: 51 }, // WFC PEs in Internal Subset
  { id: "misplaced-doctype", input: "<a/><!DOCTYPE a>", code: "misplaced-doctype", line: 1, column: 5 }, // after the root
  { id: "unknown-markup", input: "<a><!ELEMENT a ANY></a>", code: "unknown-markup", line: 1, column: 4 }, // a declaration outside the DTD
  { id: "bad-start-tag", input: "<a>1 < 2</a>", code: "bad-start-tag", line: 1, column: 7 }, // a literal "<" in text
  { id: "bad-attribute", input: "<a b=c/>", code: "bad-attribute", line: 1, column: 6 }, // an unquoted value
  { id: "bad-attribute-no-space", input: '<a b="1"c="2"/>', code: "bad-attribute", line: 1, column: 9 }, // no white space between attributes
  { id: "duplicate-attribute", input: '<a b="1" b="2"/>', code: "duplicate-attribute", line: 1, column: 10 }, // Unique Att Spec
  { id: "lt-in-attribute", input: '<a b="x<y"/>', code: "lt-in-attribute", line: 1, column: 8 }, // "<" in a value
  { id: "unterminated-tag", input: '<a b="1"', code: "unterminated-tag", line: 1, column: 1 }, // the input ends inside the tag
  { id: "bad-end-tag", input: "<a></a b>", code: "bad-end-tag", line: 1, column: 8 }, // an attribute on an end tag
  { id: "mismatched-end-tag", input: "<a>\n  <b>\n  </c>\n</a>", code: "mismatched-end-tag", line: 3, column: 3 }, // Element Type Match, on line 3
  { id: "unexpected-end-tag", input: "</a>", code: "unexpected-end-tag", line: 1, column: 1 }, // nothing open
  { id: "unclosed-element", input: "<a><b></b>", code: "unclosed-element", line: 1, column: 1 }, // reported where <a> opened
  { id: "bad-reference", input: "<a>AT&T</a>", code: "bad-reference", line: 1, column: 6 }, // a bare ampersand
  { id: "bad-reference-after-astral", input: "<a>\u{1D11E} & x</a>", code: "bad-reference", line: 1, column: 6 }, // the G clef counts as one column
  { id: "illegal-char-reference", input: "<a>&#0;</a>", code: "illegal-char-reference", line: 1, column: 4 }, // NUL is not a Char
  { id: "undeclared-entity", input: "<a>&nbsp;</a>", code: "undeclared-entity", line: 1, column: 4 }, // an HTML entity, undeclared in XML
  { id: "unparsed-entity-reference", input: '<!DOCTYPE r [<!ENTITY u SYSTEM "u.bin" NDATA n>]><r>&u;</r>', code: "unparsed-entity-reference", line: 1, column: 53 }, // an NDATA entity referenced with & and ;
  { id: "external-entity-in-attribute", input: '<!DOCTYPE r [<!ENTITY e SYSTEM "e.xml">]><r a="&e;"/>', code: "external-entity-in-attribute", line: 1, column: 48 }, // a direct reference in an attribute value
  { id: "cdata-end-in-text", input: "<a>x]]>y</a>", code: "cdata-end-in-text", line: 1, column: 5 }, // "]]>" in text
  { id: "text-outside-root", input: "<a/>tail", code: "text-outside-root", line: 1, column: 5 }, // text after the root
  { id: "multiple-roots", input: "<a/><b/>", code: "multiple-roots", line: 1, column: 5 }, // a second root
  { id: "no-root", input: "<!-- only a comment -->", code: "no-root", line: 1, column: 24 }, // reported at the end of the input
]; // XML_REJECT_VECTORS

// ---------------------------------------------------------------------------
// The runner
// ---------------------------------------------------------------------------

/**
 * Show a string with its invisible characters, for failure messages.
 * @param s the text
 * @returns a JSON rendering, cut to 300 characters
 */
const show = (s: string | undefined): string => JSON.stringify(s ?? null).slice(0, 300); // escapes \n and \t

/**
 * verifyVectors: run every vector and both properties; collect every failure.
 * @returns the set id, how many checks ran, how many passed, and the failures
 */
export function verifyVectors(): { setId: string; total: number; passed: number; failures: string[] } {
  const failures: string[] = []; // every failure, with its vector id
  let total = 0; // checks run
  /** Record one check. */
  const check = (ok: boolean, msg: string): void => { total++; if (!ok) failures.push(msg); }; // counted, and kept when failed
  for (const v of XML_ACCEPT_VECTORS) { // each accepted document
    const r = formatXml(v.input, v.options); // the engine
    check(r.ok, `[${v.id}] expected ok, got ${r.error?.code} at ${r.error?.line}:${r.error?.column}`); // accepted
    check(r.output === v.output, `[${v.id}] output differs:\n  got  ${show(r.output)}\n  want ${show(v.output)}`); // byte for byte
    check(JSON.stringify(r.notes) === JSON.stringify(v.notes ?? []), `[${v.id}] notes: got ${JSON.stringify(r.notes)}, want ${JSON.stringify(v.notes ?? [])}`); // exact notes
    for (const [k, want] of Object.entries(v.stats ?? {})) { // each pinned count
      const got = r.stats?.[k as keyof XmlFormatStats]; // the engine's count
      check(got === want, `[${v.id}] stats.${k}: got ${got}, want ${want}`); // equal
    } // counts
    const again = formatXml(v.output, v.options); // the output, formatted again
    check(again.output === v.output, `[${v.id}] not idempotent:\n  got  ${show(again.output)}`); // unchanged
    const minOpts: FormatOptions = { ...v.options, mode: "minify" }; // the same options, minified
    const a = formatXml(v.output, minOpts).output; // minify the expected output
    const b = formatXml(v.input, minOpts).output; // minify the input
    check(a !== undefined && a === b, `[${v.id}] minify disagrees:\n  from output ${show(a)}\n  from input  ${show(b)}`); // the formatter touched only removable white space
  } // accept vectors
  for (const v of XML_REJECT_VECTORS) { // each malformed document
    const input = typeof v.input === "function" ? v.input() : v.input; // built only now
    const r = formatXml(input, DEFAULT_CHECK_OPTIONS); // the engine
    check(!r.ok && r.error?.code === v.code, `[${v.id}] expected ${v.code}, got ${r.ok ? "ok" : r.error?.code}`); // refused with the right code
    check(r.error?.line === v.line && r.error?.column === v.column, `[${v.id}] position: got ${r.error?.line}:${r.error?.column}, want ${v.line}:${v.column}`); // at the right place
  } // reject vectors
  return { setId: GOLDEN_VECTOR_SET_ID, total, passed: total - failures.length, failures }; // the report
} // verifyVectors
