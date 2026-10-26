"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/SnatPortBudgetLab.tsx
// ----------------------------------------------------------------------------
// THE SNAT PORT BUDGET LAB (2026-10-26), embedded in "SNAT and the
// Return-Traffic Problem" as <Lab id="snat-port-budget" />. A SNAT choice, the
// member's return route (which matters only without SNAT), the translation
// addresses, the source ports planned on each and the peak of concurrent
// connections to the busiest member; then what the member sees, where its
// reply goes, the port budget towards it, the share the peak uses and a
// verdict. The model is src/lib/labs/snat-port-budget/compute.ts; its checked
// cases are the golden vectors beside it. Words: "learnLabs.snat-port-budget".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import { compute, DEFAULT_INPUT, EXAMPLE_INPUT, MAX_ADDRESSES, MAX_DEMAND, MAX_PORTS, SnatError, type ReturnPath, type SnatErrorCode, type SnatInput, type SnatMode, type SnatResult } from "@/lib/labs/snat-port-budget/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "snat-port-budget";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** No SNAT, or SNAT. */
  mode: SnatMode;
  /** The member's return route without SNAT. */
  returnPath: ReturnPath;
  /** Translation addresses, as typed. */
  addresses: string;
  /** Ports per address, as typed. */
  ports: string;
  /** Peak concurrent connections, as typed. */
  demand: string;
}

/** A model input as the form shows it. */
function toForm(i: SnatInput): Form {
  // Choices stay as they are; numbers become text.
  return { mode: i.mode, returnPath: i.returnPath, addresses: String(i.addresses), ports: String(i.portsPerAddress), demand: String(i.demand) };
}

/** Read a typed number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function SnatPortBudgetLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.snat-port-budget");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on a budget that is nearly full.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Shares as percentages with one decimal.
  const pf = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  // The model's answer, or the code it refused the input with.
  let r: SnatResult | null = null;
  // The refusal code, when there is one.
  let err: SnatErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ mode: form.mode, returnPath: form.returnPath, addresses: readNumber(form.addresses), portsPerAddress: readNumber(form.ports), demand: readNumber(form.demand) });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof SnatError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    err === "bad-addresses"
      ? t("errorAddresses", { max: nf.format(MAX_ADDRESSES) })
      : err === "bad-ports"
        ? t("errorPorts", { max: nf.format(MAX_PORTS) })
        : err === "bad-demand"
          ? t("errorDemand", { max: nf.format(MAX_DEMAND) })
          : err
            ? t("errorMode")
            : null;
  // The SNAT choices.
  const modeOptions = [
    ["snat", t("modeSnat")],
    ["none", t("modeNone")],
  ] as const;
  // The return-route choices.
  const returnOptions = [
    ["bypass", t("returnBypass")],
    ["through", t("returnThrough")],
  ] as const;
  // Without SNAT the counts do not apply.
  const noSnat = form.mode === "none";

  /** The result block for a valid input. */
  const resultBlock = (res: SnatResult) => {
    // The verdict for how the case ends.
    const verdict =
      res.outcome === "no-snat-ok"
        ? t("verdictNoSnatOk")
        : res.outcome === "reply-bypasses"
          ? t("verdictBypass")
          : res.outcome === "fits"
            ? t("verdictFits", { spare: nf.format(res.spare ?? 0) })
            : res.outcome === "full"
              ? t("verdictFull")
              : t("verdictExceeds", { shortfall: nf.format(res.shortfall ?? 0) });
    // A working path is good news, a full budget a warning, a bypass or a shortfall a stop.
    const tone = res.outcome === "no-snat-ok" || res.outcome === "fits" ? "ok" : res.outcome === "full" ? "warn" : "stop";
    return (
      <>
        {/* What the member sees and where its reply goes, then the budget when there is one. */}
        <dl className="lab-kv">
          <dt>{t("kvSees")}</dt>
          <dd>{res.memberSees === "client" ? t("seesClient") : t("seesTranslation")}</dd>
          <dt>{t("kvReply")}</dt>
          <dd>{res.replyThroughBigip ? t("replyThrough") : t("replyBypass")}</dd>
          {res.budget !== null && (
            <>
              <dt>{t("kvBudget")}</dt>
              <dd>{t("budgetValue", { addresses: nf.format(readNumber(form.addresses)), ports: nf.format(readNumber(form.ports)), budget: nf.format(res.budget) })}</dd>
              <dt>{t("kvUse")}</dt>
              <dd>{t("useValue", { demand: nf.format(readNumber(form.demand)), budget: nf.format(res.budget), share: pf.format(res.share ?? 0) })}</dd>
            </>
          )}
        </dl>
        {/* How it ends. */}
        <p>
          <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
        </p>
        {/* The platform's own early warning is a different measure from the share shown. */}
        {res.budget !== null && <p className="lab-note">{t("portFindNote")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-mode`} label={t("mode")}>
            <LabSelect id={`${ID}-mode`} value={form.mode} options={modeOptions} onChange={(v) => setForm({ ...form, mode: v as SnatMode })} />
          </LabField>
          <LabField id={`${ID}-return`} label={t("returnPath")}>
            <LabSelect id={`${ID}-return`} value={form.returnPath} options={returnOptions} onChange={(v) => setForm({ ...form, returnPath: v as ReturnPath })} />
          </LabField>
          <LabField id={`${ID}-addresses`} label={t("addresses")}>
            <input id={`${ID}-addresses`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_ADDRESSES} step={1} value={form.addresses} disabled={noSnat} aria-invalid={err === "bad-addresses" ? "true" : undefined} onChange={(e) => setForm({ ...form, addresses: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-ports`} label={t("ports")}>
            <input id={`${ID}-ports`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_PORTS} step={1} value={form.ports} disabled={noSnat} aria-invalid={err === "bad-ports" ? "true" : undefined} onChange={(e) => setForm({ ...form, ports: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-demand`} label={t("demand")}>
            <input id={`${ID}-demand`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_DEMAND} step={1} value={form.demand} disabled={noSnat} aria-invalid={err === "bad-demand" ? "true" : undefined} onChange={(e) => setForm({ ...form, demand: e.target.value })} />
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
