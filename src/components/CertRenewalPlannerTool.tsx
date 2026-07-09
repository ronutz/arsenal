"use client";

// ============================================================================
// src/components/CertRenewalPlannerTool.tsx
// ----------------------------------------------------------------------------
// THE CERTIFICATE RENEWAL PLANNER.
//
// Enter a certificate's issue (notBefore) and expiry (notAfter) dates and get:
// its validity length, whether that length is within the CA/Browser Forum
// SC-081v3 cap for its issuance date, the renewal cadence it implies (and the
// escalation at every future cap), the domain/identity validation-reuse windows
// for that era, and a recommended "renew by" date. The deterministic core does
// all of that purely from the two dates; the one clock-relative convenience —
// "days remaining" / "expired" — is computed here in the client from the device
// clock, captured once on mount and clearly separated from the pure engine.
// Everything runs in the browser; nothing is uploaded.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  analyzeRenewal,
  RenewalInputError,
  type RenewalAnalysis,
} from "@/lib/tools/cert-renewal-planner";

type Result = { ok: true; data: RenewalAnalysis } | { ok: false; code: string } | null;

const DAY = 86_400_000;
const PHASE_KEYS = ["phaseP0", "phaseP1", "phaseP2", "phaseP3"] as const;

function isoToMs(iso: string): number {
  return Date.parse(iso + "T00:00:00Z");
}

