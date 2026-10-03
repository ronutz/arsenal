// ============================================================================
// src/lib/tools/f5-irules-number-notation/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES NUMBER NOTATION CONVERTER: type a value the way it appears in an
// iRule and see exactly how Tcl 8.4 (the base F5 names for iRules, K6091)
// reads it, prints it and compares it.
//
// Two readings are reported, because Tcl reads numbers in two places:
//   * as a LITERAL written inside an expression, e.g. expr {010 + 1}: a bad
//     literal ("08", or a value beyond 64 bits) is a syntax-time error;
//   * as a VALUE held by a variable or a quoted string, e.g. set x "010";
//     expr {$x + 1}: a value that is not a usable number is an operand error,
//     and comparisons quietly fall back to comparing strings.
//
// Everything is computed by the shared Tcl 8.4 engine in src/lib/tcl84, which
// is checked against a real Tcl 8.4.6 interpreter. Local and deterministic.
// ============================================================================

import { readNumber, readInteger, looksLikeInt, intInBase, formatDouble, type NotNumberReason } from "@/lib/tcl84/numbers";
import { runExpr, peek } from "@/lib/tcl84/expr";
import { TclObj, TclError, limitInput } from "@/lib/tcl84/value";

/** The input: one value, typed as it appears in an iRule, and a value to compare it with. */
export interface NumberNotationInput {
  // The text, e.g. "010", "0x1F", "08", "1e3", " 12 ".
  text: string;
  // The value it is compared with in the probes (default "8").
  other?: string;
}

/** One expression evaluated with $x set to the input. */
export interface ExprProbe {
  // The expression, as written in the iRule.
  expr: string;
  // True when it evaluated.
  ok: boolean;
  // The result, or Tcl's error message.
  result: string;
}

/** The full reading of one value. */
export interface NumberNotationResult {
  // The input, echoed.
  input: string;
  // How a variable holding this text is read by arithmetic.
  kind: "int" | "double" | "not-number";
  // For integers: the base the text was written in.
  base?: 8 | 10 | 16;
  // For non-numbers: the rule that stopped it.
  reason?: NotNumberReason;
  // True when the text has the SHAPE of an integer (and is therefore never read as a double).
  looksLikeInt: boolean;
  // For integers: whether a 64-bit wrap-around happened (2^63 .. 2^64-1).
  wrapped?: boolean;
  // For doubles read by the C library's special forms (inf, nan, hex floats).
  special?: "inf" | "nan" | "hex";
  // The canonical value Tcl prints (absent for non-numbers).
  canonical?: string;
  // For integers: the same value in decimal, hex, octal and binary, plus how to WRITE it in Tcl.
  forms?: { decimal: string; hex: string; octal: string; binary: string; tclHex: string; tclOctal: string };
  // For doubles: the printed form (12 digits), the shortest exact round-trip form, and the exact binary value.
  doubleDetail?: { printed: string; roundTrip: string; exact: string };
  // True when the integer is outside the 32-bit range (a 32-bit build of Tcl 8.4 differs).
  outside32?: boolean;
  // The same text written as a literal inside an expression: expr {TEXT}.
  literal: ExprProbe;
  // The value held in a variable: arithmetic and comparisons.
  probes: ExprProbe[];
  // Teaching notes, as codes the UI translates.
  notes: string[];
}

/** The exact decimal expansion of a finite double (every double is a finite decimal). */
function exactDecimal(d: number): string {
  // Zero is exact.
  if (d === 0) return Object.is(d, -0) ? "-0" : "0";
  // The bit pattern.
  const view = new DataView(new ArrayBuffer(8));
  // Store the magnitude.
  view.setFloat64(0, Math.abs(d));
  // The 64 bits.
  const bits = view.getBigUint64(0);
  // The biased exponent.
  const biased = Number((bits >> 52n) & 0x7ffn);
  // The fraction.
  const frac = bits & 0xfffffffffffffn;
  // The significand (implicit leading 1 for normal numbers).
  const mant = biased === 0 ? frac : frac | 0x10000000000000n;
  // The binary exponent.
  const e2 = (biased === 0 ? 1 : biased) - 1075;
  // Sign prefix.
  const sign = d < 0 ? "-" : "";
  // A whole number.
  if (e2 >= 0) return sign + (mant << BigInt(e2)).toString();
  // A fraction: mant / 2^k = mant * 5^k / 10^k.
  const k = -e2;
  // The digits.
  const digits = (mant * 5n ** BigInt(k)).toString().padStart(k + 1, "0");
  // Insert the point and drop trailing zeros.
  const text = `${digits.slice(0, digits.length - k)}.${digits.slice(digits.length - k)}`.replace(/0+$/, "").replace(/\.$/, "");
  // Signed.
  return sign + text;
}

