"use client";

// ============================================================================
// src/components/IrulesEventOrderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULE EVENT-ORDER PLANNER.
//
// Toggle the profile stack on a Standard virtual server (client-SSL, HTTP,
// server-SSL, pool, or FastL4) and see the order the common connection events
// fire, as a color-coded inline SVG timeline plus an ordered list, with the
// conditional (collect / failure / 100-Continue) events called out. The plan
// comes from the pure engine; everything renders in the browser.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  planEventOrder,
  type VirtualConfig,
  type EventSide,
} from "@/lib/tools/irules-event-order";

const SIDE_COLOR: Record<EventSide, string> = {
  client: "var(--accent-primary)",
  server: "var(--accent-amber)",
  global: "var(--text-secondary)",
};

const PRESETS: { key: string; cfg: VirtualConfig }[] = [
  { key: "https", cfg: { fastL4: false, clientSsl: true, http: true, serverSsl: true, pool: true } },
  { key: "offload", cfg: { fastL4: false, clientSsl: true, http: true, serverSsl: false, pool: true } },
  { key: "http", cfg: { fastL4: false, clientSsl: false, http: true, serverSsl: false, pool: true } },
  { key: "tcp", cfg: { fastL4: false, clientSsl: false, http: false, serverSsl: false, pool: true } },
];

const TOGGLES: { field: keyof VirtualConfig; key: string }[] = [
  { field: "clientSsl", key: "tog_clientssl" },
  { field: "http", key: "tog_http" },
  { field: "serverSsl", key: "tog_serverssl" },
  { field: "pool", key: "tog_pool" },
  { field: "fastL4", key: "tog_fastl4" },
];

export default function IrulesEventOrderTool() {
  const t = useTranslations("tools.irules-event-order");
  const [cfg, setCfg] = useState<VirtualConfig>({
    fastL4: false,
    clientSsl: true,
    http: true,
    serverSsl: true,
    pool: true,
  });

  const result = useMemo(() => planEventOrder(cfg), [cfg]);

  const toggle = (field: keyof VirtualConfig) =>
    setCfg((c) => ({ ...c, [field]: !c[field] }));

  const sideLabel = (s: EventSide) =>
    s === "client" ? t("sideClient") : s === "server" ? t("sideServer") : t("sideGlobal");

  // --- inline SVG timeline -------------------------------------------------
  const events = result.events;
  const rowH = 58;
  const top = 24;
  const spineX = 92;
  const width = 680;
  const height = top + (events.length - 1) * rowH + 16 + 26;
  const cyOf = (i: number) => top + i * rowH + 16;

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool irev-tool">
      <div className="cidr-input-row">
        <p className="cidr-label">{t("stackLabel")}</p>
        <div className="irev-toggles">
          {TOGGLES.map(({ field, key }) => (
            <label key={key} className={`irev-toggle${cfg[field] ? " irev-toggle-on" : ""}`}>
              <input type="checkbox" checked={cfg[field]} onChange={() => toggle(field)} />
              <span>{t(key)}</span>
            </label>
          ))}
        </div>
        <div className="irev-presets">
          <span className="irev-presets-label">{t("presetsLabel")}</span>
          {PRESETS.map((p) => (
            <button key={p.key} type="button" className="irev-preset-btn" onClick={() => setCfg(p.cfg)}>
              {t(`preset_${p.key}`)}
            </button>
          ))}
        </div>
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">●</span>
          {t("runsLocally")}
        </p>
        <p className="cipherstr-scope">{t("scopeNote")}</p>
      </div>

      <div className="tmsh-results irev-results">
        <section className="persist-section">
          <h3 className="persist-heading">{t("diagramHeading")}</h3>
          <div className="irev-legend">
            <span className="irev-legend-item"><span className="irev-swatch" style={{ background: SIDE_COLOR.client }} />{t("sideClient")}</span>
            <span className="irev-legend-item"><span className="irev-swatch" style={{ background: SIDE_COLOR.server }} />{t("sideServer")}</span>
            <span className="irev-legend-item"><span className="irev-swatch" style={{ background: SIDE_COLOR.global }} />{t("sideGlobal")}</span>
          </div>
          <svg className="irev-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t("diagramHeading")}>
            {events.length > 1 && (
              <line x1={spineX} y1={cyOf(0)} x2={spineX} y2={cyOf(events.length - 1)} stroke="var(--border-strong)" strokeWidth="2" />
            )}
            {events.map((e, i) => {
              const cy = cyOf(i);
              const color = SIDE_COLOR[e.side];
              return (
                <g key={e.name}>
                  <text x={spineX - 18} y={cy + 4} textAnchor="end" className="irev-svg-num">{i + 1}</text>
                  <line x1={spineX + 7} y1={cy} x2={spineX + 26} y2={cy} stroke="var(--border-strong)" strokeWidth="2" />
                  <circle cx={spineX} cy={cy} r="7" fill={color} stroke="var(--canvas-primary)" strokeWidth="2" />
                  <rect x={spineX + 26} y={cy - 19} width={width - spineX - 36} height="38" rx="6" fill="var(--surface-base)" stroke="var(--border-subtle)" />
                  <rect x={spineX + 26} y={cy - 19} width="3" height="38" fill={color} />
                  <text x={spineX + 40} y={cy - 3} className="irev-svg-name">{e.name}</text>
                  <text x={spineX + 40} y={cy + 12} className="irev-svg-meta">{e.phase} · {sideLabel(e.side)}</text>
                </g>
              );
            })}
          </svg>
        </section>

        <section className="persist-section">
          <h3 className="persist-heading">{t("listHeading")}</h3>
          <ol className="irev-list">
            {events.map((e) => (
              <li key={e.name} className="irev-item">
                <div className="irev-item-head">
                  <code className="irev-item-name mono">{e.name}</code>
                  <span className="irev-item-side" style={{ color: SIDE_COLOR[e.side] }}>{sideLabel(e.side)}</span>
                </div>
                <p className="irev-item-fires">{e.fires}</p>
              </li>
            ))}
          </ol>
        </section>

        {result.conditional.length > 0 && (
          <section className="persist-section">
            <h3 className="persist-heading">{t("conditionalHeading")}</h3>
            <p className="irev-cond-note">{t("conditionalNote")}</p>
            <ul className="irev-cond-list">
              {result.conditional.map((e) => (
                <li key={e.name} className="irev-cond-item">
                  <code className="irev-cond-name mono">{e.name}</code>
                  <span className="irev-cond-near">↪ {e.near}</span>
                  <p className="irev-cond-fires">{e.fires}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.notes.length > 0 && (
          <ul className="irev-notes">
            {result.notes.map((n, i) => (
              <li key={i} className={`irev-note irev-note-${n.level}`}>{n.text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
