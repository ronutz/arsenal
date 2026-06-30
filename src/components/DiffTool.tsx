"use client";

// ============================================================================
// src/components/DiffTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE DIFF TOOL.
//
// Two text inputs (original / changed) and a unified line view: unchanged,
// removed, and added lines with both sides' line numbers. When a removed line
// is paired with an added line, an inline word-level diff highlights exactly
// what changed inside it (diffWords, see src/lib/tools/diff).
//
// PRIVACY: everything is computed locally; the text is never sent anywhere. The
// diff recomputes via useMemo, and the engine's size guard surfaces as a
// friendly message rather than a frozen tab on a pathological paste.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { diffLines, diffWords, type DiffLine, type WordPart } from "@/lib/tools/diff";

// A render row: an unchanged line, a removed line, or an added line. Removed and
// added rows carry optional word parts when they were paired for inline diff.
type Row =
  | { kind: "equal"; text: string; aLine: number; bLine: number }
  | { kind: "delete"; aLine: number; text: string; parts: WordPart[] | null }
  | { kind: "insert"; bLine: number; text: string; parts: WordPart[] | null };

/** Group raw diff lines into rows, pairing each removed-line run with the
 *  following added-line run so paired lines get an inline word diff. */
function buildRows(lines: DiffLine[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].op === "equal") {
      const l = lines[i];
      rows.push({ kind: "equal", text: l.text, aLine: l.aLine as number, bLine: l.bLine as number });
      i++;
      continue;
    }
    const deletes: DiffLine[] = [];
    while (i < lines.length && lines[i].op === "delete") deletes.push(lines[i++]);
    const inserts: DiffLine[] = [];
    while (i < lines.length && lines[i].op === "insert") inserts.push(lines[i++]);
    const pairCount = Math.min(deletes.length, inserts.length);
    deletes.forEach((d, k) => {
      // Pair with the matching insert (if any) and keep the non-insert parts,
      // i.e. A's text with removed words marked.
      const parts = k < pairCount ? diffWords(d.text, inserts[k].text).filter((p) => p.op !== "insert") : null;
      rows.push({ kind: "delete", aLine: d.aLine as number, text: d.text, parts });
    });
    inserts.forEach((ins, k) => {
      const parts = k < pairCount ? diffWords(deletes[k].text, ins.text).filter((p) => p.op !== "delete") : null;
      rows.push({ kind: "insert", bLine: ins.bLine as number, text: ins.text, parts });
    });
  }
  return rows;
}

/** Render a line's content, optionally with inline word highlighting. */
function LineContent({ text, parts, mark }: { text: string; parts: WordPart[] | null; mark: "del" | "ins" }) {
  if (!parts) return <>{text === "" ? "\u00A0" : text}</>;
  return (
    <>
      {parts.map((p, idx) =>
        p.op === "equal" ? (
          <span key={idx}>{p.text}</span>
        ) : (
          <mark key={idx} className={`diff-word diff-word--${mark}`}>
            {p.text}
          </mark>
        )
      )}
    </>
  );
}

export default function DiffTool() {
  const t = useTranslations("tools.diff");

  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);

  // Recompute only when inputs or options change. The size guard throws, which
  // we turn into a flag rather than letting it bubble.
  const computed = useMemo(() => {
    if (a === "" && b === "") return { rows: [] as Row[], stats: { added: 0, removed: 0, unchanged: 0 }, tooLarge: false };
    try {
      const result = diffLines(a, b, { ignoreWhitespace, ignoreCase });
      return { rows: buildRows(result.lines), stats: result.stats, tooLarge: false };
    } catch {
      return { rows: [] as Row[], stats: { added: 0, removed: 0, unchanged: 0 }, tooLarge: true };
    }
  }, [a, b, ignoreWhitespace, ignoreCase]);

  const hasInput = a !== "" || b !== "";
  const hasChanges = computed.stats.added > 0 || computed.stats.removed > 0;

  return (
    <div className="cidr-tool jwt-tool">
      {/* The two inputs, side by side on wide screens */}
      <div className="diff-inputs">
        <div className="cidr-input-row diff-input-col">
          <label className="cidr-label" htmlFor="diff-a">
            {t("originalLabel")}
          </label>
          <textarea
            id="diff-a"
            className="cidr-input jwt-input mono diff-textarea"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={t("originalPlaceholder")}
            rows={8}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
        <div className="cidr-input-row diff-input-col">
          <label className="cidr-label" htmlFor="diff-b">
            {t("changedLabel")}
          </label>
          <textarea
            id="diff-b"
            className="cidr-input jwt-input mono diff-textarea"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={t("changedPlaceholder")}
            rows={8}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Options */}
      <div className="diff-options">
        <label className="otp-now-toggle">
          <input type="checkbox" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} />
          {t("ignoreWhitespace")}
        </label>
        <label className="otp-now-toggle">
          <input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
          {t("ignoreCase")}
        </label>
      </div>

      {/* Result */}
      {computed.tooLarge ? (
        <p className="otp-error" role="alert">
          {t("tooLarge")}
        </p>
      ) : !hasInput ? (
        <p className="diff-empty">{t("emptyState")}</p>
      ) : !hasChanges ? (
        <p className="diff-empty">{t("noChanges")}</p>
      ) : (
        <div className="jwt-results">
          <div className="b64-output-head">
            <span className="jwt-panel-title">{t("resultHeading")}</span>
            <span className="diff-summary">
              <span className="diff-summary--add">+{computed.stats.added}</span>{" "}
              <span className="diff-summary--del">-{computed.stats.removed}</span>
            </span>
          </div>
          <div className="diff-view" role="table" aria-label={t("resultHeading")}>
            {computed.rows.map((row, idx) => {
              if (row.kind === "equal") {
                return (
                  <div className="diff-row diff-row--equal" role="row" key={idx}>
                    <span className="diff-gutter" aria-hidden="true">{row.aLine}</span>
                    <span className="diff-gutter" aria-hidden="true">{row.bLine}</span>
                    <span className="diff-marker" aria-hidden="true"> </span>
                    <span className="diff-content">{row.text === "" ? "\u00A0" : row.text}</span>
                  </div>
                );
              }
              if (row.kind === "delete") {
                return (
                  <div className="diff-row diff-row--delete" role="row" key={idx}>
                    <span className="diff-gutter" aria-hidden="true">{row.aLine}</span>
                    <span className="diff-gutter" aria-hidden="true"> </span>
                    <span className="diff-marker" aria-hidden="true">-</span>
                    <span className="diff-content">
                      <LineContent text={row.text} parts={row.parts} mark="del" />
                    </span>
                  </div>
                );
              }
              return (
                <div className="diff-row diff-row--insert" role="row" key={idx}>
                  <span className="diff-gutter" aria-hidden="true"> </span>
                  <span className="diff-gutter" aria-hidden="true">{row.bLine}</span>
                  <span className="diff-marker" aria-hidden="true">+</span>
                  <span className="diff-content">
                    <LineContent text={row.text} parts={row.parts} mark="ins" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
