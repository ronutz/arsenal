## What it does

Reads HTML (a whole document or a fragment) with the same parser browsers are specified to use and shows what came out: the tree (every element, text node and comment, indented by depth, with the line of its tag), the elements the parser created without a tag, the end tags it supplied, the formatting elements it split, the content it moved out of a table, the document mode (no-quirks, limited-quirks or quirks), the DOCTYPE, title, language and encoding the document declares, every parse error by the standard's own code with its line and column, the heading outline, and a list of findings on structure and accessibility, each tied to a sentence of the HTML Standard or of WCAG 2.2. It also counts what would have run and did not: script elements, inline event handlers, javascript: URLs, style elements, iframes.

The parser is parse5, the spec-compliant HTML parser used by jsdom, Cheerio and the Angular compiler, run with source positions and the parse-error callback on, and with the scripting flag off (as DOMParser parses). Nothing is executed, fetched or rendered. The hosted API runs the same code and returns the same tree.

## Reading the tree

- A **dot** in the line gutter marks a node with no position in the source: the parser created it. The standard: "Omitting an element's start tag in the situations described below does not mean the element is not present; it is implied, but it is still there." html, head, body and tbody are the usual ones.
- **end supplied** marks an element whose end tag is not in the source. For 19 elements the standard allows this (13.1.2.4 Optional tags: html, head, body, li, dt, dd, p, rt, rp, optgroup, option, colgroup, caption, thead, tbody, tfoot, tr, td, th); for any other element it means the end tag was missing or another end tag closed it first, and finding D13 says which.
- **piece n** marks the result of the adoption agency algorithm: when an end tag closes a formatting element (a, b, i, em, strong, font, small, s, u, code, nobr, big, tt, strike) that is not the innermost open element, the parser closes it and reopens a copy around what follows, so one source element becomes several (finding D14).
- **moved** marks foster parenting: text or elements written inside a table where only table parts may appear are inserted before the table (finding D15).
- **void** marks the 13 elements that never have an end tag (area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr). A trailing slash on them is "unnecessary and has no effect of any kind"; on any other HTML element it is a parse error and the element stays open.

## The parse errors

The standard defines the error handling exactly, so a document with errors still has one exact tree: "Parse errors are only errors with the syntax of HTML." Its table of named errors (13.2.2) has 52 codes, each with a non-normative description; the page quotes the description beside each error. The errors of tree construction (a stray end tag, elements left open at the end, a second body) are described in the standard's prose without codes; parse5 names those itself (missing-doctype, end-tag-without-matching-open-element, open-elements-left-after-eof and nine more), and the page marks which authority named each code.

## The findings

D1 no DOCTYPE and D2 a legacy DOCTYPE (quirks mode); D3 no lang on the root (WCAG 3.1.1); D4 the title missing, repeated or empty (head content model, WCAG 2.4.2); D5 the character encoding declaration missing, beyond the first 1024 bytes, or not UTF-8; D6 img without alt and D7 img with an empty alt (WCAG 1.1.1 and the standard's alternative-text rules); D8 a link or button made only of images without alt text; D9 heading jumps and a missing h1 (4.3.11: "less than, equal to, or 1 greater"); D10 duplicate ids; D11 and D12 the obsolete elements and attributes of section 16.2, each with the standard's replacement advice; D13 to D16 what the parser repaired; D17 a labelable control with no label; D18 what did not run; D19 empty headings (WCAG 2.4.6); D20 the elements the parser created.

## Limits

- parse5 8.0.1 implements the standard as of its release. The processing-instruction tokenization the standard added in 2026 is not in it: `<?…>` is reported under the earlier name unexpected-question-mark-instead-of-tag-name and becomes a comment, which is also what the current standard does for an xml target.
- The findings read structure, not meaning: whether an alt text is good, whether a heading describes its section, whether a lang tag is right, are not questions a parser can answer. headingoffset and headingreset are not applied to the outline.
- The tree list stops at 2,000 nodes (the counts cover everything); inputs over 200,000 characters are refused.

## Sources

- [HTML Living Standard, 13 The HTML syntax: 13.2.2 Parse errors](https://html.spec.whatwg.org/multipage/parsing.html#parse-errors) (read 2026-10-05)
- [HTML Living Standard, 4.3.11 Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines) (read 2026-10-05)
- [HTML Living Standard, 16.2 Non-conforming features](https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features) (read 2026-10-05)
- [WCAG 2.2, W3C Recommendation 12 December 2024](https://www.w3.org/TR/WCAG22/) (read 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (read 2026-10-05)
