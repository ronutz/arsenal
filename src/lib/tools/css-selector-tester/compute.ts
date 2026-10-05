// ============================================================================
// src/lib/tools/css-selector-tester/compute.ts
// ----------------------------------------------------------------------------
// THE CSS SELECTOR TESTER (engine). Paste HTML and one or more selectors; the
// HTML is parsed inertly with parse5 (the same tree the HTML structure explainer
// shows), each selector is parsed against Selectors Level 4 and matched
// against every element of the tree the way 17.3 says (compound by compound,
// right to left), and out come the matched elements (with their path and
// line), the specificity of each selector (from the specificity calculator's
// engine), and notes on what a static document cannot answer (:hover and the
// other user-action pseudo-classes "never match any element" in a
// non-interactive user agent; :visited never matches; a pseudo-element names a
// box, not an element).
//
// Nothing is executed, fetched or rendered. The matcher's answers are checked
// against Chromium's querySelectorAll in the page's own verification.
//
// Sources (read 2026-10-05): Selectors Level 4, W3C Working Draft 22 January
// 2026 (3.7, 3.9, 4, 5, 6, 7.2, 8, 9, 12, 13, 14, 17.3, 17.5); the HTML Living
// Standard's "Case-sensitivity of selectors" (type and attribute names lower-
// cased for HTML elements; the 46 attribute names whose values match ASCII
// case-insensitively); the Quirks Mode Standard (no class/id case quirk any
// more); parse5 8.0.1.
// ============================================================================

import { parse, type DefaultTreeAdapterTypes as T } from "parse5";
import { parseSelectorList, SelectorError, NEVER_MATCH_PSEUDOS, NOT_EVALUATED_PSEUDOS, type Complex, type Compound, type Simple, type SelectorList, type Relative, type Combinator, type Nth } from "./selector";

/** The input. */
export interface SelectorTestInput {
  /** The HTML document or fragment. */
  html: string;
  /** The selectors, one per line (each line may be a selector list). */
  selectors: string;
}

/** Ceilings. */
export const HTML_MAX_CHARS = 200000;
export const SELECTORS_MAX_CHARS = 10000;
export const SELECTORS_MAX_LINES = 50;
export const MATCHES_MAX_LISTED = 500;

/** One element of the tree, as listed. */
export interface ElementRow {
  /** Pre-order index among elements. */
  id: number;
  /** Depth below the document. */
  depth: number;
  /** The tag name. */
  name: string;
  /** Attributes. */
  attrs: { name: string; value: string }[];
  /** A preview of the element's own direct text (collapsed, cut), or null. */
  text: string | null;
  /** The source line of the start tag, or null when the parser created the element. */
  line: number | null;
  /** The CSS path from the root: tag names with :nth-child() where siblings share the name. */
  path: string;
  /** The indices (into the selectors list) of the selectors that match this element. */
  matchedBy: number[];
}

/** One selector's reading. */
export interface SelectorReport {
  /** The index. */
  index: number;
  /** As written. */
  selector: string;
  /** Whether it parsed. */
  valid: boolean;
  /** The parse error, when invalid. */
  error: { code: string; at: number; message: string } | null;
  /** The ids of matched elements (tree order), cut at MATCHES_MAX_LISTED. */
  matches: number[];
  /** The number of matches. */
  count: number;
  /** The specificity (A, B, C) of the most specific complex selector in the list, computed from the parsed selector per section 15 (members a forgiving :is() dropped count zero); null when invalid. */
  specificity: [number, number, number] | null;
  /** The pseudo-element the selector names, when it ends in one (then the matches are its originating elements). */
  pseudoElement: string | null;
  /** Notes: pseudo-classes that never match in a static document, approximations. */
  notes: { code: string; what: string }[];
}

/** The result. */
export interface SelectorTestResult {
  /** The document mode. */
  mode: "no-quirks" | "limited-quirks" | "quirks";
  /** The element rows. */
  elements: ElementRow[];
  /** True when the element list was cut. */
  elementsTruncated: boolean;
  /** The selectors. */
  selectors: SelectorReport[];
  /** Counts. */
  counts: { elements: number; selectors: number; valid: number; matchedElements: number };
}

