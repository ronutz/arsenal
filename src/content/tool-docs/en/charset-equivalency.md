## What it does

A byte means nothing until someone says which charset it is in. `E9` is é in windows-1252, Ú in IBM 850 and Z in EBCDIC, and in UTF-8 it is not a character at all, only the first byte of one. This tool shows the same text and the same bytes through fourteen charsets at once, decodes bytes exactly as a browser decodes them, and undoes the damage when text was read in the wrong one.

It has three modes:

- **Text to bytes** writes a text in one charset, in six notations, character by character, and says what happened to any character the charset cannot hold. It then shows the same text in every charset, and how those bytes read back in every charset: the mojibake each wrong guess produces.
- **Bytes to text** reads bytes typed as hex or pasted from a hex dump, as escapes, as %XX or as Base64, decodes them with the charset you choose or the one it detects, and lists every sequence it had to replace, with the reason. It also shows what every charset makes of the same bytes.
- **Fix mojibake** takes garbled text, such as `cafÃ©`, finds the charset that misread it and the one the bytes were really in, and gives the original back, with the steps and how strong the evidence is.

## The fourteen charsets

| Charset | Bytes per character | What a browser does with it |
|---|---|---|
| UTF-8 | 1 to 4 | Decodes it; the WHATWG Encoding Standard requires it for new content |
| UTF-16LE, UTF-16BE | 2 or 4 | Decodes both ("utf-16" is a label of UTF-16LE); never encodes them |
| UTF-32LE, UTF-32BE | 4 | Not supported |
| US-ASCII | 1 (seven bits) | The labels "ascii" and "us-ascii" mean windows-1252 |
| ISO-8859-1 (Latin-1) | 1 | The labels "iso-8859-1" and "latin1" mean windows-1252 |
| windows-1252 | 1 | Decodes it |
| ISO-8859-15 (Latin-9) | 1 | Decodes it |
| Mac OS Roman | 1 | Decodes it (label "macintosh") |
| IBM 437 (DOS, US) | 1 | Not supported |
| IBM 850 (DOS, Western Europe) | 1 | Not supported |
| IBM 037 and IBM 500 (EBCDIC) | 1 | Not supported |

The windows-1252, ISO-8859-15 and Mac OS Roman tables are the WHATWG Encoding Standard's indexes, so they match what a browser decodes. The IBM tables are the Unicode Consortium's archived vendor mapping tables, which the Consortium keeps "only for historical and archival purposes" and without a guarantee that they match any given platform. Every table was compared byte for byte with CPython 3.11's codecs and glibc 2.39's iconv on 2026-10-03. The differences:

- **windows-1252, bytes 0x81, 0x8D, 0x8F, 0x90 and 0x9D.** The WHATWG standard maps them to the C1 controls U+0081, U+008D, U+008F, U+0090 and U+009D; Microsoft's table, CPython and iconv leave them undefined. The tool follows the WHATWG standard, so every byte decodes and decoding never loses information.
- **Mac OS Roman in iconv.** glibc maps 0xC6 to U+0394 and 0xF0 to U+E01E, where Apple's table and the WHATWG standard have U+2206 and U+F8FF.

## Decoding as a browser decodes

The UTF-8 and UTF-16 decoders follow the WHATWG Encoding Standard step by step. When a sequence is ill-formed, one U+FFFD replaces its maximal subpart: the longest run of bytes that could still have started a well-formed character, or a single byte. The Unicode Standard describes the same practice in section 3.9.6, and its Tables 3-8 to 3-11 are among the presets. Each replaced sequence is named:

