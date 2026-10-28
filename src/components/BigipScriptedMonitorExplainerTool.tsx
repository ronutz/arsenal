"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/BigipScriptedMonitorExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE BIG-IP SCRIPTED MONITOR EXPLAINER (page UI, 2026-10-27). Two boxes: the
// script file a Scripted monitor reads (send and expect lines) and, optionally,
// a server transcript in the RFCs' "S:" / "C:" notation. Below them: a summary;
// the simulated check when a transcript is given (the verdict, then each step
// with the script line beside the server reply it was compared with, then the
// notes and the one assumption the simulator makes); every line of the script
// explained; and the findings against rules S1 to S16.
//
// All answers come from src/lib/tools/bigip-scripted-monitor-explainer (the
// script is read, never run; nothing connects anywhere); this component only
// lays them out and words them. Words: "tools.bigip-scripted-monitor-explainer".
// Styling reuses the Expect explainer's class vocabulary (tcl-*, jwt-*, cidr-*,
// irl-sev-*) and the shared input stack; no new CSS class.
//
// SHARE RESULTS (2026-10-27): a button at the end of the summary builds, only
// when pressed, a link carrying both boxes with every PASS and LOGIN password
// as the bullets this page shows (spec:
// src/lib/tools/bigip-scripted-monitor-explainer/share.ts); the popover adds
// that other credentials (an SMTP AUTH exchange) go as typed. A password
// written with escape sequences gets no link, and the popover says which
// line. An arriving link (useShareArrival) fills both boxes as a paste would;
// nothing connects or runs, and the address loses the values at once.
// ============================================================================

import { useMemo, useState } from "react"; // state and the memoised result
import { useTranslations } from "next-intl"; // this tool's messages
import {
  EXAMPLE,
  run,
  SCRIPT_MAX_CHARS,
  TRANSCRIPT_MAX_CHARS,
  type ScriptedMonitorResult,
  type ScriptLine,
  type SimStep,
} from "@/lib/tools/bigip-scripted-monitor-explainer"; // the engine and the Example
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { SCRIPTED_MONITOR_SHARE } from "@/lib/tools/bigip-scripted-monitor-explainer/share"; // this tool's share spec: both boxes, passwords as bullets

// The escape sequences F5 lists, as the findings quote them (a parameter, so no message has to spell backslashes).
const ESCAPE_LIST = "\\a \\b \\f \\n \\r \\t \\v \\\\ \\'";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

