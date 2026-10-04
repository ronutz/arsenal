"use client";

// ============================================================================
// src/components/F5BigipIndexBaseFinderTool.tsx
// ----------------------------------------------------------------------------
// THE BIG-IP ZERO-OR-ONE FINDER (page UI). Two modes:
//
//   Look up    every place on a BIG-IP that counts from 0 or from 1, filtered
//              by where counting starts, by part of the system, or by words;
//              each card shows what is counted, the first and the last, what
//              comes back when nothing is there, an example, the traps, where
//              F5's pages disagree, and the dated sources.
//   Translate  a position counted the way people count ("the 2nd segment")
//              into each command's own number, run in the Tcl 8.4.6 teaching
//              engine, beside the off-by-one version.
//
// All facts and results come from src/lib/tools/f5-bigip-index-base-finder;
// this component lays them out and words them through the i18n messages.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AREAS, BASES, QUESTIONS, VECTORS, lookup, translate, sourceOf, type Area, type Base, type Entry, type Question, type TranslateResult } from "@/lib/tools/f5-bigip-index-base-finder";
import { TclPresets, TclSeg } from "@/components/TclTeachParts";

// D-83: each mode's Example button loads a golden vector verbatim.
const EXAMPLE_LOOKUP = "lookup-path";
// The translator's example.
const EXAMPLE_TRANSLATE = "segment-2";

// The short badge for each base (language-neutral; the label and help come from the messages).
const BADGE: Record<Base, string> = { zero: "0", one: "1", right: "←", mixed: "0·1", value: "=0", count: "n" };

/** A vector's input, by id. */
function vectorInput(id: string): Record<string, unknown> {
  // The vector (the ids are fixed in the golden vector file).
  const v = VECTORS.find((x) => x.id === id);
  // Its input, or nothing.
  return (v?.input ?? {}) as Record<string, unknown>;
}

/** Turn note parameters into strings for the sentences. */
function strParams(p?: Record<string, string | number | boolean>): Record<string, string> {
  // Every value as text.
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)]));
}

