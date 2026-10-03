// ============================================================================
// src/lib/tcl84/numbers.ts
// ----------------------------------------------------------------------------
// HOW TCL 8.4 READS A NUMBER, reproduced for the teaching tools.
//
// F5 states that the iRules command set "was developed from Tcl base version
// 8.4.6, which is used in all BIG-IP versions" (K6091). So the question every
// iRule writer eventually needs answered - "is this a number, and which one?" -
// has an exact answer: whatever Tcl 8.4.6 does. This module answers it the same
// way, and it was checked against a real Tcl 8.4.6 interpreter built from the
// tcltk/tcl tag core-8-4-6 (see the golden vectors of the tools that use it).
//
// The rules, from the 8.4.6 C sources (tclUtil.c TclLooksLikeInt,
// tclParseExpr.c TclParseInteger, tclObj.c SetIntFromAny / SetDoubleFromAny,
// tclExecute.c's comparison and arithmetic instructions):
//
//   * A value is tried as an INTEGER first, but only if it "looks like" one:
//     optional white space, an optional sign, then digits (or 0x and a hex
//     digit) that are NOT followed by ".", "e" or "E". The integer itself is
//     read with C's strtoul in base 0: "0x" means hexadecimal, a leading "0"
//     means OCTAL, anything else is decimal. Trailing white space is allowed;
//     anything else after the digits makes it not an integer.
//   * "08" looks like an integer but is not a valid octal number, and Tcl does
//     NOT then retry it as a floating-point number. That single rule is why
//     "08" + 1 is an error while "08" == "8" quietly compares two strings.
//   * Anything that does not look like an integer is tried as a FLOATING-POINT
//     number with C's strtod (decimal digits, a point, an exponent).
//   * Floating-point results are printed with 12 significant digits (Tcl 8.4's
//     default tcl_precision), and always carry a "." or an "e" so they never
//     look like integers.
//
// WHAT DEPENDS ON THE C LIBRARY: Tcl 8.4 hands floating-point text to C's
// strtod, so "inf", "nan" and hexadecimal floating point ("0x1p3") mean
// whatever the platform's C library says. The reference interpreter these
// modules are tested against runs on Linux with glibc, and strtodPrefix below
// reproduces glibc's reading; every value read that way is FLAGGED (`special`)
// so a tool can say that another C library may differ.
// ============================================================================

/** The largest signed 64-bit integer, the limit of a long on a 64-bit BIG-IP. */
export const INT64_MAX = 9223372036854775807n;
/** The smallest signed 64-bit integer. */
export const INT64_MIN = -9223372036854775808n;

/** A number as Tcl holds it internally: an integer or a double. */
export type TclNumber =
  // An integer, with the base its written form used (8, 10 or 16), and
  // whether the platform's unsigned conversion wrapped it into a negative.
  | { kind: "int"; value: bigint; base: 8 | 10 | 16; wrapped?: boolean }
  // A floating-point value (a C double).
  | { kind: "double"; value: number };

/** Why a string is not a usable number. */
export type NotNumberReason =
  // The string is empty; Tcl never treats "" as a number.
  | "empty"
  // It looks like an integer but has an 8 or 9 after a leading 0.
  | "invalid-octal"
  // It looks like an integer but has characters after the digits.
  | "int-garbage"
  // It looks like an integer but is outside the signed 64-bit range.
  | "too-large"
  // It is neither an integer nor a decimal floating-point number.
  | "not-numeric"
  // Reserved: a form whose meaning depends on the C library and that a caller
  // chooses not to model (readDouble itself now follows glibc and flags it).
  | "platform"
  // It is a decimal number that overflows or underflows a double.
  | "float-range";

/** The outcome of reading a string as a number. */
export type NumberRead =
  // A number was read.
  | { ok: true; num: TclNumber }
  // No number: the reason says which rule stopped it.
  | { ok: false; why: NotNumberReason };

/** The six characters C's isspace() accepts in the "C" locale. */
const C_SPACE = new Set([" ", "\t", "\n", "\v", "\f", "\r"]);

