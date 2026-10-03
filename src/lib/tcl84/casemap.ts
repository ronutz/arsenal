// ============================================================================
// src/lib/tcl84/casemap.ts
// ----------------------------------------------------------------------------
// TCL 8.4.6 CASE MAPPING - the exact one-to-one upper/lower case tables of the
// interpreter iRules are built from (F5 K6091: Tcl 8.4.6).
//
// Tcl 8.4.6 ships Unicode tables from the early 2000s, and modern JavaScript
// knows about characters and case pairs added since then, so the browser's
// toLowerCase/toUpperCase disagree with Tcl 8.4.6 on 1,008 single-character
// mappings (487 lower-case, 521 upper-case, counted on 2026-10-03); U+00B5
// MICRO SIGN, for one, has no upper case in Tcl 8.4.6. These tables
// were GENERATED, not typed: every Basic Multilingual Plane character was
// passed through `string tolower` and `string toupper` in a Tcl 8.4.6
// interpreter built from the core-8-4-6 tag, on 2026-10-03, and the mappings
// that are not identities were run-length encoded below:
//   697 characters have a lower-case mapping (102 runs);
//   706 characters have an upper-case mapping (113 runs).
//
// Each run is [first code point, count, step, delta]: the characters first,
// first + step, ... (count of them) map to themselves plus delta.
// ============================================================================

/** Lower-case mappings: [first code point, count, step, delta] runs. */
const LOWER_RUNS: readonly (readonly [number, number, number, number])[] = [
  // U+0041 to U+00DE: 3 runs.
  [0x0041, 26, 1, 32], [0x00c0, 23, 1, 32], [0x00d8, 7, 1, 32],
  // U+0100 to U+021E: 49 runs.
  [0x0100, 24, 2, 1], [0x0130, 1, 1, -199], [0x0132, 3, 2, 1], [0x0139, 8, 2, 1], [0x014a, 23, 2, 1], [0x0178, 1, 1, -121], [0x0179, 3, 2, 1], [0x0181, 1, 1, 210], [0x0182, 2, 2, 1], [0x0186, 1, 1, 206], [0x0187, 1, 1, 1], [0x0189, 2, 1, 205], [0x018b, 1, 1, 1], [0x018e, 1, 1, 79], [0x018f, 1, 1, 202], [0x0190, 1, 1, 203], [0x0191, 1, 1, 1], [0x0193, 1, 1, 205], [0x0194, 1, 1, 207], [0x0196, 1, 1, 211], [0x0197, 1, 1, 209], [0x0198, 1, 1, 1], [0x019c, 1, 1, 211], [0x019d, 1, 1, 213], [0x019f, 1, 1, 214], [0x01a0, 3, 2, 1], [0x01a6, 1, 1, 218], [0x01a7, 1, 1, 1], [0x01a9, 1, 1, 218], [0x01ac, 1, 1, 1], [0x01ae, 1, 1, 218], [0x01af, 1, 1, 1], [0x01b1, 2, 1, 217], [0x01b3, 2, 2, 1], [0x01b7, 1, 1, 219], [0x01b8, 1, 1, 1], [0x01bc, 1, 1, 1], [0x01c4, 1, 1, 2], [0x01c5, 1, 1, 1], [0x01c7, 1, 1, 2], [0x01c8, 1, 1, 1], [0x01ca, 1, 1, 2], [0x01cb, 9, 2, 1], [0x01de, 9, 2, 1], [0x01f1, 1, 1, 2], [0x01f2, 2, 2, 1], [0x01f6, 1, 1, -97], [0x01f7, 1, 1, -56], [0x01f8, 20, 2, 1],
  // U+0222 to U+0232: 1 run.
  [0x0222, 9, 2, 1],
  // U+0386 to U+03F4: 8 runs.
  [0x0386, 1, 1, 38], [0x0388, 3, 1, 37], [0x038c, 1, 1, 64], [0x038e, 2, 1, 63], [0x0391, 17, 1, 32], [0x03a3, 9, 1, 32], [0x03da, 11, 2, 1], [0x03f4, 1, 1, -60],
  // U+0400 to U+04F8: 9 runs.
  [0x0400, 16, 1, 80], [0x0410, 32, 1, 32], [0x0460, 17, 2, 1], [0x048c, 26, 2, 1], [0x04c1, 2, 2, 1], [0x04c7, 1, 1, 1], [0x04cb, 1, 1, 1], [0x04d0, 19, 2, 1], [0x04f8, 1, 1, 1],
  // U+0531 to U+0556: 1 run.
  [0x0531, 38, 1, 48],
  // U+1E00 to U+1EF8: 2 runs.
  [0x1e00, 75, 2, 1], [0x1ea0, 45, 2, 1],
  // U+1F08 to U+1FFC: 23 runs.
  [0x1f08, 8, 1, -8], [0x1f18, 6, 1, -8], [0x1f28, 8, 1, -8], [0x1f38, 8, 1, -8], [0x1f48, 6, 1, -8], [0x1f59, 4, 2, -8], [0x1f68, 8, 1, -8], [0x1f88, 8, 1, -8], [0x1f98, 8, 1, -8], [0x1fa8, 8, 1, -8], [0x1fb8, 2, 1, -8], [0x1fba, 2, 1, -74], [0x1fbc, 1, 1, -9], [0x1fc8, 4, 1, -86], [0x1fcc, 1, 1, -9], [0x1fd8, 2, 1, -8], [0x1fda, 2, 1, -100], [0x1fe8, 2, 1, -8], [0x1fea, 2, 1, -112], [0x1fec, 1, 1, -7], [0x1ff8, 2, 1, -128], [0x1ffa, 2, 1, -126], [0x1ffc, 1, 1, -9],
  // U+2126 to U+216F: 4 runs.
  [0x2126, 1, 1, -349], [0x212a, 1, 1, -191], [0x212b, 1, 1, -70], [0x2160, 16, 1, 16],
  // U+24B6 to U+24CF: 1 run.
  [0x24b6, 26, 1, 26],
  // U+FF21 to U+FF3A: 1 run.
  [0xff21, 26, 1, 32],
];

