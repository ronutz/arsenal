// ============================================================================
// src/lib/tools/code-to-image/render.ts
// ----------------------------------------------------------------------------
// From painted lines to a picture: the two palettes and their contrast
// record, the layout (every rectangle, circle and run of text with its
// position and colour), the SVG serialisation of that layout, and the alt
// text. The page draws the PNG on a canvas from the same layout object, so
// the SVG and the PNG cannot drift apart.
//
// Typography. The text is set in JetBrains Mono, the site's own monospace
// font (SIL Open Font License 1.1; the licence file of the installed
// @fontsource/jetbrains-mono 5.2.8 was read on 2026-10-27). Its metrics,
// read from the package's latin 400 WOFF on the same day: 1000 units per em,
// every spacing glyph 600 units wide (0.6 em), ascender 1020, descender -300,
// no line gap. A column is therefore 0.6 x the font size wide, and a line is
// 1.5 x the font size tall, rounded to a whole pixel, with the text's
// ascender-to-descender box centred in it.
//
// The SVG names the font and does not embed it (NOTES.md explains the choice
// and its size cost): font-family is "JetBrains Mono" followed by a monospace
// fallback stack. Each line is one <text> element (real, selectable text)
// whose x attribute lists one position per character, on the 0.6 em grid:
// SVG 2 (11.5, and the definition of "addressable character") applies the nth
// value of x to the nth character, counted in Unicode code points, so every
// character starts in its own column whatever font the viewer falls back to.
// (textLength was tried first and dropped: resvg, the rasteriser the site's
// card generator uses, spread the spacing unevenly across coloured tspans.)
// White space is kept with xml:space="preserve" (still honoured, deprecated in
// SVG 2 in favour of white-space, which is also set). Programming ligatures are switched off
// (font-variant-ligatures: none, and the contextual alternates the font uses
// for them, "calt"), as everywhere on the site, so "!=" reads as typed.
//
// Contrast. Every text colour of both palettes, the line numbers and the
// window title meet WCAG 2.2 Success Criterion 1.4.3 (at least 4.5:1 for
// normal text) against every background it can sit on: the code background
// and the highlighted-line band (the title against the title bar). The
// ratios are computed here with WCAG 2.2's own definitions of relative
// luminance (sRGB, threshold 0.04045, weights 0.2126, 0.7152, 0.0722) and
// contrast ratio ((L1 + 0.05) / (L2 + 0.05)), and pinned by golden vectors.
// The highlight marker bar is a graphical object and is held to 3:1 (SC
// 1.4.11). The three window dots are decoration (SC 1.4.3 "Incidental").
// ============================================================================

import { K, type TokenKind } from "./languages"; // the token kinds

/** The two palettes. */
export type PaletteId = "light" | "dark";

/** A palette: backgrounds, one colour per token kind, and the window furniture. */
export interface Palette {
  /** The outer area around the window (only drawn with the frame). */
  outer: string;
  /** The code background. */
  background: string;
  /** The background of a highlighted line. */
  highlight: string;
  /** The marker bar at the left of a highlighted line. */
  marker: string;
  /** The window's title bar. */
  bar: string;
  /** The window title text. */
  title: string;
  /** Line numbers. */
  lineNumber: string;
  /** The three window dots (decorative). */
  dots: [string, string, string];
  /** Text colours, one per kind. */
  kinds: Record<TokenKind, string>;
}

