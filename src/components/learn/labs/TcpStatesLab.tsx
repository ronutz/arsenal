"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/TcpStatesLab.tsx
// ----------------------------------------------------------------------------
// THE TCP STATES LAB (2026-10-26), embedded in "TCP Connection Lifecycle" as
// <Lab id="tcp-states" />. A scenario select (the handshake, four closes, an
// abort), a step select with Previous and Next buttons, and the result: both
// ends' states and the segments in the network after the steps shown, then an
// ordered account of every step shown (the segment received or sent, in RFC
// 9293's own notation, the rule with its section, both states after it), and,
// at the last step, where the scenario ends and which end waits in TIME-WAIT.
// The model is src/lib/labs/tcp-states/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.tcp-states".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MSL_SECONDS,
  SCENARIOS,
  stepCount,
  TIME_WAIT_SECONDS,
  type Scenario,
  type Segment,
  type Step,
  type TcpStatesInput,
} from "@/lib/labs/tcp-states/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "tcp-states";

/** The message key of each scenario's option label. */
const SCENARIO_KEY: Record<Scenario, string> = {
  // The handshake.
  open: "scenarioOpen",
  // The client closes first, four segments.
  "close-client": "scenarioCloseClient",
  // The client closes first, three segments.
  "close-client-3": "scenarioCloseClient3",
  // The server closes first.
  "close-server": "scenarioCloseServer",
  // Both close at once.
  "close-simultaneous": "scenarioSimultaneous",
  // An abort.
  abort: "scenarioAbort",
};

/** The message key of each scenario's closing verdict. */
const VERDICT_KEY: Record<Scenario, string> = {
  // The handshake.
  open: "verdictOpen",
  // The client closes first, four segments.
  "close-client": "verdictCloseClient",
  // The client closes first, three segments.
  "close-client-3": "verdictCloseClient3",
  // The server closes first.
  "close-server": "verdictCloseServer",
  // Both close at once.
  "close-simultaneous": "verdictSimultaneous",
  // An abort.
  abort: "verdictAbort",
};

/** A segment in RFC 9293's abbreviated notation: <SEQ=...><ACK=...><CTL=...> (protocol notation, not words). */
function notation(s: Segment | null): string {
  // No segment.
  if (!s) return "";
  // The ACK field only when the ACK flag is on, as the RFC's figures write it.
  return `<SEQ=${s.seq}>${s.ack === null ? "" : `<ACK=${s.ack}>`}<CTL=${s.flags.join(",")}>`;
}

export default function TcpStatesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.tcp-states");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // The reader's settings, opening on the client's close with every step shown.
  const [input, setInput] = useState<TcpStatesInput>(DEFAULT_INPUT);
  // The model's answer (both controls are selects, so the input is always valid).
  const r = compute(input);

  // The scenario options, in the model's order.
  const scenarioOptions = SCENARIOS.map((s) => [s, t(SCENARIO_KEY[s])] as const);
  // The step options: the start, then each step.
  const stepOptions = Array.from({ length: r.total + 1 }, (_, n) => [String(n), n === 0 ? t("stepStart") : t("stepN", { n, total: r.total })] as const);
  /** Pick a scenario and show all of its steps. */
  const pickScenario = (v: string) => setInput({ scenario: v as Scenario, step: stepCount(v as Scenario) });

  /** One step's sentence: the rule's words with the segments and states filled in. */
  const stepText = (s: Step): string =>
    t(`rule.${s.rule}`, {
      peer: s.peer,
      sent: notation(s.sent),
      recv: notation(s.received),
      before: s.before,
      state: s.peer === "A" ? s.stateA : s.stateB,
      via: s.via ?? "",
      seconds: nf.format(TIME_WAIT_SECONDS),
      msl: nf.format(MSL_SECONDS),
    });

  // The segments in the network after the steps shown, worded.
  const flight = r.inFlight.length ? r.inFlight.map((s) => t("flightItem", { seg: notation(s), from: s.from, to: s.from === "A" ? "B" : "A" })).join("; ") : t("none");
  // True once the last step is shown.
  const atEnd = input.step === r.total;
  // An abort is the one ending worth a warning colour; the rest are normal ends.
  const tone = input.scenario === "abort" ? "warn" : "ok";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-scenario`} label={t("scenario")}>
            <LabSelect id={`${ID}-scenario`} value={input.scenario} options={scenarioOptions} onChange={pickScenario} />
          </LabField>
          <LabField id={`${ID}-step`} label={t("step")}>
            <LabSelect id={`${ID}-step`} value={String(input.step)} options={stepOptions} onChange={(v) => setInput({ ...input, step: Number(v) })} />
          </LabField>
          {/* Step backwards and forwards without opening the select. */}
          <div className="lab-input-row">
            <button type="button" className="lab-button lab-button--quiet" disabled={input.step === 0} onClick={() => setInput({ ...input, step: Math.max(0, input.step - 1) })}>
              {t("prev")}
            </button>
            <button type="button" className="lab-button lab-button--quiet" disabled={atEnd} onClick={() => setInput({ ...input, step: Math.min(r.total, input.step + 1) })}>
              {t("next")}
            </button>
          </div>
        </>
      }
      result={
        <>
          {/* Where both ends stand now. */}
          <dl className="lab-kv">
            <dt>{t("kvA")}</dt>
            <dd className="mono">{r.stateA}</dd>
            <dt>{t("kvB")}</dt>
            <dd className="mono">{r.stateB}</dd>
            <dt>{t("kvInFlight")}</dt>
            <dd className="mono">{flight}</dd>
          </dl>
          {/* The starting point, then every step shown, in order. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("stepWhereStart")}</span> {t("startLine", { a: r.startA, b: r.startB })}
            </li>
            {r.shown.map((s) => (
              <li className="lab-step" key={s.n}>
                <span className="lab-step-where">{t("stepWhere", { n: s.n })}</span> {stepText(s)} {t("statesAfter", { a: s.stateA, b: s.stateB })}
              </li>
            ))}
          </ol>
          {/* Who is sitting in TIME-WAIT right now, before the timer has run out. */}
          {!atEnd && r.stateA === "TIME-WAIT" && r.stateB === "TIME-WAIT" ? (
            <p className="lab-note">{t("noteWaitingBoth", { seconds: nf.format(TIME_WAIT_SECONDS) })}</p>
          ) : !atEnd && (r.stateA === "TIME-WAIT" || r.stateB === "TIME-WAIT") ? (
            <p className="lab-note">{t("noteWaitingOne", { peer: r.stateA === "TIME-WAIT" ? "A" : "B", seconds: nf.format(TIME_WAIT_SECONDS) })}</p>
          ) : null}
          {/* Where it ends, once the last step is shown; how far is left otherwise. */}
          {atEnd ? (
            <p>
              <span className={`lab-verdict lab-verdict--${tone}`}>{t(VERDICT_KEY[input.scenario], { seconds: nf.format(TIME_WAIT_SECONDS) })}</span>
            </p>
          ) : (
            <p className="lab-note">{t("moreSteps", { left: r.total - input.step })}</p>
          )}
          {/* The abort's caveat: RFC 9293 also says the resetting side should enter TIME-WAIT. */}
          {input.scenario === "abort" && <p className="lab-note">{t("noteAbort")}</p>}
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
