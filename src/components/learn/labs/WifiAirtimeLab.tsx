"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/WifiAirtimeLab.tsx
// ----------------------------------------------------------------------------
// THE WI-FI AIRTIME LAB (2026-10-26), embedded in "Wi-Fi: a shared medium
// pretending to be a cable" as <Lab id="wifi-airtime" />. Four client slots,
// each a data rate (legacy 802.11a/g or 802.11ac; slots 2 to 4 may be empty)
// and a frame size. The result: the slowest client's frame priced part by
// part (an ordered account), a table of every client's frame airtime, payload
// share and share of a round in which each sends one frame, the round and the
// cell's rate with and without the slowest client, and a verdict. The model is
// src/lib/labs/wifi-airtime/compute.ts (HPE Aruba's VHD 802.11ac VRD figures);
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.wifi-airtime".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  AirtimeError,
  compute,
  CONTROL_RATE_MBPS,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_FRAME_BYTES,
  MIN_FRAME_BYTES,
  RATES,
  type AirtimeErrorCode,
  type AirtimeInput,
  type AirtimeResult,
  type ClientResult,
  type RateDef,
} from "@/lib/labs/wifi-airtime/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "wifi-airtime";

/** One slot as typed: the rate id and the frame size as text. */
interface SlotForm {
  /** The rate id, or "off". */
  rate: string;
  /** The frame size, as typed. */
  bytes: string;
}

