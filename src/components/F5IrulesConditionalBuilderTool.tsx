"use client";

// ============================================================================
// src/components/F5IrulesConditionalBuilderTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES if / switch / class BUILDER (page UI). Describe one decision as
// ordered rules (compare a request value, choose a pool) and get it written
// three ways: an if / elseif chain, a switch, and a class match on data groups
// with their tmsh definitions. A test value runs through each generated rule
// in the teaching interpreter, so the page shows where the three disagree:
// if and switch take the FIRST matching rule, class match with starts_with or
// ends_with takes the LONGEST matching entry.
//
// All answers come from src/lib/tools/f5-irules-conditional-builder; this
// component only lays them out and words them.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type ConditionalBuilderResult, type Rule, type RuleOp, type Subject } from "@/lib/tools/f5-irules-conditional-builder";
import { TclCode, TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "longest-vs-first";

// The comparisons a rule can use.
const OPS: RuleOp[] = ["equals", "starts_with", "ends_with", "contains", "glob"];

// The request values a decision can be about.
const SUBJECTS: Subject[] = ["path", "uri", "host", "query", "header"];

/** Turn note parameters into strings for the sentences. */
function strParams(p?: Record<string, string | number | boolean>): Record<string, string> {
  // Every value as text.
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)]));
}

