"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/CorsPreflightLab.tsx
// ----------------------------------------------------------------------------
// THE CORS PREFLIGHT LAB (2026-10-26), embedded in "CORS Explained: The Border
// Control of the Browser" as <Lab id="cors-preflight" />. Nine selects: four
// for the request a script on https://app.example makes (method, Content-Type,
// one more header, credentials mode) and five for the server's answers
// (Access-Control-Allow-Origin, -Credentials, -Methods, -Headers, -Max-Age).
// The result is a short summary, the preflight request when one is sent, and
// an ordered account naming the Fetch Standard anchor behind each decision.
// The model is src/lib/labs/cors-preflight/compute.ts; its checked cases are
// the golden vectors beside it. Words: "learnLabs.cors-preflight". Header
// names and values are protocol data from the model, shown as they are.
// ============================================================================

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  ALLOW_HEADERS_VALUES,
  ALLOW_METHODS_VALUES,
  ALLOW_ORIGIN_VALUES,
  CONTENT_TYPE_VALUES,
  METHODS,
  PAGE_ORIGIN,
  SAFELISTED_RESPONSE_HEADERS,
  TARGET_URL,
  type AllowCredentials,
  type AllowHeaders,
  type AllowMethods,
  type AllowOrigin,
  type ContentTypeChoice,
  type CorsFailure,
  type CorsInput,
  type Credentials,
  type ExtraHeader,
  type JudgedHeader,
  type MaxAge,
  type Method,
} from "@/lib/labs/cors-preflight/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "cors-preflight";

