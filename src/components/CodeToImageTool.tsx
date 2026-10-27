"use client";

// ============================================================================
// src/components/CodeToImageTool.tsx
// ----------------------------------------------------------------------------
// UI for code to image. Paste code, configuration or terminal output; choose
// the language for highlighting, the palette, the font size, tab stops, line
// numbers, a window frame with an optional title, the padding and the lines to
// highlight. The secrets check runs first: every finding is listed (line,
// column, rule and a safe label, never the value) and masked in the picture
// unless the reader unticks it. Then the preview, the exports (SVG, PNG at 1x
// and 2x, and copying the PNG where the browser offers ClipboardItem) and the
// alt text with a Copy button.
//
// How the picture is shown and offered, checked against public/_headers (the
// global CSP: img-src 'self' data:, font-src 'self', connect-src 'self'):
//   - the preview is inline SVG built by React from the engine's layout, so no
//     image URL is loaded at all (no data: and no blob: image);
//   - the PNG is drawn on an off-screen canvas from the same layout, with the
//     page's own JetBrains Mono (already loaded from 'self'), character by
//     character on the grid, so no programming ligature can form;
//   - downloads are <a download> clicks on blob: URLs, which are navigations,
//     not image loads, and CSP Level 3's only navigation directives are
//     form-action and frame-ancestors; the URL is revoked afterwards;
//   - copying uses navigator.clipboard.write with a ClipboardItem holding the
//     PNG; Permissions-Policy does not restrict clipboard-write.
// Nothing is fetched and nothing leaves the browser. The policy is unchanged.
//
// SHARE RESULTS (2026-10-27, PRIME): a button in the Export panel builds,
// only when pressed, a link carrying the text as the picture shows it (every
// masked value replaced by the eight bullets), the language and the palette
// (spec: src/lib/tools/code-to-image/share.ts). The popover names any value
// the reader unticked, because that one travels as typed. An arriving link
// (useShareArrival) fills the box, the language and the palette as a paste
// would; the address loses the values at once (history.replaceState).
//
// The engine (src/lib/tools/code-to-image) does all the computing; this
// component renders and exports. Styling reuses existing classes (cidr-*,
// json-*, jwt-*, b64-copy, cipher-note, lab-table-wrap, mono); the preview's
// scaling is an inline style, as in other tools.
// ============================================================================

import { useEffect, useMemo, useState } from "react"; // state and the memoised result
import { useTranslations } from "next-intl"; // this tool's messages
import { renderCode, findingKey, MAX_TITLE, MAX_HIGHLIGHT_SPEC } from "@/lib/tools/code-to-image/compute"; // the engine (imported directly, so the golden vectors stay out of the page bundle)
import { LANGUAGES, type LanguageId } from "@/lib/tools/code-to-image/languages"; // the language list
import { FONT_SIZES, PADDINGS, TAB_WIDTHS, FONT_STACK, PALETTES, type PaletteId, type Layout } from "@/lib/tools/code-to-image/render"; // the picture's choices
import { EXAMPLE_FORTIOS, EXAMPLE_OPTIONS } from "@/lib/tools/code-to-image/example"; // the Example: the input and options of golden vector svg-example
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the spec encodes
import { CODE_TO_IMAGE_SHARE } from "@/lib/tools/code-to-image/share"; // this tool's share spec: the masked text, the language, the palette

/** Nothing to share (the button is disabled). */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // a constant, so the button sees no change

/** The canvas font family: the page's JetBrains Mono (next/font sets --font-jetbrains-mono on <html>), then the fallbacks. */
function canvasFamily(): string {
  const v = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains-mono").trim() : ""; // the generated family name
  return v !== "" ? `${v}, ${FONT_STACK}` : FONT_STACK; // the page's copy first
} // canvasFamily

