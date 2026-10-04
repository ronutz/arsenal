## What it does

ASCII has 128 codes, 0 to 127, and most people only ever need one of them at a time: the code of a character, the character behind a code, or the way to write it in a config file, a JSON string or an iRule. The explorer answers those questions for every code, and says plainly when the thing you are holding is not ASCII at all.

It has four parts:

- **Look up** reads a code in any notation and shows everything about it: the numbers, the bits, the names, what the code was defined for in 1968 and what Linux does with it today, how to write it in seven places, and which languages count it as white space.
- **The table** lays the 128 codes out the way RFC 20 draws them, eight columns by sixteen rows, or as a list. Pick any code to see it in the look-up.
- **Text to codes** takes a pasted text and shows the code of every character, listing anything outside ASCII by name, with the reason it may cause trouble.
- **White space, compared** sets the ten codes that might be white space against seven definitions that disagree about them.

## What the look-up box reads

| You type | Read as |
|---|---|
| `A` | the character itself (a quoted `'A'` works too) |
| `65` | decimal |
| `0x41`, `41h`, `x41` | hexadecimal |
| `0o101` | octal |
| `1000001`, `00100101` | seven or eight binary digits, read as bits |
| `0b1000001` | binary with its prefix |
| `4/1` | RFC 20 column/row: column 4, row 1 |
| `U+0041` | Unicode notation |
| `&#65;`, `&#x41;`, `&excl;` | HTML numeric and named references |
| `%41` | percent-encoding |
| `\x41`, `\101`, `\n`, `A`, `\u{1F600}` | backslash escapes |
| `^A`, `^[`, `^?` | caret notation |
| `NUL`, `LF`, `line feed`, `Reverse Slant` | abbreviations and names, from RFC 20, Unicode 1.0 and current Unicode |
| `en dash`, `minus sign` | any Unicode name or alias (matched loosely: case, spaces, underscores and medial hyphens are ignored, as UAX #44 rule UAX44-LM2 says) |

Seven or eight binary digits on their own are read as bits, because that is what a string of 0s and 1s that long almost always is. A longer decimal number, such as `1000`, is read as decimal and lands outside ASCII.

## Reading a code

- **Numbers.** Decimal, hexadecimal, octal, seven bits and the full byte. The byte's top bit is 0: RFC 20 put 7-bit ASCII "in an 8 bit byte whose high order bit is always 0".
- **Column/row.** RFC 20 names each position by column and row: `K` is `4/11`. The column is bits b7 b6 b5 and the row is b4 b3 b2 b1, so 4/11 is 100 1011.
- **Flip a bit.** Each of the seven bits is a button that flips it and jumps to the result. Two of them explain most of the table: b6 (32) is the only difference between upper and lower case, and b7 (64) separates a control from the character it is paired with in caret notation (`A` and `^A`, `[` and `^[`, which is ESC).
- **Names.** The current Unicode name, the Unicode 1.0 name when it differs (`BACKSLASH`, `SPACING UNDERSCORE`), RFC 20's name (`Reverse Slant`, `Underline`, `Overline`) and its alternatives. Controls have no Unicode name at all: Unicode's Name property is empty for them, and they are named by formal aliases taken from ISO 6429 (`LINE FEED`, `NEW LINE`, `END OF LINE`, abbreviated `LF`, `NL`, `EOL`). RFC 20's table calls code 25 `EM`; Unicode's first abbreviation for it is `EOM`.
- **Category and class.** The General_Category from the Unicode Character Database, and RFC 20's class for the controls: communication control (CC), format effector (FE) or information separator (IS).
- **Notes.** RFC 20's note 3 marks eleven positions (`#` `@` `[` `\` `]` `^` `` ` `` `{` `|` `}` `~`) that should not be used in international interchange without first agreeing on them; note 4 lets the pound sterling sign take the place of `#`.
- **What it was for, and what it does today.** For every control, a summary of RFC 20's definition, and, where Linux gives it a job, that job: Ctrl-C (ETX) interrupts, Ctrl-D (EOT) ends input, Ctrl-S and Ctrl-Q (DC3, DC1) stop and restart output, Ctrl-Z (SUB) suspends, and ESC starts an escape sequence at the Linux console. Those come from the Linux manual pages termios(3) and console_codes(4).
- **How to write it.** The form for a string literal in C, JSON, JavaScript, Python and Tcl (iRules), the HTML references, and the URL form with its RFC 3986 class. A short note follows where a language has a trap (below).
- **White space?** Yes or no for each of seven definitions.
- **Relations.** Caret notation, the other case, a digit's value, and the ASCII characters UTS #39 counts as confusable with it (`1`, `I`, `l` and `|` share one prototype; `0` and `O` share another).

## The traps the escapes avoid

- **C hexadecimal escapes do not stop after two digits.** `"\x1Bfoo"` keeps reading hex digits, so the tool writes C controls in octal (`\033`), which stops at three digits.
- **Tcl 8.4, and therefore iRules, keeps only the last two hex digits of `\x`.** `"\x1Bfoo"` reads `\x1Bf` and keeps `Bf`: the result is the byte 0xBF followed by `oo`, not ESC and `foo`. The tool writes Tcl controls in octal too. This was run in Tcl 8.4.6.
- **JSON must escape the quotation mark, the reverse solidus and the controls 0 to 31**, and may leave DEL as it is (RFC 8259, section 7).
- **JavaScript's `\0` means NUL only when no digit follows.**
- **HTML turns `&#0;` into U+FFFD**, the replacement character, and treats references to most controls as parse errors (the WHATWG parser).

## When it is not ASCII

A value above 127 is named, with the number of UTF-8 bytes it needs and what kind of trouble it can cause: invisible, a space that is not the ASCII space, a typographic quote, a dash that is not the hyphen-minus, or a character whose compatibility form is ASCII. When UTS #39 lists it as confusable with ASCII text, the tool says which, and offers the ASCII character you probably meant.

Two cases are common enough to be presets. `&minus;` is U+2212 MINUS SIGN and `&tilde;` is U+02DC SMALL TILDE: neither is ASCII, and the ASCII hyphen-minus (45) and tilde (126) have no named reference at all. Write `&#45;` and `&#126;`, or the characters themselves. Some published ASCII tables list `&minus;` and `&tilde;` against 45 and 126; the WHATWG list of named references does not.

For every property of a code point outside ASCII, the result links to the [Unicode inspector](/tools/unicode-inspector).

## The text box

Paste a line from a configuration, an iRule or an email. Each character appears as a cell with its code (hexadecimal for ASCII, the code point for anything else), and everything outside ASCII is listed with its position, UTF-8 bytes, name and the reason it may cause trouble. Up to 2,000 characters are read.

## How it was checked

Every escape, reference and white-space answer for all 128 codes was run in the real implementations on 2026-10-03, and all agree with the tool: string literals in CPython 3.11, Node 22, GCC (C11) and Tcl 8.4.6; HTML references (decimal, hexadecimal and named) in Chromium; white space with C's `isspace()`, Python's `str.isspace()`, JavaScript's `\s` and `trim()`, a strict JSON parser, Tcl 8.4.6's command parser and the DOM's own splitting on ASCII whitespace. Every cell of RFC 20's code table was compared with the tool's data. The Unicode names were checked against the Unicode 18.0.0 data file for every one of the 1,114,112 code points.

## Limits

- ASCII here is the 7-bit code. Codes 128 to 255 belong to whichever 8-bit character set a system uses (Latin-1, Windows-1252, a DOS code page); the explorer does not guess which.
- The terminal behaviour is Linux's, from its manual pages. Other systems may assign the control keys differently.
- The look-up box reads one value at a time. For text, use the text box or the [Unicode inspector](/tools/unicode-inspector).

## Sources

- [RFC 20: ASCII format for Network Interchange (1969), reproducing USAS X3.4-1968](https://www.rfc-editor.org/rfc/rfc20) (read 2026-10-03)
- [Unicode Character Database 18.0.0: UnicodeData.txt](https://www.unicode.org/Public/18.0.0/ucd/UnicodeData.txt) (read 2026-10-03)
- [Unicode Character Database 18.0.0: NameAliases.txt](https://www.unicode.org/Public/18.0.0/ucd/NameAliases.txt) (read 2026-10-03)
- [Unicode Character Database 18.0.0: DerivedName.txt](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedName.txt) (read 2026-10-03)
- [The Unicode Standard 18.0.0, chapter 4: Character Properties (the Name property)](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/) (read 2026-10-03)
- [UAX #44: Unicode Character Database (UAX44-LM2, General_Category values)](https://www.unicode.org/reports/tr44/) (read 2026-10-03)
- [UTS #39: Unicode Security Mechanisms, confusables.txt 18.0.0](https://www.unicode.org/Public/18.0.0/security/confusables.txt) (read 2026-10-03)
- [WHATWG HTML: named character references (entities.json)](https://html.spec.whatwg.org/entities.json) (read 2026-10-03)
- [WHATWG HTML: parsing (numeric character reference end state)](https://html.spec.whatwg.org/multipage/parsing.html) (read 2026-10-03)
- [WHATWG Infra: ASCII whitespace](https://infra.spec.whatwg.org/) (read 2026-10-03)
- [ISO/IEC 9899:2011 committee draft N1570 (C11)](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (read 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (read 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (read 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (read 2026-10-03)
- [Tcl 8.4 manual: Tcl (backslash substitution)](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (read 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-03)
- [RFC 5234: ABNF (core rules)](https://www.rfc-editor.org/rfc/rfc5234) (read 2026-10-03)
- [RFC 5321: SMTP (lines end with CR LF)](https://www.rfc-editor.org/rfc/rfc5321) (read 2026-10-03)
- [RFC 9112: HTTP/1.1 (message format)](https://www.rfc-editor.org/rfc/rfc9112) (read 2026-10-03)
- [POSIX.1-2024: Definitions (line, newline)](https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap03.html) (read 2026-10-03)
- [Linux manual page termios(3)](https://man7.org/linux/man-pages/man3/termios.3.html) (read 2026-10-03)
- [Linux manual page console_codes(4)](https://man7.org/linux/man-pages/man4/console_codes.4.html) (read 2026-10-03)
