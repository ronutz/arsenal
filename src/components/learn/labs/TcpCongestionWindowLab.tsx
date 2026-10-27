"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/TcpCongestionWindowLab.tsx
// ----------------------------------------------------------------------------
// THE TCP CONGESTION WINDOW LAB (2026-10-26), embedded in "TCP Connection
// Lifecycle" as <Lab id="tcp-congestion-window" />. Three number inputs (SMSS,
// the initial ssthresh, the round trip with the loss) and two selects (the
// initial window rule, how the loss is found); the result is a short summary,
// an ordered account of each rule that changed the window with its numbers,
// the comparison with the other way of finding the same loss, and a table of
// cwnd and ssthresh round trip by round trip. The model is
// src/lib/labs/tcp-congestion-window/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.tcp-congestion-window".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  CwndError,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_LOSS_ROUND,
  MAX_SMSS,
  MAX_SSTHRESH,
  type CwndErrorCode,
  type CwndInput,
  type CwndResult,
  type Detection,
  type IwRule,
} from "@/lib/labs/tcp-congestion-window/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "tcp-congestion-window";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** SMSS in bytes, as typed. */
  smss: string;
  /** The initial window rule. */
  iw: IwRule;
  /** The initial ssthresh in bytes, as typed. */
  ssthresh: string;
  /** The loss round, as typed. */
  lossRound: string;
  /** How the loss is found. */
  detection: Detection;
}

