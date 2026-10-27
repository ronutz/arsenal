"use client";
// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/learn/labs/KerberosExchangesLab.tsx
// ----------------------------------------------------------------------------
// THE KERBEROS EXCHANGES LAB (2026-10-26), embedded in "Kerberos and SPNEGO:
// How Silent Desktop SSO Actually Works" as <Lab id="kerberos-exchanges" />.
// Three number fields (the client's and the service's clocks against the
// KDC's, the acceptable skew) and three selects (pre-authentication, an
// expired ticket, where the SPN is registered). The result is a short summary,
// every message part as a table (the key that seals it, what it carries), and
// an ordered account of the AS, TGS and AP exchanges naming the RFC 4120
// section, or the vendor document, behind each decision. The model is
// src/lib/labs/kerberos-exchanges/compute.ts; its checked cases are the golden
// vectors beside it. Words: "learnLabs.kerberos-exchanges".
// ============================================================================

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import LabFrame, { LabField, LabSelect } from "./LabFrame";
import {
  compute,
  DEFAULT_INPUT,
  EXAMPLE_INPUT,
  KerberosError,
  OFFSET_RANGE,
  OTHER_ACCOUNT,
  SERVICE_ACCOUNT,
  SKEW_RANGE,
  SPN,
  type KerberosErrorCode,
  type KerberosInput,
  type KerberosResult,
  type KeyName,
  type MessagePart,
  type Preauth,
  type SpnState,
  type Tickets,
} from "@/lib/labs/kerberos-exchanges/compute";

/** The lab's id: its namespace, its anchor and its element ids. */
const ID = "kerberos-exchanges";

/** The three number fields as the form holds them (text, so a half-typed value is not lost). */
interface Form {
  /** The client's clock against the KDC's, in minutes. */
  clientOffset: string;
  /** The service's clock against the KDC's, in minutes. */
  serviceOffset: string;
  /** The acceptable skew, in minutes. */
  skew: string;
}

/** A model input's numbers as the form shows them. */
function toForm(i: KerberosInput): Form {
  // Numbers become text.
  return { clientOffset: String(i.clientOffset), serviceOffset: String(i.serviceOffset), skew: String(i.skew) };
}

/** Read a typed number; an empty field is not a number (the model refuses it). */
function readNumber(s: string): number {
  // Blank means nothing was entered; a decimal comma is read as a point (and then refused as not whole).
  return s.trim() === "" ? Number.NaN : Number(s.trim().replace(",", "."));
}

