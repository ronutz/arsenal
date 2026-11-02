"use client";

// ============================================================================
// Netskope steering-method explainer - the UI.
// Describe the situation; get the method, and what it costs. Offline.
//
// Share results (2026-11-01, wave 4B): a button under the methods' heading
// builds a link, only when pressed, carrying the seven answers (src/lib/tools/
// netskope-steering-explainer/share.ts, posture input, a form). An arriving
// link ticks the boxes as if clicked.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainSteeringLocalisable, type Situation, type SteeringResult } from "@/lib/tools/netskope-steering-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the reasons, costs, notes and warnings arrive as EngineTexts from
// explainSteeringLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { STEERING_METHOD_SHARE } from "@/lib/tools/netskope-steering-explainer/share"; // this tool's share spec

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

  const result = useMemo<SteeringResult<EngineText>>(() => explainSteeringLocalisable(s), [s]); // the reading, sentences with ids
  const tx = engineTexts(t); // the engine's sentences in the page's language
  // An arriving share link (2026-11-01): the boxes are ticked as if clicked.
  useShareArrival(STEERING_METHOD_SHARE, (x) => setS(x)); // the link's answers
  // What Share results may carry: the seven answers (memoised on them).
  const share = useMemo(() => STEERING_METHOD_SHARE.encode(s), [s]); // the encoding

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
          {/* Share results (2026-11-01): under the methods' heading, before the long list of methods and costs, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
          <ol className="dig-records">
            {result.recommendations.map((r) => (
              <li key={r.method} className="dig-record">
                <code className="mono">{t(`methods.${r.method}`)}</code>
                <span className="dig-record-type">{t(`fit.${r.fit}`)}</span>
                <p className="dig-record-explain">{tx.say(r.why)}</p>
                {/* THE COSTS ARE SHOWN WHETHER OR NOT THE METHOD WAS CHOSEN.
                    A tool that only listed the downsides of the options it
                    rejected would be an advert for the one it picked. */}
                <ul className="dig-notes">
                  {r.costs.map((c, i) => <li key={i}>{tx.say(c)}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {result.warnings.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
          </section>
        )}
        <section className="dig-section">
          <h3 className="dig-section-title">{t("notes.title")}</h3>
          <ul className="dig-notes">{result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
