"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/DhcpLeaseStatesLab.tsx
// ----------------------------------------------------------------------------
// THE DHCP LEASE LAB (2026-10-26), embedded in "DHCP: the Lease Lifecycle
// Behind Automatic Addressing" as <Lab id="dhcp-lease-states" />. Two number
// inputs (lease length, time into the lease) and three selects (lease or none,
// where the server is, whether it answers); the result is the lease's timers
// and a three-step account: the client's state, what it sends, how it ends.
// The model is src/lib/labs/dhcp-lease-states/compute.ts; its checked cases
// are the golden vectors beside it. Words: "learnLabs.dhcp-lease-states".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  DhcpLeaseError,
  EXAMPLE_INPUT,
  MAX_ELAPSED_PCT,
  MAX_LEASE,
  MIN_LEASE,
  type ClientStart,
  type DhcpLeaseErrorCode,
  type DhcpLeaseInput,
  type DhcpLeaseResult,
  type ServerPlace,
} from "@/lib/labs/dhcp-lease-states/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "dhcp-lease-states";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** Lease length in seconds, as typed. */
  lease: string;
  /** Time into the lease in per cent, as typed. */
  elapsedPct: string;
  /** Lease or none. */
  start: ClientStart;
  /** Where the server is. */
  server: ServerPlace;
  /** "yes" when the server answers. */
  answers: "yes" | "no";
}

/** A model input as the form shows it. */
function toForm(i: DhcpLeaseInput): Form {
  // Numbers become text; the boolean becomes a select value.
  return { lease: String(i.lease), elapsedPct: String(i.elapsedPct), start: i.start, server: i.server, answers: i.answers ? "yes" : "no" };
}