/** Upper-case mappings: [first code point, count, step, delta] runs. */
const UPPER_RUNS: readonly (readonly [number, number, number, number])[] = [
  // U+0061 to U+00FF: 4 runs.
  [0x0061, 26, 1, -32], [0x00e0, 23, 1, -32], [0x00f8, 7, 1, -32], [0x00ff, 1, 1, 121],
  // U+0101 to U+021F: 34 runs.
  [0x0101, 24, 2, -1], [0x0131, 1, 1, -232], [0x0133, 3, 2, -1], [0x013a, 8, 2, -1], [0x014b, 23, 2, -1], [0x017a, 3, 2, -1], [0x017f, 1, 1, -300], [0x0183, 2, 2, -1], [0x0188, 1, 1, -1], [0x018c, 1, 1, -1], [0x0192, 1, 1, -1], [0x0195, 1, 1, 97], [0x0199, 1, 1, -1], [0x01a1, 3, 2, -1], [0x01a8, 1, 1, -1], [0x01ad, 1, 1, -1], [0x01b0, 1, 1, -1], [0x01b4, 2, 2, -1], [0x01b9, 1, 1, -1], [0x01bd, 1, 1, -1], [0x01bf, 1, 1, 56], [0x01c5, 1, 1, -1], [0x01c6, 1, 1, -2], [0x01c8, 1, 1, -1], [0x01c9, 1, 1, -2], [0x01cb, 1, 1, -1], [0x01cc, 1, 1, -2], [0x01ce, 8, 2, -1], [0x01dd, 1, 1, -79], [0x01df, 9, 2, -1], [0x01f2, 1, 1, -1], [0x01f3, 1, 1, -2], [0x01f5, 1, 1, -1], [0x01f9, 20, 2, -1],
  // U+0223 to U+0292: 18 runs.
  [0x0223, 9, 2, -1], [0x0253, 1, 1, -210], [0x0254, 1, 1, -206], [0x0256, 2, 1, -205], [0x0259, 1, 1, -202], [0x025b, 1, 1, -203], [0x0260, 1, 1, -205], [0x0263, 1, 1, -207], [0x0268, 1, 1, -209], [0x0269, 1, 1, -211], [0x026f, 1, 1, -211], [0x0272, 1, 1, -213], [0x0275, 1, 1, -214], [0x0280, 1, 1, -218], [0x0283, 1, 1, -218], [0x0288, 1, 1, -218], [0x028a, 2, 1, -217], [0x0292, 1, 1, -219],
  // U+0345 to U+03F5: 17 runs.
  [0x0345, 1, 1, 84], [0x03ac, 1, 1, -38], [0x03ad, 3, 1, -37], [0x03b1, 17, 1, -32], [0x03c2, 1, 1, -31], [0x03c3, 9, 1, -32], [0x03cc, 1, 1, -64], [0x03cd, 2, 1, -63], [0x03d0, 1, 1, -62], [0x03d1, 1, 1, -57], [0x03d5, 1, 1, -47], [0x03d6, 1, 1, -54], [0x03db, 11, 2, -1], [0x03f0, 1, 1, -86], [0x03f1, 1, 1, -80], [0x03f2, 1, 1, -79], [0x03f5, 1, 1, -96],
  // U+0430 to U+04F9: 9 runs.
  [0x0430, 32, 1, -32], [0x0450, 16, 1, -80], [0x0461, 17, 2, -1], [0x048d, 26, 2, -1], [0x04c2, 2, 2, -1], [0x04c8, 1, 1, -1], [0x04cc, 1, 1, -1], [0x04d1, 19, 2, -1], [0x04f9, 1, 1, -1],
  // U+0561 to U+0586: 1 run.
  [0x0561, 38, 1, -48],
  // U+1E01 to U+1EF9: 3 runs.
  [0x1e01, 75, 2, -1], [0x1e9b, 1, 1, -59], [0x1ea1, 45, 2, -1],
  // U+1F00 to U+1FF3: 24 runs.
  [0x1f00, 8, 1, 8], [0x1f10, 6, 1, 8], [0x1f20, 8, 1, 8], [0x1f30, 8, 1, 8], [0x1f40, 6, 1, 8], [0x1f51, 4, 2, 8], [0x1f60, 8, 1, 8], [0x1f70, 2, 1, 74], [0x1f72, 4, 1, 86], [0x1f76, 2, 1, 100], [0x1f78, 2, 1, 128], [0x1f7a, 2, 1, 112], [0x1f7c, 2, 1, 126], [0x1f80, 8, 1, 8], [0x1f90, 8, 1, 8], [0x1fa0, 8, 1, 8], [0x1fb0, 2, 1, 8], [0x1fb3, 1, 1, 9], [0x1fbe, 1, 1, -37], [0x1fc3, 1, 1, 9], [0x1fd0, 2, 1, 8], [0x1fe0, 2, 1, 8], [0x1fe5, 1, 1, 7], [0x1ff3, 1, 1, 9],
  // U+2170 to U+217F: 1 run.
  [0x2170, 16, 1, -16],
  // U+24D0 to U+24E9: 1 run.
  [0x24d0, 26, 1, -26],
  // U+FF41 to U+FF5A: 1 run.
  [0xff41, 26, 1, -32],
];

