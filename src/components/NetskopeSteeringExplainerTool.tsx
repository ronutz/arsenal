"use client";

// ============================================================================
// Netskope steering-method explainer - the UI.
// Describe the situation; get the method, and what it costs. Offline.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSteering, type Situation, type SteeringResult } from "@/lib/tools/netskope-steering-explainer";

const DEFAULTS: Situation = {
  managedDevice: true, onPremises: false, canInstallCert: true,
  needUserIdentity: true, needPrivateApps: false, needNonWebPorts: false,
  existingProxy: false,
};
const EXAMPLE: Situation = {
  managedDevice: false, onPremises: true, canInstallCert: false,
  needUserIdentity: true, needPrivateApps: false, needNonWebPorts: true,
  existingProxy: true,
};

const FLAGS = [
  "managedDevice", "onPremises", "canInstallCert",
  "needUserIdentity", "needPrivateApps", "needNonWebPorts", "existingProxy",
] as const;

export default function NetskopeSteeringExplainerTool() {
  const t = useTranslations("tools.netskope-steering-explainer");
  const [s, setS] = useState<Situation>(DEFAULTS);

  const result = useMemo<SteeringResult>(() => explainSteering(s), [s]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label">{t("formLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setS(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setS(DEFAULTS)}>{t("clear")}</button>
        </div>
      </div>

      <div className="dig-input-actions">
        {FLAGS.map((k) => (
          <label key={k}>
            <input
              type="checkbox"
              checked={s[k]}
              onChange={(e) => setS({ ...s, [k]: e.target.checked })}
            />{" "}
            {t(`flags.${k}`)}
          </label>
        ))}
      </div>

      <div className="dig-result">
        <section className="dig-section">
          <h3 className="dig-section-title">{t("methods.title")}</h3>
          <ol className="dig-records">
            {result.recommendations.map((r) => (
              <li key={r.method} className="dig-record">
                <code className="mono">{t(`methods.${r.method}`)}</code>
                <span className="dig-record-type">{t(`fit.${r.fit}`)}</span>
                <p className="dig-record-explain">{r.why}</p>
                {/* THE COSTS ARE SHOWN WHETHER OR NOT THE METHOD WAS CHOSEN.
                    A tool that only listed the downsides of the options it
                    rejected would be an advert for the one it picked. */}
                <ul className="dig-notes">
                  {r.costs.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {result.warnings.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </section>
        )}
        <section className="dig-section">
          <h3 className="dig-section-title">{t("notes.title")}</h3>
          <ul className="dig-notes">{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
