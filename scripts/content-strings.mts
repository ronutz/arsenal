#!/usr/bin/env tsx
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// scripts/content-strings.mts  (run with tsx)
// ----------------------------------------------------------------------------
// THE ENGLISH OF THE STRINGS THAT LIVE IN CODE, MODULE BY MODULE (09/11/2026).
//
// Some tools, two games and the training catalogue keep their human text in
// code as { en, pt } pairs (src/i18n/contentStrings.ts explains the scheme and
// the per-locale files that hold the other interface languages). This script
// says, for every such module, which English strings and templates it can
// show, so that ANVIL can hand them to the writers and the guard
// (scripts/check-interface-locales.mts) can hold every interface locale to
// them. It exports CONTENT_MODULES: module name -> a function returning the
// module's English, in a stable order (exact strings first, in the order
// they are met, then the templates; see TEMPLATES below).
//
// THE MODULES (a module's name is what its page asks contentStringsFor for):
//   openssl-s-client-explainer  the option table, the group labels, the
//                               verification codes, the SSL-Session fields
//                               (all imported) and every bi()/finding() of
//                               compute.ts (parsed);
//   tcpdump-filter-explainer    every bi() and { en, pt } of compute.ts,
//                               options.ts, semantics.ts and texts.ts (parsed;
//                               note() wraps a bi(), which is what is read);
//   dig-output-explainer        the four meaning tables and the rdata field
//                               labels (also what the DoH lookup page shows);
//   nslookup-output-explainer   the type meanings and the field labels;
//   phish-or-legit              the tells, the brands, their context lines, the
//                               display names of the card pool (imported), the
//                               script names and the explanation templates,
//                               whose {slot}s are filled per card (parsed);
//   five-clues                  the category names and the clues that differ
//                               by language (imported; the answers a locale
//                               accepts live in answers-i18n.ts instead);
//   training                    every Localized { en, "pt-BR" } of the course
//                               catalogue (imported).
//
// TEMPLATES. A sentence the code builds with values in it is keyed as a
// template: each value becomes a positional placeholder, {0}, {1}... in the
// order the values appear in the English (contentMatch.ts matches the
// rendered sentence against it). Read from the source with the TypeScript
// parser, so nothing has to be run:
//   - a template literal `...${x}...` gives one placeholder per ${};
//   - a placeholder whose value is chosen between written words
//     (`${n > 1 ? "are" : "is"}`, `${at.en}` where `at` is one of two bi()
//     texts) is EXPANDED into one template per choice, so a writer always
//     translates whole sentences; past MAX_SHAPES variants it stays a
//     placeholder; two choices on the same condition, as written, are one
//     choice: a shape that takes both sides of it is a combination the code
//     cannot produce and is dropped (09/11/2026: the tcpdump explainer's
//     operator words and libpcap messages, both chosen by the operator, were
//     crossed into 28 sentences no page ever shows);
//   - "a" + x + "b" reads like a template literal;
//   - in phish-or-legit the explanations are written with named {slots} that
//     its own fill() replaces; each slot becomes a positional placeholder.
// A text whose written part has no letter at all ("{0} {1}", "{0}@{1}": a
// name and a word, an address) is not a sentence to translate and is left
// out (counted as "values" in the report). Templates come after the exact
// strings and, among themselves, the more written text first: the matcher
// tries templates in the order a locale file lists them, so a locale file
// should keep this order (ANVIL writes them from this list).
//
// THE CROSS-CHECK (run with no arguments). Every module also has PROBES: the
// English its page would show for real inputs, taken from the engines
// themselves on their golden vectors (and, for the games and the catalogue,
// on every card, puzzle and course). Every probe must be an exact string of
// the module or match one of its templates; a probe whose English equals its
// Portuguese and is not a module string is a value shown as typed (a token,
// a name) and is only counted. A probe that two templates match is reported
// as ambiguous (the first one in the list wins).
//
// Run:  npx tsx scripts/content-strings.mts              the counts and the cross-check (exit 1 on a gap)
//       npx tsx scripts/content-strings.mts --report     the same, listing every gap and ambiguity
//       npx tsx scripts/content-strings.mts --write <dir>   <dir>/<module>.json, an array of the strings
// Deterministic: no clock, no network, no randomness.
// ============================================================================

import fs from "node:fs"; // the sources and the written files
import path from "node:path"; // their paths
import { pathToFileURL } from "node:url"; // to tell a direct run from an import
import ts from "typescript"; // the parser that reads the templates out of the sources
// The matcher the pages use, for the cross-check (pure, shared with the client).
import { matchContent } from "../src/i18n/contentMatch";
// openssl s_client explainer: the option table and its group labels.
import { OPTIONS, GROUP_LABELS } from "../src/lib/tools/openssl-s-client-explainer/options";
// Its verification codes.
import { VERIFY_CODES } from "../src/lib/tools/openssl-s-client-explainer/verify-codes";
// Its SSL-Session field meanings and the engine, for the probes.
import { SESSION_FIELDS, explain as explainSClient } from "../src/lib/tools/openssl-s-client-explainer/compute";
// Its real captures and command vectors, the probes' inputs.
import { CAPTURES } from "../src/lib/tools/openssl-s-client-explainer/captures";
// The command vectors.
import { COMMAND_VECTORS } from "../src/lib/tools/openssl-s-client-explainer/golden-vectors";
// tcpdump filter explainer: the engine and its vectors, for the probes.
import { explain as explainTcpdump, ACCEPT_VECTORS, REJECT_VECTORS } from "../src/lib/tools/tcpdump-filter-explainer";
// dig output explainer: the meaning tables, the field breakdown and the vectors.
import { RCODE_MEANINGS, OPCODE_MEANINGS, FLAG_MEANINGS, RRTYPE_MEANINGS, FIELD_LABELS_PT as DIG_FIELD_LABELS_PT, parseDig, breakdownRdata, DIG_VECTORS } from "../src/lib/tools/dig-output-explainer";
// nslookup output explainer: the type meanings, the SOA labels, the parser and the vectors.
import { NS_TYPE_MEANINGS, SOA_FIELD_LABELS, FIELD_LABELS_PT as NS_FIELD_LABELS_PT, parseNslookup, NS_VECTORS } from "../src/lib/tools/nslookup-output-explainer";
// Phish or Legit: the tells, the brands and the whole card pool.
import { TELLS, BRANDS, pool as phishPool } from "../src/lib/fun/games/phish-or-legit/engine";
// Five Clues: the puzzles.
import { PUZZLES } from "../src/lib/fun/games/five-clues/puzzles";
// The training catalogue.
import { PLATFORMS } from "../src/content/training/courses";