| Reason | UTF-8 bytes | What it means |
|---|---|---|
| Stray continuation byte | 80 to BF where a character starts | its first byte is missing, or the data is not UTF-8 |
| C0 or C1 | C0, C1 | could only start a two-byte form of an ASCII character |
| F5 to FF | F5 to FF | never appears in UTF-8 |
| Overlong | E0 80-9F, F0 80-8F | a longer form of a code point that has a shorter one |
| Surrogate | ED A0-BF | U+D800 to U+DFFF, which UTF-8 cannot carry |
| Beyond U+10FFFF | F4 90-BF | past the last code point |
| Cut short | a lead byte, then something else | the bytes taken so far become one U+FFFD |

UTF-16 replaces unpaired surrogates and a leftover odd byte; UTF-32, which browsers do not decode, follows the Unicode Standard's definitions D99 and D100 and replaces each four-byte unit that is a surrogate or beyond U+10FFFF.

**Byte order marks.** With "Let a byte order mark decide the charset" on (the default), data that starts with EF BB BF, FE FF or FF FE is decoded as UTF-8, UTF-16BE or UTF-16LE whatever charset you chose, and the mark is not part of the text: the WHATWG standard treats the mark as more authoritative than a label. The tool also recognises the UTF-32 marks 00 00 FE FF and FF FE 00 00, which a browser does not: it takes the FF FE of FF FE 00 00 for UTF-16LE's mark and decodes the rest as UTF-16LE (Chromium 141, measured on 2026-10-03).

**Detect.** With the charset set to Detect, the tool says why it chose one: a byte order mark; every byte ASCII (every ASCII-compatible charset then reads the same text); well-formed UTF-8 with characters beyond ASCII; zero bytes where ASCII text in UTF-16 or UTF-32 puts them; or the pattern of EBCDIC (0x40 common, no ASCII spaces, most bytes above 0x80). Otherwise it says there is no single answer, and the table of readings is the answer.

## Reading bytes from the box

| Format | Example |
|---|---|
| Hex, any separators, with or without 0x or \x | `C3 A9`, `c3a9`, `0xC3, 0xA9`, `{ 0xC3, 0xA9 }` |
| A hex dump | the output of `hexdump -C`, `xxd` or `od -Ax -tx1`: offsets and the ASCII column are skipped |
| Escapes | `\xC3\xA9`, `b'caf\xc3\xa9'` (Python), `caf\303\251` (git quotes file names this way) |
| Percent-encoding | `caf%C3%A9`, read as the WHATWG URL Standard reads it: a % not followed by two hex digits stays a % |
| Base64 | standard or URL-safe alphabet, padding optional |

A hex dump is recognised when every line starts with an offset and the offsets step by the line width, so that the ASCII column is never read as bytes, even when it happens to look like hex.

## Writing bytes