/** The palettes, frozen. Every colour is checked by contrastReport() and pinned by the golden vectors. */
export const PALETTES: Readonly<Record<PaletteId, Palette>> = Object.freeze({
  light: {
    outer: "#d5dbe3", background: "#ffffff", highlight: "#fff3c4", marker: "#9a6700", bar: "#eceff3", title: "#3a424a", lineNumber: "#5f6872", // backgrounds and furniture
    dots: ["#d4574e", "#d6a127", "#3f9d4b"], // decorative
    kinds: { plain: "#1f2328", comment: "#57606a", string: "#0a6629", number: "#0550ae", keyword: "#a40e26", variable: "#8a4600", prompt: "#0b6874", key: "#6639ba", masked: "#9c1c6f" }, // text
  },
  dark: {
    outer: "#3a4352", background: "#11151c", highlight: "#26303d", marker: "#e3b341", bar: "#1d232c", title: "#c3cbd4", lineNumber: "#97a1ad", // backgrounds and furniture
    dots: ["#e0665c", "#e2b340", "#58b368"], // decorative
    kinds: { plain: "#e6e9ef", comment: "#9ba6b2", string: "#9ddba0", number: "#8fc6ff", keyword: "#ff9c94", variable: "#f6bd84", prompt: "#7fd8d0", key: "#c9b0ff", masked: "#ff8fd0" }, // text
  },
}); // PALETTES

// ---------------------------------------------------------------------------
// WCAG 2.2 contrast.
// ---------------------------------------------------------------------------

/**
 * WCAG 2.2 relative luminance of an sRGB colour written #rrggbb.
 * @param hex the colour
 * @returns L in [0, 1]
 */
export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16); // the 24-bit value
  const ch = (v: number): number => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; // linearise one channel (threshold 0.04045)
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255); // the weighted sum
} // relativeLuminance

/**
 * WCAG 2.2 contrast ratio of two colours.
 * @param a one colour
 * @param b the other
 * @returns (L1 + 0.05) / (L2 + 0.05), from 1 to 21
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b); // both luminances
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); // lighter over darker
} // contrastRatio

/** One checked pair. */
export interface ContrastRow { palette: PaletteId; what: string; colour: string; against: string; ratio: number; required: number; pass: boolean }

/**
 * The contrast record: every text colour against every background it can sit on, the title against the bar, and the
 * marker against both backgrounds next to it. Ratios are rounded down to two decimals, so a pass is never rounded up.
 * @returns the rows, in a fixed order
 */
export function contrastReport(): ContrastRow[] {
  const rows: ContrastRow[] = []; // the record
  for (const id of ["light", "dark"] as PaletteId[]) {
    const p = PALETTES[id]; // the palette
    const add = (what: string, colour: string, against: string, required: number): void => {
      const ratio = Math.floor(contrastRatio(colour, against) * 100) / 100; // rounded down
      rows.push({ palette: id, what, colour, against, ratio, required, pass: ratio >= required }); // the row
    }; // add
    for (const k of Object.keys(p.kinds) as TokenKind[]) { add(`${k} on background`, p.kinds[k], p.background, 4.5); add(`${k} on highlight`, p.kinds[k], p.highlight, 4.5); } // text (SC 1.4.3)
    add("lineNumber on background", p.lineNumber, p.background, 4.5); add("lineNumber on highlight", p.lineNumber, p.highlight, 4.5); // line numbers are text
    add("title on bar", p.title, p.bar, 4.5); // the window title is text
    add("marker on background", p.marker, p.background, 3); add("marker on highlight", p.marker, p.highlight, 3); // a graphical object (SC 1.4.11)
  } // for
  return rows; // all rows
} // contrastReport

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

/** The font sizes offered, in CSS pixels. */
export const FONT_SIZES = Object.freeze([12, 14, 16, 18, 20, 24, 28] as const); // the select's values
/** The outer padding values offered, in CSS pixels. */
export const PADDINGS = Object.freeze([16, 32, 48, 64] as const); // the select's values
/** The tab widths offered, in columns. */
export const TAB_WIDTHS = Object.freeze([2, 4, 8] as const); // the select's values
/** The advance of every JetBrains Mono spacing glyph: 600 units per 1000 (read from the font file). */
export const ADVANCE_EM = 0.6; // em
/** JetBrains Mono's ascender and descender, in em (1020 and -300 units). */
export const ASCENT_EM = 1.02, DESCENT_EM = 0.3; // em
/** The font stack named in the SVG and used on the canvas after the page's own JetBrains Mono. */
export const FONT_STACK = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace"; // fallbacks