/** True when ch is white space as C's isspace() sees it. */
export function isCSpace(ch: string): boolean {
  // Membership in the fixed six-character set is the whole test.
  return C_SPACE.has(ch);
}

/** True for an ASCII decimal digit. */
function isDigit(ch: string | undefined): boolean {
  // Undefined (past the end) is never a digit.
  return ch !== undefined && ch >= "0" && ch <= "9";
}

/** True for an ASCII hexadecimal digit. */
function isHexDigit(ch: string | undefined): boolean {
  // Accept 0-9, a-f and A-F, the set C's isxdigit() accepts.
  return ch !== undefined && /^[0-9a-fA-F]$/.test(ch);
}

/**
 * TclParseInteger from tclParseExpr.c: how many characters at `start` form an
 * integer prefix, or 0 when the text does not start like an integer at all.
 * The quirk worth knowing: "0x" with no hex digit still counts the "0" (1).
 */
export function integerPrefixLength(s: string, start = 0): number {
  // p walks the string from the start position.
  let p = start;
  // An introductory "0x" or "0X" switches to hexadecimal.
  if (s.length - p > 1 && s[p] === "0" && (s[p + 1] === "x" || s[p + 1] === "X")) {
    // Count the hex digits after the prefix.
    let q = p + 2;
    // Consume every hex digit.
    while (isHexDigit(s[q])) q++;
    // With at least one hex digit the whole run is the integer.
    if (q > p + 2) return q - start;
    // Without one, only the "0" is an integer and the "x" is left behind.
    return 1;
  }
  // Otherwise count decimal digits (octal validity is checked later, not here).
  while (isDigit(s[p])) p++;
  // At the end of the text, the digits are the integer.
  if (p >= s.length) return p - start;
  // A following ".", "e" or "E" means this is a floating-point number instead.
  if (s[p] !== "." && s[p] !== "e" && s[p] !== "E") return p - start;
  // So it is not an integer prefix at all.
  return 0;
}

/**
 * TclLooksLikeInt from tclUtil.c: white space, an optional sign, then an
 * integer prefix. Note that "12abc" LOOKS like an integer (the prefix is
 * "12"); converting it then fails, and Tcl does not fall back to a double.
 */
export function looksLikeInt(s: string): boolean {
  // Skip leading white space.
  let p = 0;
  // C isspace() decides what counts as space.
  while (p < s.length && isCSpace(s[p])) p++;
  // Nothing but space is not an integer.
  if (p >= s.length) return false;
  // One sign character is allowed.
  if (s[p] === "+" || s[p] === "-") p++;
  // The rest must start with an integer prefix.
  return integerPrefixLength(s, p) > 0;
}

/** The result of reading a string strictly as an integer. */
export type IntRead =
  // The integer, the base of its written form, and whether C's unsigned
  // conversion wrapped it (a magnitude between 2^63 and 2^64-1 comes back as
  // a negative long on a 64-bit platform, silently).
  | { ok: true; value: bigint; base: 8 | 10 | 16; wrapped: boolean }
  // Why it is not one.
  | { ok: false; why: "not-integer" | "invalid-octal" | "too-large" };

/** 2^64 - 1, the largest value C's strtoul returns without ERANGE. */
const UINT64_MAX = 18446744073709551615n;

/**
 * TclCheckBadOctal from tclUtil.c: does this string look like an octal number
 * that contains an 8 or a 9 (a leading 0, then only digits, then only space)?
 * Tcl uses it to append "(looks like invalid octal number)" to error messages.
 */
export function looksLikeBadOctal(s: string): boolean {
  // Skip leading white space.
  let p = 0;
  // C isspace() decides what counts as space.
  while (p < s.length && isCSpace(s[p])) p++;
  // An optional sign.
  if (s[p] === "+" || s[p] === "-") p++;
  // It must start with 0 to look octal.
  if (s[p] !== "0") return false;
  // Skip every digit (8 and 9 included: that is the point).
  while (isDigit(s[p])) p++;
  // Then trailing white space.
  while (p < s.length && isCSpace(s[p])) p++;
  // Reaching the end means it looked like a (bad) octal number.
  return p >= s.length;
}

