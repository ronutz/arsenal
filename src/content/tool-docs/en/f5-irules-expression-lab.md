## What it does

Evaluates an expression the way `expr`, `if` and `while` do in an iRule, and shows the whole evaluation: the value and how it is held, the expression with every operator's operands in parentheses so precedence is visible, a tree of every step, and, for a comparison, what `==`, `eq`, `<` and `>` each make of the same two operands. Variables get their values from ordinary `set` commands, so quoting behaves exactly as in an iRule.

Two modes: **Tcl 8.4** (plain Tcl 8.4.6, the base F5 names in K6091) and **iRules**, which adds the operators F5 documents (`contains`, `starts_with`, `ends_with`, `equals`, `matches_glob`, `matches_regex`, `and`, `or`, `not`) and request commands such as `[HTTP::uri]`, answered from an editable sample request.

## How to read the tree

Each box is one part of the expression: its source, an arrow, and what it produced. Operands sit under their operator. The notes under a box say what happened there, for example "Compared as integers: 10 and 10" for `$x == $y` with `x` set to `012`, or "Compared as text because the left side is not a number". A part marked "never evaluated" was skipped by `&&`, `||` or `?:`.

## Worth knowing

- `==` and the other comparison operators compare numbers when both sides read as numbers, and text otherwise. `eq` and `ne` always compare text.
- In a text comparison character codes decide, so every upper-case letter sorts before every lower-case one: `"bench" < "Chair"` is false.
- `true == 1` is false: `true` is a boolean word, not a number, so the comparison is between texts.
- Tcl 8.4 has no `**` operator; `2 ** 3` is a syntax error.
- Integer division rounds toward negative infinity (`7 / -2` is `-4`) and a remainder takes the divisor's sign.
- A literal such as `08` written in the expression is rejected when the expression is compiled, before any part of it runs.
- Brace your expressions. Without braces Tcl substitutes the text twice, which is slower and lets data run as code (F5 K57410758 and K15650046). The script stepper shows this happening.

## Limits

F5 documents its word operators but not their precedence relative to the Tcl operators; the tool places `contains`, `starts_with` and the others with `==`, and `and` and `or` with `&&` and `||`. `rand()` and `srand()` are refused because their results cannot be reproduced. Commands run inside an expression (in brackets) use the same small interpreter as the script stepper, bounded to 2,000 commands. This tool is not offered over the API, because it executes the Tcl you give it.

## Sources

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (read 2026-10-03)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (read 2026-10-02)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