/** Trace a rectangle with rounded corners (top only when topOnly), without relying on CanvasRenderingContext2D.roundRect. */
function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, topOnly: boolean): void {
  ctx.beginPath(); // a new path
  ctx.moveTo(x, y + h); // bottom-left (square when topOnly)
  if (topOnly) ctx.lineTo(x, y + r); else { ctx.lineTo(x, y + h - r); ctx.arcTo(x, y + h, x + r, y + h, r); ctx.lineTo(x + w - r, y + h); ctx.arcTo(x + w, y + h, x + w, y + h - r, r); ctx.lineTo(x + w, y + r); } // the bottom corners
  if (topOnly) { ctx.arcTo(x, y, x + r, y, r); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h); } // the top corners, then down the right side
  else { ctx.arcTo(x + w, y, x + w - r, y, r); ctx.lineTo(x + r, y); ctx.arcTo(x, y, x, y + r, r); } // the top corners, back to the left side
  ctx.closePath(); // close
} // roundedPath

/**
 * Draw a layout on a canvas at a scale and return the PNG.
 * @param L the layout
 * @param scale 1 or 2
 * @returns the PNG, or null when the browser cannot make a canvas this large
 */
async function drawPng(L: Layout, scale: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas"); // off-screen
  canvas.width = Math.ceil(L.width * scale); canvas.height = Math.ceil(L.height * scale); // device pixels
  const ctx = canvas.getContext("2d"); // the 2D context
  if (!ctx) return null; // no canvas support
  const font = `${L.fontSize}px ${canvasFamily()}`; // the text font
  try { await document.fonts?.load(font); } catch { /* the fallback stack still draws */ } // make sure the glyphs are there
  ctx.scale(scale, scale); // draw in CSS pixels
  ctx.fillStyle = L.outerFill; ctx.fillRect(0, 0, L.width, L.height); // the background
  if (L.window) { // the frame
    const w = L.window; // shorthand
    ctx.fillStyle = w.bodyFill; roundedPath(ctx, w.x, w.y, w.width, w.height, w.radius, false); ctx.fill(); // the body
    ctx.fillStyle = w.barFill; roundedPath(ctx, w.x, w.y, w.width, w.barHeight, w.radius, true); ctx.fill(); // the title bar
    for (const d of w.dots) { ctx.fillStyle = d.fill; ctx.beginPath(); ctx.arc(d.cx, d.cy, d.r, 0, Math.PI * 2); ctx.fill(); } // the dots
  } // frame
  for (const b of L.bands) { ctx.fillStyle = b.fill; ctx.fillRect(b.x, b.y, b.width, b.height); ctx.fillStyle = b.markerFill; ctx.fillRect(b.x, b.y, b.markerWidth, b.height); } // highlighted lines
  ctx.font = font; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; // the text settings
  /** Draw text one character per column, so the grid holds in any font and no ligature forms. */
  const put = (text: string, x0: number, y: number, fill: string): void => { ctx.fillStyle = fill; let k = 0; for (const ch of text) { if (ch !== " ") ctx.fillText(ch, x0 + k * L.charWidth, y); k++; } }; // per code point
  if (L.window?.title) put(L.window.title.text, L.window.title.x, L.window.title.baseline, L.window.title.fill); // the title
  if (L.numbers) for (const l of L.lines) { const s = String(l.number); put(s, L.numbers.rightX - s.length * L.charWidth, l.baseline, L.numbers.fill); } // line numbers
  for (const l of L.lines) for (const r of l.runs) put(r.text, L.textX + r.col * L.charWidth, l.baseline, r.fill); // the code
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png")); // the PNG, or null
} // drawPng

/** Offer a blob as a download (a navigation to a blob: URL with the download attribute; not an image load). */
function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob); // a local URL for the bytes
  const a = document.createElement("a"); // a link
  a.href = url; a.download = name; a.click(); // save it
  setTimeout(() => URL.revokeObjectURL(url), 1000); // free it after the browser has started the download
} // download

