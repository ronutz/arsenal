"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/CmpConcentrationLab.tsx
// ----------------------------------------------------------------------------
// THE CMP CONCENTRATION LAB (2026-10-26), embedded in "iRules, CMP, and the
// static:: namespace" as <Lab id="cmp-concentration" />. A request rate, a
// TMM count, how the iRule keeps shared state, and (for a subtable) the table
// operations each request makes; then the load on the busiest TMM, its share,
// the TMMs left idle for this virtual server, the table work on the subtable's
// processor, and a verdict. The model is src/lib/labs/cmp-concentration/
// compute.ts; its checked cases are the golden vectors beside it.
// Words: "learnLabs.cmp-concentration".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { CmpError, compute, DEFAULT_INPUT, EXAMPLE_INPUT, MAX_RATE, MAX_TABLE_OPS, MAX_TMMS, type CmpErrorCode, type CmpInput, type CmpResult, type StatePattern } from "@/lib/labs/cmp-concentration/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "cmp-concentration";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** Requests per second, as typed. */
  rate: string;
  /** TMM instances, as typed. */
  tmms: string;
  /** How the iRule keeps shared state. */
  pattern: StatePattern;
  /** Table operations per request, as typed. */
  ops: string;
}

/** A model input as the form shows it. */
function toForm(i: CmpInput): Form {
  // Numbers become text; the pattern stays as it is.
  return { rate: String(i.rate), tmms: String(i.tmms), pattern: i.pattern, ops: String(i.tableOpsPerRequest) };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function CmpConcentrationLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.cmp-concentration");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on an even spread.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Shares as percentages with one decimal.
  const pf = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  // The model's answer, or the code it refused the input with.
  let r: CmpResult | null = null;
  // The refusal code, when there is one.
  let err: CmpErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ rate: readNumber(form.rate), tmms: readNumber(form.tmms), pattern: form.pattern, tableOpsPerRequest: readNumber(form.ops) });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof CmpError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-rate"
      ? t("errorRate", { max: nf.format(MAX_RATE) })
      : err === "bad-tmms"
        ? t("errorTmms", { max: nf.format(MAX_TMMS) })
        : err === "bad-ops"
          ? t("errorOps", { max: nf.format(MAX_TABLE_OPS) })
          : err
            ? t("errorPattern")
            : null;
  // The three ways of keeping shared state.
  const patternOptions = [
    ["spread", t("patternSpread")],
    ["global", t("patternGlobal")],
    ["subtable", t("patternSubtable")],
  ] as const;
  // The table-operations field matters only with the subtable.
  const subtable = form.pattern === "subtable";

  /** The result block for a valid input. */
  const resultBlock = (res: CmpResult) => {
    // The TMM count as typed, formatted.
    const tmms = nf.format(readNumber(form.tmms));
    // The verdict for the pattern.
    const verdict = res.demoted
      ? t("verdictDemoted", { idle: nf.format(res.idleTmms), tmms })
      : res.subtableOpsOnOne !== null
        ? t("verdictSubtable", { ops: nf.format(res.subtableOpsOnOne), tmms })
        : t("verdictSpread", { tmms });
    // A spread is the goal; a subtable is a warning; a demotion is a stop (on one TMM there is nothing to lose).
    const tone = res.demoted && res.idleTmms > 0 ? "stop" : res.subtableOpsOnOne !== null && res.subtableOpsOnOne > 0 ? "warn" : "ok";
    return (
      <>
        {/* The figures, name and value. */}
        <dl className="lab-kv">
          <dt>{t("kvBusiest")}</dt>
          <dd>{t("rateValue", { rate: nf.format(res.busiestRequests) })}</dd>
          <dt>{t("kvShare")}</dt>
          <dd>{pf.format(res.busiestShare)}</dd>
          <dt>{t("kvIdle")}</dt>
          <dd>{nf.format(res.idleTmms)}</dd>
          {res.subtableOpsOnOne !== null && (
            <>
              <dt>{t("kvSubtable")}</dt>
              <dd>{t("opsValue", { ops: nf.format(res.subtableOpsOnOne) })}</dd>
            </>
          )}
        </dl>
        {/* What the pattern does to this virtual server. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-rate`} label={t("rate")}>
            <input id={`${ID}-rate`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_RATE} step="any" value={form.rate} aria-invalid={err === "bad-rate" ? "true" : undefined} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-tmms`} label={t("tmms")}>
            <input id={`${ID}-tmms`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_TMMS} step={1} value={form.tmms} aria-invalid={err === "bad-tmms" ? "true" : undefined} onChange={(e) => setForm({ ...form, tmms: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-pattern`} label={t("pattern")}>
            <LabSelect id={`${ID}-pattern`} value={form.pattern} options={patternOptions} onChange={(v) => setForm({ ...form, pattern: v as StatePattern })} />
          </LabField>
          <LabField id={`${ID}-ops`} label={t("ops")}>
            <input id={`${ID}-ops`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_TABLE_OPS} step={1} value={form.ops} disabled={!subtable} aria-invalid={err === "bad-ops" ? "true" : undefined} onChange={(e) => setForm({ ...form, ops: e.target.value })} />
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
