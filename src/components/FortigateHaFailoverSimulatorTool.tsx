"use client";

// ============================================================================
// src/components/FortigateHaFailoverSimulatorTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FGCP HA ELECTION SIMULATOR.
//
// Describe a cluster, see who becomes primary and WHY. The counterfactual is
// rendered as prominently as the result, because "here is the setting that
// decides it" is more actionable than "here is the winner".
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, criterionOrder, type HaResult } from "@/lib/tools/fortigate-ha-failover-simulator";

/** D-83: golden-vector-faithful sample. The rebooted-preferred-unit case,
 *  which is the confusion this tool exists to resolve. */
const EXAMPLE = `override: disable
member: name=FGT-A, serial=FG100A, priority=200, age=120, failed=0
member: name=FGT-B, serial=FG100B, priority=128, age=8600, failed=0`;

export default function FortigateHaFailoverSimulatorTool() {
  const t = useTranslations("tools.fortigate-ha-failover-simulator");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: HaResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fha-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fha-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={6}
          aria-describedby="fha-privacy"
        />
        <p id="fha-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("howItWorks")}</h3>
          <ul className="cidr-list">
            {result.findings.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "simulate" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {result.primary && (
            <>
              <p className="cidr-result-title">
                {t("primaryIs", { name: result.primary.name })}
                {result.decidedBy ? ` — ${t("decidedBy", { criterion: t(`crit_${result.decidedBy}`) })}` : ""}
              </p>

              {/* The evaluation order actually in force, which changes with
                  override and is the thing people misremember. */}
              <p className="cidr-note">
                {t("orderInForce", {
                  mode: result.override ? t("overrideOn") : t("overrideOff"),
                  order: criterionOrder(result.override).map((c) => t(`crit_${c}`)).join(" > "),
                })}
              </p>

              {result.findings.length > 0 && (
                <ul className="cidr-list">
                  {result.findings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}

              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colMember")}</th>
                    <th>{t("crit_failed")}</th>
                    <th>{t("crit_age")}</th>
                    <th>{t("crit_priority")}</th>
                    <th>{t("crit_serial")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.members.map((m) => (
                    <tr key={m.serial}>
                      <td className="mono">
                        {m.name}
                        {result.primary && m.name === result.primary.name
                          ? ` ${t("primaryTag")}`
                          : ""}
                      </td>
                      <td className="mono">{m.failed}</td>
                      <td className="mono">{m.age}</td>
                      <td className="mono">{m.priority}</td>
                      <td className="mono">{m.serial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {result.trace.length > 0 && (
                <ul className="cidr-list">
                  {result.trace.map((c, i) => <li key={i}>{c.detail}</li>)}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