/** Evaluate one expression with $x holding the input text and $y the other value. */
function probe(expr: string, x: string, y = ""): ExprProbe {
  // Fresh variable values each time (Tcl caches conversions on values).
  const store = new Map([["x", TclObj.fromString(x)], ["y", TclObj.fromString(y)]]);
  // Run it.
  const r = runExpr(expr, { mode: "tcl", getVar: (n) => { const o = store.get(n); if (!o) throw new TclError(`can't read "${n}": no such variable`); return o; }, runCommand: () => { throw new TclError("commands are not used here"); } });
  // The outcome.
  return r.error !== undefined ? { expr, ok: false, result: r.error } : { expr, ok: true, result: peek(r.value!) };
}

/** Read one value. */
export function run(input: NumberNotationInput): NumberNotationResult {
  // Bounded inputs: these are numbers, so a short limit is plenty.
  limitInput("The value", input.text, 1000);
  // The value it is compared with.
  limitInput("The comparison value", input.other, 1000);
  // The text, as typed.
  const text = input.text;
  // How arithmetic reads a variable holding it.
  const r = readNumber(text);
  // Notes collected along the way.
  const notes: string[] = [];
  // The integer shape test (the rule that sends "08" down the integer path).
  const lli = looksLikeInt(text);
  // The literal form (expr {TEXT}) only makes sense when there is text to write.
  const literal: ExprProbe = text.trim() === "" ? { expr: "", ok: false, result: "" } : probe(text, text);
  // The result being built.
  const out: NumberNotationResult = { input: text, kind: "not-number", looksLikeInt: lli, literal, probes: [], notes };
  // Leading or trailing white space is accepted in a value.
  if (text !== "" && text !== text.trim()) notes.push("whitespace");
  // A number.
  if (r.ok) {
    // Integers.
    if (r.num.kind === "int") {
      // The kind and base.
      out.kind = "int";
      // The base. A value of zero reads the same in every base, so "0" and "00"
      // are reported as decimal rather than as the octal C technically calls them.
      out.base = r.num.value === 0n ? 10 : r.num.base;
      // The canonical decimal text.
      out.canonical = r.num.value.toString();
      // A 64-bit wrap.
      if (r.num.wrapped) { out.wrapped = true; notes.push("wrapped64"); }
      // The other notations.
      const v = r.num.value;
      // The forms (a negative value keeps its sign in every base).
      out.forms = { decimal: v.toString(), hex: intInBase(v, 16), octal: intInBase(v, 8), binary: intInBase(v, 2), tclHex: (v < 0n ? "-" : "") + "0x" + (v < 0n ? -v : v).toString(16), tclOctal: (v < 0n ? "-" : "") + "0" + (v < 0n ? -v : v).toString(8) };
      // Outside 32 bits.
      out.outside32 = v > 2147483647n || v < -2147483648n;
      // Base notes (not for zero, which reads the same in every base).
      if (r.num.base === 8 && r.num.value !== 0n) notes.push("octal");
      // Hex.
      if (r.num.base === 16) notes.push("hex");
      // A 32-bit note.
      if (out.outside32) notes.push("outside32");
    } else {
      // Doubles.
      out.kind = "double";
      // The value.
      const d = r.num.value;
      // The C library's forms.
      const special = (() => { const t = text.trim().toLowerCase(); return /^[+-]?(inf|nan)/.test(t) ? (t.includes("nan") ? "nan" : "inf") : /^[+-]?0x/.test(t) ? "hex" : undefined; })();
      // Record it.
      if (special) { out.special = special; notes.push("c-library"); }
      // Finite doubles have a full description.
      if (Number.isFinite(d)) {
        // Printed with 12 significant digits.
        out.canonical = formatDouble(d);
        // The detail.
        out.doubleDetail = { printed: formatDouble(d), roundTrip: String(d), exact: exactDecimal(d) };
        // 12 digits can hide the rest.
        if (out.doubleDetail.printed.replace(/\.0$/, "") !== String(d) && !/e/.test(String(d))) notes.push("twelve-digits");
      }
      // Doubles are never integers to Tcl, even when whole.
      notes.push("double");
    }
  } else {
    // Not a number, and why.
    out.reason = r.why;
    // The common surprises.
    if (r.why === "invalid-octal") notes.push("invalid-octal");
    // Too large.
    else if (r.why === "too-large") notes.push("too-large");
    // Integer-shaped with garbage after it.
    else if (r.why === "int-garbage") notes.push("int-garbage");
    // Empty.
    else if (r.why === "empty") notes.push("empty");
    // Out of the double range.
    else if (r.why === "float-range") notes.push("float-range");
    // Plain text.
    else notes.push("not-number");
  }
  // The value to compare with.
  const other = input.other ?? "8";
  // The probes: $x holds the text, $y the other value.
  out.probes = ["$x + 0", "$x == $y", "$x eq $y", "$x < $y", "$x > $y"].map((e) => probe(e, text, other));
  // How the bare integer reading compares (helps the "010 == 8" lesson).
  const ri = readInteger(text);
  // Keep the octal lesson explicit when the text is decimal-looking but octal.
  if (ri.ok && ri.base === 8 && ri.value !== 0n && /^\s*[+-]?0\d+\s*$/.test(text)) notes.push("octal-not-decimal");
  // Done.
  return out;
}