/** The repository root (scripts run from it). */
const ROOT = process.cwd();

/** The most variants one template may expand into before a choice stays a placeholder (the arithmetic operators'
 *  table, eleven words, with and without a computed value, is the largest expansion worth writing out). */
const MAX_SHAPES = 24;

/** How deep a value is followed through constants before it counts as a placeholder. */
const MAX_DEPTH = 6;

/** A placeholder: a value the code puts into the sentence. */
const SLOT: unique symbol = Symbol("slot");

/** A branch a choice took: the condition as written and which side (never rendered; a shape that takes both sides
 *  of one condition is a combination the code cannot produce, as when two values chosen by the same operator are
 *  expanded one by one, and is dropped before rendering). */
interface Branch {
  /** The condition, as written in the source (two choices on the same text are the same choice). */
  cond: string;
  /** The side taken. */
  side: boolean;
}

/** A piece of an English text: written characters, a placeholder, or the branch a choice took. */
type Piece = string | typeof SLOT | Branch;

/** One way a text can read: its pieces in order. */
type Shape = Piece[];

/** An English text and its Portuguese, as an engine returns them (for the probes). */
interface Pair {
  /** The English. */
  en: string;
  /** The Portuguese (Brazilian), or "" when the object has none. */
  pt: string;
}

/** Where a module's texts are read from in its sources. */
interface SourceSpec {
  /** The file, relative to the repository root. */
  file: string;
  /** Calls whose argument at the given index is an English text (e.g. bi: 0, finding: 3). */
  calls?: Readonly<Record<string, number>>;
  /** Read every object literal with en and pt (or "pt-BR") properties: its en is an English text. */
  pairs?: boolean;
  /** Read the given property of object literals that also have a "value" property (labelled rows). */
  labels?: string;
  /** The file's texts carry named {slots} its own fill() replaces (each becomes a placeholder). */
  slots?: boolean;
}

/** One module: its data, its sources and its probes. */
interface ModuleSpec {
  /** English strings taken from the module's data, in order. */
  data: () => string[];
  /** The source files read for texts and templates. */
  sources: readonly SourceSpec[];
  /** The English the page would show for real inputs (with its Portuguese), for the cross-check. */
  probes: () => Pair[];
}

// ---- reading data ------------------------------------------------------------

/**
 * Every { en, pt } (or { en, "pt-BR" }) object inside a value, depth first in key order.
 *
 * @param value the data (arrays, objects, maps of them)
 * @param out the pairs found so far
 * @param seen objects already walked (data may share objects)
 * @returns the pairs, in the order met
 */
function pairsIn(value: unknown, out: Pair[] = [], seen = new Set<object>()): Pair[] {
  // Only objects hold pairs.
  if (value === null || typeof value !== "object") return out;
  // Each object once.
  if (seen.has(value)) return out;
  // Remembered.
  seen.add(value);
  // The object as a record.
  const o = value as Record<string, unknown>;
  // The Portuguese side, under either spelling.
  const pt = typeof o.pt === "string" ? o.pt : typeof o["pt-BR"] === "string" ? (o["pt-BR"] as string) : null;
  // A pair: its English (and Portuguese) recorded.
  if (typeof o.en === "string" && pt !== null) out.push({ en: o.en, pt });
  // Then everything inside it, in key order (arrays in index order).
  for (const v of Array.isArray(value) ? value : Object.values(o)) pairsIn(v, out, seen);
  // The pairs.
  return out;
}

/**
 * The values of a table of English strings, in key order.
 *
 * @param table the table
 * @returns its values
 */
function valuesOf(table: Readonly<Record<string, string>>): string[] {
  // Key order is the table's own.
  return Object.values(table);
}

// ---- reading sources -----------------------------------------------------------

/** Parsed sources, once per run. */
const parsed = new Map<string, ts.SourceFile>();

/**
 * A source file, parsed once.
 *
 * @param file the path relative to the repository root
 * @returns the syntax tree
 */
function sourceOf(file: string): ts.SourceFile {
  // Parse on first use.
  if (!parsed.has(file)) {
    // The text.
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    // The tree, with parent links (the constant lookup walks up).
    parsed.set(file, ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS));
  }
  // The tree.
  return parsed.get(file) as ts.SourceFile;
}

/** What a reading needs to know: the module's spec for the file being read. */
interface Ctx {
  /** The file's spec. */
  spec: SourceSpec;
}

/**
 * The pieces of a written string: its characters, or, in a {slot} file, its characters with each {name} a placeholder.
 *
 * @param text the string as the code writes it
 * @param ctx the reading
 * @returns its one shape
 */
