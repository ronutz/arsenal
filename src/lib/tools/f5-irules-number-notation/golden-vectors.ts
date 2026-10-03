// ============================================================================
// src/lib/tools/f5-irules-number-notation/golden-vectors.ts
// ----------------------------------------------------------------------------
// GOLDEN VECTORS for the iRules number notation converter
// (set "f5-irules-number-notation-golden-2026-10-03").
//
// Each vector is a value written the way it appears in an iRule. The pinned
// fields are how arithmetic reads it, its canonical print, its other bases,
// the literal reading inside an expression, and the five comparison probes.
//
// Expected values were captured from compute.run() on 2026-10-03.
// The plain-Tcl part of every vector (54 checks) was also run in a real
// Tcl 8.4.6 interpreter, built from the tcltk/tcl tag core-8-4-6, on 2026-10-03:
// 54 of 54 agree. Nothing here is pinned from the engine alone where
// the reference can answer.
// ============================================================================

import { run, type NumberNotationInput, type NumberNotationResult, type ExprProbe } from "./compute";

/** The set id: the tool slug and the date the expected values were captured. */
export const GOLDEN_VECTOR_SET_ID = "f5-irules-number-notation-golden-2026-10-03";

/** The fields a vector pins. */
export type NumberNotationPinned = { kind: string; base?: number; reason?: string; canonical?: string; wrapped?: boolean; special?: string; forms?: NumberNotationResult["forms"]; doubleDetail?: NumberNotationResult["doubleDetail"]; literal: ExprProbe; probes: ExprProbe[]; notes: string[] };

/** One vector: a name, an input, and the pinned fields of its result. */
export interface NumberNotationVector {
  // A short stable name.
  id: string;
  // The input, exactly as the tool takes it.
  input: NumberNotationInput;
  // The pinned fields of the result.
  expect: NumberNotationPinned;
}

/** Reduce a result to the fields a vector pins. */
export function pin(r: NumberNotationResult): NumberNotationPinned {
  // Copy the reading, the forms and every probe.
  return { kind: r.kind, base: r.base, reason: r.reason, canonical: r.canonical, wrapped: r.wrapped, special: r.special, forms: r.forms, doubleDetail: r.doubleDetail, literal: r.literal, probes: r.probes, notes: r.notes };
}

