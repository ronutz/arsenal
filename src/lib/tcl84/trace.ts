// ============================================================================
// src/lib/tcl84/trace.ts
// ----------------------------------------------------------------------------
// DISPLAY HELPERS shared by the teaching tools: an expression trace flattened
// into plain JSON (no engine objects), and an expression written with every
// operator's operands in parentheses so precedence is visible.
// ============================================================================

import type { ExprNode, Note, Step } from "./expr";

/** One node of an evaluation, flattened for display. */
export interface TraceNode {
  // The node kind (lit, brace, quote, var, dollar, cmd, un, bin, tern, fn, paren).
  kind: string;
  // The source text of this sub-expression.
  text: string;
  // Where it is in the expression.
  start: number;
  // Just past its end.
  end: number;
  // The operator as written (un, bin), or the function name (fn).
  op?: string;
  // The value it produced, as Tcl prints it.
  value?: string;
  // How an operator's result is held: int, double, string or boolean.
  held?: string;
  // Explanations.
  notes: Note[];
  // True when it was never evaluated.
  skipped?: boolean;
  // The error raised here.
  error?: string;
  // A platform caveat code.
  platform?: string;
  // Operands, in evaluation order.
  kids: TraceNode[];
}

/** Flatten a trace step into a display node. */
export function toTraceNode(src: string, s: Step): TraceNode {
  // The AST node.
  const n = s.node;
  // The operator or function name.
  const op = n.t === "un" || n.t === "bin" ? n.opText : n.t === "fn" ? n.name : undefined;
  // Operands show their text; how an operator READ them is in the operator's notes,
  // so an operand's internal form (possibly left over from a shared literal) is not shown.
  const leaf = n.t === "lit" || n.t === "brace" || n.t === "quote" || n.t === "var" || n.t === "dollar" || n.t === "cmd";
  // The node.
  return { kind: n.t, text: src.slice(n.start, n.end), start: n.start, end: n.end, op, value: s.value, held: leaf ? undefined : s.held, notes: s.notes, skipped: s.skipped, error: s.error, platform: s.platform, kids: s.kids.map((k) => toTraceNode(src, k)) };
}

/** The expression with every operator's operands in parentheses. */
export function grouping(src: string, n: ExprNode): string {
  // By node kind.
  switch (n.t) {
    // Unary.
    case "un": return `(${n.opText}${grouping(src, n.arg)})`;
    // Binary.
    case "bin": return `(${grouping(src, n.l)} ${n.opText} ${grouping(src, n.r)})`;
    // Ternary.
    case "tern": return `(${grouping(src, n.c)} ? ${grouping(src, n.a)} : ${grouping(src, n.b)})`;
    // Function call.
    case "fn": return `${n.name}(${n.args.map((a) => grouping(src, a)).join(", ")})`;
    // Parentheses add nothing beyond the grouping already shown.
    case "paren": return grouping(src, n.e);
    // Operands as written.
    default: return src.slice(n.start, n.end);
  }
}
