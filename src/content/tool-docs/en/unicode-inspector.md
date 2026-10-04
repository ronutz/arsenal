## What it does

Text can hold far more than it shows. A zero-width space sits between two letters without a trace, a right-to-left override makes a line of code display in a different order from the one the compiler reads, a Cyrillic "а" passes for a Latin "a", and a line separator starts a new line in your editor but not in your parser. The inspector shows what is really there, one code point at a time.

It has three modes:

- **Inspect a text** counts the text, says whether anything needs a look, lists what it found by kind, flags bidirectional controls left open at the end of a line and words that mix scripts, draws the text in the order it is stored with every hidden character as a tag, lists every code point, offers a cleaned copy, and writes the text as escapes in eight languages.
- **One code point** takes a code point in any notation (`U+00E9`, `é`, `0xE9`, `&eacute;`, `é`, `zero width space`, `BOM`) and shows its name and aliases, properties, encodings, escapes and what to know about it.
- **Find by name** lists the code points whose name or alias has words starting with the words you type.

## What it reports in a text

| Finding | What it is | Why it matters |
|---|---|---|
| Bidirectional control | One of the twelve Bidi_Control characters (LRM, RLM, ALM, LRE, RLE, LRO, RLO, PDF, LRI, RLI, FSI, PDI) | Changes the displayed order of the text around it; the Trojan Source class of attack (CVE-2021-42574) |
| Left open at end of line | An embedding, override or isolate with no PDF or PDI before the line ends | Everything after it on that line can be displayed in a different order from the order it is read |
| Invisible | Default_Ignorable_Code_Point: zero-width characters, the BOM, variation selectors, tags | Draws as nothing, but string comparisons, lengths and hashes see it |
| Control | A control code other than TAB, LF and CR | Not text; tools drop it, show a box, or stop |
| Line break other than LF or CR | VT, FF, NEL (U+0085), LINE SEPARATOR (U+2028), PARAGRAPH SEPARATOR (U+2029) | An editor and a language can disagree about where a line ends (UTS #55, line-break spoofing) |
| Lone surrogate, noncharacter | Code points that are not characters | Invalid in UTF-8 (surrogates) or never meant for interchange (noncharacters) |
| Private use, unassigned | No public meaning, or no character yet | Fonts and systems differ, or the text came from a newer Unicode than yours |
| Replacement character | U+FFFD | Often marks an earlier decoding failure |
| Non-ASCII space, quote, dash | No-break and other spaces, typographic quotes, en and em dashes, the minus sign | Look like ASCII; parsers and comparisons disagree |
| Confusable with ASCII | A character UTS #39 maps to an ASCII prototype | Lookalikes: Cyrillic а for a, Greek ο for o |
| Styled ASCII | A character whose compatibility decomposition is ASCII | Fullwidth letters, ligatures and similar |
| Mixed-script word | A word whose letters share no writing system | `pаypal` with a Cyrillic а; Japanese mixing Han, Hiragana and Katakana is not flagged |

Mixed-script detection follows UTS #39: each character's augmented script set is its Script_Extensions plus the writing systems that combine scripts (Han adds Hanb, Hntl, Jpan and Kore; Hiragana and Katakana add Jpan; Hangul adds Kore; Bopomofo adds Hanb; Latin adds Hntl), a Common or Inherited character matches any script, and a word is mixed when the intersection of those sets over its characters is empty.

## The text, in stored order

The reveal panel draws the text left to right in memory order, with bidirectional overriding turned off for the panel itself, so no control in the text can reorder what you see. Every character that needs a look becomes a tag with its code point; red tags change meaning or order, amber tags imitate something. Hover or focus a tag for its name.

## Cleaning

The cleaned copy can remove invisible and bidirectional characters, replace non-ASCII spaces with SPACE (and LINE SEPARATOR, PARAGRAPH SEPARATOR and NEL with LF), turn typographic quotes and dashes into `'`, `"` and `-`, and, if you ask, replace lookalikes with the ASCII they imitate. That last option is off by default, because it also changes genuine words in Cyrillic, Greek and other scripts.

## Escapes

The whole text can be written in JSON, JavaScript, Python, HTML, CSS, a URL, a C `u8` string or a Tcl (iRules) quoted word. Each form escapes the characters its language reserves and everything outside printable ASCII. When this tool was built, each form of 4,000 code points across all seventeen planes, and two stress texts, were decoded back by the language itself (CPython, Node, GCC, Tcl 8.4.6, and Chromium for HTML and CSS), and every one came back unchanged.

Some forms cannot hold every character, and the tool says so instead of writing something wrong:

- **Tcl 8.4 and iRules** have no escape for a character beyond U+FFFF: `\u` takes at most four hexadecimal digits, and the Tcl 8.4.6 interpreter reads the four UTF-8 bytes of such a character as four separate characters.
- **HTML** cannot carry a lone surrogate, and a reference to U+0080 to U+009F gives a different character: 27 of those 32 references are read as Windows-1252 (`&#x85;` is an ellipsis), so the tool writes those characters as themselves.
- **CSS** turns an escaped 0 or surrogate into U+FFFD.
- **C** universal character names cannot name a character below U+00A0 other than `$`, `@` and `` ` ``, nor a surrogate; the tool writes the UTF-8 bytes of U+0080 to U+009F in octal instead.
- **URLs** percent-encode UTF-8 bytes, which a lone surrogate does not have.

## One code point

- **Name.** The Name property; for a control, its first formal alias (controls have no name); for anything else without a name, its code point label, such as `<surrogate-D800>` or `<reserved-0378>`.
- **Aliases.** Every formal alias with its type: correction, control, alternate, figment or abbreviation (`BOM` and `ZWNBSP` for U+FEFF).
- **Properties.** General_Category, Block, Script and Script_Extensions, and the Unicode version that added it.
- **Encodings.** UTF-8 bytes, UTF-16 code units (a surrogate pair beyond U+FFFF) and UTF-32.
- **Escapes and references.** The eight forms above for this one code point, plus the HTML decimal, hexadecimal and named references, with a note when a reference does not give this code point back.

## Limits

- Columns are counted in code points, and so are positions. Editors may count UTF-16 units or user-perceived characters instead.
- Mixed-script detection works word by word; it does not check whole identifiers across punctuation, and it does not decide whether a mix is legitimate.
- The confusable data covers characters that look like ASCII text. Confusables between two non-ASCII scripts are out of scope.
- The tool shows the Unicode 18.0.0 view. A system with older data may not know characters added since (13,007 arrived in 18.0).

## Sources

- [Unicode Character Database 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/): UnicodeData.txt, DerivedName.txt, NameAliases.txt, PropList.txt, DerivedCoreProperties.txt, Blocks.txt, DerivedAge.txt, Scripts.txt, ScriptExtensions.txt, LineBreak.txt, PropertyValueAliases.txt (read 2026-10-03)
- [UTS #39: Unicode Security Mechanisms (18.0.0) and confusables.txt](https://www.unicode.org/reports/tr39/) (read 2026-10-03)
- [UTS #55: Unicode Source Code Handling](https://www.unicode.org/reports/tr55/) (read 2026-10-03)
- [UAX #9: Unicode Bidirectional Algorithm](https://www.unicode.org/reports/tr9/) (read 2026-10-03)
- [UAX #44: Unicode Character Database](https://www.unicode.org/reports/tr44/) (read 2026-10-03)
- [The Unicode Standard 18.0.0, chapters 3, 4, 5 and 23](https://www.unicode.org/versions/Unicode18.0.0/) (read 2026-10-03)
- [NVD: CVE-2021-42574](https://nvd.nist.gov/vuln/detail/CVE-2021-42574) (read 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (read 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (read 2026-10-03)
- [RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259) (read 2026-10-03)
- [ECMA-262: ECMAScript Language Specification](https://tc39.es/ecma262/) (read 2026-10-03)
- [The Python Language Reference: Lexical analysis](https://docs.python.org/3/reference/lexical_analysis.html) (read 2026-10-03)
- [ISO/IEC 9899:2011 committee draft N1570 (C11), 6.4.3](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (read 2026-10-03)
- [Tcl 8.4 manual: Tcl](https://www.tcl-lang.org/man/tcl8.4/TclCmd/Tcl.htm) (read 2026-10-03)
- [WHATWG HTML: parsing (numeric character references)](https://html.spec.whatwg.org/multipage/parsing.html) (read 2026-10-03)
- [WHATWG HTML: named character references](https://html.spec.whatwg.org/entities.json) (read 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-03)
