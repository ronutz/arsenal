## What it does

Paste an iRule; the linter flags a small set of high-confidence, F5-documented performance and correctness anti-patterns, line by line, each with a severity, the offending token, why it matters, and the fix. It is a static scanner (no Tcl parser, no execution), so it deliberately covers only patterns a line scan can catch reliably and with few false positives. It is not a substitute for measurement: pair it with the iRules Runtime Calculator, which reads real timing statistics, for the actual cost of a rule. Everything runs locally.

## What it flags

**Global-namespace variables** (`$::x`, `set ::x`, the `global` keyword) are flagged HIGH. F5's validator catches the `global` keyword as of v10 and demotes the virtual server to a single TMM instance (CMP demotion), so one processor handles all of that virtual's connections; global variables have been deprecated since v10. The obsolete `$::datagroup` form is worse still: on version 11 and later, accessing a data group that way raises a TCL runtime error and sends a reset to the client. The fix is the CMP-safe `static::` namespace for shared constants, ordinary local variables for per-connection data, or the `class` command for data groups.

**`expr` without braces** is a WARNING. Tcl substitutes and re-parses the unbraced form, and can double-substitute; bracing the expression lets the bytecode compiler optimise it. The fix is `expr { ... }`.

**`matchclass` / `findclass`** are INFO. Both were deprecated in v10 in favor of the `class` command, which F5 describes as offering better functionality and performance. The fix is `class match` / `class search`.

**`regexp` / `regsub`** are INFO. Regular expressions cost materially more than fixed string work; when the match is a prefix, suffix, exact value, or simple glob, `string`, `scan`, `switch -glob`, or `class` are cheaper. When a regular expression stays, the [Regex Toolkit](/tools/regex)'s portability view lists the constructs that read differently in Tcl's Advanced Regular Expressions, the flavour it labels BIG-IP iRules, than in JavaScript or PCRE2.

## What it deliberately does not flag

`static::` variables (CMP-safe), `class match` / `class search`, and braced `expr` are correct and pass clean. Persistence, tables, and the `session` command are CMP-compatible on modern versions, so they are not treated as CMP problems. Full-line comments are skipped.

## Share results

Under the summary of findings, **Share results** builds a link to this page, only when you press it, that carries the iRule as pasted after the `#`, and nothing else. Before you copy anything, the popover adds a caution: an iRule can name internal hosts, pools and data groups.

Before it offers a link at all, the page reads the iRule for keys and credentials written out where F5's own references put them (all read 2026-10-27):

- the pass phrase of `HTTP::cookie encrypt` and `decrypt` ([HTTP::cookie](https://clouddocs.f5.com/api/irules/HTTP__cookie.html));
- a key in the `AES 128 <hex>` string form, or the key of `AES::encrypt` and `AES::decrypt` written out ([AES::key](https://clouddocs.f5.com/api/irules/AES__key.html), [AES::encrypt](https://clouddocs.f5.com/api/irules/AES__encrypt.html));
- the value of `-key` or `-keyhex` on `CRYPTO::encrypt`, `decrypt`, `sign` and `verify` ([CRYPTO::encrypt](https://clouddocs.f5.com/api/irules/CRYPTO__encrypt.html));
- an `Authorization` or `Proxy-Authorization` header written with `HTTP::header insert` or `replace` ([HTTP::header](https://clouddocs.f5.com/api/irules/HTTP__header.html)), whose value [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) (sections 11.6.2 and 11.7.2) defines as the credentials;
- a literal given with `set` to a variable used in one of those places, as in `CRYPTO::encrypt`'s own example;
- and, from the site's secrets check, a PEM private key, a JWT, an AWS access key ID or a password in a URL.

When the page finds one, there is no link: the popover names the line, and you replace the value with a placeholder and press again. A value whose name only looks like a secret (`set static::api_token "..."`) does not stop the link; the caution line names it instead. No check finds every secret, so read what you send.

Everything the link carries goes after the `#`, which [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) (section 3.5, read 2026-10-27) has "separated from the rest of the URI prior to a dereference": a browser does not send it to the server when the link is opened, but it stays in the address bar and history of whoever opens it, and anyone who has the link can read it.

- **How long.** At most 16,384 characters, the bound the site uses for every value after the `#`; a longer iRule gets no link, and the popover says how long it is.
- **Opening a link.** The text fills the box as a paste would, and the page reads it as it reads a paste; the iRule is never run. Accepted or not, the values then leave the page's own address at once, without a request, so a reload, a bookmark or the page's own Share button carries nothing you did not choose to share.
