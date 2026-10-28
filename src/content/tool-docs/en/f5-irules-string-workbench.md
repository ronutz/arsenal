## What it does

Runs one Tcl 8.4.6 `string` subcommand and draws the result on a character ruler: every character of the string with its index, coloured by what the command did with it (searched, matched, returned, replaced, trimmed, or the first difference in a comparison). Seventeen subcommands are covered: `length`, `bytelength`, `tolower`, `toupper`, `range`, `index`, `first`, `last`, `map`, `match`, `compare`, `equal`, `trim`, `trimleft`, `trimright`, `replace` and `repeat`.

## How to read the result

- **The command** is the exact line to paste into an iRule, quoted the way Tcl needs.
- **The ruler** numbers characters from 0, the way every index argument counts.
- **Index arguments** shows how each index was read: `end-1` means the last character but one, and an index written `010` is octal, so it means 8.
- **The single pass of string map** lists each position: kept, or replaced by which key and value.

## Worth knowing

- `length` counts characters; `bytelength` counts the bytes of Tcl's internal UTF-8, so `héllo` is 5 characters and 6 bytes.
- `string map` makes one pass from left to right. At each position the first key in the list that matches wins, and replaced text is never examined again: `string map {a 1 ab 2} abab` gives `1b1b`, while `{ab 2 a 1}` gives `22`.
- `compare` orders by character code, so `string compare bench Chair` is 1.
- `string index` and `string range` return an empty string, not an error, when the index is outside the string.
- `trim` removes a **set** of characters, in any order, not a word.
- Tcl 8.4.6 accepts `e` or `en` on their own as `end`, but `e-1` is an error.
- Case conversion uses Tcl 8.4.6's own Unicode tables, which differ from a modern browser's for about a thousand characters (for example, Tcl 8.4.6 has no upper-case form for `µ`).

## Share results

Under the result, **Share results** builds a link to this page, only when you press it, that carries the form by name: the subcommand as `#op=`, then each argument field that holds something under its own name (`&string=`, `&first=`, `&needle=`, `&haystack=`, `&mapping=` and so on), and `&nocase=1` when **-nocase** is ticked on a subcommand that takes it. There is no single `#input=`: which field holds the text being worked on changes with the subcommand. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; longer fields get no link, and the popover says how long they are.
- **Opening a link.** The subcommand and its fields fill as typing would (a field the link does not carry is empty) and the result is computed. An unknown subcommand, a field the subcommand does not take, or `-nocase` where it does not apply makes the whole link ignored; field text is accepted as typed, and a bad index gets Tcl's own error, as typing does. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Limits

Characters beyond the Basic Multilingual Plane are refused, because Tcl 8.4 cannot hold them as one character. `string is`, `totitle`, `wordstart` and `wordend` are not modelled. Results are capped at 100,000 characters for `repeat`.

## Sources

- [Tcl 8.4 manual: string](https://www.tcl-lang.org/man/tcl8.4/TclCmd/string.htm) (read 2026-10-03)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [Tcl 8.4.6 source code, tag core-8-4-6](https://github.com/tcltk/tcl/tree/core-8-4-6) (the reference interpreter the engine is tested against)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
