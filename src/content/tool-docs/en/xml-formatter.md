## What it does

Paste an XML document and the tool first tells you whether it is well-formed. When it is not, you get the line, the column (counted in characters), a stable error code, a plain message naming the rule and its section in the XML 1.0 Recommendation, and the failing line with a caret under the column. When it is well-formed, you get it back pretty-printed with two spaces, four spaces or a tab per level, or minified, with comments kept or dropped. Everything runs in your browser.

Its rules come from the W3C Recommendation [Extensible Markup Language (XML) 1.0 (Fifth Edition)](https://www.w3.org/TR/xml/) of 26 November 2008. It sits beside the [JSON formatter](/tools/json-formatter) and the [JSON and YAML converter](/tools/json-yaml-convert). The [XML decoder](/tools/xml-decoder) is a different tool: it reads a document's structure and its attack surface (DOCTYPE, external entities, entity expansion) and does not rewrite it.

## What the verdict checks

These rules, each from the Recommendation, decide well-formedness here:

- **One root element** (section 2.1): exactly one element at the top level; before and after it only comments, processing instructions and white space.
- **Legal characters** (section 2.2): tab, line feed, carriage return and the Unicode ranges of the `Char` production. A control character such as U+0001, a lone surrogate, U+FFFE or U+FFFF is refused wherever it appears.
- **Names** (section 2.3): element and attribute names, processing-instruction targets and entity names follow the `Name` production, including letters outside ASCII.
- **Character data** (section 2.4): `&` and `<` never appear on their own in text, and the sequence `]]>` never appears in text.
- **Comments** (section 2.5): no `--` inside, and no `--->` at the end.
- **Processing instructions** (section 2.6): a target name, then white space or `?>`; the target is never `xml` in any mix of cases.
- **CDATA sections** (section 2.7): they end at the first `]]>` and only appear inside an element.
- **The XML declaration** (section 2.8): only at the very start, with nothing before it, and in the form `<?xml version="1.x" encoding="..." standalone="..."?>`, encoding and standalone optional and in that order.
- **The document type declaration** (section 2.8): once, before the root element, with a name, an optional `SYSTEM` or `PUBLIC` identifier (a public identifier uses only the characters production [13] allows) and an optional internal subset that holds only markup declarations, comments, processing instructions, parameter-entity references and white space, with no parameter-entity reference inside a declaration (the rule PEs in Internal Subset). Entity declarations in the internal subset are checked against their grammar (section 4.2).
- **Tags and attributes** (section 3.1): start, end and empty-element tags; every end tag matches the open element (Element Type Match); no attribute appears twice in a tag (Unique Att Spec); every attribute value is quoted and contains no `<`.
- **References** (section 4.1): every `&` starts a well-formed reference; a character reference names a legal character; an entity reference names a declared entity when the rule Entity Declared applies, which is without a DTD, with an internal subset only and no parameter-entity references, or with `standalone="yes"`. Without a declaration, only `&amp;`, `&lt;`, `&gt;`, `&apos;` and `&quot;` exist, so HTML names such as `&nbsp;` are refused. A reference to an entity declared with `NDATA` is refused (Parsed Entity), and so is a direct reference to an external entity inside an attribute value (No External Entity References).

What it does **not** check, said plainly:

- **Validity.** Whether the document follows a DTD, an XML Schema or any other schema is a separate question; this tool checks well-formedness only.
- **The inner grammar of `<!ELEMENT`, `<!ATTLIST` and `<!NOTATION` declarations**, and anything in an external DTD, which is never read.
- **Rules that need an entity's replacement text**, because no entity is ever expanded: an indirect reference to an external entity in an attribute value, a `<` reaching an attribute value through an entity, recursion between entities, and the well-formedness of the replacement text itself.
- **Names when the DOCTYPE points elsewhere.** When the DOCTYPE names an external DTD or the internal subset uses parameter entities (and the declaration does not say `standalone="yes"`), an entity name may be declared where this tool never reads, so unknown names are accepted and a note says so.
- **Namespaces.** Prefixes are kept as part of the names; whether each prefix is declared is a rule of the separate Namespaces in XML Recommendation, not of XML 1.0, and is not checked.
- **The encoding declaration.** What you paste is already text, so the encoding name is kept as written and not compared with anything.

## What "not significant" means here

Section 2.10 of the Recommendation says an XML processor "MUST always pass all characters in a document that are not markup through to the application". White space in a document is data unless something says otherwise. A formatter therefore has to decide which white space it may treat as layout, and this one decides narrowly:

- **The only text it changes is white space between elements**: a text node made only of spaces, tabs and line breaks, inside an element that has at least one child element and holds no other character data. Pretty mode replaces each such node with a line break and the indentation of the next line; minify removes it. White space outside the root element is markup under section 2.4, so it is laid out the same way.
- **Mixed content is never touched.** Section 3.2.2 says an element has mixed content when it "may contain character data, optionally interspersed with child elements". When an element holds text other than white space, any character or entity reference, or a CDATA section, its whole content, child elements included, is copied exactly as written: inserting a line break there would change the text.
- **`xml:space="preserve"` is honoured.** Section 2.10 defines the special attribute `xml:space` with the values `default` and `preserve`; `preserve` signals that applications should keep all the white space, and the intent applies to every element inside, "unless overridden with another instance of the xml:space attribute". Content under `preserve` is copied as written, and an element inside it with `xml:space="default"` is formatted again. Any other value is an error the Recommendation lets a processor recover from by ignoring the attribute; this tool ignores it for formatting, keeps it as written and adds a note.
- **An element with no child element keeps its content as written**, even when that content is only white space, or white space and comments. `<a>   </a>` stays `<a>   </a>`, and with comments dropped, `<a>` holding a comment between two line breaks keeps the two line breaks.

**A schema can still make that white space meaningful.** Without reading a DTD or a schema, a parser cannot know whether an element has element content or mixed content; section 2.10 asks only a validating processor to tell the application which white space appears in element content. A schema that declares an element as text could make even the white space between its children part of its value. If a consumer of your document cares, keep the original.

## What is kept exactly as written

- Text, CDATA sections, comments (unless you drop them) and processing instructions, character for character.
- The XML declaration, as typed, quotes included.
- Every attribute value between its quotes, with the quote character it was written with: single quotes stay single and double quotes stay double. Only the white space inside a tag is tidied: one space before each attribute, none around `=` and none before `>` or `/>`.
- Empty-element tags stay empty-element tags (`<b/>`), and a start tag followed by an end tag stays that way (`<c></c>`).
- Character references (`&#169;`, `&#x2122;`) and entity references (`&amp;`, `&org;`) are copied as written, never replaced by the characters they stand for.
- The DOCTYPE, internal subset included, is copied as text, line breaks and all.

Two changes always happen, and the result says so when they do: a byte order mark (U+FEFF) at the start is removed, and a carriage return followed by a line feed, or a carriage return alone, is read as a line feed, which section 2.11 requires every XML processor to do. The output ends without a final line break.

## Security: nothing is expanded, nothing is fetched

The tool never expands an entity, never reads an external DTD, and never fetches a `SYSTEM` or `PUBLIC` identifier: the DOCTYPE is kept as text, and the only thing it learns from an internal subset is which general entities are declared and how. A document built for an XML external entity attack or an entity-expansion attack is therefore just text here. The input is bounded at 2,000,000 characters and 1,000 levels of nesting, and the parser reads the text once, so a hostile document cannot make the page hang. To see what such a document would do to a parser that does expand entities, use the XML decoder.

## Signed documents

Do not reformat a signed document, such as a signed SAML assertion. To validate a reference, a verifier obtains the signed data, applies the signature's transforms, digests the result and compares it with the digest value in the signature; any mismatch fails validation ([XML Signature 1.1, section 3.2.1](https://www.w3.org/TR/xmldsig-core1/)). SAML's core specification says implementations SHOULD use Exclusive XML Canonicalization, both for the signed information and as a transform ([SAML 2.0 core, section 5.4.3](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf)). Exclusive canonicalization processes white space as Canonical XML does ([Exclusive XML Canonicalization, sections 1.1 and 3](https://www.w3.org/TR/xml-exc-c14n/)), and Canonical XML keeps "all whitespace in character content", including the white space between tags ([Canonical XML 1.1, section 1.1 and example 3.2](https://www.w3.org/TR/xml-c14n/)). Reindenting a signed document therefore changes the digest, and the signature no longer verifies. Reading a formatted copy is fine; sending it on is not. To read what a SAML message asserts, and whether and how it is signed, use the [SAML decoder](/tools/saml-decoder).

## Options

- **Mode.** Pretty puts each child of an element with element content on its own line, indented one level deeper than its parent, with the end tag back at the parent's level. Minify removes the same white space and adds none.
- **Indent.** Two spaces, four spaces or one tab per level (pretty mode only).
- **Keep comments.** On by default. Off, every comment is left out, inside and outside the root, and the counts say how many.

## Error codes

| Code | Meaning | Section |
|---|---|---|
| `empty` | Nothing but white space (shown by the API; the page simply waits) | |
| `too-large` | More than 2,000,000 characters | |
| `too-deep` | More than 1,000 nested elements | |
| `illegal-character` | A character outside `Char` | 2.2 |
| `bad-xml-declaration` | A malformed XML declaration, or `<?XML` at the start | 2.8 |
| `misplaced-xml-declaration` | An XML declaration anywhere but the very start | 2.6, 2.8 |
| `bad-pi` | A processing instruction without a valid target | 2.6 |
| `unterminated-pi` | No `?>` | 2.6 |
| `unterminated-comment` | No `-->` | 2.5 |
| `comment-double-hyphen` | `--` inside a comment, or `--->` | 2.5 |
| `unterminated-cdata` | No `]]>` | 2.7 |
| `cdata-outside-root` | A CDATA section outside every element | 2.7 |
| `bad-doctype` | A malformed DOCTYPE | 2.8 |
| `unterminated-doctype` | A DOCTYPE never closed | 2.8 |
| `bad-internal-subset` | Something other than declarations, comments, PIs, parameter-entity references and white space in the internal subset, a parameter-entity reference inside a declaration there, or a malformed entity declaration | 2.8, 4.2 |
| `misplaced-doctype` | A DOCTYPE after the root starts, or a second one | 2.8 |
| `unknown-markup` | `<!` that starts none of a comment, a CDATA section or the DOCTYPE | |
| `bad-start-tag` | A start tag without a valid name, or a stray character in it | 3.1 |
| `bad-attribute` | No `=`, no quotes, or no white space before an attribute | 3.1 |
| `duplicate-attribute` | The same attribute twice in a tag | 3.1 |
| `lt-in-attribute` | A `<` inside an attribute value | 3.1 |
| `unterminated-tag` | The input ends inside a tag | 3.1 |
| `bad-end-tag` | Anything but white space between an end tag's name and its `>` | 3.1 |
| `mismatched-end-tag` | An end tag that does not match the open element | 3.1 |
| `unexpected-end-tag` | An end tag with no open element | 3.1 |
| `unclosed-element` | An element never closed (reported where it opens) | 3.1 |
| `bad-reference` | `&` not followed by a well-formed reference | 2.4, 4.1 |
| `illegal-char-reference` | A character reference to a character outside `Char` | 4.1 |
| `undeclared-entity` | A reference to an entity that is not declared, when Entity Declared applies | 4.1 |
| `unparsed-entity-reference` | A reference to an entity declared with `NDATA` | 4.1 |
| `external-entity-in-attribute` | A direct reference to an external entity in an attribute value | 3.1 |
| `cdata-end-in-text` | `]]>` in text | 2.4 |
| `text-outside-root` | Text before or after the root element | 2.1, 2.8 |
| `multiple-roots` | A second top-level element | 2.1 |
| `no-root` | No element at all | 2.1 |

## Worked examples

- **The Example button**: a SAML 2.0-like Response on one line, as it arrives from a binding, with the `samlp` and `saml` namespaces, a `Success` status code and an `emailAddress` NameID (the names of the [OASIS SAML 2.0 core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) standard; the message is unsigned). Pretty-printed with two spaces it becomes 18 lines; minifying those lines gives the one line back, byte for byte. The `&amp;` inside `<saml:AttributeValue>admin &amp; auditor</saml:AttributeValue>` stays `&amp;`.
- **Mixed content**: in `<para>Use <code>--force</code> only when <emphasis>all</emphasis> nodes agree.</para>` nothing is reindented, and a `<para>` whose text runs over three lines keeps its line breaks, its spaces and the position of its end tag.
- **`xml:space`**: under `<poem xml:space="preserve">` the line break and the three spaces before the second `<line>` stay; inside `<listing xml:space="preserve">`, a child `<meta xml:space="default">` with two child elements is laid out again.
- **CDATA, comments, processing instructions**: `<step id="1"><![CDATA[if (a < b && c) { go(); }]]></step>` stays on one line as written; `<?xml-stylesheet type="text/xsl" href="view.xsl"?>` is a processing instruction (its target begins with `xml-`, which is not the reserved `xml`) and is kept; `<step id='2'>` keeps its single quotes.
- **A DOCTYPE with references**: `<from>&org;</from>` keeps `&org;` (declared in the internal subset, never expanded), `<sign>&#169; 2026 &#x2122;</sign>` keeps both character references, and `<to   lang = "pt-BR" >` becomes `<to lang="pt-BR">`.
- **Refusals**: `<a>AT&T</a>` stops at line 1, column 6 with `bad-reference`; `<a>&nbsp;</a>` with `undeclared-entity`; a line break before `<?xml version="1.0"?>` with `misplaced-xml-declaration` at line 2, column 1.

## Provenance

The engine is a single pass over the text with an explicit element stack, no clock, no network and no randomness. It ships golden vectors (set `xml-formatter-golden-2026-10-26`): 20 accepted documents whose output is pinned byte for byte, written out by hand from the rules above before the engine ran, and 42 refusals pinned by code, line and column, at least one for every error code. Every accepted document is also checked for two properties: formatting the output again changes nothing, and minifying the output gives the same text as minifying the input. During development, the verdicts were compared with those of the Expat 2.6.1 parser that comes with Python 3.13, on about 500,000 generated documents, and agreed on all of them except one class: Expat accepts a version number that is not "1." followed by digits, such as `"10"` or `"2.0"`, which production [26] of the Recommendation (`'1.' [0-9]+`) does not allow. The Recommendation's errata page was read the same day: its proposed correction S01 rewords the reserved names and calls the target `xml` forbidden, which production [17] already excludes, and E01 adds a note on Unicode normalisation; neither changes a rule the engine applies.

## API

The same engine answers the `/api/v1/xml-formatter` operation of the site's HTTP API, described in the OpenAPI contract on the [API page](/api); the contract also says whether this site serves the API.

- **Request.** The XML document as text, in the body of a POST or in the `input` query parameter of a GET. The API applies the default options: pretty, two spaces, comments kept.
- **Response.** `ok`; when well-formed, `output` and `stats` (`elements`, `attributes`, `comments`, `commentsDropped`, `cdataSections`, `processingInstructions`, `maxDepth`, `mixedContentElements`, `preserveElements`, `insignificantWhitespaceNodes`); otherwise `error`, with `code`, an English `message`, `line`, `column`, `offset`, `excerpt`, `excerptColumn` and `params`. Both carry `notes` (`bom-removed`, `line-endings-normalised`, `doctype-kept`, `entities-unchecked`, `xml-space-invalid`) and the `options` applied. A malformed document is a normal answer with `ok` false, not an HTTP error.

## Sources

- [W3C, Extensible Markup Language (XML) 1.0 (Fifth Edition), W3C Recommendation 26 November 2008](https://www.w3.org/TR/xml/) (read 2026-10-26): sections 2.1 to 2.11, 3.1, 3.2.2, 4.1 and 4.2; [errata](https://www.w3.org/XML/xml-V10-5e-errata) (read 2026-10-26)
- [W3C, Canonical XML Version 1.1, W3C Recommendation 2 May 2008](https://www.w3.org/TR/xml-c14n/) (read 2026-10-26; this address now serves version 1.1): section 1.1 and example 3.2
- [W3C, Exclusive XML Canonicalization Version 1.0, W3C Recommendation 18 July 2002](https://www.w3.org/TR/xml-exc-c14n/) (read 2026-10-26): sections 1.1 and 3
- [W3C, XML Signature Syntax and Processing Version 1.1, W3C Recommendation 11 April 2013](https://www.w3.org/TR/xmldsig-core1/) (read 2026-10-26): section 3.2.1
- [OASIS, Assertions and Protocols for the OASIS Security Assertion Markup Language (SAML) V2.0, OASIS Standard, 15 March 2005](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) (read 2026-10-26): section 5.4.3, and the namespace names, the Success status code and the emailAddress NameID format used in the Example
