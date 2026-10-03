// ============================================================================
// src/lib/tcl84/expr.ts
// ----------------------------------------------------------------------------
// TCL 8.4 `expr` - the expression language of `expr`, `if`, `while` and
// `for`, reproduced from the Tcl 8.4.6 sources so the expression lab can show
// HOW an answer was reached, step by step, and not only what it is.
//
// Three stages, as in Tcl itself:
//   1. PARSE (tclParseExpr.c): the text is cut into lexemes and arranged by
//      precedence. Syntax errors and bad number literals ("08", values beyond
//      64 bits) are reported here, before anything is evaluated.
//   2. COMPILE CHECK (tclCompExpr.c): unknown math functions and wrong
//      argument counts are reported next, still before evaluation.
//   3. EVALUATE (tclExecute.c): each operator runs the way its bytecode
//      instruction does, including the details that surprise people:
//        - == < > compare NUMERICALLY only when both sides read as numbers,
//          otherwise as strings ("bench" < "Chair" is 0: lower case sorts
//          after upper case);
//        - eq and ne always compare strings;
//        - a value that looks like an integer is read only as one: "08" is
//          an invalid octal number, never 8 and never 8.0;
//        - integer division rounds toward minus infinity (-7/2 is -4) and the
//          remainder takes the divisor's sign (-7%2 is 1);
//        - && and || evaluate their right side only when needed;
//        - an expression that is a single value is converted to its canonical
//          number when it is one ("0x10" becomes 16).
//
// iRules mode adds the operators F5 documents (contains, starts_with,
// ends_with, equals, matches_glob, matches_regex, and, or, not). F5 lists
// them without stating their precedence; this engine places the string
// operators beside eq and ne, and and/or/not beside &&, || and !.
//
// The reference these semantics are checked against is a Tcl 8.4.6
// interpreter built on 64-bit Linux. Where Tcl 8.4 leaves an answer to the C
// compiler or library (integer overflow, shift counts, the last bit of a math
// function), the trace says so.
// ============================================================================

import { formatDouble, formatInt, integerPrefixLength, looksLikeBadOctal, looksLikeInt, operandNoun, strtodPrefix } from "./numbers";
import { parseBracedAt, parseCommandAt, parseQuotedAt, parseVarAt, TclParseError, type Part } from "./parse";
import { errorMessage, floatErrorMessage, getBoolean, getDouble, getInt, TclError, TclObj, truncBytes, tryBoolean, tryDouble, tryInt, tclUtf8 } from "./value";
import { globMatch } from "./glob";

/** Which language: plain Tcl 8.4.6, or iRules (F5's added operators). */
export type ExprMode = "tcl" | "irules";

/** A node of the parsed expression, with its place in the source text. */
export type ExprNode =
  // A number or boolean word written in the expression (e.g. 0x10, 1.5, true).
  | { t: "lit"; text: string; start: number; end: number }
  // A {braced} string: literal text.
  | { t: "brace"; text: string; start: number; end: number }
  // A "quoted" string: may contain $variables and [commands].
  | { t: "quote"; parts: Part[]; start: number; end: number }
  // A $variable.
  | { t: "var"; name: string; start: number; end: number }
  // A lone "$", which is just the text "$".
  | { t: "dollar"; start: number; end: number }
  // A [command] whose result is the operand.
  | { t: "cmd"; script: string; start: number; end: number }
  // A unary operator: - + ! ~ (and "not" in iRules mode).
  | { t: "un"; op: string; opText: string; arg: ExprNode; start: number; end: number; opStart: number }
  // A binary operator.
  | { t: "bin"; op: string; opText: string; l: ExprNode; r: ExprNode; start: number; end: number; opStart: number; opEnd: number }
  // The ternary c ? a : b.
  | { t: "tern"; c: ExprNode; a: ExprNode; b: ExprNode; start: number; end: number }
  // A math function call.
  | { t: "fn"; name: string; args: ExprNode[]; start: number; end: number }
  // Parentheses (kept for display; they change only grouping).
  | { t: "paren"; e: ExprNode; start: number; end: number };

/** A syntax or compile error, with the offset where Tcl stopped. */
export class TclExprError extends TclError {
  /** Offset into the expression, when known. */
  readonly pos: number;
  /** Build it. */
  constructor(message: string, pos: number) {
    // TclError carries the message.
    super(message);
    // Keep the offset for highlighting.
    this.pos = pos;
  }
}

// ---------------------------------------------------------------------------
// LEXER (GetLexeme in tclParseExpr.c)
// ---------------------------------------------------------------------------

/** Lexeme kinds, named as in tclParseExpr.c. */
type Lex =
  | "LITERAL" | "FUNC_NAME" | "OPEN_BRACKET" | "OPEN_BRACE" | "OPEN_PAREN" | "CLOSE_PAREN" | "DOLLAR" | "QUOTE" | "COMMA" | "END" | "UNKNOWN" | "UNKNOWN_CHAR"
  | "*" | "/" | "%" | "+" | "-" | "<<" | ">>" | "<" | ">" | "<=" | ">=" | "==" | "!=" | "&" | "^" | "|" | "&&" | "||" | "?" | ":" | "!" | "~" | "eq" | "ne"
  // F5's iRules operators.
  | "contains" | "starts_with" | "ends_with" | "equals" | "matches_glob" | "matches_regex";

/** One lexeme: its kind and where it sits. */
interface Lexeme {
  // The kind.
  type: Lex;
  // First character.
  start: number;
  // Just past the last character.
  end: number;
}

/** The iRules words F5 adds, and the operator each one becomes. */
const IRULES_WORDS: Record<string, Lex> = { contains: "contains", starts_with: "starts_with", ends_with: "ends_with", equals: "equals", matches_glob: "matches_glob", matches_regex: "matches_regex", and: "&&", or: "||", not: "!" };

/** The boolean words the lexer accepts as literals (exact, lower case only). */
const BOOL_WORDS = new Set(["false", "no", "off", "on", "true", "yes"]);

/** The math functions Tcl 8.4.6 defines, with their argument counts. */
export const MATH_FUNCS: Record<string, number> = {
  acos: 1, asin: 1, atan: 1, atan2: 2, ceil: 1, cos: 1, cosh: 1, exp: 1, floor: 1, fmod: 2, hypot: 2, log: 1, log10: 1, pow: 2,
  sin: 1, sinh: 1, sqrt: 1, tan: 1, tanh: 1, abs: 1, double: 1, int: 1, rand: 0, round: 1, srand: 1, wide: 1,
};

/** isalpha() on the low byte of a character, as the lexer tests it. */
function lowAlpha(ch: string | undefined): boolean {
  // Past the end.
  if (ch === undefined) return false;
  // The low byte (UCHAR of a Tcl_UniChar).
  const b = ch.charCodeAt(0) & 0xff;
  // ASCII letters only (the C locale).
  return (b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a);
}

/** isalnum() or "_" on the low byte, for the rest of a function name. */
function lowAlnum(ch: string | undefined): boolean {
  // Past the end.
  if (ch === undefined) return false;
  // The low byte.
  const b = ch.charCodeAt(0) & 0xff;
  // Letters, digits and underscore.
  return lowAlpha(ch) || (b >= 0x30 && b <= 0x39) || b === 0x5f;
}

/** The expression parser's state. */
class ExprParser {
  /** The expression text. */
  readonly src: string;
  /** Language mode. */
  readonly mode: ExprMode;
  /** The current lexeme. */
  lex: Lexeme = { type: "UNKNOWN", start: 0, end: 0 };
  /** Where the next lexeme starts. */
  next = 0;
  /** Where the previous lexeme ended. */
  prevEnd = 0;

