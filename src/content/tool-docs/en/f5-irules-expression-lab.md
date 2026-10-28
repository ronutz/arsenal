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

## Share results

Under the result, **Share results** builds a link to this page, only when you press it, that carries what the evaluation reads, by name: the expression as `#input=`, the set commands as `&setup=`, `&mode=irules` in iRules mode, and in that mode the sample `HTTP::uri` and `HTTP::host` where you changed them (`&uri=`, `&host=`). Plain Tcl is the default and is not carried, nor is a sample that plain Tcl does not read. The set commands are where values copied from an iRule land, so the page reads every field the link would carry with the same secrets check as the iRule readers on this site.

Before it offers a link at all, it looks for keys and credentials written out where F5's own references put them (all read 2026-10-27):

- the pass phrase of `HTTP::cookie encrypt` and `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- a key in the `AES 128 <hex>` string form, or the key of `AES::encrypt` and `AES::decrypt` written out ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- the value of `-key` or `-keyhex` on `CRYPTO::encrypt`, `decrypt`, `sign` and `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- an `Authorization` or `Proxy-Authorization` header written with `HTTP::header insert` or `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), whose value [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 and 11.7.2) defines as the credentials;
- a literal given with `set` to a variable used in one of those places, as in `CRYPTO::encrypt`'s own example;
- and, from the site's secrets check, a PEM private key, a JWT, an AWS access key ID or a password in a URL.

When the page finds one, there is no link: the popover names the field and the line, and you replace the value with a placeholder and press again. A value whose name only looks like a secret (`set static::api_token "..."`) does not stop the link; the caution line names it instead. No check finds every secret, so read what you send.

Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** A link carries at most 16,384 characters, the bound the site uses for every value after the `#`; a longer set of fields gets no link, and the popover says how long it is.
- **Opening a link.** The fields fill as typing would (a sample request the link changed is shown open), and the page holds them: a note says they came from a shared link, and nothing is evaluated until you press **Evaluate** or change a field. The teaching interpreter never runs a link's text by itself. A mode other than `tcl` or `irules`, or a sample value in plain Tcl mode, makes the whole link ignored. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Limits

F5 documents its word operators but not their precedence relative to the Tcl operators; the tool places `contains`, `starts_with` and the others with `==`, and `and` and `or` with `&&` and `||`. `rand()` and `srand()` are refused because their results cannot be reproduced. Commands run inside an expression (in brackets) use the same small interpreter as the script stepper, bounded to 2,000 commands. This tool is not offered over the API, because it executes the Tcl you give it.

## Sources

- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) (read 2026-10-03)
- [Tcl 8.4 manual: expr](https://www.tcl-lang.org/man/tcl8.4/TclCmd/expr.htm) (read 2026-10-03)
- [F5 iRules reference: Operators](https://clouddocs.f5.com/api/irules/Operators.html) (read 2026-10-02)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) and [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (read 2026-10-27): where an iRule holds a pass phrase, a key or credentials, which stop a Share results link
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (read 2026-10-27): sections 11.6.2 and 11.7.2, the Authorization and Proxy-Authorization values are credentials
