## What it does

Reads an iRule against the DevCentral "iRules Style Guide" (published by JRahm with Jim_Deucker on 2022-12-22), adds two points raised in the guide's comment thread, and runs a real Tcl 8.4 parse over it. The rule is parsed, never executed. Each finding names the rule it comes from, the line, and what to change; flagged lines are marked on a numbered copy of the rule.

## What it checks

- **Editor settings (E1 to E3):** tabs and indents that are not multiples of 4 spaces, lines over 100 columns (a warning past 120), Windows line endings, trailing white space, a missing final line feed, and non-ASCII characters, each named with its code point, its official Unicode name and its column.
- **Numbered rules:** characters that break code (R1), F5's size limit (R2), a lone `{` on its own line or `else` on a new line (R4), end-of-line comments, comments without a space and comments between `switch` patterns (R6), several commands on one line (R7), single-line `if` (R8), state stored as words such as `yes` (R9), F5's `and` / `or` / `not` (R10), `}{` with no space or a keyword glued to its brace (R11), unbraced expressions (R12), variables in expressions without spaces around them (R13) or without braces around the name (R14), `switch` and `table` without `--` (R15), events without a priority (R16), `table` entries without a timeout or lifetime (R17; F5's `table` reference otherwise applies a 180-second timeout and an indefinite lifetime), unprefixed `static::` names (R18), `static::` debug flags (R19), and commented-out code (R20).
- **From the comment thread (D1, D2):** `==` or `!=` with a piece of text, where `eq` or `ne` is meant (D1); `break` or `continue` with no loop around it, `break` in a `switch` arm inside a loop, and `return` in a `switch` arm (D2).
- **Syntax:** an error the Tcl 8.4 parser reports, such as `}{` with no space ("extra characters after close-brace"), means the iRule cannot load at all.

## Characters that hide in code

The guide's first rule is about smart quotes and no-break spaces that a word processor slips in. The checker classifies every non-ASCII character with the Unicode Character Database 18.0.0, so it finds the whole family, not just those two:

- **R1, error:** invisible characters (Unicode's Default_Ignorable_Code_Point list: zero-width spaces and joiners, the byte order mark, the soft hyphen, bidirectional controls), spaces that are not the ASCII space (no-break, em, ideographic and others), and typographic quotes. Tested in tclsh 8.4.6: a no-break space glues two words into one command name, curly quotes do not group words, and a zero-width space after a closing brace stops the rule with "extra characters after close-brace".
- **E3, warning:** dashes that are not the ASCII hyphen-minus. Tcl reads them neither as an option dash nor as a minus sign: a `switch` with an en dash (U+2013) typed where `--` belongs takes the dash as the value, and silently matches nothing.
- **E3, note:** other characters that look like ASCII (fullwidth letters, the ellipsis, Roman numerals), and any other non-ASCII character.

This matters for the guide itself: as published on 2026-10-03, its `RULE_INIT` example has a zero-width space after the closing brace and its debug example has a line holding only one, so copying either verbatim breaks the iRule.

## The size limit

F5 K9204 sets the limit at 65,520 characters; BIG-IP refuses to save or load a longer iRule, with an error that reads "Max string size exceeded" and "max:65520". The guide rounds this to 64 KB. The checker counts characters and the bytes they take as UTF-8, and reports R2 when either passes 65,520.

## From the comment thread

- **D1:** Kai Wilke pointed out that the guide's rule 10 example compares text with `==`, and the authors agreed to add an `eq` / `ne` point. `==` compares as numbers whenever both sides look like numbers: in Tcl 8.4.6, `10 == 012` and `1 == "0x0000001"` are both true. F5's How To Write Fast Rules asks for numbers compared to numbers and strings to strings.
- **D2:** Juergen Mang noted that `switch` arms need no `return` or `break` to stop. A `switch` arm never runs into the next one, `return` leaves the whole event (F5's `return` page), and `break` with no loop around it is an error in Tcl 8.4.6 (checked in a proc body). F5 does not document what TMM does with it in an event body.

## Share results

Under the verdict, **Share results** builds a link to this page, only when you press it, that carries the iRule as pasted after the `#`, and nothing else. Before you copy anything, the popover adds a caution: an iRule can name internal hosts, pools and data groups.

Before it offers a link at all, the page reads the iRule for keys and credentials written out where F5's own references put them (all read 2026-10-27):

- the pass phrase of `HTTP::cookie encrypt` and `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- a key in the `AES 128 <hex>` string form, or the key of `AES::encrypt` and `AES::decrypt` written out ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- the value of `-key` or `-keyhex` on `CRYPTO::encrypt`, `decrypt`, `sign` and `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- an `Authorization` or `Proxy-Authorization` header written with `HTTP::header insert` or `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), whose value [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 and 11.7.2) defines as the credentials;
- a literal given with `set` to a variable used in one of those places, as in `CRYPTO::encrypt`'s own example;
- and, from the site's secrets check, a PEM private key, a JWT, an AWS access key ID or a password in a URL.

When the page finds one, there is no link: the popover names the line, and you replace the value with a placeholder and press again. A value whose name only looks like a secret (`set static::api_token "..."`) does not stop the link; the caution line names it instead. No check finds every secret, so read what you send.

Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters, the bound the site uses for every value after the `#`; a longer iRule gets no link, and the popover says how long it is. F5 allows an iRule of up to 65,520 characters (K9204), so a long one can pass this checker and still be too long for a link.
- **Opening a link.** The text fills the box as a paste would, and the page reads it as it reads a paste; the iRule is never run. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.

## Limits

- Array variables such as `$static::pools($key)` are valid Tcl but the site's Tcl engine does not model them. The checker reads each one as a plain variable, keeps checking the rest of the rule, and says so in a note.
- Some rules cannot be judged from text alone. Whether a line starting with `#` is commented-out code or a comment missing its space is a guess based on the first word, so those findings are notes.
- Rule R3 (break the iRule into functional blocks) is a design choice the checker does not judge. R5 (the 4-space indent carried into nested values such as `switch` arms) is covered by the indentation check. The editor setting about avoiding line continuations is not checked.

## Sources

- [F5 DevCentral: iRules Style Guide, with its comment thread](https://community.f5.com/t/irules-style-guide/71151) (read 2026-10-03)
- [F5 K9204: iRules are limited to 65,520 characters](https://my.f5.com/manage/s/article/K9204) (read 2026-10-03)
- [F5 K15650046: Tcl code injection security exposure](https://my.f5.com/manage/s/article/K15650046) (read 2026-10-03)
- [F5 K57410758: use curly braces to avoid double substitution](https://my.f5.com/manage/s/article/K57410758) (read 2026-10-03)
- [F5 iRules reference: How To Write Fast Rules](https://clouddocs.f5.com/api/irules/HowToWriteFastRules.html) (read 2026-10-03)
- [F5 iRules reference: return](https://clouddocs.f5.com/api/irules/return.html) (read 2026-10-03)
- [F5 iRules reference: priority](https://clouddocs.f5.com/api/irules/priority.html) (read 2026-10-03)
- [F5 iRules reference: table](https://clouddocs.f5.com/api/irules/table.html) (read 2026-10-03)
- [Tcl 8.4 manual: switch](https://www.tcl-lang.org/man/tcl8.4/TclCmd/switch.htm) (read 2026-10-03)
- [Tcl 8.4 manual: break](https://www.tcl-lang.org/man/tcl8.4/TclCmd/break.htm) (read 2026-10-03)
- [Unicode Character Database 18.0.0: PropList.txt](https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt) (read 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedCoreProperties.txt](https://www.unicode.org/Public/UCD/latest/ucd/DerivedCoreProperties.txt) (read 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt) (read 2026-10-03)
- [RFC 3986, Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-27): section 3.5, the fragment, which carries a Share results link's values
- [F5 iRules reference: HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html), [AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html), [CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html) and [HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html) (read 2026-10-27): where an iRule holds a pass phrase, a key or credentials, which stop a Share results link
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (read 2026-10-27): sections 11.6.2 and 11.7.2, the Authorization and Proxy-Authorization values are credentials
