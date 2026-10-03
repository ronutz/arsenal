// ============================================================================
// src/lib/tcl84/scan.ts
// ----------------------------------------------------------------------------
// TCL 8.4 `scan` - parse a string against a format, sscanf-style, with a trace
// of what every directive consumed. This is the engine behind the scan
// explainer.
//
// The rules (Tcl_ScanObjCmd, ValidateFormat and BuildCharSet in tclScan.c,
// Tcl 8.4.6, checked against the real interpreter):
//   * white space in the format matches any amount of white space in the
//     input, including none;
//   * any other format character must match the input exactly;
//   * every conversion except %c, %[...] and %n first skips white space;
//   * %d reads decimal, %o octal, %x hex, %i lets the prefix decide (0x hex,
//     leading 0 octal) - so "08" under %i reads just "0", while %d reads 8;
//   * %s reads up to white space; %[chars] / %[^chars] read a run of
//     characters in / not in the set; %c reads ONE character and returns its
//     code; %n stores how far into the input scanning has got, counted in
//     BYTES of Tcl's internal UTF-8 (so it differs from the character count
//     as soon as the input has a non-ASCII character);
//   * a width limits how many characters a conversion may read; "*" reads
//     without storing; "%2$d" assigns to the second variable (XPG3 style);
//   * the result is the number of variables assigned, or -1 when the input
//     ran out before the first conversion; with no variable names, scan
//     returns the values as a list instead.
//
// Integers follow C's strtol/strtoul on a 64-bit Linux build, the reference
// this engine is tested against, and then a quirk of Tcl 8.4.6 itself: a
// value from 0 to 4294967295 is stored through a C `int`, so 3000000000
// comes back as -1294967296. Values outside the 32-bit range depend on the
// platform Tcl was built for; the trace flags them so the tool can say so.
// ============================================================================

import { formatDouble } from "./numbers";
import { assertBmp, isUniSpace, strByteLength } from "./strings";
import { formatList } from "./list";

/** A scan that cannot run, with Tcl 8.4's own message. */
export class TclScanError extends Error {
  /** Build the error. */
  constructor(message: string) {
    // Error carries the message.
    super(message);
    // A stable name.
    this.name = "TclScanError";
  }
}

/** A %[...] character set: single characters and inclusive ranges. */
export interface ScanSet {
  // True for %[^...]: the set matches characters NOT listed.
  exclude: boolean;
  // Characters listed one by one.
  chars: string[];
  // Inclusive [low, high] ranges (reversed ranges are normalised).
  ranges: [string, string][];
}

/** One parsed format directive, for display and execution. */
export interface ScanDirective {
  // "space" (one white-space character), "literal" (one character), or "conv".
  kind: "space" | "literal" | "conv";
  // The format text of this directive.
  text: string;
  // Offset in the format where it starts.
  start: number;
  // Conversion letter (conv only): d i o x u f e g s c [ n.
  conv?: string;
  // True for "%*..." (read but do not store).
  suppress?: boolean;
  // Field width, 0 when none.
  width?: number;
  // True when digits for a width were written, even "0" (which %c refuses).
  hasWidth?: boolean;
  // XPG position (1-based) when written as %n$.
  xpg?: number;
  // The 0-based result slot a storing conversion writes.
  slot?: number;
  // For %[...]: the set, exactly as BuildCharSet builds it.
  set?: ScanSet;
  // For a literal: the character to match.
  literal?: string;
}

/** What one directive did when run against the input. */
export interface ScanStep {
  // The directive.
  directive: ScanDirective;
  // Input offset (characters) before the directive ran.
  inputStart: number;
  // Input offset where its value text started (after any skipped space).
  valueStart: number;
  // Input offset after it ran.
  inputEnd: number;
  // "matched" | "assigned" | "suppressed" | "stopped" | "out-of-input".
  outcome: "matched" | "assigned" | "suppressed" | "stopped" | "out-of-input";
  // The value produced (assigned/suppressed conversions).
  value?: string;
  // The variable slot it was stored in, 0-based.
  slot?: number;
  // For number conversions: the characters handed to strtol/strtod.
  digits?: string;
  // For integer conversions: the base the characters were read in.
  base?: 8 | 10 | 16;
  // True when an integer fell outside the 32-bit range, where Tcl 8.4's
  // answer depends on the platform it was built for.
  platformDependent?: boolean;
}