  /** The current lexeme's kind (a call, so TypeScript re-reads it after advance()). */
  cur(): Lex {
    // The kind of the lexeme just read.
    return this.lex.type;
  }

  /** Set up a parser over the text. */
  constructor(src: string, mode: ExprMode) {
    // Keep the text.
    this.src = src;
    // Keep the mode.
    this.mode = mode;
  }

  /** LogSyntaxError: Tcl's wording, the expression cut at 60 bytes. */
  syntax(detail: string, pos = this.lex.start): never {
    // The expression text as Tcl quotes it.
    const bytes = tclUtf8(this.src).length;
    // Long expressions are cut and marked with "...".
    const shown = bytes > 60 ? `${truncBytes(this.src, 60)}...` : this.src;
    // Raise it.
    throw new TclExprError(`syntax error in expression "${shown}": ${detail}`, pos);
  }

  /** Read the next lexeme (GetLexeme). */
  advance(): void {
    // The previous lexeme ended where the next one would start.
    this.prevEnd = this.next;
    // Current offset.
    let p = this.next;
    // The text.
    const s = this.src;
    // Skip white space, backslash-newline and newlines.
    for (;;) {
      // Space, tab, vertical tab, form feed, carriage return, newline.
      if (s[p] === " " || s[p] === "\t" || s[p] === "\v" || s[p] === "\f" || s[p] === "\r" || s[p] === "\n") { p++; continue; }
      // Backslash-newline counts as white space.
      if (s[p] === "\\" && s[p + 1] === "\n") { p += 2; continue; }
      // Anything else starts a lexeme.
      break;
    }
    // The end of the text.
    if (p >= s.length) {
      // END lexeme.
      this.lex = { type: "END", start: p, end: p };
      // Nothing follows.
      this.next = p;
      // Done.
      return;
    }
    // The first character.
    const c = s[p];
    // Numbers (never with a leading sign: that is a unary operator).
    if (c !== "+" && c !== "-") {
      // An integer prefix (TclParseInteger).
      const ilen = integerPrefixLength(s, p);
      // An integer literal.
      if (ilen > 0) {
        // Its text.
        const text = s.slice(p, p + ilen);
        // It must be a valid 64-bit integer (Tcl_GetWideIntFromObj).
        try { getInt(TclObj.fromString(text)); } catch (e) { throw new TclExprError((e as Error).message, p); }
        // The literal.
        this.lex = { type: "LITERAL", start: p, end: p + ilen };
        // Continue after it.
        this.next = p + ilen;
        // Done.
        return;
      }
      // A floating-point literal: strtod on the longest plausible run.
      let q = p;
      // ParseMaxDoubleLength's character set.
      while (q < s.length && /[0-9A-FINPXa-finpx.+-]/.test(s[q])) q++;
      // Only when that run is non-empty.
      if (q > p) {
        // What strtod makes of the run (it may stop early).
        const r = strtodPrefix(s.slice(p, q), 0);
        // Something was converted.
        if (r.length > 0) {
          // Overflow or underflow is reported here, as TclExprFloatError.
          if (r.erange) throw new TclExprError(floatErrorMessage(r.value), p);
          // The literal.
          this.lex = { type: "LITERAL", start: p, end: p + r.length };
          // Continue after it.
          this.next = p + r.length;
          // Done.
          return;
        }
      }
    }
    // One-character lexemes by default.
    const one = (type: Lex) => {
      // Set the lexeme.
      this.lex = { type, start: p, end: p + 1 };
      // Continue after it.
      this.next = p + 1;
    };
    // Two-character lexemes.
    const two = (type: Lex) => {
      // Set the lexeme.
      this.lex = { type, start: p, end: p + 2 };
      // Continue after it.
      this.next = p + 2;
    };
    // Dispatch on the character.
    switch (c) {
      // Grouping and substitution.
      case "[": return one("OPEN_BRACKET");
      // A braced operand.
      case "{": return one("OPEN_BRACE");
      // Parentheses.
      case "(": return one("OPEN_PAREN");
      // Close parenthesis.
      case ")": return one("CLOSE_PAREN");
      // A variable.
      case "$": return one("DOLLAR");
      // A quoted operand.
      case '"': return one("QUOTE");
      // Function argument separator.
      case ",": return one("COMMA");
      // Arithmetic.
      case "*": return one("*");
      // Division.
      case "/": return one("/");
      // Remainder.
      case "%": return one("%");
      // Plus.
      case "+": return one("+");
      // Minus.
      case "-": return one("-");
      // Ternary parts.
      case "?": return one("?");
      // Else separator.
      case ":": return one(":");
      // Less-than family.
      case "<": return s[p + 1] === "<" ? two("<<") : s[p + 1] === "=" ? two("<=") : one("<");
      // Greater-than family.
      case ">": return s[p + 1] === ">" ? two(">>") : s[p + 1] === "=" ? two(">=") : one(">");
      // A single "=" is not an operator.
      case "=": return s[p + 1] === "=" ? two("==") : one("UNKNOWN");
      // Not, or not-equal.
      case "!": return s[p + 1] === "=" ? two("!=") : one("!");
      // Bitwise and, or logical and.
      case "&": return s[p + 1] === "&" ? two("&&") : one("&");
      // Exclusive or.
      case "^": return one("^");
      // Bitwise or, or logical or.
      case "|": return s[p + 1] === "|" ? two("||") : one("|");
      // Bitwise not.
      case "~": return one("~");
    }
    // iRules words take precedence over the eq/ne prefix rule.
    if (this.mode === "irules" && lowAlpha(c)) {
      // The whole word.
      let q = p;
      // Letters, digits and underscores.
      while (lowAlnum(s[q])) q++;
      // One of F5's operator words.
      const op = IRULES_WORDS[s.slice(p, q)];
      // Found: that operator.
      if (op) {
        // The lexeme spans the word.
        this.lex = { type: op, start: p, end: q };
        // Continue after it.
        this.next = q;
        // Done.
        return;
      }
    }
    // "eq" and "ne" are recognised by their first two letters alone.
    if (c === "e" && s[p + 1] === "q") return two("eq");
    // The same for "ne".
    if (c === "n" && s[p + 1] === "e") return two("ne");
    // A name: a function, or a boolean word.
    if (lowAlpha(c)) {
      // Scan the name.
      let q = p;
      // Letters, digits and underscores (on the low byte).
      while (lowAlnum(s[q])) q++;
      // The boolean words are literals.
      const word = s.slice(p, q);
      // Exact, lower-case spellings only.
      this.lex = { type: BOOL_WORDS.has(word) ? "LITERAL" : "FUNC_NAME", start: p, end: q };
      // Continue after it.
      this.next = q;
      // Done.
      return;
    }
    // Anything else is not allowed in an expression.
    return one("UNKNOWN_CHAR");
  }

  /** condExpr ::= lorExpr ['?' condExpr ':' condExpr] */
  cond(): ExprNode {
    // Where this sub-expression starts.
    const start = this.lex.start;
    // The condition (or the whole expression).
    const c = this.lor();
    // Not a ternary.
    if (this.cur() !== "?") return c;
    // Skip "?".
    this.advance();
    // The "then" value.
    const a = this.cond();
    // The colon is required.
    if (this.cur() !== ":") this.syntax("missing colon from ternary conditional");
    // Skip ":".
    this.advance();
    // The "else" value.
    const b = this.cond();
    // The ternary node.
    return { t: "tern", c, a, b, start, end: this.prevEnd };
  }

