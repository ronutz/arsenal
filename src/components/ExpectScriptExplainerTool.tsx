"use client";

// ============================================================================
// src/components/ExpectScriptExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE EXPECT SCRIPT EXPLAINER (page UI). Paste an Expect script and read what
// it would do: a summary (does Tcl read it, what it spawns, the timeout at the
// first expect, whether it hands over to the user or waits for eof), the
// dialogue it conducts (what it waits for, what it then types), every command
// explained in plain words with its nesting, the script with flagged lines
// marked, and the findings against rules E1 to E18, each naming its rule and
// its line.
//
// All answers come from src/lib/tools/expect-script-explainer (the script is
// parsed, never run); this component only lays them out and words them.
// ============================================================================

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { run, VECTORS, type ExpectResult, type Explained, type ExpectPattern } from "@/lib/tools/expect-script-explainer";
import { TclCode, TclPresets } from "@/components/TclTeachParts";

// D-83: the Example button loads a golden vector verbatim.
const EXAMPLE_ID = "telnet-hardcoded";

// The vectors offered as presets (the rest stay vectors only, so the row stays readable).
const PRESET_IDS = ["telnet-hardcoded", "clean", "ssh-show-version", "infinite-timeout", "broad-pattern", "send-no-return", "exp-continue", "unbraced-regex", "timeout-after-expect", "stty-echo", "braced-return", "proc-and-switch", "syntax-error"];

