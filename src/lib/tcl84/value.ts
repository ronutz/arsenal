// ============================================================================
// src/lib/tcl84/value.ts
// ----------------------------------------------------------------------------
// TCL 8.4 VALUES - "everything is a string", with a cache on the side.
//
// A Tcl 8.4 value (a Tcl_Obj) carries up to two representations: its STRING
// and, once a command has needed it, an INTERNAL one (an integer, a double or
// a boolean). Commands convert on demand and keep the result, which Tcl calls
// shimmering. Most of the time the two agree and nobody notices. The places
// where they do not are exactly the surprises the teaching tools explain:
//
//   * a computed number has NO string until something asks for one, and then
//     the string is the canonical form ("0x10" + 0 gives 16, never "0x10");
//   * a computed double keeps all its bits internally but prints only 12
//     significant digits, so 0.1 + 0.2 prints "0.3" yet is not equal to 0.3;
//   * a literal keeps the text it was written with, so "024" compared with a
//     string compares the characters "024", not the number 20.
//
// The conversion rules and the error wording follow tclObj.c in Tcl 8.4.6
// (SetIntFromAny, SetDoubleFromAny, SetBooleanFromAny) on a 64-bit build.
// ============================================================================

import { formatDouble, formatInt, looksLikeBadOctal, readDouble, readInteger, strtodPrefix, isCSpace } from "./numbers";

/** An error raised by a Tcl command, with Tcl 8.4's exact message. */
export class TclError extends Error {
  /** Build the error. */
  constructor(message: string) {
    // Error carries the message.
    super(message);
    // A stable name.
    this.name = "TclError";
  }
}

/**
 * The largest value, in characters, the teaching interpreter will build. Tcl
 * itself has no such limit; this one exists so a loop like
 * `while 1 { append s $s }` stops with a message instead of exhausting the
 * memory of the browser tab (or of a shared server, for tools served by the API).
 */
export const MAX_VALUE_CHARS = 1_000_000;

/** The error raised when a value would grow past MAX_VALUE_CHARS. */
export function tooLarge(): TclError {
  // A clear statement of the tool's own limit (not a Tcl message).
  return new TclError(`value too large for this teaching tool (over ${MAX_VALUE_CHARS} characters)`);
}

/**
 * The message to show for an error raised while running someone's input.
 * JavaScript reports its own limits (call-stack depth, string or array size) as
 * a RangeError with an engine-specific wording; those are turned into one plain
 * sentence. Every other error keeps its message, which is Tcl's wording.
 */
export function errorMessage(e: unknown): string {
  // The engine's own limits.
  if (e instanceof RangeError && /call stack|Invalid (string|array) length|too much recursion/i.test(e.message)) return "the input is too large or nested too deeply for this teaching tool";
  // Anything else.
  return e instanceof Error ? e.message : String(e);
}

/**
 * Refuse an input field longer than a tool accepts. The tools are for teaching
 * and run in the browser (and, for some, behind the API), so each one bounds
 * what it will read; the message names the field and the limit.
 */
export function limitInput(label: string, text: string | undefined, max: number): void {
  // Within the limit (or absent): nothing to do.
  if ((text ?? "").length <= max) return;
  // Too long: a plain message the page and the API both show as it is.
  throw new TclError(`${label} is longer than this tool accepts (${max} characters)`);
}

/** The internal representations a value can hold. */
export type ObjType = "none" | "int" | "double" | "boolean";

/** One Tcl value: a string, an internal representation, or both. */
export class TclObj {
  /** The string representation, or null until one is generated. */
  private str: string | null;
  /** Which internal representation is valid. */
  type: ObjType = "none";
  /** The integer value (type "int"). */
  int = 0n;
  /** The double value (type "double"). */
  dbl = 0;
  /** The boolean value (type "boolean"), 0 or 1. */
  bool = 0;
  /** For a NaN double: the sign bit, which C's printf shows as "-nan". */
  nanNeg = false;

  /** Create a value; pass null only together with an internal representation. */
  private constructor(str: string | null) {
    // Keep the string (or the lack of one).
    this.str = str;
  }

  /** A value that is just a string (a literal, a variable's text). */
  static fromString(s: string): TclObj {
    // No internal representation yet.
    return new TclObj(s);
  }

  /** A computed integer: no string until one is needed. */
  static fromInt(v: bigint): TclObj {
    // A pure integer.
    const o = new TclObj(null);
    // Its type.
    o.type = "int";
    // C long semantics: keep 64 bits.
    o.int = BigInt.asIntN(64, v);
    // Done.
    return o;
  }