  /** A left-associative binary level. */
  binary(ops: Lex[], sub: () => ExprNode): ExprNode {
    // Where it starts.
    const start = this.lex.start;
    // The first operand.
    let l = sub();
    // Repeated operators at this level.
    while (ops.includes(this.cur())) {
      // The operator lexeme.
      const opLex = this.lex;
      // Skip it.
      this.advance();
      // The right operand.
      const r = sub();
      // Build the node; opText keeps the spelling (e.g. "and" for &&).
      l = { t: "bin", op: opLex.type, opText: this.src.slice(opLex.start, opLex.end), l, r, start, end: this.prevEnd, opStart: opLex.start, opEnd: opLex.end };
    }
    // The finished level.
    return l;
  }

  /** lorExpr: || (and "or"). */
  lor(): ExprNode {
    // Logical or.
    return this.binary(["||"], () => this.land());
  }

  /** landExpr: && (and "and"). */
  land(): ExprNode {
    // Logical and.
    return this.binary(["&&"], () => this.bitor());
  }

  /** bitOrExpr. */
  bitor(): ExprNode {
    // Bitwise or.
    return this.binary(["|"], () => this.bitxor());
  }

  /** bitXorExpr. */
  bitxor(): ExprNode {
    // Bitwise xor.
    return this.binary(["^"], () => this.bitand());
  }

  /** bitAndExpr. */
  bitand(): ExprNode {
    // Bitwise and.
    return this.binary(["&"], () => this.equality());
  }

  /** equalityExpr: == != eq ne (and F5's string operators in iRules mode). */
  equality(): ExprNode {
    // The operators at this level.
    return this.binary(["==", "!=", "eq", "ne", "contains", "starts_with", "ends_with", "equals", "matches_glob", "matches_regex"], () => this.relational());
  }

  /** relationalExpr. */
  relational(): ExprNode {
    // Ordering comparisons.
    return this.binary(["<", ">", "<=", ">="], () => this.shift());
  }

  /** shiftExpr. */
  shift(): ExprNode {
    // Shifts.
    return this.binary(["<<", ">>"], () => this.add());
  }

  /** addExpr. */
  add(): ExprNode {
    // Addition and subtraction.
    return this.binary(["+", "-"], () => this.mul());
  }

  /** multiplyExpr. */
  mul(): ExprNode {
    // Multiplication, division, remainder.
    return this.binary(["*", "/", "%"], () => this.unary());
  }

  /** unaryExpr. */
  unary(): ExprNode {
    // The current lexeme.
    const lx = this.lex;
    // A unary operator.
    if (lx.type === "+" || lx.type === "-" || lx.type === "~" || lx.type === "!") {
      // Skip it.
      this.advance();
      // Its operand (unary operators nest: - - 1).
      const arg = this.unary();
      // The node.
      return { t: "un", op: lx.type, opText: this.src.slice(lx.start, lx.end), arg, start: lx.start, end: this.prevEnd, opStart: lx.start };
    }
    // Otherwise a primary.
    return this.primary();
  }

  /** primaryExpr. */
  primary(): ExprNode {
    // The current lexeme.
    const lx = this.lex;
    // The text.
    const s = this.src;
    // Parenthesised expression.
    if (lx.type === "OPEN_PAREN") {
      // Skip "(".
      this.advance();
      // The inner expression.
      const e = this.cond();
      // ")" is required.
      if (this.cur() !== "CLOSE_PAREN") this.syntax("looking for close parenthesis");
      // Where the ")" ends.
      const end = this.lex.end;
      // Skip ")".
      this.advance();
      // The paren node.
      return { t: "paren", e, start: lx.start, end };
    }
    // The node built by the cases below.
    let node: ExprNode;
    // Dispatch.
    switch (lx.type) {
      // A number or boolean word.
      case "LITERAL":
        // Literal text.
        node = { t: "lit", text: s.slice(lx.start, lx.end), start: lx.start, end: lx.end };
        // Done.
        break;
      // A variable (or a lone "$").
      case "DOLLAR": {
        // Read the name (throws on a missing brace).
        let v: { part: Part | null; end: number };
        // Tcl's parse errors keep their wording.
        try { v = parseVarAt(s, lx.start); } catch (e) { throw new TclExprError((e as Error).message, (e as TclParseError).pos ?? lx.start); }
        // A lone "$" is the text "$".
        node = v.part === null || v.part.kind !== "var" ? { t: "dollar", start: lx.start, end: lx.start + 1 } : { t: "var", name: v.part.name, start: lx.start, end: v.end };
        // Continue after it.
        this.next = node.end;
        // Done.
        break;
      }
      // A quoted string.
      case "QUOTE": {
        // Parse it (throws on a missing quote).
        let q: ReturnType<typeof parseQuotedAt>;
        // Tcl's parse errors keep their wording.
        try { q = parseQuotedAt(s, lx.start); } catch (e) { throw new TclExprError((e as Error).message, (e as TclParseError).pos ?? lx.start); }
        // The node.
        node = { t: "quote", parts: q.word.parts, start: lx.start, end: q.end };
        // Continue after it.
        this.next = q.end;
        // Done.
        break;
      }
      // A braced string.
      case "OPEN_BRACE": {
        // Parse it (throws on a missing brace).
        let b: ReturnType<typeof parseBracedAt>;
        // Tcl's parse errors keep their wording.
        try { b = parseBracedAt(s, lx.start); } catch (e) { throw new TclExprError((e as Error).message, (e as TclParseError).pos ?? lx.start); }
        // The node (the text has backslash-newline already replaced).
        node = { t: "brace", text: b.word.parts.map((p) => (p.kind === "text" ? p.text : "")).join(""), start: lx.start, end: b.end };
        // Continue after it.
        this.next = b.end;
        // Done.
        break;
      }
      // A command substitution.
      case "OPEN_BRACKET": {
        // Parse it (throws on a missing bracket).
        let c: ReturnType<typeof parseCommandAt>;
        // Tcl's parse errors keep their wording.
        try { c = parseCommandAt(s, lx.start); } catch (e) { throw new TclExprError((e as Error).message, (e as TclParseError).pos ?? lx.start); }
        // The node.
        node = { t: "cmd", script: c.script, start: lx.start, end: c.end };
        // Continue after it.
        this.next = c.end;
        // Done.
        break;
      }
      // A function call.
      case "FUNC_NAME": {
        // The name.
        const name = s.slice(lx.start, lx.end);
        // Skip it.
        this.advance();
        // "(" must follow.
        if (this.cur() !== "OPEN_PAREN") this.syntax(name in MATH_FUNCS ? "expected parenthesis enclosing function arguments" : "variable references require preceding $");
        // Skip "(".
        this.advance();
        // The arguments.
        const args: ExprNode[] = [];
        // Until ")".
        while (this.cur() !== "CLOSE_PAREN") {
          // One argument.
          args.push(this.cond());
          // A comma continues the list.
          if (this.cur() === "COMMA") this.advance();
          // Anything but ")" is an error.
          else if (this.cur() !== "CLOSE_PAREN") this.syntax("missing close parenthesis at end of function call");
        }
        // The node ends at ")".
        node = { t: "fn", name, args, start: lx.start, end: this.lex.end };
        // Continue after ")".
        this.next = this.lex.end;
        // Done.
        break;
      }
      // The errors, worded as Tcl words them.
      case "COMMA": return this.syntax("commas can only separate function arguments");
      // End of input where an operand was needed.
      case "END": return this.syntax("premature end of expression");
      // A single "=".
      case "UNKNOWN": return this.syntax("single equality character not legal in expressions");
      // A character Tcl does not accept.
      case "UNKNOWN_CHAR": return this.syntax("character not legal in expressions");
      // A "?" where an operand was needed.
      case "?": return this.syntax("unexpected ternary 'then' separator");
      // A ":" where an operand was needed.
      case ":": return this.syntax("unexpected ternary 'else' separator");
      // A ")" where an operand was needed.
      case "CLOSE_PAREN": return this.syntax("unexpected close parenthesis");
      // Any other operator where an operand was needed.
      default: return this.syntax(`unexpected operator ${lx.type}`);
    }
    // Read the lexeme after the primary.
    this.advance();
    // The primary.
    return node;
  }
}