/** The page component. */
export default function F5IrulesConditionalBuilderTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-conditional-builder");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The request value.
  const [subject, setSubject] = useState<Subject>(ex.subject);
  // The header name, for a header subject.
  const [headerName, setHeaderName] = useState(ex.headerName ?? "User-Agent");
  // Lower-case the value before comparing.
  const [lowercase, setLowercase] = useState(ex.lowercase);
  // The rules, in order.
  const [rules, setRules] = useState<Rule[]>(ex.rules);
  // The pool when nothing matches.
  const [defaultPool, setDefaultPool] = useState(ex.defaultPool);
  // The value to test with.
  const [testValue, setTestValue] = useState(ex.testValue);
  // The data group name stem.
  const [dataGroup, setDataGroup] = useState(ex.dataGroup);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // Which generated block was copied last (shows "Copied" for a moment).
  const [copied, setCopied] = useState<string | null>(null);
  // Copy one generated block, exactly as generated, to the clipboard.
  const copy = useCallback(async (key: string, text: string) => {
    // The clipboard can be unavailable (an insecure page, a denied permission).
    try {
      // Write the text.
      await navigator.clipboard.writeText(text);
      // Confirm on the button, then return it to its label.
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* clipboard unavailable: the code stays selectable on the page */
    }
  }, []);
  // The generated forms, recomputed as the inputs change.
  const out = useMemo((): { r?: ConditionalBuilderResult; error?: string } => {
    // The engine refuses oversized input with a message.
    try { return { r: run({ subject, headerName, lowercase, rules, defaultPool, testValue, dataGroup }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [subject, headerName, lowercase, rules, defaultPool, testValue, dataGroup]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setSubject(v.input.subject); setHeaderName(v.input.headerName ?? "User-Agent"); setLowercase(v.input.lowercase); setRules(v.input.rules); setDefaultPool(v.input.defaultPool); setTestValue(v.input.testValue); setDataGroup(v.input.dataGroup);
    // Mark it.
    setActive(id);
  };
  // Replace one rule.
  const setRule = (i: number, patch: Partial<Rule>) => { setRules(rules.map((r, k) => (k === i ? { ...r, ...patch } : r))); setActive(undefined); };
  // Move a rule up or down.
  const move = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= rules.length) return; const next = [...rules]; [next[i], next[j]] = [next[j], next[i]]; setRules(next); setActive(undefined); };
  // The result, when there is one.
  const r = out.r;
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The subject and the Example / Clear buttons (D-83). */}
      <div className="tcl-toolbar">
        <div className="tcl-fields">
          <label className="tcl-inline-field">
            <span className="cidr-label">{t("subjectLabel")}</span>
            <select id="cb-subject" className="cidr-input mono tcl-select" value={subject} onChange={(e) => { setSubject(e.target.value as Subject); setActive(undefined); }}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s === "header" ? "HTTP::header value" : `HTTP::${s}`}</option>)}
            </select>
          </label>
          {subject === "header" && (
            <label className="tcl-inline-field"><span className="cidr-label">{t("headerLabel")}</span><input id="cb-header" className="cidr-input mono" value={headerName} onChange={(e) => { setHeaderName(e.target.value); setActive(undefined); }} spellCheck={false} /></label>
          )}
          <label className="tcl-check"><input id="cb-lower" type="checkbox" checked={lowercase} onChange={(e) => { setLowercase(e.target.checked); setActive(undefined); }} /> {t("lowercaseLabel")}</label>
        </div>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setRules([{ op: "equals", value: "", pool: "" }]); setTestValue(""); setActive(undefined); }}>{t("clear")}</button>
        </div>
      </div>

      {/* The rules, in order. */}
      <section className="jwt-panel">
        <h4 className="jwt-panel-title">{t("rulesTitle")}</h4>
        <ol className="tcl-rules">
          {rules.map((rule, i) => (
            <li key={i} className="tcl-rule-row">
              <span className="tcl-step-n">{i + 1}</span>
              {/* The comparison. */}
              <select aria-label={t("opLabel")} className="cidr-input mono tcl-select" value={rule.op} onChange={(e) => setRule(i, { op: e.target.value as RuleOp })}>
                {OPS.map((o) => <option key={o} value={o}>{t(`op.${o}`)}</option>)}
              </select>
              {/* The value. */}
              <input aria-label={t("valueLabel")} className="cidr-input mono" value={rule.value} onChange={(e) => setRule(i, { value: e.target.value })} placeholder={t("valuePlaceholder")} spellCheck={false} />
              {/* The pool. */}
              <input aria-label={t("poolLabel")} className="cidr-input mono" value={rule.pool} onChange={(e) => setRule(i, { pool: e.target.value })} placeholder={t("poolPlaceholder")} spellCheck={false} />
              {/* Order and removal. */}
              <span className="tcl-rule-actions">
                <button type="button" className="b64-copy" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("moveUp")}>&#8593;</button>
                <button type="button" className="b64-copy" onClick={() => move(i, 1)} disabled={i === rules.length - 1} aria-label={t("moveDown")}>&#8595;</button>
                <button type="button" className="b64-copy" onClick={() => { setRules(rules.filter((_, k) => k !== i)); setActive(undefined); }} disabled={rules.length === 1} aria-label={t("remove")}>&#215;</button>
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="b64-copy" onClick={() => { setRules([...rules, { op: "starts_with", value: "", pool: "" }]); setActive(undefined); }} disabled={rules.length >= 50}>{t("addRule")}</button>
        {/* The rest of the decision. */}
        <div className="tcl-fields tcl-fields-top">
          <label className="tcl-inline-field"><span className="cidr-label">{t("defaultLabel")}</span><input id="cb-default" className="cidr-input mono" value={defaultPool} onChange={(e) => { setDefaultPool(e.target.value); setActive(undefined); }} spellCheck={false} /></label>
          <label className="tcl-inline-field"><span className="cidr-label">{t("groupLabel")}</span><input id="cb-group" className="cidr-input mono" value={dataGroup} onChange={(e) => { setDataGroup(e.target.value); setActive(undefined); }} spellCheck={false} /></label>
          <label className="tcl-inline-field"><span className="cidr-label">{t("testLabel")}</span><input id="cb-test" className="cidr-input mono" value={testValue} onChange={(e) => { setTestValue(e.target.value); setActive(undefined); }} spellCheck={false} /></label>
        </div>
      </section>
      <TclPresets items={VECTORS.map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The generated forms. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* Do they agree on the test value? */}
          <div className={r.agree ? "tcl-verdict tcl-verdict-ok" : "tcl-verdict tcl-verdict-warn"}>
            <p><span className="tcl-verdict-label">{r.agree ? t("agreeTitle") : t("disagreeTitle")}</span> {t("testedWith")} <code>{testValue === "" ? "∅" : testValue}</code></p>
            <ul className="tcl-pool-list">
              {r.forms.filter((f) => !f.unavailable).map((f) => <li key={f.kind}><span className="tcl-muted">{t(`form.${f.kind}`)}</span> &#8594; {f.error ? <span className="tcl-pill tcl-pill-bad">{f.error}</span> : <code className="tcl-pill tcl-pill-value">{f.pool ?? t("noPool")}</code>}</li>)}
            </ul>
          </div>

          {/* Rules that can never be reached. */}
          {r.shadowed.length > 0 && (
            <ul className="tcl-notes">
              {r.shadowed.map((s) => <li key={s.rule} className="tcl-note tcl-note-flag">{t("shadowed", { rule: s.rule + 1, by: s.by + 1 })}</li>)}
            </ul>
          )}

          {/* Notes. */}
          {r.notes.length > 0 && (
            <ul className="tcl-notes">
              {r.notes.map((n, i) => <li key={i} className="tcl-note">{t(`note.${n.code}`, strParams(n.params))}</li>)}
            </ul>
          )}

          {/* Screen readers hear "Copied" here (each Copy button's accessible name stays fixed). */}
          <span className="sr-only" role="status" aria-live="polite">{copied ? t("copied") : ""}</span>

          {/* The three forms side by side (stacked on a narrow screen). */}
          <div className="tcl-forms">
            {r.forms.map((f) => (
              <section key={f.kind} className="tcl-form">
                {/* The form's name, with a Copy button when there is code to copy. */}
                <div className="tcl-form-head">
                  <h4 className="jwt-panel-title">{t(`form.${f.kind}`)}</h4>
                  {/* Copy this form's code, exactly as generated. */}
                  {!f.unavailable && <button type="button" className="b64-copy" onClick={() => copy(f.kind, f.code)} aria-label={t("copyLabel", { form: t(`form.${f.kind}`) })}>{copied === f.kind ? t("copied") : t("copy")}</button>}
                </div>
                {f.unavailable ? (
                  <p className="hmac-build-note">{t(`unavailable.${f.unavailable}`)}</p>
                ) : (
                  <>
                    <p className="tcl-form-pool">{t("chose")} <code className="tcl-pill tcl-pill-value">{f.pool ?? t("noPool")}</code></p>
                    <TclCode code={f.code} label={t(`form.${f.kind}`)} />
                    {f.tmsh && (
                      <details className="tcl-details">
                        <summary>{t("tmshTitle")}</summary>
                        <TclCode code={f.tmsh} label={t("tmshTitle")} />
                        <button type="button" className="b64-copy tcl-copy-below" onClick={() => copy(`${f.kind}-tmsh`, f.tmsh ?? "")}>{copied === `${f.kind}-tmsh` ? t("copied") : t("copyTmsh")}</button>
                      </details>
                    )}
                    <p className="hmac-build-note">{t(`formNote.${f.kind}`)}</p>
                  </>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