/** Read a typed number, accepting a decimal comma; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function DhcpLeaseStatesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.dhcp-lease-states");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on a renewal.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // Up to one decimal, for seconds that fall between whole numbers.
  const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  // Up to two decimals, for days, hours and minutes.
  const nf2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  /** A duration in seconds, with days, hours or minutes beside it when they help. */
  const dur = (s: number): string =>
    s >= 86400
      ? t("durDays", { s: nf1.format(s), n: nf2.format(s / 86400) })
      : s >= 3600
        ? t("durHours", { s: nf1.format(s), n: nf2.format(s / 3600) })
        : s >= 60
          ? t("durMinutes", { s: nf1.format(s), n: nf2.format(s / 60) })
          : t("durSeconds", { s: nf1.format(s) });

  // The model's answer, or the code it refused the input with.
  let r: DhcpLeaseResult | null = null;
  // The refusal code, when there is one.
  let err: DhcpLeaseErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ lease: readNumber(form.lease), elapsedPct: readNumber(form.elapsedPct), start: form.start, server: form.server, answers: form.answers === "yes" });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof DhcpLeaseError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-lease" ? t("errorLease", { min: nf0.format(MIN_LEASE), max: nf0.format(MAX_LEASE) }) : err === "bad-elapsed" ? t("errorElapsed", { max: nf0.format(MAX_ELAPSED_PCT) }) : err ? t("errorChoice") : null;

  // The select options, in the page's language.
  const startOptions = [
    ["holding", t("startHolding")],
    ["no-lease", t("startNone")],
  ] as const;
  // Where the server can be.
  const serverOptions = [
    ["same-subnet", t("serverSame")],
    ["remote-relay", t("serverRelay")],
    ["remote-no-relay", t("serverNoRelay")],
  ] as const;
  // Whether it answers.
  const answerOptions = [
    ["yes", t("answersYes")],
    ["no", t("answersNo")],
  ] as const;

  /** The result block for a valid input. */
  const resultBlock = (res: DhcpLeaseResult) => {
    // Step 1: the state at this moment.
    const state =
      res.stateNow === "INIT" ? t("stateInit") : res.stateNow === "BOUND" ? t("stateBound") : res.stateNow === "RENEWING" ? t("stateRenewing") : res.stateNow === "REBINDING" ? t("stateRebinding") : t("stateExpired");
    // Step 2: the message, then how far it gets.
    const sends =
      res.message === "none"
        ? t("sendsNone", { time: dur(res.untilNext ?? 0) })
        : (res.message === "discover" ? t("sendsDiscover") : res.message === "request-unicast" ? t("sendsUnicast") : t("sendsBroadcast")) +
          (res.message === "request-unicast" ? "" : res.viaRelay ? " " + t("reachRelay") : !res.reaches ? " " + t("reachNoRelay") : "");
    // Step 3: the verdict.
    const verdict =
      res.outcome === "bound-quiet"
        ? t("resultBoundQuiet")
        : res.outcome === "leased"
          ? t("resultLeased")
          : res.outcome === "no-offer"
            ? res.failReason === "no-relay"
              ? t("resultNoOfferNoRelay")
              : t("resultNoOfferSilent")
            : res.outcome === "renewed"
              ? t("resultRenewed")
              : res.outcome === "waiting-renewing"
                ? t("resultWaitingRenewing", { retry: dur(res.nextRetry ?? 0), next: dur(res.untilNext ?? 0) })
                : res.outcome === "rebound"
                  ? t("resultRebound")
                  : res.failReason === "no-relay"
                    ? t("resultWaitingRebindingNoRelay", { retry: dur(res.nextRetry ?? 0), next: dur(res.untilNext ?? 0) })
                    : t("resultWaitingRebindingSilent", { retry: dur(res.nextRetry ?? 0), next: dur(res.untilNext ?? 0) });
    // Good news is green, a wait or an expiry amber, no address at all red.
    const tone = res.outcome === "no-offer" ? "stop" : res.outcome.startsWith("waiting") || res.expired ? "warn" : "ok";
    // A missing relay hides while the lease is renewed by unicast.
    const hidden = form.server === "remote-no-relay" && (res.outcome === "renewed" || res.outcome === "bound-quiet");
    return (
      <>
        {/* The lease's timers, from the start of the lease. */}
        {form.start === "holding" && (
          <dl className="lab-kv">
            <dt>{t("kvT1")}</dt>
            <dd>{dur(res.t1)}</dd>
            <dt>{t("kvT2")}</dt>
            <dd>{dur(res.t2)}</dd>
            <dt>{t("kvExpiry")}</dt>
            <dd>{dur(res.expiry)}</dd>
            <dt>{t("kvNow")}</dt>
            <dd>{dur(res.elapsed)}</dd>
          </dl>
        )}
        {/* The three steps, in order. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepState")}</span> {state}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepSends")}</span> {sends}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* The standing hazard a successful renewal hides. */}
        {hidden && <p className="lab-note">{t("noteRelayHidden")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-lease`} label={t("lease")}>
            <input
              id={`${ID}-lease`}
              className="lab-input"
              type="number"
              inputMode="decimal"
              min={MIN_LEASE}
              max={MAX_LEASE}
              step={1}
              value={form.lease}
              aria-invalid={err === "bad-lease" ? "true" : undefined}
              onChange={(e) => setForm({ ...form, lease: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-elapsed`} label={t("elapsed")}>
            <input
              id={`${ID}-elapsed`}
              className="lab-input"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_ELAPSED_PCT}
              step="any"
              value={form.elapsedPct}
              aria-invalid={err === "bad-elapsed" ? "true" : undefined}
              onChange={(e) => setForm({ ...form, elapsedPct: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-start`} label={t("start")}>
            <LabSelect id={`${ID}-start`} value={form.start} options={startOptions} onChange={(v) => setForm({ ...form, start: v as ClientStart })} />
          </LabField>
          <LabField id={`${ID}-server`} label={t("server")}>
            <LabSelect id={`${ID}-server`} value={form.server} options={serverOptions} onChange={(v) => setForm({ ...form, server: v as ServerPlace })} />
          </LabField>
          <LabField id={`${ID}-answers`} label={t("answers")}>
            <LabSelect id={`${ID}-answers`} value={form.answers} options={answerOptions} onChange={(v) => setForm({ ...form, answers: v as "yes" | "no" })} />
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