/** Parse an expression; throws TclExprError (syntax) or TclError (bad literal). */
export function parseExpr(src: string, mode: ExprMode = "tcl"): ExprNode {
  // A fresh parser.
  const p = new ExprParser(src, mode);
  // The first lexeme.
  p.advance();
  // The whole expression.
  const e = p.cond();
  // Nothing may follow it.
  if (p.cur() !== "END") p.syntax("extra tokens at end of expression");
  // The tree.
  return e;
}

/**
 * The compile-time checks of tclCompExpr.c, in the order Tcl compiles: an
 * unknown math function, then too few / too many arguments.
 */
export function compileCheck(e: ExprNode): void {
  // Visit operands in compile order.
  switch (e.t) {
    // Unary: its operand.
    case "un": return compileCheck(e.arg);
    // Binary: left, then right.
    case "bin": compileCheck(e.l); return compileCheck(e.r);
    // Ternary: condition, then, else.
    case "tern": compileCheck(e.c); compileCheck(e.a); return compileCheck(e.b);
    // Parentheses: the inside.
    case "paren": return compileCheck(e.e);
    // A function: name first, then each argument, then the count.
    case "fn": {
      // Unknown names fail before the arguments are looked at.
      if (!(e.name in MATH_FUNCS)) throw new TclExprError(`unknown math function "${e.name}"`, e.start);
      // The expected count.
      const n = MATH_FUNCS[e.name];
      // rand() takes none.
      if (n === 0 && e.args.length > 0) throw new TclExprError("too many arguments for math function", e.start);
      // Each expected argument, in order.
      for (let i = 0; i < n; i++) {
        // Running out first.
        if (i >= e.args.length) throw new TclExprError("too few arguments for math function", e.start);
        // Check the argument itself.
        compileCheck(e.args[i]);
      }
      // Extra arguments.
      if (e.args.length > n) throw new TclExprError("too many arguments for math function", e.start);
      // Fine.
      return;
    }
    // Operands have nothing to check here.
    default: return;
  }
}

/** True when compiling the node emits an operator instruction (hasOperators). */
function hasOperators(e: ExprNode): boolean {
  // Operators, and anything containing one, count; function calls count only through their arguments.
  switch (e.t) {
    // Operators.
    case "un": case "bin": case "tern": return true;
    // Parentheses are transparent.
    case "paren": return hasOperators(e.e);
    // A call's arguments.
    case "fn": return e.args.some(hasOperators);
    // Operands.
    default: return false;
  }
}

// ---------------------------------------------------------------------------
// EVALUATION (the instructions of tclExecute.c)
// ---------------------------------------------------------------------------

/** What the evaluator needs from its surroundings. */
export interface ExprContext {
  // Read a variable (throw TclError "can't read ..." when missing).
  getVar(name: string): TclObj;
  // Run a [command] and return its result.
  runCommand(script: string): TclObj;
  // Language mode.
  mode: ExprMode;
  // matches_regex: does the string match the pattern? (throws when unsupported)
  regexMatch?(subject: string, pattern: string): boolean;
}

/** A teaching note attached to a step: a code plus parameters for the UI. */
export interface Note {
  // What happened, as a stable code the UI translates.
  code: string;
  // Values the sentence needs.
  params?: Record<string, string | number | boolean>;
}

/** One evaluated node: its value and how it was reached. */
export interface Step {
  // The node.
  node: ExprNode;
  // The value produced, as Tcl would print it (without disturbing the value).
  value?: string;
  // How the value is held: "int", "double", "string" or "boolean".
  held?: string;
  // Explanations, in order.
  notes: Note[];
  // Sub-steps (operands) in evaluation order.
  kids: Step[];
  // True when the node was never evaluated (short-circuit, other branch).
  skipped?: boolean;
  // The error raised here, if any.
  error?: string;
  // True when the answer depends on the platform Tcl was built for.
  platform?: string;
}

/** The outcome of evaluating an expression. */
export interface ExprResult {
  // The parsed tree.
  tree: ExprNode;
  // The evaluation trace.
  trace: Step;
  // The result value (absent on error).
  value?: TclObj;
  // The error message (absent on success).
  error?: string;
  // Where the error was found.
  errorPos?: number;
  // The stage that failed: "parse", "compile" or "run".
  stage?: "parse" | "compile" | "run";
}

/** The printed form of a value, WITHOUT generating its string (no side effects). */
export function peek(o: TclObj): string {
  // A value with a string shows it.
  if (o.hasString()) return o.string;
  // Otherwise format the internal representation, as Tcl would when asked.
  return o.type === "int" ? formatInt(o.int) : o.type === "double" ? (Number.isNaN(o.dbl) && o.nanNeg ? "-nan" : formatDouble(o.dbl)) : o.type === "boolean" ? String(o.bool) : "";
}

/** How a value is held right now, for the trace. */
function heldAs(o: TclObj): string {
  // Internal representation, or plain string.
  return o.type === "none" ? "string" : o.type;
}

/** 64-bit wrap of a C long result. */
const wrap = (v: bigint) => BigInt.asIntN(64, v);
/** True when a value is outside the 32-bit range (a 32-bit build would differ). */
const outside32 = (v: bigint) => v > 2147483647n || v < -2147483648n;

/** A literal pool: identical literals in one expression are one shared value. */
type Pool = Map<string, TclObj>;

/** Get (or create) the shared literal for a text. */
function literal(pool: Pool, text: string): TclObj {
  // Reuse an existing one.
  let o = pool.get(text);
  // Create on first use.
  if (!o) {
    // A plain string value.
    o = TclObj.fromString(text);
    // Remember it.
    pool.set(text, o);
  }
  // The shared literal.
  return o;
}

/** The operand rule of the arithmetic instructions; returns false when unusable. */
function arithOperand(o: TclObj): boolean {
  // An integer, or a double with no string, is used as it is.
  if (o.type === "int" || (o.type === "double" && !o.hasString())) return true;
  // Otherwise the string decides: integer-looking text is read only as an integer.
  return looksLikeInt(o.string) ? tryInt(o) : tryDouble(o);
}

/** IllegalExprOperandType's message for an operator. */
function badOperand(o: TclObj, op: string): TclError {
  // An empty operand has its own wording (a pure number never is empty).
  if (o.hasString() && o.string === "") return new TclError(`can't use empty string as operand of "${op}"`);
  // Otherwise the noun depends on what the text looks like.
  return new TclError(`can't use ${operandNoun(o.string)} as operand of "${op}"`);
}

/** The numeric value of an operand already converted by arithOperand. */
function numOf(o: TclObj): { kind: "int"; v: bigint } | { kind: "double"; v: number } {
  // Integers.
  if (o.type === "int") return { kind: "int", v: o.int };
  // Doubles.
  return { kind: "double", v: o.dbl };
}

/** The jump test of if/while/?:/&&/|| (doJumpTrue): numbers directly, else a boolean. */
function jumpTest(o: TclObj): number {
  // An integer.
  if (o.type === "int") return o.int !== 0n ? 1 : 0;
  // A double.
  if (o.type === "double") return o.dbl !== 0 ? 1 : 0;
  // Anything else goes through Tcl_GetBooleanFromObj (with its error message).
  return getBoolean(o);
}