/** The page component. */
export default function BigipScriptedMonitorExplainerTool() {
  // This tool's words.
  const t = useTranslations("tools.bigip-scripted-monitor-explainer");
  // The script, empty until the reader types or presses Example.
  const [script, setScript] = useState("");
  // The transcript, optional.
  const [transcript, setTranscript] = useState("");

  // The reading, recomputed as either box changes; oversized input is refused with a worded message.
  const out = useMemo((): { r?: ScriptedMonitorResult; tooLong?: "script" | "transcript" } => {
    // Nothing to read yet.
    if (script.trim() === "") return {};
    // The script's bound, checked here so the refusal can be worded in the reader's language.
    if (script.length > SCRIPT_MAX_CHARS) return { tooLong: "script" };
    // The transcript's bound.
    if (transcript.length > TRANSCRIPT_MAX_CHARS) return { tooLong: "transcript" };
    // The engine (it never throws inside the bounds).
    return { r: run({ script, transcript }) };
  }, [script, transcript]);
  // The result, when there is one.
  const r = out.r;
  // An arriving share link: both boxes fill as a paste would (an absent transcript is an empty one).
  useShareArrival(SCRIPTED_MONITOR_SHARE, (state) => {
    // The script.
    setScript(state.script);
    // The transcript.
    setTranscript(state.transcript);
  });
  // What Share results may carry: both boxes with every password as bullets, only while there is a reading.
  const share = useMemo<ShareEncoding>(() => (r ? SCRIPTED_MONITOR_SHARE.encode({ script, transcript }) : NOTHING), [r, script, transcript]); // memoised

  /** The explanation of one line, in sentences. */
  const meaning = (l: ScriptLine): string => {
    // The sentences, joined at the end.
    const parts: string[] = [];
    // What the line is.
    if (l.kind === "blank") parts.push(t("kindBlank"));
    // A first word F5 does not document.
    else if (l.kind === "unknown") parts.push(t("kindUnknown", { keyword: l.keyword }));
    // A send whose text is settled: what it sends and how it ends.
    else if (l.kind === "send" && l.decoded !== null) {
      // The text and its length.
      parts.push(t("kindSend", { text: l.decoded, length: l.length ?? 0 }));
      // The ending.
      if (l.ending !== null) parts.push(t(`ending.${l.ending}`));
    }
    // An expect whose text is settled.
    else if (l.kind === "expect" && l.decoded !== null) parts.push(t("kindExpect", { text: l.decoded, length: l.length ?? 0 }));
    // A send or expect F5 leaves open.
    else parts.push(t("kindOpen", { keyword: l.keyword }));
    // F5's rule decides that this expect cannot match.
    if (l.breaks !== null) parts.push(t("lineBreaks"));
    // The protocol fact.
    if (l.hint !== null) parts.push(t(`hint.${l.hint}`));
    // The sentences.
    return parts.join(" ");
  };

  /** The outcome of a step, worded. */
  const outcome = (s: SimStep): string => t(`outcome.${s.outcome}`);

  /** The verdict sentence and its tone. */
  const verdict = (res: ScriptedMonitorResult): { text: string; tone: "ok" | "warn" | "bad" } | null => {
    // No simulation, no verdict.
    const sim = res.simulation;
    // None.
    if (!sim) return null;
    // A pass.
    if (sim.verdict === "pass") return { text: t("verdictPass"), tone: "ok" };
    // The reason, worded (the offset for a substring that is not a prefix).
    const stopStep = sim.steps[sim.steps.length - 1];
    // The reason's sentence.
    const why = t(`reason.${sim.reason}`, { at: stopStep?.foundAt ?? 0 });
    // A failure at a line.
    if (sim.verdict === "fail") return { text: t("verdictFail", { line: sim.stopLine ?? 0, why }), tone: "bad" };
    // Undetermined at a line, or (no expect) at the end.
    return { text: sim.stopLine === null ? t("verdictOpenEnd", { why }) : t("verdictOpen", { line: sim.stopLine, why }), tone: "warn" };
  };

  // The verdict, when there is a simulation.
  const v = r ? verdict(r) : null;

  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The script box, with the Example/Clear row (D-83). */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="bsm-script">
            {t("scriptLabel")}
          </label>
          <div className="dig-input-actions">
            {/* The Example is the input of golden vector f5-smtp-example: F5's own SMTP script and an RFC 5321 session. */}
            <button
              type="button"
              className="b64-copy"
              onClick={() => {
                // Both boxes, from the vector.
                setScript(EXAMPLE.script);
                // The transcript too.
                setTranscript(EXAMPLE.transcript);
              }}
            >
              {t("example")}
            </button>
            <button
              type="button"
              className="b64-copy"
              onClick={() => {
                // Both boxes emptied.
                setScript("");
                // The transcript too.
                setTranscript("");
              }}
            >
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="bsm-script"
          className="cidr-input mono json-input"
          rows={8}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder={t("scriptPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="bsm-privacy"
        />
      </div>

      {/* The transcript box. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="bsm-transcript">
          {t("transcriptLabel")}
        </label>
        <textarea
          id="bsm-transcript"
          className="cidr-input mono json-input"
          rows={8}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={t("transcriptPlaceholder")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="bsm-transcript-help bsm-privacy"
        />
        <p id="bsm-transcript-help" className="tcl-muted tcl-small">
          {t("transcriptHelp")}
        </p>
        <p id="bsm-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {/* An input over the bound, worded. */}
      {out.tooLong && (
        <p className="tcl-verdict tcl-verdict-bad" role="alert">
          {out.tooLong === "script" ? t("tooLongScript", { max: SCRIPT_MAX_CHARS }) : t("tooLongTranscript", { max: TRANSCRIPT_MAX_CHARS })}
        </p>
      )}

      {r && (
        <div className="jwt-results">
          {/* The summary. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summaryTitle")}</h4>
            <p>
              <span className="tcl-pill tcl-pill-value">{t("statLines", { n: r.lines.length })}</span>{" "}
              <span className="tcl-pill tcl-pill-value">{t("statSends", { n: r.sends })}</span>{" "}
              <span className="tcl-pill tcl-pill-value">{t("statExpects", { n: r.expects })}</span>{" "}
              <span className={`tcl-pill ${r.counts.error > 0 ? "tcl-pill-bad" : r.counts.warning > 0 ? "tcl-pill-warn" : "tcl-pill-true"}`}>{t("statFindings", { error: r.counts.error, warning: r.counts.warning, info: r.counts.info })}</span>{" "}
              {!r.endsWithLf && r.lines.length > 0 && <span className="tcl-pill tcl-pill-warn">{t("statNoLf")}</span>}
            </p>
            {/* No transcript: say what one would add. */}
            {!r.simulation && <p className="tcl-muted tcl-small">{t("noTranscript")}</p>}
            {/* Share results: at the end of the summary, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedEscaped", { line: Number(share.values?.line ?? 0) }) : ""} title={t("name")} />
            </div>
          </section>

          {/* The simulated check. */}
          {r.simulation && v && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("simTitle")}</h4>
              <p className={`tcl-verdict tcl-verdict-${v.tone}`}>{v.text}</p>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr>
                      <th scope="col">{t("colLine")}</th>
                      <th scope="col">{t("colScript")}</th>
                      <th scope="col">{t("colReply")}</th>
                      <th scope="col">{t("colOutcome")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.simulation.steps.map((s) => (
                      <tr key={s.line}>
                        <th scope="row">{s.line}</th>
                        <td>
                          {/* What the line does, with its text as the monitor reads it. */}
                          <code>{s.kind === "send" || s.kind === "expect" ? s.kind : r.lines[s.line - 1]?.keyword || t("blankShort")}</code> {s.text !== null ? <code>{s.text}</code> : <span className="tcl-muted">{t("textOpen")}</span>}
                        </td>
                        <td>
                          {/* The reply an expect was compared with; for a send, the transcript's client line. */}
                          {s.kind === "expect" ? (
                            s.reply !== null ? (
                              <>
                                <span className="tcl-muted tcl-small">{t("replyNo", { n: s.replyNo ?? 0 })}</span> <code>{s.reply}</code>
                              </>
                            ) : (
                              <span className="tcl-muted">{t("replyNone")}</span>
                            )
                          ) : s.kind === "send" && s.client !== null ? (
                            <span className="tcl-small">{s.clientDiffers ? t("clientDiffers", { client: s.client }) : t("clientSame")}</span>
                          ) : (
                            <span className="tcl-muted">{t("notApplicable")}</span>
                          )}
                        </td>
                        <td>
                          {outcome(s)}
                          {s.foundAt !== null ? ` ${t("foundAt", { at: s.foundAt })}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* What the reader should know about this run. */}
              {r.simulation.notes.map((n) => (
                <p key={n} className="hmac-build-note">
                  {t(`note.${n}`)}
                </p>
              ))}
              {r.simulation.unreadReplies > 0 && <p className="hmac-build-note">{t("noteUnread", { n: r.simulation.unreadReplies })}</p>}
              {r.simulation.unusedClientLines > 0 && <p className="hmac-build-note">{t("noteUnused", { n: r.simulation.unusedClientLines })}</p>}
              {r.transcript && r.transcript.ignoredLines.length > 0 && <p className="hmac-build-note">{t("noteIgnored", { lines: r.transcript.ignoredLines.join(", ") })}</p>}
              {/* The one assumption, and the timing the check runs on. */}
              <p className="tcl-muted tcl-small">{t("assumption")}</p>
              <p className="tcl-muted tcl-small">{t("timing")}</p>
            </section>
          )}

          {/* Every line, explained. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("linesTitle")}</h4>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead>
                  <tr>
                    <th scope="col">{t("colLine")}</th>
                    <th scope="col">{t("colWritten")}</th>
                    <th scope="col">{t("colMeaning")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lines.map((l) => (
                    <tr key={l.line}>
                      <th scope="row">{l.line}</th>
                      <td>
                        <code>{l.raw === "" ? t("blankShort") : l.raw}</code>
                      </td>
                      <td>{meaning(l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tcl-muted tcl-small">{t("picturesNote")}</p>
          </section>

          {/* The findings. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("findingsTitle")}</h4>
            {r.findings.length === 0 ? (
              <p className="tcl-verdict tcl-verdict-ok">{t("clean")}</p>
            ) : (
              <ul className="tcl-findings">
                {r.findings.map((f, i) => (
                  <li key={`${f.rule}-${f.line}-${i}`} className={`tcl-finding tcl-finding-${f.severity}`}>
                    <div className="tcl-finding-head">
                      <span className={`irl-sev irl-sev-${f.severity === "error" ? "high" : f.severity}`}>{t(`sev.${f.severity}`)}</span>{" "}
                      <span className="tcl-finding-title">
                        {f.rule} · {t("lineShort", { n: f.line })}
                      </span>
                    </div>
                    <p className="tcl-finding-msg">{t(`rule.${f.rule}`, { what: "", count: 0, after: "", kind: "", keyword: "", seq: "", text: "", trailing: 0, code: "", list: ESCAPE_LIST, ...(f.params ?? {}) })}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* What the explainer cannot know. */}
          <p className="tcl-muted tcl-small">{t("limits")}</p>
        </div>
      )}
    </div>
  );
}
