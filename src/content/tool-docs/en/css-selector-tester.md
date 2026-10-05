## What it does

Takes HTML (a document or a fragment) and one or more selectors, one per line, and shows which elements each selector matches: the elements highlighted in the parsed tree with their path and source line, the count per selector, the specificity triple counted per section 15, a note when the selector names a pseudo-element (then the count is of the originating elements, since a pseudo-element is a box, not an element), and, when a selector is invalid, the reason and the position.

The HTML is parsed inertly with parse5, the same parser the HTML structure explainer uses; selectors are parsed and matched by an in-house engine written from Selectors Level 4 (W3C Working Draft, 22 January 2026) and the HTML Standard's selector rules, and checked against Chromium's `querySelectorAll` on the vectors shipped with the tool (139 of 146 selectors agree; the seven that differ are listed below and each is deliberate). Nothing is executed, fetched or rendered; the hosted API runs the same code.

## What is matched, and how

- Type selectors and attribute names are compared lower-cased for HTML elements (HTML Standard, "Case-sensitivity of selectors"); attribute values are case-sensitive except for the 46 attribute names HTML lists (type, lang, dir, rel, checked, disabled, ...), unless the selector says `i` or `s` (Selectors 4, 6.3). Class and id are case-sensitive in every mode.
- `[att]`, `[att=val]`, `[att~=val]`, `[att|=val]`, `[att^=val]`, `[att$=val]`, `[att*=val]` as 6.1 and 6.2 define them, including the rule that an empty value in `~=`, `^=`, `$=` and `*=` matches nothing.
- `:is()` and `:where()` with forgiving selector lists (16.1): a member that fails to parse is dropped and counts zero towards specificity, and an argument left empty is valid and matches nothing (4.2); `:not()` with a selector list that one invalid member invalidates (4.3); `:has()` with relative selectors (child, descendant, next-sibling and subsequent-sibling forms), not nested (4.5). No pseudo-element is valid inside any of the four.
- `:root`, `:empty`, `:first-child`, `:last-child`, `:only-child`, `:nth-child(An+B of S)`, `:nth-last-child()`, `:first-of-type`, `:last-of-type`, `:only-of-type`, `:nth-of-type()`, `:nth-last-of-type()` per section 13; the four combinators per section 14; matching right to left per 17.3.
- `:lang()` with extended filtering over the nearest `lang` attribute, quoted or identifier ranges (7.2); `:dir()` from the nearest `dir` attribute.
- From the HTML Standard's definitions, read off attributes: `:checked`, `:enabled`, `:disabled` (a disabled fieldset disables its descendants except those in its first legend), `:required`, `:optional`, `:read-write`, `:read-only`, `:open`, `:any-link`, `:link`, `:defined`.
- Valid but never matching here: `:hover`, `:active`, `:focus`, `:focus-visible`, `:focus-within` ("In non-interactive user agents, these pseudo-classes are valid, but never match any element", section 9), `:visited`, `:target`, and the media, display and shadow-tree states. Not evaluated: `:valid`, `:invalid`, `:in-range`, `:out-of-range`, `:indeterminate`, `:default`, `:placeholder-shown`.
- Invalid selectors (3.9) are named with the position of the error: an unknown pseudo-class, a bad An+B, a dangling combinator, a malformed attribute selector, a nested `:has()`, two pseudo-elements, a pseudo-element inside a logical pseudo-class, an empty list member, an undeclared namespace prefix (only `*|` and `|` exist here).
- A bracket, a function or a string left open at the end of the selector is closed there, as CSS Syntax Level 3 does (5.5.9 and 5.5.10: `<eof-token>`: "Discard a token from input. Return block"; 4.3.5 for a string, where the end of input is a parse error and the string token is still returned) and as Chromium does (checked 2026-10-05); the selector carries a note.
- Specificity (section 15): ids in A; classes, attributes and pseudo-classes in B; types and pseudo-elements in C; `:is()`, `:not()` and `:has()` take the specificity of their most specific argument, `:where()` counts zero, and `:nth-child(An+B of S)` counts one pseudo-class plus its most specific S. It is counted from the parsed selector, so a member a forgiving list dropped counts zero; the specificity calculator counts the text as written.

## Where the tester and a browser can differ

- `:empty`: Chromium (checked 2026-10-05) still applies the Level 3 rule (any text, even whitespace, makes an element non-empty); Selectors 4 changed it. The tester follows the browser and says so.
- The `s` flag on attribute values and the quoted `:lang("pt-BR")` form are Level 4 features Chromium (checked 2026-10-05) does not yet accept; the tester accepts them.
- `:optional` excludes input types to which `required` does not apply (hidden, range, color, submit, image, reset, button), as the HTML Standard says; Chromium matches hidden inputs.
- `:scope` is the document root here (`querySelectorAll` on a document has the document itself as scoping root, which cannot be a subject).
- `:valid`, `:invalid` and the other constraint-validation states are not evaluated here; a browser evaluates them.
- A selector that names a pseudo-element lists the elements that would originate it; `querySelectorAll` returns nothing for such a selector, by design.

## Sources

- [Selectors Level 4, W3C Working Draft 22 January 2026](https://www.w3.org/TR/selectors-4/) (read 2026-10-05)
- [HTML Living Standard, Interactions with CSS: Selectors](https://html.spec.whatwg.org/multipage/semantics-other.html#selectors) (read 2026-10-05)
- [CSS Syntax Module Level 3, W3C Candidate Recommendation Draft 1 October 2026](https://www.w3.org/TR/css-syntax-3/) (read 2026-10-05)
- [Quirks Mode Standard](https://quirks.spec.whatwg.org/) (read 2026-10-05)
- [parse5](https://github.com/inikulin/parse5) (read 2026-10-05)
