## What it does

Reads an iRule against the DevCentral "iRules Style Guide" (published by JRahm with Jim_Deucker on 2022-12-22) and runs a real Tcl 8.4 parse over it. The rule is parsed, never executed. Each finding names the guide rule it comes from, the line, and what to change; flagged lines are marked on a numbered copy of the rule.

## What it checks

- **Editor settings (E1 to E3):** tabs and indents that are not multiples of 4 spaces, lines over 100 columns (a warning past 120), Windows line endings, trailing white space, non-ASCII characters, and a missing final line feed.
- **Numbered rules:** curly quotes and no-break spaces (R1), the 64 KB size limit (R2), a lone `{` on its own line or `else` on a new line (R4), end-of-line comments, comments without a space and comments between `switch` patterns (R6), several commands on one line (R7), single-line `if` (R8), state stored as words such as `yes` (R9), F5's `and` / `or` / `not` (R10), `}{` with no space (R11), unbraced expressions (R12), variables in expressions without spaces around them (R13) or without braces around the name (R14), `switch` and `table` without `--` (R15), events without a priority (R16), `table` entries without a timeout or lifetime (R17; F5's `table` reference otherwise applies a 180-second timeout and an indefinite lifetime), unprefixed `static::` names (R18), `static::` debug flags (R19), and commented-out code (R20).
- **Syntax:** an error the Tcl 8.4 parser reports, such as `}{` with no space ("extra characters after close-brace"), means the iRule cannot load at all.

## Limits

Some rules cannot be judged from text alone: whether a line starting with `#` is commented-out code or a comment missing its space is a guess based on the first word, so those findings are notes. Rule R3 (break the iRule into functional blocks) is a design choice the checker does not judge; R5 (the 4-space indent carried into nested values such as `switch` arms) is covered by the indentation check, and the editor setting about avoiding line continuations is not checked.

## Sources

- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (read 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (read 2026-10-03)
- [F5 iRules reference: table](https://clouddocs.f5.com/api/irules/table.html) (read 2026-10-03)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (read 2026-10-03)