/** Expand runs into a lookup table once, on first use. */
function expand(runs: readonly (readonly [number, number, number, number])[]): Map<number, number> {
  // Code point to mapped code point.
  const m = new Map<number, number>();
  // Each run covers `count` characters spaced `step` apart.
  for (const [first, count, step, delta] of runs) for (let k = 0; k < count; k++) m.set(first + k * step, first + k * step + delta);
  // The finished table.
  return m;
}

/** Lazily built lower-case table. */
let lowerTable: Map<number, number> | null = null;
/** Lazily built upper-case table. */
let upperTable: Map<number, number> | null = null;

/** Tcl_UniCharToLower for one 16-bit character (Tcl 8.4.6 tables). */
export function tclToLower(ch: string): string {
  // Build the table on first use.
  if (!lowerTable) lowerTable = expand(LOWER_RUNS);
  // Look the character up; unmapped characters stay as they are.
  const m = lowerTable.get(ch.charCodeAt(0));
  // The mapped character, or the original.
  return m === undefined ? ch : String.fromCharCode(m);
}

/** Tcl_UniCharToUpper for one 16-bit character (Tcl 8.4.6 tables). */
export function tclToUpper(ch: string): string {
  // Build the table on first use.
  if (!upperTable) upperTable = expand(UPPER_RUNS);
  // Look the character up; unmapped characters stay as they are.
  const m = upperTable.get(ch.charCodeAt(0));
  // The mapped character, or the original.
  return m === undefined ? ch : String.fromCharCode(m);
}

/** Map every character of a string (BMP text, one code unit per character). */
export function tclStringToLower(s: string): string {
  // Character by character; Tcl 8.4 case mapping never changes the length.
  let out = "";
  // Walk the code units.
  for (let i = 0; i < s.length; i++) out += tclToLower(s[i]);
  // The mapped string.
  return out;
}

/** Map every character of a string to upper case. */
export function tclStringToUpper(s: string): string {
  // Character by character.
  let out = "";
  // Walk the code units.
  for (let i = 0; i < s.length; i++) out += tclToUpper(s[i]);
  // The mapped string.
  return out;
}
