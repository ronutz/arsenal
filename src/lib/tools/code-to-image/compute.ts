// ============================================================================
// src/lib/tools/code-to-image/compute.ts
// ----------------------------------------------------------------------------
// The code-to-image engine: paste code or terminal output, get a highlighted
// picture of it as SVG (and, on the page, PNG at 1x and 2x drawn from the
// same layout), with alt text, after a check for secrets the reader may not
// mean to publish. Pure and deterministic: no clock, no randomness, no
// network, no DOM; the same input and options give the same bytes.
//
// The pipeline:
//   1. bound and normalise the text: refuse more than 50,000 characters, 400
//      lines or 400 columns on a line; remove a byte order mark; read CR LF
//      and CR as LF; replace every character XML 1.0 does not allow (W3C XML
//      1.0 Fifth Edition, production [2] Char: C0 controls other than tab and
//      line feed, lone surrogates, U+FFFE, U+FFFF) with U+FFFD, because an SVG
//      is an XML document; drop one final line feed;
//   2. paint token kinds with the chosen language's highlighter (languages.ts);
//   3. search for secrets (secrets.ts) and mask every finding the reader has
//      not unticked: the value is replaced by eight bullets, in the image and
//      in the alt text, so the secret is not in the SVG's selectable text,
//      the PNG's pixels or the alt text; a masked value's length is not shown;
//   4. expand tabs to the chosen tab stops and trim blanks at line ends;
//   5. lay the picture out, serialise the SVG and write the alt text
//      (render.ts).
// ============================================================================

import { LANGUAGES, K, KIND_NAMES, paintKinds, type LanguageId, type TokenKind } from "./languages"; // highlighting
import { scanSecrets, type SecretFinding } from "./secrets"; // the secrets check
import { FONT_SIZES, PADDINGS, TAB_WIDTHS, PALETTES, layout, toSvg, altText, type Layout, type PaintedLine, type PaletteId } from "./render"; // the picture

/** The most characters (UTF-16 code units) the tool reads. */
export const MAX_CHARS = 50_000; // a long ticket attachment, not a log file
/** The most lines. */
export const MAX_LINES = 400; // well past a slide, enough for a ticket
/** The most columns on one line, after tabs are expanded. */
export const MAX_COLUMNS = 400; // wide terminal output
/** The longest window title, in code points. */
export const MAX_TITLE = 80; // one short line
/** The longest highlight specification. */
export const MAX_HIGHLIGHT_SPEC = 200; // "1, 3-5, 9" and a lot more
/** What a masked value becomes in the image: eight bullets (U+2022, inside JetBrains Mono's latin subset), whatever the value's length. */
export const MASK = "•".repeat(8); // fixed length, so the length of the secret is not shown

/** The reader's choices. */
export interface CodeImageOptions {
  /** The highlighting language. */
  language: LanguageId;
  /** The palette. */
  palette: PaletteId;
  /** The font size in CSS pixels: 12, 14, 16, 18, 20, 24 or 28. */
  fontSize: number;
  /** Line numbers on or off. */
  lineNumbers: boolean;
  /** The window-style frame on or off. */
  frame: boolean;
  /** The window title (shown only with the frame); empty for none. */
  title: string;
  /** The outer padding in CSS pixels: 16, 32, 48 or 64. */
  padding: number;
  /** Tab stops every 2, 4 or 8 columns. */
  tabWidth: number;
  /** The lines to highlight, as "3, 5-7". */
  highlight: string;
  /** The keys (findingKey) of the findings the reader chose to leave visible; all others are masked. Keys survive edits elsewhere in the text. */
  unmask: readonly string[];
  /** The image's accessible name and the alt text's first line; empty for describe(), or the English default. */
  description: string;
  /** Optional: builds the description from the counts (the page passes a localised one). */
  describe?: (d: { lines: number; language: LanguageId; masked: number }) => string;
  /** What stands for a masked value in the alt text; empty for the English default "[masked]". */
  maskLabel: string;
}