/**
 * Read a string as Tcl 8.4's SetIntFromAny does on a 64-bit platform: C's
 * strtoul in base 0 (0x = hex, leading 0 = octal, otherwise decimal), leading
 * and trailing white space allowed, an optional sign, and nothing else.
 */
export function readInteger(s: string): IntRead {
  // p walks the string.
  let p = 0;
  // strtoul skips leading white space.
  while (p < s.length && isCSpace(s[p])) p++;
  // An optional sign; strtoul negates the unsigned result.
  let negative = false;
  // Record and skip the sign.
  if (s[p] === "+" || s[p] === "-") {
    // A minus makes the value negative.
    negative = s[p] === "-";
    // Step past the sign.
    p++;
  }
  // The digits and the base they are read in.
  let digits = "";
  // Base 10 unless a prefix says otherwise.
  let base: 8 | 10 | 16 = 10;
  // Hexadecimal: "0x" followed by at least one hex digit.
  if (s[p] === "0" && (s[p + 1] === "x" || s[p + 1] === "X") && isHexDigit(s[p + 2])) {
    // Read in base 16.
    base = 16;
    // Skip the prefix.
    p += 2;
    // Collect every hex digit.
    while (isHexDigit(s[p])) digits += s[p++];
  } else if (s[p] === "0") {
    // A leading zero means octal; the zero itself is a valid octal digit.
    base = 8;
    // Collect octal digits only; an 8 or 9 stops the scan (and is garbage).
    while (s[p] !== undefined && s[p] >= "0" && s[p] <= "7") digits += s[p++];
  } else {
    // Decimal digits.
    while (isDigit(s[p])) digits += s[p++];
  }
  // No digits at all: strtoul consumed nothing, so this is not an integer.
  if (digits === "") return { ok: false, why: looksLikeBadOctal(s) ? "invalid-octal" : "not-integer" };
  // Convert the digits in their base (BigInt keeps every digit exact).
  const prefix = base === 16 ? "0x" : base === 8 ? "0o" : "";
  // An all-zero octal run like "0" or "000" is simply zero.
  const magnitude = BigInt(prefix + (base === 8 ? digits.replace(/^0+(?=.)/, "") : digits));
  // Above 2^64 - 1, strtoul reports ERANGE; SetIntFromAny checks that BEFORE
  // looking for garbage, so "99999999999999999999x" is "too large", not "not an integer".
  if (magnitude > UINT64_MAX) return { ok: false, why: "too-large" };
  // Trailing white space is allowed.
  while (p < s.length && isCSpace(s[p])) p++;
  // Anything else after the digits makes the whole string not an integer.
  if (p < s.length) return { ok: false, why: looksLikeBadOctal(s) ? "invalid-octal" : "not-integer" };
  // strtoul negates in unsigned arithmetic; the cast to long then wraps.
  const exact = negative ? -magnitude : magnitude;
  // Two's-complement truncation to 64 bits is what the cast does.
  const value = BigInt.asIntN(64, exact);
  // Apply the sign, recording whether the platform silently wrapped it.
  return { ok: true, value, base, wrapped: value !== exact };
}

/** The result of reading a string strictly as a double. */
export type DoubleRead =
  // The value; `special` marks text whose reading is the C library's choice
  // (glibc reads "inf"/"infinity", "nan" and hexadecimal floating point).
  | { ok: true; value: number; special?: "inf" | "nan" | "hex"; nanNegative?: boolean }
  // Why it is not one. `denormal` marks an underflow that still produced a
  // non-zero value: Tcl_GetDouble accepts it, SetDoubleFromAny does not.
  | { ok: false; why: "not-numeric" | "platform" | "float-range"; denormal?: boolean };

/** The smallest positive normal double; below it glibc's strtod reports ERANGE. */
const MIN_NORMAL = 2.2250738585072014e-308;

