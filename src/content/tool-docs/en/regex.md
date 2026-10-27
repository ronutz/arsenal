## What it does

Test, explain, and debug a regular expression. Enter a pattern and some text and the tool shows every match with its capture groups live as you type; enter a pattern on its own and it breaks the pattern into annotated pieces so you can read what each part does; and throughout, it warns when a pattern is at risk of catastrophic backtracking. It uses the JavaScript (ECMAScript) regex engine and runs entirely in your browser.

## Four jobs in one

The tool does the four things you actually want from a regex workbench:

- **Test.** It compiles your pattern and flags, reports any syntax error in plain terms, and runs the pattern against your input, returning every match along with its numbered and named capture groups. The number of matches it collects is capped, so a pattern that matches a huge input cannot lock up the page.
- **Explain.** It parses the pattern into annotated tokens, labelling each quantifier, character class, group, and assertion, so you can understand a regex without running it in your head.
- **Check for ReDoS.** It looks for the structures that cause catastrophic backtracking and warns you about them.
- **Compare flavours.** It lists every construct in the pattern whose support or meaning differs between ECMAScript, PCRE2 (NGINX) and Tcl Advanced Regular Expressions (BIG-IP iRules), statically, without running the pattern anywhere but here. The Flavours section below explains it.

## What ReDoS is, and why it matters here