/** The defaults: dark palette, 16 px, line numbers and a frame, 32 px of padding, tabs every 4 columns. */
export const DEFAULT_OPTIONS: Readonly<CodeImageOptions> = Object.freeze({
  language: "plain", palette: "dark", fontSize: 16, lineNumbers: true, frame: true, title: "", padding: 32, tabWidth: 4, highlight: "", unmask: [], description: "", maskLabel: "", // the defaults
}); // DEFAULT_OPTIONS

/** Why the engine refused. */
export type CodeImageErrorCode = "empty" | "too-many-chars" | "too-many-lines" | "line-too-long" | "title-too-long" | "highlight-too-long" | "bad-option";
/** Something the engine changed or noticed, said on the page. */
export type CodeImageNote = "bom-removed" | "line-endings" | "controls-replaced" | "trailing-blanks" | "tabs-expanded" | "transcript";
/** A highlight token the engine could not use. */
export interface HighlightProblem { token: string; reason: "malformed" | "out-of-range" }

/** The result. */
export interface CodeImageResult {
  ok: boolean; // false when refused
  error: null | { code: CodeImageErrorCode; params: Record<string, string | number> }; // why
  notes: CodeImageNote[]; // what changed
  replaced: number; // how many characters were replaced with U+FFFD
  lineCount: number; // lines in the picture
  findings: SecretFinding[]; // the secrets check
  maskedCount: number; // findings masked in the picture
  highlighted: number[]; // the lines highlighted
  highlightProblems: HighlightProblem[]; // highlight tokens not used
  description: string; // the accessible name used
  layout: Layout | null; // the picture, for the canvas
  svg: string; // the SVG document ("" when refused)
  altText: string; // the alt text ("" when refused)
}

/**
 * The key that identifies a finding across renders: its rule, line and column.
 * @param f the finding
 * @returns e.g. "fortios-enc@7:27"
 */
export function findingKey(f: SecretFinding): string {
  return `${f.rule}@${f.line}:${f.column}`; // stable while the line itself is unchanged
} // findingKey

/** English language names for the default description. */
export const LANGUAGE_NAMES_EN: Readonly<Record<LanguageId, string>> = Object.freeze({ plain: "plain text", shell: "POSIX shell", python: "Python", json: "JSON", yaml: "YAML", tcl: "Tcl", tmsh: "F5 tmsh", fortios: "FortiOS CLI", cisco: "Cisco-style CLI" }); // for the default description

/**
 * Parse a highlight specification: numbers and ranges separated by commas or blanks ("3, 5-7").
 * @param spec the specification
 * @param lineCount the number of lines
 * @returns the lines (sorted, unique) and the tokens that could not be used
 */
export function parseLineSpec(spec: string, lineCount: number): { lines: number[]; problems: HighlightProblem[] } {
  const lines = new Set<number>(); // the result
  const problems: HighlightProblem[] = []; // tokens not used
  for (const tok of spec.split(/[\s,]+/).filter((t) => t !== "")) { // each token
    const m = /^([0-9]{1,4})(?:-([0-9]{1,4}))?$/.exec(tok); // N or N-M
    if (!m) { problems.push({ token: tok, reason: "malformed" }); continue; } // not a number or a range
    const a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]); // the bounds
    if (a < 1 || b < a) { problems.push({ token: tok, reason: "malformed" }); continue; } // zero or a backwards range
    if (b > lineCount) problems.push({ token: tok, reason: "out-of-range" }); // partly or wholly past the last line
    for (let n = a; n <= Math.min(b, lineCount); n++) lines.add(n); // the lines that exist
  } // for
  return { lines: [...lines].sort((x, y) => x - y), problems }; // sorted
} // parseLineSpec

