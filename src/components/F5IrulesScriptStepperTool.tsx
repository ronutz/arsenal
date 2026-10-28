"use client";

// ============================================================================
// src/components/F5IrulesScriptStepperTool.tsx
// ----------------------------------------------------------------------------
// THE iRULES SCRIPT STEPPER (page UI). Run a short iRule snippet one command
// at a time and see each command three ways: as written, as the words it
// actually received after substitution, and what it returned, with every
// variable it changed, the branch if or switch took, the expressions it
// evaluated (as trees), the log lines, and the actions (pool, redirect, ...)
// recorded rather than performed.
//
// All answers come from src/lib/tools/f5-irules-script-stepper (the shared
// Tcl 8.4 engine); this component only lays them out and words them.
//
// Share results (2026-10-27): under how the run ended, a button builds a link
// that carries the script, the language and the sample request (src/lib/
// tools/f5-irules-script-stepper/share.ts), after the iRule secrets check: a
// key or credential written out blocks the link and the popover names where;
// a value whose name looks like a secret replaces the general caution line.
// An arriving link fills the fields and leaves the address, and the page
// holds the script unrun until the reader presses Run (or edits a field): the
// teaching interpreter never runs a link's text by itself.
// ============================================================================

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, DEFAULT_SAMPLE, type ScriptStepperResult } from "@/lib/tools/f5-irules-script-stepper";
import { TclPresets, TclSeg, TclTree, TclPairs } from "@/components/TclTeachParts";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findIruleSecretsIn, firstPlace } from "@/lib/tcl84/irule-secrets"; // the iRule secrets check
import { IRULES_SCRIPT_STEPPER_SHARE, encodeScriptStepper, scriptStepperFields } from "@/lib/tools/f5-irules-script-stepper/share"; // this tool's share spec: every field, after the secrets check

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "if-elseif";

/** Turn note parameters into the strings ICU selects on. */
function strParams(p?: Record<string, string | number | boolean>): Record<string, string> {
  // Every value as text (booleans become "true" / "false"); ICU select keys cannot
  // contain hyphens, so the "why" code (left-text, ...) is written with underscores.
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, k === "why" ? String(v).replace(/-/g, "_") : String(v)]));
}

