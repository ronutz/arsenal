## What it does

`findstr`, `substr` and `getfield` are commands F5 adds to iRules for cutting a piece out of a value. The tool runs the one you pick on your string and marks the result on a ruler: the search string found, the characters skipped, the terminator, the separators and the field returned. Beside it, the plain Tcl that does the same job runs in the same engine, so you can see whether the two really agree.

## The three commands

- `findstr string search ?skip? ?terminator?` finds `search`, moves `skip` characters on from the start of the match, then returns up to the terminator. F5's example: `findstr "<sip:+12065551234@sip.example.com>" "@" 1 ">"` returns `sip.example.com`.
- `substr string skip ?terminator?` starts at index `skip`, where 0 is the first character. `substr "abcdefghijklm" 2 "gh"` returns `cdef`.
- `getfield string separator field` splits at every occurrence of the separator, which can be one character or a string, and returns that field, counting from 1.

For `findstr` and `substr`, a terminator that is a number is a length (up to that many characters, fewer when the string ends first); any other terminator is text to stop before. All of F5's published examples for these commands are reproduced exactly by the tool's tests.

## What F5 does not document

Where F5's pages are silent, the tool states the assumption it made, marked "Not documented by F5":

- `findstr` when the search string is absent. The tool returns an empty string. F5 calls `findstr` equivalent to `string range` with `string first`, but that equivalent returns the whole string in this case, so the two descriptions cannot both be right.
- A count of 0. F5's rule ("that many characters") would return nothing, but F5's own `substr` example with 0 returns the rest of the string; the tool follows the example, and a contributor note on F5's API reference page reports that 0 did not work on 11.5.4 and 11.6.0.
- A skip past the end, a negative skip or count, an empty terminator, and a `getfield` field number outside the fields.

Check these cases on a BIG-IP before relying on them.

## Sources

- [F5 tmsh reference: findstr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_findstr.html) (read 2026-10-03)
- [F5 tmsh reference: substr](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_substr.html) (read 2026-10-03)
- [F5 tmsh reference: getfield](https://clouddocs.f5.com/cli/tmsh-reference/latest/modules/ltm/ltm_rule_command_getfield.html) (read 2026-10-03)
- [F5 iRules reference: substr, with the contributor note on the 0 count](https://clouddocs.f5.com/api/irules/substr.html) (read 2026-10-02)
- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (read 2026-10-03)