/** The 46 attribute names whose values match ASCII case-insensitively on HTML elements (HTML Standard, Case-sensitivity of selectors). */
export const CASE_INSENSITIVE_ATTRS = new Set(["accept", "accept-charset", "align", "alink", "axis", "bgcolor", "charset", "checked", "clear", "codetype", "color", "compact", "declare", "defer", "dir", "direction", "disabled", "enctype", "face", "frame", "hreflang", "http-equiv", "lang", "language", "link", "media", "method", "multiple", "nohref", "noresize", "noshade", "nowrap", "readonly", "rel", "rev", "rules", "scope", "scrolling", "selected", "shape", "target", "text", "type", "valign", "valuetype", "vlink"]);

/** Pseudo-classes that are valid but never match here: the user-action ones ("In non-interactive user agents, these pseudo-classes are valid, but never match any element", section 9), :visited (never, by privacy), the resource, display and shadow-tree states a static tree has no notion of. */
const NEVER_MATCH = NEVER_MATCH_PSEUDOS;

/** Pseudo-classes a browser evaluates from form state that this tester does not evaluate (constraint validation, placeholder display, defaults): reported as not evaluated, matching nothing. */
const NOT_EVALUATED = NOT_EVALUATED_PSEUDOS;

/** Pseudo-classes read from attributes, with the approximation stated. */
const ATTRIBUTE_APPROXIMATED = new Set(["checked", "disabled", "enabled", "required", "optional", "read-only", "read-write", "defined", "link", "any-link", "lang", "dir"]);

/** HTML form controls that can be disabled (HTML: button, input, select, textarea, optgroup, option, fieldset, form-associated custom elements). */
const DISABLEABLE = new Set(["button", "input", "select", "textarea", "optgroup", "option", "fieldset"]);

/** The node type guards. */
const isElement = (n: T.Node): n is T.Element => "tagName" in n;
const isText = (n: T.Node): n is T.TextNode => n.nodeName === "#text";

/** The matcher's view of an element: parent and sibling helpers over parse5's tree. */
interface Ctx {
  /** The document root element (html). */
  root: T.Element | null;
  /** The scoping root for :scope (the document root here). */
  scope: T.Element | null;
  /** Notes collected while matching. */
  notes: Map<string, string>;
}

/** Element children of a parent. */
function elementChildren(p: T.ParentNode): T.Element[] {
  // Filter.
  return p.childNodes.filter(isElement);
}

/** The parent element, or null at the root. */
function parentElement(el: T.Element): T.Element | null {
  // parse5 keeps parentNode.
  const p = el.parentNode;
  return p && isElement(p) ? p : null;
}

/** Previous element sibling. */
function prevElement(el: T.Element): T.Element | null {
  const p = el.parentNode;
  if (!p) return null;
  const sibs = elementChildren(p);
  const i = sibs.indexOf(el);
  return i > 0 ? sibs[i - 1] : null;
}

/** Read an attribute (names are lower-case on HTML elements already). */
function attr(el: T.Element, name: string): string | null {
  const a = el.attrs.find((x) => (x.prefix ? `${x.prefix}:${x.name}` : x.name) === name);
  return a ? a.value : null;
}

/** Whether the element is in the HTML namespace. */
const isHtml = (el: T.Element) => (el.namespaceURI as string) === "http://www.w3.org/1999/xhtml";

/** The element's language from the nearest lang attribute (or xml:lang), or null. */
function langOf(el: T.Element): string | null {
  // Walk up.
  let cur: T.Element | null = el;
  while (cur) {
    const l = attr(cur, "lang") ?? attr(cur, "xml:lang");
    if (l !== null) return l;
    cur = parentElement(cur);
  }
  return null;
}

/** Extended language-range filtering, simplified: the range matches the tag when every range subtag equals the corresponding tag subtag, "*" matching any; a range is also matched when the tag starts with range + "-". Case-insensitive (7.2). */
function langMatches(tag: string, range: string): boolean {
  const t = tag.toLowerCase().split("-");
  const r = range.toLowerCase().split("-");
  if (r[0] !== "*" && r[0] !== t[0]) return false;
  let ti = 1;
  for (let ri = 1; ri < r.length; ri++) {
    if (r[ri] === "*") continue;
    // Find the subtag in the tag at or after ti.
    let found = false;
    while (ti < t.length) {
      if (t[ti] === r[ri]) { found = true; ti++; break; }
      if (t[ti].length === 1) return false;
      ti++;
    }
    if (!found) return false;
  }
  return true;
}