function literalShape(text: string, ctx: Ctx): Shape {
  // An ordinary file: the string is all written text.
  if (!ctx.spec.slots) return [text];
  // A {slot} file: split around every {name}.
  return text.split(/(\{[a-zA-Z]+\})/).map((p): Piece => (/^\{[a-zA-Z]+\}$/.test(p) ? SLOT : p)).filter((p) => p !== "");
}

/**
 * Every combination of one shape from each list, joined in order; null when there would be more than MAX_SHAPES.
 *
 * @param lists the alternatives of each part, in order
 * @returns the joined shapes, or null past the limit
 */
function product(lists: Shape[][]): Shape[] | null {
  // Start with one empty shape.
  let acc: Shape[] = [[]];
  // Each part in turn.
  for (const alts of lists) {
    // Past the limit: give up (the caller makes the part a placeholder).
    if (acc.length * alts.length > MAX_SHAPES) return null;
    // Every shape so far with every alternative of this part.
    acc = acc.flatMap((a) => alts.map((b) => [...a, ...b]));
  }
  // The shapes.
  return acc;
}

/**
 * The shapes of one side of a choice, each marked with the branch it took.
 *
 * @param shapes the side's shapes
 * @param cond the choice's condition
 * @param side which side they are
 * @returns the same shapes, each starting with its branch
 */
function onBranch(shapes: Shape[], cond: ts.Expression, side: boolean): Shape[] {
  // The condition as written.
  const text = cond.getText();
  // Each shape behind its branch.
  return shapes.map((sh) => [{ cond: text, side }, ...sh]);
}

/**
 * Whether a shape could be produced: it never takes both sides of one condition.
 *
 * @param s the shape
 * @returns false for a combination of two sides of the same choice
 */
function consistent(s: Shape): boolean {
  // The side each condition took.
  const taken = new Map<string, boolean>();
  // Each branch in the shape.
  for (const p of s) {
    // Written text and placeholders take no branch.
    if (typeof p !== "object") continue;
    // The other side of a condition already taken: impossible.
    if (taken.has(p.cond) && taken.get(p.cond) !== p.side) return false;
    // Remembered.
    taken.set(p.cond, p.side);
  }
  // Possible.
  return true;
}

/**
 * The declaration a name refers to at a point in the source: the nearest constant or variable with an initializer,
 * or "shadowed" when a parameter (or a loop variable) of an enclosing function takes the name first.
 *
 * @param id the name, where it is used
 * @returns the initializer and whether it is a const, or null when the name is not a local value with one
 */
function declarationOf(id: ts.Identifier): { init: ts.Expression; isConst: boolean } | null {
  // The name.
  const name = id.text;
  // Walk outwards from the use.
  for (let n: ts.Node | undefined = id.parent; n; n = n.parent) {
    // A function's parameters shadow anything further out: the value comes from a caller, not from a text written here.
    if (ts.isFunctionLike(n) && n.parameters.some((p) => ts.isIdentifier(p.name) && p.name.text === name)) return null;
    // A block of statements (a function body, the file, a case): its declarations.
    const statements = ts.isBlock(n) || ts.isSourceFile(n) || ts.isModuleBlock(n) || ts.isCaseClause(n) || ts.isDefaultClause(n) ? n.statements : null;
    // Not a block: keep walking.
    if (!statements) continue;
    // Each statement of the block.
    for (const st of statements) {
      // Only variable statements declare values.
      if (!ts.isVariableStatement(st)) continue;
      // Whether they are constants.
      const isConst = (st.declarationList.flags & ts.NodeFlags.Const) !== 0;
      // Each declaration of the statement.
      for (const d of st.declarationList.declarations) {
        // The one with this name and a value.
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer) return { init: d.initializer, isConst };
      }
    }
  }
  // Not a local value.
  return null;
}

/**
 * The English shapes of an expression that makes a bilingual text: a reading call (bi(...)), a choice between two of
 * them, or an object literal with an en property.
 *
 * @param e the expression
 * @param ctx the reading
 * @param depth how far constants have been followed
 * @returns the shapes, or null when the expression is not one of those
 */
function pairShapes(e: ts.Expression, ctx: Ctx, depth: number): Shape[] | null {
  // Too deep: not followed.
  if (depth > MAX_DEPTH) return null;
  // Parentheses and type assertions are transparent.
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) return pairShapes(e.expression, ctx, depth);
  // A reading call: its English argument.
  if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && ctx.spec.calls && e.expression.text in ctx.spec.calls) {
    // The argument that holds the English.
    const arg = e.arguments[ctx.spec.calls[e.expression.text]];
    // Its shapes as a text.
    return arg ? textShapes(arg, ctx, depth + 1) : null;
  }
  // A choice between two bilingual texts: both.
  if (ts.isConditionalExpression(e)) {
    // Each side.
    const a = pairShapes(e.whenTrue, ctx, depth + 1);
    // The other side.
    const b = pairShapes(e.whenFalse, ctx, depth + 1);
    // Both must be bilingual texts; each side marked with its branch.
    return a && b ? [...onBranch(a, e.condition, true), ...onBranch(b, e.condition, false)] : null;
  }
  // An object literal with en.
  if (ts.isObjectLiteralExpression(e)) {
    // Its en.
    const en = enOf(e);
    // As a text.
    return en ? textShapes(en, ctx, depth + 1) : null;
  }
  // A constant holding one of those.
  if (ts.isIdentifier(e)) {
    // Its declaration.
    const d = declarationOf(e);
    // Followed only for a constant.
    return d && d.isConst ? pairShapes(d.init, ctx, depth + 1) : null;
  }
  // An entry of a constant table of bilingual texts (offsets[t.named], ops[a.op.t]): any of its entries.
  if (ts.isElementAccessExpression(e) && ts.isIdentifier(e.expression)) {
    // The table's declaration.
    const d = declarationOf(e.expression);
    // Its object literal (through Object.freeze(...) and type assertions), when it is a constant.
    const table = d && d.isConst ? objectLiteralOf(d.init) : null;
    // Not a table written here.
    if (!table) return null;
    // Every entry's shapes; the table counts only when every entry is a bilingual text.
    const all: Shape[] = [];
    // Each entry.
    for (const p of table.properties) {
      // Only plain entries.
      if (!ts.isPropertyAssignment(p)) return null;
      // Its shapes.
      const s = pairShapes(p.initializer, ctx, depth + 1);
      // Not a bilingual text: the table is not one.
      if (!s) return null;
      // Collected.
      all.push(...s);
    }
    // Every entry's English.
    return all;
  }
  // Anything else: not a bilingual text written here.
  return null;
}