/** The page component. */
export default function F5IrulesScriptStepperTool() {
  // This tool's words.
  const t = useTranslations("tools.f5-irules-script-stepper");
  // The example vector.
  const ex = VECTORS.find((v) => v.id === EXAMPLE_ID)!.input;
  // The script.
  const [script, setScript] = useState(ex.script);
  // Plain Tcl 8.4 or iRules.
  const [mode, setMode] = useState<"tcl" | "irules">(ex.mode);
  // The sample request's fields.
  const [uri, setUri] = useState(DEFAULT_SAMPLE.uri);
  // The Host header.
  const [host, setHost] = useState(DEFAULT_SAMPLE.host);
  // The method.
  const [method, setMethod] = useState(DEFAULT_SAMPLE.method);
  // The User-Agent header.
  const [agent, setAgent] = useState(DEFAULT_SAMPLE.headers["User-Agent"] ?? "");
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The fields as a shared link filled them, held unrun until the reader presses Run (null: nothing held).
  const [heldKey, setHeldKey] = useState<string | null>(null);
  // The sample request's panel is open (an arriving link that changed the sample opens it, so the reader sees it).
  const [sampleOpen, setSampleOpen] = useState(false);
  // The fields as they stand, as one comparable value.
  const fieldsKey = JSON.stringify([script, mode, uri, host, method, agent]);
  // Held while the fields are exactly what the link filled in: editing any of them runs as usual.
  const held = heldKey !== null && heldKey === fieldsKey;
  // The run, recomputed as the inputs change.
  const out = useMemo((): { r?: ScriptStepperResult; error?: string } => {
    // A shared link's script waits for Run.
    if (held) return {};
    // Nothing to run.
    if (script.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ script, mode, sample: { ...DEFAULT_SAMPLE, uri, host, method, headers: { ...DEFAULT_SAMPLE.headers, "User-Agent": agent } } }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [held, script, mode, uri, host, method, agent]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its fields.
    setScript(v.input.script); setMode(v.input.mode);
    // The default sample request.
    setUri(DEFAULT_SAMPLE.uri); setHost(DEFAULT_SAMPLE.host); setMethod(DEFAULT_SAMPLE.method); setAgent(DEFAULT_SAMPLE.headers["User-Agent"] ?? "");
    // Mark it.
    setActive(id);
  };
  // Inline code inside translated sentences.
  const rich = { c: (chunks: ReactNode) => <code>{chunks}</code> };
  // An event note's sentence.
  const stepNote = (code: string, params?: Record<string, string | number | boolean>) => (code.startsWith("undocumented-") ? t.rich(`undocumented.${code.slice(13)}`, { ...rich, ...strParams(params) }) : t.rich(`stepNote.${code}`, { ...rich, ...strParams(params) }));
  // An expression note's sentence.
  const exprNote = (code: string, params?: Record<string, string | number | boolean>) => t.rich(`exprNote.${code}`, { ...rich, ...strParams(params) });
  // The run, when there is one.
  const r = out.r;
  // An arriving share link (2026-10-27): the fields fill as typing would, held until Run.
  useShareArrival(IRULES_SCRIPT_STEPPER_SHARE, (s) => { setScript(s.input); setMode(s.mode); setUri(s.uri); setHost(s.host); setMethod(s.method); setAgent(s.agent); setActive(undefined); setHeldKey(JSON.stringify([s.input, s.mode, s.uri, s.host, s.method, s.agent])); if (s.mode === "irules" && (s.uri !== DEFAULT_SAMPLE.uri || s.host !== DEFAULT_SAMPLE.host || s.method !== DEFAULT_SAMPLE.method || s.agent !== (DEFAULT_SAMPLE.headers["User-Agent"] ?? ""))) setSampleOpen(true); }); // the link's fields, a changed sample shown
  // The iRule secrets check over every field the link would carry, once per change, while there is a run.
  const secrets = useMemo(() => (r ? findIruleSecretsIn(scriptStepperFields({ input: script, mode, uri, host, method, agent })) : null), [r, script, mode, uri, host, method, agent]); // or null
  // What Share results may carry: every field, unless one holds a key or credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeScriptStepper({ input: script, mode, uri, host, method, agent }, secrets.secrets) : NOTHING), [secrets, script, mode, uri, host, method, agent]); // the encoding
  // The first value whose name looks like a secret, for the caution line.
  const maybe = useMemo(() => (secrets ? firstPlace(secrets.maybe) : null), [secrets]); // or null
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* Mode, Example / Clear (D-83). */}
      <div className="tcl-toolbar">
        <TclSeg label={t("modeLabel")} value={mode} onChange={(m) => { setMode(m); setActive(undefined); }} options={[{ value: "tcl", label: t("modeTcl") }, { value: "irules", label: t("modeIrules") }]} />
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setScript(""); setActive(undefined); }}>{t("clear")}</button>
        </div>
      </div>
      <TclPresets items={VECTORS.map((v) => ({ id: v.id, label: t(`preset.${v.id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* The script. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="ss-script">{t("scriptLabel")}</label>
        <textarea id="ss-script" className="cidr-input mono json-input" rows={9} value={script} onChange={(e) => { setScript(e.target.value); setActive(undefined); }} placeholder={t("scriptPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>

      {/* The sample request, in iRules mode. */}
      {mode === "irules" && (
        <details className="tcl-details" open={sampleOpen} onToggle={(e) => setSampleOpen(e.currentTarget.open)}>
          <summary>{t("sampleTitle")}</summary>
          <div className="tcl-fields">
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleUri")}</span><input id="ss-uri" className="cidr-input mono" value={uri} onChange={(e) => setUri(e.target.value)} spellCheck={false} /></label>
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleHost")}</span><input id="ss-host" className="cidr-input mono" value={host} onChange={(e) => setHost(e.target.value)} spellCheck={false} /></label>
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleMethod")}</span><input id="ss-method" className="cidr-input mono" value={method} onChange={(e) => setMethod(e.target.value)} spellCheck={false} /></label>
            <label className="tcl-inline-field"><span className="cidr-label">{t("sampleAgent")}</span><input id="ss-agent" className="cidr-input mono" value={agent} onChange={(e) => setAgent(e.target.value)} spellCheck={false} /></label>
          </div>
          <p className="hmac-build-note">{t("sampleNote")}</p>
        </details>
      )}

      {/* A shared link's script, held until the reader asks (2026-10-27; ROLLOUT section 8: the teaching interpreters fill only). */}
      {held && (
        <div className="tcl-verdict tcl-verdict-warn" role="status">
          <p>{t("share.held")}</p>
          <div className="rdap-ask-row">
            <button type="button" className="hpf-btn" onClick={() => setHeldKey(null)}>{t("share.run")}</button>
          </div>
        </div>
      )}

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The run. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* How it ended. */}
          <p className={r.code === "error" ? "tcl-verdict tcl-verdict-bad" : "tcl-verdict tcl-verdict-ok"}>
            <span className="tcl-verdict-label">{t(`code.${r.code}`)}</span> {r.code === "error" ? r.result : <code className="tcl-big">{r.result === "" ? "∅" : r.result}</code>}
          </p>
          {/* Share results (2026-10-27): under how the run ended, the answer it shares, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { field: maybe.field, line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { field: String(share.values?.field ?? "input"), line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>

          {/* Every command, in the order it started. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("stepsTitle", { n: r.events.length })}</h4>
            <p className="hmac-build-note">{t("stepsNote")}</p>
            <ol className="tcl-steps">
              {r.events.map((e, i) => (
                <li key={i} className={e.error !== undefined ? "tcl-step tcl-step-error" : "tcl-step"} style={{ "--tcl-depth": e.depth } as CSSProperties}>
                  {/* The command as written, with its line. */}
                  <div className="tcl-step-head">
                    <span className="tcl-step-n">{i + 1}</span>
                    <span className="tcl-muted tcl-small">{t("lineLabel", { n: e.line })}</span>
                    <code className="tcl-step-src">{e.source.split("\n")[0]}{e.source.includes("\n") ? " …" : ""}</code>
                  </div>
                  {/* The words it received. */}
                  <div className="tcl-words" aria-label={t("wordsLabel")}>
                    <span className="tcl-muted tcl-small">{t("wordsLabel")}</span>
                    {e.words.map((w, k) => { const shown = w.replace(/\n[ \t]*/g, "\u21b5 "); return <code key={k} className="tcl-word">{w === "" ? "\u2205" : shown.length > 80 ? `${shown.slice(0, 80)}\u2026` : shown}</code>; })}
                  </div>
                  {/* What it returned, or its error. */}
                  <div className="tcl-step-out">
                    {e.error !== undefined ? <span className="tcl-pill tcl-pill-bad">{e.error}</span> : <><span className="tcl-muted tcl-small">{t("returned")}</span> <code className="tcl-pill tcl-pill-value">{e.result === "" ? "∅" : e.result}</code></>}
                  </div>
                  {/* Variables it changed. */}
                  {e.changes.length > 0 && (
                    <ul className="tcl-changes">
                      {e.changes.map((c, k) => <li key={k}><code>{c.name}</code>: {c.before === null ? <span className="tcl-muted">{t("unset")}</span> : <code>{c.before === "" ? "∅" : c.before}</code>} &#8594; {c.after === null ? <span className="tcl-muted">{t("unset")}</span> : <code>{c.after === "" ? "∅" : c.after}</code>}</li>)}
                    </ul>
                  )}
                  {/* Notes on what happened. */}
                  {e.notes.length > 0 && (
                    <ul className="tcl-node-notes">
                      {e.notes.map((n, k) => <li key={k} className={n.code.startsWith("undocumented-") ? "tcl-tone-warn" : undefined}>{stepNote(n.code, n.params)}</li>)}
                    </ul>
                  )}
                  {/* The expressions it evaluated. */}
                  {e.exprs.map((x, k) => (
                    <details key={k} className="tcl-details tcl-expr-details">
                      <summary>{t("exprSummary")} <code>{x.text.trim()}</code></summary>
                      <TclTree node={x.tree} noteText={exprNote} heldLabel={(h) => t(`held.${h}`)} skippedLabel={t("skipped")} platformText={(p) => t(`platform.${p}`)} />
                    </details>
                  ))}
                </li>
              ))}
            </ol>
          </section>

          {/* The variables at the end. */}
          {r.vars.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("varsTitle")}</h4>
              <TclPairs rows={r.vars.map((v) => ({ name: <code>{`$${v.name}`}</code>, value: v.value }))} emptyLabel={t("unset")} />
            </section>
          )}

          {/* Log lines and recorded actions. */}
          {(r.logs.length > 0 || r.actions.length > 0) && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("sideEffectsTitle")}</h4>
              <ul className="tcl-notes">
                {r.logs.map((l, i) => <li key={`l${i}`} className="tcl-note"><code>{`log ${l.facility}`}</code> {l.message}</li>)}
                {r.actions.map((a, i) => <li key={`a${i}`} className="tcl-note"><code>{[a.command, ...a.args].join(" ")}</code> <span className="tcl-muted">{t("recorded")}</span></li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