/** Whether an element is disabled per HTML: its own disabled attribute (for disableable controls), or inside a disabled fieldset other than that fieldset's first legend. */
function isDisabled(el: T.Element): boolean {
  if (!isHtml(el) || !DISABLEABLE.has(el.tagName)) return false;
  if (attr(el, "disabled") !== null) return true;
  // option inside a disabled optgroup.
  if (el.tagName === "option") { const p = parentElement(el); if (p && p.tagName === "optgroup" && attr(p, "disabled") !== null) return true; }
  // Inside a disabled fieldset, unless inside its first legend.
  let cur = parentElement(el);
  let child: T.Element = el;
  while (cur) {
    if (cur.tagName === "fieldset" && attr(cur, "disabled") !== null) {
      const firstLegend = elementChildren(cur).find((c) => c.tagName === "legend");
      if (!(firstLegend && (firstLegend === child || isAncestor(firstLegend, el)))) return true;
    }
    child = cur;
    cur = parentElement(cur);
  }
  return false;
}

/** Whether a is an ancestor of b. */
function isAncestor(a: T.Element, b: T.Element): boolean {
  let cur = parentElement(b);
  while (cur) { if (cur === a) return true; cur = parentElement(cur); }
  return false;
}

/** The An+B test: is index (1-based) of the form An+B for some n >= 0? */
function nthMatches(nth: Nth, index: number): boolean {
  // a = 0: exact.
  if (nth.a === 0) return index === nth.b;
  // (index - b) / a must be a non-negative integer.
  const d = index - nth.b;
  return d % nth.a === 0 && d / nth.a >= 0;
}

/** Match a compound against an element. */
function matchCompound(c: Compound, el: T.Element, ctx: Ctx): boolean {
  // Every simple selector must match.
  for (const s of c.simples) if (!matchSimple(s, el, ctx)) return false;
  return true;
}

/** Match one simple selector. */
function matchSimple(s: Simple, el: T.Element, ctx: Ctx): boolean {
  switch (s.kind) {
    case "universal":
      return true;
    case "type":
      // HTML elements: compare lower-cased (HTML Standard); others: as written.
      return isHtml(el) ? el.tagName === s.name.toLowerCase() : el.tagName === s.name;
    case "id":
      // ID is the id attribute; case-sensitive.
      return attr(el, "id") === s.value;
    case "class": {
      // class is whitespace-separated tokens, equivalent to [class~=value] (6.6).
      const cls = attr(el, "class");
      return cls !== null && cls.split(/[ \t\n\r\f]+/).includes(s.value);
    }
    case "attr": {
      // Names lower-cased for HTML elements; the namespace prefix is read, not resolved (we strip it).
      const name = (s.name.includes("|") ? s.name.slice(s.name.lastIndexOf("|") + 1) : s.name);
      const want = isHtml(el) ? name.toLowerCase() : name;
      if (want === "*") return el.attrs.length > 0;
      const got = attr(el, want);
      if (got === null) return false;
      if (s.op === "" || s.value === null) return true;
      // Case: the flag wins; else HTML's 46 names are ASCII case-insensitive; else case-sensitive.
      const ci = s.flag === "i" ? true : s.flag === "s" ? false : isHtml(el) && CASE_INSENSITIVE_ATTRS.has(want);
      const a = ci ? got.toLowerCase() : got;
      const v = ci ? s.value.toLowerCase() : s.value;
      switch (s.op) {
        case "=": return a === v;
        case "~=": return v !== "" && !/[ \t\n\r\f]/.test(v) && a.split(/[ \t\n\r\f]+/).includes(v);
        case "|=": return a === v || a.startsWith(v + "-");
        case "^=": return v !== "" && a.startsWith(v);
        case "$=": return v !== "" && a.endsWith(v);
        case "*=": return v !== "" && a.includes(v);
      }
      return false;
    }
    case "pseudo":
      return matchPseudo(s, el, ctx);
  }
}

