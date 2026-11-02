"use client";

// ============================================================================
// SSE / SASE single-pass architecture explainer - the UI.
// Describe a request; see the pass. Deterministic and offline.
//
// Share results (2026-11-01, wave 4B): a button under the summary builds a
// link, only when pressed, carrying every field of the form (src/lib/tools/
// sse-architecture-explainer/share.ts, posture input, a form). An arriving
// link sets the fields as if picked.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainPassLocalisable, type RequestShape, type PassResult } from "@/lib/tools/sse-architecture-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the stage names and explanations, contrasts, notes and warnings arrive as EngineTexts
// from explainPassLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { SSE_SHARE } from "@/lib/tools/sse-architecture-explainer/share"; // this tool's share spec

const DEFAULTS: RequestShape = {
  destination: "web", steering: "client", managedDevice: true, tls: true, decrypt: true, hasPayload: true,
};
const EXAMPLE: RequestShape = {
  destination: "unsanctioned-saas", steering: "client", managedDevice: false, tls: true, decrypt: true, hasPayload: true,
};

const DESTINATIONS = ["web", "sanctioned-saas", "unsanctioned-saas", "private-app", "non-web-port"] as const;
const STEERINGS = ["client", "ipsec", "gre", "proxy-chain", "dns"] as const;

export default function SseArchitectureExplainerTool() {
  const t = useTranslations("tools.sse-architecture-explainer");
  const [r, setR] = useState<RequestShape>(DEFAULTS);

  const result = useMemo<PassResult<EngineText>>(() => explainPassLocalisable(r), [r]); // the reading, sentences with ids
  const tx = engineTexts(t); // the engine's sentences in the page's language
  // An arriving share link (2026-11-01): the fields are set as if picked.
  useShareArrival(SSE_SHARE, (x) => setR(x)); // the link's fields
  // What Share results may carry: every field (memoised on them).
  const share = useMemo(() => SSE_SHARE.encode(r), [r]); // the encoding

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label className="cidr-label">{t("formLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setR(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setR(DEFAULTS)}>{t("clear")}</button>
        </div>
      </div>

      <div className="dig-kv">
        <div>
          <label htmlFor="sse-dest" className="cidr-label">{t("fields.destination")}</label>
          <select id="sse-dest" className="cidr-input mono" value={r.destination}
            onChange={(e) => setR({ ...r, destination: e.target.value as RequestShape["destination"] })}>
            {DESTINATIONS.map((d) => <option key={d} value={d}>{t(`destinations.${d}`)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sse-steer" className="cidr-label">{t("fields.steering")}</label>
          <select id="sse-steer" className="cidr-input mono" value={r.steering}
            onChange={(e) => setR({ ...r, steering: e.target.value as RequestShape["steering"] })}>
            {STEERINGS.map((s) => <option key={s} value={s}>{t(`steerings.${s}`)}</option>)}
          </select>
        </div>
      </div>

      <div className="dig-input-actions">
        <label><input type="checkbox" checked={r.managedDevice} onChange={(e) => setR({ ...r, managedDevice: e.target.checked })} /> {t("fields.managed")}</label>
        <label><input type="checkbox" checked={r.tls} onChange={(e) => setR({ ...r, tls: e.target.checked })} /> {t("fields.tls")}</label>
        <label><input type="checkbox" checked={r.decrypt} onChange={(e) => setR({ ...r, decrypt: e.target.checked })} /> {t("fields.decrypt")}</label>
        <label><input type="checkbox" checked={r.hasPayload} onChange={(e) => setR({ ...r, hasPayload: e.target.checked })} /> {t("fields.payload")}</label>
      </div>

      <div className="dig-result">
        <section className="dig-section">
          <h3 className="dig-section-title">{t("summary.title")}</h3>
          <dl className="dig-kv">
            <dt>{t("summary.pillars")}</dt>
            <dd className="mono">{result.pillars.length ? result.pillars.join(", ") : t("summary.none")}</dd>
            <dt>{t("summary.crossCutting")}</dt>
            <dd className="mono">{result.crossCutting.length ? result.crossCutting.map(tx.say).join(", ") : t("summary.none")}</dd>
          </dl>
        </section>

        {/* Share results (2026-11-01): under the summary, before the pass, at the start of its own row. */}
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
        </div>

        <section className="dig-section">
          <h3 className="dig-section-title">{t("pass.title")}</h3>
          <ol className="dig-records">
            {result.stages.map((s) => (
              <li key={s.order} className="dig-record">
                <code className="mono">{s.engaged ? "\u25cf" : "\u25cb"} {tx.say(s.name)}</code>
                <span className="dig-record-type">{t(`kinds.${s.kind}`)}</span>
                <p className="dig-record-explain">{tx.say(s.what)}</p>
                <p className="dig-record-explain">{tx.say(s.because)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="dig-section">
          <h3 className="dig-section-title">{t("contrast.title")}</h3>
          <ul className="dig-notes">{result.contrast.map((c, i) => <li key={i}>{tx.say(c)}</li>)}</ul>
        </section>

        {result.notes.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}</ul>
          </section>
        )}
        {result.warnings.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.warnings.map((w, i) => <li key={i}>{tx.say(w)}</li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
