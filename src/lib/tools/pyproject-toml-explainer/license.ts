// ============================================================================
// src/lib/tools/pyproject-toml-explainer/license.ts
// ----------------------------------------------------------------------------
// The [project] license string: an SPDX license expression.
//
// THE RULES (read 2026-10-27):
//   - Python Packaging User Guide, "License Expression": a valid SPDX license
//     expression (SPDX specification 2.2 or a later compatible version); any
//     SPDX-listed short identifier (list 3.17 or later) or LicenseRef-
//     [idstring] with letters, numbers, "." and "-"; the page's own valid and
//     invalid examples. pyproject.toml specification, license: "Tools SHOULD
//     validate and perform case normalization of the expression."
//   - SPDX specification 3.0.1, Annex "SPDX License Expressions"
//     (spdx.github.io/spdx-spec/v3.0.1/annexes/spdx-license-expressions/):
//     the ABNF (simple-expression = license-id / license-id "+" / license-ref;
//     WITH takes an exception; AND and OR; parentheses), the precedence
//     + then WITH then AND then OR, operators "all upper case or all lower
//     case", identifiers matched case-insensitively (canonical case is the
//     list's), and in LicenseRef- only the part after the prefix is
//     case-insensitive.
//   - The identifiers: spdx.ts (SPDX License List 3.29.0, 2026-09-16).
// DocumentRef- and AdditionRef- forms are SPDX features the packaging
// specification does not list (it names SPDX identifiers and LicenseRef-
// only); they are refused here, as packaging 26.3's canonicalize_license_
// expression refuses them. packaging (the oracle) also accepts a lower-case
// "licenseref-" prefix, which the SPDX annex calls invalid: it is reported as
// an error here.
// ============================================================================

import { SPDX_LICENSES, SPDX_DEPRECATED_LICENSES, SPDX_EXCEPTIONS } from "./spdx"; // the identifier lists

/** Lower-case identifier to canonical case. */
const LICENSES = new Map(SPDX_LICENSES.map((id) => [id.toLowerCase(), id])); // license identifiers
/** Lower-case exception identifier to canonical case. */
const EXCEPTIONS = new Map(SPDX_EXCEPTIONS.map((id) => [id.toLowerCase(), id])); // exception identifiers
/** Deprecated identifiers. */
const DEPRECATED = new Set(SPDX_DEPRECATED_LICENSES); // deprecated

/** Why an expression is not valid. */
export type LicenseErrorCode =
  | "empty" // nothing
  | "unknown-license" // not on the SPDX list
  | "unknown-exception" // WITH followed by something not on the exceptions list
  | "bad-license-ref" // LicenseRef- with an empty or invalid idstring, or a lower-case prefix
  | "unsupported-ref" // DocumentRef- or AdditionRef- (not in the packaging specification)
  | "operator-case" // And, Or, With (mixed case)
  | "syntax" // operators, operands or parentheses out of place
  | "too-deep"; // parentheses nested deeper than 64

/** The result of checking an expression. */
export interface LicenseCheck {
  /** True when valid. */
  valid: boolean;
  /** The canonical form (case-normalized, single spaces), when valid. */
  canonical: string;
  /** The first error, when not valid. */
  error: { code: LicenseErrorCode; token: string } | null;
  /** Deprecated identifiers used. */
  deprecated: string[];
  /** Every license identifier and LicenseRef used, canonical case. */
  licenses: string[];
  /** Exceptions used. */
  exceptions: string[];
} // LicenseCheck

/** Thrown inside the parser. */
class LicenseFail extends Error {
  /**
   * @param code the stable code
   * @param token the offending token
   */
  constructor(public code: LicenseErrorCode, public token: string) {
    super(code); // the message is the code
  } // constructor
} // LicenseFail

/**
 * Split an expression into tokens: "(", ")" and words (white space separates; parentheses stand alone).
 * @param s the expression
 * @returns the tokens
 */
function tokenize(s: string): string[] {
  // One pass.
  const out: string[] = []; // tokens
  let cur = ""; // the word being read
  for (const c of s) { // each character
    if (c === "(" || c === ")" || c === " " || c === "\t" || c === "\n") { // a separator
      if (cur) { out.push(cur); cur = ""; } // finish the word
      if (c === "(" || c === ")") out.push(c); // a parenthesis is a token
    } else cur += c; // part of a word
  } // characters
  if (cur) out.push(cur); // the last word
  return out; // tokens
} // tokenize

/**
 * Check a license expression.
 * @param expr the expression as written
 * @returns the verdict, the canonical form and what it names
 */