/** What C's strtod did with the text at a position (glibc semantics). */
export interface StrtodPrefix {
  // Characters consumed from the start position (0 = no conversion).
  length: number;
  // The value (meaningless when length is 0).
  value: number;
  // True when strtod would set errno to ERANGE (overflow, or underflow).
  erange: boolean;
  // Set for the forms whose reading is up to the C library.
  special?: "inf" | "nan" | "hex";
  // For NaN: whether the sign bit is set (glibc prints such a NaN as "-nan").
  nanNegative?: boolean;
}

/** 2^k for any integer k, exactly (splitting the exponent so no step overflows). */
function pow2(k: number): number {
  // Math.pow(2, k) is exact for -1074 <= k <= 1023; split larger magnitudes.
  if (k > 1023) return pow2(k - 1023) * 2 ** 1023;
  // The negative side, split the same way.
  if (k < -1074) return pow2(k + 1074) * 2 ** -1074;
  // Within range: exact.
  return 2 ** k;
}

/**
 * Round mantissa x 2^exp2 to the nearest double, ties to even, the way a
 * correctly rounded strtod does; reports overflow and inexact underflow.
 */
function roundBinary(mant: bigint, exp2: number, negative: boolean): { value: number; erange: boolean } {
  // A zero mantissa is an exact zero.
  if (mant === 0n) return { value: negative ? -0 : 0, erange: false };
  // Number of significant bits.
  const bits = mant.toString(2).length;
  // Exponent of the leading bit: value is in [2^E, 2^(E+1)).
  let E = bits - 1 + exp2;
  // Bits a double can hold at this exponent (53, fewer for denormals).
  const precision = E >= -1022 ? 53 : Math.max(0, E + 1075);
  // How many low bits must go.
  const drop = bits - precision;
  // The kept mantissa and whether anything non-zero was dropped.
  let kept = mant;
  // True when the rounding was inexact.
  let inexact = false;
  // Round when bits have to go.
  if (drop > 0) {
    // The dropped part.
    const rem = mant & ((1n << BigInt(drop)) - 1n);
    // Half of the dropped part's weight.
    const half = 1n << BigInt(drop - 1);
    // The kept part.
    kept = mant >> BigInt(drop);
    // Inexact when anything was dropped.
    inexact = rem !== 0n;
    // Round up above half, or at exactly half when the kept part is odd.
    if (rem > half || (rem === half && (kept & 1n) === 1n)) kept += 1n;
  }
  // The exponent of the kept mantissa's last bit.
  const scale = exp2 + Math.max(0, drop);
  // The magnitude (exact: kept has at most 54 bits after a carry).
  const magnitude = Number(kept) * pow2(scale);
  // Recompute the leading exponent after a possible carry.
  E = kept === 0n ? -Infinity : kept.toString(2).length - 1 + scale;
  // Beyond the largest double: overflow to infinity with ERANGE.
  if (E > 1023 || !Number.isFinite(magnitude)) return { value: negative ? -Infinity : Infinity, erange: true };
  // A denormal or zero result that lost bits is an underflow.
  const erange = inexact && magnitude < MIN_NORMAL;
  // The signed result.
  return { value: negative ? -magnitude : magnitude, erange };
}

/**
 * C's strtod on the text at `start`, with glibc's rules: leading white space,
 * a sign, then "inf"/"infinity", "nan" (optionally "nan(chars)"), a
 * hexadecimal form ("0x1.8p3"), or a decimal form. Returns how many characters
 * were consumed (0 when none), the value, and whether ERANGE would be set.
 */