/** The operand rule of INST_LAND / INST_LOR. */
function logicOperand(o: TclObj, op: string): number {
  // Integers and booleans.
  if (o.type === "int") return o.int !== 0n ? 1 : 0;
  // A boolean already converted.
  if (o.type === "boolean") return o.bool;
  // A double.
  if (o.type === "double") return o.dbl !== 0 ? 1 : 0;
  // Integer-looking text must be a valid integer (no boolean fallback).
  if (looksLikeInt(o.string)) {
    // Convert it.
    if (tryInt(o)) return o.int !== 0n ? 1 : 0;
    // Invalid (e.g. "08"): an operand error.
    throw badOperand(o, op);
  }
  // Otherwise a boolean (yes/no/true/false/on/off, or a number).
  if (tryBoolean(o)) return o.bool;
  // Not usable.
  throw badOperand(o, op);
}

/** C's strcmp on Tcl's UTF-8 (U+0000 is C0 80, so it sorts after U+007F). */
function utfCompare(a: string, b: string): number {
  // Walk both strings.
  const n = Math.min(a.length, b.length);
  // Compare by a key equal to the UTF-8 byte order.
  for (let i = 0; i < n; i++) {
    // Each side's key.
    const x = a.charCodeAt(i) === 0 ? 0x7f + 0.5 : a.charCodeAt(i), y = b.charCodeAt(i) === 0 ? 0x7f + 0.5 : b.charCodeAt(i);
    // First difference decides.
    if (x !== y) return x < y ? -1 : 1;
  }
  // A prefix sorts first.
  return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
}

/** The C library's math functions, as glibc reports their errors. */
function libm(name: string, x: number, y = 0): { value: number; errno?: "EDOM" | "ERANGE" } {
  // The raw result, from the browser's Math library.
  let v: number;
  // Which function.
  switch (name) {
    // Inverse trigonometry.
    case "acos": v = Math.acos(x); break;
    // Arcsine.
    case "asin": v = Math.asin(x); break;
    // Arctangent.
    case "atan": v = Math.atan(x); break;
    // Two-argument arctangent.
    case "atan2": v = Math.atan2(x, y); break;
    // Rounding up.
    case "ceil": v = Math.ceil(x); break;
    // Cosine.
    case "cos": v = Math.cos(x); break;
    // Hyperbolic cosine.
    case "cosh": v = Math.cosh(x); break;
    // Exponential.
    case "exp": v = Math.exp(x); break;
    // Rounding down.
    case "floor": v = Math.floor(x); break;
    // Floating remainder (JavaScript % is C's fmod).
    case "fmod": v = y === 0 ? NaN : x % y; break;
    // Hypotenuse.
    case "hypot": v = Math.hypot(x, y); break;
    // Natural logarithm.
    case "log": v = Math.log(x); break;
    // Base-10 logarithm.
    case "log10": v = Math.log10(x); break;
    // Power, with C99's special cases where JavaScript differs.
    case "pow": v = x === 1 || y === 0 ? 1 : x === -1 && !Number.isFinite(y) ? 1 : Math.pow(x, y); break;
    // Sine.
    case "sin": v = Math.sin(x); break;
    // Hyperbolic sine.
    case "sinh": v = Math.sinh(x); break;
    // Square root.
    case "sqrt": v = Math.sqrt(x); break;
    // Tangent.
    case "tan": v = Math.tan(x); break;
    // Hyperbolic tangent.
    default: v = Math.tanh(x); break;
  }
  // NaN from a finite argument is a domain error.
  if (Number.isNaN(v)) return { value: v, errno: "EDOM" };
  // A pole or an overflow.
  if (!Number.isFinite(v)) return { value: v, errno: Number.isFinite(x) && Number.isFinite(y) ? "ERANGE" : undefined };
  // glibc raises ERANGE for an inexact result in the denormal range (seen with
  // sin, atan, sinh, tanh, asin, atan2, hypot, fmod on tiny values) and when
  // exp or pow underflow to zero; an exact denormal (pow(2,-1074)) is fine.
  const tiny = v !== 0 && Math.abs(v) < 2.2250738585072014e-308;
  // Exact denormals: powers of two from pow and exp results that are exact.
  if (tiny && !(name === "pow" || name === "exp")) return { value: v, errno: "ERANGE" };
  // Zero from a non-zero exact answer (exp(-1000), pow(10,-400)).
  if (v === 0 && (name === "exp" || name === "pow") && x !== 0 && !(name === "pow" && y > 0 && x === 0)) return { value: v, errno: "ERANGE" };
  // No error.
  return { value: v };
}

/** Evaluate a parsed expression, filling `trace` (which survives an error). */
export function evalExpr(tree: ExprNode, ctx: ExprContext, trace: Step = { node: tree, notes: [], kids: [] }): { value: TclObj; trace: Step } {
  // Identical literals share one value within an expression.
  const pool: Pool = new Map();
  // The value.
  let v = evalNode(tree, ctx, pool, trace);
  // A lone operand (no operators at all) is converted to its canonical number.
  if (!hasOperators(tree)) v = canonicalize(v, trace);
  // Record the final value.
  trace.value = peek(v);
  // And how it is held.
  trace.held = heldAs(v);
  // Done.
  return { value: v, trace };
}

/** INST_TRY_CVT_TO_NUMERIC: a lone value that reads as a number becomes that number. */
function canonicalize(o: TclObj, step: Step): TclObj {
  // The text before conversion (as it would print).
  const before = peek(o);
  // Values that are not already a pure number are tried, silently.
  if (!(o.type === "int" || (o.type === "double" && !o.hasString()))) {
    // Integer-looking text is read only as an integer; anything else as a double.
    if (looksLikeInt(o.string)) tryInt(o);
    // Otherwise a double.
    else tryDouble(o);
  }
  // Not a number: the value stays the string it is.
  if (!o.isNumeric()) {
    // Say so.
    step.notes.push({ code: "canon-none", params: { text: before } });
    // Unchanged.
    return o;
  }
  // A fresh value with no string: it prints canonically ("0x10" becomes 16).
  const out = o.type === "int" ? TclObj.fromInt(o.int) : TclObj.fromDouble(o.dbl);
  // Infinity or NaN cannot be returned.
  if (out.type === "double" && !Number.isFinite(out.dbl)) throw new TclError(floatErrorMessage(out.dbl));
  // Explain the change when the text differs.
  if (peek(out) !== before) step.notes.push({ code: "canon", params: { from: before, to: peek(out) } });
  // The canonical number.
  return out;
}

/** Evaluate one node into its step, returning the value (throws TclError). */
function evalNode(e: ExprNode, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // Run the node; record the error on this step if it fails.
  try {
    // The value.
    const v = evalInner(e, ctx, pool, step);
    // Record it without side effects.
    step.value = peek(v);
    // And how it is held.
    step.held = heldAs(v);
    // Done.
    return v;
  } catch (err) {
    // The innermost failing step keeps the message.
    if (!step.error && !step.kids.some((k) => k.error)) step.error = (err as Error).message;
    // Propagate.
    throw err;
  }
}

/** Evaluate a child node into a new sub-step. */
function child(e: ExprNode, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // The sub-step.
  const s: Step = { node: e, notes: [], kids: [] };
  // Attach it.
  step.kids.push(s);
  // Evaluate it.
  return evalNode(e, ctx, pool, s);
}

/** Record a node that was not evaluated. */
function skip(e: ExprNode, step: Step): void {
  // A skipped sub-step.
  step.kids.push({ node: e, notes: [], kids: [], skipped: true });
}