export function checkLicenseExpression(expr: string): LicenseCheck {
  // Tokens, then a precedence parser: OR over AND over WITH over simple.
  const toks = tokenize(expr); // tokens
  const deprecated: string[] = []; // deprecated identifiers
  const licenses: string[] = []; // licenses named
  const exceptions: string[] = []; // exceptions named
  let i = 0; // cursor
  let depth = 0; // parenthesis nesting (bounded at 64: no stack exhaustion)
  /** Is the token the operator (upper or lower case only)? Throws on mixed case. */
  const isOp = (t: string | undefined, op: string): boolean => { // operator test
    if (t === undefined) return false; // the end
    if (t === op || t === op.toLowerCase()) return true; // AND or and
    if (t.toUpperCase() === op) throw new LicenseFail("operator-case", t); // And
    return false; // another token
  }; // isOp
  /** simple = id["+"] | LicenseRef-x | "(" or ")" */
  const simple = (): string => { // one operand
    const t = toks[i]; // the token
    if (t === undefined || t === ")" || isOp(t, "AND") || isOp(t, "OR") || isOp(t, "WITH")) throw new LicenseFail("syntax", t ?? ""); // not an operand
    i++; // consumed
    if (t === "(") { if (++depth > 64) throw new LicenseFail("too-deep", t); const inner = or(); if (toks[i] !== ")") throw new LicenseFail("syntax", toks[i] ?? ""); i++; depth--; return `(${inner})`; } // a group
    const lower = t.toLowerCase(); // for matching
    if (lower.startsWith("documentref-") || lower.startsWith("additionref-")) throw new LicenseFail("unsupported-ref", t); // not in the packaging specification
    if (lower.startsWith("licenseref-")) { // a user-defined reference
      const id = t.slice("LicenseRef-".length); // the idstring
      if (!t.startsWith("LicenseRef-") || id === "" || !/^[A-Za-z0-9.-]+$/.test(id)) throw new LicenseFail("bad-license-ref", t); // prefix case or characters
      licenses.push(t); // kept as written
      return t; // canonical already
    } // LicenseRef
    const plus = t.endsWith("+") && t.length > 1; // "or later"
    const bare = plus ? t.slice(0, -1) : t; // without "+"
    const canon = LICENSES.get(bare.toLowerCase()); // the canonical identifier
    if (!canon) throw new LicenseFail("unknown-license", t); // not on the list
    if (DEPRECATED.has(canon)) deprecated.push(canon); // deprecated
    licenses.push(canon); // kept
    return canon + (plus ? "+" : ""); // canonical case
  }; // simple
  /** with = simple ["WITH" exception] */
  const withExpr = (): string => { // WITH binds tightest
    const left = simple(); // the license
    if (!isOp(toks[i], "WITH")) return left; // no exception
    i++; // past WITH
    const t = toks[i]; // the exception
    if (t === undefined || t === "(" || t === ")") throw new LicenseFail("syntax", t ?? ""); // missing
    if (t.toLowerCase().startsWith("additionref-")) throw new LicenseFail("unsupported-ref", t); // SPDX 3 only
    const canon = EXCEPTIONS.get(t.toLowerCase()); // canonical
    if (!canon) throw new LicenseFail("unknown-exception", t); // not on the list
    i++; // consumed
    exceptions.push(canon); // kept
    return `${left} WITH ${canon}`; // the pair
  }; // withExpr
  /** and = with ("AND" with)* */
  const and = (): string => { // AND before OR
    let left = withExpr(); // first
    while (isOp(toks[i], "AND")) { i++; left = `${left} AND ${withExpr()}`; } // more
    return left; // done
  }; // and
  /** or = and ("OR" and)* */
  function or(): string { // lowest precedence
    let left = and(); // first
    while (isOp(toks[i], "OR")) { i++; left = `${left} OR ${and()}`; } // more
    return left; // done
  } // or
  try {
    if (toks.length === 0) throw new LicenseFail("empty", ""); // nothing
    const canonical = or(); // the whole expression
    if (i < toks.length) throw new LicenseFail("syntax", toks[i]); // something left over
    return { valid: true, canonical, error: null, deprecated, licenses, exceptions }; // valid
  } catch (e) { // a failure
    if (!(e instanceof LicenseFail)) throw e; // a defect
    return { valid: false, canonical: "", error: { code: e.code, token: e.token }, deprecated, licenses, exceptions }; // invalid
  } // try
} // checkLicenseExpression