  /** A computed double: no string until one is needed (nanNeg: a NaN's sign bit). */
  static fromDouble(v: number, nanNeg = false): TclObj {
    // A pure double.
    const o = new TclObj(null);
    // Its type.
    o.type = "double";
    // The value.
    o.dbl = v;
    // The sign of a NaN (JavaScript cannot be relied on to keep it).
    o.nanNeg = Number.isNaN(v) && nanNeg;
    // Done.
    return o;
  }

  /** True when the value currently has a string representation. */
  hasString(): boolean {
    // Null means none has been generated yet.
    return this.str !== null;
  }

  /** The string representation, generated from the internal one if needed. */
  get string(): string {
    // Generate it on first use, as Tcl_GetStringFromObj does.
    if (this.str === null) this.str = this.type === "int" ? formatInt(this.int) : this.type === "double" ? (Number.isNaN(this.dbl) && this.nanNeg ? "-nan" : formatDouble(this.dbl)) : this.type === "boolean" ? String(this.bool) : "";
    // The (now cached) string.
    return this.str;
  }

  /** Drop the string so it is regenerated canonically (Tcl_InvalidateStringRep). */
  invalidateString(): void {
    // Only values with an internal representation can lose their string.
    if (this.type !== "none") this.str = null;
  }

  /** True for an integer or double internal representation (IS_NUMERIC_TYPE). */
  isNumeric(): boolean {
    // Booleans are deliberately not numeric here, as in tclExecute.c.
    return this.type === "int" || this.type === "double";
  }

  /** A copy that shares nothing (for commands that modify a value). */
  duplicate(): TclObj {
    // Same string, same internal representation.
    const o = new TclObj(this.str);
    // Copy the type.
    o.type = this.type;
    // And each field.
    o.int = this.int;
    // The double.
    o.dbl = this.dbl;
    // The boolean.
    o.bool = this.bool;
    // A NaN's sign.
    o.nanNeg = this.nanNeg;
    // The copy.
    return o;
  }
}

/** The Tcl 8.4 internal UTF-8 bytes of a string (U+0000 is C0 80). */
export function tclUtf8(s: string): number[] {
  // Collected bytes.
  const out: number[] = [];
  // Walk 16-bit characters (callers refuse text beyond the BMP).
  for (let i = 0; i < s.length; i++) {
    // The code unit.
    const c = s.charCodeAt(i);
    // NUL is written as two bytes so C code never sees a terminator.
    if (c === 0) out.push(0xc0, 0x80);
    // ASCII.
    else if (c < 0x80) out.push(c);
    // Two bytes.
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    // Three bytes.
    else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  // The bytes.
  return out;
}

/** Decode bytes the forgiving way Tcl_UtfToUniChar does (a broken sequence is its own byte). */
export function tclFromUtf8(bytes: number[]): string {
  // The decoded text.
  let out = "";
  // Walk the bytes.
  for (let i = 0; i < bytes.length; ) {
    // The lead byte.
    const b = bytes[i];
    // Below 0xC0: the byte stands for itself (ASCII, or a stray trail byte).
    if (b < 0xc0) { out += String.fromCharCode(b); i++; continue; }
    // A two-byte lead with a proper trail byte.
    if (b < 0xe0 && (bytes[i + 1] ?? 0) >> 6 === 2) { out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2; continue; }
    // A three-byte lead with two proper trail bytes.
    if (b >= 0xe0 && b < 0xf0 && (bytes[i + 1] ?? 0) >> 6 === 2 && (bytes[i + 2] ?? 0) >> 6 === 2) { out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)); i += 3; continue; }
    // Anything else: the lead byte represents itself.
    out += String.fromCharCode(b);
    // Next byte.
    i++;
  }
  // The text.
  return out;
}

/** C's "%.Ns" on Tcl's UTF-8: keep at most n BYTES (which can split a character). */
export function truncBytes(s: string, n: number): string {
  // The bytes.
  const bytes = tclUtf8(s);
  // Short enough: unchanged.
  if (bytes.length <= n) return s;
  // Cut and decode as Tcl would display the result.
  return tclFromUtf8(bytes.slice(0, n));
}

