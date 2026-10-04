// ============================================================================
// src/lib/tools/ascii-table/data.ts
// ----------------------------------------------------------------------------
// THE 128 ASCII CODES, GENERATED (not typed) by scratchpad/ascii/gen-ascii-data.py
// from four sources read on 2026-10-03:
//
//   RFC 20 (Vint Cerf, 1969), which reproduces USA Standard X3.4-1968: the
//     abbreviations in its code table, the names in its legend (4.1, 4.2),
//     the control classes CC (communication
//     control), FE (format effector) and IS (information separator), and the
//     positions its note 3 says need agreement before international use;
//   Unicode Character Database 18.0.0, UnicodeData.txt: the current name, the
//     General_Category and the Unicode 1.0 name;
//   Unicode Character Database 18.0.0, NameAliases.txt: the ISO 6429 names
//     of the control codes and their abbreviations (controls have no name of
//     their own in Unicode, only these formal aliases);
//   WHATWG HTML, entities.json: every named character reference, with its
//     semicolon, that stands for the code.
//
// Each row: code; glyph (33 to 126 only); abbr (control and space
// abbreviation); name (Unicode name, or the first control alias); aliases
// and abbrAliases (the other formal aliases); unicode1 (the Unicode 1.0 name
// when it differs); category (General_Category); rfc20 (table abbreviation, name, alternative
// names, class, agree = note 3, pound = note 4); html (named references).
// ============================================================================

/** One ASCII code with its names and classes. */
export interface AsciiCode {
  // The code, 0 to 127.
  code: number;
  // The printable character (33 to 126); controls, space and DEL have none.
  glyph?: string;
  // The abbreviation (NUL, LF, ESC, SP, DEL...).
  abbr?: string;
  // The Unicode name, or for a control its first ISO 6429 alias.
  name: string;
  // Further control aliases from NameAliases.txt.
  aliases?: string[];
  // Further abbreviations from NameAliases.txt.
  abbrAliases?: string[];
  // The Unicode 1.0 name, when it differs from the current one.
  unicode1?: string;
  // The Unicode General_Category.
  category: string;
  // RFC 20 / USAS X3.4-1968: table abbreviation, name, alternative names, class, note 3 and note 4.
  rfc20?: { abbr?: string; name: string; alt?: string; cls?: "CC" | "FE" | "IS"; agree?: boolean; pound?: boolean };
  // WHATWG named character references (with the semicolon).
  html?: string[];
}