export function strtodPrefix(s: string, start = 0): StrtodPrefix {
  // p walks the text.
  let p = start;
  // White space is skipped first.
  while (p < s.length && isCSpace(s[p])) p++;
  // Where the number text (sign included) begins.
  const numStart = p;
  // An optional sign.
  let negative = false;
  // Record and skip it.
  if (s[p] === "+" || s[p] === "-") {
    // Minus makes the value negative.
    negative = s[p] === "-";
    // Step past the sign.
    p++;
  }
  // The next few characters, lower-cased, for the word forms.
  const word = s.slice(p, p + 8).toLowerCase();
  // "inf" or "infinity".
  if (word.startsWith("inf")) {
    // The long spelling is consumed whole when present.
    const len = word === "infinity" ? 8 : 3;
    // An infinity, without ERANGE.
    return { length: p + len - start, value: negative ? -Infinity : Infinity, erange: false, special: "inf" };
  }
  // "nan", optionally followed by "(" alphanumerics ")".
  if (word.startsWith("nan")) {
    // After the word.
    let q = p + 3;
    // The optional parenthesised tail.
    if (s[q] === "(") {
      // Scan its characters.
      let r = q + 1;
      // Letters, digits and underscores only.
      while (r < s.length && /[A-Za-z0-9_]/.test(s[r])) r++;
      // Consumed only when properly closed.
      if (s[r] === ")") q = r + 1;
    }
    // Not a number, without ERANGE (its sign is kept for printing).
    return { length: q - start, value: NaN, erange: false, special: "nan", nanNegative: negative };
  }
  // Hexadecimal floating point: 0x, hex digits with an optional point, an optional p exponent.
  if (s[p] === "0" && (s[p + 1] === "x" || s[p + 1] === "X")) {
    // After the prefix.
    let q = p + 2;
    // The mantissa as an exact integer.
    let mant = 0n;
    // Hex digits seen, and how many came after the point.
    let digits = 0, fracDigits = 0;
    // Whether the point was seen.
    let point = false;
    // Read digits and at most one point.
    for (;;) {
      // A hex digit.
      if (isHexDigit(s[q])) {
        // Accumulate it.
        mant = mant * 16n + BigInt(parseInt(s[q], 16));
        // Count it.
        digits++;
        // Track fraction digits.
        if (point) fracDigits++;
        // Next.
        q++;
      } else if (s[q] === "." && !point) {
        // The radix point.
        point = true;
        // Next.
        q++;
      } else break;
    }
    // Without a hex digit only the "0" is a number (decimal zero).
    if (digits === 0) return { length: p + 1 - start, value: negative ? -0 : 0, erange: false };
    // The binary exponent, when "p" and digits follow.
    let exp = 0;
    // Look for it.
    if (s[q] === "p" || s[q] === "P") {
      // After the marker.
      let r = q + 1;
      // Its sign.
      let eneg = false;
      // Record and skip it.
      if (s[r] === "+" || s[r] === "-") { eneg = s[r] === "-"; r++; }
      // Digits are required for the exponent to count.
      if (isDigit(s[r])) {
        // Accumulate, saturating so absurd exponents stay finite numbers.
        let e = 0;
        // Each digit.
        while (isDigit(s[r])) { e = Math.min(1e6, e * 10 + (s.charCodeAt(r) - 48)); r++; }
        // Apply the sign.
        exp = eneg ? -e : e;
        // The exponent belongs to the number.
        q = r;
      }
    }
    // Round mantissa x 2^(exp - 4 x fraction digits).
    const rb = roundBinary(mant, exp - 4 * fracDigits, negative);
    // The hexadecimal reading.
    return { length: q - start, value: rb.value, erange: rb.erange, special: "hex" };
  }
  // Decimal: mantissa digits before and after the point.
  let mantissaDigits = 0;
  // Integer-part digits.
  while (isDigit(s[p])) { mantissaDigits++; p++; }
  // An optional point and fraction digits.
  if (s[p] === ".") {
    // Step past the point.
    p++;
    // Fraction digits.
    while (isDigit(s[p])) { mantissaDigits++; p++; }
  }
  // strtod needs at least one mantissa digit.
  if (mantissaDigits === 0) return { length: 0, value: 0, erange: false };
  // An exponent is consumed only when digits follow "e", "e+" or "e-".
  if (s[p] === "e" || s[p] === "E") {
    // Past the marker and an optional sign.
    let q = p + 1;
    // Skip the exponent sign.
    if (s[q] === "+" || s[q] === "-") q++;
    // Digits make it a real exponent.
    if (isDigit(s[q])) {
      // Consume them.
      while (isDigit(s[q])) q++;
      // The exponent belongs to the number.
      p = q;
    }
  }
  // The text strtod converts (sign included).
  const text = s.slice(numStart, p);
  // JavaScript's conversion is correctly rounded, as glibc's is.
  const value = Number(text);
  // Overflow to infinity sets ERANGE.
  if (!Number.isFinite(value)) return { length: p - start, value, erange: true };
  // Non-zero digits in the mantissa (underflow to zero needs them).
  const nonZero = /[1-9]/.test(text.replace(/[eE].*$/, ""));
  // A denormal, or zero from non-zero digits, is an underflow.
  const erange = (value !== 0 && Math.abs(value) < MIN_NORMAL) || (value === 0 && nonZero);
  // The decimal reading.
  return { length: p - start, value, erange };
}

