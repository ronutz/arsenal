"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/CookieSendDecisionLab.tsx
// ----------------------------------------------------------------------------
// THE COOKIE SEND-DECISION LAB (2026-10-26), embedded in "HTTP Cookies: State
// Over a Stateless Protocol" and "Cookie Security Flags" as
// <Lab id="cookie-send-decision" />. Five selects for the cookie's attributes
// (Domain, Path, Secure, HttpOnly, SameSite), the request URL as text and two
// selects for the request (its kind, same-site or cross-site); the result is
// the Set-Cookie header, whether it was stored, then the five checks the
// browser runs in order (host, path, Secure, HttpOnly, SameSite) and the
// verdict naming the rule that decided. The model is
// src/lib/labs/cookie-send-decision/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.cookie-send-decision".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  COOKIE_PAIR,
  compute,
  CookieSendError,
  DEFAULT_INPUT,
  defaultPath,
  EXAMPLE_INPUT,
  MAX_URL_LENGTH,
  SET_BY_HOST,
  SET_BY_PATH,
  SET_BY_URL,
  type CookieSendInput,
  type CookieSendResult,
  type Decider,
  type DomainChoice,
  type PathChoice,
  type RequestKind,
  type SameSiteChoice,
  type SiteContext,
} from "@/lib/labs/cookie-send-decision/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "cookie-send-decision";

/** The form: the two flags as select values, everything else as the model reads it. */
interface Form {
  /** The Domain attribute. */
  domain: DomainChoice;
  /** The Path attribute. */
  path: PathChoice;
  /** "on" or "off". */
  secure: "on" | "off";
  /** "on" or "off". */
  httpOnly: "on" | "off";
  /** The SameSite attribute. */
  sameSite: SameSiteChoice;
  /** The request URL as typed. */
  url: string;
  /** The kind of request. */
  kind: RequestKind;
  /** Same-site or cross-site. */
  context: SiteContext;
}

/** A model input as the form shows it. */
function toForm(i: CookieSendInput): Form {
  // Booleans become select values.
  return { ...i, secure: i.secure ? "on" : "off", httpOnly: i.httpOnly ? "on" : "off" };
}