Regular expression Denial of Service (ReDoS) happens when a pattern can backtrack an exponential number of ways on certain inputs, so a short string makes the engine run effectively forever. The classic shape is a quantifier applied to a group that itself contains a quantifier, like `(a+)+`, matched against input that ultimately fails. This matters directly in the browser: a synchronous regex match cannot be interrupted, so a catastrophic pattern would hang the page. That is why the tool both caps its work and flags risky patterns, and it is a real warning to heed before shipping a pattern that will run on untrusted input. The [lab in the backtracking article](/learn/regex-catastrophic-backtracking#lab-regex-partitions) counts the ways `(a+)+` can split a run of a's.

## The engine and its flavour

Regex syntax varies between languages, and this tool uses the JavaScript flavour defined by the ECMAScript specification, with its flags (global, ignore-case, multiline, dotall, unicode, and sticky) and its support for named groups and lookarounds. If you are writing regex for JavaScript, or for anything that shares its semantics, what you see here is what you will get. For any other engine, see Flavours below.

## Flavours

The tester runs one engine, ECMAScript, but the patterns network and security engineers write rarely stay in JavaScript. An NGINX `location ~` block, a BIG-IP iRule and a web application firewall (WAF) signature each hand the pattern to a different engine, and the same characters can mean different things there. The **Portability** section reads your pattern's tokens and lists every construct whose support or meaning differs between three flavours:

- **ECMAScript**, as the 2026 edition of ECMA-262 defines it (the 17th edition; its RegExp grammar is unchanged in the 2027 draft), together with the browser annex that, for example, makes `\A` the plain letter A when neither the `u` nor the `v` flag is set.
- **PCRE2**, as its own manual describes it. NGINX needs the PCRE library for regular expressions in `location` and in the rewrite module, its `map` and `server_name` directives take regular expressions too, and since 1.21.5 it uses PCRE2 unless it is built with `--without-pcre2`, which selects the original PCRE library.
- **Tcl Advanced Regular Expressions (AREs)**, as the Tcl 8.4 `re_syntax` manual describes them. F5 states that the BIG-IP iRules command set was developed from Tcl base version 8.4.6 (K6091), and `regexp` and `regsub` are not on its list of disabled Tcl commands (K36322151). The Tcl 8.6 and 9.0 manuals add neither lookbehind nor named groups, and their `\w` also takes the connector punctuation characters.

Each construct gets one answer per flavour: **same** (supported with the meaning the row's title gives), **differs** (supported with another meaning or syntax, and the row says how) or **not supported** (an error, or read as something else, and the row says which). The section appears even when your browser cannot compile the pattern, because pasting an NGINX or iRules pattern is the point.

Where these patterns live, other tools read them: the [NGINX location matcher](/tools/nginx-location-matcher) shows which `location` block a URI selects, the [iRules performance linter](/tools/f5-irules-performance-linter) flags `regexp` and `regsub` where a string command would do, and the [Expect script explainer](/tools/expect-script-explainer) reads the patterns of an Expect script, whose `-re` patterns "follow the syntax defined by Tcl's regexp" command (expect(1), Expect 5.45.4), so the Tcl column applies to them too.

| Construct | ECMAScript | PCRE2 | Tcl ARE |
|---|---|---|---|
| Lookbehind, fixed length: `(?<=ab)`, `(?<=colour\|color)` | same | same: each top-level branch fixed, up to 65,535 characters | not supported: lookahead only |
| Lookbehind, variable with a maximum: `(?<=colou?r)` | same | differs: from 10.43, each branch up to a limit the caller sets, 255 by default; not supported above it or before 10.43 | not supported |
| Lookbehind with no maximum: `(?<=\d+)` | same | not supported | not supported |
| Lookahead holding a group or a backreference | same | same | differs: parentheses inside never capture; a backreference is not supported |
| Named group `(?<name>...)` | same, the only spelling | same; outside UTF mode the name must be ASCII | not supported |
| Named group `(?P<name>...)` or `(?'name'...)` | not supported | same | not supported |
| Named backreference `\k<name>` | same | same | not supported |
| `\k'name'`, `\k{name}`, `\g{name}`, `\g1`, `\g{-1}`, `(?P=name)` | not supported | same | not supported |
| Scoped modifiers `(?i:...)`, `(?i-s:...)` | same from ECMAScript 2025, letters i, m and s only | same | not supported |
| Bare options `(?i)`, `(?im)` | not supported | same | only at the very start; i and x mean the same, m is newline-sensitive matching and s the default mode |
| Possessive quantifiers `a++`, `a*+` | not supported | same | not supported |
| Atomic group `(?>...)` | not supported | same | not supported |
| `\A` | not supported | same | same |
| `\Z` | not supported | same: end, or before a final newline | differs: the very end only |
| `\z` | not supported | same | not supported |
| `$` | same: end; with `m`, before line terminators | differs: also before a final newline unless PCRE2_DOLLAR_ENDONLY is set | same: end; with `-line`, before each newline |
| `.` | same: not LF, CR, U+2028 or U+2029 unless `s` | differs: not the newline convention's characters, LF alone by default | differs: matches newline unless matching is newline-sensitive |
| POSIX class `[[:alpha:]]` | not supported | same: ASCII unless PCRE2_UCP; also `ascii`, `word` and `[:^name:]` | differs: Unicode locale; twelve names, no negation |
| `[[:<:]]`, `[[:>:]]` | not supported | same, converted to a word boundary | same, deprecated |
| `\Q...\E` | not supported | same | not supported; `***=` makes a whole expression literal |
| `\p{L}`, `\P{L}` | differs with `u` or `v` (stricter names); not supported without | same: loose names, bare script names | not supported |
| `\pL` | not supported | same | not supported |
| Lazy quantifiers `*?`, `+?`, `??`, `{n,m}?` | same | same | differs: longest or shortest preference rules |
| `\b` | same: ASCII word characters | same: ASCII unless PCRE2_UCP | differs: backspace; the boundary is `\y` |
| `\B` | same | same | differs: a backslash; the non-boundary is `\Y` |
| `\w`, `\W` | same: ASCII | same: ASCII unless PCRE2_UCP | differs: Unicode locale |
| `\D`, `\S` or `\W` inside brackets | same | same | not supported |
| `\m`, `\M`, `\y`, `\Y` | not supported: plain letters in a browser without `u` or `v` | not supported: an error | same: word constraints |
| `{,n}` | not supported: literal text without `u` or `v` | same from 10.43 | not supported: literal text |

### Web application firewall signatures

F5's signature syntax for BIG-IP ASM attack and bot signatures (a manual that applies to BIG-IP ASM 14.1.0 to 21.0.0) names three regular-expression rule options. The `pcre` option is based on PCRE syntax, but which PCRE library and version it uses is not stated by F5. The `re2` option takes the open-source RE2 syntax, which F5 recommends for performance, and this view does not compare RE2. The `ipp` option, for bot signatures only, uses an Intel-based engine whose syntax is not stated by F5. So the PCRE2 column is the nearest guide for the `pcre` option, and no more than that.

### What the view does not check

It is a static comparison of syntax, not a second engine: it never runs your pattern in PCRE2 or Tcl. It does not check engine limits (quantifier bounds, pattern size, the lookbehind limit beyond its default of 255), performance or backtracking behaviour, options a product sets for you (NGINX's case-insensitive `~*`, a signature's modifiers, PCRE2's UTF or UCP mode, Tcl's `-line` switch), or constructs outside its list, such as subroutine calls, conditionals, comments, `\K`, `\G`, `\R`, `\X` and hexadecimal or octal escapes. A pattern with no rows is not proven portable; it only uses nothing from the list.

## Using it

Enter a pattern and flags, and optionally some text to match against, and read the live matches, the token-by-token explanation, the portability rows and any backtracking warning. **Portability example** loads a pattern that every flavour reads differently. Everything is computed locally.

## Sources

- [ECMA-262, ECMAScript 2026 Language Specification (17th edition), 22.2.1 Patterns](https://tc39.es/ecma262/2026/#sec-patterns), [22.2.2 Pattern Semantics](https://tc39.es/ecma262/2026/#sec-pattern-semantics), [Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/#sec-regular-expressions-patterns) and the [Introduction](https://tc39.es/ecma262/2026/#sec-intro) (ECMAScript 2025 added inline modifiers) (read 2026-10-26)
- [ECMA-262 draft, 22.2 RegExp Objects](https://tc39.es/ecma262/multipage/text-processing.html): the 2027 draft's pattern grammar matches the 2026 edition (read 2026-10-26)
- [PCRE2 manual: pcre2pattern](https://www.pcre2.org/doc/pcre2pattern/), [pcre2syntax](https://www.pcre2.org/doc/pcre2syntax/), [pcre2api](https://www.pcre2.org/doc/pcre2api/) and [pcre2build](https://www.pcre2.org/doc/pcre2build/) (10.50-DEV manual; read 2026-10-26)
- [Tcl 8.4 manual: re_syntax](https://www.tcl-lang.org/man/tcl8.4/TclCmd/re_syntax.htm) and [regexp](https://www.tcl-lang.org/man/tcl8.4/TclCmd/regexp.htm); [Tcl 8.6.18: re_syntax](https://www.tcl-lang.org/man/tcl8.6/TclCmd/re_syntax.htm); [Tcl 9.0.4: re_syntax](https://www.tcl-lang.org/man/tcl9.0/TclCmd/re_syntax.html) (read 2026-10-26)
- [F5 K6091: The version of Tcl used to develop iRules](https://my.f5.com/manage/s/article/K6091) and [K36322151: List of disabled Tcl commands for iRules (12.x - 17.x)](https://my.f5.com/manage/s/article/K36322151) (read 2026-10-26)
- [F5 BIG-IP ASM: Attack and Bot Signatures, Signature Syntax](https://techdocs.f5.com/en-us/bigip-14-1-0/big-ip-asm-attack-and-bot-signatures-14-1-0/signature-syntax.html) (applies to BIG-IP ASM 14.1.0 to 21.0.0; read 2026-10-26)
- nginx: [location](https://nginx.org/en/docs/http/ngx_http_core_module.html#location), [map](https://nginx.org/en/docs/http/ngx_http_map_module.html#map), [Building nginx from Sources](https://nginx.org/en/docs/configure.html) and [Regular expression captures](https://nginx.org/en/docs/regex_captures.html) (read 2026-10-26)
- [expect(1), Expect 5.45.4 manual source](https://core.tcl-lang.org/expect/raw?name=expect.man&ci=expect-5-45-4) (read 2026-10-27): regexp-style patterns follow the syntax defined by Tcl's regexp command