/** All 128 codes, in order. */
export const ASCII: readonly AsciiCode[] = [
  // 0 (0x00) NUL
  { code: 0, abbr: "NUL", name: "NULL", category: "Cc", rfc20: { abbr: "NUL", name: "Null" } },
  // 1 (0x01) SOH
  { code: 1, abbr: "SOH", name: "START OF HEADING", category: "Cc", rfc20: { abbr: "SOH", name: "Start of Heading", cls: "CC" } },
  // 2 (0x02) STX
  { code: 2, abbr: "STX", name: "START OF TEXT", category: "Cc", rfc20: { abbr: "STX", name: "Start of Text", cls: "CC" } },
  // 3 (0x03) ETX
  { code: 3, abbr: "ETX", name: "END OF TEXT", category: "Cc", rfc20: { abbr: "ETX", name: "End of Text", cls: "CC" } },
  // 4 (0x04) EOT
  { code: 4, abbr: "EOT", name: "END OF TRANSMISSION", category: "Cc", rfc20: { abbr: "EOT", name: "End of Transmission", cls: "CC" } },
  // 5 (0x05) ENQ
  { code: 5, abbr: "ENQ", name: "ENQUIRY", category: "Cc", rfc20: { abbr: "ENQ", name: "Enquiry", cls: "CC" } },
  // 6 (0x06) ACK
  { code: 6, abbr: "ACK", name: "ACKNOWLEDGE", category: "Cc", rfc20: { abbr: "ACK", name: "Acknowledge", cls: "CC" } },
  // 7 (0x07) BEL
  { code: 7, abbr: "BEL", name: "ALERT", unicode1: "BELL", category: "Cc", rfc20: { abbr: "BEL", name: "Bell", alt: "audible or attention signal" } },
  // 8 (0x08) BS
  { code: 8, abbr: "BS", name: "BACKSPACE", category: "Cc", rfc20: { abbr: "BS", name: "Backspace", cls: "FE" } },
  // 9 (0x09) HT
  { code: 9, abbr: "HT", name: "CHARACTER TABULATION", aliases: ["HORIZONTAL TABULATION"], abbrAliases: ["TAB"], category: "Cc", rfc20: { abbr: "HT", name: "Horizontal Tabulation", alt: "punched card skip", cls: "FE" }, html: ["&Tab;"] },
  // 10 (0x0A) LF
  { code: 10, abbr: "LF", name: "LINE FEED", aliases: ["NEW LINE", "END OF LINE"], abbrAliases: ["NL", "EOL"], unicode1: "LINE FEED (LF)", category: "Cc", rfc20: { abbr: "LF", name: "Line Feed", cls: "FE" }, html: ["&NewLine;"] },
  // 11 (0x0B) VT
  { code: 11, abbr: "VT", name: "LINE TABULATION", aliases: ["VERTICAL TABULATION"], category: "Cc", rfc20: { abbr: "VT", name: "Vertical Tabulation", cls: "FE" } },
  // 12 (0x0C) FF
  { code: 12, abbr: "FF", name: "FORM FEED", unicode1: "FORM FEED (FF)", category: "Cc", rfc20: { abbr: "FF", name: "Form Feed", cls: "FE" } },
  // 13 (0x0D) CR
  { code: 13, abbr: "CR", name: "CARRIAGE RETURN", unicode1: "CARRIAGE RETURN (CR)", category: "Cc", rfc20: { abbr: "CR", name: "Carriage Return", cls: "FE" } },
  // 14 (0x0E) SO
  { code: 14, abbr: "SO", name: "SHIFT OUT", aliases: ["LOCKING-SHIFT ONE"], category: "Cc", rfc20: { abbr: "SO", name: "Shift Out" } },
  // 15 (0x0F) SI
  { code: 15, abbr: "SI", name: "SHIFT IN", aliases: ["LOCKING-SHIFT ZERO"], category: "Cc", rfc20: { abbr: "SI", name: "Shift In" } },
  // 16 (0x10) DLE
  { code: 16, abbr: "DLE", name: "DATA LINK ESCAPE", category: "Cc", rfc20: { abbr: "DLE", name: "Data Link Escape", cls: "CC" } },
  // 17 (0x11) DC1
  { code: 17, abbr: "DC1", name: "DEVICE CONTROL ONE", category: "Cc", rfc20: { abbr: "DC1", name: "Device Control 1" } },
  // 18 (0x12) DC2
  { code: 18, abbr: "DC2", name: "DEVICE CONTROL TWO", category: "Cc", rfc20: { abbr: "DC2", name: "Device Control 2" } },
  // 19 (0x13) DC3
  { code: 19, abbr: "DC3", name: "DEVICE CONTROL THREE", category: "Cc", rfc20: { abbr: "DC3", name: "Device Control 3" } },
  // 20 (0x14) DC4
  { code: 20, abbr: "DC4", name: "DEVICE CONTROL FOUR", category: "Cc", rfc20: { abbr: "DC4", name: "Device Control 4", alt: "Stop" } },
  // 21 (0x15) NAK
  { code: 21, abbr: "NAK", name: "NEGATIVE ACKNOWLEDGE", category: "Cc", rfc20: { abbr: "NAK", name: "Negative Acknowledge", cls: "CC" } },
  // 22 (0x16) SYN
  { code: 22, abbr: "SYN", name: "SYNCHRONOUS IDLE", category: "Cc", rfc20: { abbr: "SYN", name: "Synchronous Idle", cls: "CC" } },
  // 23 (0x17) ETB
  { code: 23, abbr: "ETB", name: "END OF TRANSMISSION BLOCK", category: "Cc", rfc20: { abbr: "ETB", name: "End of Transmission Block", cls: "CC" } },
  // 24 (0x18) CAN
  { code: 24, abbr: "CAN", name: "CANCEL", category: "Cc", rfc20: { abbr: "CAN", name: "Cancel" } },
  // 25 (0x19) EOM
  { code: 25, abbr: "EOM", name: "END OF MEDIUM", abbrAliases: ["EM"], category: "Cc", rfc20: { abbr: "EM", name: "End of Medium" } },
  // 26 (0x1A) SUB
  { code: 26, abbr: "SUB", name: "SUBSTITUTE", category: "Cc", rfc20: { abbr: "SUB", name: "Substitute" } },
  // 27 (0x1B) ESC
  { code: 27, abbr: "ESC", name: "ESCAPE", category: "Cc", rfc20: { abbr: "ESC", name: "Escape" } },
  // 28 (0x1C) FS
  { code: 28, abbr: "FS", name: "INFORMATION SEPARATOR FOUR", aliases: ["FILE SEPARATOR"], category: "Cc", rfc20: { abbr: "FS", name: "File Separator", cls: "IS" } },
  // 29 (0x1D) GS
  { code: 29, abbr: "GS", name: "INFORMATION SEPARATOR THREE", aliases: ["GROUP SEPARATOR"], category: "Cc", rfc20: { abbr: "GS", name: "Group Separator", cls: "IS" } },
  // 30 (0x1E) RS
  { code: 30, abbr: "RS", name: "INFORMATION SEPARATOR TWO", aliases: ["RECORD SEPARATOR"], category: "Cc", rfc20: { abbr: "RS", name: "Record Separator", cls: "IS" } },
  // 31 (0x1F) US
  { code: 31, abbr: "US", name: "INFORMATION SEPARATOR ONE", aliases: ["UNIT SEPARATOR"], category: "Cc", rfc20: { abbr: "US", name: "Unit Separator", cls: "IS" } },
  // 32 (0x20) SP
  { code: 32, abbr: "SP", name: "SPACE", category: "Zs", rfc20: { abbr: "SP", name: "Space", alt: "Normally Non-Printing" } },
  // 33 (0x21) !
  { code: 33, glyph: "!", name: "EXCLAMATION MARK", category: "Po", rfc20: { name: "Exclamation Point" }, html: ["&excl;"] },
  // 34 (0x22) "
  { code: 34, glyph: "\"", name: "QUOTATION MARK", category: "Po", rfc20: { name: "Quotation Marks", alt: "Diaeresis" }, html: ["&QUOT;", "&quot;"] },
  // 35 (0x23) #
  { code: 35, glyph: "#", name: "NUMBER SIGN", category: "Po", rfc20: { name: "Number Sign", agree: true, pound: true }, html: ["&num;"] },
  // 36 (0x24) $
  { code: 36, glyph: "$", name: "DOLLAR SIGN", category: "Sc", rfc20: { name: "Dollar Sign" }, html: ["&dollar;"] },
  // 37 (0x25) %
  { code: 37, glyph: "%", name: "PERCENT SIGN", category: "Po", rfc20: { name: "Percent" }, html: ["&percnt;"] },
  // 38 (0x26) &
  { code: 38, glyph: "&", name: "AMPERSAND", category: "Po", rfc20: { name: "Ampersand" }, html: ["&AMP;", "&amp;"] },
  // 39 (0x27) '
  { code: 39, glyph: "'", name: "APOSTROPHE", unicode1: "APOSTROPHE-QUOTE", category: "Po", rfc20: { name: "Apostrophe", alt: "Closing Single Quotation Mark; Acute Accent" }, html: ["&apos;"] },
  // 40 (0x28) (
  { code: 40, glyph: "(", name: "LEFT PARENTHESIS", unicode1: "OPENING PARENTHESIS", category: "Ps", rfc20: { name: "Opening Parenthesis" }, html: ["&lpar;"] },
  // 41 (0x29) )
  { code: 41, glyph: ")", name: "RIGHT PARENTHESIS", unicode1: "CLOSING PARENTHESIS", category: "Pe", rfc20: { name: "Closing Parenthesis" }, html: ["&rpar;"] },
  // 42 (0x2A) *
  { code: 42, glyph: "*", name: "ASTERISK", category: "Po", rfc20: { name: "Asterisk" }, html: ["&ast;", "&midast;"] },
  // 43 (0x2B) +
  { code: 43, glyph: "+", name: "PLUS SIGN", category: "Sm", rfc20: { name: "Plus" }, html: ["&plus;"] },
  // 44 (0x2C) ,
  { code: 44, glyph: ",", name: "COMMA", category: "Po", rfc20: { name: "Comma", alt: "Cedilla" }, html: ["&comma;"] },
  // 45 (0x2D) -
  { code: 45, glyph: "-", name: "HYPHEN-MINUS", category: "Pd", rfc20: { name: "Hyphen", alt: "Minus" } },
  // 46 (0x2E) .
  { code: 46, glyph: ".", name: "FULL STOP", unicode1: "PERIOD", category: "Po", rfc20: { name: "Period", alt: "Decimal Point" }, html: ["&period;"] },
  // 47 (0x2F) /
  { code: 47, glyph: "/", name: "SOLIDUS", unicode1: "SLASH", category: "Po", rfc20: { name: "Slant" }, html: ["&sol;"] },
  // 48 (0x30) 0
  { code: 48, glyph: "0", name: "DIGIT ZERO", category: "Nd" },
  // 49 (0x31) 1
  { code: 49, glyph: "1", name: "DIGIT ONE", category: "Nd" },
  // 50 (0x32) 2
  { code: 50, glyph: "2", name: "DIGIT TWO", category: "Nd" },
  // 51 (0x33) 3
  { code: 51, glyph: "3", name: "DIGIT THREE", category: "Nd" },
  // 52 (0x34) 4
  { code: 52, glyph: "4", name: "DIGIT FOUR", category: "Nd" },
  // 53 (0x35) 5
  { code: 53, glyph: "5", name: "DIGIT FIVE", category: "Nd" },
  // 54 (0x36) 6
  { code: 54, glyph: "6", name: "DIGIT SIX", category: "Nd" },
  // 55 (0x37) 7
  { code: 55, glyph: "7", name: "DIGIT SEVEN", category: "Nd" },
  // 56 (0x38) 8
  { code: 56, glyph: "8", name: "DIGIT EIGHT", category: "Nd" },
  // 57 (0x39) 9
  { code: 57, glyph: "9", name: "DIGIT NINE", category: "Nd" },
  // 58 (0x3A) :
  { code: 58, glyph: ":", name: "COLON", category: "Po", rfc20: { name: "Colon" }, html: ["&colon;"] },
  // 59 (0x3B) ;
  { code: 59, glyph: ";", name: "SEMICOLON", category: "Po", rfc20: { name: "Semicolon" }, html: ["&semi;"] },
  // 60 (0x3C) <
  { code: 60, glyph: "<", name: "LESS-THAN SIGN", category: "Sm", rfc20: { name: "Less Than" }, html: ["&LT;", "&lt;"] },
  // 61 (0x3D) =
  { code: 61, glyph: "=", name: "EQUALS SIGN", category: "Sm", rfc20: { name: "Equals" }, html: ["&equals;"] },
  // 62 (0x3E) >
  { code: 62, glyph: ">", name: "GREATER-THAN SIGN", category: "Sm", rfc20: { name: "Greater Than" }, html: ["&GT;", "&gt;"] },
  // 63 (0x3F) ?
  { code: 63, glyph: "?", name: "QUESTION MARK", category: "Po", rfc20: { name: "Question Mark" }, html: ["&quest;"] },
  // 64 (0x40) @
  { code: 64, glyph: "@", name: "COMMERCIAL AT", category: "Po", rfc20: { name: "Commercial At", agree: true }, html: ["&commat;"] },
  // 65 (0x41) A
  { code: 65, glyph: "A", name: "LATIN CAPITAL LETTER A", category: "Lu" },
  // 66 (0x42) B
  { code: 66, glyph: "B", name: "LATIN CAPITAL LETTER B", category: "Lu" },
  // 67 (0x43) C
  { code: 67, glyph: "C", name: "LATIN CAPITAL LETTER C", category: "Lu" },
  // 68 (0x44) D
  { code: 68, glyph: "D", name: "LATIN CAPITAL LETTER D", category: "Lu" },
  // 69 (0x45) E
  { code: 69, glyph: "E", name: "LATIN CAPITAL LETTER E", category: "Lu" },
  // 70 (0x46) F
  { code: 70, glyph: "F", name: "LATIN CAPITAL LETTER F", category: "Lu" },
  // 71 (0x47) G
  { code: 71, glyph: "G", name: "LATIN CAPITAL LETTER G", category: "Lu" },
  // 72 (0x48) H
  { code: 72, glyph: "H", name: "LATIN CAPITAL LETTER H", category: "Lu" },
  // 73 (0x49) I
  { code: 73, glyph: "I", name: "LATIN CAPITAL LETTER I", category: "Lu" },
  // 74 (0x4A) J
  { code: 74, glyph: "J", name: "LATIN CAPITAL LETTER J", category: "Lu" },
  // 75 (0x4B) K
  { code: 75, glyph: "K", name: "LATIN CAPITAL LETTER K", category: "Lu" },
  // 76 (0x4C) L
  { code: 76, glyph: "L", name: "LATIN CAPITAL LETTER L", category: "Lu" },
  // 77 (0x4D) M
  { code: 77, glyph: "M", name: "LATIN CAPITAL LETTER M", category: "Lu" },
  // 78 (0x4E) N
  { code: 78, glyph: "N", name: "LATIN CAPITAL LETTER N", category: "Lu" },
  // 79 (0x4F) O
  { code: 79, glyph: "O", name: "LATIN CAPITAL LETTER O", category: "Lu" },
  // 80 (0x50) P
  { code: 80, glyph: "P", name: "LATIN CAPITAL LETTER P", category: "Lu" },
  // 81 (0x51) Q
  { code: 81, glyph: "Q", name: "LATIN CAPITAL LETTER Q", category: "Lu" },
  // 82 (0x52) R
  { code: 82, glyph: "R", name: "LATIN CAPITAL LETTER R", category: "Lu" },
  // 83 (0x53) S
  { code: 83, glyph: "S", name: "LATIN CAPITAL LETTER S", category: "Lu" },
  // 84 (0x54) T
  { code: 84, glyph: "T", name: "LATIN CAPITAL LETTER T", category: "Lu" },
  // 85 (0x55) U
  { code: 85, glyph: "U", name: "LATIN CAPITAL LETTER U", category: "Lu" },
  // 86 (0x56) V
  { code: 86, glyph: "V", name: "LATIN CAPITAL LETTER V", category: "Lu" },
  // 87 (0x57) W
  { code: 87, glyph: "W", name: "LATIN CAPITAL LETTER W", category: "Lu" },
  // 88 (0x58) X
  { code: 88, glyph: "X", name: "LATIN CAPITAL LETTER X", category: "Lu" },
  // 89 (0x59) Y
  { code: 89, glyph: "Y", name: "LATIN CAPITAL LETTER Y", category: "Lu" },
  // 90 (0x5A) Z
  { code: 90, glyph: "Z", name: "LATIN CAPITAL LETTER Z", category: "Lu" },
  // 91 (0x5B) [
  { code: 91, glyph: "[", name: "LEFT SQUARE BRACKET", unicode1: "OPENING SQUARE BRACKET", category: "Ps", rfc20: { name: "Opening Bracket", agree: true }, html: ["&lbrack;", "&lsqb;"] },
  // 92 (0x5C) \\
  { code: 92, glyph: "\\", name: "REVERSE SOLIDUS", unicode1: "BACKSLASH", category: "Po", rfc20: { name: "Reverse Slant", agree: true }, html: ["&bsol;"] },
  // 93 (0x5D) ]
  { code: 93, glyph: "]", name: "RIGHT SQUARE BRACKET", unicode1: "CLOSING SQUARE BRACKET", category: "Pe", rfc20: { name: "Closing Bracket", agree: true }, html: ["&rbrack;", "&rsqb;"] },
  // 94 (0x5E) ^
  { code: 94, glyph: "^", name: "CIRCUMFLEX ACCENT", unicode1: "SPACING CIRCUMFLEX", category: "Sk", rfc20: { name: "Circumflex", agree: true }, html: ["&Hat;"] },
  // 95 (0x5F) _
  { code: 95, glyph: "_", name: "LOW LINE", unicode1: "SPACING UNDERSCORE", category: "Pc", rfc20: { name: "Underline" }, html: ["&lowbar;", "&UnderBar;"] },
  // 96 (0x60) `
  { code: 96, glyph: "`", name: "GRAVE ACCENT", unicode1: "SPACING GRAVE", category: "Sk", rfc20: { name: "Grave Accent", alt: "Opening Single Quotation Mark", agree: true }, html: ["&DiacriticalGrave;", "&grave;"] },
  // 97 (0x61) a
  { code: 97, glyph: "a", name: "LATIN SMALL LETTER A", category: "Ll" },
  // 98 (0x62) b
  { code: 98, glyph: "b", name: "LATIN SMALL LETTER B", category: "Ll" },
  // 99 (0x63) c
  { code: 99, glyph: "c", name: "LATIN SMALL LETTER C", category: "Ll" },
  // 100 (0x64) d
  { code: 100, glyph: "d", name: "LATIN SMALL LETTER D", category: "Ll" },
  // 101 (0x65) e
  { code: 101, glyph: "e", name: "LATIN SMALL LETTER E", category: "Ll" },
  // 102 (0x66) f
  { code: 102, glyph: "f", name: "LATIN SMALL LETTER F", category: "Ll" },
  // 103 (0x67) g
  { code: 103, glyph: "g", name: "LATIN SMALL LETTER G", category: "Ll" },
  // 104 (0x68) h
  { code: 104, glyph: "h", name: "LATIN SMALL LETTER H", category: "Ll" },
  // 105 (0x69) i
  { code: 105, glyph: "i", name: "LATIN SMALL LETTER I", category: "Ll" },
  // 106 (0x6A) j
  { code: 106, glyph: "j", name: "LATIN SMALL LETTER J", category: "Ll" },
  // 107 (0x6B) k
  { code: 107, glyph: "k", name: "LATIN SMALL LETTER K", category: "Ll" },
  // 108 (0x6C) l
  { code: 108, glyph: "l", name: "LATIN SMALL LETTER L", category: "Ll" },
  // 109 (0x6D) m
  { code: 109, glyph: "m", name: "LATIN SMALL LETTER M", category: "Ll" },
  // 110 (0x6E) n
  { code: 110, glyph: "n", name: "LATIN SMALL LETTER N", category: "Ll" },
  // 111 (0x6F) o
  { code: 111, glyph: "o", name: "LATIN SMALL LETTER O", category: "Ll" },
  // 112 (0x70) p
  { code: 112, glyph: "p", name: "LATIN SMALL LETTER P", category: "Ll" },
  // 113 (0x71) q
  { code: 113, glyph: "q", name: "LATIN SMALL LETTER Q", category: "Ll" },
  // 114 (0x72) r
  { code: 114, glyph: "r", name: "LATIN SMALL LETTER R", category: "Ll" },
  // 115 (0x73) s
  { code: 115, glyph: "s", name: "LATIN SMALL LETTER S", category: "Ll" },
  // 116 (0x74) t
  { code: 116, glyph: "t", name: "LATIN SMALL LETTER T", category: "Ll" },
  // 117 (0x75) u
  { code: 117, glyph: "u", name: "LATIN SMALL LETTER U", category: "Ll" },
  // 118 (0x76) v
  { code: 118, glyph: "v", name: "LATIN SMALL LETTER V", category: "Ll" },
  // 119 (0x77) w
  { code: 119, glyph: "w", name: "LATIN SMALL LETTER W", category: "Ll" },
  // 120 (0x78) x
  { code: 120, glyph: "x", name: "LATIN SMALL LETTER X", category: "Ll" },
  // 121 (0x79) y
  { code: 121, glyph: "y", name: "LATIN SMALL LETTER Y", category: "Ll" },
  // 122 (0x7A) z
  { code: 122, glyph: "z", name: "LATIN SMALL LETTER Z", category: "Ll" },
  // 123 (0x7B) {
  { code: 123, glyph: "{", name: "LEFT CURLY BRACKET", unicode1: "OPENING CURLY BRACKET", category: "Ps", rfc20: { name: "Opening Brace", agree: true }, html: ["&lbrace;", "&lcub;"] },
  // 124 (0x7C) |
  { code: 124, glyph: "|", name: "VERTICAL LINE", unicode1: "VERTICAL BAR", category: "Sm", rfc20: { name: "Vertical Line", agree: true }, html: ["&verbar;", "&vert;", "&VerticalLine;"] },
  // 125 (0x7D) }
  { code: 125, glyph: "}", name: "RIGHT CURLY BRACKET", unicode1: "CLOSING CURLY BRACKET", category: "Pe", rfc20: { name: "Closing Brace", agree: true }, html: ["&rbrace;", "&rcub;"] },
  // 126 (0x7E) ~
  { code: 126, glyph: "~", name: "TILDE", category: "Sm", rfc20: { name: "Overline", alt: "Tilde; General Accent", agree: true } },
  // 127 (0x7F) DEL
  { code: 127, abbr: "DEL", name: "DELETE", category: "Cc", rfc20: { abbr: "DEL", name: "Delete" } },
];