/** Match a pseudo-class. */
function matchPseudo(s: Extract<Simple, { kind: "pseudo" }>, el: T.Element, ctx: Ctx): boolean {
  const name = s.name;
  // Never in a static document.
  if (NEVER_MATCH.has(name)) { ctx.notes.set(`never:${name}`, name); return false; }
  // Not evaluated here.
  if (NOT_EVALUATED.has(name)) { ctx.notes.set(`static:${name}`, name); return false; }
  switch (name) {
    case "is": case "matches": case "-webkit-any":
      return (s.list ?? []).some((cx) => matchComplex(cx, el, ctx));
    case "where":
      return (s.list ?? []).some((cx) => matchComplex(cx, el, ctx));
    case "not":
      return !(s.list ?? []).some((cx) => matchComplex(cx, el, ctx));
    case "has":
      return (s.relative ?? []).some((r) => matchRelative(r, el, ctx));
    case "root":
      return el === ctx.root;
    case "scope":
      return el === (ctx.scope ?? ctx.root);
    case "empty":
      // Selectors 4 (13.2) lets whitespace-only text count as empty, but browsers still apply the Level 3 rule, where any
      // text of non-zero length makes the element non-empty; the tester follows the browsers and says so in a note.
      ctx.notes.set("level3:empty", "empty");
      return el.childNodes.every((n) => !isElement(n) && !(isText(n) && n.value.length > 0));
    case "first-child": return prevElement(el) === null;
    case "last-child": { const p = el.parentNode; if (!p) return false; const sibs = elementChildren(p); return sibs[sibs.length - 1] === el; }
    case "only-child": { const p = el.parentNode; if (!p) return false; return elementChildren(p).length === 1; }
    case "first-of-type": { const p = el.parentNode; if (!p) return false; return elementChildren(p).find((e) => e.tagName === el.tagName) === el; }
    case "last-of-type": { const p = el.parentNode; if (!p) return false; const same = elementChildren(p).filter((e) => e.tagName === el.tagName); return same[same.length - 1] === el; }
    case "only-of-type": { const p = el.parentNode; if (!p) return false; return elementChildren(p).filter((e) => e.tagName === el.tagName).length === 1; }
    case "nth-child": case "nth-last-child": {
      const p = el.parentNode; if (!p || !s.nth) return false;
      // The siblings counted: all, or those matching "of S".
      let sibs = elementChildren(p);
      if (s.nth.of) sibs = sibs.filter((e) => s.nth!.of!.some((cx) => matchComplex(cx, e, ctx)));
      const i = sibs.indexOf(el);
      if (i < 0) return false;
      const index = name === "nth-child" ? i + 1 : sibs.length - i;
      return nthMatches(s.nth, index);
    }
    case "nth-of-type": case "nth-last-of-type": {
      const p = el.parentNode; if (!p || !s.nth) return false;
      const same = elementChildren(p).filter((e) => e.tagName === el.tagName);
      const i = same.indexOf(el);
      const index = name === "nth-of-type" ? i + 1 : same.length - i;
      return nthMatches(s.nth, index);
    }
    case "any-link": case "link":
      // a and area with href (8.1); :link = unvisited, and nothing is visited here.
      ctx.notes.set(`approx:${name}`, name);
      return isHtml(el) && (el.tagName === "a" || el.tagName === "area") && attr(el, "href") !== null;
    case "checked":
      ctx.notes.set("approx:checked", "checked");
      return isHtml(el) && ((el.tagName === "input" && ["checkbox", "radio"].includes((attr(el, "type") ?? "").toLowerCase()) && attr(el, "checked") !== null) || (el.tagName === "option" && attr(el, "selected") !== null));
    case "disabled":
      ctx.notes.set("approx:disabled", "disabled");
      return isDisabled(el);
    case "enabled":
      // HTML: "any button, input, select, textarea, optgroup, option, fieldset element, or form-associated custom element that is not actually disabled".
      ctx.notes.set("approx:enabled", "enabled");
      return isHtml(el) && DISABLEABLE.has(el.tagName) && !isDisabled(el);
    case "open":
      // HTML: details and dialog with the open attribute.
      ctx.notes.set("approx:open", "open");
      return isHtml(el) && (el.tagName === "details" || el.tagName === "dialog") && attr(el, "open") !== null;
    case "required":
      // HTML: input elements that are required (the attribute applies and is present), select and textarea with the attribute.
      ctx.notes.set("approx:required", "required");
      return isHtml(el) && ["input", "select", "textarea"].includes(el.tagName) && attr(el, "required") !== null && !(el.tagName === "input" && ["hidden", "range", "color", "submit", "image", "reset", "button"].includes((attr(el, "type") ?? "").toLowerCase()));
    case "optional":
      // HTML: "input elements to which the required attribute applies that are not required" (not hidden, range, color, submit, image, reset, button), plus select and textarea without required.
      ctx.notes.set("approx:optional", "optional");
      return isHtml(el) && ["input", "select", "textarea"].includes(el.tagName) && attr(el, "required") === null && !(el.tagName === "input" && ["hidden", "range", "color", "submit", "image", "reset", "button"].includes((attr(el, "type") ?? "").toLowerCase()));
    case "read-only":
      ctx.notes.set("approx:read-only", "read-only");
      return !matchPseudo({ ...s, name: "read-write" }, el, ctx);
    case "read-write":
      ctx.notes.set("approx:read-write", "read-write");
      return isHtml(el) && (((el.tagName === "input" && !["hidden", "checkbox", "radio", "submit", "button", "reset", "image", "file", "color", "range"].includes((attr(el, "type") ?? "").toLowerCase())) || el.tagName === "textarea") && attr(el, "readonly") === null && !isDisabled(el) || attr(el, "contenteditable") !== null && attr(el, "contenteditable") !== "false");
    case "defined":
      ctx.notes.set("approx:defined", "defined");
      // Built-in names are defined; a custom element (with a hyphen) is not, since no script ran to define it.
      return !el.tagName.includes("-");
    case "lang": {
      ctx.notes.set("approx:lang", "lang");
      const l = langOf(el);
      return l !== null && (s.langs ?? []).some((r) => langMatches(l, r));
    }
    case "dir": {
      ctx.notes.set("approx:dir", "dir");
      // The nearest dir attribute, ltr by default; "auto" is not resolved.
      let cur: T.Element | null = el; let d: string | null = null;
      while (cur && d === null) { d = attr(cur, "dir"); cur = parentElement(cur); }
      return ((d ?? "ltr").toLowerCase() === (s.arg ?? "").trim().toLowerCase());
    }
    default:
      // Unreachable: the parser rejects any name outside KNOWN_PSEUDO_CLASSES (3.9); kept so the switch is total.
      return false;
  }
}

