## What it does

Describe one decision as ordered rules ("paths starting with /api go to api_pool, /login goes to login_pool, everything else to web_pool") and the tool writes it three ways:

- an `if` / `elseif` chain,
- a `switch` (with `-glob` when a rule needs it, and `--` before the value),
- a `class match` lookup on data groups, with the `tmsh` definitions of the data groups.

A test value then runs through each generated rule in the teaching interpreter, and the page shows which pool each form chose.

## Why the forms can disagree

`if` and `switch` take the **first** rule that matches, in the order written. `class match` with `starts_with` or `ends_with` returns the **longest** matching entry, whatever the order (F5's `class` reference says so). With rules `/api` and `/api/v2`, the test value `/api/v2/users` goes to `api_pool` through `if` and `switch`, but to `api_v2_pool` through `class match`. The tool also flags a rule that can never fire because an earlier rule always matches first.

## Worth knowing

- Lower-casing the value (`string tolower`) makes the comparison case-insensitive, but then a rule value with capitals can never match; the tool warns about that.
- `class match` has no glob comparison, so a glob rule rules out the data-group form.
- A rule value with a brace that has no partner is written with a backslash in front (`\{`). Tcl counts the braces inside a braced body even between double quotes (rule 5 of the Tcl 8.4 syntax page), so a lone one would break the rule; real Tcl 8.4.6 stops with `missing close-brace`.
- For `HTTP::path`, a test value is cut at its first question mark: `HTTP::path` does not include the query string (F5's `HTTP::path` reference), so the rules compare only the part before it.
- Record names with characters other than letters, digits and `_ . / : -` are written in double quotes in the `tmsh` definitions. That quoting has not been tried on a BIG-IP: list the data group in `tmsh` after creating it and check the records.
- The generated code follows the DevCentral iRules Style Guide (4-space indents, a priority on the event, braced expressions, braced variable names, `--` on `switch` and `class`), and it passes this site's style checker with no findings.

## Share results

Under the verdict on the test value, **Share results** builds a link to this page, only when you press it, that carries the whole decision by name: `#subject=` (and `&header=` for a header), `&lower=1` or `0`, the rules in order as one Tcl list of `{comparison value pool}` lists (`&rules={starts_with /api api_pool} {equals /login login_pool}`, percent-encoded in the link), and the default pool, the data group name and the test value (`&default=`, `&group=`, `&test=`) when they are set. Pool, data group and header names are yours; the popover's standard warning applies to them. Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; even 50 rules stay well within it.
- **Opening a link.** The link's decision replaces the whole form, including the Example the page opens on (a field the link does not carry is emptied; a decision on a header with no name given uses `User-Agent`, the page's own), and the three forms are generated. An unknown request value or comparison, a rules value that is not a list of three-element lists, more than 50 rules or a value longer than the page allows makes the whole link ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Sources

- [F5 iRules reference: class](https://clouddocs.f5.com/api/irules/class.html) (read 2026-10-02)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (read 2026-10-02)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
- [F5 DevCentral: iRules Style Guide](https://community.f5.com/t/irules-style-guide/71151) (read 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (read 2026-10-03)
- [F5 iRules reference: HTTP::path](https://clouddocs.f5.com/api/irules/HTTP__path.html) (read 2026-10-03)
- [Tcl 8.4 manual: Tcl (the substitution rules)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (read 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