The six notations: hex pairs; the layout of `hexdump -C`; a C array; a Python bytes literal (exactly as Python's `repr()` writes it); Base64 (RFC 4648 section 4); and percent-encoding with RFC 3986's unreserved characters left as they are. Each was compared with its reference: util-linux `hexdump -C`, CPython's `repr()`, `base64` and `urllib.parse.quote`.

**Characters a charset cannot hold** are written as `?` (what most converters do), as a decimal HTML reference such as `&#8364;` (what a browser does when a form is submitted in such a charset: the WHATWG standard's "html" error mode, which the server cannot tell apart from someone typing those characters), or not at all (strict).

## Fixing mojibake

Mojibake is reversible when the wrong charset lost nothing: encode the garbled text back with the charset that misread it, and decode the bytes with the right one. The tool tries that in two tiers:

1. **UTF-8 read as a single-byte charset** (windows-1252, ISO-8859-1, ISO-8859-15, Mac OS Roman, IBM 437, IBM 850). Undoing it must produce well-formed UTF-8, which bytes beyond ASCII rarely form by chance: strong evidence. Up to three rounds undo text that was misread more than once (`Ã¢â‚¬â„¢` is ’ misread twice).
2. **One single-byte charset read as another**, such as an IBM 850 file shown as windows-1252 (`a‡Æo` for ação), or EBCDIC shown as Latin-1. Every byte decodes in these charsets, so the tool keeps a reading only when it scores better on a mojibake measure (the pairs UTF-8 leaves behind, symbols inside words, capitals inside lower-case words, controls, box-drawing characters, words mixing scripts), and labels the evidence as weaker.

When a byte was lost on the way (often the last byte of ” or ™, which windows-1252 turns into an invisible control), a lenient pass recovers the rest and marks each lost character with U+FFFD. **See it garbled** switches to Text to bytes with the repaired text, and the read-back table shows exactly how it was garbled.

Checked on 2026-10-03: 104 of 106 mojibake samples made from fifteen texts (UTF-8 misread as five charsets, misread twice, IBM 850 and windows-1252 misread as each other, EBCDIC misread as Latin-1) came back exactly, and the fifteen texts themselves were left alone. Both misses are short: AÇÃO in EBCDIC misread as Latin-1 (`ÁhfÖ`), where another reading ranks first, and Ça va in windows-1252 misread as IBM 850 (`Ãa va`), which is left as it is. Of 12,087 correct texts (paragraphs from this site's Learn articles in English and Portuguese, plus sixteen sentences in other languages, scripts and symbol sets), none was offered a repair.

## Limits

- The repair works on the whole text. Text that mixes correct characters with garbled ones is left alone: paste the garbled part on its own.
- Bytes that were replaced with `?` or U+FFFD, or dropped, cannot be brought back; the repair says how many characters were lost.
- Detection and the second repair tier are heuristics. Strong evidence comes from byte order marks and well-formed UTF-8; everything else is labelled as weaker.
- Only the fourteen charsets above. Multi-byte East Asian charsets (Shift_JIS, GBK, Big5, EUC-KR) are not included.
- Up to 64 KiB of bytes are decoded and 20,000 characters encoded at once; tables list the first 2,000 rows; the repair examines the first 2,000 characters.

## Sources

- [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/): the UTF-8 and UTF-16 decoders, BOM sniffing, the single-byte decoder and encoder, the labels, the error modes; living standard last updated 21 May 2026 (read 2026-10-03)
- [WHATWG indexes: windows-1252](https://encoding.spec.whatwg.org/index-windows-1252.txt), [ISO-8859-15](https://encoding.spec.whatwg.org/index-iso-8859-15.txt), [macintosh](https://encoding.spec.whatwg.org/index-macintosh.txt) (read 2026-10-03)
- [The Unicode Standard 18.0.0, chapter 3: Conformance](https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-3/): Table 3-7, section 3.9.6 and Tables 3-8 to 3-11, definitions D95 to D100 (read 2026-10-03)
- [Unicode FAQ: UTF-8, UTF-16, UTF-32 & BOM](https://www.unicode.org/faq/utf_bom.html) (read 2026-10-03)
- [Unicode mapping tables](https://www.unicode.org/Public/MAPPINGS/): [ReadMe](https://www.unicode.org/Public/MAPPINGS/ReadMe.txt), [CP437](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP437.TXT), [CP850](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/PC/CP850.TXT), [CP037](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP037.TXT), [CP500](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/EBCDIC/CP500.TXT), [CP1252](https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1252.TXT), [8859-1](https://www.unicode.org/Public/MAPPINGS/ISO8859/8859-1.TXT), [Apple ROMAN](https://www.unicode.org/Public/MAPPINGS/VENDORS/APPLE/ROMAN.TXT) (read 2026-10-03)
- [RFC 3629: UTF-8](https://www.rfc-editor.org/rfc/rfc3629) (read 2026-10-03)
- [RFC 2781: UTF-16](https://www.rfc-editor.org/rfc/rfc2781) (read 2026-10-03)
- [RFC 4648: Base16, Base32 and Base64](https://www.rfc-editor.org/rfc/rfc4648) (read 2026-10-03)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) (read 2026-10-03)
- [WHATWG URL Standard: percent-decode](https://url.spec.whatwg.org/) (read 2026-10-03)