export default function CookieSendDecisionLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.cookie-send-decision");
  // The page's language, for the one number shown.
  const locale = useLocale();
  // The reader's settings, opening on the cross-site link that Lax lets through.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // Whole numbers with grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  // The model's answer, or the code it refused the input with.
  let r: CookieSendResult | null = null;
  // The refusal code, when there is one.
  let errCode: CookieSendError["code"] | null = null;
  // Run the pure model on the form.
  try {
    // Flags back to booleans, then compute.
    r = compute({ ...form, secure: form.secure === "on", httpOnly: form.httpOnly === "on" });
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof CookieSendError) errCode = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText =
    errCode === "bad-url"
      ? t("errorUrl", { max: nf.format(MAX_URL_LENGTH) })
      : errCode === "bad-scheme"
        ? t("errorScheme")
        : errCode === "bad-host"
          ? t("errorHost")
          : errCode === "no-path"
            ? t("errorNoPath")
            : errCode === "bad-path"
              ? t("errorPath")
              : t("errorChoice");
  /** True when the refusal concerns the URL field. */
  const urlInvalid = errCode !== null && errCode !== "bad-choice";

  // The Domain options.
  const domainOptions = [
    ["none", t("domainNone", { host: SET_BY_HOST })],
    ["example.com", t("domainValue", { domain: "example.com" })],
    ["www.example.com", t("domainValue", { domain: "www.example.com" })],
    ["shop.example.com", t("domainValue", { domain: "shop.example.com" })],
  ] as const;
  // The Path options.
  const pathOptions = [
    ["none", t("pathNone", { path: defaultPath(SET_BY_PATH) })],
    ["/", t("pathValue", { path: "/" })],
    ["/account/", t("pathValue", { path: "/account/" })],
    ["/admin", t("pathValue", { path: "/admin" })],
  ] as const;
  // The two flags' options.
  const flagOptions = [
    ["on", t("flagOn")],
    ["off", t("flagOff")],
  ] as const;
  // The SameSite options.
  const sameSiteOptions = [
    ["unset", t("sameSiteUnset")],
    ["strict", t("sameSiteValue", { value: "Strict" })],
    ["lax", t("sameSiteValue", { value: "Lax" })],
    ["none", t("sameSiteValue", { value: "None" })],
  ] as const;
  // The request kinds.
  const kindOptions = [
    ["nav-get", t("kindNavGet")],
    ["nav-post", t("kindNavPost")],
    ["subresource", t("kindSubresource")],
    ["script", t("kindScript")],
  ] as const;
  // Same-site or cross-site.
  const contextOptions = [
    ["same-site", t("contextSame")],
    ["cross-site", t("contextCross")],
  ] as const;

  /** The name of the rule that decided, for the verdict. */
  const ruleName = (d: Decider): string =>
    d === "store" ? t("ruleStore") : d === "host" ? t("ruleHost") : d === "path" ? t("rulePath") : d === "secure" ? t("ruleSecure") : d === "http-only" ? t("ruleHttpOnly") : t("ruleSameSite");

  /** The result block for a valid input. */
  const resultBlock = (res: CookieSendResult) => {
    // The SameSite mode's name: Lax, or the draft's Default when the attribute is absent.
    const mode = form.sameSite === "unset" ? t("modeDefault") : t("modeLax");
    // Step 0: storage.
    const store =
      res.storeRule === "domain-mismatch"
        ? t("storeDomainMismatch", { host: SET_BY_HOST, domain: res.cookieDomain })
        : res.storeRule === "none-without-secure"
          ? t("storeNoneWithoutSecure")
          : (res.hostOnly ? t("storeHostOnly", { domain: res.cookieDomain, path: res.cookiePath }) : t("storeDomain", { domain: res.cookieDomain, path: res.cookiePath })) +
            (res.pathDefaulted ? " " + t("storeDefaultPath", { setPath: SET_BY_PATH, path: res.cookiePath }) : "");
    // Step 1: the host.
    const host =
      res.host === "identical"
        ? t("hostIdentical", { host: res.request.host })
        : res.host === "not-identical"
          ? t("hostNotIdentical", { host: res.request.host, domain: res.cookieDomain })
          : res.host === "domain-match"
            ? t("hostDomainMatch", { host: res.request.host, domain: res.cookieDomain })
            : res.request.ip
              ? t("hostIp", { host: res.request.host })
              : t("hostNoMatch", { host: res.request.host, domain: res.cookieDomain });
    // Step 2: the path.
    const path =
      res.path === "identical"
        ? t("pathIdentical", { path: res.request.path })
        : res.path === "prefix-slash"
          ? t("pathPrefixSlash", { path: res.request.path, cookiePath: res.cookiePath })
          : res.path === "prefix-boundary"
            ? t("pathPrefixBoundary", { path: res.request.path, cookiePath: res.cookiePath })
            : t("pathNoMatch", { path: res.request.path, cookiePath: res.cookiePath });
    // Step 3: Secure.
    const secure = res.secure === "not-secure-cookie" ? t("secureNot") : res.secure === "secure-channel" ? t("secureOk") : t("secureFail");
    // Step 4: HttpOnly.
    const httpOnly = res.httpOnly === "not-httponly" ? t("httpOnlyNot") : res.httpOnly === "http-retrieval" ? t("httpOnlyHttp") : t("httpOnlyScript");
    // Step 5: SameSite.
    const sameSite =
      res.sameSite === "flag-none"
        ? t("sameSiteFlagNone")
        : res.sameSite === "same-site"
          ? t("sameSiteSameSite")
          : res.sameSite === "lax-top-level-get"
            ? t("sameSiteTopLevelGet", { mode })
            : res.sameSite === "strict-cross-site"
              ? t("sameSiteStrict")
              : res.sameSite === "lax-unsafe-method"
                ? t("sameSiteUnsafe", { mode })
                : res.sameSite === "lax-not-top-level"
                  ? t("sameSiteNotTopLevel", { mode })
                  : t("sameSiteScript");
    // A script reads document.cookie; everything else is an HTTP request.
    const script = form.kind === "script";
    // The verdict.
    const verdict = res.sent
      ? script
        ? t("visibleScript", { pair: COOKIE_PAIR })
        : t("sentHttp", { pair: COOKIE_PAIR })
      : script
        ? t("hiddenScript", { rule: ruleName(res.decidedBy ?? "store") })
        : t("notSentHttp", { rule: ruleName(res.decidedBy ?? "store") });
    // The checks in the algorithm's order, each with its line.
    const checks: [string, string | null][] = [
      [t("stepHost"), res.host ? host : null],
      [t("stepPath"), res.path ? path : null],
      [t("stepSecure"), res.secure ? secure : null],
      [t("stepHttpOnly"), res.httpOnly ? httpOnly : null],
      [t("stepSameSite"), res.sameSite ? sameSite : null],
    ];
    return (
      <>
        {/* What set the cookie, and the header it set. */}
        <p className="lab-note">{t("setBy", { url: SET_BY_URL })}</p>
        <p className="lab-note mono">{t("setCookieLine", { header: res.setCookie })}</p>
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("stepStore")}</span> {store}
          </li>
          {res.stored &&
            checks.map(([where, line]) => (
              <li className="lab-step" key={where}>
                <span className="lab-step-where">{where}</span> {line}
              </li>
            ))}
          <li className="lab-step">
            <span className="lab-step-where">{t("stepVerdict")}</span> <span className={`lab-verdict lab-verdict--${res.sent ? "ok" : "stop"}`}>{verdict}</span>
          </li>
        </ol>
        {/* The draft's Default enforcement, when SameSite is absent and stored. */}
        {res.stored && form.sameSite === "unset" && <p className="lab-note">{t("noteDefault")}</p>}
        {/* The Lax-allowing-unsafe mode a browser may apply, where it would change this answer. */}
        {res.sameSite === "lax-unsafe-method" && form.sameSite === "unset" && <p className="lab-note">{t("noteLaxAllowingUnsafe")}</p>}
        {/* What cross-site means for document.cookie. */}
        {script && <p className="lab-note">{t("noteScriptContext")}</p>}
      </>
    );
  };

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-domain`} label={t("domain")}>
            <LabSelect id={`${ID}-domain`} value={form.domain} options={domainOptions} onChange={(v) => setForm({ ...form, domain: v as DomainChoice })} />
          </LabField>
          <LabField id={`${ID}-path`} label={t("path")}>
            <LabSelect id={`${ID}-path`} value={form.path} options={pathOptions} onChange={(v) => setForm({ ...form, path: v as PathChoice })} />
          </LabField>
          <LabField id={`${ID}-secure`} label={t("secure")}>
            <LabSelect id={`${ID}-secure`} value={form.secure} options={flagOptions} onChange={(v) => setForm({ ...form, secure: v as "on" | "off" })} />
          </LabField>
          <LabField id={`${ID}-http-only`} label={t("httpOnly")}>
            <LabSelect id={`${ID}-http-only`} value={form.httpOnly} options={flagOptions} onChange={(v) => setForm({ ...form, httpOnly: v as "on" | "off" })} />
          </LabField>
          <LabField id={`${ID}-same-site`} label={t("sameSite")}>
            <LabSelect id={`${ID}-same-site`} value={form.sameSite} options={sameSiteOptions} onChange={(v) => setForm({ ...form, sameSite: v as SameSiteChoice })} />
          </LabField>
          <LabField id={`${ID}-url`} label={t("url")}>
            <input id={`${ID}-url`} className="lab-input mono" type="text" inputMode="url" autoComplete="off" spellCheck={false} value={form.url} aria-invalid={urlInvalid ? "true" : undefined} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-kind`} label={t("kind")}>
            <LabSelect id={`${ID}-kind`} value={form.kind} options={kindOptions} onChange={(v) => setForm({ ...form, kind: v as RequestKind })} />
          </LabField>
          <LabField id={`${ID}-context`} label={t("context")}>
            <LabSelect id={`${ID}-context`} value={form.context} options={contextOptions} onChange={(v) => setForm({ ...form, context: v as SiteContext })} />
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