/**
 * The object literal an initializer holds: itself, or inside Object.freeze(...), parentheses or a type assertion.
 *
 * @param e the initializer
 * @returns the object literal, or null
 */
function objectLiteralOf(e: ts.Expression): ts.ObjectLiteralExpression | null {
  // Parentheses and type assertions are transparent.
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) return objectLiteralOf(e.expression);
  // Object.freeze({...}).
  if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) && e.expression.getText() === "Object.freeze" && e.arguments[0]) return objectLiteralOf(e.arguments[0]);
  // The literal itself.
  return ts.isObjectLiteralExpression(e) ? e : null;
}

/**
 * The en value of an object literal, as an expression: a property en: ..., or the shorthand { en } (its constant).
 *
 * @param o the object literal
 * @returns the expression, or null when it has no en
 */
function enOf(o: ts.ObjectLiteralExpression): ts.Expression | null {
  // Each property.
  for (const p of o.properties) {
    // en: value.
    if (ts.isPropertyAssignment(p) && propName(p.name) === "en") return p.initializer;
    // { en }: the name itself, resolved by the caller.
    if (ts.isShorthandPropertyAssignment(p) && p.name.text === "en") return p.name;
  }
  // None.
  return null;
}

/**
 * A property's name as written ("en", "pt-BR", "label").
 *
 * @param n the name node
 * @returns its text, or null for a computed name
 */
function propName(n: ts.PropertyName): string | null {
  // An identifier, a string or a number.
  return ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n) ? n.text : null;
}

/**
 * The shapes of a value INSIDE a text (a template's ${...} or a + operand): written words when the code chooses
 * between written words, else a placeholder.
 *
 * @param e the expression
 * @param ctx the reading
 * @param depth how far constants have been followed
 * @returns the shapes (a lone placeholder at worst)
 */
function innerShapes(e: ts.Expression, ctx: Ctx, depth: number): Shape[] {
  // Too deep: a value.
  if (depth > MAX_DEPTH) return [[SLOT]];
  // Parentheses and type assertions are transparent.
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) return innerShapes(e.expression, ctx, depth);
  // Written text inside a text: its pieces.
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e) || (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken)) return textShapes(e, ctx, depth + 1) ?? [[SLOT]];
  // A choice: each side's words (a side that is a value is a placeholder), unless that makes too many.
  if (ts.isConditionalExpression(e)) {
    // Both sides.
    const all = [...onBranch(innerShapes(e.whenTrue, ctx, depth + 1), e.condition, true), ...onBranch(innerShapes(e.whenFalse, ctx, depth + 1), e.condition, false)];
    // Within the limit: expanded.
    return all.length <= MAX_SHAPES ? all : [[SLOT]];
  }
  // x.en, where x is a bilingual text written here (a bi(), a choice of two): its English, expanded.
  if (ts.isPropertyAccessExpression(e) && e.name.text === "en") {
    // The bilingual text's shapes.
    const s = pairShapes(e.expression, ctx, depth + 1);
    // Expanded when known and within the limit.
    return s && s.length <= MAX_SHAPES ? s : [[SLOT]];
  }
  // A constant: what its value reads as inside a text (a choice of a written word and a value keeps both).
  if (ts.isIdentifier(e)) {
    // Its declaration.
    const d = declarationOf(e);
    // A constant: its value, read the same way; a variable may change after it is declared, so it is a value.
    return d && d.isConst ? innerShapes(d.init, ctx, depth + 1) : [[SLOT]];
  }
  // Anything else (a call, an element, a property other than en, a number): a value.
  return [[SLOT]];
}

/**
 * The shapes of an expression that IS an English text: a string, a template literal, a concatenation, a choice
 * between texts, or a constant holding one.
 *
 * @param e the expression
 * @param ctx the reading
 * @param depth how far constants have been followed
 * @returns the shapes, or null when the expression is not a text written here (a parameter, a call, a lookup)
 */