/** Tcl_GetIntFromObj / Tcl_GetWideIntFromObj on a 64-bit build. Converts the value in place. */
export function getInt(o: TclObj): bigint {
  // Already an integer.
  if (o.type === "int") return o.int;
  // Parse the string representation.
  const s = o.string;
  // strtoul in base 0, white space allowed around it.
  const r = readInteger(s);
  // Success: cache the integer (shimmer).
  if (r.ok) {
    // Its type.
    o.type = "int";
    // Its value.
    o.int = r.value;
    // The integer.
    return r.value;
  }
  // ERANGE: SetIntFromAny's overflow message.
  if (r.why === "too-large") throw new TclError("integer value too large to represent");
  // Everything else: the generic message, with the octal hint when it applies.
  throw new TclError(`expected integer but got "${truncBytes(s, 50)}"${looksLikeBadOctal(s) ? " (looks like invalid octal number)" : ""}`);
}

/** Like getInt, but reports failure instead of throwing (the NULL-interp calls). */
export function tryInt(o: TclObj): boolean {
  // Attempt the conversion.
  try {
    // Converts in place on success.
    getInt(o);
    // It worked.
    return true;
  } catch {
    // It did not; the value is unchanged.
    return false;
  }
}

/** The message TclExprFloatError gives for a value strtod or a math function produced. */
export function floatErrorMessage(value: number, domain = false): string {
  // NaN, or an argument outside the function's domain.
  if (domain || Number.isNaN(value)) return "domain error: argument not in valid range";
  // A zero result after underflow.
  if (value === 0) return "floating-point value too small to represent";
  // Infinity, or a denormal flagged by ERANGE.
  return "floating-point value too large to represent";
}

/** Tcl_GetDoubleFromObj. Converts the value in place. */
export function getDouble(o: TclObj): number {
  // Already a double.
  if (o.type === "double") return o.dbl;
  // An integer converts directly.
  if (o.type === "int") return Number(o.int);
  // Parse the string representation.
  const s = o.string;
  // strtod, white space allowed after it.
  const r = readDouble(s);
  // Success: cache the double (shimmer).
  if (r.ok) {
    // Its type.
    o.type = "double";
    // Its value.
    o.dbl = r.value;
    // A NaN keeps its sign for printing.
    o.nanNeg = r.nanNegative === true;
    // The double.
    return r.value;
  }
  // ERANGE: TclExprFloatError's wording (a denormal counts as "too large").
  if (r.why === "float-range") throw new TclError(floatErrorMessage(r.denormal ? 1 : strtodPrefix(s).value));
  // Anything else.
  throw new TclError(`expected floating-point number but got "${truncBytes(s, 50)}"`);
}

/** Like getDouble, but reports failure instead of throwing. */
export function tryDouble(o: TclObj): boolean {
  // Attempt the conversion.
  try {
    // Converts in place on success.
    getDouble(o);
    // It worked.
    return true;
  } catch {
    // It did not.
    return false;
  }
}

/** C's strtol(s, &end, 0) on a 64-bit build: returns the value and the end offset. */
function strtol(s: string): { value: bigint; end: number } {
  // p walks the string.
  let p = 0;
  // Leading white space.
  while (p < s.length && isCSpace(s[p])) p++;
  // An optional sign.
  let negative = false;
  // Record and skip it.
  if (s[p] === "+" || s[p] === "-") { negative = s[p] === "-"; p++; }
  // Base 0: hex with 0x and a hex digit, octal with a leading 0, else decimal.
  let base = 10;
  // Hex prefix (needs a digit after it).
  if (s[p] === "0" && (s[p + 1] === "x" || s[p + 1] === "X") && /[0-9a-fA-F]/.test(s[p + 2] ?? "")) { base = 16; p += 2; }
  // Octal.
  else if (s[p] === "0") base = 8;
  // Where the digits start.
  const start = p;
  // The value.
  let v = 0n;
  // Each digit valid in the base.
  for (;;) {
    // The digit's value, or -1.
    const d = s[p] === undefined ? -1 : parseInt(s[p], 16);
    // Stop at the first character that is not a digit of this base.
    if (Number.isNaN(d) || d < 0 || d >= base) break;
    // Accumulate.
    v = v * BigInt(base) + BigInt(d);
    // Next.
    p++;
  }
  // No digits: nothing was converted (end = start of the string).
  if (p === start) return { value: 0n, end: 0 };
  // Clamp as strtol does on overflow (the sign matters only for zero here).
  const signed = negative ? -v : v;
  // The value and where it ended.
  return { value: signed, end: p };
}