/** The whole scan outcome. */
export interface ScanResult {
  // The directives parsed from the format.
  directives: ScanDirective[];
  // What each directive did, in order, until scanning stopped.
  steps: ScanStep[];
  // Value per variable slot, or null when the slot was not assigned.
  values: (string | null)[];
  // The command's result: the count (with variables) or a list (inline).
  result: string;
  // True when the input ran out before any conversion (result -1 / "").
  underflowBeforeAny: boolean;
}

/** Positions above this are refused, so a typo cannot allocate a huge list. */
const MAX_XPG = 1000;

/** True for an ASCII decimal digit. */
function isDigit(ch: string | undefined): boolean {
  // Digits only.
  return ch !== undefined && ch >= "0" && ch <= "9";
}

/** Read a run of decimal digits at `i`; returns the value and the next offset. */
function readDigits(s: string, i: number): { value: number; next: number } {
  // Accumulate the value (huge widths simply become very large numbers).
  let v = 0;
  // Next offset.
  let j = i;
  // Consume digits.
  while (isDigit(s[j])) v = v * 10 + (s.charCodeAt(j++) - 48);
  // The number and where it ended.
  return { value: v, next: j };
}

/**
 * Find where a %[...] set ends, or throw, exactly as ValidateFormat does.
 * `i` points just after the "[". Returns the offset after the closing "]".
 */
function validateSet(fmt: string, i: number): number {
  // Tcl's message for every malformed set.
  const bad = (): never => {
    // Raise it.
    throw new TclScanError("unmatched [ in format string");
  };
  // Nothing after "[".
  if (fmt[i] === undefined) bad();
  // The first set character.
  let ch = fmt[i++];
  // A leading "^" negates; something must follow it.
  if (ch === "^") {
    // End of format right after "^".
    if (fmt[i] === undefined) bad();
    // The next character.
    ch = fmt[i++];
  }
  // A leading "]" is a literal member; something must follow it.
  if (ch === "]") {
    // End of format right after it.
    if (fmt[i] === undefined) bad();
    // The next character.
    ch = fmt[i++];
  }
  // Read to the closing "]".
  while (ch !== "]") {
    // Running out first is the error.
    if (fmt[i] === undefined) bad();
    // The next character.
    ch = fmt[i++];
  }
  // Just past the "]".
  return i;
}

/**
 * Build a %[...] set exactly as BuildCharSet does in Tcl 8.4.6 (a format
 * already validated). `i` points just after the "[". Two of its quirks are
 * worth knowing: in "a-b-c" the second range starts again from "a", so "-"
 * is NOT a member; and in "a--" the "a" is dropped.
 */
function buildCharSet(fmt: string, i: number): ScanSet {
  // The set being built.
  const set: ScanSet = { exclude: false, chars: [], ranges: [] };
  // Current offset.
  let j = i;
  // The first character.
  let ch = fmt[j++];
  // A leading "^" negates the set.
  if (ch === "^") {
    // Note it.
    set.exclude = true;
    // Read the next character.
    ch = fmt[j++];
  }
  // The potential start of a range.
  let start = ch;
  // A leading "]" or "-" is a plain member.
  if (ch === "]" || ch === "-") {
    // Add it.
    set.chars.push(ch);
    // Read the next character.
    ch = fmt[j++];
  }
  // Walk to the closing bracket (validation guarantees it exists).
  while (ch !== "]" && ch !== undefined) {
    // A dash follows: this character may start a range, so hold it back.
    if (fmt[j] === "-") start = ch;
    // This character is a dash.
    else if (ch === "-") {
      // A dash right before "]" is literal, along with the held character.
      if (fmt[j] === "]") {
        // Add the held character.
        set.chars.push(start);
        // And the dash.
        set.chars.push(ch);
      } else {
        // The range's end character.
        ch = fmt[j++];
        // Store the range with its ends in order.
        set.ranges.push(start < ch ? [start, ch] : [ch, start]);
      }
    } else {
      // A plain member.
      set.chars.push(ch);
    }
    // Read the next character.
    ch = fmt[j++];
  }
  // The finished set.
  return set;
}