function textShapes(e: ts.Expression, ctx: Ctx, depth = 0): Shape[] | null {
  // Too deep: not followed.
  if (depth > MAX_DEPTH) return null;
  // Parentheses and type assertions are transparent.
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e) || ts.isSatisfiesExpression(e)) return textShapes(e.expression, ctx, depth);
  // A string, or a template literal without ${}: its text.
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [literalShape(e.text, ctx)];
  // A template literal: the written parts and each ${} in turn.
  if (ts.isTemplateExpression(e)) {
    // The parts, in order: the head, then each value and the text after it.
    const parts: Shape[][] = [[literalShape(e.head.text, ctx)]];
    // Each ${}.
    for (const span of e.templateSpans) {
      // The value: expanded if the joined shapes stay within the limit, else a placeholder.
      const inner = innerShapes(span.expression, ctx, depth + 1);
      // How many shapes there are so far.
      const sofar = parts.reduce((n, p) => n * p.length, 1);
      // The value's shapes, or a placeholder when they would make too many.
      parts.push(sofar * inner.length <= MAX_SHAPES ? inner : [[SLOT]]);
      // The text after it.
      parts.push([literalShape(span.literal.text, ctx)]);
    }
    // Joined (always within the limit by construction).
    return product(parts);
  }
  // A concatenation: both operands, as in a template.
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    // Each side, a placeholder when it is a value.
    const joined = product([innerShapes(e.left, ctx, depth + 1), innerShapes(e.right, ctx, depth + 1)]);
    // Too many: both sides as placeholders.
    return joined ?? [[SLOT, SLOT]];
  }
  // A choice between texts: every side that is a text (a side that is a value is not written here).
  if (ts.isConditionalExpression(e)) {
    // Each side.
    const a = textShapes(e.whenTrue, ctx, depth + 1) ?? [];
    // The other.
    const b = textShapes(e.whenFalse, ctx, depth + 1) ?? [];
    // Both, or nothing when neither is a text; each side marked with its branch.
    return a.length + b.length > 0 ? [...onBranch(a, e.condition, true), ...onBranch(b, e.condition, false)] : null;
  }
  // A local value: its initializer, when it has one (a parameter or an outer value is not written here).
  if (ts.isIdentifier(e)) {
    // Its declaration.
    const d = declarationOf(e);
    // Followed.
    return d ? textShapes(d.init, ctx, depth + 1) : null;
  }
  // Anything else is not a text written here.
  return null;
}

/** What rendering a shape gives: the key, and whether it has placeholders. */
interface Rendered {
  /** The string or template, placeholders numbered {0}, {1}... in order. */
  key: string;
  /** Whether it is a template. */
  template: boolean;
  /** Whether its written part has at least one letter (a sentence, not a name and a symbol). */
  wordy: boolean;
  /** How many written characters it has (templates with more written text are tried first). */
  written: number;
}

/**
 * A shape as a key: adjacent written pieces joined, each placeholder numbered in order.
 *
 * @param s the shape
 * @returns the key and its properties
 */
function render(s: Shape): Rendered {
  // The key so far, and the next placeholder number.
  let key = "";
  // The next number.
  let n = 0;
  // The written characters alone.
  let written = "";
  // Each piece.
  for (const p of s) {
    // A placeholder: the next number.
    if (p === SLOT) key += `{${n++}}`;
    // A branch: not text.
    else if (typeof p === "object") continue;
    // Written text: as is.
    else {
      // Into the key.
      key += p;
      // And the written part.
      written += p;
    }
  }
  // The key and its properties.
  return { key, template: n > 0, wordy: /\p{L}/u.test(written), written: written.length };
}

/** The keys a source gave, kept apart until the module's list is put in order. */
interface SourceKeys {
  /** Exact strings, in order met. */
  exact: string[];
  /** Templates, in order met, with their written length. */
  templates: { key: string; written: number }[];
  /** Shapes left out: no letter in the written part (a name and a symbol, an address), as keys. */
  values: string[];
}

/**
 * Every English text and template one source file writes, per its spec.
 *
 * @param spec the file and what to read in it
 * @returns its keys
 */
function fromSource(spec: SourceSpec): SourceKeys {
  // The reading.
  const ctx: Ctx = { spec };
  // What was found.
  const out: SourceKeys = { exact: [], templates: [], values: [] };
  /**
   * Record the shapes of one text.
   * @param shapes its shapes (null: not a text written here)
   */
  const take = (shapes: Shape[] | null) => {
    // Nothing to record.
    if (!shapes) return;
    // Each shape the code can produce.
    for (const s of shapes.filter(consistent)) {
      // As a key.
      const r = render(s);
      // Empty, or no letter in the written part: a value, not a sentence.
      if (r.key === "" || !r.wordy) { out.values.push(r.key); continue; }
      // A template or an exact string.
      if (r.template) out.templates.push({ key: r.key, written: r.written });
      // An exact string.
      else out.exact.push(r.key);
    }
  };
  /**
   * Visit a node and its children.
   * @param n the node
   */
  const visit = (n: ts.Node): void => {
    // A reading call: its English argument.
    if (spec.calls && ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text in spec.calls) {
      // The argument.
      const arg = n.arguments[spec.calls[n.expression.text]];
      // Read.
      if (arg) take(textShapes(arg, ctx));
    }
    // An object literal.
    if (ts.isObjectLiteralExpression(n)) {
      // Its property names.
      const names = n.properties.map((p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) ? propName(p.name) : null));
      // A bilingual pair: its en.
      if (spec.pairs && names.includes("en") && (names.includes("pt") || names.includes("pt-BR"))) {
        // The en expression.
        const en = enOf(n);
        // Read.
        if (en) take(textShapes(en, ctx));
      }
      // A labelled row: its label.
      if (spec.labels && names.includes(spec.labels) && names.includes("value")) {
        // The label's property.
        const p = n.properties.find((q) => ts.isPropertyAssignment(q) && propName(q.name) === spec.labels) as ts.PropertyAssignment | undefined;
        // Read.
        if (p) take(textShapes(p.initializer, ctx));
      }
    }
    // The children.
    ts.forEachChild(n, visit);
  };
  // From the top of the file.
  visit(sourceOf(spec.file));
  // What was found.
  return out;
}

// ---- the modules -----------------------------------------------------------------

/** The source folders, for brevity. */
const OPENSSL = "src/lib/tools/openssl-s-client-explainer";
/** The tcpdump explainer's folder. */
const TCPDUMP = "src/lib/tools/tcpdump-filter-explainer";