/** The page component. */
export default function ExpectScriptExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.expect-script-explainer");
  // Rich-text tags the sentences use.
  const rich = { code: (chunks: ReactNode) => <code>{chunks}</code> };
  // The script.
  const [script, setScript] = useState(VECTORS.find((v) => v.id === EXAMPLE_ID)!.input.script);
  // The preset currently loaded.
  const [active, setActive] = useState<string | undefined>(EXAMPLE_ID);
  // The reading, recomputed as the script changes.
  const out = useMemo((): { r?: ExpectResult; error?: string } => {
    // Nothing to read.
    if (script.trim() === "") return {};
    // The engine refuses oversized input with a message.
    try { return { r: run({ script }) }; } catch (e) { return { error: (e as Error).message }; }
  }, [script]);
  // Load a preset.
  const pick = (id: string) => {
    // The vector.
    const v = VECTORS.find((x) => x.id === id);
    // Unknown ids do nothing.
    if (!v) return;
    // Its script.
    setScript(v.input.script);
    // Mark it.
    setActive(id);
  };
  // The result, when there is one.
  const r = out.r;
  // The worst severity per line, for the code view.
  const marks = useMemo(() => {
    // Line to severity.
    const m = new Map<number, string>();
    // Severity order.
    const rank: Record<string, number> = { error: 3, warning: 2, info: 1 };
    // Each finding keeps the worst one.
    for (const f of r?.findings ?? []) if (!m.has(f.line) || rank[f.severity] > rank[m.get(f.line)!]) m.set(f.line, f.severity);
    // Done.
    return m;
  }, [r]);
  // A finding's sentence, by rule and its parameters.
  const message = (rule: string, params?: Record<string, string | number>) => {
    // Parameters as they came: numbers stay numbers (plural forms need them), the rest is text.
    const p = Object.fromEntries(Object.entries(params ?? {}).map(([k, v]) => [k, typeof v === "number" ? v : String(v)]));
    // Each rule's sentences are keyed by variant ("main" when the rule has one).
    return t(`finding.${rule}.${typeof p.what === "string" ? p.what : "main"}`, p);
  };
  // The sentence for one explained command.
  const explain = (e: Explained): ReactNode => {
    // By kind.
    switch (e.kind) {
      case "shebang": return t.rich("explain.shebang", { ...rich, interpreter: e.interpreter });
      case "spawn": return t.rich("explain.spawn", { ...rich, program: e.program, args: e.args, hasArgs: e.args ? "yes" : "no", noecho: e.noecho ? "yes" : "no" });
      case "expect": return t.rich("explain.expect", { ...rich, variant: e.variant, n: e.patterns.length, timeout: e.timeout === null ? "none" : String(e.timeout) });
      case "send": return t.rich("explain.send", { ...rich, text: e.text, target: e.target, ending: e.endsWithCR ? "cr" : e.endsWithLF ? "lf" : "none", pace: e.slow ? "slow" : e.human ? "human" : "plain" });
      case "set-timeout": return t.rich("explain.setTimeout", { ...rich, how: e.infinite ? "infinite" : e.numeric ? "seconds" : "other", value: e.value });
      case "set": return t.rich("explain.set", { ...rich, name: e.name, value: e.value, argv: e.fromArgv === null ? "no" : "yes", index: e.fromArgv ?? 0 });
      case "global": return t.rich("explain.global", { ...rich, names: e.names });
      case "interact": return t("explain.interact");
      case "exp_continue": return t("explain.expContinue");
      case "log_user": return t("explain.logUser", { on: e.on ? "yes" : "no" });
      case "log_file": return t.rich("explain.logFile", { ...rich, args: e.args, hasArgs: e.args ? "yes" : "no" });
      case "close": return t("explain.close");
      case "wait": return t("explain.wait");
      case "exit": return t("explain.exit", { code: e.code || "none" });
      case "sleep": return t("explain.sleep", { seconds: e.seconds });
      case "stty": return t.rich("explain.stty", { ...rich, mode: e.echoOff ? "off" : e.echoOn ? "on" : "other", args: e.args });
      case "proc": return t.rich("explain.proc", { ...rich, name: e.name, params: e.params, hasParams: e.params ? "yes" : "no" });
      case "control": return t("explain.control", { name: e.name });
      case "puts": return t.rich("explain.puts", { ...rich, text: e.text });
      case "match_max": return t("explain.matchMax", { value: e.value });
      case "exp_internal": return t("explain.expInternal", { on: e.on ? "yes" : "no" });
      case "catch": return t("explain.catch");
      default: return t.rich("explain.other", { ...rich, name: e.name, argc: e.argc });
    }
  };
  // One pattern as a chip row: its flags, its text or keyword.
  const patternChips = (p: ExpectPattern, i: number) => (
    <li key={i}>
      {/* A keyword pattern, with what it stands for. */}
      {p.special ? (
        <><span className="tcl-pill tcl-pill-value">{p.special}</span> <span className="tcl-muted tcl-small">{t(`pattern.special.${p.special}`)}</span></>
      ) : (
        <>
          {/* The matching style when it is not the default glob. */}
          {p.flag !== "glob" && <span className="tcl-pill">{t(`pattern.flag.${p.flag}`)}</span>}
          {/* Case folding. */}
          {p.nocase && <span className="tcl-pill tcl-pill-muted">{t("pattern.nocase")}</span>}
          {/* The pattern as written. */}
          <code>{p.pattern}</code>
        </>
      )}
    </li>
  );
  // Draw.
  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The script, with the Example / Clear buttons (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="exp-src">{t("scriptLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => pick(EXAMPLE_ID)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => { setScript(""); setActive(undefined); }}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="exp-src" className="cidr-input mono json-input" rows={12} value={script} onChange={(e) => { setScript(e.target.value); setActive(undefined); }} placeholder={t("scriptPlaceholder")} spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off" />
      </div>
      <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`preset.${id}`) }))} label={t("presetsLabel")} onPick={pick} active={active} />

      {/* An oversized input. */}
      {out.error && <p className="tcl-verdict tcl-verdict-bad" role="status">{out.error}</p>}

      {/* The reading. */}
      {r && (
        <div className="jwt-results" aria-live="polite">
          {/* Summary: does Tcl read it, how many findings of each kind, the facts of the script. */}
          <div className={r.syntaxError || r.counts.error > 0 ? "tcl-verdict tcl-verdict-bad" : r.counts.warning > 0 ? "tcl-verdict tcl-verdict-warn" : "tcl-verdict tcl-verdict-ok"}>
            <p><span className="tcl-verdict-label">{r.syntaxError ? t("syntaxBad") : t("syntaxOk")}</span> {r.findings.length === 0 ? t("clean") : t("counts", { error: r.counts.error, warning: r.counts.warning, info: r.counts.info })}</p>
            <p className="hmac-build-note">
              {t("facts", { lines: r.lines, commands: r.commandCount })}{" "}
              {r.spawned.length > 0 ? t("spawns", { programs: r.spawned.join(", ") }) : t("spawnsNone")}{" "}
              {r.spawned.length > 0 && t("timeoutAt", { t: r.timeoutAtFirstExpect })}{" "}
              {r.interactive ? t("handsOver") : r.waitsForEof ? t("waitsEof") : r.spawned.length > 0 ? t("endsNoEof") : ""}
            </p>
          </div>

          {/* The dialogue: what the script waits for and what it then types. */}
          {r.dialogue.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("dialogueTitle")}</h4>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr><th scope="col">{t("colStep")}</th><th scope="col">{t("colLine")}</th><th scope="col">{t("colWaits")}</th><th scope="col">{t("colSends")}</th></tr>
                  </thead>
                  <tbody>
                    {r.dialogue.map((d, i) => (
                      <tr key={i}>
                        <th scope="row">{i + 1}</th>
                        <td className="tcl-muted">{d.line}</td>
                        <td>{d.waitsFor.map((w, j) => <code key={j} className="tcl-word">{w}</code>)}</td>
                        <td>{d.thenSends === null ? <span className="tcl-muted tcl-small">{t("nothingSent")}</span> : <code>{d.thenSends}</code>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Command by command. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("stepsTitle")}</h4>
            <ol className="tcl-steps">
              {r.commands.map((c, i) => (
                <li key={i} className="tcl-step" style={{ "--tcl-depth": c.depth } as React.CSSProperties}>
                  <div className="tcl-step-head">
                    <span className="tcl-step-n" aria-label={t("lineShort", { n: c.line })}>{c.line}</span>
                    <code className="tcl-step-src">{c.text}</code>
                  </div>
                  <p className="tcl-finding-msg">{explain(c.explained)}</p>
                  {/* An expect's patterns, one per row. */}
                  {c.explained.kind === "expect" && c.explained.patterns.length > 0 && (
                    <ul className="tcl-pool-list">{c.explained.patterns.map(patternChips)}</ul>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* The script with flagged lines marked. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("codeTitle")}</h4>
            <TclCode code={script} marks={marks} label={t("codeTitle")} />
          </section>

          {/* The findings, by line. */}
          {r.findings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
              <ol className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={i} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>
                      <span className="tcl-rule">{f.rule === "syntax" ? t("ruleSyntax") : f.rule}</span>
                      <span className="tcl-muted tcl-small">{t("lineShort", { n: f.line })}</span>
                      <span className="tcl-finding-title">{t(`ruleName.${f.rule}`)}</span>
                    </div>
                    {f.snippet && <code className="tcl-finding-snippet">{f.snippet}</code>}
                    <p className="tcl-finding-msg">{message(f.rule, f.params)}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* What the explainer cannot judge. */}
          <p className="hmac-build-note">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