/** Is `ch` in a %[...] set? (CharInSet) */
function inSet(set: ScanSet, ch: string): boolean {
  // Membership by single characters or ranges.
  const hit = set.chars.includes(ch) || set.ranges.some(([a, b]) => a <= ch && ch <= b);
  // Negated sets invert it.
  return set.exclude ? !hit : hit;
}

/**
 * Parse and validate a format the way ValidateFormat does, given how many
 * variable names were supplied (0 = inline mode). Returns the directives and
 * the number of result slots.
 */
export function parseFormat(fmt: string, numVars: number): { directives: ScanDirective[]; slots: number } {
  // Tcl 8.4 cannot hold characters beyond the BMP as one character.
  assertBmp(fmt);
  // Directives found.
  const directives: ScanDirective[] = [];
  // Assignment counts per slot.
  const assigned = new Map<number, number>();
  // XPG bookkeeping.
  let gotXpg = false;
  // Sequential bookkeeping.
  let gotSeq = false;
  // Largest XPG index seen (inline mode sizing).
  let xpgSize = 0;
  // Next slot to assign (objIndex in the C code).
  let slot = 0;
  // Walk the format.
  for (let i = 0; i < fmt.length; ) {
    // Directive start.
    const start = i;
    // The current character.
    const ch = fmt[i];
    // One white-space character matches any run of input white space.
    if (isUniSpace(ch)) {
      // Record it (consecutive spaces are separate, equivalent directives).
      directives.push({ kind: "space", text: ch, start });
      // Advance.
      i++;
      // Next directive.
      continue;
    }
    // A literal character.
    if (ch !== "%") {
      // Record it.
      directives.push({ kind: "literal", text: ch, start, literal: ch });
      // Advance.
      i++;
      // Next directive.
      continue;
    }
    // "%%" is a literal percent sign.
    if (fmt[i + 1] === "%") {
      // Record it.
      directives.push({ kind: "literal", text: "%%", start, literal: "%" });
      // Skip both characters.
      i += 2;
      // Next directive.
      continue;
    }
    // A conversion: step past "%".
    i++;
    // Assignment suppression.
    let suppress = false;
    // XPG position, if any.
    let xpg: number | undefined;
    // "*" suppresses assignment (and is neither XPG nor sequential).
    if (fmt[i] === "*") {
      // Note it.
      suppress = true;
      // Advance.
      i++;
    } else if (isDigit(fmt[i])) {
      // Digits may be an XPG position ("2$") or a width.
      const d = readDigits(fmt, i);
      // A "$" after the digits makes it XPG.
      if (fmt[d.next] === "$") {
        // Note XPG mode.
        gotXpg = true;
        // XPG and sequential cannot be mixed.
        if (gotSeq) throw new TclScanError('cannot mix "%" and "%n$" conversion specifiers');
        // The 1-based position.
        xpg = d.value;
        // Out of range for the variables given (or zero).
        if (xpg < 1 || (numVars && xpg > numVars)) throw new TclScanError('"%n$" argument index out of range');
        // A practical bound for this tool (Tcl would build a list this long).
        if (xpg > MAX_XPG) throw new TclScanError(`positions above %${MAX_XPG}$ are not modelled by this tool`);
        // Track the largest for inline mode.
        if (!numVars) xpgSize = Math.max(xpgSize, xpg);
        // The slot this conversion assigns.
        slot = xpg - 1;
        // Step past "$".
        i = d.next + 1;
      }
    }
    // Neither "*" nor XPG: a sequential conversion.
    if (!suppress && xpg === undefined) {
      // Note sequential mode.
      gotSeq = true;
      // Mixing is an error.
      if (gotXpg) throw new TclScanError('cannot mix "%" and "%n$" conversion specifiers');
    }
    // A width (digits; "0" counts as a width written).
    let width = 0;
    // Whether width digits were present.
    let hasWidth = false;
    // Digits here are the width.
    if (isDigit(fmt[i])) {
      // Read it.
      const d = readDigits(fmt, i);
      // Store it.
      width = d.value;
      // Note that one was written.
      hasWidth = true;
      // Advance.
      i = d.next;
    }
    // One size modifier is accepted and ignored on a 64-bit build.
    if (fmt[i] === "l" || fmt[i] === "L" || fmt[i] === "h") i++;
    // Too few variables for this conversion (checked before the letter).
    if (!suppress && numVars && slot >= numVars) throw new TclScanError(gotXpg ? '"%n$" argument index out of range' : "different numbers of variable names and field specifiers");
    // The conversion letter (undefined when the format ends here).
    const conv = fmt[i];
    // The directive being built.
    const dir: ScanDirective = { kind: "conv", text: "", start, conv, suppress, width, hasWidth, xpg };
    // %c refuses any written width, even 0.
    if (conv === "c" && hasWidth) throw new TclScanError("field width may not be specified in %c conversion");
    // Letters that need nothing more.
    if (conv !== undefined && "ndefgiouxsc".includes(conv)) i++;
    // A character set: validate, then build it as the scanner would.
    else if (conv === "[") {
      // Find the end (throws "unmatched [" when malformed).
      const next = validateSet(fmt, i + 1);
      // Build the set.
      dir.set = buildCharSet(fmt, i + 1);
      // Continue after "]".
      i = next;
    } else {
      // Tcl's wording; at the end of the format Tcl reports the NUL it read.
      throw new TclScanError(`bad scan conversion character "${conv ?? "\0"}"`);
    }
    // The directive's text.
    dir.text = fmt.slice(start, i);
    // Storing conversions claim a slot.
    if (!suppress) {
      // Bump this slot's count.
      assigned.set(slot, (assigned.get(slot) ?? 0) + 1);
      // Remember which slot this directive writes.
      dir.slot = slot;
      // The next sequential slot.
      slot++;
    }
    // Record it.
    directives.push(dir);
  }
  // The number of result slots.
  const slots = numVars || xpgSize || slot;
  // Each slot must be assigned exactly once.
  for (let k = 0; k < slots; k++) {
    // How many times this slot was assigned.
    const n = assigned.get(k) ?? 0;
    // More than once is only possible with XPG.
    if (n > 1) throw new TclScanError('variable is assigned by multiple "%n$" conversion specifiers');
    // Never assigned is an error unless inline XPG sizing created the slot.
    if (n === 0 && !xpgSize) throw new TclScanError("variable is not assigned by any conversion specifiers");
  }
  // The validated directives and slot count.
  return { directives, slots };
}