/** The heart of the evaluator: one node's semantics. */
function evalInner(e: ExprNode, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // Dispatch on the node kind.
  switch (e.t) {
    // A literal number or boolean word.
    case "lit": {
      // Explain how the literal reads.
      const o = literal(pool, e.text);
      // Integer literals: note the base (octal and hex surprise people).
      if (looksLikeInt(e.text)) step.notes.push({ code: "lit-int", params: { base: /^0[xX]/.test(e.text) ? 16 : /^0[0-7]/.test(e.text) ? 8 : 10 } });
      // Boolean words.
      else if (/^[a-z]+$/.test(e.text)) step.notes.push({ code: "lit-bool" });
      // Floating point.
      else step.notes.push({ code: "lit-double" });
      // The shared literal.
      return o;
    }
    // A braced string: literal text.
    case "brace":
      // Note it.
      step.notes.push({ code: "braced" });
      // The literal.
      return literal(pool, e.text);
    // A lone dollar sign.
    case "dollar":
      // Note it.
      step.notes.push({ code: "lone-dollar" });
      // The text "$".
      return literal(pool, "$");
    // A variable.
    case "var":
      // Note it.
      step.notes.push({ code: "var", params: { name: e.name } });
      // Its value object (shared with the variable).
      return ctx.getVar(e.name);
    // A command substitution.
    case "cmd":
      // Note it.
      step.notes.push({ code: "cmd" });
      // Its result.
      return ctx.runCommand(e.script);
    // A quoted string.
    case "quote": {
      // No substitutions: a literal.
      if (e.parts.every((p) => p.kind === "text")) {
        // Note it.
        step.notes.push({ code: "quoted" });
        // The literal text.
        return literal(pool, e.parts.map((p) => (p.kind === "text" ? p.text : "")).join(""));
      }
      // A single substitution is that value itself.
      if (e.parts.length === 1) {
        // The part.
        const p = e.parts[0];
        // A variable.
        if (p.kind === "var") { step.notes.push({ code: "var", params: { name: p.name } }); return ctx.getVar(p.name); }
        // A command.
        if (p.kind === "cmd") { step.notes.push({ code: "cmd" }); return ctx.runCommand(p.script); }
      }
      // Several parts are concatenated into a new string.
      let text = "";
      // Each part in turn.
      for (const p of e.parts) text += p.kind === "text" ? p.text : p.kind === "var" ? ctx.getVar(p.name).string : ctx.runCommand(p.script).string;
      // Note it.
      step.notes.push({ code: "quoted-subst" });
      // A fresh string value.
      return TclObj.fromString(text);
    }
    // Parentheses: the inside, unchanged.
    case "paren":
      // Evaluate the inner expression as a sub-step.
      return child(e.e, ctx, pool, step);
    // Unary operators.
    case "un": return evalUnary(e, ctx, pool, step);
    // Binary operators.
    case "bin": return evalBinary(e, ctx, pool, step);
    // The ternary.
    case "tern": {
      // The condition.
      const c = child(e.c, ctx, pool, step);
      // Its truth, as the jump instruction tests it.
      const t = jumpTest(c);
      // Note which branch.
      step.notes.push({ code: "ternary", params: { branch: t ? "then" : "else" } });
      // The chosen branch, the other one skipped.
      const chosen = t ? e.a : e.b;
      // Mark the other branch skipped (order kept: then, else).
      if (!t) skip(e.a, step);
      // Evaluate the chosen branch.
      const s: Step = { node: chosen, notes: [], kids: [] };
      // Attach it.
      step.kids.push(s);
      // Its value.
      let v = evalNode(chosen, ctx, pool, s);
      // A branch without operators is canonicalized.
      if (!hasOperators(chosen)) v = canonicalize(v, s);
      // Mark the other branch skipped.
      if (t) skip(e.b, step);
      // The result.
      return v;
    }
    // Math functions.
    case "fn": return evalFunc(e, ctx, pool, step);
  }
}

/** The unary operators: - + ! ~. */
function evalUnary(e: Extract<ExprNode, { t: "un" }>, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // The operand.
  const o = child(e.arg, ctx, pool, step);
  // The operator.
  const op = e.op;
  // Bitwise not: integers only.
  if (op === "~") {
    // Convert (any failure is an operand error).
    if (o.type !== "int" && !tryInt(o)) throw badOperand(o, "~");
    // Note it.
    step.notes.push({ code: "bitnot" });
    // The complement.
    return TclObj.fromInt(~o.int);
  }
  // Unary plus, minus, logical not: numbers (and booleans for !).
  if (o.type !== "int" && (o.type !== "double" || o.hasString())) {
    // A pure boolean becomes an integer.
    if (o.type === "boolean" && !o.hasString()) {
      // Reuse its value.
      o.type = "int";
      // As an integer.
      o.int = BigInt(o.bool);
    } else {
      // Integer-looking text is read only as an integer.
      let ok = looksLikeInt(o.string) ? tryInt(o) : tryDouble(o);
      // ! also accepts a boolean word (and integer-looking text that strtod reads).
      if (!ok && op === "!") ok = tryBoolean(o);
      // Unusable.
      if (!ok) throw badOperand(o, op);
    }
  }
  // Plus: the canonical number.
  if (op === "+") {
    // Note it.
    step.notes.push({ code: "uplus" });
    // A fresh number prints canonically.
    return o.type === "int" ? TclObj.fromInt(o.int) : o.type === "boolean" ? TclObj.fromInt(BigInt(o.bool)) : TclObj.fromDouble(o.dbl, o.nanNeg);
  }
  // Minus.
  if (op === "-") {
    // Integers (and booleans) negate as C longs.
    if (o.type === "int" || o.type === "boolean") {
      // The operand value.
      const v = o.type === "int" ? o.int : BigInt(o.bool);
      // The result.
      const r = wrap(-v);
      // Negating the smallest long overflows.
      if (r !== -v) step.platform = "int-overflow";
      // Note it.
      step.notes.push({ code: "uminus" });
      // The negation.
      return TclObj.fromInt(r);
    }
    // Note it.
    step.notes.push({ code: "uminus" });
    // A double (negating a NaN flips its sign bit, which printing shows).
    return TclObj.fromDouble(-o.dbl, Number.isNaN(o.dbl) && !o.nanNeg);
  }
  // Logical not.
  step.notes.push({ code: "lnot" });
  // Integers and booleans.
  if (o.type === "int") return TclObj.fromInt(o.int === 0n ? 1n : 0n);
  // A boolean.
  if (o.type === "boolean") return TclObj.fromInt(o.bool ? 0n : 1n);
  // A double.
  return TclObj.fromInt(o.dbl === 0 ? 1n : 0n);
}

