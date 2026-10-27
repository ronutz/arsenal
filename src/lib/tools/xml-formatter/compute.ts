// ============================================================================
// src/lib/tools/xml-formatter/compute.ts
// ----------------------------------------------------------------------------
// XML formatter-validator: the pure engine (D-49: deterministic, local, no
// clock, no network, no randomness).
//
// WHAT IT DOES
// ------------
// Reads one XML document, says whether it is well-formed (and, when it is not,
// where: line, column and a plain message with a stable code), and writes it
// back pretty-printed (two spaces, four spaces or a tab per level) or minified,
// keeping or dropping comments.
//
// WHY IT HAS ITS OWN TOKENIZER
// ----------------------------
// The xml-decoder's parser (src/lib/tools/xml-decoder/compute.ts) was read
// first, to reuse it. Its API cannot carry a formatter: it drops
// whitespace-only text nodes (which xml:space="preserve" and mixed content
// need byte for byte), trims processing-instruction data, keeps attribute
// values without their quote character, records no source positions (so no
// line and column), and finds the end of a tag with the first ">" (a ">"
// inside an attribute value would cut the tag). A formatter has to be
// lossless, so this module tokenizes on its own; the decoder is untouched.
//
// THE RULES IT APPLIES (W3C, Extensible Markup Language (XML) 1.0 (Fifth
// Edition), W3C Recommendation 26 November 2008, read 2026-10-26 at
// https://www.w3.org/TR/xml/; its errata page was read the same day):
//   2.1   one root element, nesting properly; nothing but comments,
//         processing instructions and white space after it (Misc).
//   2.2   the Char production: tab, line feed, carriage return, #x20-#xD7FF,
//         #xE000-#xFFFD, #x10000-#x10FFFF. Anything else is refused.
//   2.3   S (white space) is exactly space, tab, carriage return, line feed;
//         Name, NameStartChar and NameChar productions [4], [4a], [5].
//   2.4   & and < never appear literally in character data; "]]>" never
//         appears in character data.
//   2.5   a comment may not contain "--" and may not end in "--->".
//   2.6   a processing instruction is a target Name (not "xml" in any case)
//         followed by white space and data, or by "?>" at once.
//   2.7   a CDATA section runs to the first "]]>"; it occurs only where
//         character data may (inside an element).
//   2.8   the XML declaration [23]-[26], only at the very start; the document
//         type declaration [28], once, before the root element, its internal
//         subset holding only declarations, comments, PIs, PE references and
//         S ([28a], [28b], [29]), with no PE reference inside a declaration
//         (WFC PEs in Internal Subset); a PubidLiteral uses PubidChar ([13]).
//   2.10  white space handling and xml:space ("default", "preserve", inherited
//         by descendants until overridden; other values are an error the
//         processor MAY report or recover from by ignoring the attribute).
//   2.11  line breaks: CR LF and a lone CR are read as LF.
//   3.1   start-tags, end-tags, empty-element tags; Element Type Match;
//         Unique Att Spec; AttValue excludes "<".
//   3.2.2 mixed content is character data, optionally interspersed with child
//         elements: an element holding any is copied as written, whole.
//   4.1   character references must name a legal Char; entity references
//         must name a declared entity when the WFC Entity Declared applies,
//         never an unparsed (NDATA) entity (WFC Parsed Entity), and, in an
//         attribute value, never directly an external entity (3.1, WFC No
//         External Entity References).
//   4.2   entity declarations [70]-[76]; the first declaration binds.
//
// WHAT IT NEVER DOES (security, stated in the docs): it never expands an
// entity, never reads or fetches a DTD or any SYSTEM/PUBLIC identifier, and
// keeps the DOCTYPE as text. Every reference is copied as written.
//
// The tokenizer is a hand-written character loop with an explicit element
// stack (no recursion while parsing); names are matched by one sticky,
// anchored regular expression made of two character classes (linear, so
// ReDoS-safe). Input is bounded in length and nesting depth.
// ============================================================================

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Stable failure codes; the component maps each one to a localised message. */
export type XmlFormatErrorCode =
  | "empty" // nothing but white space was given
  | "too-large" // longer than MAX_INPUT_CHARS
  | "too-deep" // nested deeper than MAX_DEPTH
  | "illegal-character" // a character outside the Char production (2.2)
  | "bad-xml-declaration" // the XML declaration does not match [23]-[26] (2.8)
  | "misplaced-xml-declaration" // "<?xml " anywhere but the very start (2.6, 2.8)
  | "bad-pi" // a processing instruction without a valid target (2.6)
  | "unterminated-pi" // no "?>"
  | "unterminated-comment" // no "-->"
  | "comment-double-hyphen" // "--" inside a comment, or "--->" (2.5)
  | "unterminated-cdata" // no "]]>"
  | "cdata-outside-root" // a CDATA section outside every element (2.7)
  | "bad-doctype" // "<!DOCTYPE" not followed by white space and a Name (2.8)
  | "unterminated-doctype" // the DOCTYPE is never closed
  | "bad-internal-subset" // the internal subset holds something other than declarations, comments, PIs, PE references and S
  | "misplaced-doctype" // a DOCTYPE after the root element starts, or a second one (2.8)
  | "unknown-markup" // "<!" that starts neither a comment, a CDATA section nor the DOCTYPE
  | "bad-start-tag" // a start tag without a valid name, or a stray character in it (3.1)
  | "bad-attribute" // an attribute without "=", without quotes, or not separated by white space (3.1)
  | "duplicate-attribute" // Unique Att Spec (3.1)
  | "lt-in-attribute" // "<" inside an attribute value (3.1, AttValue [10])
  | "unterminated-tag" // the input ends inside a tag
  | "bad-end-tag" // an end tag that is not "</" Name S? ">" (3.1)
  | "mismatched-end-tag" // Element Type Match (3.1)
  | "unexpected-end-tag" // an end tag with no open element
  | "unclosed-element" // the input ends with an element still open
  | "bad-reference" // "&" that does not start a valid reference (2.4, 4.1)
  | "illegal-char-reference" // a character reference to a character outside Char (4.1)
  | "undeclared-entity" // WFC Entity Declared (4.1)
  | "unparsed-entity-reference" // WFC Parsed Entity (4.1): a reference to an NDATA entity
  | "external-entity-in-attribute" // WFC No External Entity References (3.1): a direct reference to an external entity in an attribute value
  | "cdata-end-in-text" // "]]>" in character data (2.4)
  | "text-outside-root" // non-white-space text before or after the root element (2.1, 2.8)
  | "multiple-roots" // a second top-level element (2.1)
  | "no-root"; // no element at all (2.1)

/** Non-fatal observations reported with a successful result. */
export type XmlFormatNote =
  | "bom-removed" // a leading U+FEFF byte order mark was dropped
  | "line-endings-normalised" // CR LF or CR was read as LF (2.11)
  | "doctype-kept" // a DOCTYPE was present and copied as text, nothing expanded or fetched
  | "entities-unchecked" // entity names could not be checked without reading external declarations
  | "xml-space-invalid"; // an xml:space value other than "default" or "preserve" was ignored (2.10)

/** Indentation per level: two spaces, four spaces or one tab. */
export type IndentStyle = 2 | 4 | "tab";

/** The three choices the tool offers. */
export interface FormatOptions {
  /** "pretty" reindents element content; "minify" removes its white space. */
  mode: "pretty" | "minify";
  /** Characters per level in pretty mode (ignored when minifying). */
  indent: IndentStyle;
  /** Keep comments as written, or drop them. */
  comments: "keep" | "drop";
}