/** A run of one colour on one line, starting at a column. */
export interface LayoutRun { col: number; text: string; kind: TokenKind; fill: string }
/** One line of code. */
export interface LayoutLine { number: number; y: number; baseline: number; cols: number; runs: LayoutRun[] }
/** The whole picture, in CSS pixels at 1x. */
export interface Layout {
  width: number; height: number; // the image
  fontSize: number; charWidth: number; lineHeight: number; // the grid
  palette: PaletteId; // which palette
  outerFill: string; // the image background (the outer colour with a frame, the code background without)
  window: null | { x: number; y: number; width: number; height: number; radius: number; barHeight: number; barFill: string; bodyFill: string; dots: { cx: number; cy: number; r: number; fill: string }[]; title: null | { x: number; baseline: number; text: string; cols: number; fill: string } }; // the frame
  code: { x: number; y: number; width: number; height: number; fill: string }; // the code area
  textX: number; // where column 0 of the code starts
  numbers: null | { rightX: number; fill: string }; // line numbers, right-aligned to rightX
  bands: { x: number; y: number; width: number; height: number; fill: string; markerWidth: number; markerFill: string }[]; // highlighted lines
  lines: LayoutLine[]; // the code
}

/** Layout options (validated by compute.ts). */
export interface LayoutOptions { palette: PaletteId; fontSize: number; lineNumbers: boolean; frame: boolean; title: string; padding: number; highlight: ReadonlySet<number> }

/** A painted, masked, tab-expanded line: its runs (columns counted in code points). */
export interface PaintedLine { runs: { text: string; kind: TokenKind }[] }

/** Round to two decimals, deterministically. */
const r2 = (v: number): number => Math.round(v * 100) / 100; // two decimals

/**
 * Lay the picture out.
 * @param lines the painted lines
 * @param o the options
 * @returns the layout
 */
export function layout(lines: PaintedLine[], o: LayoutOptions): Layout {
  const p = PALETTES[o.palette]; // the palette
  const f = o.fontSize; // the font size
  const cw = r2(f * ADVANCE_EM); // one column
  const lh = Math.round(f * 1.5); // one line
  const baseOff = r2((lh - (ASCENT_EM + DESCENT_EM) * f) / 2 + ASCENT_EM * f); // the baseline inside a line box
  const pad = Math.round(f); // the padding inside the code area
  const colsOf = (l: PaintedLine): number => l.runs.reduce((n, r) => n + Array.from(r.text).length, 0); // a line's width in columns
  const maxCols = lines.reduce((m, l) => Math.max(m, colsOf(l)), 0); // the widest line
  const digits = o.lineNumbers ? String(lines.length).length : 0; // line-number width
  const gutter = o.lineNumbers ? r2((digits + 2) * cw) : 0; // numbers plus two columns of space
  const codeW = r2(pad * 2 + gutter + maxCols * cw); // the code area's width
  const codeH = pad * 2 + lines.length * lh; // its height
  const titleCols = o.frame ? Array.from(o.title).length : 0; // the title's width in columns
  const barH = o.frame ? Math.round(f * 2.25) : 0; // the title bar's height
  const dotR = r2(f * 0.375); // a dot's radius
  const dotsW = r2(pad + 6 * dotR + 2 * f * 0.5); // the space the three dots take from the left edge
  const winW = o.frame ? Math.max(codeW, r2(2 * dotsW + titleCols * cw + 2 * pad)) : codeW; // wide enough for the title between the dots
  const ox = o.frame ? o.padding : 0, oy = o.frame ? o.padding : 0; // the window's offset
  const extra = o.frame ? 0 : Math.max(0, o.padding - pad); // without a frame, the chosen padding (when larger than the inner one) surrounds the code directly
  const width = r2(o.frame ? winW + 2 * o.padding : codeW + 2 * extra); // the image width
  const codeX = o.frame ? ox : 0, codeY = o.frame ? oy + barH : 0; // the code area's corner
  const codeWidth = o.frame ? winW : width; // its width
  const codeHeight = codeH + 2 * extra; // its height
  const height = r2(o.frame ? codeHeight + barH + 2 * o.padding : codeHeight); // the image height
  const textX = r2(codeX + pad + extra + gutter); // column 0
  const top = codeY + pad + extra; // the first line's top
  const outLines: LayoutLine[] = lines.map((l, i) => {
    const runs: LayoutRun[] = []; // the coloured runs
    let col = 0; // the running column
    for (const r of l.runs) { if (r.text !== "") runs.push({ col, text: r.text, kind: r.kind, fill: p.kinds[r.kind] }); col += Array.from(r.text).length; } // one run per colour change
    return { number: i + 1, y: top + i * lh, baseline: r2(top + i * lh + baseOff), cols: col, runs }; // the line
  }); // map
  const bands = [...o.highlight].sort((a, b) => a - b).filter((n) => n >= 1 && n <= lines.length).map((n) => ({ x: codeX, y: top + (n - 1) * lh, width: codeWidth, height: lh, fill: p.highlight, markerWidth: 3, markerFill: p.marker })); // full-width bands
  const win = o.frame ? {
    x: ox, y: oy, width: winW, height: barH + codeHeight, radius: 8, barHeight: barH, barFill: p.bar, bodyFill: p.background, // the window
    dots: [0, 1, 2].map((k) => ({ cx: r2(ox + pad + dotR + k * (2 * dotR + f * 0.5)), cy: r2(oy + barH / 2), r: dotR, fill: p.dots[k] })), // three decorative dots
    title: titleCols > 0 ? { x: r2(ox + (winW - titleCols * cw) / 2), baseline: r2(oy + (barH - lh) / 2 + baseOff), text: o.title, cols: titleCols, fill: p.title } : null, // centred title
  } : null; // no frame
  return {
    width, height, fontSize: f, charWidth: cw, lineHeight: lh, palette: o.palette, // the grid
    outerFill: o.frame ? p.outer : p.background, // the image background
    window: win, // the frame
    code: { x: codeX, y: codeY, width: codeWidth, height: codeHeight, fill: p.background }, // the code area
    textX, // column 0
    numbers: o.lineNumbers ? { rightX: r2(codeX + pad + extra + digits * cw), fill: p.lineNumber } : null, // line numbers
    bands, lines: outLines, // the content
  }; // layout
} // layout

