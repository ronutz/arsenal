"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/TcpWindowCeilingLab.tsx
// ----------------------------------------------------------------------------
// THE TCP WINDOW CEILING LAB (2026-10-26), embedded in "TCP Connection
// Lifecycle" as <Lab id="tcp-window-ceiling" />. Three number inputs (the
// window in flight in KiB, the round-trip time in ms, the path rate in Mbit/s);
// the result is the window ceiling, the bandwidth-delay product and the
// throughput side by side, a three-step account of how they are worked out and
// which one decides, and a note when the window or the path needs window
// scaling. The model is src/lib/labs/tcp-window-ceiling/compute.ts; its checked
// cases are the golden vectors beside it. Words: "learnLabs.tcp-window-ceiling".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_RATE_MBPS,
  MAX_RTT_MS,
  MAX_WINDOW_KIB,
  TcpWindowError,
  type TcpWindowErrorCode,
  type TcpWindowInput,
  type TcpWindowResult,
} from "@/lib/labs/tcp-window-ceiling/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "tcp-window-ceiling";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The window in KiB, as typed. */
  windowKiB: string;
  /** The round-trip time in ms, as typed. */
  rttMs: string;
  /** The path rate in Mbit/s, as typed. */
  rateMbps: string;
}

/** A model input as the form shows it. */
function toForm(i: TcpWindowInput): Form {
  // Numbers become text.
  return { windowKiB: String(i.windowKiB), rttMs: String(i.rttMs), rateMbps: String(i.rateMbps) };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function TcpWindowCeilingLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.tcp-window-ceiling");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on the article's 64 KiB, 100 ms, 100 Mbit/s case.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with the page's grouping (bytes, KiB).
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Rates and times with up to two decimals.
  const nf2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  // The share of the path, as a percentage with up to one decimal.
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  // The parsed form, as the model reads it.
  const input: TcpWindowInput = { windowKiB: readNumber(form.windowKiB), rttMs: readNumber(form.rttMs), rateMbps: readNumber(form.rateMbps) };
  // The model's answer, or null when it refused the input.
  let r: TcpWindowResult | null = null;
  // The refusal code, when there is one.
  let err: TcpWindowErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof TcpWindowError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-window"
      ? t("errorWindow", { max: nf0.format(MAX_WINDOW_KIB) })
      : err === "bad-rtt"
        ? t("errorRtt", { max: nf0.format(MAX_RTT_MS) })
        : t("errorRate", { max: nf0.format(MAX_RATE_MBPS) });

  /** The result block for a valid input. */
  const resultBlock = (res: TcpWindowResult) => {
    // The round trip and the rate as the reader typed them, formatted.
    const rtt = nf2.format(input.rttMs);
    // The path rate, formatted.
    const rate = nf2.format(input.rateMbps);
    // The verdict: the window or the path decides.
    const verdict = res.limitedBy === "window" ? t("verdictWindow", { v: nf2.format(res.effectiveMbps), pct: pct.format(res.utilisation) }) : t("verdictPath", { rate });
    // A window-limited connection is a warning; one that fills its path is good news.
    const tone = res.limitedBy === "window" ? "warn" : "ok";
    return (
      <>
        {/* The three numbers that decide it. */}
        <dl className="lab-kv">
          <dt>{t("kvCeiling")}</dt>
          <dd>{t("mbps", { v: nf2.format(res.ceilingMbps) })}</dd>
          <dt>{t("kvBdp")}</dt>
          <dd>{t("bdpValue", { bytes: nf0.format(res.bdpBytes) })}</dd>
          <dt>{t("kvThroughput")}</dt>
          <dd>{t("throughputValue", { v: nf2.format(res.effectiveMbps), pct: pct.format(res.utilisation) })}</dd>
        </dl>
        {/* How they are worked out, in order. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepWindow")}</span> {t("windowLine", { kib: nf0.format(input.windowKiB), bytes: nf0.format(res.windowBytes) })}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepCeiling")}</span> {t("ceilingLine", { bytes: nf0.format(res.windowBytes), rtt, v: nf2.format(res.ceilingMbps) })}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepPath")}</span> {t("pathLine", { rate, rtt, bdp: nf0.format(res.bdpBytes), need: nf0.format(res.neededKiB) })}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepVerdict")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* Window scaling: needed by this window, or needed to fill this path. */}
        {res.needsScaling ? <p className="lab-note">{t("noteScaled")}</p> : res.bdpNeedsScaling ? <p className="lab-note">{t("noteNeedsScaling")}</p> : null}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-window`} label={t("window")}>
            <input id={`${ID}-window`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_WINDOW_KIB} step={1} value={form.windowKiB} aria-invalid={err === "bad-window" ? "true" : undefined} onChange={(e) => setForm({ ...form, windowKiB: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-rtt`} label={t("rtt")}>
            <input id={`${ID}-rtt`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_RTT_MS} step="any" value={form.rttMs} aria-invalid={err === "bad-rtt" ? "true" : undefined} onChange={(e) => setForm({ ...form, rttMs: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-rate`} label={t("rate")}>
            <input id={`${ID}-rate`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_RATE_MBPS} step="any" value={form.rateMbps} aria-invalid={err === "bad-rate" ? "true" : undefined} onChange={(e) => setForm({ ...form, rateMbps: e.target.value })} />
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