export default function CorsPreflightLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.cors-preflight");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers in the page's language.
  const nf = new Intl.NumberFormat(locale);
  // The reader's settings, opening on a simple GET that works.
  const [input, setInput] = useState<CorsInput>(DEFAULT_INPUT);
  // The model's answer (pure: computed on every render; the selects can only send valid values).
  const r = compute(input);

  // The method choices: the methods themselves.
  const methodOptions = METHODS.map((m) => [m, m] as const);
  // The Content-Type choices: none, or the value itself.
  const ctOptions = [
    ["none", t("none")],
    ["form", CONTENT_TYPE_VALUES.form],
    ["multipart", CONTENT_TYPE_VALUES.multipart],
    ["text", CONTENT_TYPE_VALUES.text],
    ["json", CONTENT_TYPE_VALUES.json],
  ] as const;
  // The extra header choices, worded (one of them describes its value rather than printing it).
  const xhOptions = [
    ["none", t("none")],
    ["accept-json", t("xhAcceptJson")],
    ["accept-long", t("xhAcceptLong")],
    ["content-language", t("xhContentLanguage")],
    ["authorization", t("xhAuthorization")],
    ["x-requested-with", t("xhXRequestedWith")],
  ] as const;
  // The credentials modes.
  const credOptions = [
    ["same-origin", t("credSameOrigin")],
    ["include", t("credInclude")],
  ] as const;
  // Access-Control-Allow-Origin: absent, or the value itself.
  const acaoOptions = [
    ["absent", t("absent")],
    ["star", ALLOW_ORIGIN_VALUES.star],
    ["exact", ALLOW_ORIGIN_VALUES.exact],
    ["trailing-slash", ALLOW_ORIGIN_VALUES["trailing-slash"]],
    ["other", ALLOW_ORIGIN_VALUES.other],
  ] as const;
  // Access-Control-Allow-Credentials: absent or true.
  const acacOptions = [
    ["absent", t("absent")],
    ["true", "true"],
  ] as const;
  // Access-Control-Allow-Methods.
  const acamOptions = [
    ["absent", t("absent")],
    ["put-delete", ALLOW_METHODS_VALUES["put-delete"]],
    ["star", ALLOW_METHODS_VALUES.star],
  ] as const;
  // Access-Control-Allow-Headers.
  const acahOptions = [
    ["absent", t("absent")],
    ["content-type", ALLOW_HEADERS_VALUES["content-type"]],
    ["content-type-authorization", ALLOW_HEADERS_VALUES["content-type-authorization"]],
    ["star", ALLOW_HEADERS_VALUES.star],
  ] as const;
  // Access-Control-Max-Age, in seconds.
  const maxAgeOptions = [
    ["absent", t("absent")],
    ["600", nf.format(600)],
    ["86400", nf.format(86400)],
  ] as const;

  /** Why one header makes a preflight necessary (or not), worded. */
  const headerReason = (h: JudgedHeader): string => {
    // One sentence per verdict.
    switch (h.verdict) {
      case "too-long":
        return t("whyTooLong", { name: h.name, n: nf.format(h.length) });
      case "unsafe-byte":
        return t("whyUnsafeByte", { name: h.name });
      case "bad-bytes":
        return t("whyBadBytes", { name: h.name });
      case "content-type-essence":
        return t("whyContentType", { essence: h.essence ?? h.value });
      case "not-safelisted-name":
        return t("whyName", { name: h.name });
      case "over-total":
        return t("whyOverTotal", { name: h.name });
      default:
        return t("whySafelisted", { name: h.name });
    }
  };
  /** A failed check, worded (the same reasons serve the preflight and the actual response). */
  const failure = (f: CorsFailure): string => {
    // One sentence per failure.
    switch (f) {
      case "acao-missing":
        return t("failAcaoMissing");
      case "acao-wildcard-credentials":
        return t("failAcaoWildcard");
      case "acao-mismatch":
        return t("failAcaoMismatch", { value: input.allowOrigin === "absent" ? "" : ALLOW_ORIGIN_VALUES[input.allowOrigin], origin: PAGE_ORIGIN });
      case "acac-missing":
        return t("failAcacMissing");
      case "method-not-allowed":
        return t("failMethod", { method: input.method });
      case "method-wildcard-credentials":
        return t("failMethodWildcard", { method: input.method });
      case "authorization-not-listed":
        return t("failAuthorization");
      case "header-not-allowed":
        return t("failHeader", { header: r.failedHeader ?? "" });
      default:
        return t("failHeaderWildcard", { header: r.failedHeader ?? "" });
    }
  };

  // Step 1: simple, or preflighted and why.
  const unsafeHeaders = r.headers.filter((h) => h.verdict !== "safelisted");
  // The reasons, method first, then each unsafe header.
  const reasons = [...(r.safelistedMethod ? [] : [t("whyMethod", { method: input.method })]), ...unsafeHeaders.map(headerReason)];
  // The sentence for the step.
  const stepWhy = r.preflight ? `${t("preflightBecause")} ${reasons.join(" ")}` : r.headers.length > 0 ? t("simpleWithHeaders", { method: input.method }) : t("simpleNoHeaders", { method: input.method });
  // Step 2: the preflight's outcome, when one is sent.
  const stepPreflight =
    r.preflightOk === null
      ? ""
      : r.preflightOk
        ? `${t("preflightPass")} ${r.maxAgeDefault ? t("maxAgeDefault") : t("maxAgeSet", { n: nf.format(r.maxAge ?? 0) })}`
        : t("preflightFail", { reason: failure(r.preflightFailure ?? "acao-missing") });
  // Step 3: the actual request and its response.
  const stepActual = !r.actualSent
    ? t("actualNotSent")
    : `${r.credentialsSent ? t("actualSentCookies", { method: input.method }) : t("actualSent", { method: input.method })} ${r.actualOk ? t("actualPass") : t("actualFail", { reason: failure(r.actualFailure ?? "acao-missing") })}`;
  // Step 4: what the script gets.
  const verdict =
    r.outcome === "readable"
      ? t("verdictReadable", { headers: SAFELISTED_RESPONSE_HEADERS.join(", ") })
      : r.outcome === "blocked-response"
        ? t("verdictBlockedResponse")
        : t("verdictBlockedPreflight");
  // Readable is good news; a blocked read or a blocked request is a stop.
  const tone = r.outcome === "readable" ? "ok" : "stop";

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-method`} label={t("method")}>
            <LabSelect id={`${ID}-method`} value={input.method} options={methodOptions} onChange={(v) => setInput({ ...input, method: v as Method })} />
          </LabField>
          <LabField id={`${ID}-content-type`} label={t("contentType")}>
            <LabSelect id={`${ID}-content-type`} value={input.contentType} options={ctOptions} onChange={(v) => setInput({ ...input, contentType: v as ContentTypeChoice })} />
          </LabField>
          <LabField id={`${ID}-extra-header`} label={t("extraHeader")}>
            <LabSelect id={`${ID}-extra-header`} value={input.extraHeader} options={xhOptions} onChange={(v) => setInput({ ...input, extraHeader: v as ExtraHeader })} />
          </LabField>
          <LabField id={`${ID}-credentials`} label={t("credentials")}>
            <LabSelect id={`${ID}-credentials`} value={input.credentials} options={credOptions} onChange={(v) => setInput({ ...input, credentials: v as Credentials })} />
          </LabField>
          <LabField id={`${ID}-allow-origin`} label={t("allowOrigin")}>
            <LabSelect id={`${ID}-allow-origin`} value={input.allowOrigin} options={acaoOptions} onChange={(v) => setInput({ ...input, allowOrigin: v as AllowOrigin })} />
          </LabField>
          <LabField id={`${ID}-allow-credentials`} label={t("allowCredentials")}>
            <LabSelect id={`${ID}-allow-credentials`} value={input.allowCredentials} options={acacOptions} onChange={(v) => setInput({ ...input, allowCredentials: v as AllowCredentials })} />
          </LabField>
          <LabField id={`${ID}-allow-methods`} label={t("allowMethods")}>
            <LabSelect id={`${ID}-allow-methods`} value={input.allowMethods} options={acamOptions} onChange={(v) => setInput({ ...input, allowMethods: v as AllowMethods })} />
          </LabField>
          <LabField id={`${ID}-allow-headers`} label={t("allowHeaders")}>
            <LabSelect id={`${ID}-allow-headers`} value={input.allowHeaders} options={acahOptions} onChange={(v) => setInput({ ...input, allowHeaders: v as AllowHeaders })} />
          </LabField>
          <LabField id={`${ID}-max-age`} label={t("maxAge")}>
            <LabSelect id={`${ID}-max-age`} value={input.maxAge} options={maxAgeOptions} onChange={(v) => setInput({ ...input, maxAge: v as MaxAge })} />
          </LabField>
        </>
      }
      result={
        <>
          {/* The summary. */}
          <dl className="lab-kv">
            <dt>{t("kvPreflight")}</dt>
            <dd>{r.preflight ? t("yes") : t("no")}</dd>
            <dt>{t("kvActual")}</dt>
            <dd>{!r.actualSent ? t("actualNever") : r.credentialsSent ? t("actualWithCookies") : t("actualWithoutCookies")}</dd>
            <dt>{t("kvScript")}</dt>
            <dd>{r.outcome === "readable" ? t("scriptReads") : t("scriptTypeError")}</dd>
          </dl>
          {/* The preflight the browser sends, header by header. */}
          {r.preflightRequest && (
            <>
              <p className="lab-note">{t("preflightIntro")}</p>
              <dl className="lab-kv">
                <dt>{t("requestLine")}</dt>
                <dd>{`OPTIONS ${TARGET_URL}`}</dd>
                {r.preflightRequest.map(([name, value]) => (
                  <Fragment key={name}>
                    <dt>{name}</dt>
                    <dd>{value}</dd>
                  </Fragment>
                ))}
              </dl>
            </>
          )}
          {/* What happened and why, decision by decision. */}
          <ol className="lab-steps">
            <li className="lab-step">
              <span className="lab-step-where">{t("stepWhy")}</span> {stepWhy}
            </li>
            {r.preflight && (
              <li className="lab-step">
                <span className="lab-step-where">{t("stepPreflight")}</span> {stepPreflight}
              </li>
            )}
            <li className="lab-step">
              <span className="lab-step-where">{t("stepActual")}</span> {stepActual}
            </li>
            <li className="lab-step">
              <span className="lab-step-where">{t("stepScript")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
            </li>
          </ol>
          {/* CORS protects the user's reads, not the server: a simple request has already reached it. */}
          <p className="lab-note">{t("noteServer")}</p>
        </>
      }
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