/** True for a code point XML 1.0 production [2] allows (tab, line feed and carriage return are handled before this). */
function xmlChar(cp: number): boolean {
  return cp === 0x09 || cp === 0x0a || (cp >= 0x20 && cp <= 0xd7ff) || (cp >= 0xe000 && cp <= 0xfffd) || (cp >= 0x10000 && cp <= 0x10ffff); // [2] Char
} // xmlChar

/**
 * Normalise the text: byte order mark, line endings, characters XML cannot hold, one final line feed.
 * @param input the pasted text
 * @returns the text, the notes and how many characters were replaced
 */
export function normalise(input: string): { text: string; notes: CodeImageNote[]; replaced: number } {
  const notes: CodeImageNote[] = []; // what changed
  let t = input; // the working text
  if (t.charCodeAt(0) === 0xfeff) { t = t.slice(1); notes.push("bom-removed"); } // a byte order mark
  if (t.includes("\r")) { t = t.replace(/\r\n?/g, "\n"); notes.push("line-endings"); } // CR LF and CR read as LF
  let replaced = 0; // characters replaced
  let out = ""; // the cleaned text
  for (let i = 0; i < t.length; i++) { // by UTF-16 code unit, pairing surrogates
    const c = t.charCodeAt(i); // the unit
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < t.length) { const d = t.charCodeAt(i + 1); if (d >= 0xdc00 && d <= 0xdfff) { out += t[i] + t[i + 1]; i++; continue; } } // a valid pair
    if (!xmlChar(c) || (c >= 0xd800 && c <= 0xdfff)) { out += "�"; replaced++; continue; } // not an XML character, or a lone surrogate
    out += t[i]; // an ordinary character
  } // for
  if (replaced > 0) notes.push("controls-replaced"); // say so
  if (out.endsWith("\n")) out = out.slice(0, -1); // one final line feed makes no line
  return { text: out, notes, replaced }; // the normalised text
} // normalise

/** The width in columns of a line once tabs are expanded. */
function columnsOf(line: string, tabWidth: number): number {
  let col = 0; // the running column
  for (const ch of line) col = ch === "\t" ? col + (tabWidth - (col % tabWidth)) : col + 1; // a tab jumps to the next stop
  return col; // the width
} // columnsOf

/** A refusal. */
function refuse(code: CodeImageErrorCode, params: Record<string, string | number>, notes: CodeImageNote[] = []): CodeImageResult {
  return { ok: false, error: { code, params }, notes, replaced: 0, lineCount: 0, findings: [], maskedCount: 0, highlighted: [], highlightProblems: [], description: "", layout: null, svg: "", altText: "" }; // nothing drawn
} // refuse

/**
 * Make the picture.
 * @param input the pasted code or output
 * @param partial the reader's choices (missing ones take DEFAULT_OPTIONS)
 * @returns the result; never throws for any string input
 */
