"use client";

// ============================================================================
// src/components/F5IrulesStringWorkbenchTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES STRING WORKBENCH (page UI). Pick a Tcl 8.4 string subcommand,
// fill in its arguments, and see the result on a character ruler: what was
// searched, matched, returned, replaced or trimmed; how each index argument
// (0, end-1, 010, ...) was read; and, for string map, the single left-to-right
// pass that does the replacing.
//
// All answers come from src/lib/tools/f5-irules-string-workbench (the shared
// Tcl 8.4 engine); this component only lays them out and words them.
//
// Share results (2026-10-27): under the result, a button builds a link that
// carries the subcommand and its fields by name (src/lib/tools/
// f5-irules-string-workbench/share.ts, which also holds the field table below,
// so each field has its link name); an arriving link fills the form as typing
// would and leaves the address.
//
// Up and down arrows (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): string repeat's count has a decrease
// and an increase button beside it, and steps from Arrow Up / Down too, from 0
// up to the most repeats the engine allows for the string typed (it refuses a
// result over 100,000 characters). The index fields have none: 0, end-1 and
// 010 are read three different ways, which is the lesson, and an arrow would
// rewrite them as plain decimals.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type StringOp, type StringWorkbenchResult } from "@/lib/tools/f5-irules-string-workbench";
import { TclPresets, TclRuler } from "@/components/TclTeachParts";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { IRULES_STRING_WORKBENCH_SHARE, STRING_WORKBENCH_FIELDS, STRING_WORKBENCH_NOCASE } from "@/lib/tools/f5-irules-string-workbench/share"; // this tool's share spec: the form by name, and its field table
// Up and down arrows for string repeat's count (03/11/2026).
import { StepperField, stepperKeyDown } from "@/components/NumberStepper";

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "range-path";

// The argument fields of each subcommand, in Tcl's order (the table lives in share.ts since 2026-10-27, so each
// field's link name comes from the same place: a field added there is a field of the form and of the link).
const FIELDS = STRING_WORKBENCH_FIELDS; // the table

// The subcommands, in the order the menu lists them.
const OPS = Object.keys(FIELDS) as StringOp[];

// The subcommands that accept -nocase (the same list the share spec checks).
const NOCASE = STRING_WORKBENCH_NOCASE; // map, match, compare, equal

// The longest result string repeat may build (compute.ts refuses count x length above it: "too large for this page").
const REPEAT_RESULT_MAX = 100000;

/** Arguments for a subcommand with trailing empty optional fields left out. */
function argsFor(op: StringOp, values: string[]): string[] {
  // The fields.
  const f = FIELDS[op];
  // The values, one per field.
  const v = f.map((_, i) => values[i] ?? "");
  // Drop empty optional fields from the end.
  while (v.length && f[v.length - 1].optional && v[v.length - 1] === "") v.pop();
  // Done.
  return v;
}

