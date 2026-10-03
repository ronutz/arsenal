"use client";

// ============================================================================
// src/components/TclTeachParts.tsx
// ----------------------------------------------------------------------------
// SHARED PRESENTATION PIECES for the iRules / Tcl teaching tools: a character
// ruler that marks spans of a string, an evaluation tree for expressions, a
// numbered code block with marked lines, and a segmented toggle.
//
// These pieces hold no words of their own: every label arrives as a prop, so
// each tool passes text from its own message namespace (the tool page slices
// only that namespace into the client). They hold no state beyond what their
// props describe, and they never compute: the engines in src/lib/tcl84 do.
// ============================================================================

import { Fragment, type ReactNode } from "react";

/** A visible stand-in for a character that would otherwise be invisible on the ruler. */
export function glyph(ch: string): string {
  // A space is drawn as an open box so its position can be counted.
  if (ch === " ") return "␣";
  // A tab.
  if (ch === "\t") return "⇥";
  // A line feed.
  if (ch === "\n") return "↵";
  // A carriage return.
  if (ch === "\r") return "␍";
  // A NUL character.
  if (ch === "\u0000") return "␀";
  // Any other control character.
  if (/[\u0001-\u001f\u007f]/.test(ch)) return "·";
  // A no-break space looks like a space but is not the same character.
  if (ch === " ") return "⍽";
  // Everything else is itself.
  return ch;
}

/** One marked region of a string (inclusive bounds), with the role that colours it. */
export interface RulerSpan {
  // First character (inclusive).
  from: number;
  // Last character (inclusive).
  to: number;
  // The role: result, match, skipped, terminator, separator, field, window,
  // replaced, trimmed, differ, consumed, consumed-alt, stop.
  role: string;
}

/** How many characters the ruler draws before it stops and says so. */
const RULER_MAX = 400;

