"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/HttpFreshnessLab.tsx
// ----------------------------------------------------------------------------
// THE HTTP FRESHNESS LAB (2026-10-26), embedded in "HTTP caching and
// personalised content" as <Lab id="http-freshness" />. Two selects (the kind
// of cache, its heuristic), the Cache-Control value as text and five number
// fields (Date, Age, Expires, Last-Modified, time since receipt); the result
// is a six-step account: may it be stored, its freshness lifetime and where it
// came from, its current age, fresh or stale, and what the cache does when the
// origin answers and when it cannot be reached. The model is
// src/lib/labs/http-freshness/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.http-freshness".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  HttpFreshnessError,
  MAX_CC_LENGTH,
  MAX_SECONDS,
  type CacheKind,
  type Heuristic,
  type HttpFreshnessInput,
  type HttpFreshnessResult,
} from "@/lib/labs/http-freshness/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "http-freshness";

/** The form as typed: number fields stay text so the reader can edit freely, and an empty field means "no header". */
interface Form {
  /** Shared or private. */
  cache: CacheKind;
  /** The Cache-Control value. */
  cacheControl: string;
  /** Date, seconds before receipt. */
  date: string;
  /** Age, or empty. */
  age: string;
  /** Expires, seconds after Date, or empty. */
  expires: string;
  /** Last-Modified, seconds before Date, or empty. */
  lastModified: string;
  /** The cache's heuristic. */
  heuristic: Heuristic;
  /** Seconds since receipt. */
  received: string;
}

/** A model input as the form shows it. */
function toForm(i: HttpFreshnessInput): Form {
  // Numbers become text; null becomes an empty field.
  const s = (n: number | null): string => (n === null ? "" : String(n));
  // Field by field.
  return { cache: i.cache, cacheControl: i.cacheControl, date: s(i.dateLag), age: s(i.age), expires: s(i.expires), lastModified: s(i.lastModified), heuristic: i.heuristic, received: s(i.received) };
}

/** Read a required number; an empty field is not a number. */
function readRequired(s: string): number {
  // Blank means nothing was entered.
  return s.trim() === "" ? Number.NaN : Number(s.trim());
}

/** Read an optional number; an empty field means the header is absent. */
function readOptional(s: string): number | null {
  // Blank means no header.
  return s.trim() === "" ? null : Number(s.trim());
}

