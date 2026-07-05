"use client";

// ============================================================================
// src/components/TelemetryStreamingExplainerTool.tsx
// ----------------------------------------------------------------------------
// Client UI for the F5 BIG-IP TS (Telemetry Streaming) declaration explainer.
// Paste the JSON you POST to /mgmt/shared/telemetry/declare and it reads back
// the top-level Telemetry class, the optional Controls, and every named
// class-object grouped by its role in the telemetry pipeline: data sources
// (Telemetry_System pollers, Telemetry_System_Poller, Telemetry_Listener),
// consumers (Telemetry_Consumer push, Telemetry_Pull_Consumer pull), and the
// grouping/endpoint classes, each explained, with the documented structural
// findings and the pipeline gaps that make a declaration succeed but do
// nothing. Pure, decode-only engine; nothing is fetched and nothing leaves the
// browser (D-49). Class names, structural rules, and the consumer catalogue
// come from F5's TS docs (clouddocs, TS 1.41.0 / 1.42.0).
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { explainTs, type Finding, type Role } from "@/lib/tools/telemetry-streaming-explainer";

// F5's Quick Start example (quick-start.html), the D-83 Example: a System with
// a poller, an event Listener, and a Splunk push Consumer — a complete pipeline
// exercising a source and a consumer.
const EXAMPLE = JSON.stringify(
  {
    class: "Telemetry",
    controls: { class: "Controls", logLevel: "info" },
    My_System: { class: "Telemetry_System", systemPoller: { interval: 60 } },
    My_Listener: { class: "Telemetry_Listener", port: 6514 },
    My_Consumer: {
      class: "Telemetry_Consumer",
      type: "Splunk",
      host: "192.168.2.1",
      protocol: "https",
      port: 8088,
      passphrase: { cipherText: "apikey" },
    },
  },
  null,
  2,
);

// Role → color class for the group heading + object chip. Reuses the DO phase
// palette classes so the visual system is shared.
const ROLE_CLASS: Record<Role, string> = {
  source: "do-phase-network",
  consumer: "do-phase-license",
  support: "do-phase-cluster",
  control: "do-phase-system",
  other: "do-phase-other",
};

export default function TelemetryStreamingExplainerTool() {
  const t = useTranslations("tools.telemetry-streaming-explainer");
  const [input, setInput] = useState("");
  const inputPlaceholder = t.raw("inputPlaceholder");
  const r = useMemo(() => explainTs(input), [input]);
  const has = input.trim().length > 0;

  const findingText = (f: Finding): { sev: "warn" | "info"; text: string } => {
    switch (f.kind) {
      case "parse-error": return { sev: "warn", text: `${t("finding.parseError")}: ${f.detail}` };
      case "not-telemetry": return { sev: "warn", text: t("finding.notTelemetry") };
      case "no-source": return { sev: "warn", text: t("finding.noSource") };
      case "no-consumer": return { sev: "warn", text: t("finding.noConsumer") };
      case "system-without-poller": return { sev: "warn", text: t("finding.systemWithoutPoller", { name: f.name }) };
      case "consumer-missing-type": return { sev: "warn", text: t("finding.consumerMissingType", { name: f.name }) };
      case "consumer-unknown-type": return { sev: "info", text: t("finding.consumerUnknownType", { name: f.name, type: f.type }) };
      case "namespaces-present": return { sev: "info", text: t("finding.namespacesPresent") };
      case "controls-note": return { sev: "info", text: t("finding.controlsNote", { logLevel: f.logLevel }) };
      default: return { sev: "info", text: "" };
    }
  };

  const kindLabel = r ? (r.kind === "telemetry" ? t("kind.telemetry") : t("kind.notTelemetry")) : "";
  const kindSev = r?.kind === "not-telemetry" ? "warn" : "ok";
  const showWalk = r && r.kind === "telemetry" && r.groups.length > 0;

  return (
    <div className="cidr-tool jwt-tool dig-tool json-tool tmsh-tool as3-tool do-tool ts-tool">
      <div className="dig-input-head">
        <label htmlFor="ts-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="ts-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={inputPlaceholder}
        spellCheck={false}
        rows={12}
      />
      <p className="cidr-privacy"><span className="cidr-lock">&#128274;</span> {t("runsLocally")}</p>

      {!has && <div className="awaf-empty">{t("empty")}</div>}

      {r && has && (
        <div className="tmsh-results as3-results do-results ts-results">
          {/* Verdict + controls summary */}
          <section className={`as3-verdict as3-verdict-${kindSev}`}>
            <h3 className="as3-verdict-head">{kindLabel}</h3>
            {r.controls && (
              <div className="as3-meta-row">
                <span className="as3-chip">{t("controls.logLevel")}: <b>{r.controls.logLevel ?? "info"}</b></span>
                {r.controls.debug !== null && <span className="as3-chip">{t("controls.debug")}: <b>{r.controls.debug ? t("controls.on") : t("controls.off")}</b></span>}
                {r.controls.memoryMonitor && <span className="as3-chip">{t("controls.memoryMonitor")}</span>}
              </div>
            )}
          </section>

          {/* Stats */}
          {showWalk && (
            <div className="as3-stats">
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.totalObjects}</span><span className="poison-stat-lbl">{t("stats.objects")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.sources}</span><span className="poison-stat-lbl">{t("stats.sources")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.consumers}</span><span className="poison-stat-lbl">{t("stats.consumers")}</span></div>
              <div className="poison-stat"><span className="poison-stat-num">{r.stats.namespaces}</span><span className="poison-stat-lbl">{t("stats.namespaces")}</span></div>
            </div>
          )}

          {/* Findings */}
          {r.findings.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("findingsHeading")}</h3>
              <ul className="awaf-flag-list">
                {r.findings.map((f, i) => {
                  const v = findingText(f);
                  if (!v.text) return null;
                  return (
                    <li key={i} className={`awaf-flag awaf-flag-${v.sev}`}>
                      <span className="awaf-flag-mark">{v.sev === "warn" ? "\u25B2" : "\u2022"}</span> {v.text}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* The pipeline walk, grouped by role */}
          {showWalk && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("walkHeading")}</h3>
              <p className="as3-node-note do-walk-note">{t("walkOrderNote")}</p>
              <div className="as3-tree do-walk ts-walk">
                {r.groups.map((g) => (
                  <div className={`do-group ${ROLE_CLASS[g.role]}`} key={g.role}>
                    <div className="do-group-head">{g.label}</div>
                    <ul className="as3-objects">
                      {g.objects.map((o) => (
                        <li className="as3-object" key={o.name}>
                          <span className={`as3-obj-chip ${ROLE_CLASS[o.role]}`}>{o.className}</span>
                          <b className="as3-obj-name">{o.name}</b>
                          {o.notes.map((n, k) => (
                            <span className="as3-badge" key={k}>{n}</span>
                          ))}
                          <span className="as3-obj-explain">— {o.explain}{o.unknown ? ` ${t("unknownClass")}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="cipherstr-scope as3-foot">{t("scopeNote")}</p>
        </div>
      )}
    </div>
  );
}