/** The tcpdump explainer's reading calls (bi(en, pt); note(code, bi(...), source) wraps a bi(), visited on its own). */
const TCPDUMP_READ = { calls: { bi: 0 }, pairs: true } as const;

/**
 * Every module that keeps human text in code, by the name its page asks for.
 */
const MODULES: Readonly<Record<string, ModuleSpec>> = {
  // The openssl s_client explainer.
  "openssl-s-client-explainer": {
    // The tables: options (text and default), group labels, verification codes, SSL-Session fields.
    // Plus the word the code joins lists with (versions, secrets), which contentMatch.ts swaps inside values.
    data: () => [...pairsIn(OPTIONS), ...pairsIn(GROUP_LABELS), ...pairsIn(VERIFY_CODES), ...pairsIn(SESSION_FIELDS)].map((p) => p.en).concat(["and"]),
    // compute.ts: bi(en, pt) and finding(id, severity, source, en, pt).
    sources: [{ file: `${OPENSSL}/compute.ts`, calls: { bi: 0, finding: 3 }, pairs: true }],
    // Every real capture and every command vector through the engine, plus the tables the page looks up.
    probes: () => [
      // The captures, command and output together, as the page reads them.
      ...CAPTURES.flatMap((c) => pairsIn(explainSClient({ command: c.command, output: c.output }))),
      // The command vectors alone.
      ...COMMAND_VECTORS.flatMap((v) => pairsIn(explainSClient({ command: v.command, output: "" }))),
      // The tables the page reads by key.
      ...pairsIn(GROUP_LABELS), ...pairsIn(VERIFY_CODES), ...pairsIn(SESSION_FIELDS),
    ],
  },
  // The tcpdump filter explainer.
  "tcpdump-filter-explainer": {
    // No separate tables: every text is written in the sources, except the words the code joins lists with:
    // "and" (joinWords, the shell specials) and "or" (the ", or " list of what libpcap expected, 11/11/2026),
    // which contentMatch.ts puts into values.
    data: () => ["and", "or"],
    // The four files that write its sentences.
    sources: ["compute.ts", "options.ts", "semantics.ts", "texts.ts"].map((f) => ({ file: `${TCPDUMP}/${f}`, ...TCPDUMP_READ })),
    // Every accepted and refused vector through the engine (a refusal of the whole input has no sentence).
    probes: () => [...ACCEPT_VECTORS, ...REJECT_VECTORS].flatMap((v) => {
      // The explanation, or nothing when the input is refused as a whole (the page shows a pack message then).
      try { return pairsIn(explainTcpdump(v.input)); } catch { return []; }
    }),
  },
  // The dig output explainer (and the DoH lookup page, which shows its meanings).
  "dig-output-explainer": {
    // The four meaning tables and the field labels the Portuguese table translates.
    data: () => [...valuesOf(RCODE_MEANINGS), ...valuesOf(OPCODE_MEANINGS), ...valuesOf(FLAG_MEANINGS), ...valuesOf(RRTYPE_MEANINGS), ...Object.keys(DIG_FIELD_LABELS_PT)],
    // compute.ts: the labels breakdownRdata writes.
    sources: [{ file: "src/lib/tools/dig-output-explainer/compute.ts", labels: "label" }],
    // Every vector through the parser: the meanings and labels its records, header and flags call up.
    probes: () => DIG_VECTORS.flatMap((v) => {
      // The reading.
      const p = parseDig(v.input);
      // What the page shows for it.
      const shown: string[] = [];
      // The header's meanings.
      if (p.header) shown.push(OPCODE_MEANINGS[p.header.opcode] ?? "", RCODE_MEANINGS[p.header.status] ?? "");
      // The flags' meanings.
      if (p.flags) shown.push(...p.flags.flags.map((f) => FLAG_MEANINGS[f]));
      // Each record's type meaning and field labels.
      for (const sec of p.sections) for (const r of sec.records) shown.push(RRTYPE_MEANINGS[r.type] ?? "", ...(r.isQuestion ? [] : breakdownRdata(r.type, r.rdata) ?? []).map((f) => f.label));
      // As pairs with no Portuguese (the cross-check needs only the English).
      return shown.filter((s) => s !== "").map((en) => ({ en, pt: "" }));
    }),
  },
  // The nslookup output explainer.
  "nslookup-output-explainer": {
    // The type meanings, the SOA labels and the field labels the Portuguese table translates.
    data: () => [...valuesOf(NS_TYPE_MEANINGS), ...valuesOf(SOA_FIELD_LABELS), ...Object.keys(NS_FIELD_LABELS_PT)],
    // compute.ts: the labels breakdownValue writes.
    sources: [{ file: "src/lib/tools/nslookup-output-explainer/compute.ts", labels: "label" }],
    // Every vector through the parser: each record's type meaning and field labels.
    probes: () => NS_VECTORS.flatMap((v) => parseNslookup(v.input).records.flatMap((r) => [NS_TYPE_MEANINGS[r.type] ?? "", ...(r.fields ?? []).map((f) => f.label)]).filter((s) => s !== "").map((en) => ({ en, pt: "" }))),
  },
  // Phish or Legit.
  "phish-or-legit": {
    // The tells' names, the brands' names and context lines, and the display names of the pool (not the addresses).
    data: () => [
      // The tells.
      ...pairsIn(TELLS).map((p) => p.en),
      // The brands' names and context lines.
      ...pairsIn(BRANDS).map((p) => p.en),
      // Every card's context line and display name (a display name dressed as an address is not text).
      ...phishPool().flatMap((c) => [c.context?.en ?? "", c.display && !c.display.en.includes("@") ? c.display.en : ""]).filter((s) => s !== ""),
    ],
    // engine.ts: the script names and the explanation templates, whose {slots} fill() replaces.
    sources: [{ file: "src/lib/fun/games/phish-or-legit/engine.ts", pairs: true, slots: true }],
    // Every card of the pool as the page shows it: its tell, brand, display name, context line and explanation.
    probes: () => phishPool().flatMap((c) => [
      // The tell's name.
      TELLS[c.tell].name,
      // The brand's name.
      ...BRANDS.filter((b) => b.id === c.brand).map((b) => b.name),
      // The display name, the context line and the explanation, when the card has them.
      ...(c.display && !c.display.en.includes("@") ? [c.display] : []), ...(c.context ? [c.context] : []), c.explain,
    ]),
  },
  // Five Clues.
  "five-clues": {
    // Each puzzle's category name and the clues that differ by language (a plain clue is the same everywhere).
    data: () => PUZZLES.flatMap((p) => [p.cat.en, ...p.clues.flatMap((c) => (typeof c === "string" ? [] : [c.en]))]),
    // Nothing else is written in code for the page.
    sources: [],
    // The same, as the page shows them.
    probes: () => PUZZLES.flatMap((p) => [p.cat, ...p.clues.flatMap((c) => (typeof c === "string" ? [] : [c]))]),
  },
  // The training catalogue.
  training: {
    // Every Localized value of every platform and course.
    data: () => pairsIn(PLATFORMS).map((p) => p.en),
    // Nothing else is written in code for the pages.
    sources: [],
    // The same, as the pages show them.
    probes: () => pairsIn(PLATFORMS),
  },
};