/**
 * Read a string as Tcl 8.4's SetDoubleFromAny does: C's strtod, then only
 * white space may follow, and an ERANGE result is refused. "inf", "nan" and
 * hexadecimal floating point are read as glibc reads them and flagged.
 */
export function readDouble(s: string): DoubleRead {
  // What strtod consumes from the start.
  const r = strtodPrefix(s, 0);
  // Nothing consumed: not a number at all.
  if (r.length === 0) return { ok: false, why: "not-numeric" };
  // Trailing white space is allowed.
  let p = r.length;
  // Skip it.
  while (p < s.length && isCSpace(s[p])) p++;
  // Anything else means the whole string is not a double.
  if (p < s.length) return { ok: false, why: "not-numeric" };
  // ERANGE: overflow, or underflow (a denormal keeps its value but is refused).
  if (r.erange) return Number.isFinite(r.value) && r.value !== 0 ? { ok: false, why: "float-range", denormal: true } : { ok: false, why: "float-range" };
  // A usable double (possibly flagged as a C-library reading).
  return r.special ? { ok: true, value: r.value, special: r.special, nanNegative: r.nanNegative } : { ok: true, value: r.value };
}

/**
 * How Tcl 8.4's comparison and arithmetic instructions read an operand: an
 * empty string is never a number; a string that looks like an integer is read
 * ONLY as an integer; anything else is tried as a double.
 */
export function readNumber(s: string): NumberRead {
  // Empty strings are compared as strings and rejected by arithmetic.
  if (s === "") return { ok: false, why: "empty" };
  // The integer path is taken whenever the text looks like an integer.
  if (looksLikeInt(s)) {
    // Read it strictly.
    const r = readInteger(s);
    // Success: an integer with its written base.
    if (r.ok) return { ok: true, num: { kind: "int", value: r.value, base: r.base, wrapped: r.wrapped } };
    // An integer-looking value that fails is NOT retried as a double.
    return { ok: false, why: r.why === "invalid-octal" ? "invalid-octal" : r.why === "too-large" ? "too-large" : "int-garbage" };
  }
  // Otherwise try the floating-point path.
  const d = readDouble(s);
  // Success: a double.
  if (d.ok) return { ok: true, num: { kind: "double", value: d.value } };
  // Carry the floating-point failure reason.
  return { ok: false, why: d.why };
}

/**
 * The exact decimal value of a finite double, as digits and a scale:
 * |d| = digits x 10^-scale. Every double is a dyadic rational, so this is
 * exact; it is what lets formatDouble round ties the way C's printf does.
 */
function exactDecimal(d: number): { digits: bigint; scale: number } {
  // Read the IEEE-754 bit pattern.
  const view = new DataView(new ArrayBuffer(8));
  // Store the magnitude; the sign is handled by the caller.
  view.setFloat64(0, Math.abs(d));
  // The 64-bit pattern as an unsigned BigInt.
  const bits = view.getBigUint64(0);
  // The 11-bit biased exponent.
  const biased = Number((bits >> 52n) & 0x7ffn);
  // The 52-bit fraction.
  const fraction = bits & 0xfffffffffffffn;
  // Normal numbers carry an implicit leading 1; denormals do not.
  const mantissa = biased === 0 ? fraction : fraction | 0x10000000000000n;
  // The binary exponent so that |d| = mantissa x 2^exp2.
  const exp2 = (biased === 0 ? 1 : biased) - 1075;
  // A non-negative exponent gives an exact integer.
  if (exp2 >= 0) return { digits: mantissa << BigInt(exp2), scale: 0 };
  // A negative exponent: m / 2^k = m x 5^k / 10^k, exact in decimal.
  const k = -exp2;
  // Multiply by 5^k and keep k decimal places.
  return { digits: mantissa * 5n ** BigInt(k), scale: k };
}