/** 2^63 - 1, the largest C long on a 64-bit build. */
const LONG_MAX = 9223372036854775807n;
/** 2^64 - 1, the largest C unsigned long. */
const ULONG_MAX = 18446744073709551615n;
/** 2^32 - 1, the largest C unsigned int. */
const UINT_MAX = 4294967295n;

/**
 * Convert collected integer text as Tcl 8.4.6 does on a 64-bit build:
 * strtol (%d, %i) clamps to the signed range; strtoul (%o, %x, %u) clamps the
 * magnitude to ULONG_MAX and negates in unsigned arithmetic; then %u prints a
 * negative long as unsigned, and any value from 0 to UINT_MAX passes through
 * a C int (Tcl_NewIntObj), which wraps values above 2147483647.
 */
function convertInteger(buf: string, base: 8 | 10 | 16, conv: string): { text: string; platformDependent: boolean } {
  // Sign and digits.
  let neg = false;
  // Offset into the buffer.
  let j = 0;
  // An optional sign.
  if (buf[j] === "+" || buf[j] === "-") neg = buf[j++] === "-";
  // A "0x" prefix (the scanner only takes an "x" right after a leading zero).
  if (base === 16 && buf[j] === "0" && (buf[j + 1] === "x" || buf[j + 1] === "X") && buf.length > j + 2) j += 2;
  // The digits.
  const digits = buf.slice(j);
  // The magnitude, exact.
  let mag = 0n;
  // Accumulate digit by digit in the base.
  for (const c of digits) mag = mag * BigInt(base) + BigInt(parseInt(c, 16));
  // The C long that comes out of strtol / strtoul.
  let asLong: bigint;
  // %d and %i use strtol.
  if (conv === "d" || conv === "i") {
    // The signed value.
    const v = neg ? -mag : mag;
    // Clamp to the long range (scan ignores ERANGE).
    asLong = v > LONG_MAX ? LONG_MAX : v < -LONG_MAX - 1n ? -LONG_MAX - 1n : v;
  } else {
    // strtoul: overflow returns ULONG_MAX whatever the sign; else negate mod 2^64.
    const u = mag > ULONG_MAX ? ULONG_MAX : neg ? BigInt.asUintN(64, -mag) : mag;
    // The same bits read as a signed long.
    asLong = BigInt.asIntN(64, u);
  }
  // Outside the 32-bit range the answer depends on the platform's long size.
  const platformDependent = asLong > 2147483647n || asLong < -2147483648n;
  // %u prints a negative long as unsigned.
  if (conv === "u" && asLong < 0n) return { text: BigInt.asUintN(64, asLong).toString(), platformDependent };
  // Negative values and values above UINT_MAX are kept as longs.
  if (asLong < 0n || asLong > UINT_MAX) return { text: asLong.toString(), platformDependent };
  // 0..UINT_MAX goes through a C int: values above INT_MAX wrap negative.
  return { text: BigInt.asIntN(32, asLong).toString(), platformDependent };
}

