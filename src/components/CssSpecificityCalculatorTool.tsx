"use client";

// ============================================================================
// src/components/CssSpecificityCalculatorTool.tsx
// ----------------------------------------------------------------------------
// THE CSS SPECIFICITY CALCULATOR (page UI). One or more selectors in; out
// comes each one's (A, B, C) with every simple selector named and its column
// shown, the selectors ranked the way the cascade ranks them (ties noted, since
// order of appearance then decides), and the reminder of what the cascade
// checks before specificity.
//
// All answers come from src/lib/tools/css-specificity-calculator (pure
// parsing); this component only lays them out and words them.
//
// Share results (2026-10-27): under the summary, a button builds a link that
// carries the selectors as typed (src/lib/tools/css-specificity-calculator/
// share.ts). An arriving link (useShareArrival) replaces the box as a paste
// would.
//
// 2026-11-01: the Share results row sits between two live regions (the
// verdict, then the rest of the reading) instead of inside one, so the
// button's and the popover's own text is never announced as a result.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { engineTexts } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { run, VECTORS, type SpecificityResult, type Piece } from "@/lib/tools/css-specificity-calculator";
import { TclPresets } from "@/components/TclTeachParts";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { CSS_SPECIFICITY_SHARE } from "@/lib/tools/css-specificity-calculator/share"; // this tool's share spec: the selectors as typed

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "spec-examples";

// The vectors offered as presets.
const PRESET_IDS = ["spec-examples", "is-where-not", "pseudo-elements", "repeated-and-universal", "shadow-dom", "a-stylesheet", "ties", "errors"];