export default function HttpFreshnessLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.http-freshness");
  // The page's language, for numbers.
  const locale = useLocale();
  // The reader's settings, opening on the fresh CDN response.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or the refusal it made.
  let r: HttpFreshnessResult | null = null;
  // The refusal, when there is one.
  let err: HttpFreshnessError | null = null;
  // Run the pure model on the parsed form.
  try {
    // Parse and compute.
    r = compute({
      cache: form.cache,
      cacheControl: form.cacheControl,
      dateLag: readRequired(form.date),
      age: readOptional(form.age),
      expires: readOptional(form.expires),
      lastModified: readOptional(form.lastModified),
      heuristic: form.heuristic,
      received: readRequired(form.received),
    });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof HttpFreshnessError) err = e;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The largest number of seconds, formatted.
  const max = nf.format(MAX_SECONDS);
  // The refusal, worded for the reader.
  const errText = (e: HttpFreshnessError): string => {
    // One sentence per code.
    switch (e.code) {
      case "bad-date":
        return t("errorDate", { max });
      case "bad-age":
        return t("errorAge", { max });
      case "bad-expires":
        return t("errorExpires", { max });
      case "bad-last-modified":
        return t("errorLastModified", { max });
      case "bad-received":
        return t("errorReceived", { max });
      case "cc-too-long":
        return t("errorCcTooLong", { max: nf.format(MAX_CC_LENGTH) });
      case "cc-syntax":
        return t("errorCcSyntax");
      case "cc-duplicate":
        return t("errorCcDuplicate", { name: e.directive });
      case "cc-seconds":
        return t("errorCcSeconds", { name: e.directive });
      case "cc-argument":
        return t("errorCcArgument", { name: e.directive });
      case "cc-qualified":
        return t("errorCcQualified", { name: e.directive });
      default:
        return t("errorChoice");
    }
  };
  /** True when the refusal concerns the Cache-Control field. */
  const ccInvalid = err !== null && err.code.startsWith("cc-");

  // The select options.
  const cacheOptions = [
    ["shared", t("cacheShared")],
    ["private", t("cachePrivate")],
  ] as const;
  // The heuristic options.
  const heuristicOptions = [
    ["none", t("heuristicNone")],
    ["ten-percent", t("heuristicTen")],
  ] as const;

  /** The result block for a valid input. */
  const resultBlock = (res: HttpFreshnessResult) => {
    // Step 1: storage, worded by its rule.
    const store =
      res.storeRule === "no-store" ? t("storeNoStore") : res.storeRule === "private-shared" ? t("storePrivateShared") : res.storeRule === "private-private" ? t("storePrivatePrivate") : t("storeAllowed");
    // Step 2: the lifetime and where it came from.
    const life =
      res.lifetime === null
        ? t("lifeNone")
        : res.lifetimeSource === "s-maxage"
          ? t("lifeSMaxage", { s: nf.format(res.lifetime) })
          : res.lifetimeSource === "max-age"
            ? t("lifeMaxAge", { s: nf.format(res.lifetime) })
            : res.lifetimeSource === "expires"
              ? t("lifeExpires", { s: nf.format(res.lifetime) })
              : t("lifeHeuristic", { s: nf.format(res.lifetime), lm: nf.format(readOptional(form.lastModified) ?? 0) });
    // The side notes on step 2, in the order the rules are met.
    const lifeNotes = [
      res.sMaxageIgnored ? t("noteSMaxageIgnored") : null,
      res.expiresIgnoredBy ? t("noteExpiresIgnored", { by: res.expiresIgnoredBy }) : null,
      res.heuristicBlocked ? t("noteHeuristicBlocked") : null,
      res.heuristicNoLastModified ? t("noteHeuristicNoLastModified") : null,
      res.clamped ? t("noteClamped", { max }) : null,
    ].filter((x): x is string => x !== null);
    // Step 3: the age arithmetic.
    const age =
      readOptional(form.age) === null
        ? t("ageLineNoAge", { current: nf.format(res.currentAge), apparent: nf.format(res.apparentAge), received: nf.format(readRequired(form.received)) })
        : t("ageLine", { current: nf.format(res.currentAge), initial: nf.format(res.correctedInitialAge), apparent: nf.format(res.apparentAge), age: nf.format(res.correctedAgeValue), received: nf.format(readRequired(form.received)) });
    // Step 4: fresh or stale.
    const fresh =
      res.lifetime === null
        ? t("freshNone")
        : res.fresh
          ? t("freshYes", { lifetime: nf.format(res.lifetime), current: nf.format(res.currentAge), remaining: nf.format(res.remaining ?? 0) })
          : t("freshNo", { lifetime: nf.format(res.lifetime), current: nf.format(res.currentAge) });
    // Step 5: the origin answers.
    const online =
      res.online === "serve"
        ? t("onlineServe", { age: String(res.currentAge) })
        : res.online === "validate-no-cache"
          ? t("onlineValidateNoCache")
          : res.validator === "if-modified-since"
            ? t("onlineValidateStaleIms")
            : t("onlineValidateStaleNone");
    // Its tone: served is good news, validation a caution.
    const onlineTone = res.online === "serve" ? "ok" : "warn";
    // Step 6: the cache is disconnected.
    const offline =
      res.offline === "serve"
        ? t("offlineServe")
        : res.offline === "cannot-no-cache"
          ? t("offlineCannotNoCache")
          : res.offline === "error-must-revalidate"
            ? t("offlineMustRevalidate")
            : res.offline === "cannot-shared-revalidate"
              ? t("offlineSharedRevalidate", { by: res.sharedRevalidateBy ?? "" })
              : t("offlineServeStale");
    // Its tone: fresh is fine, stale-but-allowed a caution, anything else a stop.
    const offlineTone = res.offline === "serve" ? "ok" : res.offline === "serve-stale" ? "warn" : "stop";
    return (
      <>
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepStore")}</span> {store}
          </li>
          {res.storable ? (
            <>
              <li className="lab-step">
                <span className="lab-step-where">{t("stepLifetime")}</span> {[life, ...lifeNotes].join(" ")}
              </li>
              <li className="lab-step">
                <span className="lab-step-where">{t("stepAge")}</span> {age}
              </li>
              <li className="lab-step">
                <span className="lab-step-where">{t("stepFresh")}</span> {fresh}
              </li>
              <li className="lab-step">
                <span className="lab-step-where">{t("stepOnline")}</span> <span className={`lab-verdict lab-verdict--${onlineTone}`}>{online}</span>
              </li>
              <li className="lab-step">
                <span className="lab-step-where">{t("stepOffline")}</span> <span className={`lab-verdict lab-verdict--${offlineTone}`}>{offline}</span>
              </li>
            </>
          ) : (
            <li className="lab-step">
              <span className="lab-step-where">{t("stepReuse")}</span> <span className="lab-verdict lab-verdict--stop">{t("notStored")}</span>
            </li>
          )}
        </ol>
        {/* Directives this cache does not recognise, and public where it changes nothing. */}
        {res.ignored.length > 0 && <p className="lab-note">{t("noteIgnored", { names: res.ignored.join(", ") })}</p>}
        {res.publicNoEffect && res.storable && <p className="lab-note">{t("notePublic")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-cache`} label={t("cache")}>
            <LabSelect id={`${ID}-cache`} value={form.cache} options={cacheOptions} onChange={(v) => setForm({ ...form, cache: v as CacheKind })} />
          </LabField>
          <LabField id={`${ID}-cache-control`} label={t("cacheControl")}>
            <input id={`${ID}-cache-control`} className="lab-input mono" type="text" autoComplete="off" spellCheck={false} value={form.cacheControl} aria-invalid={ccInvalid ? "true" : undefined} onChange={(e) => setForm({ ...form, cacheControl: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-date`} label={t("date")}>
            <input id={`${ID}-date`} className="lab-input" type="number" step={1} value={form.date} aria-invalid={err?.code === "bad-date" ? "true" : undefined} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-age`} label={t("age")}>
            <input id={`${ID}-age`} className="lab-input" type="number" inputMode="decimal" min={0} step={1} value={form.age} aria-invalid={err?.code === "bad-age" ? "true" : undefined} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-expires`} label={t("expires")}>
            <input id={`${ID}-expires`} className="lab-input" type="number" step={1} value={form.expires} aria-invalid={err?.code === "bad-expires" ? "true" : undefined} onChange={(e) => setForm({ ...form, expires: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-last-modified`} label={t("lastModified")}>
            <input id={`${ID}-last-modified`} className="lab-input" type="number" inputMode="decimal" min={0} step={1} value={form.lastModified} aria-invalid={err?.code === "bad-last-modified" ? "true" : undefined} onChange={(e) => setForm({ ...form, lastModified: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-heuristic`} label={t("heuristic")}>
            <LabSelect id={`${ID}-heuristic`} value={form.heuristic} options={heuristicOptions} onChange={(v) => setForm({ ...form, heuristic: v as Heuristic })} />
          </LabField>
          <LabField id={`${ID}-received`} label={t("received")}>
            <input id={`${ID}-received`} className="lab-input" type="number" inputMode="decimal" min={0} step={1} value={form.received} aria-invalid={err?.code === "bad-received" ? "true" : undefined} onChange={(e) => setForm({ ...form, received: e.target.value })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{err ? errText(err) : t("errorChoice")}</p>}
      onExample={() => setForm(toForm(EXAMPLE_INPUT))}
      onReset={() => setForm(toForm(DEFAULT_INPUT))}
      scope={t("scope")}
    />
  );
}