/** One module's list, worked out once per run, with its counts. */
interface ModuleList {
  /** The strings, exact first, then the templates. */
  strings: string[];
  /** How many of them are exact strings. */
  exact: number;
  /** How many are templates. */
  templates: number;
  /** Shapes left out as values (no letter in their written part), each once. */
  values: string[];
}

/** The worked-out lists. */
const lists = new Map<string, ModuleList>();

/**
 * One module's list: its data's strings, then its sources' exact strings, then its templates (most written text first,
 * then in the order met); each string once.
 *
 * @param name the module
 * @returns the list and its counts
 */
export function moduleList(name: string): ModuleList {
  // Worked out on first use.
  if (!lists.has(name)) {
    // The module.
    const spec = MODULES[name];
    // Its sources.
    const fromFiles = spec.sources.map(fromSource);
    // Exact strings: the data's, then each file's, each once, empty ones left out.
    const exact = [...new Set([...spec.data(), ...fromFiles.flatMap((f) => f.exact)].filter((s) => s !== ""))];
    // The templates, each once, in the order met.
    const seen = new Map<string, number>();
    // Each file's templates.
    for (const f of fromFiles) for (const t of f.templates) if (!seen.has(t.key) && !exact.includes(t.key)) seen.set(t.key, t.written);
    // Most written text first (the matcher tries them in order), the order met among equals (a stable sort).
    const templates = [...seen.entries()].map(([key, written], i) => ({ key, written, i })).sort((a, b) => b.written - a.written || a.i - b.i).map((t) => t.key);
    // Recorded.
    lists.set(name, { strings: [...exact, ...templates], exact: exact.length, templates: templates.length, values: [...new Set(fromFiles.flatMap((f) => f.values))] });
  }
  // The list.
  return lists.get(name) as ModuleList;
}

/** Every module's English strings and templates, by module name, in a stable order. */
export const CONTENT_MODULES: Readonly<Record<string, () => string[]>> = Object.fromEntries(Object.keys(MODULES).map((m) => [m, () => moduleList(m).strings]));

/**
 * The placeholders of a key or a translation, as a sorted list of their numbers.
 *
 * @param s the text
 * @returns the numbers, each once
 */