/** Match a relative selector (the argument of :has()) anchored at an element. */
function matchRelative(r: Relative, anchor: T.Element, ctx: Ctx): boolean {
  // The candidates by the leading combinator.
  const cands: T.Element[] = [];
  const p = anchor.parentNode;
  if (r.combinator === ">") cands.push(...elementChildren(anchor));
  else if (r.combinator === " ") { const walk = (n: T.ParentNode) => { for (const c of elementChildren(n)) { cands.push(c); walk(c); } }; walk(anchor); }
  else if (p) {
    const sibs = elementChildren(p);
    const i = sibs.indexOf(anchor);
    if (r.combinator === "+") { if (sibs[i + 1]) cands.push(sibs[i + 1]); }
    else cands.push(...sibs.slice(i + 1));
  }
  // The subject of the relative selector may be any candidate or any of its descendants (the rest of the chain
  // reaches them); it matches when the chain resolves with its leftmost element related to the anchor by the combinator.
  const subjects: T.Element[] = [];
  const collect = (n: T.ParentNode) => { for (const c of elementChildren(n)) { subjects.push(c); collect(c); } };
  for (const c of cands) { subjects.push(c); collect(c); }
  for (const subj of subjects) if (matchComplexAnchored(r.complex, subj, anchor, r.combinator, ctx)) return true;
  return false;
}

/** Match a complex selector against an element such that the leftmost compound's element relates to the anchor by the given combinator. */
function matchComplexAnchored(cx: Complex, el: T.Element, anchor: T.Element, comb: Combinator, ctx: Ctx): boolean {
  // Try all resolutions right to left; when the leftmost compound is reached at element x, check the anchor relation.
  const n = cx.compounds.length;
  const rec = (k: number, e: T.Element): boolean => {
    if (!matchCompound(cx.compounds[k], e, ctx)) return false;
    if (k === 0) return relates(anchor, e, comb);
    const c = cx.combinators[k - 1];
    for (const cand of leftCandidates(e, c)) if (rec(k - 1, cand)) return true;
    return false;
  };
  return rec(n - 1, el);
}

/** Whether `anchor <comb> e` holds. */
function relates(anchor: T.Element, e: T.Element, comb: Combinator): boolean {
  if (comb === ">") return parentElement(e) === anchor;
  if (comb === " ") return isAncestor(anchor, e);
  const p = e.parentNode; if (!p) return false;
  const sibs = elementChildren(p); const i = sibs.indexOf(e); const j = sibs.indexOf(anchor);
  if (j < 0) return false;
  return comb === "+" ? i === j + 1 : i > j;
}