/** The page component. */
export default function CssSpecificityCalculatorTool() {
  // This tool's words.
  const t = useTranslations("tools.css-specificity-calculator");
  const tx = useMemo(() => engineTexts(t), [t]); // PAGE LANGUAGE (02/11/2026): a thrown engine sentence in the page's language
  // The selectors.
  const [text, setText] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.selectors);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading.
  const out = useMemo((): { r?: SpecificityResult; error?: string } => {
    // Nothing to read.
    if (text.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ selectors: text }) }; } catch (e) { return { error: tx.error(e) }; } // the size ceiling's sentence, translated
  }, [text, tx]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its text.
    setText(v.input.selectors);
    // Mark it.
    setActive(id);
  };
  // The result.
  const r = out.r;
  // An arriving share link: the selectors replace the box as a paste would (no preset is marked).
  useShareArrival(CSS_SPECIFICITY_SHARE, (state) => { setText(state.input); setActive(undefined); }); // as typed
  // What Share results may carry: the selectors, while they give a reading.
  const share = useMemo<ShareEncoding>(() => (r && r.selectors.length > 0 ? CSS_SPECIFICITY_SHARE.encode({ input: text }) : NOTHING), [r, text]); // memoised
  // The rank of a selector index (1-based), or null when invalid.
  const rankOf = (k: number) => { const i = r?.ranking.indexOf(k) ?? -1; return i < 0 ? null : i + 1; };
  // A piece's column pill.
  const colPill = (p: Piece) => {
    // Nothing added.
    if (!p.adds) return <span className="tcl-pill tcl-pill-muted">0</span>;
    // The contribution written as its triple when it is more than one unit.
    const c = p.contribution;
    // One unit in one column: the column letter.
    const simple = c[0] + c[1] + c[2] === 1;
    // Draw.
    return <span className={`tcl-pill ${p.adds === "A" ? "tcl-pill-bad" : p.adds === "B" ? "tcl-pill-warn" : "tcl-pill-value"}`}>{simple ? p.adds : `${c[0]},${c[1]},${c[2]}`}</span>;
  };
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The selectors, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="csp-src">{t("selectorsLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setText(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="csp-src" className="cidr-input mono json-input" rows={8} value={text} onChange={(e) => { setText(e.target.value); setActive(undefined); }} placeholder={t("placeholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && r.selectors.length > 0 && (
        <>
        {/* The verdict: a live region of its own, so a new reading is still announced (2026-11-01). */}
        <div className="jwt-results" aria-live="polite">
          {/* The summary. */}
          <div className={r.selectors.some((s) => s.error) ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p>
              <span className="tcl-verdict-label">{t("summary", { n: r.selectors.length })}</span>{" "}
              {r.top && t("topIs", { spec: `${r.top[0]},${r.top[1]},${r.top[2]}`, selector: r.selectors[r.ranking[0]].selector })}{" "}
              {r.ties.length > 0 && t("tiesNote", { n: r.ties.length })}
            </p>
          </div>
        </div>

        {/* Share results: under the summary (the answer: the top selector), at the start of its own row; outside the live regions (2026-11-01), so the
            button's and the popover's own text is never announced as a new result. */}
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
        </div>

        {/* The rest of the reading: not a live region (01/11/2026). Only the verdict above is announced; the full reading,
            often long and rebuilt on every change, is there to read, not to be read out on each keystroke. */}
        <div className="jwt-results">
          {/* The table: every selector with its triple and rank. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("tableTitle")}</h4>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead><tr><th scope="col">{t("colRank")}</th><th scope="col">{t("colSelector")}</th><th scope="col">A</th><th scope="col">B</th><th scope="col">C</th><th scope="col">{t("colSpecificity")}</th></tr></thead>
                <tbody>
                  {r.selectors.map((s, k) => (
                    <tr key={k}>
                      <th scope="row">{s.error ? <span className="tcl-pill tcl-pill-bad">{t("invalid")}</span> : rankOf(k)}</th>
                      <td><code>{s.selector}</code></td>
                      {s.error ? <td colSpan={4}><span className="tcl-muted">{t(`error.${s.error.what}`, { at: s.error.at + 1 })}</span></td> : (
                        <>
                          <td>{s.specificity[0]}</td>
                          <td>{s.specificity[1]}</td>
                          <td>{s.specificity[2]}</td>
                          <td><code>{s.text}</code></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hmac-build-note">{t("columns")}</p>
          </section>

          {/* Ties. */}
          {r.ties.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("tiesTitle")}</h4>
              <ul className="tcl-pool-list">
                {r.ties.map((g, i) => (
                  <li key={i}>
                    <code>{r.selectors[g[0]].text}</code>: {g.map((k, j) => <span key={k}><code>{r.selectors[k].selector}</code>{j < g.length - 1 ? ", " : ""}</span>)} <span className="tcl-muted tcl-small">{t("tieRule")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Each selector, piece by piece. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("piecesTitle")}</h4>
            <ol className="tcl-steps">
              {r.selectors.map((s, k) => (
                <li key={k} className={`tcl-step${s.error ? " tcl-step-error" : ""}`}>
                  <div className="tcl-step-head">
                    <span className="tcl-step-n">{k + 1}</span>
                    <code className="tcl-step-src">{s.selector}</code>
                    {!s.error && <span className="tcl-pill tcl-pill-value">{s.text}</span>}
                  </div>
                  {s.error ? <p className="tcl-finding-msg">{t(`error.${s.error.what}`, { at: s.error.at + 1 })}</p> : (
                    <div className="tcl-words">
                      {s.pieces.map((p, i) => (
                        <span key={i} className="tcl-word" title={t(`kind.${p.kind}`)}>
                          {p.kind === "combinator" ? <span className="tcl-muted">{p.text === " " ? t("descendant") : p.text}</span> : <>{p.text} {colPill(p)}</>}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Notes on the special rules this selector used. */}
                  {!s.error && s.pieces.some((p) => p.note) && (
                    <ul className="tcl-changes">
                      {s.pieces.filter((p) => p.note).map((p, i) => <li key={i}><code>{p.text}</code>: {t(`note.${p.note}`)}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* What the cascade checks before specificity. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("cascadeTitle")}</h4>
            <p className="tcl-finding-msg">{t("cascadeIntro")}</p>
            <ol className="tcl-changes">
              {(["origin", "context", "attached", "layers", "specificity", "order"] as const).map((k) => <li key={k}>{t(`cascade.${k}`)}</li>)}
            </ol>
          </section>

          {/* Limits. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
        </>
      )}
    </div>
  );
}
