"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/F5MonitorTimingLab.tsx
// ----------------------------------------------------------------------------
// THE F5 MONITOR TIMING LAB (2026-10-26), embedded in "How LTM Health Monitors
// Decide Up or Down" as <Lab id="f5-monitor-timing" />. Six number inputs:
// the monitor's Interval, Timeout, Up Interval and Time Until Up, and the
// seconds at which the server goes silent and answers again. The result is a
// short summary, the probes grouped into runs (when, how many, answered or
// not, the member's status after them), and the events in time order, each
// with the F5 document that decides it. The model is
// src/lib/labs/f5-monitor-timing/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.f5-monitor-timing".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_INTERVAL_S,
  MAX_TIMELINE_S,
  MAX_TIMEOUT_S,
  MonitorTimingError,
  type MemberStatus,
  type MonitorTimingErrorCode,
  type MonitorTimingInput,
  type MonitorTimingResult,
} from "@/lib/labs/f5-monitor-timing/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "f5-monitor-timing";

/** The form as typed: every field stays text so the reader can edit freely. */
type Form = Record<keyof MonitorTimingInput, string>;

/** A model input as the form shows it. */
function toForm(i: MonitorTimingInput): Form {
  // Numbers become text.
  return {
    intervalS: String(i.intervalS),
    timeoutS: String(i.timeoutS),
    upIntervalS: String(i.upIntervalS),
    timeUntilUpS: String(i.timeUntilUpS),
    failAtS: String(i.failAtS),
    recoverAtS: String(i.recoverAtS),
  };
}

