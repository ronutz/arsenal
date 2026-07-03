"use client";

// ============================================================================
// src/components/GslbDecisionFlowTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE GSLB DECISION-FLOW EXPLAINER.
//
// Paste gtm wideip / gtm pool stanzas and the two-tier BIG-IP DNS decision
// renders as it really runs: the wide IP's pool-selection method, then each
// pool's preferred -> alternate -> fallback chain, every tier carrying the
// vendor's semantics and the deterministic observations underneath. A method
// name renders one card; "methods" renders both catalogues.
//
// The engine throws on bad input (the worker-compatible contract), so the
// live run is wrapped and errors render in the shared error box. All chrome
// strings come from the tools.f5-gslb-decision-flow namespace; the engine's
// explanatory text is English by design, like its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  type GslbResult,
  type GtmMethodExplain,
  type GtmPoolReading,
  type WideipReading,
} from "@/lib/tools/f5-gslb-decision-flow";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: GslbResult } | { ok: false; message: string };

// The one-click example (D-83): the golden-vector configuration that fires
// the marquee observations - topology at both tiers with the manual's
// fallback-to-None warning, the return-to-dns default, unused ratios, and a
// broken Fallback IP wiring on the second pool.
const EXAMPLE = `gtm wideip a app.example.com {
    pool-lb-mode topology
    pools {
        pool_dc1 { order 0 }
        pool_dc2 { order 1 }
    }
}
gtm pool a pool_dc1 {
    load-balancing-mode topology
    alternate-mode packet-rate
    members {
        srv1:vs_http { ratio 3 }
        srv2:vs_http { }
    }
}
gtm pool a pool_dc2 {
    fallback-mode fallback-ip
    dynamic-ratio enabled
}`;

/** One pool-tier method card (used by the catalog and single-method modes). */
function MethodCard({ m, t }: { m: GtmMethodExplain; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object lbm-method">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{m.token}</span>
        <span className="tmsh-object-name">{m.gui}</span>
        <span className={`lbm-chip lbm-family-${m.family}`}>{t(m.family === "static" ? "familyStatic" : "familyDynamic")}</span>
        <span className="lbm-chip gdf-metric">{t(m.metricSource === "ldns-path" ? "metricPath" : m.metricSource === "server-side" ? "metricServer" : "metricNone")}</span>
      </header>
      <dl className="lbm-facts">
        <div>
          <dt>{t("behaviorHeading")}</dt>
          <dd>{m.behavior}</dd>
        </div>
        <div>
          <dt>{t("tiersHeading")}</dt>
          <dd className="gdf-tiers">
            <span className={`lbm-chip ${m.allowedIn.preferred ? "gdf-tier-yes" : "gdf-tier-no"}`}>{t("tierPreferred")}</span>
            <span className={`lbm-chip ${m.allowedIn.alternate ? "gdf-tier-yes" : "gdf-tier-no"}`}>{t("tierAlternate")}</span>
            <span className={`lbm-chip ${m.allowedIn.fallback ? "gdf-tier-yes" : "gdf-tier-no"}`}>{t("tierFallback")}</span>
          </dd>
        </div>
      </dl>
      {m.notes.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("notesHeading")}</p>
          <ul>
            {m.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/** One pool's three-tier chain plus settings and observations. */
function PoolCard({ p, t }: { p: GtmPoolReading; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object gdf-pool">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">gtm pool {p.recordType}</span>
        <span className="tmsh-object-name mono">{p.name}</span>
        {p.memberCount > 0 && <span className="lbm-chip">{t("memberCount", { count: p.memberCount })}</span>}
      </header>
      <ol className="gdf-chain">
        {p.chain.map((s) => (
          <li className="gdf-step" key={s.tier}>
            <div className="gdf-step-head">
              <span className="gdf-step-tier">{t(s.tier === "preferred" ? "tierPreferred" : s.tier === "alternate" ? "tierAlternate" : "tierFallback")}</span>
              <span className="lbm-chip mono">{s.token}</span>
              {s.defaulted && <span className="lbm-chip gdf-default">{t("defaulted")}</span>}
              {s.method && <span className={`lbm-chip lbm-family-${s.method.family}`}>{t(s.method.family === "static" ? "familyStatic" : "familyDynamic")}</span>}
            </div>
            {s.method ? <p className="gdf-step-behavior">{s.method.behavior}</p> : <p className="gdf-step-behavior">{t("undocumentedToken")}</p>}
            <p className="gdf-step-tiernote">{s.tierNote}</p>
          </li>
        ))}
      </ol>
      {p.settings.length > 0 && (
        <dl className="lbm-settings">
          {p.settings.map((s, j) => (
            <div className="lbm-setting" key={j}>
              <dt className="mono">{s.key}</dt>
              <dd>
                <span className="mono">{s.value}</span>
                {s.note && <span className="lbm-setting-note">· {s.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {p.observations.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("observationsTitle")}</div>
          <ul className="dig-warning-list">
            {p.observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/** One wide IP's pool-selection tier. */
function WideipCard({ w, t }: { w: WideipReading; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object gdf-wideip">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">gtm wideip {w.recordType}</span>
        <span className="tmsh-object-name mono">{w.name}</span>
        <span className="lbm-chip mono">{w.poolLbMode}</span>
        {w.poolLbModeAsWritten === null && <span className="lbm-chip gdf-default">{t("defaulted")}</span>}
      </header>
      <p className="gdf-step-behavior">{w.poolLbNote}</p>
      {w.pools.length > 0 && (
        <p className="gdf-pools-line">
          <span className="lbm-subhead">{t("attachedPools")}</span>{" "}
          {w.pools.map((p) => (
            <span className="lbm-chip mono" key={p.name}>
              {p.name}
              {p.order !== undefined ? ` #${p.order}` : ""}
              {p.ratio !== undefined ? ` ×${p.ratio}` : ""}
            </span>
          ))}
        </p>
      )}
      {w.settings.length > 0 && (
        <dl className="lbm-settings">
          {w.settings.map((s, j) => (
            <div className="lbm-setting" key={j}>
              <dt className="mono">{s.key}</dt>
              <dd>
                <span className="mono">{s.value}</span>
                {s.note && <span className="lbm-setting-note">· {s.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {w.observations.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("observationsTitle")}</div>
          <ul className="dig-warning-list">
            {w.observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function GslbDecisionFlowTool() {
  const t = useTranslations("tools.f5-gslb-decision-flow");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool gdf-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="gdf-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="gdf-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="gdf-privacy"
        />
        <p id="gdf-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {live && !live.ok && (
        <p className="cidr-error" role="alert">
          {live.message}
        </p>
      )}

      {live && live.ok && (
        <div className="jwt-results gdf-results">
          {live.value.notes.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("notesTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {live.value.mode === "method" && live.value.method && <MethodCard m={live.value.method} t={t} />}

          {live.value.mode === "catalog" && (
            <>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("wideipTierTitle")}</div>
                <ul className="gdf-wip-catalog">
                  {live.value.wideipMethods!.map((m) => (
                    <li key={m.token}>
                      <span className="lbm-chip mono">{m.token}</span> {m.note}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("poolTierTitle")}</div>
              </div>
              {live.value.catalog!.map((m) => (
                <MethodCard m={m} t={t} key={m.token} />
              ))}
            </>
          )}

          {live.value.mode === "config" && (
            <>
              {live.value.wideips!.map((w, i) => (
                <WideipCard w={w} t={t} key={i} />
              ))}
              {live.value.pools!.map((p, i) => (
                <PoolCard p={p} t={t} key={i} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