/** The vectors. */
export const VECTORS: NumberNotationVector[] = [
  // A leading zero makes the value octal: 010 is eight, so == 8 holds while eq does not.
  {
    id: "octal-010",
    input: { text: "010", other: "8" },
    expect: {
      kind: "int",
      base: 8,
      canonical: "8",
      forms: { decimal: "8", hex: "8", octal: "10", binary: "1000", tclHex: "0x8", tclOctal: "010" },
      literal: { expr: "010", ok: true, result: "8" },
      probes: [
        { expr: "$x + 0", ok: true, result: "8" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["octal", "octal-not-decimal"],
    },
  },
  // 08 has the octal shape with a digit octal lacks: an error in arithmetic, a string in comparisons.
  {
    id: "invalid-octal-08",
    input: { text: "08", other: "8" },
    expect: {
      kind: "not-number",
      reason: "invalid-octal",
      literal: {
        expr: "08",
        ok: false,
        result: "expected integer but got \"08\" (looks like invalid octal number)",
      },
      probes: [
        { expr: "$x + 0", ok: false, result: "can't use invalid octal number as operand of \"+\"" },
        { expr: "$x == $y", ok: true, result: "0" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "1" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["invalid-octal"],
    },
  },
  // 0x starts a hexadecimal value.
  {
    id: "hex-0x1f",
    input: { text: "0x1F", other: "31" },
    expect: {
      kind: "int",
      base: 16,
      canonical: "31",
      forms: { decimal: "31", hex: "1f", octal: "37", binary: "11111", tclHex: "0x1f", tclOctal: "037" },
      literal: { expr: "0x1F", ok: true, result: "31" },
      probes: [
        { expr: "$x + 0", ok: true, result: "31" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["hex"],
    },
  },
  // An exponent makes a double, printed with a decimal point.
  {
    id: "exponent-1e3",
    input: { text: "1e3", other: "1000" },
    expect: {
      kind: "double",
      canonical: "1000.0",
      doubleDetail: { printed: "1000.0", roundTrip: "1000", exact: "1000" },
      literal: { expr: "1e3", ok: true, result: "1000.0" },
      probes: [
        { expr: "$x + 0", ok: true, result: "1000.0" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["double"],
    },
  },
  // Leading and trailing white space is accepted around a number held in a value.
  {
    id: "whitespace-12",
    input: { text: " 12 ", other: "12" },
    expect: {
      kind: "int",
      base: 10,
      canonical: "12",
      forms: { decimal: "12", hex: "c", octal: "14", binary: "1100", tclHex: "0xc", tclOctal: "014" },
      literal: { expr: " 12 ", ok: true, result: "12" },
      probes: [
        { expr: "$x + 0", ok: true, result: "12" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["whitespace"],
    },
  },
  // 3.0 == 3 compares numbers; eq compares the text.
  {
    id: "double-3-0",
    input: { text: "3.0", other: "3" },
    expect: {
      kind: "double",
      canonical: "3.0",
      doubleDetail: { printed: "3.0", roundTrip: "3", exact: "3" },
      literal: { expr: "3.0", ok: true, result: "3.0" },
      probes: [
        { expr: "$x + 0", ok: true, result: "3.0" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["double"],
    },
  },
  // A hexadecimal value of 64 one-bits wraps to -1 in Tcl 8.4.
  {
    id: "wrap-64",
    input: { text: "0xFFFFFFFFFFFFFFFF", other: "-1" },
    expect: {
      kind: "int",
      base: 16,
      canonical: "-1",
      wrapped: true,
      forms: { decimal: "-1", hex: "-1", octal: "-1", binary: "-1", tclHex: "-0x1", tclOctal: "-01" },
      literal: { expr: "0xFFFFFFFFFFFFFFFF", ok: true, result: "-1" },
      probes: [
        { expr: "$x + 0", ok: true, result: "-1" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["wrapped64", "hex"],
    },
  },
  // Plain text: arithmetic refuses it, comparisons fall back to strings.
  {
    id: "text-abc",
    input: { text: "abc", other: "8" },
    expect: {
      kind: "not-number",
      reason: "not-numeric",
      literal: {
        expr: "abc",
        ok: false,
        result: "syntax error in expression \"abc\": variable references require preceding $",
      },
      probes: [
        { expr: "$x + 0", ok: false, result: "can't use non-numeric string as operand of \"+\"" },
        { expr: "$x == $y", ok: true, result: "0" },
        { expr: "$x eq $y", ok: true, result: "0" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "1" },
      ],
      notes: ["not-number"],
    },
  },
  // 0.1 prints as 0.1 but is held as the nearest binary fraction.
  {
    id: "fraction-0-1",
    input: { text: "0.1", other: "0.1" },
    expect: {
      kind: "double",
      canonical: "0.1",
      doubleDetail: {
        printed: "0.1",
        roundTrip: "0.1",
        exact: "0.1000000000000000055511151231257827021181583404541015625",
      },
      literal: { expr: "0.1", ok: true, result: "0.1" },
      probes: [
        { expr: "$x + 0", ok: true, result: "0.1" },
        { expr: "$x == $y", ok: true, result: "1" },
        { expr: "$x eq $y", ok: true, result: "1" },
        { expr: "$x < $y", ok: true, result: "0" },
        { expr: "$x > $y", ok: true, result: "0" },
      ],
      notes: ["double"],
    },
  },
];

/** What verifyVectors reports (the shape scripts/run-golden-vectors.mts reads). */
export interface VerifyReport {
  // The set id.
  setId: string;
  // Vectors run.
  total: number;
  // Vectors whose pinned fields matched.
  passed: number;
  // The ones that did not, with the first difference.
  failures: { id: string; reason: string }[];
}

/** Run every vector and compare its pinned fields byte for byte. */
export function verifyVectors(): VerifyReport {
  // Failures found.
  const failures: { id: string; reason: string }[] = [];
  // Each vector.
  for (const v of VECTORS) {
    // A throw is a failure too.
    try {
      // Run and reduce (through JSON, as the expected values were captured).
      const got = JSON.stringify(pin(run(v.input)));
      // The expected text.
      const want = JSON.stringify(v.expect);
      // Compare.
      if (got !== want) {
        // The first differing character, for a readable reason.
        let k = 0;
        // Walk to it.
        while (k < got.length && got[k] === want[k]) k++;
        // Record.
        failures.push({ id: v.id, reason: `differs at ${k}: got ...${got.slice(Math.max(0, k - 30), k + 50)}... want ...${want.slice(Math.max(0, k - 30), k + 50)}...` });
      }
    } catch (e) {
      // The error.
      failures.push({ id: v.id, reason: `threw: ${(e as Error).message}` });
    }
  }
  // The report.
  return { setId: GOLDEN_VECTOR_SET_ID, total: VECTORS.length, passed: VECTORS.length - failures.length, failures };
}