/** A string drawn as numbered cells, each coloured by the spans that cover it. */
export function TclRuler({ text, spans, roleLabel, caption, truncatedLabel }: {
  // The string.
  text: string;
  // The marked regions.
  spans: RulerSpan[];
  // The legend's word for a role.
  roleLabel: (role: string) => string;
  // An optional caption above the cells.
  caption?: string;
  // The sentence shown when the string is longer than the ruler draws.
  truncatedLabel?: string;
}) {
  // The characters, as JavaScript code units (Tcl 8.4 characters are BMP code points).
  const chars = [...text];
  // The part that is drawn.
  const shown = chars.slice(0, RULER_MAX);
  // Roles per character.
  const roles: string[][] = shown.map(() => []);
  // Mark each span.
  for (const s of spans) for (let i = Math.max(0, s.from); i <= Math.min(shown.length - 1, s.to); i++) if (!roles[i].includes(s.role)) roles[i].push(s.role);
  // The roles present, in first-seen order, for the legend.
  const present = [...new Set(spans.map((s) => s.role))];
  // Index labels: every cell for short strings, every fifth for long ones.
  const every = shown.length > 60 ? 5 : 1;
  // Draw.
  return (
    <div className="tcl-ruler">
      {/* The caption, when given. */}
      {caption && <p className="tcl-ruler-caption">{caption}</p>}
      {/* The cells scroll sideways on a narrow screen rather than squeezing. */}
      <div className="tcl-ruler-scroll">
        {/* One cell per character. */}
        <ol className="tcl-cells" aria-label={caption}>
          {shown.length === 0 && <li className="tcl-cell tcl-cell-empty">&#8203;</li>}
          {shown.map((ch, i) => (
            <li key={i} className={["tcl-cell", ...roles[i].map((r) => `tcl-r-${r}`)].join(" ")} title={`${i}: U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`}>
              {/* The character (or its stand-in). */}
              <span className="tcl-cell-ch">{glyph(ch)}</span>
              {/* Its index. */}
              <span className="tcl-cell-i">{i % every === 0 ? i : " "}</span>
            </li>
          ))}
        </ol>
      </div>
      {/* A long string is drawn in part, and the page says so. */}
      {chars.length > RULER_MAX && truncatedLabel && <p className="tcl-ruler-caption">{truncatedLabel}</p>}
      {/* The legend for the roles in use. */}
      {present.length > 0 && (
        <ul className="tcl-legend">
          {present.map((r) => (
            <li key={r} className="tcl-key">
              {/* A swatch in the role's colours. */}
              <span className={`tcl-swatch tcl-r-${r}`} aria-hidden="true" />
              {/* The role's name. */}
              {roleLabel(r)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A node of an evaluation trace (the shape src/lib/tcl84/trace.ts produces). */
export interface TreeNode {
  // The node kind (lit, brace, quote, var, dollar, cmd, un, bin, tern, fn, paren).
  kind: string;
  // The source text of this part of the expression.
  text: string;
  // The value it produced.
  value?: string;
  // How an operator's result is held: int, double, string or boolean.
  held?: string;
  // Explanations (codes the tool translates).
  notes: { code: string; params?: Record<string, string | number | boolean> }[];
  // True when it was never evaluated.
  skipped?: boolean;
  // The error raised here.
  error?: string;
  // A platform caveat code.
  platform?: string;
  // Operands in evaluation order.
  kids: TreeNode[];
}

/** An expression's evaluation drawn as nested boxes, operands under their operator. */
export function TclTree({ node, noteText, heldLabel, skippedLabel, platformText }: {
  // The root node.
  node: TreeNode;
  // A note's sentence.
  noteText: (code: string, params?: Record<string, string | number | boolean>) => ReactNode;
  // The word for how a value is held.
  heldLabel: (held: string) => string;
  // The word for a part that never ran.
  skippedLabel: string;
  // A platform caveat's sentence.
  platformText: (code: string) => string;
}) {
  // One node and its operands.
  const draw = (n: TreeNode, path: string): ReactNode => (
    <li key={path} className={["tcl-node", n.skipped ? "tcl-node-skipped" : "", n.error !== undefined ? "tcl-node-error" : ""].filter(Boolean).join(" ")}>
      {/* The node's line: source, then what it gave. */}
      <div className="tcl-node-head">
        {/* The source of this part. */}
        <code className="tcl-node-src">{n.text}</code>
        {/* An arrow to the outcome. */}
        <span className="tcl-node-arrow" aria-hidden="true">&#8594;</span>
        {/* The outcome: skipped, an error, or the value. */}
        {n.skipped ? <span className="tcl-pill tcl-pill-muted">{skippedLabel}</span> : n.error !== undefined ? <span className="tcl-pill tcl-pill-bad">{n.error}</span> : <code className="tcl-pill tcl-pill-value">{n.value === "" ? "∅" : n.value}</code>}
        {/* How an operator's result is held. */}
        {n.held && !n.skipped && n.error === undefined && <span className="tcl-held">{heldLabel(n.held)}</span>}
      </div>
      {/* The explanations for this step. */}
      {(n.notes.length > 0 || n.platform) && (
        <ul className="tcl-node-notes">
          {n.notes.map((x, k) => <li key={k}>{noteText(x.code, x.params)}</li>)}
          {n.platform && <li className="tcl-node-platform">{platformText(n.platform)}</li>}
        </ul>
      )}
      {/* The operands, nested. */}
      {n.kids.length > 0 && <ol className="tcl-tree-kids">{n.kids.map((k, i) => draw(k, `${path}.${i}`))}</ol>}
    </li>
  );
  // The whole tree.
  return <ol className="tcl-tree">{draw(node, "0")}</ol>;
}

/** Numbered lines of code, with some lines marked by severity. */
export function TclCode({ code, marks, label }: {
  // The code.
  code: string;
  // Line number to severity class suffix (error, warning, info, hit).
  marks?: Map<number, string>;
  // An accessible name for the block.
  label?: string;
}) {
  // The lines (a final line feed does not make an extra empty line).
  const lines = code.replace(/\n$/, "").split("\n");
  // Draw.
  return (
    <div className="tcl-code" role="group" aria-label={label}>
      {/* One row per line. */}
      {lines.map((l, i) => (
        <div key={i} className={["tcl-code-line", marks?.get(i + 1) ? `tcl-code-${marks.get(i + 1)}` : ""].filter(Boolean).join(" ")}>
          {/* The line number. */}
          <span className="tcl-ln" aria-hidden="true">{i + 1}</span>
          {/* The text, tabs kept visible. */}
          <span className="tcl-code-text">{l.replace(/\t/g, "⇥   ") || " "}</span>
        </div>
      ))}
    </div>
  );
}

/** A small segmented control: one choice of a few, as pressed buttons. */
export function TclSeg<T extends string>({ options, value, onChange, label }: {
  // The choices.
  options: { value: T; label: string }[];
  // The current choice.
  value: T;
  // Called with the new choice.
  onChange: (v: T) => void;
  // The group's accessible name.
  label: string;
}) {
  // Draw.
  return (
    <div className="tcl-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="tcl-seg-btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A row of preset buttons that load named examples. */
export function TclPresets({ items, label, onPick, active }: {
  // The presets: an id and the text on the button.
  items: { id: string; label: string }[];
  // The row's accessible name (and visible caption).
  label: string;
  // Called with the chosen id.
  onPick: (id: string) => void;
  // The id currently loaded, if any.
  active?: string;
}) {
  // Draw.
  return (
    <div className="tcl-presets">
      {/* The caption. */}
      <span className="tcl-presets-label">{label}</span>
      {/* The buttons. */}
      <div className="tcl-presets-row" role="group" aria-label={label}>
        {items.map((p) => (
          <button key={p.id} type="button" className="tcl-chip" aria-pressed={p.id === active} onClick={() => onPick(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A labelled pair list (name, value), used for variables and results. */
export function TclPairs({ rows, emptyLabel, label }: {
  // The rows: a name and a value (null is shown as the empty label).
  rows: { name: ReactNode; value: string | null; tone?: string }[];
  // The word for "no value".
  emptyLabel: string;
  // An accessible name.
  label?: string;
}) {
  // Draw.
  return (
    <dl className="tcl-pairs" aria-label={label}>
      {rows.map((r, i) => (
        <Fragment key={i}>
          {/* The name. */}
          <dt className="tcl-pairs-name">{r.name}</dt>
          {/* The value, or the empty label. */}
          <dd className={["tcl-pairs-value", r.tone ? `tcl-tone-${r.tone}` : ""].filter(Boolean).join(" ")}>{r.value === null ? <span className="tcl-muted">{emptyLabel}</span> : <code>{r.value === "" ? "∅" : r.value}</code>}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
