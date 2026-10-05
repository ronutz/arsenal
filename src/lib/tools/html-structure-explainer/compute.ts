// ============================================================================
// src/lib/tools/html-structure-explainer/compute.ts
// ----------------------------------------------------------------------------
// THE HTML STRUCTURE & DOM EXPLAINER (engine). Paste HTML; out comes the tree
// the HTML parser builds from it (the DOM, as a document), every node with its
// line, the elements the parser created without a tag, the end tags it supplied,
// the formatting elements it split (the adoption agency algorithm), the content
// it moved out of a table (foster parenting), the parse errors by the standard's
// own codes with their positions, and a short list of structural and
// accessibility findings each tied to a sentence of the HTML Standard or of
// WCAG 2.2.
//
// The parser is parse5, the same spec-compliant HTML parser jsdom and Cheerio
// use, run with source locations and the parse-error callback on. Nothing is
// executed, fetched or rendered: scripts stay text, URLs stay strings, style is
// never applied. The engine runs identically in the browser and in the API.
//
// Sources (read 2026-10-05): HTML Living Standard, sections 13.1 (writing HTML
// documents: void elements, optional tags, the trailing solidus), 13.2.2 (parse
// errors and their codes), 13.2.6 (tree construction: implied end tags, the
// "initial" insertion mode and quirks mode), 4.1.1 (lang on html), 4.2.1/4.2.2
// (head content model, title), 4.2.5 (meta charset), 4.3.11 (headings and
// outlines), 4.8.4.4 (alternative text), 4.10.4 (label), 3.2.6 (id), 16.2
// (non-conforming features); WCAG 2.2 success criteria 1.1.1, 1.3.1, 2.4.2,
// 2.4.6, 3.1.1 and the removal of 4.1.1.
// ============================================================================

import { parse, type DefaultTreeAdapterTypes as T } from "parse5";
import { OBSOLETE_ELEMENTS, obsoleteAttribute } from "./obsolete";

/** The input. */
export interface HtmlInput {
  /** The HTML, a whole document or a fragment. */
  html: string;
}

/** The size ceiling (characters). */
export const HTML_MAX_CHARS = 200000;

/** How many nodes the result lists (the counts cover the whole tree). */
export const NODE_LIST_MAX = 2000;

/** The kinds of node the tree lists. */
export type NodeKind = "element" | "text" | "comment" | "doctype";

/** How an element ended. */
export type Closing =
  // Its end tag was in the source.
  | "end-tag"
  // A void element: no end tag exists for it.
  | "void"
  // A foreign (SVG or MathML) element written self-closing.
  | "self-closing"
  // The parser supplied the end: the end tag was omitted, or another tag or the end of the input closed it.
  | "omitted"
  // The element was created by the parser and never had a tag at all.
  | null;

/** One node of the tree, in pre-order. */
export interface TreeNode {
  /** Pre-order index. */
  id: number;
  /** Depth below the document (0 = a document child). */
  depth: number;
  /** Element, text, comment or doctype. */
  kind: NodeKind;
  /** The tag name (lower-case for HTML; as the parser adjusts it for foreign content), "#text", "#comment" or "DOCTYPE". */
  name: string;
  /** The namespace. */
  ns: "html" | "svg" | "mathml" | "other";
  /** The attributes, in source order, duplicates already dropped by the parser. */
  attrs: { name: string; value: string }[];
  /** A preview of the text or comment (whitespace collapsed, cut at 80 characters), the doctype's text, or null. */
  text: string | null;
  /** The line of the start tag or node in the source, 1-based, or null when the parser created the node. */
  line: number | null;
  /** The column, 1-based, or null. */
  col: number | null;
  /** True when the parser created the element without any tag in the source (html, head, body, tbody, ...). */
  implied: boolean;
  /** How the element ended (null for non-elements and for implied elements). */
  closing: Closing;
  /** When the parser split one source element into pieces (the adoption agency algorithm): this piece's index, else null. */
  piece: number | null;
  /** True when the node was moved before its table by foster parenting. */
  fostered: boolean;
  /** The number of children (elements, text, comments). */
  children: number;
  /** True when the element is one of the 29 obsolete elements. */
  obsolete: boolean;
  /** True when this node lives in a template's content fragment. */
  inTemplate: boolean;
}

/** One parse error, by the standard's code (or parse5's for tree construction). */
export interface ParseErrorRow {
  /** The code, e.g. "missing-doctype". */
  code: string;
  /** Where it was detected. */
  line: number;
  /** The column. */
  col: number;
  /** Who names the code: the standard's 13.2.2 table, or parse5 (the tree-construction errors the standard leaves unnamed). */
  named: "standard" | "parse5";
}