/** The defaults the page opens with and the API uses. */
export const DEFAULT_OPTIONS: Readonly<FormatOptions> = Object.freeze({ mode: "pretty", indent: 2, comments: "keep" }); // pretty, two spaces, comments kept

/** Where a document failed, and why. */
export interface XmlFormatErrorInfo {
  /** The stable code. */
  code: XmlFormatErrorCode;
  /** An English message (the API's; the page localises from `code` and `params`). */
  message: string;
  /** 1-based line, counted after line-break normalisation (2.11). */
  line: number;
  /** 1-based column, counted in characters (code points). */
  column: number;
  /** 0-based offset into the normalised text, in UTF-16 code units. */
  offset: number;
  /** The failing line, cut to a window of at most 120 characters around the column. */
  excerpt: string;
  /** 1-based column of the failure inside `excerpt`. */
  excerptColumn: number;
  /** Values for the message: element names, the character, a limit. */
  params: Record<string, string>;
}

/** Counts that explain what the formatter did. */
export interface XmlFormatStats {
  /** Elements in the document. */
  elements: number;
  /** Attribute specifications, namespace declarations included. */
  attributes: number;
  /** Comments in the input (kept or not). */
  comments: number;
  /** Comments left out of the output because "drop" was chosen. */
  commentsDropped: number;
  /** CDATA sections. */
  cdataSections: number;
  /** Processing instructions (the XML declaration is not one). */
  processingInstructions: number;
  /** Deepest element nesting; the root is depth 1. */
  maxDepth: number;
  /** Elements with mixed content: their whole content is copied as written. */
  mixedContentElements: number;
  /** Elements carrying xml:space="preserve": their content is copied as written. */
  preserveElements: number;
  /** White-space-only text nodes in element content: the only text the formatter replaces or removes. */
  insignificantWhitespaceNodes: number;
}

/** The engine's answer. Never thrown: a failure is { ok: false, error }. */
export interface XmlFormatResult {
  /** True when the document is well-formed (as far as this tool checks). */
  ok: boolean;
  /** The formatted document, when ok. */
  output?: string;
  /** Where and why it failed, when not ok. */
  error?: XmlFormatErrorInfo;
  /** Non-fatal observations, in a fixed order. */
  notes: XmlFormatNote[];
  /** Counts, when ok. */
  stats?: XmlFormatStats;
  /** The options that were applied. */
  options: FormatOptions;
}

// ---------------------------------------------------------------------------
// Bounds
// ---------------------------------------------------------------------------

/** The longest input read, in UTF-16 code units (two million). */
export const MAX_INPUT_CHARS = 2_000_000; // far above any SAML message or config file; keeps the page responsive

/** The deepest element nesting read (the serializer recurses once per level). */
export const MAX_DEPTH = 1000; // well inside every browser's call stack

// ---------------------------------------------------------------------------
// The thrown failure (internal; formatXml turns it into XmlFormatErrorInfo)
// ---------------------------------------------------------------------------

/** A well-formedness failure at a position in the normalised text. */
export class XmlFormatError extends Error {
  /** The stable code. */
  code: XmlFormatErrorCode;
  /** 0-based offset in the normalised text. */
  offset: number;
  /** Values for the message. */
  params: Record<string, string>;
  /**
   * @param code the stable code
   * @param offset where in the normalised text the failure is
   * @param params values for the message
   */
  constructor(code: XmlFormatErrorCode, offset: number, params: Record<string, string> = {}) {
    super(code); // the code doubles as the developer message
    this.code = code; // kept for the result
    this.offset = offset; // kept for line and column
    this.params = params; // kept for the message
  } // constructor
} // XmlFormatError

// ---------------------------------------------------------------------------
// English messages (the API's text; the page uses its own localised strings)
// ---------------------------------------------------------------------------

/** One English sentence per code; {name}-style slots are filled from params. */
const MESSAGES: Record<XmlFormatErrorCode, string> = {
  "empty": "The input is empty: there is no XML document to check.", // nothing to read
  "too-large": "The input is longer than {max} characters, the most this tool reads.", // the length bound
  "too-deep": "Elements are nested more than {max} levels deep, the most this tool reads.", // the depth bound
  "illegal-character": "The character {char} is not allowed anywhere in an XML 1.0 document (section 2.2, Char).", // 2.2
  "bad-xml-declaration": "The XML declaration is malformed: it is <?xml version=\"1.x\"?>, optionally with encoding and then standalone, in that order (section 2.8).", // [23]-[26]
  "misplaced-xml-declaration": "An XML declaration may only be the very first thing in the document, with nothing before it, not even white space (sections 2.6 and 2.8).", // reserved target
  "bad-pi": "A processing instruction starts with a target name, then white space or ?> (section 2.6).", // [16], [17]
  "unterminated-pi": "This processing instruction is never closed with ?>.", // no "?>"
  "unterminated-comment": "This comment is never closed with -->.", // no "-->"
  "comment-double-hyphen": "A comment may not contain -- and may not end with ---> (section 2.5).", // [15]
  "unterminated-cdata": "This CDATA section is never closed with ]]>.", // no "]]>"
  "cdata-outside-root": "A CDATA section may only appear inside an element (section 2.7).", // 2.7
  "bad-doctype": "The document type declaration is malformed: <!DOCTYPE is followed by white space and the root element's name (section 2.8).", // [28]
  "unterminated-doctype": "The document type declaration is never closed with >.", // no ">"
  "bad-internal-subset": "The internal DTD subset may hold only markup declarations (<!ELEMENT, <!ATTLIST, <!ENTITY, <!NOTATION), comments, processing instructions, parameter-entity references and white space; a parameter-entity reference may not appear inside a declaration there, and an entity declaration must follow its grammar (sections 2.8 and 4.2).", // [28b], [29], WFC PEs in Internal Subset
  "misplaced-doctype": "The document type declaration must come once, before the root element (section 2.8).", // prolog
  "unknown-markup": "Unrecognised markup: in a document, <! starts only a comment, a CDATA section or the document type declaration.", // "<!" otherwise
  "bad-start-tag": "Malformed start tag: a name, an attribute, > or /> was expected here (section 3.1). Write &lt; for a literal less-than sign.", // [40], [44]
  "bad-attribute": "Malformed attribute: an attribute is a name, =, and a value in single or double quotes, separated from the one before it by white space (section 3.1).", // [41]
  "duplicate-attribute": "The attribute {name} appears twice in the same tag (section 3.1, Unique Att Spec).", // WFC
  "lt-in-attribute": "An attribute value may not contain a literal less-than sign; write &lt; (section 3.1, AttValue).", // [10]
  "unterminated-tag": "This tag is never closed with > or />.", // EOF inside a tag
  "bad-end-tag": "Malformed end tag: it is </, the element name, optional white space and > (section 3.1).", // [42]
  "mismatched-end-tag": "The end tag {found} does not match the open element {expected} (section 3.1, Element Type Match).", // WFC
  "unexpected-end-tag": "The end tag {found} has no open element to close.", // stack empty
  "unclosed-element": "The element {name} opened here is never closed.", // EOF with open elements
  "bad-reference": "A & must start a reference such as &amp;, &#38; or &#x26; (sections 2.4 and 4.1); write &amp; for a literal ampersand.", // 2.4
  "illegal-char-reference": "The character reference {ref} names a character XML 1.0 does not allow (section 4.1, Legal Character).", // WFC
  "undeclared-entity": "The entity {ref} is not declared: without a declaration only &amp;, &lt;, &gt;, &apos; and &quot; may be used (section 4.1, Entity Declared).", // WFC
  "unparsed-entity-reference": "The entity {ref} is an unparsed entity (declared with NDATA): it may be named only in an ENTITY or ENTITIES attribute, never referenced with & and ; (section 4.1, Parsed Entity).", // WFC
  "external-entity-in-attribute": "The entity {ref} is an external entity: an attribute value may not refer to it (section 3.1, No External Entity References).", // WFC
  "cdata-end-in-text": "The sequence ]]> may not appear in text; write ]]&gt; (section 2.4).", // [14]
  "text-outside-root": "Text is not allowed outside the root element: only comments, processing instructions and white space may surround it (sections 2.1 and 2.8).", // Misc
  "multiple-roots": "A second top-level element starts here: a document has exactly one root element (section 2.1).", // [1]
  "no-root": "The document has no root element (section 2.1).", // [1]
}; // MESSAGES

