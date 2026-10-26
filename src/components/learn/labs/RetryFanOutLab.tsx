"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/RetryFanOutLab.tsx
// ----------------------------------------------------------------------------
// THE RETRY FAN-OUT LAB (2026-10-26), embedded in "Retries, timeouts and
// idempotency: when the answer never arrives" as <Lab id="retry-fan-out" />.
// Three number inputs (the attempts the entry point, service 1 and service 2
// each make for one incoming call) and a table of the calls each service
// receives when the last one is failing, beside the same chain with retries
// only at the entry point, then a verdict. The model is
// src/lib/labs/retry-fan-out/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.retry-fan-out".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, MAX_ATTEMPTS, MIN_ATTEMPTS, RetryFanOutError, type RetryFanOutInput, type RetryFanOutResult } from "@/lib/labs/retry-fan-out/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "retry-fan-out";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The entry point's attempts, as typed. */
  entry: string;
  /** Service 1's attempts, as typed. */
  service1: string;
  /** Service 2's attempts, as typed. */
  service2: string;
}

/** A model input as the form shows it. */
function toForm(i: RetryFanOutInput): Form {
  // Numbers become text.
  return { entry: String(i.entry), service1: String(i.service1), service2: String(i.service2) };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

/** True when a typed value is not a whole number of attempts in range (the field to mark). */
function isBad(s: string): boolean {
  // The typed value as a number.
  const n = readNumber(s);
  // Whole and within the lab's range, or it is marked.
  return !(Number.isInteger(n) && n >= MIN_ATTEMPTS && n <= MAX_ATTEMPTS);
}

export default function RetryFanOutLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.retry-fan-out");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on retries at a single point.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Ratios with up to one decimal.
  const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });

  // The model's answer, or null when it refused the input.
  let r: RetryFanOutResult | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ entry: readNumber(form.entry), service1: readNumber(form.service1), service2: readNumber(form.service2) });
  } catch (e) {
    // Only the model's own refusal is expected here; anything else is a bug and must surface.
    if (!(e instanceof RetryFanOutError)) throw e;
  }

  /** The result block for a valid input. */
  const resultBlock = (res: RetryFanOutResult) => {
    // The verdict: nobody retries, one layer retries, or several layers multiply.
    const verdict =
      res.retryingLayers === 0
        ? t("verdictNone")
        : res.retryingLayers === 1
          ? t("verdictSingle", { n: nf.format(res.toLast) })
          : t("verdictMultiply", { layers: res.retryingLayers, n: nf.format(res.toLast), x: nf1.format(res.overSinglePoint) });
    // One retrying layer or none is the recommended shape; several multiplying is the warning.
    const tone = res.retryingLayers <= 1 ? "ok" : "warn";
    // The three hops, with the calls each receives now and with retries only at the entry point.
    const rows = [
      [t("hopService1"), res.toService1, res.singlePointToLast],
      [t("hopService2"), res.toService2, res.singlePointToLast],
      [t("hopLast"), res.toLast, res.singlePointToLast],
    ] as const;
    return (
      <>
        {/* The calls each service receives, side by side with the single-point policy. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colService")}</th>
                <th scope="col">{t("colThese")}</th>
                <th scope="col">{t("colSingle")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, now, single]) => (
                <tr key={name}>
                  <th scope="row">{name}</th>
                  <td>{nf.format(now)}</td>
                  <td>{nf.format(single)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The total along the chain. */}
        <dl className="lab-kv">
          <dt>{t("kvTotal")}</dt>
          <dd>{nf.format(res.totalCalls)}</dd>
        </dl>
        {/* The verdict, in words. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
        {/* The published figure for a deeper stack. */}
        <p className="lab-note">{t("note243")}</p>
      </>
    );
  };

  /** One attempts field, its label and its invalid state. */
  const field = (key: keyof Form, labelKey: "entry" | "service1" | "service2") => (
    <LabField id={`${ID}-${key}`} label={t(labelKey)}>
      <input
        id={`${ID}-${key}`}
        className="lab-input"
        type="number"
        inputMode="decimal"
        min={MIN_ATTEMPTS}
        max={MAX_ATTEMPTS}
        step={1}
        value={form[key]}
        aria-invalid={isBad(form[key]) ? "true" : undefined}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </LabField>
  );

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          {field("entry", "entry")}
          {field("service1", "service1")}
          {field("service2", "service2")}
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{t("errorAttempts", { min: MIN_ATTEMPTS, max: MAX_ATTEMPTS })}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