export function renderCode(input: string, partial: Partial<CodeImageOptions> = {}): CodeImageResult {
  const o: CodeImageOptions = { ...DEFAULT_OPTIONS, ...partial }; // the options
  // Options, validated against the offered values.
  if (!LANGUAGES.includes(o.language) || !(o.palette in PALETTES) || !(FONT_SIZES as readonly number[]).includes(o.fontSize) || !(PADDINGS as readonly number[]).includes(o.padding) || !(TAB_WIDTHS as readonly number[]).includes(o.tabWidth)) return refuse("bad-option", {}); // not an offered value
  if (input.length > MAX_CHARS) return refuse("too-many-chars", { max: MAX_CHARS, length: input.length }); // bounded before any work
  const title = o.title.replace(/[\r\n\t]+/g, " ").trim(); // one line
  if (Array.from(title).length > MAX_TITLE) return refuse("title-too-long", { max: MAX_TITLE }); // too long for a title bar
  if (o.highlight.length > MAX_HIGHLIGHT_SPEC) return refuse("highlight-too-long", { max: MAX_HIGHLIGHT_SPEC }); // too long to be a line list
  const norm = normalise(input); // step 1
  const notes = [...norm.notes]; // the notes so far
  const text = norm.text; // the normalised text
  if (text.trim() === "") return refuse("empty", {}, notes); // nothing to draw
  const rawLines = text.split("\n"); // the lines
  if (rawLines.length > MAX_LINES) return refuse("too-many-lines", { max: MAX_LINES, lines: rawLines.length }, notes); // too many lines
  for (let i = 0; i < rawLines.length; i++) { const w = columnsOf(rawLines[i], o.tabWidth); if (w > MAX_COLUMNS) return refuse("line-too-long", { max: MAX_COLUMNS, line: i + 1, columns: w }, notes); } // too wide
  if (text.includes("\t")) notes.push("tabs-expanded"); // tabs become spaces
  // Step 2: highlight.
  const kinds = paintKinds(text, o.language); // one kind per code unit
  const starts: number[] = []; // each line's first offset
  { let acc = 0; for (const l of rawLines) { starts.push(acc); acc += l.length + 1; } } // computed once
  if ((o.language === "shell" || o.language === "python" || o.language === "tcl") && starts.some((st) => kinds[st] === K.prompt)) notes.push("transcript"); // read as a session
  // Step 3: secrets.
  const findings = scanSecrets(text, (off) => kinds[off] === K.comment); // the check
  const unmask = new Set(o.unmask); // the findings left visible
  const maskAt = new Map<number, number>(); // span start -> span end, for the masked findings
  let maskedCount = 0; // how many are masked
  findings.forEach((f) => { if (unmask.has(findingKey(f))) return; maskedCount++; for (const sp of f.spans) maskAt.set(sp.start, sp.end); }); // collect the spans
  // Step 4: runs per line, masked, tabs expanded, trailing blanks trimmed.
  const lines: PaintedLine[] = []; // the painted lines
  let trimmed = false; // were trailing blanks removed?
  let off = 0; // the offset of the current line
  for (const raw of rawLines) {
    const runs: { text: string; kind: TokenKind }[] = []; // this line's runs
    const push = (t: string, k: TokenKind): void => { const last = runs[runs.length - 1]; if (last && last.kind === k) last.text += t; else runs.push({ text: t, kind: k }); }; // merge equal kinds
    let col = 0; // the column
    let i = 0; // the index inside the line
    while (i < raw.length) {
      const abs = off + i; // the offset in the text
      const cp = raw.codePointAt(i) ?? 0; // the code point
      const ch = String.fromCodePoint(cp); // its text
      const end = maskAt.get(abs) ?? (ch.length === 2 ? maskAt.get(abs + 1) : undefined); // a masked span starts in this code point?
      if (end !== undefined) { push(MASK, "masked"); col += MASK.length; i = Math.max(i + 1, end - off); continue; } // the mask, once
      const kind = KIND_NAMES[kinds[abs]] as TokenKind; // its painted kind
      if (ch === "\t") { const w = o.tabWidth - (col % o.tabWidth); push(" ".repeat(w), kind); col += w; } // a tab to the next stop
      else { push(ch, kind); col++; } // one column per code point
      i += ch.length; // the next code point
    } // while
    // Trim trailing blanks (spaces made from tabs included).
    while (runs.length > 0) {
      const last = runs[runs.length - 1]; // the last run
      if (last.kind === "masked") break; // never trim a mask
      const t = last.text.replace(/ +$/, ""); // without trailing spaces
      if (t.length !== last.text.length) trimmed = true; // something was trimmed
      if (t === "") { runs.pop(); continue; } // the run was all blanks
      last.text = t; break; // done
    } // while
    lines.push({ runs }); // the line
    off += raw.length + 1; // the next line's offset
  } // for
  if (trimmed) notes.push("trailing-blanks"); // say so
  // Step 5: the picture.
  const hl = parseLineSpec(o.highlight, lines.length); // the highlighted lines
  const description = o.description !== "" ? o.description : o.describe ? o.describe({ lines: lines.length, language: o.language, masked: maskedCount }) : `Code image: ${lines.length} ${lines.length === 1 ? "line" : "lines"} of ${LANGUAGE_NAMES_EN[o.language]}${maskedCount > 0 ? `, ${maskedCount} ${maskedCount === 1 ? "value" : "values"} masked` : ""}`; // the accessible name (what the code is, not its colours)
  const L = layout(lines, { palette: o.palette, fontSize: o.fontSize, lineNumbers: o.lineNumbers, frame: o.frame, title, padding: o.padding, highlight: new Set(hl.lines) }); // the layout
  return {
    ok: true, error: null, notes, replaced: norm.replaced, lineCount: lines.length, // the summary
    findings, maskedCount, highlighted: hl.lines, highlightProblems: hl.problems, description, // the details
    layout: L, svg: toSvg(L, description), altText: altText(description, lines, o.maskLabel !== "" ? o.maskLabel : "[masked]"), // the outputs
  }; // the result
} // renderCode