/**
 * Fill a message's {slots} from params.
 * @param code the failure code
 * @param params the slot values
 * @returns the English sentence
 */
function messageFor(code: XmlFormatErrorCode, params: Record<string, string>): string {
  return MESSAGES[code].replace(/\{([a-z]+)\}/g, (_m, k: string) => params[k] ?? ""); // each {slot} replaced, an unknown one emptied
} // messageFor

// ---------------------------------------------------------------------------
// Character classes (2.2, 2.3)
// ---------------------------------------------------------------------------

/** NameStartChar, production [4], as a character-class body (needs the u flag). */
const NAME_START =
  ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D" + // Latin, Greek and the rest of the BMP's first part
  "\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}"; // the rest, astral planes included

/** NameChar, production [4a]: NameStartChar plus "-", ".", digits, #xB7 and two ranges. */
const NAME_CHAR = NAME_START + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040"; // the extra characters a name may continue with

/** A Name at a given position: sticky (y), so it matches only there; two classes in a row, linear. */
const NAME_AT = new RegExp(`[${NAME_START}][${NAME_CHAR}]*`, "uy"); // production [5]

/**
 * Read the Name starting exactly at `pos`.
 * @param src the text
 * @param pos where the name must start
 * @returns the name, or "" when none starts there
 */
function nameAt(src: string, pos: number): string {
  NAME_AT.lastIndex = pos; // anchor the sticky match
  const m = NAME_AT.exec(src); // one attempt, at pos only
  return m ? m[0] : ""; // the name or nothing
} // nameAt

/**
 * Is this character XML white space (S, production [3])?
 * @param c one UTF-16 code unit as a string, or undefined past the end
 * @returns true for space, tab, line feed and carriage return
 */
function isS(c: string | undefined): boolean {
  return c === " " || c === "\t" || c === "\n" || c === "\r"; // the four characters of S
} // isS

/**
 * Is this code point a legal Char (production [2])?
 * @param cp a Unicode code point
 * @returns true when XML 1.0 allows it
 */
function isLegalCodePoint(cp: number): boolean {
  if (cp === 0x9 || cp === 0xa || cp === 0xd) return true; // tab, line feed, carriage return
  if (cp >= 0x20 && cp <= 0xd7ff) return true; // the BMP below the surrogates
  if (cp >= 0xe000 && cp <= 0xfffd) return true; // the BMP above them, less FFFE and FFFF
  return cp >= 0x10000 && cp <= 0x10ffff; // the supplementary planes
} // isLegalCodePoint

/**
 * Find the first character outside Char, if any.
 * @param src the normalised text
 * @returns its offset and code point, or null when every character is legal
 */
function firstIllegalChar(src: string): { offset: number; cp: number } | null {
  for (let k = 0; k < src.length; k++) { // every UTF-16 code unit
    const c = src.charCodeAt(k); // this unit
    if (c >= 0xd800 && c <= 0xdbff) { // a high surrogate: must be followed by a low one
      const d = src.charCodeAt(k + 1); // the next unit (NaN past the end)
      if (d >= 0xdc00 && d <= 0xdfff) { k++; continue; } // a well-formed pair: a supplementary character, always legal
      return { offset: k, cp: c }; // a lone high surrogate
    } // high surrogate
    if (!isLegalCodePoint(c)) return { offset: k, cp: c }; // a control character, a lone low surrogate, FFFE or FFFF
  } // every unit
  return null; // all legal
} // firstIllegalChar

/**
 * Write a code point the way the messages show it.
 * @param cp the code point
 * @returns "U+0001" style text
 */
function uPlus(cp: number): string {
  return "U+" + cp.toString(16).toUpperCase().padStart(4, "0"); // at least four hex digits
} // uPlus

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

/** One attribute, kept exactly as written. */
interface Attr {
  /** The attribute name. */
  name: string;
  /** The value between the quotes, references and white space untouched. */
  raw: string;
  /** The quote character it was written with. */
  quote: '"' | "'";
}

/** An element. */
interface ElementNode {
  kind: "element"; // discriminator
  name: string; // the element type
  attrs: Attr[]; // in source order
  empty: boolean; // written as an empty-element tag <a/>
  children: ContentNode[]; // the content, in order
  space: "preserve" | "default" | null; // this element's own valid xml:space value, if any
  offset: number; // where its start tag begins (for "unclosed-element")
}

/** Character data between markup, exactly as written. */
interface TextNode {
  kind: "text"; // discriminator
  raw: string; // the characters, references unexpanded
  ws: boolean; // true when it is only S characters and holds no reference
}

/** A CDATA section, comment or processing instruction, copied verbatim. */
interface RawNode {
  kind: "cdata" | "comment" | "pi"; // which construct
  raw: string; // the whole construct, delimiters included
}

/** What an element may contain. */
type ContentNode = ElementNode | TextNode | RawNode;

/** What may stand at the top level, outside the root element (white space is not kept). */
type TopNode = ElementNode | RawNode | { kind: "decl" | "doctype"; raw: string };

/** What the tokenizer hands the serializer. */
interface ParsedDocument {
  top: TopNode[]; // declaration, DOCTYPE, comments, PIs and the root, in order
  notes: Set<XmlFormatNote>; // observations
  stats: XmlFormatStats; // counts gathered while reading
}

// ---------------------------------------------------------------------------
// The tokenizer
// ---------------------------------------------------------------------------

/** The XML declaration, productions [23]-[26] and [80]-[81], matched on the text up to its "?>". */
const XML_DECL =
  /^<\?xml[ \t\n]+version[ \t\n]*=[ \t\n]*(?:"1\.[0-9]+"|'1\.[0-9]+')(?:[ \t\n]+encoding[ \t\n]*=[ \t\n]*(?:"[A-Za-z][A-Za-z0-9._-]*"|'[A-Za-z][A-Za-z0-9._-]*'))?(?:[ \t\n]+standalone[ \t\n]*=[ \t\n]*(?:"(?:yes|no)"|'(?:yes|no)'))?[ \t\n]*\?>$/; // anchored; each optional part starts with a distinct keyword

/** The five entities every document may use undeclared (4.1, WFC Entity Declared). */
const PREDEFINED = new Set(["amp", "lt", "gt", "apos", "quot"]); // 4.6

/** How a general entity was declared in the internal subset: a literal value, an external identifier, or NDATA. */
type EntityKind = "internal" | "external" | "unparsed";

/** What the DOCTYPE tells the reference checker. */
interface EntityContext {
  /** True when the WFC Entity Declared applies (no DTD, or an internal subset only and no PE references, or standalone="yes"). */
  enforce: boolean;
  /** General entities declared in the internal subset, by kind (never expanded). */
  declared: Map<string, EntityKind>;
}

/**
 * Check every reference in a run of character data or an attribute value.
 * @param src the whole normalised text
 * @param start where the run begins
 * @param end where it ends (exclusive)
 * @param ents what the DOCTYPE allows
 * @param inAttribute true for an attribute value, where a direct reference to an external entity is refused
 * @returns true when the run holds at least one reference
 */
