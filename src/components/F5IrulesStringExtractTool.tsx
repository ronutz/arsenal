"use client";

// ============================================================================
// src/components/F5IrulesStringExtractTool.tsx
// ----------------------------------------------------------------------------
// findstr, substr AND getfield, SHOWN ON THE STRING (page UI). Pick one of the
// three string-cutting commands F5 adds to iRules, fill in its arguments, and
// see the match, the skipped characters, the terminator and the result marked
// on a ruler, next to the plain Tcl that does the same job (run in the same
// engine, so the page shows whether the two really agree). Cases F5's pages
// do not cover are flagged with the assumption the tool made.
//
// All answers come from src/lib/tools/f5-irules-string-extract; this
// component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type ExtractCommand, type StringExtractResult } from "@/lib/tools/f5-irules-string-extract";
import { TclPresets, TclRuler, TclSeg } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "findstr-query";

// Each command's argument fields after the string (optional ones may be left empty).
const ARGS: Record<ExtractCommand, { key: string; optional?: boolean }[]> = {
  findstr: [{ key: "search" }, { key: "skip", optional: true }, { key: "terminator", optional: true }],
  substr: [{ key: "skip" }, { key: "terminator", optional: true }],
  getfield: [{ key: "separator" }, { key: "field" }],
};

/** Turn note parameters into strings for the sentences. */
function strParams(p?: Record<string, string | number | boolean>): Record<string, string> {
  // Every value as text.
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, String(v)]));
}

/** The page component. */
export default function F5IrulesStringExtractTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-string-extract");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The command.
  const [command, setCommand] = useState<ExtractCommand>(ex.command);
  // The string.
  const [string, setString] = useState(ex.string);
  // The arguments after the string.
  const [args, setArgs] = useState<string[]>(ex.args);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The arguments with trailing empty optional ones left out (a skip is needed before a terminator).
  const sent = useMemo(() => {
    // One value per field.
    const v = ARGS[command].map((_, i) => args[i] ?? "");
    // Drop empty optional fields from the end.
    while (v.length && ARGS[command][v.length - 1].optional && v[v.length - 1] === "") v.pop();
    // Done.
    return v;
  }, [command, args]);
  // The result, recomputed as the inputs change.
  const out = useMemo((): { r?: StringExtractResult; error?: string } => {
    // The engine refuses oversized input with a message.
    try { return { r: run({ command, string, args: sent }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [command, string, sent]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setCommand(v.input.command); setString(v.input.string); setArgs(v.input.args);
    // Mark it.
    setActive(id);
  };
  // Change one argument.
  const setArg = (i: number, s: string) => { const next = [...args]; next[i] = s; setArgs(next); setActive(undefined); };
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // A note's sentence (undocumented cases have their own wording).
  const noteText = (code: string, params?: Record<string, string | number | boolean>) => (code.startsWith("undocumented-") ? t.rich(`undocumented.${code.slice(13)}`, { ...rich, ...strParams(params) }) : t.rich(`note.${code}`, { ...rich, ...strParams(params) }));
  // The result, when there is one.
  const r = out.r;
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The command, Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <TclSeg label={t("commandLabel")} value={command} onChange={(c) => { setCommand(c); setArgs(ARGS[c].map((_, i) => args[i] ?? "")); setActive(undefined); }} options={[{ value: "findstr", label: "findstr" }, { value: "substr", label: "substr" }, { value: "getfield", label: "getfield" }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setString(""); setArgs(ARGS[command].map(() => "")); setActive(undefined); }}>{t("clear")}</button>
        </div>
      </div>
      {/* The command's syntax and rule, in one line. */}
      <p className="hmac-build-note">{t.rich(`syntax.${command}`, rich)}</p>

      {/* The string. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="sx-string">{t("stringLabel")}</label>
        <input id="sx-string" className="cidr-input mono" value={string} onChange={(e) => { setString(e.target.value); setActive(undefined); }} spellCheck={false} autoComplete="off" />
      </div>
      {/* The arguments. */}
      <div className="tcl-fields">
        {ARGS[command].map((f, i) => (
          <label key={`${command}-${f.key}`} className="tcl-inline-field">
            <span className="cidr-label">{t(`field.${f.key}`)}{f.optional ? ` ${t("optional")}` : ""}</span>
            <input id={`sx-${f.key}`} className="cidr-input mono" value={args[i] ?? ""} onChange={(e) => setArg(i, e.target.value)} spellCheck={false} autoComplete="off" />
          </label>
        ))}
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

          {/* What it returned, or the error. */}
          {r.ok ? (
            <p className="tcl-verdict tcl-verdict-ok"><span className="tcl-verdict-label">{t("resultLabel")}</span> <code className="tcl-big">{r.result === "" ? "∅" : r.result}</code></p>
          ) : (
            <p className="tcl-verdict tcl-verdict-bad"><span className="tcl-verdict-label">{t("errorLabel")}</span> {r.error}</p>
          )}

          {/* The string with the regions marked. */}
          {r.ok && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("rulerTitle")}</h4>
              <TclRuler text={string} spans={r.segments} roleLabel={(role) => t(`role.${role}`)} truncatedLabel={t("rulerTruncated")} />
            </section>
          )}

          {/* What happened, and anything F5 does not document. */}
          {r.notes.length > 0 && (
            <ul className="tcl-notes">
              {r.notes.map((n, i) => <li key={i} className={n.code.startsWith("undocumented-") ? "tcl-note tcl-note-flag" : "tcl-note"}>{n.code.startsWith("undocumented-") && <span className="tcl-flag-label">{t("undocumentedLabel")}</span>}{noteText(n.code, n.params)}</li>)}
            </ul>
          )}

          {/* The plain Tcl that does the same job. */}
          {r.equivalent && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("equivalentTitle")}</h4>
              <pre className="jwt-json">{r.equivalent.script}</pre>
              <p className={r.equivalent.agrees ? "tcl-outcome tcl-tone-ok" : "tcl-outcome tcl-tone-warn"}>
                {r.equivalent.error !== undefined ? r.equivalent.error : <code>{r.equivalent.result === "" ? "∅" : r.equivalent.result}</code>}{" "}
                <span className={r.equivalent.agrees ? "tcl-pill tcl-pill-true" : "tcl-pill tcl-pill-warn"}>{r.equivalent.agrees ? t("agrees") : t("differs")}</span>
              </p>
              <p className="hmac-build-note">{t(`equivalentNote.${command}`)}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