/** Read a typed number; an empty field is not a number (the model refuses it). */
function readNumber(s: string): number {
  // Blank means nothing was entered; a decimal comma is read as a point (and then refused as not whole).
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

/** The fields each refusal points at, for aria-invalid. */
const FIELDS_AT_FAULT: Record<MonitorTimingErrorCode, (keyof MonitorTimingInput)[]> = {
  // The Interval alone.
  "bad-interval": ["intervalS"],
  // The Timeout alone.
  "bad-timeout": ["timeoutS"],
  // Both: the Timeout is shorter than the Interval.
  "timeout-below-interval": ["intervalS", "timeoutS"],
  // The Up Interval alone.
  "bad-up-interval": ["upIntervalS"],
  // Time Until Up alone.
  "bad-time-until-up": ["timeUntilUpS"],
  // The two timeline seconds, read together.
  "bad-timeline": ["failAtS", "recoverAtS"],
};

/** One event of the account: when, what, and its order among events of the same second. */
interface Event {
  /** The second. */
  at: number;
  /** Tie order: earlier causes first. */
  rank: number;
  /** The sentence. */
  text: string;
}

export default function F5MonitorTimingLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.f5-monitor-timing");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers in the page's language.
  const nf = new Intl.NumberFormat(locale);
  // The reader's settings, opening on the http defaults and a one-minute outage.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));

  // The model's answer, or the code it refused the input with.
  let r: MonitorTimingResult | null = null;
  // The refusal code, when there is one.
  let err: MonitorTimingErrorCode | null = null;
  // The parsed input (kept for the sentences).
  const input: MonitorTimingInput = {
    intervalS: readNumber(form.intervalS),
    timeoutS: readNumber(form.timeoutS),
    upIntervalS: readNumber(form.upIntervalS),
    timeUntilUpS: readNumber(form.timeUntilUpS),
    failAtS: readNumber(form.failAtS),
    recoverAtS: readNumber(form.recoverAtS),
  };
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof MonitorTimingError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-interval"
      ? t("errorInterval", { max: MAX_INTERVAL_S })
      : err === "bad-timeout"
        ? t("errorTimeout", { max: MAX_TIMEOUT_S })
        : err === "timeout-below-interval"
          ? t("errorTimeoutBelow")
          : err === "bad-up-interval"
            ? t("errorUpInterval", { max: MAX_INTERVAL_S })
            : err === "bad-time-until-up"
              ? t("errorTimeUntilUp", { max: MAX_TIMEOUT_S })
              : err
                ? t("errorTimeline", { max: MAX_TIMELINE_S })
                : null;
  // The fields to mark invalid.
  const bad = new Set<keyof MonitorTimingInput>(err ? FIELDS_AT_FAULT[err] : []);

  /** A whole number of seconds, formatted. */
  const sec = (n: number): string => nf.format(n);
  /** The member's status, worded. */
  const statusText = (s: MemberStatus): string => (s === "up" ? t("statusUp") : s === "down" ? t("statusDown") : t("statusPending"));

  /** One number input, labelled, with its own id and invalid state. */
  const field = (key: keyof MonitorTimingInput, slug: string, label: string, min: number, max: number) => (
    <LabField id={`${ID}-${slug}`} label={label}>
      <input
        id={`${ID}-${slug}`}
        className="lab-input"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={1}
        value={form[key]}
        aria-invalid={bad.has(key) ? "true" : undefined}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </LabField>
  );

  /** The result block for a valid input. */
  const resultBlock = (res: MonitorTimingResult) => {
    // The events of the account, gathered, then put in time order.
    const events: Event[] = [];
    // The failure.
    events.push({ at: input.failAtS, rank: 0, text: t("eventFail") });
    // The first missed probe and its deadline, when a probe met the outage.
    if (res.firstMissedS !== null && res.deadlineS !== null) events.push({ at: res.firstMissedS, rank: 1, text: t("eventFirstMissed", { deadline: sec(res.deadlineS) }) });
    // The down mark, with the tie note when a probe was due that very second.
    if (res.markedDownS !== null) {
      // A probe due at the deadline is too late (K12531).
      const tie = res.probes.some((p) => p.atS === res.markedDownS);
      // The sentence.
      events.push({ at: res.markedDownS, rank: 2, text: `${t("eventDown", { timeout: sec(input.timeoutS), missed: res.missedWhileUp })}${tie ? ` ${t("eventDownTie")}` : ""}` });
    }
    // The recovery.
    events.push({ at: input.recoverAtS, rank: 3, text: t("eventRecover") });
    // The probe that ends the story while the member is still up.
    if (res.outcome === "ridden-through" && res.riddenAtS !== null) events.push({ at: res.riddenAtS, rank: 4, text: t("eventRidden", { missed: res.missedWhileUp }) });
    // The probe after a blip no probe met.
    if (res.outcome === "unseen") events.push({ at: res.firstAnsweredAfterS, rank: 4, text: t("eventUnseen", { last: sec(res.lastAnsweredBeforeS) }) });
    // The first answer after a down mark: up at once, or Time Until Up starts.
    if (res.outcome === "down-up") {
      // Time Until Up 0 or more.
      events.push({ at: res.firstAnsweredAfterS, rank: 4, text: input.timeUntilUpS === 0 ? t("eventAnswerUp") : t("eventAnswerPending", { tuu: sec(input.timeUntilUpS) }) });
      // The later up mark when Time Until Up delays it.
      if (input.timeUntilUpS > 0 && res.markedUpS !== null) events.push({ at: res.markedUpS, rank: 5, text: t("eventUpAfterTuu") });
    }
    // Time order, causes first within a second.
    events.sort((a, b) => a.at - b.at || a.rank - b.rank);

    // The outage's length.
    const outage = input.recoverAtS - input.failAtS;
    // The verdict.
    const verdict =
      res.outcome === "unseen"
        ? t("verdictUnseen", { outage: sec(outage) })
        : res.outcome === "ridden-through"
          ? t("verdictRidden", { timeout: sec(input.timeoutS), outage: sec(outage) })
          : res.flap
            ? t("verdictFlap", { down: sec(res.markedDownS ?? 0), up: sec(res.markedUpS ?? 0), downFor: sec(res.downForS ?? 0), outage: sec(outage), rec: sec(res.recommendedTimeoutS) })
            : t("verdictDownUp", { down: sec(res.markedDownS ?? 0), up: sec(res.markedUpS ?? 0), detection: sec(res.detectionS ?? 0), ret: sec(res.returnS ?? 0) });
    // A bounce is a warning; everything else is the monitor doing its job.
    const tone = res.flap ? "warn" : "ok";

    return (
      <>
        {/* The summary. */}
        <dl className="lab-kv">
          <dt>{t("kvWindow")}</dt>
          <dd>{nf.format(res.windowProbes)}</dd>
          <dt>{t("kvRecommended")}</dt>
          <dd>{t("seconds", { s: sec(res.recommendedTimeoutS) })}</dd>
          <dt>{t("kvDown")}</dt>
          <dd>{res.markedDownS === null || res.detectionS === null ? t("never") : t("downAt", { at: sec(res.markedDownS), after: sec(res.detectionS) })}</dd>
          <dt>{t("kvUp")}</dt>
          <dd>{res.markedUpS === null || res.returnS === null ? t("notNeeded") : t("upAt", { at: sec(res.markedUpS), after: sec(res.returnS) })}</dd>
          <dt>{t("kvOut")}</dt>
          <dd>{res.downForS === null ? t("never") : t("seconds", { s: sec(res.downForS) })}</dd>
        </dl>
        {/* The probes, in runs. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colSeconds")}</th>
                <th scope="col">{t("colProbes")}</th>
                <th scope="col">{t("colAnswer")}</th>
                <th scope="col">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {res.runs.map((run) => (
                <tr key={run.fromS}>
                  <th scope="row">{run.count === 1 ? sec(run.fromS) : t("range", { from: sec(run.fromS), to: sec(run.toS) })}</th>
                  <td>{run.everyS === null ? t("probesOne") : t("probesMany", { count: run.count, every: sec(run.everyS) })}</td>
                  <td>{run.answered ? t("answered") : t("unanswered")}</td>
                  <td>{statusText(run.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The events, in time order, each with its rule. */}
        <ol className="lab-steps">
          {events.map((ev, i) => (
            <li className="lab-step" key={`${ev.at}-${ev.rank}-${i}`}>
              <span className="lab-step-where">{t("atSecond", { s: sec(ev.at) })}</span> {ev.text}
            </li>
          ))}
          <li className="lab-step">
            <span className="lab-step-where">{t("stepResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* The standing cautions for these settings. */}
        {res.belowRecommendation && <p className="lab-note">{t("noteBelow", { rec: sec(res.recommendedTimeoutS), n: res.windowProbes })}</p>}
        {res.windowProbes === 1 && <p className="lab-note">{t("noteOneProbe")}</p>}
        {res.upIntervalNotMultiple && <p className="lab-note">{t("noteMultiple")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          {field("intervalS", "interval", t("interval"), 1, MAX_INTERVAL_S)}
          {field("timeoutS", "timeout", t("timeout"), 1, MAX_TIMEOUT_S)}
          {field("upIntervalS", "up-interval", t("upInterval"), 0, MAX_INTERVAL_S)}
          {field("timeUntilUpS", "time-until-up", t("timeUntilUp"), 0, MAX_TIMEOUT_S)}
          {field("failAtS", "fail-at", t("failAt"), 1, MAX_TIMELINE_S - 1)}
          {field("recoverAtS", "recover-at", t("recoverAt"), 2, MAX_TIMELINE_S)}
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
