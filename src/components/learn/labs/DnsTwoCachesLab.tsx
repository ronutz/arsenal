"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/DnsTwoCachesLab.tsx
// ----------------------------------------------------------------------------
// THE TWO-CACHES LAB (2026-10-26), embedded in "Authoritative vs
// Non-Authoritative Answers" as <Lab id="dns-two-caches" />. Two number inputs
// (the TTL, the moment the client asks) and three selects (the kind of change,
// whether the authority answers, serve-stale); the result is a table of the
// three answers a client would get at that moment, from the zone's own server
// and from two resolvers that cached the name 20 seconds apart, with a verdict
// on whether they agree. The model is src/lib/labs/dns-two-caches/compute.ts;
// its checked cases are the golden vectors beside it.
// Words: "learnLabs.dns-two-caches".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  CHANGE_AT,
  compute,
  DEFAULT_INPUT,
  DnsTwoCachesError,
  EXAMPLE_INPUT,
  FILLED_A,
  FILLED_B,
  MAX_NOW,
  MAX_TTL,
  type Answer,
  type Change,
  type DnsTwoCachesErrorCode,
  type DnsTwoCachesInput,
  type DnsTwoCachesResult,
  type ResolverReply,
} from "@/lib/labs/dns-two-caches/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "dns-two-caches";

/** The form as typed: number fields stay text so the reader can edit freely. */
interface Form {
  /** The TTL in seconds, as typed. */
  ttl: string;
  /** The moment the client asks, as typed. */
  now: string;
  /** The change at 30 s. */
  change: Change;
  /** "up" or "down". */
  authority: "up" | "down";
  /** "on" or "off". */
  stale: "on" | "off";
}

/** A model input as the form shows it. */
function toForm(i: DnsTwoCachesInput): Form {
  // Numbers become text; booleans become select values.
  return { ttl: String(i.ttl), now: String(i.now), change: i.change, authority: i.authorityUp ? "up" : "down", stale: i.serveStale ? "on" : "off" };
}

/** Read a typed whole number; an empty field is not a number. */
function readNumber(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

export default function DnsTwoCachesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.dns-two-caches");
  // The page's language, for number formatting.
  const locale = useLocale();
  // The reader's settings, opening on the split answer.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or the code it refused the input with.
  let r: DnsTwoCachesResult | null = null;
  // The refusal code, when there is one.
  let err: DnsTwoCachesErrorCode | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({ ttl: readNumber(form.ttl), now: readNumber(form.now), change: form.change, authorityUp: form.authority === "up", serveStale: form.stale === "on" });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof DnsTwoCachesError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err === "bad-ttl" ? t("errorTtl", { max: nf.format(MAX_TTL) }) : err === "bad-now" ? t("errorNow", { min: nf.format(FILLED_B), max: nf.format(MAX_NOW) }) : err ? t("errorChoice") : null;

  // The change options.
  const changeOptions = [
    ["change", t("changeAddress")],
    ["create", t("changeCreate")],
    ["remove", t("changeRemove")],
  ] as const;
  // The authority options.
  const authorityOptions = [
    ["up", t("authorityUp")],
    ["down", t("authorityDown")],
  ] as const;
  // The serve-stale options.
  const staleOptions = [
    ["off", t("staleOff")],
    ["on", t("staleOn")],
  ] as const;

  /** An answer as the reader reads it: addresses and codes as they are. */
  const answerText = (a: Answer): string => a;
  /** Why a resolver answered as it did. */
  const why = (rep: ResolverReply): string =>
    rep.source === "cache"
      ? t("whyCache", { age: nf.format(rep.age) })
      : rep.source === "fetched"
        ? t("whyFetched", { age: nf.format(rep.age) })
        : rep.source === "stale"
          ? t("whyStale")
          : t("whyFailed");

  /** The result block for a valid input. */
  const resultBlock = (res: DnsTwoCachesResult) => {
    // The verdict: do two clients asking now get the same answer, and is it the zone's?
    const verdict = res.disagree ? t("verdictDisagree") : res.behind ? t("verdictBehind") : res.authority === null ? t("verdictNoAuthority") : t("verdictAgree");
    // Disagreement or lag is a warning; agreement with the zone is good news.
    const tone = res.disagree || res.behind ? "warn" : res.authority === null ? "warn" : "ok";
    return (
      <>
        {/* The lab's clock. */}
        <p className="lab-note">{t("timeline", { a: nf.format(FILLED_A), b: nf.format(FILLED_B), change: nf.format(CHANGE_AT), now: nf.format(readNumber(form.now)) })}</p>
        {/* The three answers. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colAsked")}</th>
                <th scope="col">{t("colAnswer")}</th>
                <th scope="col">{t("colTtl")}</th>
                <th scope="col">{t("colAa")}</th>
                <th scope="col">{t("colWhy")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{t("rowAuthority")}</th>
                <td className="mono">{res.authority === null ? t("noAnswer") : answerText(res.authority)}</td>
                <td>{res.authority === null ? t("none") : t("seconds", { s: nf.format(readNumber(form.ttl)) })}</td>
                <td>{res.authority === null ? t("none") : t("aaSet")}</td>
                <td>{res.authority === null ? t("whyAuthorityDown") : t("whyAuthority")}</td>
              </tr>
              {res.resolvers.map((rep) => (
                <tr key={rep.name}>
                  <th scope="row">{rep.name === "A" ? t("rowA", { at: nf.format(rep.filledAt) }) : t("rowB", { at: nf.format(rep.filledAt) })}</th>
                  <td className="mono">{answerText(rep.answer)}</td>
                  <td>{rep.ttl === null ? t("none") : t("seconds", { s: nf.format(rep.ttl) })}</td>
                  <td>{t("aaClear")}</td>
                  <td>{why(rep)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* What it means for two clients asking now. */}
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
          <LabField id={`${ID}-ttl`} label={t("ttl")}>
            <input id={`${ID}-ttl`} className="lab-input" type="number" inputMode="decimal" min={1} max={MAX_TTL} step={1} value={form.ttl} aria-invalid={err === "bad-ttl" ? "true" : undefined} onChange={(e) => setForm({ ...form, ttl: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-now`} label={t("now")}>
            <input id={`${ID}-now`} className="lab-input" type="number" inputMode="decimal" min={FILLED_B} max={MAX_NOW} step={1} value={form.now} aria-invalid={err === "bad-now" ? "true" : undefined} onChange={(e) => setForm({ ...form, now: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-change`} label={t("change")}>
            <LabSelect id={`${ID}-change`} value={form.change} options={changeOptions} onChange={(v) => setForm({ ...form, change: v as Change })} />
          </LabField>
          <LabField id={`${ID}-authority`} label={t("authority")}>
            <LabSelect id={`${ID}-authority`} value={form.authority} options={authorityOptions} onChange={(v) => setForm({ ...form, authority: v as "up" | "down" })} />
          </LabField>
          <LabField id={`${ID}-stale`} label={t("stale")}>
            <LabSelect id={`${ID}-stale`} value={form.stale} options={staleOptions} onChange={(v) => setForm({ ...form, stale: v as "on" | "off" })} />
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