// ---------------------------------------------------------------------------
// SVG.
// ---------------------------------------------------------------------------

/** Format a number for the SVG: integers as they are, others with at most two decimals and no trailing zeros. */
export function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v); // an integer
  return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""); // two decimals at most
} // fmt

/** Escape text for an XML text node or a double-quoted attribute. */
export function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); // the four that matter here
} // xmlEscape

/**
 * Serialise a layout as a standalone SVG document. Deterministic: the same layout gives the same bytes.
 * @param L the layout
 * @param description the accessible name (also the SVG's title element)
 * @returns the SVG text, ending with a line feed
 */
export function toSvg(L: Layout, description: string): string {
  const out: string[] = []; // the lines of the document
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(L.width)}" height="${fmt(L.height)}" viewBox="0 0 ${fmt(L.width)} ${fmt(L.height)}" role="img" aria-labelledby="code-title" xml:space="preserve">`); // the root
  out.push(`<title id="code-title">${xmlEscape(description)}</title>`); // the accessible name
  out.push(`<rect width="${fmt(L.width)}" height="${fmt(L.height)}" fill="${L.outerFill}"/>`); // the background
  if (L.window) { // the frame
    const w = L.window; // shorthand
    out.push(`<rect x="${fmt(w.x)}" y="${fmt(w.y)}" width="${fmt(w.width)}" height="${fmt(w.height)}" rx="${w.radius}" fill="${w.bodyFill}"/>`); // the window body
    out.push(`<path d="${barPath(w.x, w.y, w.width, w.barHeight, w.radius)}" fill="${w.barFill}"/>`); // the title bar, top corners rounded
    for (const d of w.dots) out.push(`<circle cx="${fmt(d.cx)}" cy="${fmt(d.cy)}" r="${fmt(d.r)}" fill="${d.fill}"/>`); // the dots
  } // frame
  for (const b of L.bands) { // highlighted lines
    out.push(`<rect x="${fmt(b.x)}" y="${fmt(b.y)}" width="${fmt(b.width)}" height="${fmt(b.height)}" fill="${b.fill}"/>`); // the band
    out.push(`<rect x="${fmt(b.x)}" y="${fmt(b.y)}" width="${b.markerWidth}" height="${fmt(b.height)}" fill="${b.markerFill}"/>`); // its marker
  } // bands
  out.push(`<g font-family="${xmlEscape(FONT_STACK)}" font-size="${L.fontSize}" style="white-space:pre;font-variant-ligatures:none;font-feature-settings:'calt' 0">`); // the text group
  if (L.window?.title) { const t = L.window.title; out.push(`<text x="${xList(t.x, t.cols, L.charWidth)}" y="${fmt(t.baseline)}" fill="${t.fill}">${xmlEscape(t.text)}</text>`); } // the window title
  if (L.numbers) { // line numbers, right-aligned, in their own elements so a selection of the code does not pick them up
    for (const l of L.lines) { const s = String(l.number); out.push(`<text x="${xList(L.numbers.rightX - s.length * L.charWidth, s.length, L.charWidth)}" y="${fmt(l.baseline)}" fill="${L.numbers.fill}" aria-hidden="true">${s}</text>`); } // one per line, ending at the gutter's right edge
  } // numbers
  for (const l of L.lines) { // the code, one text element per line
    if (l.cols === 0 || l.runs.every((r) => r.text.trim() === "")) continue; // an empty or blank line draws nothing
    const spans = l.runs.map((r) => (r.kind === "plain" ? xmlEscape(r.text) : `<tspan fill="${r.fill}">${xmlEscape(r.text)}</tspan>`)).join(""); // coloured runs
    out.push(`<text x="${xList(L.textX, l.cols, L.charWidth)}" y="${fmt(l.baseline)}" fill="${PALETTES[L.palette].kinds.plain}">${spans}</text>`); // the line
  } // lines
  out.push("</g>"); // close the text group
  out.push("</svg>"); // close the document
  return out.join("\n") + "\n"; // one element per line
} // toSvg

