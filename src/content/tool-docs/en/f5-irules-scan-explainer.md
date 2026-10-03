## What it does

`scan` is the cheap way to take a value apart in an iRule; F5's `matches_regex` reference notes that a string command is more efficient than a regular expression and that most cases can be handled with `string match` or `scan`. Give the tool a value, a format and the variable names, and it lines each directive of the format up against the characters it consumed, the value it produced and the variable that received it, then says exactly why scanning stopped. The value is drawn on a ruler with each conversion's characters in its own colour.

## How to read the result

- **scan returned** is the command's result: with variable names, the number of variables that received a value; without names, a list of the converted values.
- **Directive by directive** has one row per directive: a literal that had to match, white space that skips any amount, or a conversion such as `%d`, `%s` or `%[^&]`.
- **Variables afterwards** shows what each named variable holds. A variable after the point where scanning stopped is not set by this scan.

## Worth knowing

- `-1` means the input ended before the first conversion; `0` means a conversion was tried and did not match. Check for both when a value may be empty.
- `%d` skips leading white space and reads decimal; `%i` takes the base from a prefix, so `08` read with `%i` gives 0 and stops at the 8. Use `%d` for zero-padded times and codes.
- `%s` stops at white space; `%[^&]` reads everything up to an ampersand.
- Tcl 8.4.6 stores integer conversions through a C `int`: `3000000000` read with `%d` comes back as `-1294967296`, and the `l` modifier does not change that in 8.4.6. To keep a large number intact, read it as text with `%[0-9]` and let `expr` interpret it.
- `%n` stores the amount of input consumed so far. The manual says characters, but Tcl 8.4.6 counts bytes of its internal UTF-8, so each character outside ASCII counts 2 or 3.

## Limits

The engine follows `Tcl_ScanObjCmd` of Tcl 8.4.6 and was checked against a real Tcl 8.4.6 interpreter on thousands of generated cases. Integer results that depend on the platform's C library are marked.

## Sources

- [Tcl 8.4 manual: scan](https://www.tcl-lang.org/man/tcl8.4/TclCmd/scan.htm) (read 2026-10-03)
- [F5 iRules reference: matches_regex](https://clouddocs.f5.com/api/irules/matches_regex.html) (read 2026-10-02)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (the reference interpreter)