/** A model input as the form shows it. */
function toForm(i: AirtimeInput): SlotForm[] {
  // Numbers become text.
  return i.clients.map((c) => ({ rate: c.rate, bytes: String(c.bytes) }));
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function WifiAirtimeLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.wifi-airtime");
  // The page's language, for numbers.
  const locale = useLocale();
  // The reader's settings, opening on three 802.11ac clients.
  const [form, setForm] = useState<SlotForm[]>(toForm(DEFAULT_INPUT));
  // Microseconds and rates with two decimals.
  const nf2 = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Whole numbers with grouping (bytes).
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Rates as the guide prints them (one decimal at most).
  const nfRate = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  // Shares as percentages.
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  // The parsed form, as the model reads it.
  const input: AirtimeInput = { clients: form.map((s) => ({ rate: s.rate, bytes: readNumber(s.bytes) })) };
  // The model's answer, or null when it refused the input.
  let r: AirtimeResult | null = null;
  // The refusal code, when there is one.
  let err: AirtimeErrorCode | null = null;
  // The slot the refusal concerns.
  let errSlot: number | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof AirtimeError) {
      // Its code.
      err = e.code;
      // Its slot.
      errSlot = e.slot;
    }
    // Anything else is a bug and must surface.
    else throw e;
  }

  /** A rate, worded. */
  const rateName = (x: RateDef): string =>
    x.phy === "legacy" ? t("rateLegacy", { mbps: nfRate.format(x.mbps) }) : t("rateVht", { ss: x.ss ?? 1, mhz: x.mhz ?? 20, mcs: x.mcs ?? 0, mbps: nfRate.format(x.mbps) });
  // The rate choices, with "not in the cell" for slots 2 to 4.
  const rateOptions = RATES.map((x) => [x.id, rateName(x)] as const);
  // The same, with the empty choice first.
  const rateOptionsOff = [["off", t("rateOff")] as const, ...rateOptions];
  /** Set one slot's field. */
  const setSlot = (i: number, patch: Partial<SlotForm>) => setForm(form.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  /** Microseconds, worded. */
  const us = (v: number): string => t("us", { v: nf2.format(v) });

  /** The worked account of one client's frame. */
  const workSteps = (c: ClientResult): { where: string; text: string }[] => {
    // The account, step by step.
    const out: { where: string; text: string }[] = [];
    // 802.11ac frames start with RTS and CTS.
    if (c.rate.phy === "vht") out.push({ where: t("stepProtection"), text: t("workProtection", { ctl: CONTROL_RATE_MBPS, v: us(c.parts.protection) }) });
    // The preamble(s).
    out.push({ where: t("stepPreamble"), text: c.rate.phy === "vht" ? t("workPreambleVht", { v: us(c.parts.preamble) }) : t("workPreambleLegacy", { v: us(c.parts.preamble) }) });
    // The payload.
    out.push({ where: t("stepPayload"), text: t(c.rate.phy === "vht" ? "workPayloadVht" : "workPayloadLegacy", { bytes: nf0.format(c.bytes), mbps: nfRate.format(c.rate.mbps), v: us(c.parts.payload) }) });
    // The acknowledgement.
    out.push({ where: t("stepAck"), text: t(c.rate.phy === "vht" ? "workBlockAck" : "workAck", { ctl: CONTROL_RATE_MBPS, v: us(c.parts.ack) }) });
    // The whole.
    out.push({ where: t("stepTotal"), text: t("workTotal", { v: us(c.parts.total), share: pct.format(c.payloadShare) }) });
    // Done.
    return out;
  };

  /** The result block for a valid input. */
  const resultBlock = (res: AirtimeResult) => {
    // The slowest client's line.
    const slow = res.clients.find((c) => c.slot === res.slowest) as ClientResult;
    // How many clients are in the cell.
    const count = res.clients.length;
    // The slowest holding more than twice an even share is the case to flag.
    const hogs = count > 1 && slow.roundShare > 2 / count;
    // The verdict sentence.
    const verdict =
      count === 1
        ? t("verdictAlone", { n: slow.slot + 1, v: us(slow.parts.total), cell: nf2.format(res.cellMbps) })
        : t(hogs ? "verdictHog" : "verdictFair", {
            n: slow.slot + 1,
            rate: rateName(slow.rate),
            share: pct.format(slow.roundShare),
            cell: nf2.format(res.cellMbps),
            without: nf2.format(res.cellWithoutMbps ?? 0),
          });
    return (
      <>
        {/* The slowest client's frame, part by part. */}
        <p className="lab-note">{t("workTitle", { n: slow.slot + 1, rate: rateName(slow.rate) })}</p>
        <ol className="lab-steps">
          {workSteps(slow).map((s, k) => (
            <li className="lab-step" key={k}>
              <span className="lab-step-where">{s.where}</span> {s.text}
            </li>
          ))}
        </ol>
        {/* Every client: its frame's airtime, its payload share and its share of the round. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colClient")}</th>
                <th scope="col">{t("colFrame")}</th>
                <th scope="col">{t("colPayload")}</th>
                <th scope="col">{t("colRound")}</th>
              </tr>
            </thead>
            <tbody>
              {res.clients.map((c) => (
                <tr key={c.slot}>
                  <th scope="row">{t("clientCell", { n: c.slot + 1, rate: rateName(c.rate), bytes: nf0.format(c.bytes) })}</th>
                  <td>{us(c.parts.total)}</td>
                  <td>{pct.format(c.payloadShare)}</td>
                  <td>{pct.format(c.roundShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The round and what the cell moves, with and without the slowest client. */}
        <dl className="lab-kv">
          <dt>{t("kvRound")}</dt>
          <dd>{us(res.roundUs)}</dd>
          <dt>{t("kvCell")}</dt>
          <dd>{t("mbps", { v: nf2.format(res.cellMbps) })}</dd>
          {res.cellWithoutMbps !== null && (
            <>
              <dt>{t("kvWithout", { n: slow.slot + 1 })}</dt>
              <dd>{t("mbps", { v: nf2.format(res.cellWithoutMbps) })}</dd>
            </>
          )}
        </dl>
        {/* The outcome in one sentence. */}
        <p>
          <span className={`lab-verdict lab-verdict--${hogs ? "warn" : "ok"}`}>{verdict}</span>
        </p>
      </>
    );
  };

  // The refusal, worded for the reader.
  const errText = err === "bad-bytes" ? t("errorBytes", { n: (errSlot ?? 0) + 1, min: nf0.format(MIN_FRAME_BYTES), max: nf0.format(MAX_FRAME_BYTES) }) : t("errorOther");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          {form.map((s, i) => (
            <div className="lab-field" key={i}>
              {/* The slot's rate: the first slot is always in the cell. */}
              <LabField id={`${ID}-rate-${i + 1}`} label={t("rate", { n: i + 1 })}>
                <LabSelect id={`${ID}-rate-${i + 1}`} value={s.rate} options={i === 0 ? rateOptions : rateOptionsOff} onChange={(v) => setSlot(i, { rate: v })} />
              </LabField>
              {/* Its frame size, when the slot is in use. */}
              {s.rate !== "off" && (
                <LabField id={`${ID}-bytes-${i + 1}`} label={t("bytes", { n: i + 1 })}>
                  <input
                    id={`${ID}-bytes-${i + 1}`}
                    className="lab-input"
                    type="number"
                    inputMode="numeric"
                    min={MIN_FRAME_BYTES}
                    max={MAX_FRAME_BYTES}
                    step={1}
                    value={s.bytes}
                    aria-invalid={err === "bad-bytes" && errSlot === i ? "true" : undefined}
                    onChange={(e) => setSlot(i, { bytes: e.target.value })}
                  />
                </LabField>
              )}
            </div>
          ))}
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