/** A structural or accessibility finding. */
export interface Finding {
  /** The rule id. */
  rule: string;
  /** How serious. */
  severity: "error" | "warning" | "info";
  /** The line, when it points at one place. */
  line: number | null;
  /** A short snippet or name. */
  snippet: string;
  /** Message parameters. */
  params?: Record<string, string | number>;
}

/** One heading of the outline. */
export interface HeadingRow {
  /** 1 to 6. */
  level: number;
  /** The text, collapsed. */
  text: string;
  /** The line. */
  line: number | null;
  /** True when the level is more than one above the previous heading's. */
  jump: boolean;
}

/** The result. */
export interface HtmlStructureResult {
  /** The document mode the parser chose. */
  mode: "no-quirks" | "limited-quirks" | "quirks";
  /** The DOCTYPE, when there is one. */
  doctype: { name: string; publicId: string; systemId: string } | null;
  /** The tree, pre-order, whitespace-only text left out (counted), cut at NODE_LIST_MAX. */
  nodes: TreeNode[];
  /** True when the tree was longer than NODE_LIST_MAX. */
  nodesTruncated: boolean;
  /** The parse errors in source order. */
  errors: ParseErrorRow[];
  /** The findings, in rule order then line order. */
  findings: Finding[];
  /** The heading outline. */
  headings: HeadingRow[];
  /** Counts over the whole tree. */
  counts: {
    elements: number;
    texts: number;
    whitespaceTexts: number;
    comments: number;
    attributes: number;
    maxDepth: number;
    implied: number;
    omitted: number;
    pieces: number;
    fostered: number;
    errors: number;
    lines: number;
    chars: number;
  };
  /** The most frequent element names. */
  topNames: { name: string; n: number }[];
  /** Duplicate ids: the id, how many, and the lines. */
  duplicateIds: { id: string; n: number; lines: number[] }[];
  /** What would have run, and did not. */
  inert: { scripts: number; externalScripts: number; inlineHandlers: number; javascriptUrls: number; styles: number; iframes: number };
  /** The document's title text, or null. */
  title: string | null;
  /** The root's lang, or null when absent (empty string when present but empty). */
  lang: string | null;
  /** The declared character encoding, or null. */
  charset: string | null;
}

/** The void elements of 13.1.2 ("Void elements: area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr"). */
export const VOID_ELEMENTS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/** The elements whose end tag the standard lets authors omit (13.1.2.4 Optional tags, the 19 end-tag rules). */
export const OPTIONAL_END_TAG = new Set(["html", "head", "body", "li", "dt", "dd", "p", "rt", "rp", "optgroup", "option", "colgroup", "caption", "thead", "tbody", "tfoot", "tr", "td", "th"]);

/** The 52 codes of the standard's 13.2.2 table (parse5 reports 48 of them; the four processing-instruction codes are newer than parse5 8.0.1). */
export const STANDARD_CODES = new Set([
  "abrupt-closing-of-empty-comment", "abrupt-doctype-public-identifier", "abrupt-doctype-system-identifier", "absence-of-digits-in-numeric-character-reference",
  "cdata-in-html-content", "character-reference-outside-unicode-range", "control-character-in-input-stream", "control-character-reference",
  "disallowed-processing-instruction-target", "duplicate-attribute", "end-tag-with-attributes", "end-tag-with-trailing-solidus", "eof-before-tag-name",
  "eof-in-cdata", "eof-in-comment", "eof-in-doctype", "eof-in-processing-instruction", "eof-in-script-html-comment-like-text", "eof-in-tag",
  "incorrectly-closed-comment", "incorrectly-opened-comment", "invalid-character-sequence-after-doctype-name", "invalid-first-character-of-processing-instruction-target",
  "invalid-first-character-of-tag-name", "invalid-processing-instruction-target", "missing-attribute-value", "missing-doctype-name", "missing-doctype-public-identifier",
  "missing-doctype-system-identifier", "missing-end-tag-name", "missing-quote-before-doctype-public-identifier", "missing-quote-before-doctype-system-identifier",
  "missing-semicolon-after-character-reference", "missing-whitespace-after-doctype-public-keyword", "missing-whitespace-after-doctype-system-keyword",
  "missing-whitespace-before-doctype-name", "missing-whitespace-between-attributes", "missing-whitespace-between-doctype-public-and-system-identifiers",
  "nested-comment", "noncharacter-character-reference", "noncharacter-in-input-stream", "non-void-html-element-start-tag-with-trailing-solidus",
  "null-character-reference", "surrogate-character-reference", "surrogate-in-input-stream", "unexpected-character-after-doctype-system-identifier",
  "unexpected-character-in-attribute-name", "unexpected-character-in-unquoted-attribute-value", "unexpected-equals-sign-before-attribute-name",
  "unexpected-null-character", "unexpected-solidus-in-tag", "unknown-named-character-reference",
]);

