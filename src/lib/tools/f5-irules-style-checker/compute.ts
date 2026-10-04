// ============================================================================
// src/lib/tools/f5-irules-style-checker/compute.ts
// ----------------------------------------------------------------------------
// THE iRULES STYLE CHECKER: paste an iRule and get it read against the
// DevCentral "iRules Style Guide" (JRahm with Jim_Deucker, published
// 2022-12-22, https://community.f5.com/t/irules-style-guide/71151, read
// 2026-10-03) and the points its comment thread added, plus a real Tcl 8.4
// syntax check.
//
// Every finding names where it comes from: E = the guide's editor settings,
// R1-R20 = its numbered rules, D1-D2 = points raised in the guide's comment
// thread and agreed by its authors or confirmed in Tcl 8.4.6, "syntax" for an
// error the Tcl 8.4 parser itself reports (those stop an iRule from loading),
// and "limit" for valid Tcl this tool does not model (array variables). The
// checker reads the rule's STRUCTURE with the same parser the other teaching
// tools use, so a brace inside a string is not mistaken for code, and nested
// bodies (when, if, switch arms, loops, procs, and the iRule inside a tmsh
// "ltm rule NAME { }" wrapper) are checked at their real lines.
//
// Characters are classified with the Unicode Character Database 18.0.0
// (src/lib/unicode/hidden.ts): invisible characters, non-ASCII spaces and
// typographic quotes break code (R1, the guide's first rule); non-ASCII dashes
// and other ASCII lookalikes are named so they can be found (E3, the guide's
// ASCII setting). The size limit is F5's own figure, 65,520 characters
// (K9204, read 2026-10-03), not the guide's round "64KB".
//
// What it cannot judge is reported honestly as "info": whether a "#word" line
// is commented-out code or a comment missing its space, for instance.
// ============================================================================

import { parseScriptPartial, isSimpleWord, literalText, type Command, type Word } from "@/lib/tcl84/parse";
import { parseExpr, type ExprNode } from "@/lib/tcl84/expr";
import { readNumber } from "@/lib/tcl84/numbers";
import { limitInput } from "@/lib/tcl84/value";
import { hiddenClass, hiddenName, codePointLabel, ASCII_LOOKALIKE } from "@/lib/unicode/hidden";

/** How serious a finding is. */
export type Severity = "error" | "warning" | "info";

/** One finding. */
export interface StyleFinding {
  // "E1".."E3" editor settings, "R1".."R20" numbered rules, "D1".."D2" thread points, "syntax" or "limit".
  rule: string;
  // How serious.
  severity: Severity;
  // 1-based line.
  line: number;
  // The trimmed source line.
  snippet: string;
  // Details for the message (the UI words it per rule).
  params?: Record<string, string | number>;
}

/** The checker's answer. */
export interface StyleCheckerResult {
  // Findings, sorted by line.
  findings: StyleFinding[];
  // Counts by severity.
  counts: Record<Severity, number>;
  // Lines in the input.
  lines: number;
  // The longest line's length.
  longest: number;
  // True when Tcl 8.4 parses the whole rule.
  parses: boolean;
  // Events found, with whether each has a priority.
  events: { name: string; line: number; priority: string | null }[];
}

/** F5's iRule size limit in characters (K9204: "BIG-IP iRules are limited to 65,520 characters"). */
export const IRULE_MAX_CHARS = 65520;

/** Where a command sits: how many loops enclose it, whether it is in a switch arm, and whether a catch traps it. */
interface Ctx {
  // Enclosing foreach / while / for bodies.
  loop: number;
  // Directly or indirectly inside a switch arm.
  arm: boolean;
  // Inside a catch body (break and continue are trapped there).
  caught: boolean;
}

/** The context at the top of an event or a proc. */
const TOP: Ctx = { loop: 0, arm: false, caught: false };

/** Tcl command names commented-out code usually starts with. */
const CODE_WORDS = /^#(set|log|pool|if|elseif|else|switch|foreach|while|for|when|HTTP::\w+|IP::\w+|TCP::\w+|SSL::\w+|class|table|return|drop|reject|node|persist|snat|virtual|after|append|incr|unset|scan|string|regexp|regsub|binary|event|call)\b/;