/**
 * Format a double the way Tcl 8.4 prints it: C's "%.12g" (tcl_precision 12),
 * then ".0" appended when the text would otherwise look like an integer.
 * Rounding is done on the EXACT binary value with ties to even, which is what
 * glibc's printf does and what JavaScript's toPrecision does not.
 */
export function formatDouble(d: number): string {
  // The precision Tcl 8.4 uses by default.
  const P = 12;
  // Infinities and NaN print as C's %g spells them; Tcl adds no ".0" because
  // the text already contains letters (Tcl_PrintDouble). `scan` can produce
  // these from input such as 1e999; expr reports an overflow error instead.
  if (!Number.isFinite(d)) return Number.isNaN(d) ? "nan" : d > 0 ? "inf" : "-inf";
  // Zero (and negative zero, which keeps its sign) prints as 0.0 / -0.0.
  if (d === 0) return Object.is(d, -0) ? "-0.0" : "0.0";
  // Sign prefix.
  const sign = d < 0 ? "-" : "";
  // The exact decimal expansion of the magnitude.
  const { digits, scale } = exactDecimal(d);
  // All significant digits as text (no leading zeros for a non-zero value).
  const all = digits.toString();
  // Decimal exponent of the leading digit: |d| = a.bcd... x 10^X.
  let X = all.length - 1 - scale;
  // Keep P significant digits.
  let kept = BigInt(all.slice(0, P).padEnd(P, "0"));
  // The digits that are cut off decide the rounding.
  const cut = all.length > P ? all.slice(P) : "";
  // Round half to even on the exact remainder.
  if (cut !== "") {
    // The first cut digit and whether anything non-zero follows it.
    const first = cut.charCodeAt(0) - 48;
    // Any non-zero digit after the first one makes it more than a tie.
    const tail = /[1-9]/.test(cut.slice(1));
    // Above half, or exactly half with an odd last kept digit, rounds up.
    if (first > 5 || (first === 5 && (tail || kept % 2n === 1n))) kept += 1n;
  }
  // A carry can add a digit (9.99...9 -> 10.00...0): shift and bump X.
  if (kept.toString().length > P) {
    // Drop the extra trailing zero.
    kept /= 10n;
    // The value is now one decade larger.
    X += 1;
  }
  // The P significant digits as text.
  const sig = kept.toString();
  // %g picks scientific style when X < -4 or X >= P.
  if (X < -4 || X >= P) {
    // Mantissa: first digit, point, the rest without trailing zeros.
    const frac = sig.slice(1).replace(/0+$/, "");
    // Exponent with a sign and at least two digits.
    const ex = (X < 0 ? "-" : "+") + String(Math.abs(X)).padStart(2, "0");
    // Scientific text already contains an "e", so no ".0" is added.
    return `${sign}${sig[0]}${frac ? "." + frac : ""}e${ex}`;
  }
  // Fixed style: place the decimal point after X+1 digits.
  let text: string;
  // Non-negative exponent: integer part then fraction.
  if (X >= 0) {
    // The integer part is the first X+1 significant digits.
    const intPart = sig.slice(0, X + 1);
    // The fraction is the rest, trailing zeros removed.
    const fracPart = sig.slice(X + 1).replace(/0+$/, "");
    // Join with a point only when a fraction remains.
    text = fracPart ? `${intPart}.${fracPart}` : intPart;
  } else {
    // Negative exponent: leading zeros after "0.".
    text = `0.${"0".repeat(-X - 1)}${sig.replace(/0+$/, "")}`;
  }
  // Tcl appends ".0" so a double never prints like an integer.
  return sign + (text.includes(".") ? text : `${text}.0`);
}