/** Run `scan string format ?varName ...?` with `numVars` variable names. */
export function runScan(input: string, fmt: string, numVars: number): ScanResult {
  // Tcl 8.4 cannot hold characters beyond the BMP as one character.
  assertBmp(input);
  // Parse and validate the format first, as Tcl does.
  const { directives, slots } = parseFormat(fmt, numVars);
  // Values per slot.
  const values: (string | null)[] = new Array(slots).fill(null);
  // The trace.
  const steps: ScanStep[] = [];
  // Input offset (characters).
  let p = 0;
  // Conversions performed (suppressed and %n included).
  let nconv = 0;
  // Whether input ran out.
  let underflow = false;
  // Run each directive.
  outer: for (const d of directives) {
    // Where this directive began in the input.
    const inputStart = p;
    // White space: skip any amount in the input (reaching the end is fine).
    if (d.kind === "space") {
      // Consume white space.
      while (isUniSpace(input[p])) p++;
      // Record it.
      steps.push({ directive: d, inputStart, valueStart: inputStart, inputEnd: p, outcome: "matched" });
      // Next directive.
      continue;
    }
    // A literal character must match exactly.
    if (d.kind === "literal") {
      // Out of input: underflow.
      if (p >= input.length) {
        // Note it.
        underflow = true;
        // Record and stop.
        steps.push({ directive: d, inputStart, valueStart: p, inputEnd: p, outcome: "out-of-input" });
        // Stop scanning.
        break;
      }
      // Compare one character.
      const ok = input[p] === d.literal;
      // The character is consumed either way (as in the C code).
      p++;
      // Record the result.
      steps.push({ directive: d, inputStart, valueStart: inputStart, inputEnd: p, outcome: ok ? "matched" : "stopped" });
      // A mismatch stops scanning.
      if (!ok) break;
      // Next directive.
      continue;
    }
    // Store a value (or not, when suppressed) and record the step.
    const store = (value: string, valueStart: number, extra: Partial<ScanStep> = {}) => {
      // Write the slot unless suppressed.
      if (!d.suppress && d.slot !== undefined) values[d.slot] = value;
      // Record the step.
      steps.push({ directive: d, inputStart, valueStart, inputEnd: p, outcome: d.suppress ? "suppressed" : "assigned", value, slot: d.suppress ? undefined : d.slot, ...extra });
      // Count the conversion.
      nconv++;
    };
    // %n: how far scanning has got, in bytes of Tcl's UTF-8, without reading.
    if (d.conv === "n") {
      // Store the byte offset.
      store(String(strByteLength(input.slice(0, p))), p);
      // Next directive.
      continue;
    }
    // Any other conversion at the end of input: underflow.
    if (p >= input.length) {
      // Note it.
      underflow = true;
      // Record and stop.
      steps.push({ directive: d, inputStart, valueStart: p, inputEnd: p, outcome: "out-of-input" });
      // Stop scanning.
      break;
    }
    // All but %c and %[ skip leading white space.
    if (d.conv !== "c" && d.conv !== "[") {
      // Skip it.
      while (isUniSpace(input[p])) p++;
      // Only white space was left: underflow.
      if (p >= input.length) {
        // Note it.
        underflow = true;
        // Record and stop.
        steps.push({ directive: d, inputStart, valueStart: p, inputEnd: p, outcome: "out-of-input" });
        // Stop scanning.
        break;
      }
    }
    // Where the value text starts.
    const valueStart = p;
    // The width (0 = none).
    const width = d.width ?? 0;
    // Dispatch on the conversion letter.
    switch (d.conv) {
      // %s: a run of non-space characters.
      case "s": {
        // Characters read so far.
        let n = 0;
        // Consume up to white space or the width.
        while (p < input.length && !isUniSpace(input[p]) && (width === 0 || n < width)) { p++; n++; }
        // Store the text.
        store(input.slice(valueStart, p), valueStart);
        // Next directive.
        continue;
      }
      // %[...]: a run of characters in (or not in) the set.
      case "[": {
        // Characters read so far.
        let n = 0;
        // Consume while in the set and within the width.
        while (p < input.length && inSet(d.set!, input[p]) && (width === 0 || n < width)) { p++; n++; }
        // No characters: scanning stops (not an underflow).
        if (p === valueStart) {
          // Record it.
          steps.push({ directive: d, inputStart, valueStart, inputEnd: p, outcome: "stopped" });
          // Stop scanning.
          break outer;
        }
        // Store the run.
        store(input.slice(valueStart, p), valueStart);
        // Next directive.
        continue;
      }
      // %c: one character, stored as its code.
      case "c": {
        // The character code.
        const code = input.charCodeAt(p);
        // Consume it.
        p++;
        // Store the code.
        store(String(code), valueStart);
        // Next directive.
        continue;
      }
      // Integer conversions.
      case "d": case "i": case "o": case "x": case "u": {
        // The base each letter starts with (0 = decided by the prefix, %i).
        let base: 0 | 8 | 10 | 16 = d.conv === "d" || d.conv === "u" ? 10 : d.conv === "o" ? 8 : d.conv === "x" ? 16 : 0;
        // Flags from the C state machine.
        let signOk = true, noDigits = true, noZero = true, xOk = false;
        // Collected characters.
        let buf = "";
        // At most the width (the C buffer holds 512 characters).
        let budget = width === 0 || width > 512 ? 512 : width;
        // Consume characters while they fit the number.
        for (; budget > 0 && p < input.length; budget--) {
          // The character.
          const c = input[p];
          // Whether to take it.
          let take = false;
          // A zero.
          if (c === "0") {
            // In %i a leading 0 means octal and allows an "x" next.
            if (base === 0) { base = 8; xOk = true; }
            // In %x a 0 allows an "x" next.
            if (base === 16) xOk = true;
            // The first zero keeps the "x" option open; later zeros close it.
            if (noZero) { signOk = false; noDigits = false; noZero = false; }
            // A later zero.
            else { signOk = false; xOk = false; noDigits = false; }
            // Take it.
            take = true;
          } else if (c >= "1" && c <= "7") {
            // In %i a non-zero first digit means decimal.
            if (base === 0) base = 10;
            // Digits seen.
            signOk = false; xOk = false; noDigits = false;
            // Take it.
            take = true;
          } else if (c === "8" || c === "9") {
            // In %i a non-zero first digit means decimal.
            if (base === 0) base = 10;
            // Not an octal digit: only bases above 8 take it.
            if (base > 8) { signOk = false; xOk = false; noDigits = false; take = true; }
          } else if ((c >= "a" && c <= "f") || (c >= "A" && c <= "F")) {
            // Hex letters only in base 16.
            if (base > 10) { signOk = false; xOk = false; noDigits = false; take = true; }
          } else if (c === "+" || c === "-") {
            // A sign only before anything else.
            if (signOk) { signOk = false; take = true; }
          } else if (c === "x" || c === "X") {
            // "x" only right after a lone leading zero.
            if (xOk && buf.length === 1) { base = 16; xOk = false; take = true; }
          }
          // Stop at the first character that does not fit.
          if (!take) break;
          // Take the character.
          buf += c;
          // Advance.
          p++;
        }
        // No digits at all: the conversion fails (the sign stays consumed).
        if (noDigits) {
          // At the end of input that is an underflow.
          if (p >= input.length) underflow = true;
          // Record and stop.
          steps.push({ directive: d, inputStart, valueStart, inputEnd: p, outcome: underflow ? "out-of-input" : "stopped", digits: buf });
          // Stop scanning.
          break outer;
        }
        // A trailing "x" with no hex digit after it is given back.
        if (buf.endsWith("x") || buf.endsWith("X")) {
          // Drop it from the number.
          buf = buf.slice(0, -1);
          // And return it to the input.
          p--;
        }
        // The base is settled by now (a digit was seen).
        const settled = (base === 0 ? 10 : base) as 8 | 10 | 16;
        // Convert as Tcl 8.4.6 does.
        const conv = convertInteger(buf, settled, d.conv);
        // Store the value.
        store(conv.text, valueStart, { digits: buf, base: settled, platformDependent: conv.platformDependent || undefined });
        // Next directive.
        continue;
      }
      // Floating-point conversions.
      case "f": case "e": case "g": {
        // Flags from the C state machine.
        let signOk = true, noDigits = true, ptOk = true, expOk = true;
        // Collected characters.
        let buf = "";
        // At most the width (the C buffer holds 512 characters).
        let budget = width === 0 || width > 512 ? 512 : width;
        // Consume characters while they fit a number.
        for (; budget > 0 && p < input.length; budget--) {
          // The character.
          const c = input[p];
          // Whether to take it.
          let take = false;
          // Digits.
          if (c >= "0" && c <= "9") { signOk = false; noDigits = false; take = true; }
          // A sign at the start or right after "e".
          else if ((c === "+" || c === "-") && signOk) { signOk = false; take = true; }
          // One decimal point, before any exponent.
          else if (c === "." && ptOk) { signOk = false; ptOk = false; take = true; }
          // An exponent marker, only after a digit; digits must follow it.
          else if ((c === "e" || c === "E") && !noDigits && expOk) { expOk = false; ptOk = false; signOk = true; noDigits = true; take = true; }
          // Stop at the first character that does not fit.
          if (!take) break;
          // Take the character.
          buf += c;
          // Advance.
          p++;
        }
        // No digits where some were needed.
        if (noDigits) {
          // No mantissa digits at all: the conversion fails.
          if (expOk) {
            // At the end of input that is an underflow.
            if (p >= input.length) underflow = true;
            // Record and stop.
            steps.push({ directive: d, inputStart, valueStart, inputEnd: p, outcome: underflow ? "out-of-input" : "stopped", digits: buf });
            // Stop scanning.
            break outer;
          }
          // An exponent without digits ("1e", "1e+") is given back.
          const dropped = buf[buf.length - 1];
          // Remove the last character from the number and the input.
          buf = buf.slice(0, -1);
          // Return it to the input.
          p--;
          // If that was the exponent's sign, the "e" goes back too.
          if (dropped !== "e" && dropped !== "E") {
            // Remove the "e".
            buf = buf.slice(0, -1);
            // Return it to the input.
            p--;
          }
        }
        // strtod and Tcl 8.4's 12-significant-digit printing.
        store(formatDouble(Number(buf)), valueStart, { digits: buf });
        // Next directive.
        continue;
      }
    }
  }
  // The count of assigned slots.
  const assignedCount = values.filter((v) => v !== null).length;
  // The input ran out before any conversion happened.
  const underflowBeforeAny = underflow && nconv === 0;
  // The command result.
  let result: string;
  // With variable names: the count, or -1.
  if (numVars) result = underflowBeforeAny ? "-1" : String(assignedCount);
  // Inline: a proper Tcl list with {} for unassigned slots, or "".
  else result = underflowBeforeAny ? "" : formatList(values.map((v) => v ?? ""));
  // The full outcome.
  return { directives, steps, values, result, underflowBeforeAny };
}