/** The elements that could stand to the left of e for a combinator (17.3: "all possible elements that could be related to this element by the rightmost combinator"). */
function leftCandidates(e: T.Element, comb: Combinator): T.Element[] {
  if (comb === ">") { const p = parentElement(e); return p ? [p] : []; }
  if (comb === " ") { const out: T.Element[] = []; let cur = parentElement(e); while (cur) { out.push(cur); cur = parentElement(cur); } return out; }
  if (comb === "+") { const p = prevElement(e); return p ? [p] : []; }
  // "~": all previous element siblings.
  const out: T.Element[] = []; let cur = prevElement(e); while (cur) { out.push(cur); cur = prevElement(cur); } return out;
}

/** A specificity triple (A, B, C). */
export type Specificity = [number, number, number];

/** The larger of two specificities, compared component by component (15). */
function maxSpec(x: Specificity, y: Specificity): Specificity {
  // A first, then B, then C.
  if (x[0] !== y[0]) return x[0] > y[0] ? x : y;
  if (x[1] !== y[1]) return x[1] > y[1] ? x : y;
  return x[2] >= y[2] ? x : y;
}

/** The specificity of the most specific complex selector in a list; (0,0,0) for an empty list. */
export function specificityOfList(list: SelectorList): Specificity {
  // Start from zero and keep the maximum.
  let best: Specificity = [0, 0, 0];
  for (const cx of list) best = maxSpec(best, specificityOfComplex(cx));
  return best;
}

/** The specificity of a complex selector: the sum over its compounds (combinators count nothing). */
export function specificityOfComplex(cx: Complex): Specificity {
  // Sum.
  const t: Specificity = [0, 0, 0];
  for (const c of cx.compounds) { const s = specificityOfCompound(c); t[0] += s[0]; t[1] += s[1]; t[2] += s[2]; }
  return t;
}

/** The specificity of a compound selector (15): ids in A; classes, attributes and pseudo-classes in B; types and pseudo-elements in C; the universal selector nothing. */
function specificityOfCompound(c: Compound): Specificity {
  // The counts.
  const t: Specificity = [0, 0, 0];
  for (const s of c.simples) {
    switch (s.kind) {
      case "id": t[0]++; break;
      case "class": case "attr": t[1]++; break;
      case "type": t[2]++; break;
      case "universal": break;
      case "pseudo": {
        // The evaluation-context pseudo-classes have their specificity defined specially (15).
        if (s.name === "where") break;
        if (s.name === "is" || s.name === "matches" || s.name === "-webkit-any" || s.name === "not") {
          // Replaced by the most specific argument; a forgiving list's dropped members are no longer there, so they count zero (16.1).
          const a = specificityOfList(s.list ?? []); t[0] += a[0]; t[1] += a[1]; t[2] += a[2]; break;
        }
        if (s.name === "has") {
          // Replaced by the most specific relative selector's complex selector.
          const a = specificityOfList((s.relative ?? []).map((r) => r.complex)); t[0] += a[0]; t[1] += a[1]; t[2] += a[2]; break;
        }
        if ((s.name === "nth-child" || s.name === "nth-last-child") && s.nth?.of) {
          // One pseudo-class plus the most specific selector of its "of S" list.
          const a = specificityOfList(s.nth.of); t[0] += a[0]; t[1] += a[1] + 1; t[2] += a[2]; break;
        }
        // Any other pseudo-class counts as one.
        t[1]++;
        break;
      }
    }
  }
  // A pseudo-element counts in C.
  if (c.pseudoElement) t[2]++;
  return t;
}

/** Match a complex selector against an element (17.3), right to left. */
export function matchComplex(cx: Complex, el: T.Element, ctx: Ctx): boolean {
  const n = cx.compounds.length;
  const rec = (k: number, e: T.Element): boolean => {
    if (!matchCompound(cx.compounds[k], e, ctx)) return false;
    if (k === 0) return true;
    for (const cand of leftCandidates(e, cx.combinators[k - 1])) if (rec(k - 1, cand)) return true;
    return false;
  };
  return rec(n - 1, el);
}

/** Collapse whitespace and cut. */
function preview(s: string, max = 60): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** Split the selectors text into one selector per non-empty line. */
export function splitSelectors(text: string): string[] {
  return text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== "").slice(0, SELECTORS_MAX_LINES);
}

