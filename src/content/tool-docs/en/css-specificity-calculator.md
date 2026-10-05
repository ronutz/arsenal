## What it does

Reads one or more CSS selectors (one per line, comma-separated, or a whole stylesheet pasted in, whose declaration blocks and at-rule preludes are dropped) and computes each selector's specificity as the (A, B, C) triple of Selectors Level 4, with every simple selector named and the column it adds to. The selectors are ranked the way the cascade ranks them, ties are called out (order of appearance decides there), and each special rule the selector relied on is explained beside it.

## The counting

From Selectors Level 4, "Calculating a selector's specificity":

- **A** counts ID selectors (`#main`).
- **B** counts class selectors (`.nav`), attribute selectors (`[type="text"]`) and pseudo-classes (`:hover`).
- **C** counts type selectors (`li`) and pseudo-elements (`::before`).
- The universal selector (`*`) is ignored; combinators add nothing.
- Specificities are compared column by column: a larger A wins; if A ties, a larger B; if B ties, a larger C; if all tie, the specificities are equal.
- "Repeated occurrences of the same simple selector are allowed and do increase specificity": `.a.a` is (0,2,0).

The special cases the specification spells out, and the calculator applies:

- `:is()`, `:not()` and `:has()`: the specificity "is replaced by the specificity of the most specific complex selector in its selector list argument". `:not(em, strong#foo)` is (1,0,1).
- `:nth-child()` and `:nth-last-child()` with an `of` clause: one pseudo-class "plus the specificity of the most specific complex selector in its selector list argument". `:nth-child(even of li, .item)` is (0,2,0).
- `:where()`: "replaced by zero". `.qux:where(em, #foo#bar#baz)` is (0,1,0).
- The legacy single-colon pseudo-elements of CSS2 (`:before`, `:after`, `:first-line`, `:first-letter`) are pseudo-elements and count in C.
- From the CSS Shadow Module Level 1: `:host` is a pseudo-class; `:host()` and `:host-context()` are a pseudo-class plus their argument; `::slotted()` is a pseudo-element plus its argument. `::part()` is counted as one pseudo-element (the module defers its exact rule to CSS Pseudo-Elements Level 4; the assumption is stated on the page).

The calculator reproduces the specification's examples table: `*` (0,0,0), `LI` (0,0,1), `UL LI` (0,0,2), `UL OL+LI` (0,0,3), `H1 + *[REL=up]` (0,1,1), `UL OL LI.red` (0,1,3), `LI.red.level` (0,2,1), `#x34y` (1,0,0), `#s12:not(FOO)` (1,0,1), `.foo :is(.bar, #baz)` (1,1,0).

## Before specificity

Specificity decides only when everything above it in the cascade is equal. CSS Cascading and Inheritance Level 5 sorts declarations by, in descending order of priority: origin and importance (an `!important` author declaration beats every normal one, whatever the selector), context (shadow trees), element-attached styles (a `style` attribute beats any rule of the same importance), cascade layers (the last layer wins for normal declarations, the first for important ones), then specificity, then order of appearance (the last declaration in document order wins, with style attributes placed after every style sheet). The page lists these so a surprising winner can be traced to the right step.

## Limits

- The calculator reads syntax, not a document. It cannot know whether a selector matches anything, and for a selector list the specificity in effect in a real match is that of the most specific member that matches; the page ranks the members individually.
- Namespace prefixes (`ns|p`) are read but not resolved.
- Unknown pseudo-classes and pseudo-elements are counted by their shape (one colon B, two colons C), which is what the grammar says; whether a browser supports them is another question.
- Implementations may clamp very large counts; the calculator does not.

## Sources

- [Selectors Level 4, W3C Working Draft 22 January 2026: Calculating a selector's specificity](https://www.w3.org/TR/selectors-4/#specificity-rules) (read 2026-10-05)
- [CSS Cascading and Inheritance Level 5, W3C Candidate Recommendation Snapshot 13 January 2022: Cascade Sorting Order](https://www.w3.org/TR/css-cascade-5/#cascade-sort) (read 2026-10-05)
- [CSS Shadow Module Level 1, Editor's Draft 28 April 2026](https://drafts.csswg.org/css-shadow-1/) (read 2026-10-05)