export function placeholdersOf(s: string): number[] {
  // Every {n}, each number once, in numeric order.
  return [...new Set([...s.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
}

// ---- the cross-check ---------------------------------------------------------------

/** What the cross-check found for one module. */
export interface Coverage {
  /** Distinct probe sentences checked. */
  probes: number;
  /** Probes that are an exact string. */
  exact: number;
  /** Probes matched by a template. */
  byTemplate: number;
  /** Probes shown as typed (English equals Portuguese, not a module string): counted, not required. */
  asTyped: number;
  /** Probes neither an exact string nor matched by a template: gaps. */
  gaps: string[];
  /** Probes that more than one template matches, with how many. */
  ambiguous: { probe: string; templates: string[] }[];
  /** Templates whose placeholder held, on some probe, an English text of the module itself (a nested phrase), with that
   *  probe: the matcher puts such a value in as it is, in English, so these are worth a writer's eye. */
  nested: { template: string; probe: string; value: string }[];
}

/**
 * The values a template's placeholders take in a sentence, by the matcher's own pattern (src/i18n/contentMatch.ts:
 * written text literal, each placeholder a lazy capture, the whole string anchored).
 *
 * @param template the template
 * @param sentence the rendered sentence
 * @returns the values in placeholder order, or null when it does not match
 */
function capturesOf(template: string, sentence: string): string[] | null {
  // The same pattern the matcher compiles.
  const re = new RegExp("^" + template.split(/(\{\d+\})/).map((p) => (/^\{\d+\}$/.test(p) ? "([\\s\\S]*?)" : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("") + "$");
  // Matched against the sentence.
  const m = sentence.match(re);
  // The captures, or null.
  return m ? m.slice(1) : null;
}

/**
 * Hold one module's probes to its list.
 *
 * @param name the module
 * @returns what was found
 */
export function coverage(name: string): Coverage {
  // The list.
  const { strings } = moduleList(name);
  // The exact strings, for the direct test.
  const exactSet = new Set(strings.filter((s) => placeholdersOf(s).length === 0));
  // One single-template map per template (each compiled once by the matcher), to count the templates a probe matches.
  const singles = strings.filter((s) => placeholdersOf(s).length > 0).map((t) => ({ t, map: { [t]: "\u0001" } as Record<string, string> }));
  // The probes, each English once (the first Portuguese met is kept).
  const probes = new Map<string, string>();
  // Collected.
  for (const p of MODULES[name].probes()) if (p.en.trim() !== "" && /\p{L}/u.test(p.en) && !probes.has(p.en)) probes.set(p.en, p.pt);
  // The result.
  const out: Coverage = { probes: probes.size, exact: 0, byTemplate: 0, asTyped: 0, gaps: [], ambiguous: [], nested: [] };
  // Templates already reported as carrying a nested phrase (one example each).
  const nestedSeen = new Set<string>();
  /**
   * Whether a value is an English text of this module (an exact string, or a sentence one of its templates matches).
   * @param v the value
   * @returns true for a module text
   */
  const isModuleText = (v: string) => /\p{L}{2}/u.test(v) && (exactSet.has(v) || singles.some((s) => matchContent(s.map, v) !== v));
  // Each probe.
  for (const [en, pt] of probes) {
    // An exact string.
    if (exactSet.has(en)) { out.exact++; continue; }
    // The templates it matches (the matcher's own test: a marker comes back instead of the English).
    const hits = singles.filter((s) => matchContent(s.map, en) !== en).map((s) => s.t);
    // One or more: matched (several: the first in the list wins, reported).
    if (hits.length > 0) {
      // Counted.
      out.byTemplate++;
      // Several: reported.
      if (hits.length > 1) out.ambiguous.push({ probe: en, templates: hits });
      // The winner's values: one that is itself a module text is a nested English phrase (once per template).
      const nestedValue = nestedSeen.has(hits[0]) ? undefined : (capturesOf(hits[0], en) ?? []).find(isModuleText);
      // Recorded.
      if (nestedValue !== undefined) { nestedSeen.add(hits[0]); out.nested.push({ template: hits[0], probe: en, value: nestedValue }); }
      // Next probe.
      continue;
    }
    // The same in both authored languages: a value shown as typed.
    if (en === pt) { out.asTyped++; continue; }
    // A gap.
    out.gaps.push(en);
  }
  // The findings.
  return out;
}

// ---- the command line ----------------------------------------------------------------

/**
 * Run as a script: the counts and the cross-check, or the files for the writers.
 */
function main(): void {
  // The arguments.
  const args = process.argv.slice(2);
  // The tag of every line.
  const TAG = "[content-strings]";
  // --write <dir>: one JSON array per module.
  const w = args.indexOf("--write");
  // Writing.
  if (w >= 0) {
    // The directory.
    const dir = args[w + 1];
    // Required.
    if (!dir) { console.error(`${TAG} --write needs a directory`); process.exit(2); }
    // Made if missing.
    fs.mkdirSync(dir, { recursive: true });
    // Each module.
    for (const m of Object.keys(CONTENT_MODULES)) {
      // Its strings.
      const list = CONTENT_MODULES[m]();
      // As a JSON array, two-space indent, trailing newline (the house JSON form).
      fs.writeFileSync(path.join(dir, `${m}.json`), JSON.stringify(list, null, 2) + "\n");
      // Said.
      console.log(`${TAG} wrote ${path.join(dir, `${m}.json`)} (${list.length} strings)`);
    }
    // Done.
    return;
  }
  // --report: every gap and ambiguity listed.
  const report = args.includes("--report");
  // Gaps over all modules.
  let gaps = 0;
  // Each module: its counts and its cross-check.
  for (const m of Object.keys(MODULES)) {
    // The list's counts.
    const l = moduleList(m);
    // The cross-check.
    const c = coverage(m);
    // Counted.
    gaps += c.gaps.length;
    // One line per module.
    console.log(`${TAG} ${m}: ${l.strings.length} strings (${l.exact} exact, ${l.templates} templates; ${l.values.length} value shapes left out); probes ${c.probes}: ${c.exact} exact, ${c.byTemplate} by template, ${c.asTyped} shown as typed, ${c.gaps.length} gaps, ${c.ambiguous.length} ambiguous; ${c.nested.length} templates seen with a nested module phrase`);
    // The value shapes left out, with --report.
    if (report) for (const v of l.values) console.log(`${TAG}   VALUE ${JSON.stringify(v)} (no letter in its written part: shown as the code builds it)`);
    // The gaps, the first few always, all with --report.
    for (const g of c.gaps.slice(0, report ? undefined : 5)) console.log(`${TAG}   GAP ${JSON.stringify(g)}`);
    // The ambiguities, with --report.
    if (report) for (const a of c.ambiguous) console.log(`${TAG}   AMBIGUOUS ${JSON.stringify(a.probe)} <- ${a.templates.map((t) => JSON.stringify(t)).join(" | ")}`);
    // The nested phrases, with --report.
    if (report) for (const n of c.nested) console.log(`${TAG}   NESTED ${JSON.stringify(n.template)} holds ${JSON.stringify(n.value)} in ${JSON.stringify(n.probe)}`);
  }
  // A gap fails the run.
  if (gaps > 0) { console.error(`${TAG} FAIL: ${gaps} rendered sentence(s) are neither a module string nor match a template`); process.exit(1); }
  // Otherwise OK.
  console.log(`${TAG} OK: every probe of every module is a module string, matches a template, or is a value shown as typed`);
}

// Only when run directly (the guard imports CONTENT_MODULES without running this).
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