/** The page component. */
export default function F5BigipIndexBaseFinderTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-bigip-index-base-finder");
  // Code inside a sentence.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // Which mode.
  const [mode, setMode] = useState<"lookup" | "translate">("lookup");
  // Look-up: the search words.
  const [query, setQuery] = useState("");
  // Look-up: the base filter.
  const [base, setBase] = useState<Base | "all">("all");
  // Look-up: the area filter.
  const [area, setArea] = useState<Area | "all">("all");
  // Translator: the question and its inputs, starting from the example vector.
  const ex = vectorInput(EXAMPLE_TRANSLATE);
  // The question.
  const [question, setQuestion] = useState<Question>(ex.question as Question);
  // The value.
  const [value, setValue] = useState(String(ex.value ?? ""));
  // N, as typed.
  const [n, setN] = useState(String(ex.n ?? "1"));
  // The separator (field questions).
  const [separator, setSeparator] = useState(".");
  // The text to find (search questions).
  const [needle, setNeedle] = useState("x");
  // The preset loaded, if any.
  const [active, setActive] = useState<string | undefined>("lookup-all");

  // The look-up result, recomputed as the filters change.
  const found = useMemo(() => {
    // Bounded input errors become a message.
    try { return { r: lookup({ query, base, area }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [query, base, area]);
  // The translation, recomputed as the inputs change.
  const tr = useMemo((): { r?: TranslateResult; error?: string } => {
    // Bounded input errors become a message.
    try { return { r: translate({ question, value, n: Number(n), separator, needle }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [question, value, n, separator, needle]);

  // Load a vector (either mode).
  const pick = (id: string) => {
    // Its input.
    const v = vectorInput(id);
    // A look-up vector sets the filters.
    if (v.mode === "lookup") {
      // Mode and filters.
      setMode("lookup"); setQuery(String(v.query ?? "")); setBase((v.base as Base | undefined) ?? "all"); setArea((v.area as Area | undefined) ?? "all");
    } else {
      // Mode and inputs.
      setMode("translate"); setQuestion(v.question as Question); setValue(String(v.value ?? "")); setN(String(v.n ?? "1"));
      // The optional inputs keep their last values when the vector has none.
      if (v.separator !== undefined) setSeparator(String(v.separator));
      // The text to find.
      if (v.needle !== undefined) setNeedle(String(v.needle));
    }
    // Mark it.
    setActive(id);
  };
  // Clear the current mode.
  const clear = () => {
    // Look-up: no words, no filters.
    if (mode === "lookup") { setQuery(""); setBase("all"); setArea("all"); setActive("lookup-all"); }
    // Translator: an empty value and N back to 1.
    else { setValue(""); setN("1"); setActive(undefined); }
  };

  // Entries grouped by area, in the catalogue's area order.
  const groups = useMemo(() => {
    // The matches.
    const list = found.r?.entries ?? [];
    // One group per area that has matches.
    return AREAS.map((a) => ({ area: a, entries: list.filter((e) => e.area === a) })).filter((g) => g.entries.length > 0);
  }, [found]);

  // The presets of the current mode.
  const presets = VECTORS.filter((v) => (v.input as { mode: string }).mode === mode).map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }));

  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* Mode, Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <TclSeg label={t("modeLabel")} value={mode} onChange={(m) => { setMode(m); setActive(undefined); }} options={[{ value: "lookup", label: t("modeLookup") }, { value: "translate", label: t("modeTranslate") }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(mode === "lookup" ? EXAMPLE_LOOKUP : EXAMPLE_TRANSLATE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={clear}>{t("clear")}</button>
        </div>
      </div>

      {mode === "lookup" ? (
        <>
          <p className="hmac-build-note">{t("lookupIntro")}</p>

          {/* Rules of thumb. */}
          <section className="jwt-panel idx-thumbs">
            <h4 className="jwt-panel-title">{t("thumbsTitle")}</h4>
            <ol className="idx-thumb-list">
              {["1", "2", "3", "4", "5", "6"].map((k) => <li key={k}>{t.rich(`thumb.${k}`, rich)}</li>)}
            </ol>
          </section>

          {/* Filters. */}
          <div className="tcl-fields">
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("searchLabel")}</span>
              <input id="idx-search" className="cidr-input" type="search" value={query} maxLength={200} placeholder={t("searchPlaceholder")} onChange={(e) => { setQuery(e.target.value); setActive(undefined); }} spellCheck={false} />
            </label>
            <label className="tcl-inline-field idx-area-field">
              <span className="cidr-label">{t("areaFilterLabel")}</span>
              <select id="idx-area" className="cidr-input tcl-select" value={area} onChange={(e) => { setArea(e.target.value as Area | "all"); setActive(undefined); }}>
                <option value="all">{t("allAreas")}</option>
                {AREAS.map((a) => <option key={a} value={a}>{t(`area.${a}`)}</option>)}
              </select>
            </label>
          </div>
          <div className="idx-bases" role="group" aria-label={t("baseFilterLabel")}>
            <span className="tcl-presets-label">{t("baseFilterLabel")}</span>
            <div className="tcl-presets-row">
              <button type="button" className="tcl-chip" aria-pressed={base === "all"} onClick={() => { setBase("all"); setActive(undefined); }}>{t("allBases")}</button>
              {BASES.map((b) => (
                <button key={b} type="button" className="tcl-chip" aria-pressed={base === b} title={t(`baseHelp.${b}`)} onClick={() => { setBase(b); setActive(undefined); }}>
                  <span className={`idx-badge idx-badge-${b}`} aria-hidden="true">{BADGE[b]}</span> {t(`base.${b}`)}
                </button>
              ))}
            </div>
          </div>
          <TclPresets items={presets} label={t("presetsLabel")} onPick={pick} active={active} />

          {/* An oversized search. */}
          {found.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{found.error}</p>}

          {/* The matches, by area. */}
          {found.r && (
            <div className="idx-results" aria-live="polite">
              <p className="tcl-muted idx-showing">{t("showing", { shown: found.r.entries.length, total: found.r.total })}</p>
              {found.r.entries.length === 0 && <p className="tcl-note">{t("noResults")}</p>}
              {groups.map((g) => (
                <section key={g.area} className="idx-group">
                  <h4 className="jwt-panel-title">{t(`area.${g.area}`)} <span className="tcl-muted">({g.entries.length})</span></h4>
                  <div className="idx-cards">
                    {g.entries.map((e) => entryCard(e))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="hmac-build-note">{t("translateIntro")}</p>

          {/* The question and its inputs. */}
          <div className="tcl-fields">
            <label className="tcl-inline-field">
              <span className="cidr-label">{t("questionLabel")}</span>
              <select id="idx-question" className="cidr-input tcl-select" value={question} onChange={(e) => { setQuestion(e.target.value as Question); setActive(undefined); }}>
                {QUESTIONS.map((q) => <option key={q} value={q}>{t(`question.${q}`)}</option>)}
              </select>
            </label>
            {question !== "search" && (
              <label className="tcl-inline-field idx-n-field">
                <span className="cidr-label">{t("nLabel")}</span>
                <input id="idx-n" className="cidr-input mono" type="number" min={1} max={1000} step={1} value={n} onChange={(e) => { setN(e.target.value); setActive(undefined); }} />
              </label>
            )}
            {question === "field" && (
              <label className="tcl-inline-field idx-n-field">
                <span className="cidr-label">{t("separatorLabel")}</span>
                <input id="idx-sep" className="cidr-input mono" value={separator} maxLength={20} onChange={(e) => { setSeparator(e.target.value); setActive(undefined); }} spellCheck={false} />
              </label>
            )}
            {question === "search" && (
              <label className="tcl-inline-field idx-n-field">
                <span className="cidr-label">{t("needleLabel")}</span>
                <input id="idx-needle" className="cidr-input mono" value={needle} maxLength={200} onChange={(e) => { setNeedle(e.target.value); setActive(undefined); }} spellCheck={false} />
              </label>
            )}
          </div>
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("valueLabel")}</span>
            <input id="idx-value" className="cidr-input mono" value={value} maxLength={2000} onChange={(e) => { setValue(e.target.value); setActive(undefined); }} spellCheck={false} />
          </label>
          <TclPresets items={presets} label={t("presetsLabel")} onPick={pick} active={active} />

          {/* An input the engine refused. */}
          {tr.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{tr.error}</p>}

          {/* The answer, the notes and every way of asking. */}
          {tr.r && (
            <div className="jwt-results" aria-live="polite">
              <div className={tr.r.answer === null ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
                <p><span className="tcl-verdict-label">{t("answerLabel")}</span> {tr.r.answer === null ? t("answerNone") : <code className="tcl-pill tcl-pill-value">{tr.r.answer === "" ? t("emptyResult") : tr.r.answer}</code>}</p>
              </div>
              {tr.r.notes.length > 0 && (
                <ul className="tcl-notes">
                  {tr.r.notes.map((nt, i) => <li key={i} className="tcl-note">{t.rich(`tnote.${nt.code}`, { ...rich, ...strParams(nt.params) })}</li>)}
                </ul>
              )}
              <div className="tcl-table-wrap">
                <table className="tcl-table idx-rows">
                  <thead>
                    <tr><th scope="col">{t("colCommand")}</th><th scope="col">{t("colCounts")}</th><th scope="col">{t("colResult")}</th><th scope="col">{t("colCheck")}</th></tr>
                  </thead>
                  <tbody>
                    {tr.r.rows.map((r, i) => (
                      <tr key={i} className={`idx-row-${r.kind}`}>
                        <td>
                          <span className="idx-form">{t(`form.${r.form}`)}</span>
                          <code className="idx-code">{r.code}</code>
                          <span className={`idx-kind idx-kind-${r.kind}`}>{t(`kind.${r.kind}`)}</span>
                          {r.notes.map((nt, k) => <span key={k} className="idx-row-note tcl-tone-warn">{t("undocumentedLabel")} {t.rich(`undocumented.${nt.code.slice(13)}`, { ...rich, ...strParams(nt.params) })}</span>)}
                        </td>
                        <td><span className={`idx-badge idx-badge-${r.base}`} aria-hidden="true">{BADGE[r.base]}</span> {t(`base.${r.base}`)}</td>
                        <td>{r.error ? <span className="tcl-tone-bad">{t("errorWord")}: {r.result}</span> : <code>{r.result === "" ? t("emptyResult") : r.result}</code>}</td>
                        <td>{r.agrees ? <span className="tcl-tone-ok">✓ {t("agrees")}</span> : <span className={r.kind === "other" ? "tcl-muted" : "tcl-tone-bad"}>✗ {t("differs")}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  /** One catalogue entry as a card (a render helper, not a component, so cards are not remounted). */
  function entryCard(e: Entry) {
    // Draw.
    return (
      <article key={e.id} className={`idx-card idx-card-${e.base}`} id={`idx-${e.id}`}>
        {/* The subject and its base. */}
        <header className="idx-card-head">
          <code className="idx-subject">{e.subject}</code>
          <span className={`idx-badge idx-badge-${e.base}`} title={t(`baseHelp.${e.base}`)}>{BADGE[e.base]} <span className="idx-badge-text">{t(`base.${e.base}`)}</span></span>
        </header>
        {/* The rule. */}
        <p className="idx-rule">{t.rich(`entry.${e.id}.rule`, rich)}</p>
        {/* What is counted, the first, the last, and what comes back when nothing is there. */}
        <dl className="idx-facts">
          <div><dt>{t("counts")}</dt><dd>{t(`entry.${e.id}.counts`)}</dd></div>
          {e.first !== undefined && <div><dt>{t("first")}</dt><dd><code>{e.first}</code></dd></div>}
          {e.last !== undefined && <div><dt>{t("last")}</dt><dd><code>{e.last}</code></dd></div>}
          {e.missing !== undefined && <div><dt>{t("missing")}</dt><dd><code>{e.missing}</code></dd></div>}
        </dl>
        {/* The example. */}
        <p className="idx-example">
          <span className="tcl-muted">{t("exampleLabel")}</span> <code>{e.example.code}</code> <span className="tcl-muted">{t("returns")}</span>{" "}
          {e.example.resultKey ? <span>{t(`entry.${e.id}.result`)}</span> : <code>{e.example.result === "" ? t("emptyResult") : e.example.result}</code>}
        </p>
        {/* The trap and the disagreement, when there are any. */}
        {e.trap && <p className="idx-trap"><span className="idx-flag">{t("trapLabel")}</span> {t.rich(`entry.${e.id}.trap`, rich)}</p>}
        {e.conflict && <p className="idx-conflict"><span className="idx-flag">{t("conflictLabel")}</span> {t.rich(`entry.${e.id}.conflict`, rich)}</p>}
        {/* How sure, and the sources with their dates. */}
        <footer className="idx-card-foot">
          <span className={`idx-confidence idx-confidence-${e.confidence}`}>{t("confidenceLabel")}: {t(`confidence.${e.confidence}`)}</span>
          <ul className="idx-sources" aria-label={t("sourcesLabel")}>
            {e.sources.map((id) => {
              // The source record.
              const s = sourceOf(id);
              // Every id is checked by the vectors; skip defensively if one is missing.
              return s ? <li key={id}><a href={s.url} rel="noopener noreferrer" target="_blank">{s.label}</a> <span className="tcl-muted">({t("readOn", { date: s.access_date })})</span></li> : null;
            })}
          </ul>
        </footer>
      </article>
    );
  }
}