/**
 * One x position per character: x0, x0 + w, x0 + 2w ... (SVG 2: the nth value applies to the nth code point).
 * @param x0 the first column's x
 * @param count how many characters
 * @param w the column width
 * @returns the space-separated list
 */
function xList(x0: number, count: number, w: number): string {
  const xs: string[] = []; // the positions
  for (let k = 0; k < count; k++) xs.push(fmt(r2(x0 + k * w))); // each column, rounded to two decimals so the list is exact and deterministic
  return xs.join(" "); // the list
} // xList

/** The title bar's outline: a rectangle whose two top corners are rounded with radius r. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  return `M${fmt(x)} ${fmt(y + h)}V${fmt(y + r)}A${r} ${r} 0 0 1 ${fmt(x + r)} ${fmt(y)}H${fmt(x + w - r)}A${r} ${r} 0 0 1 ${fmt(x + w)} ${fmt(y + r)}V${fmt(y + h)}Z`; // left side up, top-left arc, top edge, top-right arc, right side down, close
} // barPath

// ---------------------------------------------------------------------------
// Alt text.
// ---------------------------------------------------------------------------

/**
 * The alt text: a one-line description, a blank line, then the code as plain text, every masked value written as the
 * mask label (so a screen reader says "masked" once instead of reading eight bullets).
 * @param description the one-line description
 * @param lines the painted lines (masked runs carry the bullets)
 * @param maskLabel the word that stands for a masked value, e.g. "[masked]"
 * @returns the alt text
 */
export function altText(description: string, lines: PaintedLine[], maskLabel: string): string {
  const body = lines.map((l) => l.runs.map((r) => (r.kind === "masked" ? maskLabel : r.text)).join("").replace(/[ \t]+$/, "")).join("\n"); // the code
  return `${description}\n\n${body}`; // description, blank line, code
} // altText

/** Re-export the kind numbers for compute.ts. */
export { K }; // convenience
