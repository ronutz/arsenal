"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/PythonIpaddressExplorerLab.tsx
// ----------------------------------------------------------------------------
// THE IPADDRESS EXPLORER LAB (Python run, 2026-10-27), embedded in "Python's
// ipaddress module: strict parsing, networks, summarisation and IPv6" as
// <Lab id="python-ipaddress-explorer" />. One text field, a select for the
// factory (ip_address, ip_network strict or not, ip_interface), a select for an
// optional subnets() or supernet() call and a field for its new_prefix. The
// result follows the string as CPython 3.13 does: each class constructor the
// factory tried and what it raised, the object or the exception, what the REPL
// prints for a selection of attributes, hosts() for a network, the is_*
// properties, the method's answer, where CPython and IANA's registry disagree,
// and the whole operation as one Python expression. The model is
// src/lib/labs/python-ipaddress-explorer/compute.ts; its checked cases are the
// golden vectors beside it. Words: "learnLabs.python-ipaddress-explorer".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  CALLS,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  IpaddressLabError,
  MAX_TEXT_LENGTH,
  METHODS,
  type Attempt,
  type Call,
  type IpaddressErrorCode,
  type IpaddressInput,
  type IpaddressResult,
  type Method,
} from "@/lib/labs/python-ipaddress-explorer/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "python-ipaddress-explorer";

/** The message key of each call's label. */
const CALL_KEY: Readonly<Record<Call, string>> = {
  // ip_address(text).
  ip_address: "callAddress",
  // ip_network(text).
  ip_network: "callNetwork",
  // ip_network(text, strict=False).
  ip_network_loose: "callNetworkLoose",
  // ip_interface(text).
  ip_interface: "callInterface",
};

/** The message key of each method's label. */
const METHOD_KEY: Readonly<Record<Method, string>> = {
  // Nothing after the factory.
  none: "methodNone",
  // .subnets(new_prefix=N).
  subnets: "methodSubnets",
  // .supernet(new_prefix=N).
  supernet: "methodSupernet",
};

/** The message key of each attempt's outcome. */
const OUTCOME_KEY: Readonly<Record<Attempt["outcome"], string>> = {
  // The class returned an object.
  returned: "stepReturned",
  // It raised, and the factory caught it.
  caught: "stepCaught",
  // It raised, and the exception left the factory.
  propagated: "stepPropagated",
};

/** The message key of each refusal. */
const ERROR_KEY: Readonly<Record<IpaddressErrorCode, string>> = {
  // Too many characters.
  "too-long": "errorTooLong",
  // A character outside printable ASCII.
  "not-printable-ascii": "errorAscii",
  // A choice the lab does not offer.
  "bad-choice": "errorChoice",
  // new_prefix not an integer.
  "bad-new-prefix": "errorNewPrefix",
};

/** An attribute row's expression: x.name, or the call as written. */
function exprOf(name: string): string {
  // str(x) and int(x) are already calls on x.
  return name.includes("(") ? name : `x.${name}`;
}

export default function PythonIpaddressExplorerLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.python-ipaddress-explorer");
  // The page's language, for the one count in a sentence.
  const locale = useLocale();
  // Whole numbers with the page's grouping.
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  // The reader's settings, opening on an interface.
  const [input, setInput] = useState<IpaddressInput>(DEFAULT_INPUT);

  // The model's answer, or the code it refused the settings with.
  let r: IpaddressResult | null = null;
  // The refusal code, when there is one.
  let err: IpaddressErrorCode | null = null;
  // Run the pure model.
  try {
    // Parse, build, describe.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof IpaddressLabError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // The refusal, worded for the reader.
  const errText = err ? t(ERROR_KEY[err], { max: nf.format(MAX_TEXT_LENGTH) }) : null;

  // The call options, labelled.
  const callOptions = CALLS.map((c) => [c, t(CALL_KEY[c])] as const);
  // The method options, labelled.
  const methodOptions = METHODS.map((m) => [m, t(METHOD_KEY[m])] as const);

  /** The result block for accepted settings. */
  const resultBlock = (res: IpaddressResult) => (
    <>
      {/* The factory's tries, in order. */}
      <ol className="lab-steps">
        {res.attempts.map((a, i) => (
          <li className="lab-step" key={i}>
            <code>{a.call}</code> {a.outcome === "returned" ? t(OUTCOME_KEY[a.outcome], { repr: res.repr ?? "" }) : t(OUTCOME_KEY[a.outcome], { exception: a.exception ?? "", message: a.message ?? "" })}
          </li>
        ))}
        {/* Both classes refused: the factory's own exception. */}
        {res.error && res.attempts.every((a) => a.outcome === "caught") && <li className="lab-step">{t("stepFactory", { exception: res.error.exception, message: res.error.message })}</li>}
      </ol>
      {/* The verdict: the words carry the meaning, the colour only adds. */}
      <p>
        {res.verdict === "error" ? (
          <span className="lab-verdict lab-verdict--stop">{t("verdictError", { exception: res.error?.exception ?? "", message: res.error?.message ?? "" })}</span>
        ) : (
          <span className={`lab-verdict lab-verdict--${res.verdict === "masked" ? "warn" : "ok"}`}>{t(res.verdict === "masked" ? "verdictMasked" : "verdictObject", { repr: res.repr ?? "" })}</span>
        )}
      </p>
      {/* What the REPL prints for a selection of attributes. */}
      {res.fields.length > 0 && (
        <div className="lab-table-wrap">
          <table className="lab-table">
            <caption>{t("fieldsCaption", { cls: res.cls ?? "" })}</caption>
            <thead>
              <tr>
                <th scope="col">{t("thExpression")}</th>
                <th scope="col">{t("thValue")}</th>
              </tr>
            </thead>
            <tbody>
              {res.fields.map((f) => (
                <tr key={f.name}>
                  <td>
                    <code>{exprOf(f.name)}</code>
                  </td>
                  <td>
                    <code>{f.value}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* hosts() of a network: how many, the first and the last. */}
      {res.hosts && (
        <dl className="lab-kv">
          <dt>{t("kvHostsCount")}</dt>
          <dd className="mono">{res.hosts.count}</dd>
          <dt>{t("kvHostsFirst")}</dt>
          <dd className="mono">{res.hosts.first}</dd>
          <dt>{t("kvHostsLast")}</dt>
          <dd className="mono">{res.hosts.last}</dd>
        </dl>
      )}
      {/* The is_* properties. */}
      {res.props.length > 0 && (
        <div className="lab-table-wrap">
          <table className="lab-table">
            <caption>{t("propsCaption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("thProperty")}</th>
                <th scope="col">{t("thValue")}</th>
              </tr>
            </thead>
            <tbody>
              {res.props.map((p) => (
                <tr key={p.name}>
                  <td>
                    <code>{`x.${p.name}`}</code>
                  </td>
                  <td>
                    <code>{p.value ? "True" : "False"}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* The method: its networks, or what it raised. */}
      {res.method && (
        <dl className="lab-kv">
          <dt>
            <code>{`x.${res.method.call}`}</code>
          </dt>
          <dd className="mono">
            {res.method.error ? (
              t("methodRaised", { exception: res.method.error.exception, message: res.method.error.message })
            ) : (
              <>
                {res.method.count !== undefined && (
                  <>
                    {t("methodCount", { count: res.method.count })}
                    <br />
                  </>
                )}
                {(res.method.items ?? []).map((item, i) => (
                  <span key={i}>
                    {/* An ellipsis line where subnets are skipped before the last. */}
                    {res.method?.gap && i === 2 && (
                      <>
                        {t("methodGap")}
                        <br />
                      </>
                    )}
                    {item}
                    <br />
                  </span>
                ))}
              </>
            )}
          </dd>
        </dl>
      )}
      {/* A zoned IPv6 address: its reverse_pointer carries the zone, as CPython 3.13.16 builds it. */}
      {res.zoneInPointer && <p className="lab-note">{t("noteZonePointer")}</p>}
      {/* Where CPython and the IANA registry disagree. */}
      {res.iana && (
        <p className="lab-note">
          {t("noteIana", { block: res.iana.block, name: res.iana.name, rfc: res.iana.rfc, iana: res.iana.ianaGlobal ? "True" : "False", python: res.iana.pythonGlobal ? "True" : "False" })}
        </p>
      )}
      {/* The whole operation as one line of Python, to run in a REPL or the playground. */}
      <p className="lab-note">
        {t("pythonLine")} <code>{res.python}</code>
      </p>
    </>
  );

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-text`} label={t("text")}>
            <input id={`${ID}-text`} className="lab-input mono" type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} value={input.text} aria-invalid={err === "too-long" || err === "not-printable-ascii" ? "true" : undefined} onChange={(e) => setInput({ ...input, text: e.target.value })} />
          </LabField>
          <LabField id={`${ID}-call`} label={t("call")}>
            <LabSelect id={`${ID}-call`} value={input.call} options={callOptions} onChange={(v) => setInput({ ...input, call: v as Call })} />
          </LabField>
          <LabField id={`${ID}-method`} label={t("method")}>
            <LabSelect id={`${ID}-method`} value={input.method} options={methodOptions} onChange={(v) => setInput({ ...input, method: v as Method })} />
          </LabField>
          <LabField id={`${ID}-new-prefix`} label={t("newPrefix")}>
            <input id={`${ID}-new-prefix`} className="lab-input" type="number" inputMode="numeric" step={1} value={input.newPrefix} aria-invalid={err === "bad-new-prefix" ? "true" : undefined} onChange={(e) => setInput({ ...input, newPrefix: e.target.value })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => setInput(EXAMPLE_INPUT)}
      onReset={() => setInput(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