/** The codes parse5 names itself (tree-construction errors the standard describes in prose without a code, plus the earlier name for "<?"). */
export const PARSE5_CODES = new Set([
  "missing-doctype", "misplaced-doctype", "non-conforming-doctype", "end-tag-without-matching-open-element", "closing-of-element-with-open-child-elements",
  "disallowed-content-in-noscript-in-head", "open-elements-left-after-eof", "abandoned-head-element-child", "misplaced-start-tag-for-head-element",
  "nested-noscript-in-head", "eof-in-element-that-can-contain-only-text", "unexpected-question-mark-instead-of-tag-name",
]);

/** The labelable elements of 4.10.2 that a label can caption (input's hidden state excluded at the call site). */
const LABELABLE = new Set(["input", "select", "textarea", "meter", "output", "progress"]);

/** input types that need no visible label (they carry their own text or are not shown). */
const INPUT_SELF_LABELLED = new Set(["hidden", "submit", "button", "reset", "image"]);

/** The rules, in the order the findings are listed. */
export const RULES = [
  "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20",
] as const;

/** Collapse whitespace and cut. */
function preview(s: string, max = 80): string {
  // Collapse runs of whitespace to one space and trim.
  const t = s.replace(/\s+/g, " ").trim();
  // Cut with an ellipsis mark the page can show.
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** A node's namespace as a short label. */
function nsOf(el: T.Element): TreeNode["ns"] {
  // parse5 carries the namespace URI.
  const u = el.namespaceURI as string;
  // The three the parser knows.
  if (u === "http://www.w3.org/1999/xhtml") return "html";
  if (u === "http://www.w3.org/2000/svg") return "svg";
  if (u === "http://www.w3.org/1998/Math/MathML") return "mathml";
  // Anything else.
  return "other";
}

/** The text content of an element (descendant text nodes joined), for headings, titles, links and buttons. */
function textOf(el: T.ParentNode): string {
  // Accumulate.
  let out = "";
  // Walk.
  for (const c of el.childNodes) {
    // Text.
    if (c.nodeName === "#text") out += (c as T.TextNode).value;
    // Elements recurse (template content does not count as text).
    else if ("childNodes" in c) out += textOf(c as T.Element);
  }
  // Done.
  return out;
}

/** Whether an element has any image descendant whose alt carries text. */
function hasImageWithAlt(el: T.ParentNode): { images: number; withAlt: number } {
  // Counters.
  let images = 0;
  let withAlt = 0;
  // Walk.
  for (const c of el.childNodes) {
    // Not an element.
    if (!("tagName" in c)) continue;
    // An image.
    if (c.tagName === "img") {
      // Count.
      images++;
      // Its alt.
      const alt = c.attrs.find((a) => a.name === "alt");
      // Non-empty alt counts.
      if (alt && alt.value.trim() !== "") withAlt++;
    }
    // Recurse.
    const r = hasImageWithAlt(c);
    // Add.
    images += r.images;
    withAlt += r.withAlt;
  }
  // Done.
  return { images, withAlt };
}

/** Read an attribute, or null. */
function attr(el: T.Element, name: string): string | null {
  // Find.
  const a = el.attrs.find((x) => x.name === name);
  // Value or null.
  return a ? a.value : null;
}

/** run: the engine. */
export function run(input: HtmlInput): HtmlStructureResult {
  // The source.
  const src = input.html;
  // The ceiling.
  if (src.length > HTML_MAX_CHARS) throw new Error(`The HTML is ${src.length.toLocaleString("en")} characters; the ceiling is ${HTML_MAX_CHARS.toLocaleString("en")}.`);
  // The parse errors as they arrive.
  const errors: ParseErrorRow[] = [];
  // Parse as a document, with locations, collecting errors; the scripting flag off, as DOMParser parses, so noscript content is read as elements.
  const doc = parse(src, {
    sourceCodeLocationInfo: true,
    scriptingEnabled: false,
    onParseError: (e) => {
      // Record with the naming authority.
      errors.push({ code: e.code, line: e.startLine, col: e.startCol, named: STANDARD_CODES.has(e.code) ? "standard" : "parse5" });
    },
  });
  // Sort errors by position (parse5 reports them in order, but a tree error can trail).
  errors.sort((a, b) => a.line - b.line || a.col - b.col);

  // The nodes.
  const nodes: TreeNode[] = [];
  // The counts.
  const counts: HtmlStructureResult["counts"] = { elements: 0, texts: 0, whitespaceTexts: 0, comments: 0, attributes: 0, maxDepth: 0, implied: 0, omitted: 0, pieces: 0, fostered: 0, errors: errors.length, lines: src === "" ? 0 : src.split(/\r\n|\r|\n/).length, chars: src.length };
  // Element name frequencies.
  const freq = new Map<string, number>();
  // The ids seen, with their lines.
  const ids = new Map<string, number[]>();
  // The headings in tree order.
  const headings: HeadingRow[] = [];
  // The findings.
  const findings: Finding[] = [];
  // What would have run.
  const inert: HtmlStructureResult["inert"] = { scripts: 0, externalScripts: 0, inlineHandlers: 0, javascriptUrls: 0, styles: 0, iframes: 0 };
  // The document's title element(s).
  const titles: T.Element[] = [];
  // Facts set inside the walk (held in one object so the closure's assignments are visible to the checker afterwards):
  // the root's lang, the charset declaration and where its element ends, and the doctype.
  const seen: { lang: string | null; charset: string | null; charsetEnd: number | null; doctype: HtmlStructureResult["doctype"] } = { lang: null, charset: null, charsetEnd: null, doctype: null };
  // Formatting pieces: elements grouped by the start tag's offset, so a split shows as one group of several.
  const byStart = new Map<number, T.Element[]>();
  // Elements that are labelled by a label[for] (ids), and labels' descendants.
  const labelFor = new Set<string>();
  // Inputs to check for labels after the walk: [element, line, insideLabel].
  const labelables: { el: T.Element; line: number | null; inLabel: boolean }[] = [];
  // Elements whose end tag the parser supplied and the standard does not allow omitting, by name.
  const unclosed = new Map<string, { n: number; line: number | null }>();
  // Images without alt.
  const noAlt: number[] = [];
  // Images with empty alt.
  let emptyAlt = 0;
  // Void elements written with a trailing solidus.
  let voidSolidus = 0;
  // Fostered nodes.
  const fosteredLines: number[] = [];

  /** First pass over the element tree to group pieces by start offset. */
  const group = (n: T.ParentNode): void => {
    // Each child.
    for (const c of n.childNodes) {
      // Elements only.
      if ("tagName" in c) {
        // Its start tag.
        const st = c.sourceCodeLocation?.startTag;
        // Group by offset.
        if (st) {
          // The list for this offset.
          const list = byStart.get(st.startOffset) ?? [];
          // Add.
          list.push(c);
          // Store.
          byStart.set(st.startOffset, list);
        }
        // Recurse, template content included.
        group(c);
        // Template content.
        if ("content" in c) group((c as T.Template).content);
      }
    }
  };
  // Group.
  group(doc);

  /** The pre-order walk. */
  const walk = (parent: T.ParentNode, depth: number, inTemplate: boolean, inLabel: boolean): void => {
    // The children's source positions, to detect foster parenting: content written inside a table that is not table
    // content is inserted BEFORE the table, so it ends up as an earlier sibling of a table that starts earlier in the source.
    const positions = parent.childNodes.map((c) => c.sourceCodeLocation?.startOffset ?? null);
    // For each child, the smallest start offset among the table elements after it.
    const minAfter: (number | null)[] = new Array(parent.childNodes.length).fill(null);
    // Scan from the end.
    let running: number | null = null;
    for (let i = parent.childNodes.length - 1; i >= 0; i--) {
      // Store the minimum table offset after this one.
      minAfter[i] = running;
      // Fold this one in when it is a table with a position.
      const k = parent.childNodes[i];
      const p = positions[i];
      if ("tagName" in k && k.tagName === "table" && p !== null && (running === null || p < running)) running = p;
    }
    // Each child.
    parent.childNodes.forEach((c, index) => {
      // Depth bookkeeping.
      if (depth > counts.maxDepth) counts.maxDepth = depth;
      // Location.
      const loc = c.sourceCodeLocation ?? null;
      // Fostered: has a position, and a table that follows it among its siblings starts earlier in the source.
      const fostered = positions[index] !== null && minAfter[index] !== null && (minAfter[index] as number) < (positions[index] as number);
      // Count fostered.
      if (fostered) {
        counts.fostered++;
        if (loc) fosteredLines.push(loc.startLine);
      }
      // A text node.
      if (c.nodeName === "#text") {
        // Its text.
        const v = (c as T.TextNode).value;
        // Whitespace-only nodes are counted, not listed.
        if (v.trim() === "") {
          counts.whitespaceTexts++;
          return;
        }
        // Count.
        counts.texts++;
        // List.
        if (nodes.length < NODE_LIST_MAX) nodes.push({ id: nodes.length, depth, kind: "text", name: "#text", ns: "html", attrs: [], text: preview(v), line: loc?.startLine ?? null, col: loc?.startCol ?? null, implied: false, closing: null, piece: null, fostered, children: 0, obsolete: false, inTemplate });
        return;
      }
      // A comment.
      if (c.nodeName === "#comment") {
        // Count.
        counts.comments++;
        // List.
        if (nodes.length < NODE_LIST_MAX) nodes.push({ id: nodes.length, depth, kind: "comment", name: "#comment", ns: "html", attrs: [], text: preview((c as T.CommentNode).data), line: loc?.startLine ?? null, col: loc?.startCol ?? null, implied: false, closing: null, piece: null, fostered, children: 0, obsolete: false, inTemplate });
        return;
      }
      // The doctype.
      if (c.nodeName === "#documentType") {
        // Record.
        const d = c as T.DocumentType;
        seen.doctype = { name: d.name, publicId: d.publicId, systemId: d.systemId };
        // Its text.
        const text = `<!DOCTYPE ${d.name}${d.publicId ? ` PUBLIC "${d.publicId}"` : ""}${d.systemId ? ` "${d.systemId}"` : ""}>`;
        // List.
        if (nodes.length < NODE_LIST_MAX) nodes.push({ id: nodes.length, depth, kind: "doctype", name: "DOCTYPE", ns: "html", attrs: [], text, line: loc?.startLine ?? null, col: loc?.startCol ?? null, implied: false, closing: null, piece: null, fostered: false, children: 0, obsolete: false, inTemplate });
        return;
      }
      // An element.
      const el = c as T.Element;
      // Its namespace and name.
      const ns = nsOf(el);
      const name = el.tagName;
      // Count.
      counts.elements++;
      counts.attributes += el.attrs.length;
      freq.set(name, (freq.get(name) ?? 0) + 1);
      // Implied: created by the parser without a tag.
      const implied = loc === null;
      if (implied) counts.implied++;
      // The element's location carries the start tag (and the end tag when there was one).
      const eloc = el.sourceCodeLocation ?? null;
      // The start tag's text, to see a trailing solidus.
      const st = eloc ? (eloc.startTag ?? eloc) : null;
      const startText = st ? src.slice(st.startOffset, st.endOffset) : "";
      const selfClosed = /\/\s*>$/.test(startText);
      // A piece of a split formatting element (decided first: a piece's missing end tag is the adoption agency's doing, reported as a split, not as unclosed).
      let piece: number | null = null;
      if (st) {
        // The group at this offset.
        const list = byStart.get(st.startOffset);
        // More than one element from one start tag: pieces.
        if (list && list.length > 1) {
          piece = list.indexOf(el) + 1;
          // Count once per group, on the first piece.
          if (piece === 1) counts.pieces++;
        }
      }
      // How it ended.
      let closing: Closing = null;
      if (!implied) {
        // Void elements have no end tag.
        if (ns === "html" && VOID_ELEMENTS.has(name)) {
          closing = "void";
          // A trailing solidus on a void element: unnecessary, says the standard.
          if (selfClosed) voidSolidus++;
        } else if (eloc && eloc.endTag) closing = "end-tag";
        else if (ns !== "html" && selfClosed) closing = "self-closing";
        else {
          // The parser supplied the end.
          closing = "omitted";
          counts.omitted++;
          // Not sanctioned by the optional-tags rules, and not a split piece: an unclosed or misnested element.
          if (!(ns === "html" && OPTIONAL_END_TAG.has(name)) && piece === null) {
            // Record by name.
            const u = unclosed.get(name) ?? { n: 0, line: loc?.startLine ?? null };
            u.n++;
            unclosed.set(name, u);
          }
        }
      }
      // Obsolete element.
      const obsolete = ns === "html" && name in OBSOLETE_ELEMENTS;
      // List.
      if (nodes.length < NODE_LIST_MAX) nodes.push({ id: nodes.length, depth, kind: "element", name, ns, attrs: el.attrs.map((a) => ({ name: a.prefix ? `${a.prefix}:${a.name}` : a.name, value: a.value })), text: null, line: loc?.startLine ?? null, col: loc?.startCol ?? null, implied, closing, piece, fostered, children: el.childNodes.filter((k) => k.nodeName !== "#text" || (k as T.TextNode).value.trim() !== "").length, obsolete, inTemplate });
      // The line for findings.
      const line = loc?.startLine ?? null;
      // --- Per-element facts for the findings. ---
      // The root's lang.
      if (ns === "html" && name === "html" && depth === 0) seen.lang = attr(el, "lang");
      // Titles.
      if (ns === "html" && name === "title") titles.push(el);
      // Charset.
      if (ns === "html" && name === "meta" && seen.charset === null) {
        // <meta charset>.
        const cs = attr(el, "charset");
        // <meta http-equiv=content-type content="...; charset=...">.
        const he = attr(el, "http-equiv");
        const content = attr(el, "content");
        const m = he && he.toLowerCase() === "content-type" && content ? /charset\s*=\s*["']?([^"';\s]+)/i.exec(content) : null;
        // Record with where the element ends.
        if (cs !== null || m) {
          seen.charset = cs !== null ? cs : (m as RegExpExecArray)[1];
          seen.charsetEnd = st ? st.endOffset : null;
        }
      }
      // Ids.
      const id = attr(el, "id");
      if (id !== null && id !== "") {
        // Lines per id.
        const list = ids.get(id) ?? [];
        list.push(line ?? 0);
        ids.set(id, list);
      }
      // Headings.
      if (ns === "html" && /^h[1-6]$/.test(name)) {
        // The level.
        const level = Number(name[1]);
        // The previous heading.
        const prev = headings.length > 0 ? headings[headings.length - 1].level : null;
        // A jump: more than one level deeper than the previous heading (4.3.11: "less than, equal to, or 1 greater").
        const jump = prev !== null && level > prev + 1;
        // Record.
        headings.push({ level, text: preview(textOf(el), 120), line, jump });
      }
      // Images.
      if (ns === "html" && name === "img") {
        // The alt.
        const alt = attr(el, "alt");
        // Missing.
        if (alt === null) noAlt.push(line ?? 0);
        // Empty: decorative.
        else if (alt.trim() === "") emptyAlt++;
      }
      // Links and buttons made only of images.
      if (ns === "html" && (name === "a" || name === "button")) {
        // Text inside.
        const text = textOf(el).trim();
        // Images inside.
        const imgs = hasImageWithAlt(el);
        // No text, images present, none with alt text, and no aria-label: nothing names the control.
        if (text === "" && imgs.images > 0 && imgs.withAlt === 0 && !attr(el, "aria-label") && !attr(el, "aria-labelledby") && !attr(el, "title")) {
          findings.push({ rule: "D8", severity: "error", line, snippet: `<${name}>`, params: { element: name, images: imgs.images } });
        }
      }
      // Labels: remember the ids they point at.
      if (ns === "html" && name === "label") {
        // The for attribute.
        const f = attr(el, "for");
        if (f) labelFor.add(f);
      }
      // Labelable controls, checked after the walk (a label[for] can come later in the source).
      if (ns === "html" && LABELABLE.has(name)) {
        // input types that label themselves.
        const type = (attr(el, "type") ?? "text").toLowerCase();
        // Skip those.
        if (!(name === "input" && INPUT_SELF_LABELLED.has(type))) labelables.push({ el, line, inLabel });
      }
      // Inert content.
      if (ns === "html" && name === "script") {
        inert.scripts++;
        if (attr(el, "src") !== null) inert.externalScripts++;
      }
      if (ns === "html" && name === "style") inert.styles++;
      if (ns === "html" && name === "iframe") inert.iframes++;
      // Event handler attributes and javascript: URLs.
      for (const a of el.attrs) {
        // on* handlers.
        if (/^on[a-z]+$/i.test(a.name)) inert.inlineHandlers++;
        // javascript: URLs in URL-bearing attributes.
        if (/^(href|src|action|formaction|data|xlink:href)$/i.test(a.prefix ? `${a.prefix}:${a.name}` : a.name) && /^\s*javascript:/i.test(a.value)) inert.javascriptUrls++;
      }
      // Obsolete element finding (one per occurrence).
      if (obsolete) findings.push({ rule: "D11", severity: "warning", line, snippet: `<${name}>`, params: { element: name, advice: OBSOLETE_ELEMENTS[name] } });
      // Obsolete attributes (one per occurrence).
      if (ns === "html") {
        for (const a of el.attrs) {
          // Look up.
          const o = obsoleteAttribute(name, a.name);
          // Report.
          if (o) findings.push({ rule: "D12", severity: "warning", line, snippet: `<${name} ${a.name}>`, params: { element: name, attr: a.name, group: o.group } });
        }
      }
      // Recurse: children, then template content.
      walk(el, depth + 1, inTemplate, inLabel || (ns === "html" && name === "label"));
      // Template content.
      if ("content" in el) walk((el as T.Template).content, depth + 1, true, inLabel);
    });
  };
  // Walk.
  walk(doc, 0, false, false);

  // --- Document-level findings. ---
  // The facts the walk collected.
  const { lang, charset, charsetEnd, doctype } = seen;
  // D1: no DOCTYPE → quirks mode ("A DOCTYPE is a required preamble").
  if (doctype === null) findings.push({ rule: "D1", severity: "error", line: 1, snippet: "<!DOCTYPE html>", params: { mode: doc.mode } });
  // D2: a DOCTYPE that still leaves the document in a quirks mode (a legacy public identifier).
  else if (doc.mode !== "no-quirks") findings.push({ rule: "D2", severity: "warning", line: nodes.find((n) => n.kind === "doctype")?.line ?? 1, snippet: doctype.publicId || doctype.name, params: { mode: doc.mode } });
  // D3: no lang on the root (WCAG 3.1.1; HTML: authors are encouraged to specify it).
  if (lang === null || lang.trim() === "") findings.push({ rule: "D3", severity: "warning", line: nodes.find((n) => n.kind === "element" && n.name === "html")?.line ?? null, snippet: "<html lang>", params: { what: lang === null ? "missing" : "empty" } });
  // D4: the title: none, several, or empty (head content model; WCAG 2.4.2).
  if (titles.length === 0) findings.push({ rule: "D4", severity: "warning", line: null, snippet: "<title>", params: { what: "missing", n: 0 } });
  else if (titles.length > 1) findings.push({ rule: "D4", severity: "error", line: titles[1].sourceCodeLocation?.startLine ?? null, snippet: "<title>", params: { what: "several", n: titles.length } });
  else if (textOf(titles[0]).trim() === "") findings.push({ rule: "D4", severity: "warning", line: titles[0].sourceCodeLocation?.startLine ?? null, snippet: "<title></title>", params: { what: "empty", n: 1 } });
  // D5: the character encoding declaration: absent, or beyond the first 1024 bytes.
  if (charset === null) findings.push({ rule: "D5", severity: "info", line: null, snippet: '<meta charset="utf-8">', params: { what: "missing", bytes: 0 } });
  else if (charsetEnd !== null) {
    // Bytes to the end of the element, in UTF-8.
    const bytes = new TextEncoder().encode(src.slice(0, charsetEnd)).length;
    // Over the limit.
    if (bytes > 1024) findings.push({ rule: "D5", severity: "error", line: null, snippet: `<meta charset="${charset}">`, params: { what: "late", bytes } });
    // Not UTF-8.
    else if (charset.toLowerCase() !== "utf-8") findings.push({ rule: "D5", severity: "warning", line: null, snippet: `<meta charset="${charset}">`, params: { what: "not-utf8", bytes } });
  }
  // D6: images without alt (WCAG 1.1.1; HTML: "the alt attribute must be specified").
  if (noAlt.length > 0) findings.push({ rule: "D6", severity: "error", line: noAlt[0] || null, snippet: "<img>", params: { n: noAlt.length, lines: [...new Set(noAlt.filter((l) => l > 0))].slice(0, 8).join(", ") } });
  // D7: images with an empty alt (decorative, by the standard's rules).
  if (emptyAlt > 0) findings.push({ rule: "D7", severity: "info", line: null, snippet: '<img alt="">', params: { n: emptyAlt } });
  // D9: the outline: a jump, or no level-1 heading.
  const jumps = headings.filter((h) => h.jump);
  if (jumps.length > 0) findings.push({ rule: "D9", severity: "error", line: jumps[0].line, snippet: `h${jumps[0].level}`, params: { what: "jump", n: jumps.length, level: jumps[0].level, prev: headings[headings.indexOf(jumps[0]) - 1].level } });
  if (headings.length > 0 && !headings.some((h) => h.level === 1)) findings.push({ rule: "D9", severity: "warning", line: headings[0].line, snippet: `h${headings[0].level}`, params: { what: "no-h1", n: headings.length, level: headings[0].level, prev: 0 } });
  // D19: an empty heading (WCAG 2.4.6: headings describe topic or purpose).
  const empty = headings.filter((h) => h.text === "");
  if (empty.length > 0) findings.push({ rule: "D19", severity: "warning", line: empty[0].line, snippet: `<h${empty[0].level}></h${empty[0].level}>`, params: { n: empty.length } });
  // D10: duplicate ids.
  const duplicateIds = [...ids.entries()].filter(([, lines]) => lines.length > 1).map(([id, lines]) => ({ id, n: lines.length, lines })).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
  for (const d of duplicateIds) findings.push({ rule: "D10", severity: "error", line: d.lines[0] || null, snippet: `id="${d.id}"`, params: { id: d.id, n: d.n, lines: [...new Set(d.lines.filter((l) => l > 0))].join(", ") } });
  // D13: end tags the parser supplied where the standard does not allow omission (unclosed or misnested elements), by name.
  for (const [name, u] of [...unclosed.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0]))) findings.push({ rule: "D13", severity: "warning", line: u.line, snippet: `<${name}>`, params: { element: name, n: u.n } });
  // D14: split formatting elements (the adoption agency algorithm).
  for (const [offset, list] of [...byStart.entries()].filter(([, l]) => l.length > 1).sort((a, b) => a[0] - b[0])) {
    // The source position.
    const st = list[0].sourceCodeLocation?.startTag;
    // Report.
    findings.push({ rule: "D14", severity: "warning", line: st?.startLine ?? null, snippet: `<${list[0].tagName}>`, params: { element: list[0].tagName, n: list.length, offset } });
  }
  // D15: foster-parented content.
  if (counts.fostered > 0) findings.push({ rule: "D15", severity: "warning", line: fosteredLines[0] ?? null, snippet: "<table>", params: { n: counts.fostered } });
  // D16: void elements written with a trailing solidus.
  if (voidSolidus > 0) findings.push({ rule: "D16", severity: "info", line: null, snippet: "<br />", params: { n: voidSolidus } });
  // D17: labelable controls without a label.
  for (const l of labelables) {
    // Named some other way.
    const id = attr(l.el, "id");
    const named = l.inLabel || (id !== null && labelFor.has(id)) || attr(l.el, "aria-label") !== null || attr(l.el, "aria-labelledby") !== null || attr(l.el, "title") !== null;
    // Report.
    if (!named) findings.push({ rule: "D17", severity: "warning", line: l.line, snippet: `<${l.el.tagName}${id ? ` id="${id}"` : ""}>`, params: { element: l.el.tagName, type: attr(l.el, "type") ?? "" } });
  }
  // D18: script that would have run, and did not.
  if (inert.scripts > 0 || inert.inlineHandlers > 0 || inert.javascriptUrls > 0) findings.push({ rule: "D18", severity: "info", line: null, snippet: "<script>", params: { scripts: inert.scripts, handlers: inert.inlineHandlers, urls: inert.javascriptUrls } });
  // Implied structure as information: html, head and body created by the parser.
  const impliedNames = nodes.filter((n) => n.kind === "element" && n.implied).map((n) => n.name);
  if (impliedNames.length > 0) findings.push({ rule: "D20", severity: "info", line: null, snippet: impliedNames.slice(0, 6).map((n) => `<${n}>`).join(" "), params: { n: impliedNames.length, names: [...new Set(impliedNames)].join(", ") } });

  // Order the findings: rule number, then line.
  const order = (r: string) => Number(r.slice(1));
  findings.sort((a, b) => order(a.rule) - order(b.rule) || (a.line ?? 0) - (b.line ?? 0));

  // The top names.
  const topNames = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12).map(([name, n]) => ({ name, n }));

  // Done.
  return {
    mode: doc.mode,
    doctype,
    nodes,
    nodesTruncated: counts.elements + counts.texts + counts.comments + (doctype ? 1 : 0) > nodes.length,
    errors,
    findings,
    headings,
    counts,
    topNames,
    duplicateIds,
    inert,
    title: titles.length > 0 ? preview(textOf(titles[0]), 200) : null,
    lang,
    charset,
  };
}