function checkReferences(src: string, start: number, end: number, ents: EntityContext, inAttribute: boolean): boolean {
  let found = false; // any reference seen
  const seg = src.slice(start, end); // the run alone, so no search ever reads past its end (linear overall)
  /** The next ampersand at or after an absolute offset, inside the run, or -1. */
  const nextAmp = (from: number): number => { const r = seg.indexOf("&", from - start); return r === -1 ? -1 : r + start; }; // absolute offset
  let p = nextAmp(start); // the first ampersand
  while (p !== -1 && p < end) { // every ampersand inside the run
    found = true; // a reference (or an error)
    if (src[p + 1] === "#") { // a character reference
      const hex = src[p + 2] === "x"; // &#x...; or &#...;
      let q = p + (hex ? 3 : 2); // first digit
      const digitsStart = q; // remembered for the value
      while (q < end && (hex ? /[0-9a-fA-F]/.test(src[q]) : /[0-9]/.test(src[q]))) q++; // the digits
      if (q === digitsStart || src[q] !== ";") throw new XmlFormatError("bad-reference", p); // no digits, or no ";"
      const digits = src.slice(digitsStart, q); // the number as written
      const cp = digits.length > 8 ? -1 : parseInt(digits, hex ? 16 : 10); // too many digits cannot be legal
      if (cp < 0 || !isLegalCodePoint(cp)) throw new XmlFormatError("illegal-char-reference", p, { ref: src.slice(p, q + 1) }); // WFC Legal Character
      p = nextAmp(q + 1); // the next ampersand
      continue; // next reference
    } // character reference
    const name = nameAt(src, p + 1); // an entity reference's name
    if (!name || p + 1 + name.length >= end || src[p + 1 + name.length] !== ";") throw new XmlFormatError("bad-reference", p); // "&" not followed by Name ";"
    const kind = ents.declared.get(name); // how the internal subset declared it, if it did
    if (!PREDEFINED.has(name) && ents.enforce && !kind) { // WFC Entity Declared applies and the name is unknown
      throw new XmlFormatError("undeclared-entity", p, { ref: "&" + name + ";" }); // refused
    } // declared or not checkable
    if (kind === "unparsed") throw new XmlFormatError("unparsed-entity-reference", p, { ref: "&" + name + ";" }); // WFC Parsed Entity
    if (kind === "external" && inAttribute) throw new XmlFormatError("external-entity-in-attribute", p, { ref: "&" + name + ";" }); // WFC No External Entity References (direct references; indirect ones would need expansion)
    p = nextAmp(p + name.length + 2); // the next ampersand
  } // every ampersand
  return found; // whether the run holds a reference
} // checkReferences