/** A Tcl keyword with its opening brace glued on ("if{"): one word, so not the keyword. */
const KEYWORD_BRACE = /^(if|elseif|else|then|while|for|foreach|switch|when|proc|catch)\{/;

/** List elements of a braced word, with their offsets in the full text. */
function listElements(raw: string, base: number): { text: string; start: number; braced: boolean }[] {
  // The elements found.
  const out: { text: string; start: number; braced: boolean }[] = [];
  // Position.
  let p = 0;
  // Each element.
  while (p < raw.length) {
    // Skip white space.
    while (p < raw.length && /\s/.test(raw[p])) p++;
    // The end.
    if (p >= raw.length) break;
    // A braced element.
    if (raw[p] === "{") {
      // Depth and start.
      let d = 1, q = p + 1;
      // Find the match.
      while (q < raw.length && d > 0) { if (raw[q] === "\\") q++; else if (raw[q] === "{") d++; else if (raw[q] === "}") d--; q++; }
      // The element's text (inside the braces) and where it starts.
      out.push({ text: raw.slice(p + 1, q - 1), start: base + p + 1, braced: true });
      // Continue after it.
      p = q;
      // Next.
      continue;
    }
    // A quoted element.
    if (raw[p] === '"') {
      // Find the closing quote.
      let q = p + 1;
      // Skip escapes.
      while (q < raw.length && raw[q] !== '"') { if (raw[q] === "\\") q++; q++; }
      // The element.
      out.push({ text: raw.slice(p + 1, q), start: base + p + 1, braced: false });
      // Continue after it.
      p = q + 1;
      // Next.
      continue;
    }
    // A bare element.
    const s = p;
    // To white space.
    while (p < raw.length && !/\s/.test(raw[p])) { if (raw[p] === "\\") p++; p++; }
    // The element.
    out.push({ text: raw.slice(s, p), start: base + s, braced: false });
  }
  // Done.
  return out;
}

/**
 * Array variables ($name(index)) are valid Tcl, but the teaching engine's
 * parser does not model them and stops with an error. Replace each simple one
 * with a same-length scalar-looking name ("$name(key)" becomes "$name_____")
 * so the rest of the rule is still parsed, and return where they were. An
 * index is simple when it closes on the same line and its braces, if any, are
 * balanced ${name} references; anything else is left for the parser to report.
 */
export function maskArrays(src: string): { masked: string; refs: { start: number; text: string }[] } {
  // The characters, so spans can be overwritten.
  const out = src.split("");
  // The references found.
  const refs: { start: number; text: string }[] = [];
  // Scan for "$".
  for (let i = 0; i < src.length; i++) {
    // Only an unescaped dollar sign starts a reference.
    if (src[i] !== "$" || (i > 0 && src[i - 1] === "\\")) continue;
    // The name: letters, digits, underscores and "::" separators.
    let p = i + 1;
    // Consume it.
    for (;;) { if (/[A-Za-z0-9_]/.test(src[p] ?? "")) p++; else if (src[p] === ":" && src[p + 1] === ":") { p += 2; while (src[p] === ":") p++; } else break; }
    // No name, or no "(" after it: not an array reference.
    if (p === i + 1 || src[p] !== "(") continue;
    // Find the ")" that closes the index, allowing [commands] and ${name} inside.
    let q = p + 1, depth = 0, ok = false;
    // Walk the index.
    while (q < src.length) {
      // The character.
      const c = src[q];
      // A backslash escapes the next character.
      if (c === "\\") { q += 2; continue; }
      // A newline or a quote ends the search: not a simple index.
      if (c === "\n" || c === '"') break;
      // ${name}: skip to its closing brace (balanced, no nesting).
      if (c === "$" && src[q + 1] === "{") { const close = src.indexOf("}", q + 2); if (close < 0 || src.slice(q + 2, close).includes("\n")) break; q = close + 1; continue; }
      // Any other brace would change the brace structure around it.
      if (c === "{" || c === "}") break;
      // Nested command substitution.
      if (c === "[") depth++;
      // Its end.
      else if (c === "]") depth--;
      // The closing parenthesis at the top level.
      else if (c === ")" && depth === 0) { ok = true; break; }
      // Next character.
      q++;
    }
    // Not a simple index: leave it.
    if (!ok) continue;
    // Record it as written.
    refs.push({ start: i, text: src.slice(i, q + 1) });
    // Overwrite "(index)" with underscores of the same length.
    for (let k = p; k <= q; k++) out[k] = "_";
    // Continue after it.
    i = q;
  }
  // The masked text and the references.
  return { masked: out.join(""), refs };
}

/**
 * Variable references in one expression text that break the guide's spacing
 * (R13: a space on each side of a variable) or bracing (R14: written ${name}
 * rather than $name), and == / != comparisons with a piece of text (D1).
 * Offsets are into `text`. The expression is read with the same expression
 * parser the other tools use (iRules mode, so F5's word operators parse);
 * text that does not parse yields nothing here, since the syntax check
 * reports it.
 */
function variableStyle(text: string): { r13: number[]; r14: number[]; d1: { start: number; op: string; text: string }[] } {
  // The findings.
  const out = { r13: [] as number[], r14: [] as number[], d1: [] as { start: number; op: string; text: string }[] };
  // The parsed expression.
  let tree: ExprNode;
  // Parse it.
  try { tree = parseExpr(text, "irules"); } catch { return out; }
  // Characters that may sit right next to a variable without breaking R13.
  const okBefore = /[\s(!]/, okAfter = /[\s)]/;
  // The fixed text of an operand that is plain text ("IL" or {IL}), or null.
  const plainText = (n: ExprNode): string | null => {
    // A braced string is literal.
    if (n.t === "brace") return n.text;
    // A quoted string with no substitutions.
    if (n.t === "quote" && n.parts.every((p) => p.kind === "text")) return n.parts.map((p) => (p.kind === "text" ? p.text : "")).join("");
    // Anything else (numbers, variables, commands).
    return null;
  };
  // Visit every node.
  const visit = (n: ExprNode): void => {
    // By node type.
    switch (n.t) {
      // A $variable operand.
      case "var":
        // Written $name, not ${name} (R14).
        if (!text.startsWith("${", n.start)) out.r14.push(n.start);
        // Touching an operator or the expression's edge (R13).
        if (n.start === 0 || !okBefore.test(text[n.start - 1]) || n.end >= text.length || !okAfter.test(text[n.end])) out.r13.push(n.start);
        // Done.
        return;
      // A "quoted" operand: its $variables are references too (R14 only).
      case "quote": {
        // The operand as written.
        const raw = text.slice(n.start, n.end);
        // Where to search from.
        let cur = 0;
        // Each part.
        for (const part of n.parts) {
          // Only variables.
          if (part.kind !== "var" && part.kind !== "cmd") continue;
          // Locate it in the raw text.
          const k = raw.indexOf(part.raw, cur);
          // Not found: skip.
          if (k < 0) continue;
          // A $name variable.
          if (part.kind === "var" && !part.raw.startsWith("${")) out.r14.push(n.start + k);
          // Continue after it.
          cur = k + part.raw.length;
        }
        // Done.
        return;
      }
      // Operators: their operands.
      case "un": return visit(n.arg);
      // Binary operators.
      case "bin": {
        // == and != with a piece of text that is not a number (D1): eq and ne compare text.
        if (n.op === "==" || n.op === "!=") {
          // The text operand, if either side is one.
          const lit = [n.l, n.r].map((x) => ({ node: x, value: plainText(x) })).find((x) => x.value !== null && !readNumber(x.value).ok);
          // Report it with the operand as written.
          if (lit) out.d1.push({ start: n.opStart, op: n.opText, text: text.slice(lit.node.start, lit.node.end) });
        }
        // Both operands.
        visit(n.l); return visit(n.r);
      }
      // The ternary.
      case "tern": visit(n.c); visit(n.a); return visit(n.b);
      // Math functions.
      case "fn": for (const a of n.args) visit(a); return;
      // Parentheses.
      case "paren": return visit(n.e);
      // Literals, braced strings, a lone $ and [commands] hold no variable operands.
      default: return;
    }
  };
  // Walk the tree.
  visit(tree);
  // Done.
  return out;
}

/** Run the checker. */
export function run(input: { irule: string }): StyleCheckerResult {
  // Bounded input: four times the size limit, so an oversized rule still gets its R2 finding.
  limitInput("The iRule", input.irule, 262144);
  // The text.
  const src = input.irule ?? "";
  // Its lines.
  const lines = src.split("\n");
  // Findings.
  const F: StyleFinding[] = [];
  // Events.
  const events: StyleCheckerResult["events"] = [];
  // Where each line starts, for turning offsets into line numbers.
  const starts = [0];
  // Record each line feed.
  for (let k = 0; k < src.length; k++) if (src[k] === "\n") starts.push(k + 1);
  // Line number of an offset (binary search over the line starts).
  const lineAt = (off: number) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return lo + 1; };
  // R13, R14 and D1 are reported once per line.
  const varLines = { R13: new Set<number>(), R14: new Set<number>(), D1: new Set<number>() };
  // Add a finding.
  const add = (rule: string, severity: Severity, line: number, params?: Record<string, string | number>) => F.push({ rule, severity, line, snippet: (lines[line - 1] ?? "").trim(), params });

  // ---- Characters: R1 for the ones that break code, E3 for the ones to look at ----
  const charFindings = (text: string, n: number) => {
    // The first occurrence and the count of each kind on this line.
    const seen = new Map<string, { cp: number; col: number; count: number }>();
    // The column, counted in characters from 1.
    let col = 0;
    // Each character (code point).
    for (const ch of text) {
      // Next column.
      col++;
      // Its code point.
      const cp = ch.codePointAt(0)!;
      // ASCII is the yardstick.
      if (cp <= 0x7f) continue;
      // How it hides, or plain non-ASCII.
      const kind = hiddenClass(cp) ?? "other";
      // Keep the first of each kind and count them all.
      const s = seen.get(kind);
      // Count it.
      if (s) s.count++; else seen.set(kind, { cp, col, count: 1 });
    }
    // One finding per kind, in a fixed order.
    for (const kind of ["invisible", "space", "quote", "dash", "lookalike", "other"]) {
      // The first one of this kind, if any.
      const s = seen.get(kind);
      // None on this line.
      if (!s) continue;
      // What every message carries: code point, official name, column and how many.
      const base = { char: codePointLabel(s.cp), name: hiddenName(s.cp) ?? codePointLabel(s.cp), col: s.col, count: s.count };
      // Invisible characters, non-ASCII spaces and typographic quotes break code (R1).
      if (kind === "invisible" || kind === "space" || kind === "quote") add("R1", "error", n, { what: kind, ...base });
      // A dash Tcl will not read as an option dash or a minus sign.
      else if (kind === "dash") add("E3", "warning", n, { what: "dash", ...base });
      // Looks like ASCII text, is not.
      else if (kind === "lookalike") add("E3", "info", n, { what: "lookalike", ascii: ASCII_LOOKALIKE.get(s.cp) ?? "", glyph: String.fromCodePoint(s.cp), ...base });
      // Any other non-ASCII character.
      else add("E3", "info", n, { what: "non-ascii", glyph: String.fromCodePoint(s.cp), ...base });
    }
  };

  // ---- Editor settings (E) and line rules ----
  // The longest line.
  let longest = 0;
  // Each line.
  lines.forEach((raw, i) => {
    // The line number.
    const n = i + 1;
    // Carriage returns (Windows line ends).
    const text = raw.replace(/\r$/, "");
    // Windows line ends.
    if (raw.endsWith("\r")) add("E3", "info", n, { what: "crlf" });
    // Length.
    longest = Math.max(longest, text.length);
    // Over 120 columns: the maximum.
    if (text.length > 120) add("E2", "warning", n, { length: text.length });
    // Over 100: the goal.
    else if (text.length > 100) add("E2", "info", n, { length: text.length });
    // Tabs.
    if (/\t/.test(text)) add("E1", "warning", n, { what: "tab" });
    // Indentation that is not a multiple of four spaces.
    else { const lead = /^ */.exec(text)![0].length; if (text.trim() !== "" && lead % 4 !== 0) add("E1", "info", n, { what: "indent", spaces: lead }); }
    // Trailing white space.
    if (/[ \t]+$/.test(text)) add("E3", "info", n, { what: "trailing" });
    // Non-ASCII characters, named.
    charFindings(text, n);
    // The trimmed line.
    const t = text.trim();
    // A brace alone on its own line (R4: "{" belongs at the end of the line).
    if (t === "{") add("R4", "warning", n);
    // "}" then "else" on the next line (R4: "} else {" on one line).
    if (/^(else|elseif)\b/.test(t)) add("R4", "warning", n, { what: "else-line" });
    // End-of-line comments (R6).
    if (/;\s*#/.test(t) && !t.startsWith("#")) add("R6", "warning", n, { what: "eol" });
    // Comments: "#word" is either commented-out code (R20) or a comment missing its space (R6).
    if (/^#[^\s#!]/.test(t)) add(CODE_WORDS.test(t) ? "R20" : "R6", "info", n, { what: CODE_WORDS.test(t) ? "commented-code" : "no-space" });
    // "}{" with no space between (R11). Between two words Tcl 8.4 also rejects it,
    // which the syntax check reports separately as an error.
    if (/\}\{/.test(t) && !t.startsWith("#")) add("R11", "warning", n);
    // The F5 word operators instead of && || ! (R10).
    if (/^(if|elseif|while)\b|\}\s*elseif\b|\[expr\b/.test(t) && /\s(and|or)\s|[{(\s]not\s/.test(t)) add("R10", "warning", n);
    // Boolean state stored as words (R9).
    const st = /^set\s+\S+\s+"?(yes|no|true|false|on|off)"?\s*$/i.exec(t);
    // Report it.
    if (st) add("R9", "info", n, { value: st[1] });
    // A debug flag in static:: (R19).
    if (/\bset\s+static::\S*debug/i.test(t)) add("R19", "warning", n);
    // static:: names without a prefix (R18).
    else { const sv = /\bset\s+static::([A-Za-z0-9]+)\b(?!_)/.exec(t); if (sv && !/_/.test(sv[1])) add("R18", "info", n, { name: sv[1] }); }
  });
  // The file should end with a line feed.
  if (src.length && !src.endsWith("\n")) add("E3", "info", lines.length, { what: "no-final-newline" });
  // F5's size limit (R2, with the figure from K9204): characters, and the bytes they take as UTF-8.
  const chars = [...src].length, bytes = new TextEncoder().encode(src).length;
  // Over the limit on either count.
  if (chars > IRULE_MAX_CHARS || bytes > IRULE_MAX_CHARS) add("R2", "error", 1, { chars, bytes });

  // ---- Structure: parse with the Tcl 8.4 parser ----
  // Array variables are masked so the rest still parses; each one gets a note (limit).
  const { masked, refs } = maskArrays(src);
  // Where the masked references start, so R13 and R14 leave them alone.
  const maskedAt = new Set(refs.map((r) => r.start));
  // One note per reference.
  for (const r of refs) add("limit", "info", lineAt(r.start), { what: "array", ref: r.text });
  // Whether it parses.
  let parses = true;
  // Walk a script (or body) whose text starts at `base` in the source.
  const walk = (text: string, base: number, ctx: Ctx) => {
    // The commands before any syntax error, and the error itself.
    const { commands, error } = parseScriptPartial(text);
    // The commands that parsed are still checked.
    const cmds: Command[] = commands;
    // A syntax error is reported where it was found.
    if (error) {
      // Not parseable.
      parses = false;
      // The message and where.
      add("syntax", "error", lineAt(base + (error.pos ?? 0)), { message: error.message });
    }
    // Commands per line (R7).
    const perLine = new Map<number, number>();
    // Count them.
    for (const c of cmds) { const l = lineAt(base + c.start); perLine.set(l, (perLine.get(l) ?? 0) + 1); }
    // Report lines with several.
    for (const [l, k] of perLine) if (k > 1) add("R7", "warning", l, { count: k });
    // Each command.
    for (const c of cmds) checkCommand(c, base, ctx);
  };
  // Check one command and descend into its bodies.
  const checkCommand = (c: Command, base: number, ctx: Ctx) => {
    // The name (only literal names are understood).
    const name = isSimpleWord(c.words[0]) ? literalText(c.words[0]) : "";
    // The command's first line.
    const line = lineAt(base + c.start);
    // Descend into a braced body word, in a given context.
    const body = (w: Word | undefined, inner: Ctx) => { if (w && w.kind === "braced") walk(w.raw.slice(1, -1), base + w.start + 1, inner); };
    // Variable spacing and bracing (R13, R14) and text compared with == (D1) in a braced expression word, once per line.
    const exprVars = (w: Word) => {
      // The checks on the text inside the braces.
      const v = variableStyle(w.raw.slice(1, -1));
      // Report R13 and R14 once per line, skipping masked array references.
      for (const [rule, offs] of [["R13", v.r13], ["R14", v.r14]] as const) for (const o of offs) { const abs = base + w.start + 1 + o; if (maskedAt.has(abs)) continue; const l = lineAt(abs); if (!varLines[rule].has(l)) { varLines[rule].add(l); add(rule, "info", l); } }
      // Report D1 once per line, with the operator, the text and the operator to use instead.
      for (const d of v.d1) { const l = lineAt(base + w.start + 1 + d.start); if (!varLines.D1.has(l)) { varLines.D1.add(l); add("D1", "warning", l, { op: d.op, text: d.text, suggest: d.op === "!=" ? "ne" : "eq" }); } }
    };
    // Unbraced expressions (R12); braced ones get the variable checks.
    const exprWord = (w: Word | undefined) => { if (!w) return; if (w.kind !== "braced") add("R12", "warning", lineAt(base + w.start), { word: w.raw.slice(0, 40) }); else exprVars(w); };
    // A single-line if (R8): the whole command on one line with a body.
    const oneLine = () => lineAt(base + c.end) === line;
    // Command substitutions inside unbraced words are scripts too: check them in the same context.
    for (const w of c.words) {
      // Braced words hold no substitutions.
      if (w.kind === "braced") continue;
      // Where to search from in the word's raw text.
      let cur = 0;
      // Each [command] part, located in the raw text.
      for (const part of w.parts) {
        // Only command substitutions.
        if (part.kind !== "cmd") continue;
        // Its position.
        const k = w.raw.indexOf(part.raw, cur);
        // Not found (cannot happen for well-formed parts): skip.
        if (k < 0) continue;
        // Walk it, offset just inside the "[".
        walk(part.script, base + w.start + k + 1, ctx);
        // Continue after it.
        cur = k + part.raw.length;
      }
    }
    // A keyword glued to its brace ("if{"): one word to Tcl, a command that does not exist (R11).
    if (KEYWORD_BRACE.test(name)) { add("R11", "error", line, { what: "keyword-brace", word: name.slice(0, name.indexOf("{") + 1) }); return; }
    // By command.
    switch (name) {
      // Events: a fresh context.
      case "when": {
        // The event name.
        const ev = c.words[1] ? literalText(c.words[1]) : "";
        // A priority clause.
        const pi = c.words.findIndex((w) => isSimpleWord(w) && literalText(w) === "priority");
        // Record it.
        events.push({ name: ev, line, priority: pi > 0 && c.words[pi + 1] ? literalText(c.words[pi + 1]) : null });
        // No priority (R16).
        if (pi < 0) add("R16", "warning", line, { event: ev });
        // The body.
        body(c.words[c.words.length - 1], TOP);
        // Done.
        return;
      }
      // proc name args body: a fresh context.
      case "proc":
        // The body.
        body(c.words[3], TOP);
        // Done.
        return;
      // "rule NAME { ... }" (as in a tmsh configuration): the iRule inside it.
      case "rule":
        // Exactly a name and a braced body.
        if (c.words.length === 3) body(c.words[2], TOP);
        // Done.
        return;
      // "ltm rule NAME { ... }" (as tmsh list prints it): the iRule inside it.
      case "ltm":
        // The rule keyword, a name and a braced body.
        if (c.words.length === 4 && isSimpleWord(c.words[1]) && literalText(c.words[1]) === "rule") body(c.words[3], TOP);
        // Done.
        return;
      // if / elseif / else.
      case "if": {
        // On one line (R8).
        if (oneLine() && c.words.length >= 3) add("R8", "warning", line);
        // Walk the clauses.
        for (let i = 1; i < c.words.length; i++) {
          // The word.
          const w = c.words[i];
          // Keywords.
          const kw = isSimpleWord(w) ? literalText(w) : "";
          // else{, elseif{ or then{: one word, so not the keyword (R11).
          if (KEYWORD_BRACE.test(kw)) { add("R11", "error", lineAt(base + w.start), { what: "keyword-brace", word: kw.slice(0, kw.indexOf("{") + 1) }); continue; }
          // elseif / else / then are skipped.
          if (kw === "elseif" || kw === "else" || kw === "then") continue;
          // Conditions are the words after "if" and "elseif".
          const prev = i === 1 ? "if" : isSimpleWord(c.words[i - 1]) ? literalText(c.words[i - 1]) : "";
          // A condition.
          if (prev === "if" || prev === "elseif") exprWord(w);
          // A body, in the same context.
          else body(w, ctx);
        }
        // Done.
        return;
      }
      // expr.
      case "expr":
        // Braced, one word.
        if (c.words.length !== 2 || c.words[1].kind !== "braced") add("R12", "warning", line, { word: c.words.slice(1).map((w) => w.raw).join(" ").slice(0, 40) });
        // A braced expression: the variable checks.
        else exprVars(c.words[1]);
        // Done.
        return;
      // switch.
      case "switch": {
        // Options before the value.
        let i = 1;
        // Read them.
        while (i < c.words.length && isSimpleWord(c.words[i]) && literalText(c.words[i]).startsWith("-") && literalText(c.words[i]) !== "--") i++;
        // "--" terminates options (R15).
        if (!(isSimpleWord(c.words[i]) && literalText(c.words[i]) === "--")) add("R15", "warning", line, { command: "switch" });
        // The braced pattern/body list.
        const last = c.words[c.words.length - 1];
        // Descend into the arms.
        if (last && last.kind === "braced") {
          // The list elements with offsets.
          const els = listElements(last.raw.slice(1, -1), base + last.start + 1);
          // Pattern positions are even; a "#" there is a comment Tcl reads as a pattern (R6).
          els.forEach((e, k) => {
            // A comment at pattern level.
            if (k % 2 === 0 && e.text.startsWith("#")) add("R6", "error", lineAt(e.start), { what: "switch-comment" });
            // Bodies: walk them as switch arms.
            if (k % 2 === 1 && e.braced) walk(e.text, e.start, { ...ctx, arm: true });
          });
        }
        // Done.
        return;
      }
      // while test body: the body is a loop.
      case "while":
        // The test.
        exprWord(c.words[1]);
        // The body.
        body(c.words[2], { loop: ctx.loop + 1, arm: false, caught: false });
        // Done.
        return;
      // for start test next body.
      case "for":
        // The test.
        exprWord(c.words[2]);
        // The start and next scripts run outside the loop body.
        body(c.words[1], ctx); body(c.words[3], ctx);
        // The body is a loop.
        body(c.words[4], { loop: ctx.loop + 1, arm: false, caught: false });
        // Done.
        return;
      // foreach ... body: the last word is a loop body.
      case "foreach":
        // The body.
        body(c.words[c.words.length - 1], { loop: ctx.loop + 1, arm: false, caught: false });
        // Done.
        return;
      // catch script ?var?: break and continue are trapped inside.
      case "catch":
        // The script.
        body(c.words[1], { ...ctx, caught: true });
        // Done.
        return;
      // break and continue (D2): only a loop gives them something to do.
      case "break":
      case "continue":
        // Trapped by catch: nothing to say.
        if (ctx.caught) return;
        // No loop around it: Tcl 8.4 reports an error.
        if (ctx.loop === 0) add("D2", "error", line, { what: "outside-loop", cmd: name });
        // In a switch arm inside a loop: it leaves the loop, not the switch.
        else if (ctx.arm) add("D2", "info", line, { what: "leaves-loop", cmd: name });
        // Done.
        return;
      // return in a switch arm (D2): it leaves the whole event, not the switch.
      case "return":
        // Only inside an arm.
        if (ctx.arm) add("D2", "info", line, { what: "return-arm" });
        // Done.
        return;
      // table.
      case "table": {
        // The subcommand.
        const sub = c.words[1] && isSimpleWord(c.words[1]) ? literalText(c.words[1]) : "";
        // "--" before the arguments (R15).
        if (["set", "add", "replace", "lookup", "incr", "append", "delete"].includes(sub) && !c.words.some((w) => isSimpleWord(w) && literalText(w) === "--")) add("R15", "info", line, { command: `table ${sub}` });
        // A timeout on stored entries (R17): set/add need key, value and a timeout.
        if (sub === "set" || sub === "add") {
          // Positional words after the options.
          const pos = c.words.slice(2).filter((w, k, arr) => { const t = isSimpleWord(w) ? literalText(w) : ""; return !(t.startsWith("-") && !/^-\d/.test(t)) && !(k > 0 && isSimpleWord(arr[k - 1]) && literalText(arr[k - 1]) === "-subtable"); });
          // key value timeout ?lifetime?
          if (pos.length < 3) add("R17", "warning", line);
        }
        // Done.
        return;
      }
      // Everything else.
      default:
        // Nothing more to read.
        return;
    }
  };
  // Walk the whole rule (array references masked).
  walk(masked, 0, TOP);
  // Sort by line, then severity.
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  // Sort.
  F.sort((a, b) => a.line - b.line || order[a.severity] - order[b.severity]);
  // Counts.
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  // Tally.
  for (const f of F) counts[f.severity]++;
  // Done.
  // A final line feed ends the last line; it does not start another one.
  return { findings: F, counts, lines: src.endsWith("\n") ? lines.length - 1 : lines.length, longest, parses, events };
}