/** The page component. */
export default function F5IrulesStringWorkbenchTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-string-workbench");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The subcommand.
  const [op, setOp] = useState<StringOp>(ex.op);
  // The argument values.
  const [values, setValues] = useState<string[]>(ex.args);
  // -nocase.
  const [nocase, setNocase] = useState(!!ex.nocase);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The result, recomputed as the inputs change.
  const out = useMemo((): { r?: StringWorkbenchResult; error?: string } => {
    // The engine refuses oversized input with a message.
    try { return { r: run({ op, args: argsFor(op, values), nocase: NOCASE.includes(op) && nocase }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [op, values, nocase]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setOp(v.input.op); setValues(v.input.args); setNocase(!!v.input.nocase);
    // Mark it.
    setActive(id);
  };
  // Change one argument.
  const setValue = (i: number, s: string) => { const next = [...values]; next[i] = s; setValues(next); setActive(undefined); };
  // The most repeats the engine accepts for the string as typed (no limit while the string is empty).
  const repeatMax = (values[0] ?? "").length > 0 ? Math.floor(REPEAT_RESULT_MAX / (values[0] ?? "").length) : undefined;
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // The result, when there is one.
  const r = out.r;
  // An arriving share link (2026-10-27): the subcommand and its fields fill as typing would.
  useShareArrival(IRULES_STRING_WORKBENCH_SHARE, (s) => { setOp(s.op); setValues(s.values); setNocase(s.nocase); setActive(undefined); }); // the link's form
  // What Share results may carry: the subcommand and its fields, while there is a result (memoised).
  const share = useMemo<ShareEncoding>(() => (r ? IRULES_STRING_WORKBENCH_SHARE.encode({ op, values, nocase }) : NOTHING), [r, op, values, nocase]); // the encoding
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The subcommand and the Example / Clear buttons (D-83). */}
      <div className="tcl-toolbar">
        <label className="tcl-inline-field">
          <span className="cidr-label">{t("opLabel")}</span>
          <select id="sw-op" className="cidr-input mono tcl-select" value={op} onChange={(e) => { const o = e.target.value as StringOp; setOp(o); setValues(FIELDS[o].map((_, i) => values[i] ?? "")); setActive(undefined); }}>
            {OPS.map((o) => <option key={o} value={o}>{`string ${o}`}</option>)}
          </select>
        </label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setValues(FIELDS[op].map(() => "")); setActive(undefined); }}>{t("clear")}</button>
        </div>
      </div>
      {/* What the subcommand does, in one line. */}
      <p className="hmac-build-note">{t.rich(`opHelp.${op}`, rich)}</p>

      {/* The argument fields. */}
      <div className="tcl-fields">
        {FIELDS[op].map((f, i) =>
          // string repeat's count: the label above (by id, so the arrows stay out of the field's name), arrows beside it.
          f.key === "count" ? (
            <div key={`${op}-${f.key}`} className="tcl-inline-field">
              {/* The field's name. */}
              <label className="cidr-label" htmlFor={`sw-${f.key}`}>{t(`field.${f.key}`)}{f.optional ? ` ${t("optional")}` : ""}</label>
              {/* Up and down arrows: one repeat a press, from 0 to what the engine allows for this string; set as typing would. */}
              <StepperField value={values[i] ?? ""} onValue={(v) => setValue(i, v)} min={0} max={repeatMax} integer label={t(`field.${f.key}`)} inputId={`sw-${f.key}`}>
                <input
                  id={`sw-${f.key}`}
                  className="cidr-input mono"
                  value={values[i] ?? ""}
                  onChange={(e) => setValue(i, e.target.value)}
                  // Arrow Up and Down (Page Up and Down: ten) step the count from the keyboard.
                  onKeyDown={stepperKeyDown({ value: values[i] ?? "", onValue: (v) => setValue(i, v), min: 0, max: repeatMax, integer: true })}
                  spellCheck={false}
                  autoComplete="off"
                />
              </StepperField>
            </div>
          ) : (
            // Every other field: the label wraps it, as before.
            <label key={`${op}-${f.key}`} className="tcl-inline-field">
              <span className="cidr-label">{t(`field.${f.key}`)}{f.optional ? ` ${t("optional")}` : ""}</span>
              <input id={`sw-${f.key}`} className="cidr-input mono" value={values[i] ?? ""} onChange={(e) => setValue(i, e.target.value)} spellCheck={false} autoComplete="off" />
            </label>
          ),
        )}
        {/* -nocase, where the subcommand takes it. */}
        {NOCASE.includes(op) && (
          <label className="tcl-check"><input id="sw-nocase" type="checkbox" checked={nocase} onChange={(e) => { setNocase(e.target.checked); setActive(undefined); }} /> <code>-nocase</code></label>
        )}
      </div>
      <TclPresets items={VECTORS.map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The result. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* The paste-ready command. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("commandTitle")}</h4>
            <pre className="jwt-json">{r.command}</pre>
          </section>

          {/* What it returned, or Tcl's error. */}
          {r.ok ? (
            <p className="tcl-verdict tcl-verdict-ok"><span className="tcl-verdict-label">{t("resultLabel")}</span> <code className="tcl-big">{r.result === "" ? "∅" : r.result}</code></p>
          ) : (
            <p className="tcl-verdict tcl-verdict-bad"><span className="tcl-verdict-label">{t("errorLabel")}</span> {r.error}</p>
          )}
          {/* Share results (2026-10-27): under the result it shares, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          {/* The string, character by character. */}
          {r.ok && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("rulerTitle")}</h4>
              <TclRuler text={r.subject} spans={r.spans} roleLabel={(role) => t(`role.${role}`)} caption={t("rulerCaption", { count: r.chars.length })} truncatedLabel={t("rulerTruncated")} />
            </section>
          )}

          {/* How index arguments were read. */}
          {r.readings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("readingsTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead><tr><th scope="col">{t("readingArg")}</th><th scope="col">{t("readingText")}</th><th scope="col">{t("readingValue")}</th><th scope="col">{t("readingHow")}</th></tr></thead>
                  <tbody>
                    {r.readings.map((x) => (
                      <tr key={x.label}>
                        <th scope="row">{t(`field.${x.label}`)}</th>
                        <td><code>{x.text}</code></td>
                        <td><code>{x.value}</code>{x.clamped !== undefined && x.clamped !== x.value ? <span className="tcl-muted"> {t("clampedTo", { value: x.clamped })}</span> : null}</td>
                        <td className="tcl-muted">{x.form === "end" ? t("readEnd", { offset: x.offset ?? 0 }) : t("readInt", { base: String(x.base === 8 && x.value === 0 ? 10 : x.base ?? 10) })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* string map: the one pass, step by step. */}
          {r.mapSteps && r.mapSteps.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("mapTitle")}</h4>
              <ol className="tcl-map">
                {r.mapSteps.map((s, i) => (
                  <li key={i} className={s.action === "replace" ? "tcl-map-step tcl-map-replace" : "tcl-map-step"}>
                    <span className="tcl-map-at">{s.at}</span>
                    {s.action === "replace" ? (
                      <span>{t("mapReplace")} <code>{s.text}</code> &#8594; <code>{s.value === "" ? "∅" : s.value}</code> <span className="tcl-muted">{t("mapPair", { n: (s.pair ?? 0) + 1 })}</span></span>
                    ) : (
                      <span>{t("mapKeep")} <code>{s.text}</code></span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Notes. */}
          {r.notes.length > 0 && (
            <ul className="tcl-notes">
              {r.notes.map((n) => <li key={n} className="tcl-note">{t.rich(`note.${n}`, rich)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
