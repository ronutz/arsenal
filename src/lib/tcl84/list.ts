// ============================================================================
// src/lib/tcl84/list.ts
// ----------------------------------------------------------------------------
// TCL 8.4 LISTS - how a string is split into list elements, and how elements
// are written back out as a string.
//
// This matters for iRules far more than it looks. `foreach item $var` does not
// iterate over "words a human sees": it parses $var as a Tcl LIST. A value
// built with "$a $b" or with concat becomes a list only because spaces happen
// to separate elements, and "fish parrot" inside one variable becomes TWO
// elements the moment the combined string is read as a list. The string
// combining tool shows exactly that, using these functions.
//
// Parsing follows TclFindElement + TclCopyAndCollapse (tclUtil.c, Tcl 8.4.6):
// elements are separated by white space; {braced} elements are taken
// literally; "quoted" and bare elements have backslash sequences decoded.
// Formatting follows Tcl_ScanCountedElement / Tcl_ConvertCountedElement: an
// element that needs protecting is wrapped in braces when that is safe, and
// backslash-escaped when braces would be unbalanced.
// ============================================================================

import { backslashAt } from "./parse";
import { isCSpace } from "./numbers";

/** A list that could not be parsed, with Tcl 8.4's own message. */
export class TclListError extends Error {
  /** Build the error. */
  constructor(message: string) {
    // Error carries the message.
    super(message);
    // A stable name.
    this.name = "TclListError";
  }
}

/** Collapse backslash sequences in an unbraced element (TclCopyAndCollapse). */
function collapse(raw: string): string {
  // The decoded text.
  let out = "";
  // Walk the raw characters.
  for (let i = 0; i < raw.length; ) {
    // A backslash starts a sequence.
    if (raw[i] === "\\") {
      // Decode it.
      const b = backslashAt(raw, i);
      // Append what it stands for.
      out += b.text;
      // Skip it.
      i += b.length;
    } else {
      // Ordinary character.
      out += raw[i++];
    }
  }
  // The element's value.
  return out;
}

/** The first few non-space characters after a close, for error messages. */
function trailing(s: string, p: number): string {
  // Up to 20 characters, stopping at white space.
  let q = p;
  // Advance while not space and within the window.
  while (q < s.length && !isCSpace(s[q]) && q < p + 20) q++;
  // The offending text.
  return s.slice(p, q);
}

/** Split a string into Tcl list elements. Throws TclListError. */
export function parseList(s: string): string[] {
  // The elements found.
  const out: string[] = [];
  // Current offset.
  let p = 0;
  // One element per iteration.
  for (;;) {
    // Skip white space before an element.
    while (p < s.length && isCSpace(s[p])) p++;
    // The end of the string ends the list.
    if (p >= s.length) return out;
    // A braced element.
    if (s[p] === "{") {
      // Nesting depth inside the element.
      let depth = 1;
      // Where the element's text starts.
      const begin = ++p;
      // Scan for the matching close brace.
      for (;;) {
        // Running out means the brace never closed.
        if (p >= s.length) throw new TclListError("unmatched open brace in list");
        // A backslash protects the next character from brace counting.
        if (s[p] === "\\") {
          // Skip the whole sequence.
          p += backslashAt(s, p).length;
          // Next character.
          continue;
        }
        // An opening brace nests.
        if (s[p] === "{") depth++;
        // A closing brace un-nests; the matching one ends the element.
        else if (s[p] === "}" && --depth === 0) break;
        // Advance.
        p++;
      }
      // The element is the text between the braces, taken literally.
      out.push(s.slice(begin, p));
      // Step past the close brace.
      p++;
      // It must be followed by white space or the end.
      if (p < s.length && !isCSpace(s[p])) throw new TclListError(`list element in braces followed by "${trailing(s, p)}" instead of space`);
      // Next element.
      continue;
    }
    // A quoted element.
    if (s[p] === '"') {
      // Where the element's text starts.
      const begin = ++p;
      // Scan for the closing quote.
      for (;;) {
        // Running out means the quote never closed.
        if (p >= s.length) throw new TclListError("unmatched open quote in list");
        // A backslash skips its sequence.
        if (s[p] === "\\") {
          // Skip the whole sequence.
          p += backslashAt(s, p).length;
          // Next character.
          continue;
        }
        // The closing quote ends the element.
        if (s[p] === '"') break;
        // Advance.
        p++;
      }
      // Backslashes inside quotes are decoded.
      out.push(collapse(s.slice(begin, p)));
      // Step past the closing quote.
      p++;
      // It must be followed by white space or the end.
      if (p < s.length && !isCSpace(s[p])) throw new TclListError(`list element in quotes followed by "${trailing(s, p)}" instead of space`);
      // Next element.
      continue;
    }
    // A bare element runs to the next white space.
    const begin = p;
    // Scan to white space, skipping backslash sequences as units.
    while (p < s.length && !isCSpace(s[p])) p += s[p] === "\\" ? backslashAt(s, p).length : 1;
    // Backslashes in bare elements are decoded.
    out.push(collapse(s.slice(begin, p)));
  }
}