/**
 * Tcl_GetBooleanFromObj (SetBooleanFromAny in Tcl 8.4.6). Accepts 0/1, any
 * prefix of yes/no/true/false, on/off (two letters at least), in any case,
 * and any number (non-zero is true). Converts the value in place; throws with
 * Tcl's message when `withMessage` is set.
 */
export function getBoolean(o: TclObj): number {
  // Already a boolean.
  if (o.type === "boolean") return o.bool;
  // Numbers convert directly.
  if (o.type === "int" || o.type === "double") {
    // Non-zero is true.
    const b = o.type === "int" ? (o.int !== 0n ? 1 : 0) : o.dbl !== 0 ? 1 : 0;
    // Cache it.
    o.type = "boolean";
    // The value.
    o.bool = b;
    // Done.
    return b;
  }
  // The string, and its UTF-8 bytes (the C code works on bytes).
  const s = o.string;
  // The bytes.
  const bytes = tclUtf8(s);
  // The failure path.
  const bad = (): never => {
    // Tcl's message, with the string cut at 50 bytes.
    throw new TclError(`expected boolean value but got "${truncBytes(s, 50)}"`);
  };
  // Lower-case the first nine bytes; any non-ASCII byte among them is fatal.
  let lower = "";
  // At most nine.
  for (let i = 0; i < 9 && i < bytes.length; i++) {
    // The byte.
    const b = bytes[i];
    // International characters are refused outright.
    if (b & 0x80) return bad();
    // ASCII upper case to lower case.
    lower += String.fromCharCode(b >= 0x41 && b <= 0x5a ? b + 32 : b);
  }
  // The full length in bytes (strncmp compares up to it).
  const length = bytes.length;
  // strncmp(lower, word, length) == 0, with lower ending in a NUL.
  const prefixOf = (word: string) => {
    // Compare up to `length` characters, treating the ends as NULs.
    for (let i = 0; i < length; i++) {
      // Each side's character, or NUL past its end.
      const a = lower[i] ?? "\0", w = word[i] ?? "\0";
      // A difference fails.
      if (a !== w) return false;
      // Both ended together: equal.
      if (a === "\0") return true;
    }
    // All compared characters matched.
    return true;
  };
  // The first character decides which word to try.
  const c = lower[0] ?? "";
  // The result.
  let b: number;
  // Exactly "0" or "1".
  if (c === "0" && length === 1) b = 0;
  // Exactly "1".
  else if (c === "1" && length === 1) b = 1;
  // A prefix of yes.
  else if (c === "y" && prefixOf("yes")) b = 1;
  // A prefix of no.
  else if (c === "n" && prefixOf("no")) b = 0;
  // A prefix of true.
  else if (c === "t" && prefixOf("true")) b = 1;
  // A prefix of false.
  else if (c === "f" && prefixOf("false")) b = 0;
  // "on" or a prefix of "off", two letters at least.
  else if (c === "o" && length >= 2) {
    // on.
    if (prefixOf("on")) b = 1;
    // off.
    else if (prefixOf("off")) b = 0;
    // Neither.
    else return bad();
  } else {
    // Numbers: strtol first, then strtod; only white space may follow.
    const l = strtol(s);
    // strtol consumed something.
    if (l.end > 0) {
      // Skip trailing white space.
      let e = l.end;
      // Spaces only.
      while (e < s.length && isCSpace(s[e])) e++;
      // A whole integer: non-zero is true.
      if (e === s.length) {
        // Cache it.
        o.type = "boolean";
        // The value.
        o.bool = l.value !== 0n ? 1 : 0;
        // Done.
        return o.bool;
      }
    }
    // strtod (glibc), ERANGE ignored here.
    const d = strtodPrefix(s, 0);
    // Nothing converted.
    if (d.length === 0) return bad();
    // Skip trailing white space.
    let e = d.length;
    // Spaces only.
    while (e < s.length && isCSpace(s[e])) e++;
    // Garbage after the number.
    if (e !== s.length) return bad();
    // Non-zero is true (NaN counts as non-zero, as in C).
    b = d.value !== 0 ? 1 : 0;
  }
  // Cache the boolean (shimmer).
  o.type = "boolean";
  // Its value.
  o.bool = b;
  // Done.
  return b;
}

/** Like getBoolean, but reports failure instead of throwing. */
export function tryBoolean(o: TclObj): boolean {
  // Attempt the conversion.
  try {
    // Converts in place on success.
    getBoolean(o);
    // It worked.
    return true;
  } catch {
    // It did not.
    return false;
  }
}