/** A model input as the form shows it. */
function toForm(i: CwndInput): Form {
  // Numbers become text; the selects keep their values.
  return { smss: String(i.smss), iw: i.iw, ssthresh: String(i.ssthresh), lossRound: String(i.lossRound), detection: i.detection };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered; a decimal comma is read as a point so a fraction is refused, not misread.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function TcpCongestionWindowLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.tcp-congestion-window");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers with the page's grouping.
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Segment counts with up to one decimal.
  const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  // The reader's settings, opening on a loss in round 8 found by three duplicate ACKs.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));

  // The parsed form, as the model reads it.
  const input: CwndInput = { smss: readNumber(form.smss), iw: form.iw, ssthresh: readNumber(form.ssthresh), lossRound: readNumber(form.lossRound), detection: form.detection };
  // The model's answer, or null when it refused the input.
  let r: CwndResult | null = null;
  // The refusal code, when there is one.
  let err: CwndErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof CwndError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-smss"
      ? t("errorSmss", { max: nf0.format(MAX_SMSS) })
      : err === "bad-ssthresh"
        ? t("errorSsthresh", { max: nf0.format(MAX_SSTHRESH) })
        : err === "bad-loss-round"
          ? t("errorLossRound", { max: MAX_LOSS_ROUND })
          : t("errorChoice");

  // The initial window options.
  const iwOptions = [
    ["rfc5681", t("iwRfc5681")],
    ["rfc6928", t("iwRfc6928")],
    ["one", t("iwOne")],
  ] as const;
  // The detection options.
  const detectionOptions = [
    ["dupacks", t("detectDupacks")],
    ["timeout", t("detectTimeout")],
  ] as const;

  /** The result block for a valid input. */
  const resultBlock = (res: CwndResult) => {
    // SMSS, as read.
    const smss = input.smss;
    /** Bytes, formatted. */
    const b = (n: number) => nf0.format(n);
    /** A window in segments of SMSS, formatted. */
    const segs = (n: number) => nf1.format(n / smss);
    // The initial window's rule, in words.
    const iwLine =
      form.iw === "one"
        ? t("iwLineOne", { iw: b(res.iwBytes) })
        : form.iw === "rfc6928"
          ? t("iwLine6928", { iw: b(res.iwBytes), segs: segs(res.iwBytes) })
          : t(smss > 2190 ? "iwLine5681Large" : smss > 1095 ? "iwLine5681Mid" : "iwLine5681Small", { smss: b(smss), iw: b(res.iwBytes), segs: segs(res.iwBytes) });
    // The first round's ssthresh (the reader's).
    const ss0 = res.rounds[0].ssthresh;
    // How slow start went before any loss.
    const ssLine =
      res.rounds[0].cwnd >= ss0
        ? t("ssLineNone", { ss: b(ss0) })
        : res.firstCapRound !== null
          ? t("ssLineCapped", { ss: b(ss0), round: res.firstCapRound })
          : t("ssLineNever", { ss: b(ss0) });
    // The loss's steps, when there is one.
    const used = res.used;
    // The comparison and its tone.
    let verdict: string;
    // Good news unless the timer found the loss.
    let tone: "ok" | "warn" = "ok";
    // Without a loss: where the window ends.
    if (!used || res.flightSize === null) verdict = t("verdictNoLoss", { rounds: res.rounds.length, cwnd: b(res.rounds[res.rounds.length - 1].cwnd) });
    // The timer was the only way: no comparison.
    else if (!res.other) {
      // A warning.
      tone = "warn";
      // Back at ssthresh after the timer.
      verdict = t("verdictForced", { back: used.backRound });
    }
    // Duplicate ACKs, compared with the timer.
    else if (used.detection === "dupacks") verdict = t("verdictDupacks", { back: used.backRound, otherBack: res.other.backRound, diff: res.other.backRound - used.backRound });
    // The timer, compared with duplicate ACKs.
    else {
      // A warning.
      tone = "warn";
      // The comparison.
      verdict = t("verdictTimeout", { back: used.backRound, otherBack: res.other.backRound, diff: used.backRound - res.other.backRound });
    }
    // The loss round's number.
    const L = input.lossRound;
    return (
      <>
        {/* The numbers that matter. */}
        <dl className="lab-kv">
          <dt>{t("kvIw")}</dt>
          <dd>{t("bytesSegs", { bytes: b(res.iwBytes), segs: segs(res.iwBytes) })}</dd>
          <dt>{t("kvLoss")}</dt>
          <dd>{used && res.flightSize !== null ? t("kvLossValue", { round: L, flight: b(res.flightSize) }) : t("none")}</dd>
          <dt>{t("kvSsthreshAfter")}</dt>
          <dd>{used ? t("bytes", { bytes: b(used.ssthresh) }) : t("none")}</dd>
        </dl>
        {/* Each rule that moved the window, in order. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepIw")}</span> {iwLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepGrowth")}</span> {ssLine}
          </li>
          {used && res.flightSize !== null && (
            <li className="lab-step">
              <span className="lab-step-where">{t("stepLoss")}</span>{" "}
              {t("lossLine", { round: L, flight: b(res.flightSize), half: b(Math.floor(res.flightSize / 2)), two: b(2 * smss), ss: b(used.ssthresh) })}
            </li>
          )}
          {used && (
            <li className="lab-step">
              <span className="lab-step-where">{t("stepDetect")}</span>{" "}
              {used.detection === "dupacks"
                ? t("dupacksLine", { r1: L + 1, inflated: b(used.firstCwnd), r2: L + 2, ss: b(used.ssthresh) })
                : t("timeoutLine", { r1: L + 1, smss: b(smss), ss: b(used.ssthresh), back: used.backRound })}
            </li>
          )}
          <li className="lab-step">
            <span className="lab-step-where">{t("stepVerdict")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* A one-segment window cannot raise a duplicate ACK. */}
        {res.forcedTimeout && <p className="lab-note">{t("noteForced")}</p>}
        {/* The window round trip by round trip. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colRound")}</th>
                <th scope="col">{t("colCwnd")}</th>
                <th scope="col">{t("colSsthresh")}</th>
                <th scope="col">{t("colRule")}</th>
              </tr>
            </thead>
            <tbody>
              {res.rounds.map((x) => (
                <tr key={x.n}>
                  <th scope="row">{x.n}</th>
                  <td>{t("bytesSegs", { bytes: b(x.cwnd), segs: segs(x.cwnd) })}</td>
                  <td>{b(x.ssthresh)}</td>
                  <td>
                    {t(`ev.${x.event}`)}
                    {x.loss ? ` ${t("lossMark")}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-smss`} label={t("smss")}>
            <input id={`${ID}-smss`} className="lab-input" type="number" inputMode="numeric" min={1} max={MAX_SMSS} step={1} value={form.smss} aria-invalid={err === "bad-smss" ? "true" : undefined} onChange={(e) => setForm({ ...form, smss: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-iw`} label={t("iw")}>
            <LabSelect id={`${ID}-iw`} value={form.iw} options={iwOptions} onChange={(v) => setForm({ ...form, iw: v as IwRule })} />
          </LabField>
          <LabField id={`${ID}-ssthresh`} label={t("ssthresh")}>
            <input id={`${ID}-ssthresh`} className="lab-input" type="number" inputMode="numeric" min={1} max={MAX_SSTHRESH} step={1} value={form.ssthresh} aria-invalid={err === "bad-ssthresh" ? "true" : undefined} onChange={(e) => setForm({ ...form, ssthresh: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-loss-round`} label={t("lossRound")}>
            <input id={`${ID}-loss-round`} className="lab-input" type="number" inputMode="numeric" min={0} max={MAX_LOSS_ROUND} step={1} value={form.lossRound} aria-invalid={err === "bad-loss-round" ? "true" : undefined} onChange={(e) => setForm({ ...form, lossRound: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-detection`} label={t("detection")}>
            <LabSelect id={`${ID}-detection`} value={form.detection} options={detectionOptions} onChange={(v) => setForm({ ...form, detection: v as Detection })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