/** A finding the reader chose to leave visible, as the share popover names it (never its value). */
export interface ShareUnmasked { key: string; rule: SecretFinding["rule"]; label: string; line: number; column: number }

/** What a "Share results" link of this tool may carry, or that there is nothing to share. */
export type ShareableCode =
  | { ok: true; text: string; masked: number; unmasked: ShareUnmasked[] } // the text as the picture shows it
  | { ok: false }; // no picture (refused or empty): nothing to share

/**
 * The derived form a "Share results" link carries (2026-10-27): the normalised text (step 1: byte order mark removed,
 * line endings read as LF, characters XML cannot hold replaced, one final line feed dropped) with every finding the
 * picture masks replaced by the same eight bullets, exactly the spans renderCode masks; a finding the reader unticked
 * keeps its value, and is listed so the popover can name it. Tabs stay tabs, so the receiving page applies its own
 * tab stops. Only offered when renderCode would draw a picture from the same input and options.
 * @param input the pasted text
 * @param partial the options the picture uses (unmask included)
 * @param rendered the picture renderCode already made from the same input and options (the page passes its own)
 * @returns the text and what is masked and unmasked in it, or ok false
 */
export function shareableCode(input: string, partial: Partial<CodeImageOptions> = {}, rendered?: CodeImageResult): ShareableCode {
  const r = rendered ?? renderCode(input, partial); // the same checks and the same findings as the picture
  if (!r.ok) return { ok: false }; // no picture, nothing to share
  const text = normalise(input).text; // step 1, as renderCode reads it
  const unmask = new Set(partial.unmask ?? []); // the findings left visible
  const spans: { start: number; end: number }[] = []; // the masked stretches
  const unmasked: ShareUnmasked[] = []; // the visible findings, by safe label
  for (const f of r.findings) { // each finding
    const key = findingKey(f); // its stable key
    if (unmask.has(key)) { unmasked.push({ key, rule: f.rule, label: f.label, line: f.line, column: f.column }); continue; } // left visible
    for (const sp of f.spans) spans.push({ start: sp.start, end: sp.end }); // masked, one span per line
  } // findings
  spans.sort((a, b) => b.start - a.start); // right to left, so earlier offsets stay valid
  let out = text; // the working copy
  for (const sp of spans) out = out.slice(0, sp.start) + MASK + out.slice(sp.end); // the eight bullets, as in the picture
  return { ok: true, text: out, masked: r.maskedCount, unmasked }; // the derived form
} // shareableCode

/**
 * The registry-shaped entry point, with the default options (the tool is not exposed over the API; see index.ts).
 * @param input the code
 * @returns the result
 */
export function run(input: string): CodeImageResult {
  return renderCode(input, {}); // defaults
} // run