/** run: the engine. */
export function run(input: SelectorTestInput): SelectorTestResult {
  // Ceilings.
  if (input.html.length > HTML_MAX_CHARS) throw new Error(`The HTML is ${input.html.length.toLocaleString("en")} characters; the ceiling is ${HTML_MAX_CHARS.toLocaleString("en")}.`);
  if (input.selectors.length > SELECTORS_MAX_CHARS) throw new Error(`The selectors are ${input.selectors.length.toLocaleString("en")} characters; the ceiling is ${SELECTORS_MAX_CHARS.toLocaleString("en")}.`);
  // Parse the document inertly (scripting off, as DOMParser).
  const doc = parse(input.html, { sourceCodeLocationInfo: true, scriptingEnabled: false });
  // The root element.
  const root = elementChildren(doc)[0] ?? null;
  // Walk the elements in tree order, building rows and paths.
  const rows: ElementRow[] = [];
  const byEl = new Map<T.Element, number>();
  const walk = (p: T.ParentNode, depth: number, path: string) => {
    const kids = elementChildren(p);
    kids.forEach((el) => {
      // The path segment: name, plus :nth-child when a sibling shares the name.
      const same = kids.filter((k) => k.tagName === el.tagName);
      const seg = same.length > 1 ? `${el.tagName}:nth-child(${kids.indexOf(el) + 1})` : el.tagName;
      const here = path ? `${path} > ${seg}` : seg;
      // Direct text.
      const text = el.childNodes.filter(isText).map((t) => t.value).join(" ");
      const id = rows.length;
      byEl.set(el, id);
      rows.push({ id, depth, name: el.tagName, attrs: el.attrs.map((a) => ({ name: a.prefix ? `${a.prefix}:${a.name}` : a.name, value: a.value })), text: text.trim() === "" ? null : preview(text), line: el.sourceCodeLocation?.startLine ?? null, path: here, matchedBy: [] });
      walk(el, depth + 1, here);
      // Template content is not part of the document tree for matching.
    });
  };
  walk(doc, 0, "");
  // The selectors.
  const texts = splitSelectors(input.selectors);
  const reports: SelectorReport[] = texts.map((text, index) => {
    // Parse; the parser's non-fatal observations (a block closed at the end of input) become notes.
    let list: SelectorList;
    const warnings = new Set<string>();
    try { list = parseSelectorList(text, warnings); }
    catch (e) {
      const err = e as SelectorError;
      return { index, selector: text, valid: false, error: { code: err.code ?? "unexpected", at: err.at ?? 0, message: err.message }, matches: [], count: 0, specificity: null, pseudoElement: null, notes: [] };
    }
    // The pseudo-element, if the (every) complex selector ends in one; mixed lists are reported by the first.
    const pe = list.find((cx) => cx.compounds[cx.compounds.length - 1].pseudoElement)?.compounds.slice(-1)[0].pseudoElement ?? null;
    // Match every element.
    const ctx: Ctx = { root, scope: root, notes: new Map() };
    const matches: number[] = [];
    for (const [el, id] of byEl) {
      if (list.some((cx) => matchComplex(cx, el, ctx))) { matches.push(id); rows[id].matchedBy.push(index); }
    }
    // Specificity per section 15 from the parsed list: the most specific member.
    const spec: Specificity = specificityOfList(list);
    // Notes: the parser's first, then the matcher's.
    const notes = [...warnings, ...ctx.notes.keys()].map((k) => ({ code: k.slice(0, k.indexOf(":")), what: k.slice(k.indexOf(":") + 1) }));
    return { index, selector: text, valid: true, error: null, matches: matches.slice(0, MATCHES_MAX_LISTED), count: matches.length, specificity: spec, pseudoElement: pe ? `${pe.legacy ? ":" : "::"}${pe.name}${pe.arg === null ? "" : `(${pe.arg})`}` : null, notes };
  });
  // Done.
  const matched = new Set<number>(); for (const r of reports) for (const m of r.matches) matched.add(m);
  return { mode: doc.mode, elements: rows.slice(0, 2000), elementsTruncated: rows.length > 2000, selectors: reports, counts: { elements: rows.length, selectors: reports.length, valid: reports.filter((r) => r.valid).length, matchedElements: matched.size } };
}
