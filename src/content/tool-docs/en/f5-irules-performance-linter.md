## What it does

Paste an iRule; the linter flags a small set of high-confidence, F5-documented performance and correctness anti-patterns, line by line, each with a severity, the offending token, why it matters, and the fix. It is a static scanner (no Tcl parser, no execution), so it deliberately covers only patterns a line scan can catch reliably and with few false positives. It is not a substitute for measurement: pair it with the iRules Runtime Calculator, which reads real timing statistics, for the actual cost of a rule. Everything runs locally.

## What it flags

**Global-namespace variables** (`$::x`, `set ::x`, the `global` keyword) are flagged HIGH. F5's validator catches the `global` keyword as of v10 and demotes the virtual server to a single TMM instance (CMP demotion), so one processor handles all of that virtual's connections; global variables have been deprecated since v10. The obsolete `$::datagroup` form is worse still: on version 11 and later, accessing a data group that way raises a TCL runtime error and sends a reset to the client. The fix is the CMP-safe `static::` namespace for shared constants, ordinary local variables for per-connection data, or the `class` command for data groups.

**`expr` without braces** is a WARNING. Tcl substitutes and re-parses the unbraced form, and can double-substitute; bracing the expression lets the bytecode compiler optimize it. The fix is `expr { ... }`.

**`matchclass` / `findclass`** are INFO. Both were deprecated in v10 in favor of the `class` command, which F5 describes as offering better functionality and performance. The fix is `class match` / `class search`.

**`regexp` / `regsub`** are INFO. Regular expressions cost materially more than fixed string work; when the match is a prefix, suffix, exact value, or simple glob, `string`, `scan`, `switch -glob`, or `class` are cheaper.

## What it deliberately does not flag

`static::` variables (CMP-safe), `class match` / `class search`, and braced `expr` are correct and pass clean. Persistence, tables, and the `session` command are CMP-compatible on modern versions, so they are not treated as CMP problems. Full-line comments are skipped.
