"use client";

// ============================================================================
// src/components/F5xcLbAlgorithmChooserTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC load-balancing algorithm chooser. A short questionnaire
// (persistence? by what key? dynamic pool?) yields a recommended XC origin-pool
// algorithm with rationale, the BIG-IP equivalent, caveats, and a config note.
// All recommendation text is localized from i18n keyed by algo + caveat id, so
// the pure compute stays language-free. Reuses cidr-* / jwt-* vocabulary.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { recommend, ALGO_META, type AnswerState, type Distribution, type SessionKey } from "@/lib/tools/f5xc-lb-algorithm-chooser/compute";

const EMPTY: AnswerState = { needsPersistence: null, distribution: null, sessionKey: null, dynamicPool: null };

export default function F5xcLbAlgorithmChooserTool() {
  const t = useTranslations("tools.f5xc-lb-algorithm-chooser");
  const [a, setA] = useState<AnswerState>(EMPTY);

  const rec = useMemo(() => recommend(a), [a]);

  const set = useCallback(<K extends keyof AnswerState>(k: K, v: AnswerState[K]) => setA((s) => ({ ...s, [k]: v })), []);
  const loadExample = useCallback(() => setA({ needsPersistence: true, distribution: null, sessionKey: "cookie", dynamicPool: false }), []);
  const clearAll = useCallback(() => setA(EMPTY), []);

  const pill = (active: boolean) => (active ? { borderColor: "var(--accent-primary)", color: "var(--accent-primary)" } : undefined);

  return (
    <div className="cidr-tool jwt-tool">
      <div className="dig-input-head">
        <span className="cidr-label">{t("title")}</span>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={loadExample}>
            {t("example")}
          </button>
          <button type="button" className="b64-copy" onClick={clearAll}>
            {t("clear")}
          </button>
        </div>
      </div>

      {/* Q1: persistence */}
      <div className="cidr-input-row">
        <label className="cidr-label">{t("q1")}</label>
        <div className="jwt-badges" style={{ gap: "0.4rem", marginTop: "0.4rem" }}>
          <button type="button" className="b64-copy" style={pill(a.needsPersistence === true)} onClick={() => set("needsPersistence", true)}>
            {t("yes")}
          </button>
          <button type="button" className="b64-copy" style={pill(a.needsPersistence === false)} onClick={() => set("needsPersistence", false)}>
            {t("no")}
          </button>
        </div>
      </div>

      {/* Q2a: distribution (no persistence) */}
      {a.needsPersistence === false && (
        <div className="cidr-input-row">
          <label className="cidr-label">{t("q2dist")}</label>
          <div className="jwt-badges" style={{ gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
            {(["even", "least-loaded", "random"] as Distribution[]).map((d) => (
              <button key={d} type="button" className="b64-copy" style={pill(a.distribution === d)} onClick={() => set("distribution", d)}>
                {t(`dist.${d}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q2b: session key (persistence) */}
      {a.needsPersistence === true && (
        <div className="cidr-input-row">
          <label className="cidr-label">{t("q2key")}</label>
          <div className="jwt-badges" style={{ gap: "0.4rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
            {(["source-ip", "cookie", "custom-header", "per-route"] as SessionKey[]).map((k) => (
              <button key={k} type="button" className="b64-copy" style={pill(a.sessionKey === k)} onClick={() => set("sessionKey", k)}>
                {t(`key.${k}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q3: dynamic pool */}
      {a.needsPersistence !== null && (
        <div className="cidr-input-row">
          <label className="cidr-label">{t("q3dyn")}</label>
          <div className="jwt-badges" style={{ gap: "0.4rem", marginTop: "0.4rem" }}>
            <button type="button" className="b64-copy" style={pill(a.dynamicPool === true)} onClick={() => set("dynamicPool", true)}>
              {t("yes")}
            </button>
            <button type="button" className="b64-copy" style={pill(a.dynamicPool === false)} onClick={() => set("dynamicPool", false)}>
              {t("no")}
            </button>
          </div>
        </div>
      )}

      {/* recommendation */}
      {!rec.complete ? (
        <p className="cipher-note" style={{ marginTop: "0.75rem" }}>
          {t("prompt")}
        </p>
      ) : (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              {t("recTitle")}: <span className="mono">{t(`algo.${rec.algo}.label`)}</span>{" "}
              <span className={`jwt-badge mono ${rec.persists ? "jwt-badge--ok" : ""}`}>{rec.persists ? t("persistsBadge") : t("noPersistBadge")}</span>
            </h4>
            <p className="cipher-note">{t(`algo.${rec.algo}.rationale`)}</p>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("bigipLabel")}</span>
              <span className="jwt-claim-value mono">{t(`algo.${rec.algo}.bigip`)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("configLabel")}</span>
              <span className="jwt-claim-value">{t(`algo.${rec.algo}.config`)}</span>
            </div>
            {(rec.caveatIds ?? []).length > 0 && (
              <div style={{ marginTop: "0.4rem" }}>
                <div className="jwt-claim-label">{t("caveatsLabel")}</div>
                {(rec.caveatIds ?? []).map((c) => (
                  <p className="cipher-note" key={c}>
                    - {t(`caveat.${c}`)}
                  </p>
                ))}
              </div>
            )}
          </section>

          <p className="cipher-note">{t("teachingNote")}</p>
        </div>
      )}
    </div>
  );
}
