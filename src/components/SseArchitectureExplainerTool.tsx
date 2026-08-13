"use client";

// ============================================================================
// SSE / SASE single-pass architecture explainer - the UI.
// Describe a request; see the pass. Deterministic and offline.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainPass, type RequestShape, type PassResult } from "@/lib/tools/sse-architecture-explainer";

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

  const result = useMemo<PassResult>(() => explainPass(r), [r]);

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
            <dd className="mono">{result.crossCutting.length ? result.crossCutting.join(", ") : t("summary.none")}</dd>
          </dl>
        </section>

        <section className="dig-section">
          <h3 className="dig-section-title">{t("pass.title")}</h3>
          <ol className="dig-records">
            {result.stages.map((s) => (
              <li key={s.order} className="dig-record">
                <code className="mono">{s.engaged ? "\u25cf" : "\u25cb"} {s.name}</code>
                <span className="dig-record-type">{t(`kinds.${s.kind}`)}</span>
                <p className="dig-record-explain">{s.what}</p>
                <p className="dig-record-explain">{s.because}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="dig-section">
          <h3 className="dig-section-title">{t("contrast.title")}</h3>
          <ul className="dig-notes">{result.contrast.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>

        {result.notes.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        )}
        {result.warnings.length > 0 && (
          <section className="dig-section">
            <h3 className="dig-section-title">{t("warnings.title")}</h3>
            <ul className="dig-notes">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </section>
        )}
      </div>
    </div>
  );
}
