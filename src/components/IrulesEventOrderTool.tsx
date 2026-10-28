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
//
// Share results (2026-10-27): first in the reading, a button builds a link that
// carries the five switches (src/lib/tools/f5-irules-event-order/share.ts);
// an arriving link sets them, as clicking them would, and leaves the address.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  planEventOrder,
  type VirtualConfig,
  type EventSide,
} from "@/lib/tools/f5-irules-event-order";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { IRULES_EVENT_ORDER_SHARE } from "@/lib/tools/f5-irules-event-order/share"; // this tool's share spec: the five switches

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
  const t = useTranslations("tools.f5-irules-event-order");
  const [cfg, setCfg] = useState<VirtualConfig>({
    fastL4: false,
    clientSsl: true,
    http: true,
    serverSsl: true,
    pool: true,
  });

  const result = useMemo(() => planEventOrder(cfg), [cfg]);

  // An arriving share link (2026-10-27): its switches replace the stack, as clicking them would.
  useShareArrival(IRULES_EVENT_ORDER_SHARE, (c) => setCfg(c)); // the link's stack
  // What Share results may carry: the five switches (there is always a plan, so always a link).
  const share = useMemo(() => IRULES_EVENT_ORDER_SHARE.encode(cfg), [cfg]); // memoised on the switches

  const toggle = (field: keyof VirtualConfig) =>
    setCfg((c) => ({ ...c, [field]: !c[field] }));

  const sideLabel = (s: EventSide) =>
    s === "client" ? t("sideClient") : s === "server" ? t("sideServer") : t("sideGlobal");

  // The engine writes its explanations in English (the API returns them as they are). A page whose pack carries a
  // translation shows that instead, keyed by the event's name, the phase's slug or the note's id; any key a pack lacks
  // falls back to the engine's English (27/10/2026: the pt-BR page showed every event in English).
  const evFires = (name: string, english: string) => (t.has(`ev.${name}`) ? t(`ev.${name}`) : english); // what the event means
  const phaseLabel = (english: string) => { const k = `phase.${english.toLowerCase().replace(/[^a-z]+/g, "-")}`; return t.has(k) ? t(k) : english; }; // its phase
  const noteText = (id: string, english: string) => (t.has(`note.${id}`) ? t(`note.${id}`) : english); // a note

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
        <div className="dig-input-head">
          <p className="cidr-label">{t("stackLabel")}</p>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setCfg((PRESETS.find((p) => p.key === "https") ?? PRESETS[0]).cfg)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setCfg({ fastL4: false, clientSsl: false, http: false, serverSsl: false, pool: false })}>{t("clear")}</button>
          </div>
        </div>
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
        {/* Share results (2026-10-27): first in the reading, at the start of its own row. Under the timeline it sat a
            screen or more below the switches at 1280 px (the drawing scales with the width), so it moved up after looking. */}
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
        </div>
        {/* irev-diagram: on a phone the drawing (680 units wide) shrank its event names to about 6 px; the list
            below carries the same order, sides and colours readably, so the drawing steps aside there (27/10/2026). */}
        <section className="persist-section irev-diagram">
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
                  <text x={spineX + 40} y={cy + 12} className="irev-svg-meta">{phaseLabel(e.phase)} · {sideLabel(e.side)}</text>
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
                <p className="irev-item-fires">{evFires(e.name, e.fires)}</p>
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
                  <p className="irev-cond-fires">{evFires(e.name, e.fires)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {result.notes.length > 0 && (
          <ul className="irev-notes">
            {result.notes.map((n, i) => (
              <li key={i} className={`irev-note irev-note-${n.level}`}>{noteText(n.id, n.text)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