/** The binary operators. */
function evalBinary(e: Extract<ExprNode, { t: "bin" }>, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // The operator.
  const op = e.op;
  // Logical and / or, with short-circuit (compiled as jumps in Tcl 8.4).
  if (op === "&&" || op === "||") {
    // The left side.
    const l = child(e.l, ctx, pool, step);
    // Its truth (jump instruction: numbers directly, else a boolean).
    const lt = jumpTest(l);
    // && stops at false, || at true.
    if ((op === "&&" && !lt) || (op === "||" && lt)) {
      // Note the short-circuit.
      step.notes.push({ code: "short-circuit", params: { op, left: lt } });
      // The right side never runs.
      skip(e.r, step);
      // The pushed literal "0" or "1".
      return literal(pool, lt ? "1" : "0");
    }
    // The right side.
    const r = child(e.r, ctx, pool, step);
    // Its truth under the INST_LAND / INST_LOR rules.
    const rt = logicOperand(r, op);
    // Note it.
    step.notes.push({ code: "logic", params: { op, left: lt, right: rt } });
    // The result.
    return TclObj.fromInt(BigInt(op === "&&" ? lt && rt : lt || rt));
  }
  // Every other operator evaluates both sides, left first.
  const l = child(e.l, ctx, pool, step);
  // The right side.
  const r = child(e.r, ctx, pool, step);
  // String equality.
  if (op === "eq" || op === "ne" || op === "equals") {
    // Same value object, or the same text.
    const same = l === r || l.string === r.string;
    // Note it.
    step.notes.push({ code: "streq", params: { op } });
    // The result.
    return TclObj.fromInt(BigInt((op === "ne" ? !same : same) ? 1 : 0));
  }
  // F5's string operators.
  if (op === "contains" || op === "starts_with" || op === "ends_with" || op === "matches_glob" || op === "matches_regex") {
    // The two strings.
    const a = l.string, b = r.string;
    // The test.
    let hit: boolean;
    // Substring.
    if (op === "contains") hit = a.includes(b);
    // Prefix.
    else if (op === "starts_with") hit = a.startsWith(b);
    // Suffix.
    else if (op === "ends_with") hit = a.endsWith(b);
    // Glob pattern on the right.
    else if (op === "matches_glob") hit = globMatch(b, a);
    // Regular expression on the right.
    else {
      // The host must provide a regex matcher.
      if (!ctx.regexMatch) throw new TclError("matches_regex is not available in this tool");
      // Test it.
      hit = ctx.regexMatch(a, b);
    }
    // Note it.
    step.notes.push({ code: "f5-op", params: { op } });
    // The result.
    return TclObj.fromInt(hit ? 1n : 0n);
  }
  // Comparisons.
  if (op === "==" || op === "!=" || op === "<" || op === ">" || op === "<=" || op === ">=") return compare(op, l, r, step);
  // Integer-only operators.
  if (op === "%" || op === "<<" || op === ">>" || op === "&" || op === "|" || op === "^") {
    // Both operands must be integers.
    if (l.type !== "int" && !tryInt(l)) throw badOperand(l, op);
    // The right one too.
    if (r.type !== "int" && !tryInt(r)) throw badOperand(r, op);
    // The values.
    const a = l.int, b = r.int;
    // Remainder: the sign of the divisor.
    if (op === "%") {
      // Division by zero.
      if (b === 0n) throw new TclError("divide by zero");
      // Make the divisor positive, as the C code does.
      const neg = b < 0n;
      // Normalised divisor and dividend (C long arithmetic wraps).
      const d = neg ? wrap(-b) : b, n = neg ? wrap(-a) : a;
      // C's truncating remainder.
      let rem = d === 0n ? 0n : n % d;
      // Shift it into [0, d).
      if (rem < 0n) rem += d;
      // Restore the sign.
      const res = neg ? -rem : rem;
      // Note it.
      step.notes.push({ code: "mod", params: { a: formatInt(a), b: formatInt(b) } });
      // The remainder.
      return TclObj.fromInt(res);
    }
    // Shifts: the count is masked to 0..63 by the processor (C leaves it undefined).
    if (op === "<<" || op === ">>") {
      // The masked count.
      const count = BigInt.asUintN(6, b);
      // Counts outside 0..63 depend on the platform.
      if (b < 0n || b > 63n) step.platform = "shift-count";
      // Left shift.
      const res = op === "<<" ? wrap(a << count) : a >> count;
      // Note it.
      step.notes.push({ code: op === "<<" ? "shl" : "shr", params: { count: Number(count) } });
      // A left shift that leaves 32 bits would differ on a 32-bit build.
      if (op === "<<" && !outside32(a) && outside32(res)) step.platform = step.platform ?? "int-range-32";
      // The result.
      return TclObj.fromInt(res);
    }
    // Bitwise operators.
    step.notes.push({ code: "bitwise", params: { op } });
    // And, or, xor.
    return TclObj.fromInt(op === "&" ? a & b : op === "|" ? a | b : a ^ b);
  }
  // Arithmetic: + - * /.
  if (!arithOperand(l)) throw badOperand(l, op);
  // The right operand.
  if (!arithOperand(r)) throw badOperand(r, op);
  // The two numbers.
  const a = numOf(l), b = numOf(r);
  // Either double: floating-point arithmetic.
  if (a.kind === "double" || b.kind === "double") {
    // Promote integers.
    const x = a.kind === "double" ? a.v : Number(a.v), y = b.kind === "double" ? b.v : Number(b.v);
    // Division by zero is checked first.
    if (op === "/" && y === 0) throw new TclError("divide by zero");
    // The result.
    const res = op === "+" ? x + y : op === "-" ? x - y : op === "*" ? x * y : x / y;
    // NaN or infinity is an error.
    if (!Number.isFinite(res)) throw new TclError(floatErrorMessage(res));
    // Note it.
    step.notes.push({ code: "arith", params: { op, mode: "double", a: formatDouble(x), b: formatDouble(y) } });
    // The double.
    return TclObj.fromDouble(res);
  }
  // Integer arithmetic on C longs.
  const x = a.v, y = b.v;
  // The exact result, before wrapping.
  let exact: bigint;
  // Division: rounds toward minus infinity.
  if (op === "/") {
    // Division by zero.
    if (y === 0n) throw new TclError("divide by zero");
    // A positive divisor, as the C code arranges.
    const neg = y < 0n;
    // Normalised operands (C long arithmetic wraps).
    const d = neg ? wrap(-y) : y, n = neg ? wrap(-x) : x;
    // C's truncating quotient and remainder.
    let q = d === 0n ? 0n : n / d;
    // The remainder.
    const rem = d === 0n ? 0n : n % d;
    // A negative remainder means one step further down.
    if (rem < 0n) q -= 1n;
    // The quotient.
    exact = q;
    // Note it (floor division is the surprise worth naming).
    step.notes.push({ code: "intdiv", params: { a: formatInt(x), b: formatInt(y), floored: rem !== 0n && (x < 0n) !== (y < 0n) } });
  } else {
    // Add, subtract, multiply.
    exact = op === "+" ? x + y : op === "-" ? x - y : x * y;
    // Note it.
    step.notes.push({ code: "arith", params: { op, mode: "int", a: formatInt(x), b: formatInt(y) } });
  }
  // The C long result.
  const res = wrap(exact);
  // Overflow wraps around (undefined in C; the reference build wraps).
  if (res !== exact) step.platform = "int-overflow";
  // Leaving the 32-bit range from inside it would differ on a 32-bit build.
  else if (!outside32(x) && !outside32(y) && outside32(res)) step.platform = "int-range-32";
  // The integer.
  return TclObj.fromInt(res);
}