/** The code-to-image tool. */
export default function CodeToImageTool() {
  const t = useTranslations("tools.code-to-image"); // this tool's messages

  const [input, setInput] = useState(""); // the pasted text
  const [language, setLanguage] = useState<LanguageId>("plain"); // highlighting
  const [palette, setPalette] = useState<PaletteId>("dark"); // colours
  const [fontSize, setFontSize] = useState(16); // CSS pixels
  const [tabWidth, setTabWidth] = useState(4); // tab stops
  const [lineNumbers, setLineNumbers] = useState(true); // numbers on
  const [frame, setFrame] = useState(true); // window frame on
  const [title, setTitle] = useState(""); // the window title
  const [padding, setPadding] = useState(32); // outer padding
  const [highlight, setHighlight] = useState(""); // lines to highlight
  const [unmask, setUnmask] = useState<string[]>([]); // findings the reader chose to show
  const [status, setStatus] = useState(""); // the last export's outcome
  const [altCopied, setAltCopied] = useState(false); // the alt text Copy button's feedback
  const [canCopyPng, setCanCopyPng] = useState(false); // ClipboardItem available? (known only in the browser, after hydration)

  useEffect(() => { setCanCopyPng(typeof window.ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function"); }, []); // feature-detect once

  // An arriving share link: the text, the language and the palette, as a paste and two choices would set them.
  useShareArrival(CODE_TO_IMAGE_SHARE, (state) => { setInput(state.input); setLanguage(state.language); setPalette(state.palette); setUnmask([]); }); // every finding masked again

  useEffect(() => { setStatus(""); }, [input, language, palette, fontSize, tabWidth, lineNumbers, frame, title, padding, highlight, unmask]); // a change clears the last message

  // The engine runs on every change; it never throws, and an empty box shows nothing.
  const result = useMemo(() => {
    if (input.trim() === "") return null; // nothing yet
    return renderCode(input, {
      language, palette, fontSize, tabWidth, lineNumbers, frame, title, padding, highlight, unmask, // the choices
      maskLabel: t("alt.maskLabel"), // the word for a masked value in the alt text
      describe: (d) => t("alt.description", { lines: d.lines, language: d.language === "plain" ? t("alt.plainText") : t(`languages.${d.language}`), masked: d.masked }), // the localised description (a lower-case "plain text" inside the sentence)
    }); // the picture
  }, [input, language, palette, fontSize, tabWidth, lineNumbers, frame, title, padding, highlight, unmask, t]); // recomputed when any of them changes

  // What Share results may carry: the text as the picture shows it, the language and the palette (only with a picture).
  const share = useMemo<ShareEncoding>(() => (result && result.ok ? CODE_TO_IMAGE_SHARE.encode({ input, options: { language, palette, fontSize, tabWidth, lineNumbers, frame, title, padding, highlight, unmask }, rendered: result }) : NOTHING), [result, input, language, palette, fontSize, tabWidth, lineNumbers, frame, title, padding, highlight, unmask]); // the same options as the picture
  // The popover's detail line: the unticked findings travel as typed, so they are named; otherwise how many are masked.
  const shareDetails = useMemo<string[]>(() => {
    if (!result || !result.ok || result.findings.length === 0) return []; // nothing found: nothing to add
    const open = result.findings.filter((f) => unmask.includes(findingKey(f))); // left visible by the reader
    if (open.length === 0) return [t("share.allMasked", { n: result.maskedCount })]; // all masked
    return [t("share.unmasked", { n: open.length, list: open.map((f) => t("share.unmaskedItem", { line: f.line, label: f.label })).join("; ") })]; // named, never their values
  }, [result, unmask, t]); // with the findings

  /** Load the Example: the golden vector's input and the options its button sets. */
  function loadExample() {
    setInput(EXAMPLE_FORTIOS); setLanguage(EXAMPLE_OPTIONS.language ?? "fortios"); setTitle(EXAMPLE_OPTIONS.title ?? ""); setHighlight(EXAMPLE_OPTIONS.highlight ?? ""); // the vector's settings
    setPalette("dark"); setFontSize(16); setTabWidth(4); setLineNumbers(true); setFrame(true); setPadding(32); setUnmask([]); // the defaults the vector assumes
  } // loadExample

  /** Clear everything typed; the choices stay. */
  function clear() { setInput(""); setTitle(""); setHighlight(""); setUnmask([]); } // clear

  /** Download the SVG. */
  function saveSvg() { if (!result?.ok) return; download(new Blob([result.svg], { type: "image/svg+xml" }), "code-image.svg"); setStatus(t("export.savedSvg")); } // the document

  /** Draw and download a PNG. */
  async function savePng(scale: number) {
    if (!result?.ok || !result.layout) return; // nothing to draw
    const blob = await drawPng(result.layout, scale); // drawn in the page
    if (!blob) { setStatus(t("export.tooLarge")); return; } // the canvas refused
    download(blob, scale === 1 ? "code-image.png" : "code-image@2x.png"); setStatus(t("export.savedPng", { scale })); // saved
  } // savePng

  /** Copy the 2x PNG to the clipboard (the ClipboardItem gets a promise, so the copy stays inside the click). */
  async function copyPng() {
    if (!result?.ok || !result.layout || !canCopyPng) return; // nothing to copy, or no support
    const L = result.layout; // the layout
    const png = drawPng(L, 2).then((b) => { if (!b) throw new Error("too-large"); return b; }); // the PNG, when drawn
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]); setStatus(t("export.copied")); } // copied
    catch { setStatus(t("export.copyFailed")); } // refused, or too large
  } // copyPng

  /** Copy the alt text. */
  function copyAlt() {
    if (!result?.ok) return; // nothing to copy
    navigator.clipboard?.writeText(result.altText).then(() => { setAltCopied(true); setTimeout(() => setAltCopied(false), 1500); }, () => {}); // a refused clipboard changes nothing
  } // copyAlt

  /** Tick or untick one finding's mask. */
  function toggle(key: string, masked: boolean) { setUnmask((u) => (masked ? u.filter((k) => k !== key) : [...u, key])); } // masked means not in the unmask list

  const L = result?.ok ? result.layout : null; // the layout to preview
  const plainFill = L ? PALETTES[L.palette].kinds.plain : ""; // the default text colour (the palette's plain kind)
  const xs = (x0: number, n: number, w: number): string => Array.from({ length: n }, (_, k) => String(Math.round((x0 + k * w) * 100) / 100)).join(" "); // one x per character, as in the SVG

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="c2i-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is the golden vector's own input. */}
            <button type="button" className="b64-copy" onClick={loadExample}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clear}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="c2i-input"
          className="cidr-input mono saml-textarea json-input"
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="c2i-privacy"
        />
        <p id="c2i-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {/* The choices. */}
      <div className="json-controls" role="group" aria-label={t("controlsLabel")}>
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-lang">{t("controls.language")}</label>
          <select id="c2i-lang" className="json-select" value={language} onChange={(e) => setLanguage(e.target.value as LanguageId)}>
            {LANGUAGES.map((l) => (<option key={l} value={l}>{t(`languages.${l}`)}</option>))}
          </select>
        </div>
        <div className="json-control">
          <span className="json-control-label">{t("controls.palette")}</span>
          <div className="json-segmented">
            {(["dark", "light"] as PaletteId[]).map((p) => (
              <button key={p} type="button" className={`json-seg${palette === p ? " is-active" : ""}`} onClick={() => setPalette(p)} aria-pressed={palette === p}>
                {t(`palettes.${p}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-size">{t("controls.fontSize")}</label>
          <select id="c2i-size" className="json-select" value={String(fontSize)} onChange={(e) => setFontSize(Number(e.target.value))}>
            {FONT_SIZES.map((n) => (<option key={n} value={n}>{t("px", { n })}</option>))}
          </select>
        </div>
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-tab">{t("controls.tabWidth")}</label>
          <select id="c2i-tab" className="json-select" value={String(tabWidth)} onChange={(e) => setTabWidth(Number(e.target.value))}>
            {TAB_WIDTHS.map((n) => (<option key={n} value={n}>{t("columns", { n })}</option>))}
          </select>
        </div>
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-pad">{t("controls.padding")}</label>
          <select id="c2i-pad" className="json-select" value={String(padding)} onChange={(e) => setPadding(Number(e.target.value))}>
            {PADDINGS.map((n) => (<option key={n} value={n}>{t("px", { n })}</option>))}
          </select>
        </div>
        <div className="json-control">
          <label className="json-checkbox">
            <input type="checkbox" checked={lineNumbers} onChange={(e) => setLineNumbers(e.target.checked)} />
            {t("controls.lineNumbers")}
          </label>
        </div>
        <div className="json-control">
          <label className="json-checkbox">
            <input type="checkbox" checked={frame} onChange={(e) => setFrame(e.target.checked)} />
            {t("controls.frame")}
          </label>
        </div>
      </div>
      <div className="json-controls">
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-title">{t("controls.title")}</label>
          <input id="c2i-title" className="cidr-input" type="text" value={title} maxLength={MAX_TITLE} disabled={!frame} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} autoComplete="off" />
        </div>
        <div className="json-control">
          <label className="json-control-label" htmlFor="c2i-hl">{t("controls.highlight")}</label>
          <input id="c2i-hl" className="cidr-input mono" type="text" value={highlight} maxLength={MAX_HIGHLIGHT_SPEC} onChange={(e) => setHighlight(e.target.value)} placeholder={t("highlightPlaceholder")} autoComplete="off" inputMode="text" />
        </div>
      </div>

      {/* Refused: why. */}
      {result && !result.ok && result.error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{t(`errors.${result.error.code}`, result.error.params)}</p>
        </div>
      )}

      {result && result.ok && L && (
        <div className="jwt-results">
          {/* The secrets check comes first: what it found, and what it looks for. */}
          <section className={result.findings.length > 0 ? "json-warn-box" : "jwt-panel"} aria-labelledby="c2i-secrets-title">
            <p id="c2i-secrets-title" className={result.findings.length > 0 ? "json-warn-headline" : "jwt-panel-title"}>
              {result.findings.length > 0 ? t("secrets.found", { n: result.findings.length, masked: result.maskedCount }) : t("secrets.none")}
            </p>
            {result.findings.length > 0 && (
              <ul className="json-warn-list">
                {result.findings.map((f) => {
                  const key = findingKey(f); // stable across edits
                  const masked = !unmask.includes(key); // the box's state
                  return (
                    <li key={key}>
                      <label className="json-checkbox">
                        <input type="checkbox" checked={masked} onChange={(e) => toggle(key, e.target.checked)} />
                        {t("secrets.item", { rule: t(`secrets.rules.${f.rule}`), line: f.line, column: f.column })} <code className="mono">{f.label}</code>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="cipher-note">{t("secrets.what")}</p>
            <p className="cipher-note">{t("secrets.notComplete")}</p>
          </section>

          {/* Notes and highlight problems. */}
          {(result.notes.length > 0 || result.highlightProblems.length > 0) && (
            <section className="json-warn-box">
              <p className="json-warn-headline">{t("notesTitle")}</p>
              <ul className="json-warn-list">
                {result.notes.map((n) => (<li key={n}>{t(`notes.${n}`, { n: result.replaced })}</li>))}
                {result.highlightProblems.map((p) => (<li key={`${p.token}-${p.reason}`}>{t(`highlightProblems.${p.reason}`, { token: p.token, last: result.lineCount })}</li>))}
              </ul>
            </section>
          )}

          {/* The preview: inline SVG from the same layout as the files (no image URL is loaded). */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("previewTitle")}</h4>
            <div className="lab-table-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width={L.width} height={L.height} viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label={result.description} style={{ display: "block", maxWidth: "100%", height: "auto" }}>
                <rect width={L.width} height={L.height} fill={L.outerFill} />
                {L.window && (
                  <>
                    <rect x={L.window.x} y={L.window.y} width={L.window.width} height={L.window.height} rx={L.window.radius} fill={L.window.bodyFill} />
                    <path d={`M${L.window.x} ${L.window.y + L.window.barHeight}V${L.window.y + L.window.radius}A${L.window.radius} ${L.window.radius} 0 0 1 ${L.window.x + L.window.radius} ${L.window.y}H${L.window.x + L.window.width - L.window.radius}A${L.window.radius} ${L.window.radius} 0 0 1 ${L.window.x + L.window.width} ${L.window.y + L.window.radius}V${L.window.y + L.window.barHeight}Z`} fill={L.window.barFill} />
                    {L.window.dots.map((d) => (<circle key={d.cx} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />))}
                  </>
                )}
                {L.bands.map((b) => (
                  <g key={b.y}>
                    <rect x={b.x} y={b.y} width={b.width} height={b.height} fill={b.fill} />
                    <rect x={b.x} y={b.y} width={b.markerWidth} height={b.height} fill={b.markerFill} />
                  </g>
                ))}
                <g className="mono" fontSize={L.fontSize} style={{ whiteSpace: "pre" }} aria-hidden="true">
                  {L.window?.title && (<text x={xs(L.window.title.x, L.window.title.cols, L.charWidth)} y={L.window.title.baseline} fill={L.window.title.fill}>{L.window.title.text}</text>)}
                  {L.numbers && L.lines.map((l) => { const s = String(l.number); return (<text key={`n${l.number}`} x={xs(L.numbers!.rightX - s.length * L.charWidth, s.length, L.charWidth)} y={l.baseline} fill={L.numbers!.fill}>{s}</text>); })}
                  {L.lines.map((l) => (l.cols === 0 ? null : (
                    <text key={`l${l.number}`} x={xs(L.textX, l.cols, L.charWidth)} y={l.baseline} fill={plainFill}>
                      {l.runs.map((r) => (r.kind === "plain" ? r.text : <tspan key={r.col} fill={r.fill}>{r.text}</tspan>))}
                    </text>
                  )))}
                </g>
              </svg>
            </div>
            <p className="json-stats">
              <span className="json-stat">{t("stats.size", { w: Math.ceil(L.width), h: Math.ceil(L.height) })}</span>
              <span className="json-stat">{t("stats.lines", { n: result.lineCount })}</span>
              {result.highlighted.length > 0 && <span className="json-stat">{t("stats.highlighted", { n: result.highlighted.length })}</span>}
            </p>
          </section>

          {/* Exports. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("export.title")}</h4>
            <div className="json-controls">{/* wraps on a narrow screen (dig-input-actions does not) */}
              <button type="button" className="b64-copy" onClick={saveSvg}>{t("export.svg")}</button>
              <button type="button" className="b64-copy" onClick={() => void savePng(1)}>{t("export.png1")}</button>
              <button type="button" className="b64-copy" onClick={() => void savePng(2)}>{t("export.png2")}</button>
              {canCopyPng && <button type="button" className="b64-copy" onClick={() => void copyPng()}>{t("export.copyPng")}</button>}
            </div>
            <p className="cidr-privacy" role="status" aria-live="polite">{status}</p>
            {/* Share results: its own row at the start, so its popover opens below the button and stays on a narrow screen. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} title={t("name")} />
            </div>
            {!canCopyPng && <p className="cipher-note">{t("export.copyUnsupported")}</p>}
            <p className="cipher-note">{t("export.svgNote")}</p>
            <p className="cipher-note">{t("export.contrastNote")}</p>
          </section>

          {/* Alt text. */}
          <section className="jwt-panel">
            <div className="json-output-head">
              <h4 className="jwt-panel-title">{t("alt.title")}</h4>
              <button type="button" className="json-copy-btn" onClick={copyAlt}>{altCopied ? t("alt.copied") : t("alt.copy")}</button>
            </div>
            <pre className="json-output mono" aria-label={t("alt.title")}>{result.altText}</pre>
            <p className="cipher-note">{t("alt.note")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
