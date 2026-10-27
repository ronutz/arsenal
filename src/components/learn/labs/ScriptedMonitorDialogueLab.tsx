"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/ScriptedMonitorDialogueLab.tsx
// ----------------------------------------------------------------------------
// THE SCRIPTED MONITOR DIALOGUE LAB (2026-10-27), embedded in "BIG-IP LTM
// Scripted monitors" as <Lab id="scripted-monitor-dialogue" />. Four selects:
// the protocol, how the server behaves, a mistake to make in the script, and
// how many lines to show. The result puts each script line beside the server
// reply it was compared with and says what happened to it, then gives the
// verdict with F5's reason, the session the server played (in the RFCs' S: and
// C: notation) and the rules the explainer would flag. The model is
// src/lib/labs/scripted-monitor-dialogue/compute.ts, which hands the matching
// to the BIG-IP Scripted monitor explainer's engine; its checked cases are the
// golden vectors beside it. Words: "learnLabs.scripted-monitor-dialogue".
// ============================================================================

import { useState } from "react"; // the reader's choices
import { useTranslations } from "next-intl"; // the lab's words
import LabFrame, { LabField, LabSelect } from "./LabFrame"; // the shared frame
import {
  compute,
  DEFAULT_INPUT,
  DialogueError,
  EXAMPLE_INPUT,
  MISTAKES,
  PROTOCOLS,
  SERVERS,
  type DialogueInput,
  type DialogueResult,
  type Mistake,
  type Protocol,
  type ServerKind,
} from "@/lib/labs/scripted-monitor-dialogue/compute"; // the model

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "scripted-monitor-dialogue";

/** The reasons the lab can stop on (each has a sentence in the lab's words). */
const REASONS = new Set(["not-prefix", "mismatch", "after-quote", "crlf-after-quote", "no-reply", "separator"]);

export default function ScriptedMonitorDialogueLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.scripted-monitor-dialogue");
  // The reader's choices, opening on the healthy SMTP case.
  const [input, setInput] = useState<DialogueInput>(DEFAULT_INPUT);

  /** Change the protocol, keeping the server and the mistake when the new protocol offers them. */
  const setProtocol = (p: Protocol) => {
    // The server, or healthy when this protocol does not offer it.
    const server = SERVERS[p].includes(input.server) ? input.server : "healthy";
    // The mistake, or none.
    const mistake = MISTAKES[p].includes(input.mistake) ? input.mistake : "none";
    // The new choices; the step starts again at "all lines".
    setInput({ protocol: p, server, mistake, step: 0 });
  };

  // The model's answer, or the refusal code.
  let r: DialogueResult | null = null;
  // The refusal, when there is one.
  let err: string | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof DialogueError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** The verdict, worded, with its tone. */
  const verdict = (res: DialogueResult): { text: string; tone: "ok" | "warn" | "stop" } => {
    // A pass.
    if (res.verdict === "pass") return { text: t("verdictPass"), tone: "ok" };
    // The row the check stopped on (for the offset).
    const stopRow = res.rows.find((x) => x.line === res.stopLine);
    // The reason, worded (the lab only ever stops on the reasons in REASONS).
    const why = res.reason !== null && REASONS.has(res.reason) ? t(`reason.${res.reason}`, { at: stopRow?.foundAt ?? 0 }) : t("reason.other");
    // A failure.
    if (res.verdict === "fail") return { text: t("verdictFail", { line: res.stopLine ?? 0, why }), tone: "stop" };
    // Undetermined.
    return { text: t("verdictOpen", { line: res.stopLine ?? 0, why }), tone: "warn" };
  };

  /** The result block for a valid input. */
  const resultBlock = (res: DialogueResult) => {
    // The verdict.
    const v = verdict(res);
    // The rows the step setting shows.
    const rows = res.rows.filter((x) => x.shown);
    return (
      <>
        {/* The script and the server, side by side, line by line. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colLine")}</th>
                <th scope="col">{t("colScript")}</th>
                <th scope="col">{t("colReply")}</th>
                <th scope="col">{t("colOutcome")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.line}>
                  <th scope="row">{x.line}</th>
                  <td>
                    <code>{x.written}</code>
                  </td>
                  <td>{x.kind === "send" ? t("replySend") : x.reply !== null ? <code>{x.reply}</code> : x.outcome === "not-reached" ? t("notReached") : t("replyNone")}</td>
                  <td>
                    {t(`outcome.${x.outcome}`)}
                    {x.foundAt !== null ? ` ${t("foundAt", { at: x.foundAt })}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The verdict, only once every line is shown (a partial view says how many are left). */}
        {rows.length === res.rows.length ? (
          <p className={`lab-verdict lab-verdict--${v.tone}`}>{v.text}</p>
        ) : (
          <p className="lab-note">{t("moreSteps", { shown: rows.length, total: res.totalSteps })}</p>
        )}
        {/* The session the server played. */}
        <dl className="lab-kv">
          <dt>{t("sessionTitle")}</dt>
          <dd>
            {res.transcript.length === 0 ? (
              t("sessionEmpty")
            ) : (
              res.transcript.map((line, i) => (
                <span key={i}>
                  <code>{line}</code>
                  <br />
                </span>
              ))
            )}
          </dd>
          <dt>{t("rulesTitle")}</dt>
          <dd>{res.rules.length === 0 ? t("rulesNone") : res.rules.map((rule) => t(`rule.${rule}`)).join(" ")}</dd>
        </dl>
        {/* The standing cautions. */}
        <p className="lab-note">{t("prefixNote")}</p>
        <p className="lab-note">{t("timingNote")}</p>
      </>
    );
  };

  // The step options: every line count, then all lines.
  const stepOptions: [string, string][] = [["0", t("stepAll")]];
  // One option per line of the current script (its length is the same for every server and mistake).
  const total = r ? r.totalSteps : 0;
  // Lines 1 to total.
  for (let n = 1; n <= total; n++) stepOptions.push([String(n), t("stepN", { n })]);

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-protocol`} label={t("protocol")}>
            <LabSelect id={`${ID}-protocol`} value={input.protocol} options={PROTOCOLS.map((p) => [p, t(`protocolOption.${p}`)] as const)} onChange={(p) => setProtocol(p as Protocol)} />
          </LabField>
          <LabField id={`${ID}-server`} label={t("server")}>
            <LabSelect id={`${ID}-server`} value={input.server} options={SERVERS[input.protocol].map((s) => [s, t(`serverOption.${s}`)] as const)} onChange={(s) => setInput({ ...input, server: s as ServerKind })} />
          </LabField>
          <LabField id={`${ID}-mistake`} label={t("mistake")}>
            <LabSelect id={`${ID}-mistake`} value={input.mistake} options={MISTAKES[input.protocol].map((m) => [m, t(`mistakeOption.${m}`)] as const)} onChange={(m) => setInput({ ...input, mistake: m as Mistake, step: 0 })} />
          </LabField>
          <LabField id={`${ID}-step`} label={t("step")}>
            <LabSelect id={`${ID}-step`} value={String(input.step)} options={stepOptions} onChange={(s) => setInput({ ...input, step: Number(s) })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{t("error", { code: err ?? "" })}</p>}
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