/** The comparison instructions: numeric when both sides are numbers, else strings. */
function compare(op: string, l: TclObj, r: TclObj, step: Step): TclObj {
  // The comparison of two keys.
  const decide = (c: number) => (op === "==" ? c === 0 : op === "!=" ? c !== 0 : op === "<" ? c < 0 : op === ">" ? c > 0 : op === "<=" ? c <= 0 : c >= 0);
  // The same value object on both sides is equal to itself.
  if (l === r) {
    // Note it.
    step.notes.push({ code: "cmp-same" });
    // The result.
    return TclObj.fromInt(decide(0) ? 1n : 0n);
  }
  // An empty side means a string comparison, without trying numbers.
  const empty = (o: TclObj) => o.hasString() && o.string === "";
  // Why each side is not numeric (for the note).
  let why = "";
  // Try numbers only when neither side is empty.
  if (!empty(l) && !empty(r)) {
    // The left side.
    if (!l.isNumeric()) {
      // Integer-looking text is read only as an integer.
      if (looksLikeInt(l.string) ? !tryInt(l) : !tryDouble(l)) why = why || (looksLikeInt(l.string) ? "left-bad-int" : "left-text");
    }
    // The right side.
    if (!r.isNumeric()) {
      // The same rule.
      if (looksLikeInt(r.string) ? !tryInt(r) : !tryDouble(r)) why = why || (looksLikeInt(r.string) ? "right-bad-int" : "right-text");
    }
  } else why = "empty";
  // Not both numbers: compare the strings (C strcmp on Tcl's UTF-8).
  if (!l.isNumeric() || !r.isNumeric()) {
    // Note it, with the reason.
    step.notes.push({ code: "cmp-string", params: { why: why || "text", left: l.string, right: r.string } });
    // The comparison.
    return TclObj.fromInt(decide(utfCompare(l.string, r.string)) ? 1n : 0n);
  }
  // A double on either side: compare as doubles.
  if (l.type === "double" || r.type === "double") {
    // The two doubles.
    const x = l.type === "double" ? l.dbl : Number(l.int), y = r.type === "double" ? r.dbl : Number(r.int);
    // Note it.
    step.notes.push({ code: "cmp-number", params: { mode: "double", left: formatDouble(x), right: formatDouble(y) } });
    // NaN compares false with everything (C semantics).
    const res = op === "==" ? x === y : op === "!=" ? x !== y : op === "<" ? x < y : op === ">" ? x > y : op === "<=" ? x <= y : x >= y;
    // The result.
    return TclObj.fromInt(res ? 1n : 0n);
  }
  // Integers.
  step.notes.push({ code: "cmp-number", params: { mode: "int", left: formatInt(l.int), right: formatInt(r.int) } });
  // The comparison.
  return TclObj.fromInt(decide(l.int === r.int ? 0 : l.int < r.int ? -1 : 1) ? 1n : 0n);
}

/** VerifyExprObjType: a math function argument must be a number. */
function mathArg(o: TclObj): void {
  // Already numeric.
  if (o.isNumeric()) return;
  // Integer-looking text must be a valid integer.
  const ok = looksLikeInt(o.string) ? tryInt(o) : tryDouble(o);
  // Usable.
  if (ok) return;
  // An invalid octal number has its own message (TclCheckBadOctal).
  if (looksLikeBadOctal(o.string)) throw new TclError("argument to math function was an invalid octal number");
  // Everything else.
  throw new TclError("argument to math function didn't have numeric value");
}

/** The math functions. */
function evalFunc(e: Extract<ExprNode, { t: "fn" }>, ctx: ExprContext, pool: Pool, step: Step): TclObj {
  // rand() and srand() are random: refused.
  if (e.name === "rand" || e.name === "srand") throw new TclError(`${e.name}() returns a random number, which this tool does not model`);
  // Evaluate the arguments in order.
  const args = e.args.map((a) => child(a, ctx, pool, step));
  // Note the call.
  step.notes.push({ code: "fn", params: { name: e.name } });
  // Each argument must be numeric.
  for (const a of args) mathArg(a);
  // The first argument's numeric value.
  const x = args[0];
  // The double value of an argument.
  const dbl = (o: TclObj) => (o.type === "double" ? o.dbl : Number(o.int));
  // Dispatch.
  switch (e.name) {
    // Absolute value keeps the type.
    case "abs": {
      // Integers.
      if (x.type === "int") {
        // The smallest long has no positive counterpart.
        if (x.int === -9223372036854775808n) throw new TclError("integer value too large to represent");
        // The magnitude.
        return TclObj.fromInt(x.int < 0n ? -x.int : x.int);
      }
      // Doubles.
      const d = Math.abs(x.dbl);
      // Infinity or NaN.
      if (!Number.isFinite(d)) throw new TclError(floatErrorMessage(d));
      // The magnitude.
      return TclObj.fromDouble(d);
    }
    // To double.
    case "double": return TclObj.fromDouble(dbl(x));
    // To integer: truncation toward zero, range-checked first.
    case "int": case "wide": {
      // Integers pass through.
      if (x.type === "int") return TclObj.fromInt(x.int);
      // The double.
      const d = x.dbl;
      // Out of the long range.
      if ((d < 0 && d < -9223372036854775808) || (d >= 0 && d > 9223372036854775807)) throw new TclError("integer value too large to represent");
      // NaN or infinity.
      if (!Number.isFinite(d)) throw new TclError(floatErrorMessage(d));
      // Exactly 2^63 overflows the conversion (the reference build yields the smallest long).
      if (d === 9223372036854775808) { step.platform = "int-overflow"; return TclObj.fromInt(-9223372036854775808n); }
      // Truncate.
      return TclObj.fromInt(BigInt(Math.trunc(d)));
    }
    // Round half away from zero, computed as (long)(d +/- 0.5) in doubles.
    case "round": {
      // Integers pass through.
      if (x.type === "int") return TclObj.fromInt(x.int);
      // The double.
      const d = x.dbl;
      // NaN: the C conversion is undefined.
      if (Number.isNaN(d)) throw new TclError("round() of a NaN is undefined in C; not modelled");
      // Negative values.
      if (d < 0) {
        // Out of range.
        if (d <= -9223372036854775808 - 0.5) throw new TclError("integer value too large to represent");
        // Subtract a half in double arithmetic, then truncate.
        return TclObj.fromInt(BigInt(Math.trunc(d - 0.5)));
      }
      // Out of range.
      if (d >= 9223372036854775807 + 0.5) throw new TclError("integer value too large to represent");
      // Add a half in double arithmetic, then truncate (0.49999999999999994 becomes 1).
      return TclObj.fromInt(BigInt(Math.trunc(d + 0.5)));
    }
  }
  // The C library functions, on doubles.
  const r = libm(e.name, dbl(x), args[1] ? dbl(args[1]) : 0);
  // These depend on the C library in the last bit.
  step.platform = step.platform ?? "libm";
  // A domain error.
  if (r.errno === "EDOM" || Number.isNaN(r.value)) throw new TclError(floatErrorMessage(r.value, true));
  // A range error or infinity.
  if (r.errno === "ERANGE" || !Number.isFinite(r.value)) throw new TclError(floatErrorMessage(r.value));
  // The result.
  return TclObj.fromDouble(r.value);
}

/** Parse, check and evaluate an expression, collecting everything the lab shows. */
export function runExpr(src: string, ctx: ExprContext): ExprResult {
  // Stage 1: parse.
  let tree: ExprNode;
  // Syntax errors stop here.
  try { tree = parseExpr(src, ctx.mode); } catch (e) {
    // A placeholder tree for the failed parse.
    const empty: ExprNode = { t: "lit", text: src, start: 0, end: src.length };
    // The parse error.
    return { tree: empty, trace: { node: empty, notes: [], kids: [] }, error: errorMessage(e), errorPos: (e as TclExprError).pos ?? 0, stage: "parse" };
  }
  // Stage 2: compile checks.
  try { compileCheck(tree); } catch (e) {
    // The compile error.
    return { tree, trace: { node: tree, notes: [], kids: [] }, error: errorMessage(e), errorPos: (e as TclExprError).pos ?? 0, stage: "compile" };
  }
  // Stage 3: evaluate.
  const trace: Step = { node: tree, notes: [], kids: [] };
  // Run it.
  try {
    // The value and trace.
    const r = evalExpr(tree, ctx, trace);
    // Success.
    return { tree, trace: r.trace, value: r.value };
  } catch (e) {
    // A run-time error: keep whatever trace was built.
    return { tree, trace, error: errorMessage(e), stage: "run" };
  }
}
