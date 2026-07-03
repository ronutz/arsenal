"use client";

// ============================================================================
// src/components/DosVectorExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE AFM DoS-VECTOR EXPLAINER. Defensive configuration only.
//
// Paste security dos device-config / profile stanzas and every vector entry
// renders as a card: the vendor's one-line identity, the annotated threshold
// fields, and the deterministic observations underneath - the mitigation-
// below-detection inversion, automatic-mode semantics, silent policing,
// enforce/state meanings, bad-actor wiring, and the tcp-half-open interplay
// notes. A vector name renders one card; "vectors" renders the grouped
// catalogue. This tool explains protections; it never generates traffic.
//
// The engine throws on bad input (the worker-compatible contract); the live
// run is wrapped and errors render in the shared error box. Chrome strings
// come from the tools.f5-dos-vector-explainer namespace; the engine's
// explanatory text is English by design, like its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  type DosResult,
  type VectorInfo,
  type VectorReading,
} from "@/lib/tools/f5-dos-vector-explainer";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: DosResult } | { ok: false; message: string };

// The one-click example (D-83): the golden-vector device config that fires
// the marquee observations - the half-open inversion with its silent-drop
// warning, automatic mode with inert manual numbers, detection-disabled
// policing on udp-flood, bad-actor wiring on sweep, and a db tunable.
const EXAMPLE = `security dos device-config dos-device-config {
    threshold-sensitivity medium
    dos-device-vector {
        tcp-half-open {
            detection-threshold-pps 2500
            default-internal-rate-limit 2000
            enforce enabled
        }
        icmpv4-flood {
            auto-threshold enabled
            detection-threshold-pps 10000
        }
        udp-flood {
            detection-threshold-pps infinite
            detection-threshold-percent infinite
            default-internal-rate-limit 30000
        }
        sweep {
            bad-actor enabled
        }
    }
}`;

/** One catalogue/lookup card for a curated vector. */
function VectorCard({ v, t }: { v: VectorInfo; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object dve-vector">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{v.name}</span>
        <span className="lbm-chip dve-cat">{v.category}</span>
        {v.dbVar && <span className="lbm-chip mono dve-db">sys db {v.dbVar}</span>}
      </header>
      <p className="gdf-step-behavior">{v.description}</p>
      {v.notes && v.notes.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("notesHeading")}</p>
          <ul>
            {v.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/** One parsed reading: identity + fields + observations. */
function ReadingCard({ r, t }: { r: VectorReading; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object dve-reading">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{r.name}</span>
        <span className="lbm-chip">{r.context === "device" ? t("contextDevice") : t("contextProfile")}</span>
        {r.profileName && <span className="lbm-chip mono">{r.profileName}</span>}
        {r.profileSection && <span className="lbm-chip mono">{r.profileSection}</span>}
        {r.info ? <span className="lbm-chip dve-cat">{r.info.category}</span> : <span className="lbm-chip dve-uncurated">{t("uncurated")}</span>}
      </header>
      {r.info && <p className="gdf-step-behavior">{r.info.description}</p>}
      {r.fields.length > 0 && (
        <dl className="lbm-settings">
          {r.fields.map((f, j) => (
            <div className="lbm-setting" key={j}>
              <dt className="mono">{f.key}</dt>
              <dd>
                <span className="mono">{f.value}</span>
                {f.note && <span className="lbm-setting-note">· {f.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {r.observations.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <div className="jwt-panel-title">{t("observationsTitle")}</div>
          <ul className="dig-warning-list">
            {r.observations.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function DosVectorExplainerTool() {
  const t = useTranslations("tools.f5-dos-vector-explainer");
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
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool dve-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="dve-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="dve-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="dve-privacy"
        />
        <p id="dve-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
        <p className="dve-posture">{t("defensiveNote")}</p>
      </div>

      {live && !live.ok && (
        <p className="cidr-error" role="alert">
          {live.message}
        </p>
      )}

      {live && live.ok && (
        <div className="jwt-results dve-results">
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

          {live.value.mode === "vector" && live.value.vector && <VectorCard v={live.value.vector} t={t} />}

          {live.value.mode === "catalog" &&
            live.value.catalog!.map((g) => (
              <div key={g.category}>
                <div className="jwt-panel">
                  <div className="jwt-panel-title">
                    {g.label} <span className="lbm-chip mono">{g.vectors.length}</span>
                  </div>
                </div>
                {g.vectors.map((v) => (
                  <VectorCard v={v} t={t} key={v.name} />
                ))}
              </div>
            ))}

          {live.value.mode === "config" && live.value.readings!.map((r, i) => <ReadingCard r={r} t={t} key={i} />)}
        </div>
      )}
    </div>
  );
}
