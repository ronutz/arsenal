// ============================================================================
// src/lib/tools/f5-irules-performance-linter/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES PERFORMANCE LINTER.
//
// Paste an iRule; it flags a small, HIGH-CONFIDENCE set of documented
// performance and correctness anti-patterns, line by line. It is a static
// pattern scanner (no Tcl parser, no execution), so it deliberately covers only
// patterns that F5's own documentation calls out and that a line scan can detect
// with few false positives. It is NOT a substitute for real measurement -- pair
// it with the iRules Runtime Calculator (timing statistics) for actual cost.
//
// The rules, each grounded in F5 documentation:
//
//  global-variable (HIGH): a global-namespace variable ($::x, set ::x, the
//    `global` keyword, or the obsolete $::datagroup access). F5: "Global
//    variables modified by an iRule will demote the execution of the virtual to
//    a single processor core" (RULE_INIT), the `global` keyword "is caught by
//    the validator as of v10, and [the] VS will be demoted" (CMP Compatibility),
//    and global variables are "deprecated since v10" (BIG-IP Next notes). The
//    old $::datagroup form additionally "will result in a TCL runtime error and
//    a reset being sent to the client" on v11+ (class / matchclass docs). Fix:
//    the CMP-safe static:: namespace for shared constants, ordinary local
//    variables for per-connection data, or the `class` command for data groups.
//
//  expr-no-braces (WARNING): `expr` without bracing its expression. Tcl double-
//    substitutes and re-parses the unbraced form; bracing lets the bytecode
//    compiler optimize it (F5, "How To Write Fast Rules"). Fix: expr { ... }.
//
//  matchclass (INFO): the matchclass / findclass commands, "deprecated in v10 in
//    favor of the new class commands ... better functionality and performance"
//    (F5 class / matchclass docs). Fix: class match / class search.
//
//  regex (INFO): regexp / regsub in the data path. Regular expressions cost
//    materially more than fixed string work; when the match is a prefix, suffix,
//    exact value, or simple glob, `string`, `scan`, `switch -glob`, or `class`
//    are cheaper. Fix: use the cheapest form that expresses the match.
//
// All local, deterministic. No network, no secrets.
// ============================================================================

export type LintSeverity = "high" | "warning" | "info";

/** One detected occurrence. Human-readable text is resolved per category in the UI. */
export interface LintFinding {
  /** Rule id: "global-variable" | "expr-no-braces" | "matchclass" | "regex". */
  category: string;
  severity: LintSeverity;
  /** 1-based source line. */
  line: number;
  /** The trimmed source line, for display. */
  snippet: string;
  /** The specific matched substring (e.g. "$::foo", "expr $x", "matchclass"). */
  match: string;
}

export interface LinterInput {
  /** The pasted iRule source. */
  irule: string;
}

export interface LinterResult {
  findings: LintFinding[];
  /** Total lines in the input. */
  lineCount: number;
  /** Non-comment, non-blank lines scanned. */
  scannedLines: number;
  counts: { high: number; warning: number; info: number };
}

interface Detector {
  category: string;
  severity: LintSeverity;
  // First pattern to match on a line wins; its match[0] (cleaned) is the "match".
  patterns: RegExp[];
}

// Ordered so the highest-value rule is defined first; findings are re-sorted by
// line then severity at the end.
const DETECTORS: Detector[] = [
  {
    category: "global-variable",
    severity: "high",
    patterns: [
      /\$::[A-Za-z0-9_]+/, // read a global / obsolete $::datagroup access
      /\b(?:set|unset|append|incr|lappend)\s+::[A-Za-z0-9_]+/, // write a global scalar
      /\barray\s+(?:set|unset|get|names)\s+::[A-Za-z0-9_]+/, // global array op
      /(?:^|[{;])\s*global\s+[A-Za-z0-9_]/, // the `global` keyword introducing a var
    ],
  },
  {
    category: "expr-no-braces",
    severity: "warning",
    // expr followed by whitespace, then NOT an opening brace. The zero-width
    // lookahead keeps the match token a clean "expr" (no trailing operand char).
    patterns: [/\bexpr\s+(?!\{)/],
  },
  {
    category: "matchclass",
    severity: "info",
    patterns: [/\b(?:matchclass|findclass)\b/],
  },
  {
    category: "regex",
    severity: "info",
    patterns: [/\b(?:regexp|regsub)\b/],
  },
];

/** True for a full-line Tcl comment (first non-space char is #). Keeps the
 *  scanner off commented-out code and prose. Inline `;#` comments are rare and
 *  left as accepted residual noise. */
function isCommentLine(line: string): boolean {
  return /^\s*#/.test(line);
}

/** Clean the matched substring for display: the `global` keyword pattern can
 *  capture a leading { or ; and whitespace, so trim to the token. */
function cleanMatch(raw: string): string {
  return raw.replace(/^[{;\s]+/, "").trim();
}

export function run(input: LinterInput): LinterResult {
  const text = (input?.irule ?? "").toString();
  const lines = text.split(/\r?\n/);
  const findings: LintFinding[] = [];
  let scanned = 0;

  lines.forEach((line, idx) => {
    if (line.trim() === "" || isCommentLine(line)) return;
    scanned++;
    for (const det of DETECTORS) {
      for (const re of det.patterns) {
        const m = re.exec(line);
        if (m) {
          findings.push({
            category: det.category,
            severity: det.severity,
            line: idx + 1,
            snippet: line.trim(),
            match: cleanMatch(m[0]),
          });
          break; // one finding per category per line
        }
      }
    }
  });

  // Sort by line, then by severity (high < warning < info) for stable output.
  const sevRank: Record<LintSeverity, number> = { high: 0, warning: 1, info: 2 };
  findings.sort((a, b) => a.line - b.line || sevRank[a.severity] - sevRank[b.severity]);

  const counts = { high: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;

  return { findings, lineCount: lines.length, scannedLines: scanned, counts };
}