export default function CertRenewalPlannerTool() {
  const t = useTranslations("tools.cert-renewal-planner");
  const [notBefore, setNotBefore] = useState("");
  const [notAfter, setNotAfter] = useState("");
  // Captured once on mount; never ticks. A client-only convenience.
  const [nowMs] = useState(() => Date.now());

  const result: Result = useMemo(() => {
    if (!notBefore.trim() && !notAfter.trim()) return null;
    if (!notBefore.trim() || !notAfter.trim()) return { ok: false, code: "empty" };
    try {
      return { ok: true, data: analyzeRenewal(notBefore, notAfter) };
    } catch (e) {
      return { ok: false, code: e instanceof RenewalInputError ? e.code : "invalid" };
    }
  }, [notBefore, notAfter]);

  const errMsg = (code: string): string => {
    const known = ["empty", "invalidDate", "order", "tooLong", "invalid"];
    return known.includes(code) ? t(`err_${code}`) : t("err_invalid");
  };

  const loadExample = () => {
    setNotBefore("2026-06-01");
    setNotAfter("2026-08-30");
  };

  const a = result && result.ok ? result.data : null;
  const remainingDays = a ? Math.round((isoToMs(a.notAfterIso) - nowMs) / DAY) : 0;
  const renewByDays = a ? Math.round((isoToMs(a.renewByIso) - nowMs) / DAY) : 0;

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool epoch-tool cert-renewal-tool">
      <div className="cert-renewal-inputs">
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="crp-nb">
            {t("notBeforeLabel")}
          </label>
          <input
            id="crp-nb"
            type="date"
            className="cidr-input mono cert-renewal-date"
            value={notBefore}
            onChange={(e) => setNotBefore(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="cidr-input-row">
          <label className="cidr-label" htmlFor="crp-na">
            {t("notAfterLabel")}
          </label>
          <input
            id="crp-na"
            type="date"
            className="cidr-input mono cert-renewal-date"
            value={notAfter}
            onChange={(e) => setNotAfter(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <p className="epoch-privacy" id="crp-privacy">
        {t("runsLocally")}{" "}
        <button type="button" className="cert-renewal-example-btn" onClick={loadExample}>
          {t("exampleLabel")}
        </button>
        <button type="button" className="cert-renewal-example-btn" onClick={() => { setNotBefore(""); setNotAfter(""); }}>
          {t("clearLabel")}
        </button>
      </p>

      {result && !result.ok && (
        <p className="cidr-error saml-error" role="alert">
          {errMsg(result.code)}
        </p>
      )}

      {a && (
        <div className="cert-renewal-results">
          {/* Summary */}
          <section className="cert-renewal-card">
            <h3 className="cert-renewal-h3">{t("summaryHeading")}</h3>
            <div className="cert-renewal-summary">
              <span className="cert-renewal-validity mono">
                {t("validity", { days: a.validityDays })}
              </span>
              <span
                className={
                  "cert-renewal-badge " +
                  (a.compliant ? "cert-renewal-badge-ok" : "cert-renewal-badge-warn")
                }
              >
                {a.compliant ? t("compliantBadge") : t("overCapBadge")}
              </span>
            </div>
            {a.compliant ? (
              <p className="cert-renewal-line">{t("maxForPhase", { max: a.maxAllowedDays })}</p>
            ) : (
              <p className="cert-renewal-line cert-renewal-line-warn">
                {t("overByText", { days: a.overByDays, max: a.maxAllowedDays })}
              </p>
            )}
            <p className="cert-renewal-line">{t("renewalsValue", { n: a.renewalsPerYear })}</p>
          </section>

          {/* Device-clock conveniences */}
          <section className="cert-renewal-card">
            <h3 className="cert-renewal-h3">{t("remainingHeading")}</h3>
            <p className="cert-renewal-line">
              {remainingDays >= 0
                ? t("daysRemaining", { days: remainingDays })
                : t("expiredText", { days: Math.abs(remainingDays) })}
            </p>
            <p className="cert-renewal-line">
              {t("renewByText", { date: a.renewByIso, lead: a.recommendedLeadDays })}
              {remainingDays >= 0 && renewByDays >= 0 ? " · " + t("renewByDue", { days: renewByDays }) : ""}
            </p>
          </section>

          {/* Validation reuse */}
          <section className="cert-renewal-card">
            <h3 className="cert-renewal-h3">{t("reuseHeading")}</h3>
            <p className="cert-renewal-line">{t("dcvText", { days: a.dcvReuseDays })}</p>
            <p className="cert-renewal-line">{t("siiText", { days: a.siiReuseDays })}</p>
          </section>

          {/* SC-081v3 schedule */}
          <section className="cert-renewal-card">
            <h3 className="cert-renewal-h3">{t("scheduleHeading")}</h3>
            <p className="cert-renewal-line cert-renewal-muted">{t("scheduleIntro")}</p>
            <div className="cert-renewal-table-wrap">
              <table className="cert-renewal-table mono">
                <thead>
                  <tr>
                    <th>{t("colPeriod")}</th>
                    <th>{t("colValidity")}</th>
                    <th>{t("colDcv")}</th>
                    <th>{t("colSii")}</th>
                  </tr>
                </thead>
                <tbody>
                  {a.schedule.map((p, i) => (
                    <tr
                      key={p.id}
                      className={i === a.issuancePhaseIndex ? "cert-renewal-row-active" : ""}
                    >
                      <td>
                        {t(PHASE_KEYS[i])}
                        {i === a.issuancePhaseIndex ? (
                          <span className="cert-renewal-here"> {t("yourPhase")}</span>
                        ) : null}
                      </td>
                      <td>{p.maxValidityDays}</td>
                      <td>{p.dcvReuseDays}</td>
                      <td>{p.siiReuseDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Projection */}
          <section className="cert-renewal-card">
            <h3 className="cert-renewal-h3">{t("projectionHeading")}</h3>
            <p className="cert-renewal-line cert-renewal-muted">{t("projectionIntro")}</p>
            <ul className="cert-renewal-projection">
              {a.projection.map((p) => (
                <li key={p.id} className="mono">
                  {p.maxValidityDays}d → {p.renewalsPerYear}/{t("perYearShort")}
                </li>
              ))}
            </ul>
          </section>

          {/* Notes */}
          {a.notes.length > 0 && (
            <ul className="cert-renewal-notes">
              {a.notes.map((n, i) => (
                <li
                  key={i}
                  className={
                    "cert-renewal-note " +
                    (n.level === "warn" ? "cert-renewal-note-warn" : "cert-renewal-note-info")
                  }
                >
                  {n.code === "overCap"
                    ? t("note_overCap", { max: a.maxAllowedDays })
                    : t(`note_${n.code}`)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