/** A PubidLiteral's content: PubidChar* (production [13]); the quote that delimits it cannot occur inside. */
const PUBID_CHARS = /^[\x20\x0D\x0Aa-zA-Z0-9\-'()+,./:=?;!*#@$_%]*$/; // one class, anchored: linear

/** The four markup declaration keywords of the internal subset (production [29]). */
const MARKUP_DECLS = ["<!ELEMENT", "<!ATTLIST", "<!ENTITY", "<!NOTATION"] as const; // elementdecl, AttlistDecl, EntityDecl, NotationDecl

/**
 * Find the end of a comment and apply its rule (2.5); shared by content and the internal subset.
 * @param src the normalised text
 * @param i where "<!--" starts
 * @param unterminated the code to throw when "-->" never comes
 * @param errAt the offset to report an unterminated comment at
 * @returns the offset just past "-->"
 */
function scanComment(src: string, i: number, unterminated: XmlFormatErrorCode, errAt: number): number {
  const close = src.indexOf("-->", i + 4); // its end
  if (close === -1) throw new XmlFormatError(unterminated, errAt); // never closed
  const body = src.slice(i + 4, close); // between the delimiters
  const dd = body.indexOf("--"); // "--" is not allowed inside
  if (dd !== -1) throw new XmlFormatError("comment-double-hyphen", i + 4 + dd); // refused where it starts
  if (body.endsWith("-")) throw new XmlFormatError("comment-double-hyphen", close - 1); // "--->" is not allowed either
  return close + 3; // past it
} // scanComment

/**
 * Check one entity declaration (productions [70]-[76]) and find its end. Nothing in it is expanded or fetched.
 *   GEDecl ::= '<!ENTITY' S Name S EntityDef S? '>'      EntityDef ::= EntityValue | (ExternalID NDataDecl?)
 *   PEDecl ::= '<!ENTITY' S '%' S Name S PEDef S? '>'    PEDef ::= EntityValue | ExternalID
 * @param src the normalised text
 * @param j where "<!ENTITY" starts
 * @param doctypeAt where the DOCTYPE starts (for "unterminated-doctype")
 * @returns the offset just past ">", the entity's name when it is a general entity (null for a parameter entity), and its kind
 */
function scanEntityDecl(src: string, j: number, doctypeAt: number): { end: number; general: string | null; kind: EntityKind } {
  const n = src.length; // the end of the input
  /** Fail here: unterminated at the end of the input, malformed otherwise. */
  const bad = (at: number): never => { throw new XmlFormatError(at >= n ? "unterminated-doctype" : "bad-internal-subset", at >= n ? doctypeAt : at); }; // the right code
  /** Require S at `at` and return the offset past it. */
  const needS = (at: number): number => { if (!isS(src[at])) bad(at); while (isS(src[at])) at++; return at; }; // S is required
  /** A quoted literal at `at`; returns the offset past it and the text inside. */
  const quoted = (at: number): { end: number; text: string } => {
    const q = src[at]; // the quote
    if (q !== '"' && q !== "'") bad(at); // a literal is quoted
    const close = src.indexOf(q, at + 1); // its closing quote
    if (close === -1) bad(n); // never closed
    return { end: close + 1, text: src.slice(at + 1, close) }; // past it, and its content
  }; // quoted
  let k = needS(j + 8); // after "<!ENTITY" S
  const pe = src[k] === "%"; // a parameter entity
  if (pe) k = needS(k + 1); // "%" S
  const name = nameAt(src, k); // the entity's name
  if (!name) bad(k); // a Name is required
  k = needS(k + name.length); // S after the name
  let kind: EntityKind = "internal"; // a literal value unless an ExternalID follows
  if (src[k] === '"' || src[k] === "'") { // an EntityValue ([9])
    const lit = quoted(k); // the literal
    // Inside an EntityValue, "&" starts a Reference (checked for syntax only) and "%" a PEReference, which the WFC
    // PEs in Internal Subset (2.8) forbids inside a markup declaration of the internal subset; a bare "%" is excluded by [9].
    for (let x = 0; x < lit.text.length; x++) { // each character
      const ch = lit.text[x]; // this one
      if (ch !== "%" && ch !== "&") continue; // ordinary text
      const at = k + 1 + x; // its offset
      if (ch === "%") bad(at); // a parameter-entity reference (or a bare "%") inside the declaration
      if (ch === "&" && src[at + 1] === "#") { // a character reference
        const hex = src[at + 2] === "x"; // which base
        let y = at + (hex ? 3 : 2); // first digit
        const d0 = y; // remembered
        while (y < n && (hex ? /[0-9a-fA-F]/.test(src[y]) : /[0-9]/.test(src[y]))) y++; // the digits
        if (y === d0 || src[y] !== ";") bad(at); // no digits, or no ";"
        x = y - (k + 1); // past it
        continue; // next character
      } // character reference
      const rn = nameAt(src, at + 1); // the referenced name
      if (!rn || src[at + 1 + rn.length] !== ";") bad(at); // not "&" Name ";"
      x += rn.length + 1; // past it
    } // characters
    k = lit.end; // past the value
  } else if (src.startsWith("SYSTEM", k) || src.startsWith("PUBLIC", k)) { // an ExternalID ([75]): named, never fetched
    const pub = src.startsWith("PUBLIC", k); // which form
    kind = "external"; // an external parsed entity, unless NDATA follows
    const first = quoted(needS(k + 6)); // the first literal
    if (pub && !PUBID_CHARS.test(first.text)) bad(first.end - first.text.length - 2); // a PubidLiteral allows only PubidChar
    k = first.end; // past it
    if (pub) k = quoted(needS(k)).end; // the PUBLIC form has a second one
    let look = k; // a look-ahead for NDataDecl ([76]), general entities only
    while (isS(src[look])) look++; // S
    if (!pe && look > k && src.startsWith("NDATA", look)) { // an unparsed entity
      k = needS(look + 5); // "NDATA" S
      const nd = nameAt(src, k); // the notation name
      if (!nd) bad(k); // a Name is required
      k += nd.length; // past it
      kind = "unparsed"; // an unparsed entity
    } // NDataDecl
  } else bad(k); // neither a value nor an external identifier
  while (isS(src[k])) k++; // S?
  if (src[k] !== ">") bad(k); // only ">" may close it
  return { end: k + 1, general: pe ? null : name, kind }; // past ">", the name and the kind
} // scanEntityDecl

/**
 * Read the document type declaration (production [28]) far enough to find its end and to learn what the
 * reference checker needs. The DOCTYPE itself is copied as text: no entity is expanded, no external subset or
 * SYSTEM/PUBLIC identifier is read or fetched, and the inner grammar of each markup declaration is not checked;
 * the internal subset is checked only to hold markup declarations, comments, processing instructions,
 * parameter-entity references and white space (productions [28a], [28b], [29]), with no parameter-entity
 * reference inside a declaration (WFC PEs in Internal Subset), and entity declarations against [70]-[76].
 * @param src the normalised text
 * @param i where "<!DOCTYPE" starts
 * @returns the offset just past its ">", whether an external subset is named, whether the internal subset holds
 *          a parameter-entity reference, and the general entities it declares
 */
function scanDoctype(src: string, i: number): { end: number; hasExternal: boolean; hasPeRef: boolean; declared: Map<string, EntityKind> } {
  const n = src.length; // the end of the input
  const declared = new Map<string, EntityKind>(); // general entities declared in the internal subset, by kind
  let hasExternal = false; // SYSTEM or PUBLIC seen
  let hasPeRef = false; // a PEReference in the internal subset
  let j = i + 9; // after "<!DOCTYPE"
  if (j >= n) throw new XmlFormatError("unterminated-doctype", i); // the input ends here
  if (!isS(src[j])) throw new XmlFormatError("bad-doctype", j); // S is required
  while (isS(src[j])) j++; // skip it
  const dtName = nameAt(src, j); // the root element type
  if (!dtName) throw new XmlFormatError(j >= n ? "unterminated-doctype" : "bad-doctype", j >= n ? i : j); // a Name is required
  j += dtName.length; // past the name
  /** Read a quoted literal at j (SystemLiteral or PubidLiteral) and return the offset past it. */
  const literal = (at: number): number => {
    const q = src[at]; // the quote
    if (at >= n) throw new XmlFormatError("unterminated-doctype", i); // the input ends here
    if (q !== '"' && q !== "'") throw new XmlFormatError("bad-doctype", at); // a literal is quoted
    const close = src.indexOf(q, at + 1); // its closing quote
    if (close === -1) throw new XmlFormatError("unterminated-doctype", i); // never closed
    return close + 1; // past it
  }; // literal
  /** Require S at j and return the offset past it. */
  const needS = (at: number): number => {
    if (at >= n) throw new XmlFormatError("unterminated-doctype", i); // the input ends here
    if (!isS(src[at])) throw new XmlFormatError("bad-doctype", at); // S is required here
    while (isS(src[at])) at++; // skip it
    return at; // past it
  }; // needS
  // ---- (S ExternalID)?  ExternalID ::= 'SYSTEM' S SystemLiteral | 'PUBLIC' S PubidLiteral S SystemLiteral ([75]) ----
  let k = j; // a look-ahead
  while (isS(src[k])) k++; // optional S
  if (k > j && (src.startsWith("SYSTEM", k) || src.startsWith("PUBLIC", k))) { // an ExternalID
    hasExternal = true; // an external subset is named; this tool never reads it
    const pub = src.startsWith("PUBLIC", k); // which form
    const first = needS(k + 6); // where the first literal starts
    k = literal(first); // the first literal
    if (pub && !PUBID_CHARS.test(src.slice(first + 1, k - 1))) throw new XmlFormatError("bad-doctype", first); // a PubidLiteral allows only PubidChar
    if (pub) k = literal(needS(k)); // the PUBLIC form has a second one
    j = k; // past the ExternalID
  } // ExternalID
  while (isS(src[j])) j++; // S?
  // ---- ('[' intSubset ']' S?)? ----
  if (src[j] === "[") { // the internal subset
    j++; // past "["
    for (;;) { // one item per pass
      if (j >= n) throw new XmlFormatError("unterminated-doctype", i); // the subset never ends
      const c = src[j]; // this character
      if (isS(c)) { j++; continue; } // DeclSep white space
      if (c === "]") { j++; break; } // the end of the subset
      if (c === "%") { // a PEReference as a DeclSep ([28a], [69])
        const pe = nameAt(src, j + 1); // its name
        if (!pe || src[j + 1 + pe.length] !== ";") throw new XmlFormatError("bad-internal-subset", j); // not "%" Name ";"
        hasPeRef = true; // declarations may come from where this tool never reads
        j += pe.length + 2; // past it
        continue; // next item
      } // PEReference
      if (src.startsWith("<!--", j)) { j = scanComment(src, j, "unterminated-doctype", i); continue; } // a comment, same rule as in content
      if (src.startsWith("<?", j)) { // a processing instruction
        const close = src.indexOf("?>", j + 2); // its end
        if (close === -1) throw new XmlFormatError("unterminated-doctype", i); // never closed
        const target = nameAt(src, j + 2); // its target
        if (!target || target.toLowerCase() === "xml") throw new XmlFormatError("bad-pi", j + 2); // a Name, not the reserved "xml"
        const after = j + 2 + target.length; // just after the target
        if (after !== close && !isS(src[after])) throw new XmlFormatError("bad-pi", after); // S or "?>" must follow
        j = close + 2; // past it
        continue; // next item
      } // PI
      const kw = MARKUP_DECLS.find((d) => src.startsWith(d, j) && isS(src[j + d.length])); // a markup declaration keyword followed by S
      if (!kw) throw new XmlFormatError("bad-internal-subset", j); // anything else is not allowed here
      if (kw === "<!ENTITY") { // an entity declaration: its grammar is checked, because the reference checker relies on it
        const ent = scanEntityDecl(src, j, i); // its end and, for a general entity, its name
        if (ent.general && !declared.has(ent.general)) declared.set(ent.general, ent.kind); // declared, never expanded; the first declaration binds (4.2)
        j = ent.end; // past it
        continue; // next item
      } // entity
      let m = j + kw.length; // after the keyword
      for (;;) { // to the declaration's ">", over its quoted literals
        if (m >= n) throw new XmlFormatError("unterminated-doctype", i); // never closed
        const d = src[m]; // this character
        if (d === '"' || d === "'") { const close = src.indexOf(d, m + 1); if (close === -1) throw new XmlFormatError("unterminated-doctype", i); m = close + 1; continue; } // a literal may hold ">"
        if (d === ">") { m++; break; } // the end of the declaration
        if (d === "%") throw new XmlFormatError("bad-internal-subset", m); // WFC PEs in Internal Subset: no parameter-entity reference inside a declaration here
        m++; // any other character (the declaration's own grammar is not checked)
      } // declaration body
      j = m; // past the declaration
    } // items
    while (isS(src[j])) j++; // S?
  } // internal subset
  if (j >= n) throw new XmlFormatError("unterminated-doctype", i); // the input ends before ">"
  if (src[j] !== ">") throw new XmlFormatError("bad-doctype", j); // only ">" may close it
  return { end: j + 1, hasExternal, hasPeRef, declared }; // the extent and the facts
} // scanDoctype

/**
 * Read the document into a tree, or throw XmlFormatError at the first failure.
 * @param src the normalised text (no BOM, LF line breaks, every character legal)
 * @param notes the observation set to add to
 * @returns the parsed document
 */
function parse(src: string, notes: Set<XmlFormatNote>): ParsedDocument {
  const n = src.length; // the end
  const stats: XmlFormatStats = { elements: 0, attributes: 0, comments: 0, commentsDropped: 0, cdataSections: 0, processingInstructions: 0, maxDepth: 0, mixedContentElements: 0, preserveElements: 0, insignificantWhitespaceNodes: 0 }; // counters
  const top: TopNode[] = []; // the top level, white space left out
  const stack: ElementNode[] = []; // open elements, innermost last
  const ents: EntityContext = { enforce: true, declared: new Map() }; // no DTD yet: only the five predefined entities
  let rootSeen = false; // a root element has started
  let doctypeSeen = false; // a DOCTYPE has been read
  let standaloneYes = false; // standalone="yes" in the declaration: the WFC Entity Declared applies whatever the DOCTYPE says
  let i = 0; // the read position

  // ---- The XML declaration: only at offset 0 (2.8; "<?xml" elsewhere is a reserved PI target, 2.6). ----
  if (src.startsWith("<?xml") && (src.length === 5 || isS(src[5]) || src[5] === "?")) { // "<?xml" then S or "?": a declaration, not "<?xml-stylesheet"
    const close = src.indexOf("?>", 5); // its end
    if (close === -1) throw new XmlFormatError("bad-xml-declaration", 0); // never closed
    const raw = src.slice(0, close + 2); // the whole declaration
    if (!XML_DECL.test(raw)) throw new XmlFormatError("bad-xml-declaration", 0); // not [23]
    top.push({ kind: "decl", raw }); // kept verbatim
    standaloneYes = /standalone[ \t\n]*=[ \t\n]*["']yes["']/.test(raw); // read once, for the DOCTYPE rule below
    i = close + 2; // past it
  } // declaration

  /** Push a node into the open element, or onto the top level. */
  const add = (node: ContentNode): void => {
    if (stack.length > 0) stack[stack.length - 1].children.push(node); // inside the innermost open element
    else top.push(node as TopNode); // at the top level (comments and PIs only reach here)
  }; // add

  while (i < n) { // the main loop: one construct per pass
    if (src[i] !== "<") { // ---- character data ----
      const next = src.indexOf("<", i); // the next markup
      const end = next === -1 ? n : next; // the run ends there
      if (stack.length === 0) { // outside every element: only white space may stand here
        for (let k = i; k < end; k++) if (!isS(src[k])) throw new XmlFormatError("text-outside-root", k); // the first non-white-space character
        i = end; // white space at the top level is markup (2.4) and is not kept
        continue; // next construct
      } // top level
      const raw = src.slice(i, end); // the characters as written
      const cdEnd = raw.indexOf("]]>"); // "]]>" is never character data (2.4, [14]); searched inside the run only
      if (cdEnd !== -1) throw new XmlFormatError("cdata-end-in-text", i + cdEnd); // refused where it starts
      const hasRef = checkReferences(src, i, end, ents, false); // every reference checked, none expanded
      add({ kind: "text", raw, ws: !hasRef && /^[ \t\n]+$/.test(raw) }); // white-space-only when it is S and holds no reference
      i = end; // past the run
      continue; // next construct
    } // character data

    if (src.startsWith("<!--", i)) { // ---- a comment (2.5) ----
      const after = scanComment(src, i, "unterminated-comment", i); // its end, its rule applied
      add({ kind: "comment", raw: src.slice(i, after) }); // kept verbatim
      stats.comments++; // counted
      i = after; // past it
      continue; // next construct
    } // comment

    if (src.startsWith("<![CDATA[", i)) { // ---- a CDATA section (2.7) ----
      if (stack.length === 0) throw new XmlFormatError("cdata-outside-root", i); // only where character data may occur
      const close = src.indexOf("]]>", i + 9); // its end: the first "]]>"
      if (close === -1) throw new XmlFormatError("unterminated-cdata", i); // never closed
      add({ kind: "cdata", raw: src.slice(i, close + 3) }); // kept verbatim
      stats.cdataSections++; // counted
      i = close + 3; // past it
      continue; // next construct
    } // CDATA

    if (src.startsWith("<!DOCTYPE", i)) { // ---- the document type declaration (2.8) ----
      if (rootSeen || doctypeSeen || stack.length > 0) throw new XmlFormatError("misplaced-doctype", i); // once, before the root
      const dt = scanDoctype(src, i); // its extent and what it says about entities; nothing in it is expanded or fetched
      const j = dt.end; // just past its ">"
      for (const [en, kind] of dt.declared) ents.declared.set(en, kind); // general entities declared in the internal subset
      const hasExternal = dt.hasExternal; // an external subset exists (never read)
      const hasPeRef = dt.hasPeRef; // a parameter-entity reference in the internal subset (never expanded)
      top.push({ kind: "doctype", raw: src.slice(i, j) }); // kept verbatim, as text
      doctypeSeen = true; // only one allowed
      notes.add("doctype-kept"); // said in the result
      // WFC Entity Declared (4.1) applies with no DTD, with an internal subset only and no PE references, or with standalone="yes".
      ents.enforce = standaloneYes || (!hasExternal && !hasPeRef); // otherwise names may be declared where this tool never reads
      if (!ents.enforce) notes.add("entities-unchecked"); // said in the result
      i = j; // past the DOCTYPE
      continue; // next construct
    } // DOCTYPE

    if (src.startsWith("<?", i)) { // ---- a processing instruction (2.6) ----
      const close = src.indexOf("?>", i + 2); // its end
      if (close === -1) throw new XmlFormatError("unterminated-pi", i); // never closed
      const target = nameAt(src, i + 2); // the PITarget
      if (!target) throw new XmlFormatError("bad-pi", i + 2); // no name
      if (target.toLowerCase() === "xml") throw new XmlFormatError(i === 0 ? "bad-xml-declaration" : "misplaced-xml-declaration", i); // the reserved target: "<?XML" at the start, or a declaration out of place
      const after = i + 2 + target.length; // just after the target
      if (after !== close && !isS(src[after])) throw new XmlFormatError("bad-pi", after); // S or "?>" must follow the target
      add({ kind: "pi", raw: src.slice(i, close + 2) }); // kept verbatim
      stats.processingInstructions++; // counted
      i = close + 2; // past it
      continue; // next construct
    } // PI

    if (src.startsWith("</", i)) { // ---- an end tag (3.1, [42]) ----
      const name = nameAt(src, i + 2); // the element type
      if (!name) throw new XmlFormatError("bad-end-tag", i + 2); // no name
      let j = i + 2 + name.length; // after the name
      while (isS(src[j])) j++; // optional S
      if (j >= n) throw new XmlFormatError("unterminated-tag", i); // the input ends inside it
      if (src[j] !== ">") throw new XmlFormatError("bad-end-tag", j); // only ">" may follow
      const open = stack.pop(); // the element it closes
      if (!open) throw new XmlFormatError("unexpected-end-tag", i, { found: "</" + name + ">" }); // nothing open
      if (open.name !== name) throw new XmlFormatError("mismatched-end-tag", i, { found: "</" + name + ">", expected: "<" + open.name + ">" }); // WFC Element Type Match
      i = j + 1; // past ">"
      continue; // next construct
    } // end tag

    if (src.startsWith("<!", i)) throw new XmlFormatError("unknown-markup", i); // "<!" that is none of the three above

    // ---- a start tag or empty-element tag (3.1, [40], [44]) ----
    const name = nameAt(src, i + 1); // the element type
    if (!name) throw new XmlFormatError("bad-start-tag", i + 1); // "<" not followed by a name
    if (stack.length === 0 && rootSeen) throw new XmlFormatError("multiple-roots", i); // a second root
    const el: ElementNode = { kind: "element", name, attrs: [], empty: false, children: [], space: null, offset: i }; // the new element
    let j = i + 1 + name.length; // after the name
    let closedTag = false; // ">" or "/>" found
    while (j < n) { // attributes until ">" or "/>"
      const wsStart = j; // to tell whether S separated this attribute
      while (isS(src[j])) j++; // optional S
      if (src[j] === ">") { j++; closedTag = true; break; } // a start tag
      if (src[j] === "/" && src[j + 1] === ">") { j += 2; el.empty = true; closedTag = true; break; } // an empty-element tag
      if (j >= n) break; // the input ends inside the tag
      const an = nameAt(src, j); // an attribute name
      if (!an) throw new XmlFormatError("bad-start-tag", j); // a character that cannot start an attribute
      if (j === wsStart) throw new XmlFormatError("bad-attribute", j); // S is required before each attribute
      const nameOffset = j; // where the name is, for "duplicate-attribute"
      j += an.length; // past the name
      while (isS(src[j])) j++; // S? before "="
      if (src[j] !== "=") throw new XmlFormatError(j >= n ? "unterminated-tag" : "bad-attribute", j >= n ? i : j); // Eq is required
      j++; // past "="
      while (isS(src[j])) j++; // S? after "="
      const quote = src[j]; // the opening quote
      if (quote !== '"' && quote !== "'") throw new XmlFormatError(j >= n ? "unterminated-tag" : "bad-attribute", j >= n ? i : j); // values are quoted
      let k = j + 1; // the value's first character
      while (k < n && src[k] !== quote) { // to the closing quote
        if (src[k] === "<") throw new XmlFormatError("lt-in-attribute", k); // AttValue [10] excludes "<"
        k++; // next character
      } // value
      if (k >= n) throw new XmlFormatError("unterminated-tag", i); // the closing quote never comes
      checkReferences(src, j + 1, k, ents, true); // every reference checked, none expanded
      if (el.attrs.some((a) => a.name === an)) throw new XmlFormatError("duplicate-attribute", nameOffset, { name: an }); // WFC Unique Att Spec
      const raw = src.slice(j + 1, k); // the value as written
      el.attrs.push({ name: an, raw, quote }); // kept with its quote
      if (an === "xml:space") { // 2.10
        if (raw === "preserve" || raw === "default") el.space = raw; // a value the specification gives meaning to
        else notes.add("xml-space-invalid"); // any other value: reported and ignored (2.10 allows recovery by ignoring)
        if (raw === "preserve") stats.preserveElements++; // counted
      } // xml:space
      j = k + 1; // past the closing quote
    } // attributes
    if (!closedTag) throw new XmlFormatError("unterminated-tag", i); // the input ends inside the tag
    stats.elements++; // counted
    stats.attributes += el.attrs.length; // counted
    if (stack.length === 0) { rootSeen = true; top.push(el); } // the root element
    else stack[stack.length - 1].children.push(el); // a child of the innermost open element
    if (!el.empty) { // a start tag opens the element
      stack.push(el); // now innermost
      if (stack.length > MAX_DEPTH) throw new XmlFormatError("too-deep", i, { max: String(MAX_DEPTH) }); // the depth bound
      if (stack.length > stats.maxDepth) stats.maxDepth = stack.length; // deepest so far
    } else if (stack.length + 1 > stats.maxDepth) { // an empty element still counts one level
      stats.maxDepth = stack.length + 1; // deepest so far
    } // depth
    i = j; // past the tag
  } // main loop

  if (stack.length > 0) { // the input ended with elements open
    const innermost = stack[stack.length - 1]; // the one that would close first
    throw new XmlFormatError("unclosed-element", innermost.offset, { name: "<" + innermost.name + ">" }); // reported where it opened
  } // unclosed
  if (!rootSeen) throw new XmlFormatError("no-root", n); // no element at all
  return { top, notes, stats }; // the tree
} // parse

// ---------------------------------------------------------------------------
// The serializer
// ---------------------------------------------------------------------------

/**
 * Does this element have mixed content: text that is not white space, a reference, or a CDATA section?
 * @param el the element
 * @returns true when its content carries character data
 */
function isMixed(el: ElementNode): boolean {
  return el.children.some((c) => (c.kind === "text" && !c.ws) || c.kind === "cdata"); // character data of any kind
} // isMixed

/**
 * Does this element contain at least one child element?
 * @param el the element
 * @returns true when white space between its children can be "between elements"
 */
function hasChildElement(el: ElementNode): boolean {
  return el.children.some((c) => c.kind === "element"); // any child element
} // hasChildElement

/**
 * Write a start tag: the name, then each attribute as written, one space apart.
 * @param el the element
 * @returns "<name a="1" b='2'>" or "<name a="1"/>"
 */
function startTag(el: ElementNode): string {
  const attrs = el.attrs.map((a) => " " + a.name + "=" + a.quote + a.raw + a.quote).join(""); // values and quotes as written
  return "<" + el.name + attrs + (el.empty ? "/>" : ">"); // white space inside the tag is not character data, so it is normalised
} // startTag

/** What the serializer carries down the tree. */
interface WriteContext {
  opts: FormatOptions; // the user's choices
  unit: string; // one indentation level
  stats: XmlFormatStats; // counters to update
}

/**
 * Write one content node.
 * @param node the node
 * @param depth its depth (the root is 0)
 * @param preserve whether xml:space="preserve" is in force above it
 * @param verbatim whether an ancestor's mixed content forbids any change below
 * @param ctx the context
 * @returns the text for this node
 */
function writeNode(node: ContentNode, depth: number, preserve: boolean, verbatim: boolean, ctx: WriteContext): string {
  if (node.kind === "element") return writeElement(node, depth, preserve, verbatim, ctx); // recurse
  if (node.kind === "comment" && ctx.opts.comments === "drop") { ctx.stats.commentsDropped++; return ""; } // dropped on request
  return node.raw; // text, CDATA, comments and PIs exactly as written
} // writeNode

/**
 * Write one element and its content.
 * @param el the element
 * @param depth its depth (the root is 0)
 * @param preserveAbove whether xml:space="preserve" is in force from an ancestor
 * @param verbatim whether an ancestor's mixed content forbids any change below
 * @param ctx the context
 * @returns the element's text
 */
function writeElement(el: ElementNode, depth: number, preserveAbove: boolean, verbatim: boolean, ctx: WriteContext): string {
  const open = startTag(el); // the start tag
  if (el.empty) return open; // <a/>: nothing more
  const close = "</" + el.name + ">"; // the end tag
  const preserve = el.space === "preserve" ? true : el.space === "default" ? false : preserveAbove; // 2.10: own value, else inherited
  const mixed = isMixed(el); // text and elements together, or text alone
  if (mixed) ctx.stats.mixedContentElements++; // counted
  // Copied as written: under xml:space="preserve", inside or at mixed content, or with no child element at all.
  if (verbatim || preserve || mixed || !hasChildElement(el)) {
    const below = verbatim || mixed; // mixed content freezes the whole subtree; preserve alone can be overridden below
    return open + el.children.map((c) => writeNode(c, depth + 1, preserve, below, ctx)).join("") + close; // every child in place
  } // copied as written
  // Element content: every text child is white space between markup, the only text a formatter may replace or remove.
  const items: string[] = []; // the children that remain, written
  for (const c of el.children) { // in order
    if (c.kind === "text") { ctx.stats.insignificantWhitespaceNodes++; continue; } // replaced by the layout below (pretty) or removed (minify)
    const s = writeNode(c, depth + 1, preserve, false, ctx); // the child
    if (s !== "") items.push(s); // a dropped comment leaves nothing
  } // children
  if (ctx.opts.mode === "minify") return open + items.join("") + close; // no white space between children
  const pad = "\n" + ctx.unit.repeat(depth + 1); // a new line at the child depth
  return open + items.map((s) => pad + s).join("") + "\n" + ctx.unit.repeat(depth) + close; // one child per line, the end tag back at this depth
} // writeElement

/**
 * Write the whole document.
 * @param doc the parsed document
 * @param opts the user's choices
 * @returns the formatted text
 */
function serialize(doc: ParsedDocument, opts: FormatOptions): string {
  const ctx: WriteContext = { opts, unit: opts.indent === "tab" ? "\t" : " ".repeat(opts.indent), stats: doc.stats }; // the context
  const parts: string[] = []; // the top-level items, written
  for (const node of doc.top) { // declaration, DOCTYPE, comments, PIs and the root, in order
    if (node.kind === "element") parts.push(writeElement(node, 0, false, false, ctx)); // the root: no xml:space intention signalled above it (2.10)
    else if (node.kind === "comment" && opts.comments === "drop") ctx.stats.commentsDropped++; // dropped on request
    else parts.push(node.raw); // declaration, DOCTYPE, comment or PI, exactly as written
  } // top level
  return parts.join(opts.mode === "pretty" ? "\n" : ""); // white space at the top level is markup, never data (2.4)
} // serialize

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

/**
 * Turn an offset into a line, a column and an excerpt.
 * @param src the normalised text
 * @param offset 0-based UTF-16 offset
 * @returns line and column (1-based, columns in code points), the line cut to 120 characters around the column, and the column inside it
 */
function locate(src: string, offset: number): { line: number; column: number; excerpt: string; excerptColumn: number } {
  const at = Math.max(0, Math.min(offset, src.length)); // clamp
  let line = 1; // 1-based
  let lineStart = 0; // offset where the current line starts
  for (let k = 0; k < at; k++) if (src.charCodeAt(k) === 10) { line++; lineStart = k + 1; } // count line feeds before the offset
  const lineEndRaw = src.indexOf("\n", at); // where the line ends
  const lineText = src.slice(lineStart, lineEndRaw === -1 ? src.length : lineEndRaw); // the failing line
  const column = Array.from(src.slice(lineStart, at)).length + 1; // code points before the offset, plus one
  const cps = Array.from(lineText); // the line as code points
  const from = Math.max(0, Math.min(column - 1 - 60, cps.length - 120)); // a 120-character window around the column
  const excerpt = cps.slice(from, from + 120).join(""); // the window
  return { line, column, excerpt, excerptColumn: column - from }; // the position
} // locate

// ---------------------------------------------------------------------------
// The entry point
// ---------------------------------------------------------------------------

/**
 * Normalise options from any partial or loose input (the API passes defaults).
 * @param o the caller's options
 * @returns complete, valid options
 */
function resolveOptions(o?: Partial<FormatOptions>): FormatOptions {
  const mode = o?.mode === "minify" ? "minify" : "pretty"; // pretty unless minify is asked for
  const indent: IndentStyle = o?.indent === 4 ? 4 : o?.indent === "tab" ? "tab" : 2; // two spaces unless 4 or tab
  const comments = o?.comments === "drop" ? "drop" : "keep"; // kept unless drop is asked for
  return { mode, indent, comments }; // complete
} // resolveOptions

/**
 * formatXml: check one XML document and write it back pretty-printed or minified. Never throws.
 * @param input the document as pasted
 * @param options mode, indent and comments; missing values take DEFAULT_OPTIONS
 * @returns the result: the output and counts, or the failure with its position
 */
export function formatXml(input: string, options?: Partial<FormatOptions>): XmlFormatResult {
  const opts = resolveOptions(options); // complete options
  const notes = new Set<XmlFormatNote>(); // observations
  let src = typeof input === "string" ? input : ""; // tolerate a non-string from the API
  if (src.charCodeAt(0) === 0xfeff) { src = src.slice(1); notes.add("bom-removed"); } // a byte order mark is not part of the document's characters
  if (src.includes("\r")) { src = src.replace(/\r\n?/g, "\n"); notes.add("line-endings-normalised"); } // 2.11: CR LF and lone CR read as LF
  /** Build the failure result. */
  const fail = (e: XmlFormatError): XmlFormatResult => {
    const pos = locate(src, e.offset); // line, column and excerpt
    return { ok: false, error: { code: e.code, message: messageFor(e.code, e.params), line: pos.line, column: pos.column, offset: e.offset, excerpt: pos.excerpt, excerptColumn: pos.excerptColumn, params: e.params }, notes: orderNotes(notes), options: opts }; // the failure
  }; // fail
  try { // every failure below is an XmlFormatError
    if (src.length > MAX_INPUT_CHARS) throw new XmlFormatError("too-large", 0, { max: String(MAX_INPUT_CHARS) }); // the length bound
    if (/^[ \t\n]*$/.test(src)) throw new XmlFormatError("empty", 0); // nothing to read
    const bad = firstIllegalChar(src); // 2.2, checked before anything else
    if (bad) throw new XmlFormatError("illegal-character", bad.offset, { char: uPlus(bad.cp) }); // refused with its code point
    const doc = parse(src, notes); // the tree
    const output = serialize(doc, opts); // the formatted text
    return { ok: true, output, notes: orderNotes(notes), stats: doc.stats, options: opts }; // the success
  } catch (e) { // a failure
    if (e instanceof XmlFormatError) return fail(e); // reported with its position
    throw e; // anything else is a defect in this module, not the input
  } // try
} // formatXml

/** The fixed order notes are reported in. */
const NOTE_ORDER: readonly XmlFormatNote[] = ["bom-removed", "line-endings-normalised", "doctype-kept", "entities-unchecked", "xml-space-invalid"]; // stable

/**
 * Report notes in a fixed order, so results compare byte for byte.
 * @param notes the set gathered
 * @returns the notes, ordered
 */
function orderNotes(notes: Set<XmlFormatNote>): XmlFormatNote[] {
  return NOTE_ORDER.filter((x) => notes.has(x)); // the fixed order, present ones only
} // orderNotes

/**
 * run: the registry-facing entry point (the HTTP API). The body is the XML; the
 * result is pretty-printed with two spaces and comments kept. Never throws.
 * @param input the XML document
 * @returns the result
 */
export function run(input: string): XmlFormatResult {
  return formatXml(input, DEFAULT_OPTIONS); // the defaults
} // run