export default function KerberosExchangesLab() {
  // The lab's words.
  const t = useTranslations("learnLabs.kerberos-exchanges");
  // The page's language, for numbers.
  const locale = useLocale();
  // Whole numbers in the page's language.
  const nf = new Intl.NumberFormat(locale);
  // The number fields, as typed.
  const [form, setForm] = useState<Form>(toForm(DEFAULT_INPUT));
  // The three selects.
  const [choice, setChoice] = useState<Pick<KerberosInput, "preauth" | "tickets" | "spn">>({ preauth: DEFAULT_INPUT.preauth, tickets: DEFAULT_INPUT.tickets, spn: DEFAULT_INPUT.spn });
  // The model's input.
  const input: KerberosInput = { clientOffset: readNumber(form.clientOffset), serviceOffset: readNumber(form.serviceOffset), skew: readNumber(form.skew), ...choice };
  // The model's answer, or the code it refused the input with.
  let r: KerberosResult | null = null;
  // The refusal code, when there is one.
  let err: KerberosErrorCode | null = null;
  // Run the pure model.
  try {
    // Compute.
    r = compute(input);
  } catch (e) {
    // Only the model's own refusals are expected here.
    if (e instanceof KerberosError) err = e.code;
    // Anything else is a bug and must surface.
    else throw e;
  }
  // Which number fields are at fault: an offset refusal names both offsets (the model checks them together).
  const badOffset = err === "bad-offset";
  // The skew field.
  const badSkew = err === "bad-skew";
  /** Load a full input into the form and the selects. */
  const load = (i: KerberosInput) => {
    // The numbers.
    setForm(toForm(i));
    // The choices.
    setChoice({ preauth: i.preauth, tickets: i.tickets, spn: i.spn });
  };

  // The pre-authentication choices.
  const preauthOptions = [
    ["sent", t("preauthSent")],
    ["missing", t("preauthMissing")],
  ] as const;
  // The ticket choices.
  const ticketOptions = [
    ["fresh", t("ticketsFresh")],
    ["tgt-expired", t("ticketsTgtExpired")],
    ["st-expired", t("ticketsStExpired")],
  ] as const;
  // The SPN choices.
  const spnOptions = [
    ["registered", t("spnRegistered", { account: SERVICE_ACCOUNT })],
    ["unregistered", t("spnUnregistered")],
    ["wrong-account", t("spnWrongAccount", { account: OTHER_ACCOUNT })],
  ] as const;

  /** A key, worded. */
  const keyText = (k: KeyName): string =>
    // One wording per key.
    k === "none"
      ? t("keyNone")
      : k === "client"
        ? t("keyClient")
        : k === "tgs"
          ? t("keyTgs")
          : k === "tgs-session"
            ? t("keyTgsSession")
            : k === "service"
              ? t("keyService", { account: SERVICE_ACCOUNT })
              : k === "other"
                ? t("keyOther", { account: OTHER_ACCOUNT })
                : t("keyServiceSession");
  /** A part's name, worded, with its message and the earlier tag. */
  const partText = (p: MessagePart): string => {
    // The part's own name.
    const name =
      p.part === "as-req-body" || p.part === "tgs-req-body"
        ? t("partBody")
        : p.part === "pa-enc-timestamp"
          ? t("partPaEncTimestamp")
          : p.part === "tgt"
            ? t("partTgt")
            : p.part === "as-rep-enc" || p.part === "tgs-rep-enc"
              ? t("partEnc")
              : p.part === "tgs-authenticator" || p.part === "ap-authenticator"
                ? t("partAuthenticator")
                : p.part === "service-ticket"
                  ? t("partServiceTicket")
                  : p.part === "ap-rep-enc"
                    ? t("partApRep")
                    : t("partError");
    // The message, the part, and the tag when it travelled earlier.
    return `${t("partOf", { message: p.message, part: name })}${p.earlier ? ` ${t("earlierTag")}` : ""}`;
  };
  /** What a part carries, worded. */
  const carriesText = (p: MessagePart, res: KerberosResult): string =>
    // One wording per part.
    p.part === "as-req-body"
      ? t("carriesAsReqBody")
      : p.part === "pa-enc-timestamp"
        ? t("carriesTimestamp")
        : p.part === "tgt"
          ? t("carriesTicket", { key: t("keyTgsSessionShort") })
          : p.part === "as-rep-enc"
            ? t("carriesRepEnc", { key: t("keyTgsSessionShort") })
            : p.part === "tgs-req-body"
              ? t("carriesTgsReqBody", { spn: SPN })
              : p.part === "tgs-authenticator"
                ? t("carriesTgsAuthenticator")
                : p.part === "service-ticket"
                  ? t("carriesTicket", { key: t("keyServiceSessionShort") })
                  : p.part === "tgs-rep-enc"
                    ? t("carriesRepEnc", { key: t("keyServiceSessionShort") })
                    : p.part === "ap-authenticator"
                      ? t("carriesApAuthenticator")
                      : p.part === "ap-rep-enc"
                        ? t("carriesApRep")
                        : t("carriesError", { error: res.error ?? "" });

  /** The result block for a valid input. */
  const resultBlock = (res: KerberosResult) => {
    // The numbers the sentences quote.
    const nums = { kdcGap: nf.format(res.kdcGap), serviceGap: nf.format(res.serviceGap), skew: nf.format(input.skew) };
    // Step: the AS exchange, said to be at logon when a later ticket expired.
    const asLine =
      res.as === "ok"
        ? `${choice.tickets !== "fresh" ? `${t("earlierLogon")} ` : ""}${t("asOk", nums)}`
        : res.error === "KDC_ERR_PREAUTH_REQUIRED"
          ? t("asPreauth")
          : t("asSkew", nums);
    // Step: the TGS exchange.
    const tgsLine =
      res.tgs === "not-reached"
        ? t("notReached")
        : res.tgs === "ok"
          ? `${choice.tickets === "st-expired" ? `${t("earlierFirstVisit")} ` : ""}${t("tgsOk", { spn: SPN, account: choice.spn === "wrong-account" ? OTHER_ACCOUNT : SERVICE_ACCOUNT })}`
          : res.error === "KRB_AP_ERR_TKT_EXPIRED"
            ? t("tgsExpired")
            : t("tgsUnknown", { spn: SPN });
    // Step: the AP exchange.
    const apLine =
      res.ap === "not-reached"
        ? t("notReached")
        : res.ap === "ok"
          ? t("apOk", { ...nums, account: SERVICE_ACCOUNT })
          : res.error === "KRB_AP_ERR_BAD_INTEGRITY"
            ? t("apBadIntegrity", { other: OTHER_ACCOUNT, account: SERVICE_ACCOUNT })
            : res.error === "KRB_AP_ERR_SKEW"
              ? t("apSkew", nums)
              : t("apExpired");
    // The exchange that failed, worded.
    const where = res.failedAt === "as" ? t("exAs") : res.failedAt === "tgs" ? t("exTgs") : t("exAp");
    // The verdict.
    const verdict =
      res.outcome === "authenticated"
        ? t("verdictOk")
        : res.outcome === "renew"
          ? t("verdictRenew", { error: res.error ?? "", again: res.failedAt === "tgs" ? t("exAs") : t("exTgs") })
          : t("verdictFail", { error: res.error ?? "", where });
    // Authenticated is good news; an expiry the client recovers from is a warning; the rest stop.
    const tone = res.outcome === "authenticated" ? "ok" : res.outcome === "renew" ? "warn" : "stop";
    return (
      <>
        {/* The summary. */}
        <dl className="lab-kv">
          <dt>{t("kvOutcome")}</dt>
          <dd>{res.error ?? t("kvAuthenticated")}</dd>
          <dt>{t("kvKdcGap")}</dt>
          <dd>{t("minutes", { n: nums.kdcGap })}</dd>
          <dt>{t("kvServiceGap")}</dt>
          <dd>{t("minutes", { n: nums.serviceGap })}</dd>
          <dt>{t("kvSkew")}</dt>
          <dd>{t("minutes", { n: nums.skew })}</dd>
        </dl>
        {/* Every part on the wire: the key that seals it and what it carries. */}
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th scope="col">{t("colPart")}</th>
                <th scope="col">{t("colKey")}</th>
                <th scope="col">{t("colCarries")}</th>
              </tr>
            </thead>
            <tbody>
              {res.parts.map((p, i) => (
                <tr key={`${p.message}-${p.part}-${i}`}>
                  <th scope="row">{partText(p)}</th>
                  <td>{keyText(p.key)}</td>
                  <td>{carriesText(p, res)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* The three exchanges, then the verdict. */}
        <ol className="lab-steps">
          <li className="lab-step">
            <span className="lab-step-where">{t("exAs")}</span> {asLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("exTgs")}</span> {tgsLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("exAp")}</span> {apLine}
          </li>
          <li className="lab-step">
            <span className="lab-step-where">{t("stepResult")}</span> <span className={`lab-verdict lab-verdict--${tone}`}>{verdict}</span>
          </li>
        </ol>
        {/* Who knows which key. */}
        <p className="lab-note">{t("noteKeys")}</p>
      </>
    );
  };

  // The refusal, worded for the reader.
  const errText = badOffset
    ? t("errorOffset", { lo: nf.format(OFFSET_RANGE[0]), hi: nf.format(OFFSET_RANGE[1]) })
    : badSkew
      ? t("errorSkew", { lo: nf.format(SKEW_RANGE[0]), hi: nf.format(SKEW_RANGE[1]) })
      : t("errorChoice");

  return (
    <LabFrame
      labId={ID}
      controls={
        <>
          <LabField id={`${ID}-client-offset`} label={t("clientOffset")}>
            {/* No decimal keypad here: the offset can be negative, and some phone keypads have no minus sign. */}
            <input
              id={`${ID}-client-offset`}
              className="lab-input"
              type="number"
              min={OFFSET_RANGE[0]}
              max={OFFSET_RANGE[1]}
              step={1}
              value={form.clientOffset}
              aria-invalid={badOffset ? "true" : undefined}
              onChange={(e) => setForm({ ...form, clientOffset: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-service-offset`} label={t("serviceOffset")}>
            {/* Signed too, so the same keypad. */}
            <input
              id={`${ID}-service-offset`}
              className="lab-input"
              type="number"
              min={OFFSET_RANGE[0]}
              max={OFFSET_RANGE[1]}
              step={1}
              value={form.serviceOffset}
              aria-invalid={badOffset ? "true" : undefined}
              onChange={(e) => setForm({ ...form, serviceOffset: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-skew`} label={t("skew")}>
            <input
              id={`${ID}-skew`}
              className="lab-input"
              type="number"
              inputMode="decimal"
              min={SKEW_RANGE[0]}
              max={SKEW_RANGE[1]}
              step={1}
              value={form.skew}
              aria-invalid={badSkew ? "true" : undefined}
              onChange={(e) => setForm({ ...form, skew: e.target.value })}
            />
          </LabField>
          <LabField id={`${ID}-preauth`} label={t("preauth")}>
            <LabSelect id={`${ID}-preauth`} value={choice.preauth} options={preauthOptions} onChange={(v) => setChoice({ ...choice, preauth: v as Preauth })} />
          </LabField>
          <LabField id={`${ID}-tickets`} label={t("tickets")}>
            <LabSelect id={`${ID}-tickets`} value={choice.tickets} options={ticketOptions} onChange={(v) => setChoice({ ...choice, tickets: v as Tickets })} />
          </LabField>
          <LabField id={`${ID}-spn`} label={t("spn", { spn: SPN })}>
            <LabSelect id={`${ID}-spn`} value={choice.spn} options={spnOptions} onChange={(v) => setChoice({ ...choice, spn: v as SpnState })} />
          </LabField>
        </>
      }
      result={r ? resultBlock(r) : <p className="lab-error">{errText}</p>}
      onExample={() => load(EXAMPLE_INPUT)}
      onReset={() => load(DEFAULT_INPUT)}
      scope={t("scope")}
    />
  );
}
