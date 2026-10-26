"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/BfdVersusHellosLab.tsx
// ----------------------------------------------------------------------------
// THE BFD-VERSUS-HELLOS LAB (2026-10-26), embedded in "BFD: when a link is up
// and dead at the same time" as <Lab id="bfd-versus-hellos" />. Two selects (what the route
// depends on, how BFD runs) and three number inputs (remote Desired Min TX,
// local Required Min RX, remote Detect Mult); the result is the two detection
// times side by side and a three-step account of who notices the dead path
// and when the route goes. The model is
// src/lib/labs/bfd-versus-hellos/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.bfd-versus-hellos".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  BfdVersusHellosError,
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  MAX_INTERVAL_MS,
  MAX_MULT,
  type BfdMode,
  type BfdVersusHellosErrorCode,
  type BfdVersusHellosInput,
  type BfdVersusHellosResult,
  type Client,
} from "@/lib/labs/bfd-versus-hellos/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "bfd-versus-hellos";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** What the route depends on. */
  client: Client;
  /** How BFD runs. */
  bfd: BfdMode;
  /** Remote Desired Min TX in ms, as typed. */
  remoteTxMs: string;
  /** Local Required Min RX in ms, as typed. */
  localRxMs: string;
  /** Remote Detect Mult, as typed. */
  remoteMult: string;
}

/** A model input as the form shows it. */
function toForm(i: BfdVersusHellosInput): Form {
  // Numbers become text.
  return { client: i.client, bfd: i.bfd, remoteTxMs: String(i.remoteTxMs), localRxMs: String(i.localRxMs), remoteMult: String(i.remoteMult) };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function BfdVersusHellosLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.bfd-versus-hellos");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on OSPF with BFD at FRRouting's defaults.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Milliseconds with up to three decimals.
  const nfMs = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
  // Seconds and ratios with up to one decimal.
  const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  /** A time in milliseconds, with seconds beside it from one second up. */
  const time = (ms: number): string => (ms >= 1000 ? t("msAndS", { ms: nfMs.format(ms), s: nf1.format(ms / 1000) }) : t("ms", { ms: nfMs.format(ms) }));

  // The model's answer, or the code it refused the input with.
  let r: BfdVersusHellosResult | null = null;
  // The refusal code, when there is one.
  let err: BfdVersusHellosErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ client: form.client, bfd: form.bfd, remoteTxMs: readNumber(form.remoteTxMs), localRxMs: readNumber(form.localRxMs), remoteMult: readNumber(form.remoteMult) });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof BfdVersusHellosError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-interval" ? t("errorInterval", { max: nfMs.format(MAX_INTERVAL_MS) }) : err === "bad-mult" ? t("errorMult", { max: MAX_MULT }) : err ? t("errorChoice") : null;
  // Which interval field is at fault (both are checked together).
  const badInterval = err === "bad-interval";

  // The client options.
  const clientOptions = [
    ["ospf", t("clientOspf")],
    ["bgp", t("clientBgp")],
    ["static", t("clientStatic")],
  ] as const;
  // The BFD options.
  const bfdOptions = [
    ["registered", t("bfdRegistered")],
    ["unregistered", t("bfdUnregistered")],
    ["off", t("bfdOff")],
  ] as const;
  // The client's short name, for the sentences.
  const clientName = form.client === "ospf" ? t("nameOspf") : form.client === "bgp" ? t("nameBgp") : t("nameStatic");

  /** The result block for a valid input. */
  const resultBlock = (res: BfdVersusHellosResult) => {
    // Step 2: what BFD does.
    const bfdLine = res.bfdMs === null ? t("bfdLineOff") : res.bfdHeard ? t("bfdLineHeard", { time: time(res.bfdMs), client: clientName }) : t("bfdLineUnheard", { time: time(res.bfdMs), client: clientName });
    // Step 3: what the protocol's own timer does.
    const protoLine = form.client === "ospf" ? t("protoOspf", { time: time(res.protocolMs ?? 0) }) : form.client === "bgp" ? t("protoBgp", { time: time(res.protocolMs ?? 0) }) : t("protoStatic");
    // The verdict: when the route goes, and who made it go.
    const verdict =
      res.detectedBy === "nobody"
        ? t("verdictNever")
        : res.detectedBy === "bfd"
          ? res.speedup !== null
            ? t("verdictBfdFaster", { time: time(res.withdrawnMs ?? 0), x: nf1.format(res.speedup) })
            : t("verdictBfd", { time: time(res.withdrawnMs ?? 0) })
          : t("verdictProtocol", { time: time(res.withdrawnMs ?? 0) });
    // BFD in time is good news, the protocol's own timer a warning, never a stop.
    const tone = res.detectedBy === "bfd" ? "ok" : res.detectedBy === "protocol" ? "warn" : "stop";
    return (
      <>
        {/* The two detection times. */}
        <dl className="lab-kv">
          <dt>{t("kvAgreed")}</dt>
          <dd>{res.agreedMs === null ? t("none") : time(res.agreedMs)}</dd>
          <dt>{t("kvBfd")}</dt>
          <dd>{res.bfdMs === null ? t("none") : time(res.bfdMs)}</dd>
          <dt>{t("kvProtocol")}</dt>
          <dd>{res.protocolMs === null ? t("none") : time(res.protocolMs)}</dd>
        </dl>
        {/* The account, in order. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepPort")}</span> {t("portLine")}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepBfd")}</span> {bfdLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepProtocol")}</span> {protoLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepRoute")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-client`} label={t("client")}>
            <LabSelect id={`${ID}-client`} value={form.client} options={clientOptions} onChange={(v) => setForm({ ...form, client: v as Client })} />
          </LabField>
          <LabField id={`${ID}-bfd`} label={t("bfd")}>
            <LabSelect id={`${ID}-bfd`} value={form.bfd} options={bfdOptions} onChange={(v) => setForm({ ...form, bfd: v as BfdMode })} />
          </LabField>
          <LabField id={`${ID}-remote-tx`} label={t("remoteTx")}>
            <input id={`${ID}-remote-tx`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_INTERVAL_MS} step="any" value={form.remoteTxMs} aria-invalid={badInterval ? "true" : undefined} onChange={(e) => setForm({ ...form, remoteTxMs: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-local-rx`} label={t("localRx")}>
            <input id={`${ID}-local-rx`} className="lab-input" type="number" inputMode="decimal" min={0} max={MAX_INTERVAL_MS} step="any" value={form.localRxMs} aria-invalid={badInterval ? "true" : undefined} onChange={(e) => setForm({ ...form, localRxMs: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-remote-mult`} label={t("remoteMult")}>
            <input id={`${ID}-remote-mult`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_MULT} step={1} value={form.remoteMult} aria-invalid={err === "bad-mult" ? "true" : undefined} onChange={(e) => setForm({ ...form, remoteMult: e.target.value })} />
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