/**
 * Write one element the way Tcl 8.4 does inside a list: braces when the
 * element needs protecting and braces are safe; backslashes otherwise.
 */
export function formatElement(e: string): string {
  // An empty element is written as {}.
  if (e === "") return "{}";
  // Scan the element (Tcl_ScanCountedElement).
  let useBraces = e[0] === "{" || e[0] === '"';
  // Whether braces must not be used, and whether braces are unbalanced.
  let dontUseBraces = false;
  // Brace balance inside the element.
  let unmatched = false;
  // Running brace depth.
  let depth = 0;
  // Walk every character.
  for (let i = 0; i < e.length; i++) {
    // The character.
    const c = e[i];
    // Count braces.
    if (c === "{") depth++;
    // A close brace with nothing open is unbalanced.
    else if (c === "}") {
      // One level down.
      depth--;
      // Below zero cannot be braced.
      if (depth < 0) { dontUseBraces = true; unmatched = true; }
    }
    // Characters that need protection.
    else if (c === "[" || c === "$" || c === ";" || c === " " || c === "\f" || c === "\n" || c === "\r" || c === "\t" || c === "\v") useBraces = true;
    // A backslash at the end, or before a newline, cannot be braced.
    else if (c === "\\") {
      // Trailing or before newline.
      if (i + 1 === e.length || e[i + 1] === "\n") {
        // The C code REPLACES the flags here.
        useBraces = false;
        // Braces are unsafe.
        dontUseBraces = true;
        // And brace characters must be escaped.
        unmatched = true;
      } else {
        // Any other backslash just needs protection.
        useBraces = true;
        // Skip the sequence it starts.
        i += backslashAt(e, i).length - 1;
      }
    }
  }
  // Unbalanced overall: braces are unsafe.
  if (depth !== 0) { useBraces = false; dontUseBraces = true; unmatched = true; }
  // Braces are used when needed and safe.
  if (useBraces && !dontUseBraces) return `{${e}}`;
  // Otherwise escape character by character (Tcl_ConvertCountedElement).
  let out = "";
  // Start position (a leading brace is escaped specially).
  let i = 0;
  // A leading "{" is always escaped and forces brace escaping.
  if (e[0] === "{") {
    // Escape it.
    out += "\\{";
    // Skip it.
    i = 1;
    // All later braces get escaped too.
    unmatched = true;
  }
  // Escape the rest.
  for (; i < e.length; i++) {
    // The character.
    const c = e[i];
    // Characters escaped with a backslash.
    if (c === "]" || c === "[" || c === "$" || c === ";" || c === " " || c === "\\" || c === '"') out += "\\" + c;
    // Braces are escaped only when unbalanced.
    else if (c === "{" || c === "}") out += unmatched ? "\\" + c : c;
    // White space control characters become C escapes.
    else if (c === "\f") out += "\\f";
    // Newline.
    else if (c === "\n") out += "\\n";
    // Carriage return.
    else if (c === "\r") out += "\\r";
    // Tab.
    else if (c === "\t") out += "\\t";
    // Vertical tab.
    else if (c === "\v") out += "\\v";
    // Anything else is literal.
    else out += c;
  }
  // The escaped element.
  return out;
}

/** Join elements into a well-formed Tcl list string (as `list` does). */
export function formatList(elements: string[]): string {
  // Each element formatted, separated by single spaces.
  return elements.map(formatElement).join(" ");
}