/** Format an integer as Tcl prints a computed integer: plain decimal. */
export function formatInt(v: bigint): string {
  // BigInt's decimal rendering is exactly C's "%ld".
  return v.toString();
}

/** Format any Tcl number in its canonical printed form. */
export function formatNumber(n: TclNumber): string {
  // Integers print in decimal regardless of how they were written.
  return n.kind === "int" ? formatInt(n.value) : formatDouble(n.value);
}

/** Wrap a mathematically exact integer to signed 64 bits, as C long arithmetic does. */
export function wrapInt64(v: bigint): bigint {
  // BigInt.asIntN performs two's-complement truncation.
  return BigInt.asIntN(64, v);
}

/** True when an exact integer result would not fit in a signed 64-bit long. */
export function overflowsInt64(v: bigint): boolean {
  // Outside [INT64_MIN, INT64_MAX] the C result silently wraps.
  return v > INT64_MAX || v < INT64_MIN;
}

/** Render an integer in a given base, for the notation converter. */
export function intInBase(v: bigint, base: 2 | 8 | 10 | 16): string {
  // Work on the magnitude and add the sign back.
  const neg = v < 0n;
  // BigInt.toString handles every base exactly.
  const digits = (neg ? -v : v).toString(base);
  // Prefix the sign for negative values.
  return neg ? `-${digits}` : digits;
}

/**
 * The noun Tcl 8.4 uses when an operand cannot be used by an arithmetic
 * operator, mirroring IllegalExprOperandType in tclExecute.c line by line:
 * "can't use <noun> as operand of "<op>"". Floating-point text is judged by
 * strtodPrefix, i.e. as glibc's strtod reads it.
 */
export function operandNoun(s: string): string {
  // An empty operand has its own wording.
  if (s === "") return "empty string";
  // Exactly "nan" or "inf" in any case get special wording.
  if (s.length === 3) {
    // Lower-case for the comparison.
    const l = s.toLowerCase();
    // Not-a-number.
    if (l === "nan") return "non-numeric floating-point value";
    // Infinity.
    if (l === "inf") return "infinite floating-point value";
  }
  // Mirror the C: p walks the string, len counts what is left.
  let p = 0;
  // Remaining length.
  let len = s.length;
  // Whether the operand "looks formally like" an integer.
  let looksInt = false;
  // Skip leading white space.
  while (len && isCSpace(s[p])) { len--; p++; }
  // One sign.
  if (len && (s[p] === "+" || s[p] === "-")) { len--; p++; }
  // Only when something is left is the shape examined.
  if (len) {
    // Hexadecimal shape: 0x then at least one hex digit.
    if (s[p] === "0" && (s[p + 1] === "x" || s[p + 1] === "X")) {
      // Skip the prefix.
      p += 2; len -= 2;
      // A hex digit must follow.
      looksInt = len > 0 && isHexDigit(s[p]);
      // Consume the hex run.
      if (looksInt) { len--; p++; while (len && isHexDigit(s[p])) { len--; p++; } }
    } else {
      // Decimal shape: at least one digit.
      looksInt = len > 0 && isDigit(s[p]);
      // Consume the digit run.
      if (looksInt) { len--; p++; while (len && isDigit(s[p])) { len--; p++; } }
    }
    // Trailing white space.
    while (len && isCSpace(s[p])) { len--; p++; }
    // As in the C, this final test OVERRIDES the shape test above.
    looksInt = len === 0;
  }
  // Integer-shaped but unusable: a bad octal, or too large.
  if (looksInt) return looksLikeBadOctal(s) ? "invalid octal number" : "integer value too large to represent";
  // Tcl_GetDouble: strtod (glibc's reading of inf, nan and hex included).
  const d = readDouble(s);
  // A valid double here (Tcl_GetDouble also accepts a denormal) means the
  // value is floating-point but could not be used by this operator.
  if (d.ok || d.denormal) return "floating-point value";
  // Everything else.
  return "non-numeric string";
}
