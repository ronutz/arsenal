"use client";

// ============================================================================
// src/components/CvssVectorDecoderTool.tsx
// ----------------------------------------------------------------------------
// Paste a CVSS v3.0/v3.1 vector, get the score computed and every metric spelled
// out. All scoring is pure and local (compute.ts); this only renders it. Metric
// names are rendered through translation keys (not the engine's English), so the
// decode is fully localized.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { parseCvssVector, type MetricView } from "@/lib/tools/cvss-vector-decoder";

const EXAMPLE = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H";

function sevClass(sev: string | null): string {
  return "cvss-sev-" + (sev ?? "none").toLowerCase();
}

function ScoreCard({
  label,
  score,
  severity,
  t,
}: {
  label: string;
  score: number;
  severity: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className={"cvss-score-card " + sevClass(severity)}>
      <div className="cvss-score-label">{label}</div>
      <div className="cvss-score-value dig-mono">{score.toFixed(1)}</div>
      <div className="cvss-score-sev">{t("severity." + severity.toLowerCase())}</div>
    </div>
  );
}

function MetricRow({ m, t }: { m: MetricView; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="cvss-metric">
      <span className="cvss-metric-code dig-mono">{m.code}</span>
      <span className="cvss-metric-label">{t("metrics." + m.code + ".label")}</span>
      <span className="cvss-metric-value dig-mono">{m.value}</span>
      <span className="cvss-metric-vlabel">{t("metrics." + m.code + ".v." + m.value)}</span>
    </div>
  );
}

function Group({
  title,
  metrics,
  t,
}: {
  title: string;
  metrics: MetricView[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="jwt-panel cvss-group">
      <div className="jwt-panel-title">{title}</div>
      <div className="cvss-metric-list">
        {metrics.map((m) => (
          <MetricRow key={m.code} m={m} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function CvssVectorDecoderTool() {
  const t = useTranslations("tools.cvss-vector-decoder");
  const [input, setInput] = useState("");
  const parsed = useMemo(() => parseCvssVector(input), [input]);
  const typed = input.trim().length > 0;
  const show = typed && parsed.recognized;
  const showNot = typed && !parsed.recognized;

  const base = parsed.metrics.filter((m) => m.group === "base");
  const temporal = parsed.metrics.filter((m) => m.group === "temporal");
  const environmental = parsed.metrics.filter((m) => m.group === "environmental");

  return (
    <div className="cidr-tool jwt-tool dig-tool cvss-tool">
      <div className="b64-head">
        <label className="b64-label">{t("input.label")}</label>
        <div className="b64-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>
            {t("input.example")}
          </button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>
            {t("input.clear")}
          </button>
        </div>
      </div>

      <textarea
        className="b64-input dig-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("input.placeholder")}
        rows={2}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <p className="dig-privacy">{t("privacy")}</p>

      {showNot && (
        <div className="dig-notdig">
          {parsed.unsupportedVersion
            ? t("unsupportedVersion", { version: parsed.unsupportedVersion })
            : parsed.parseError
              ? t("parseError", { detail: parsed.parseError })
              : t("notCvss")}
        </div>
      )}

      {show && (
        <div className="dig-output">
          {parsed.warnings.length > 0 && (
            <div className="jwt-panel cvss-warn-panel">
              <div className="jwt-panel-title">{t("warnings.title")}</div>
              <ul className="cvss-warn-list">
                {parsed.warnings.map((w) => (
                  <li key={w}>{t("warnings." + w)}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Score headline: base always; temporal / environmental when present. */}
          {parsed.baseScore !== null && parsed.baseSeverity && (
            <div className="cvss-scores">
              <ScoreCard label={t("scores.base")} score={parsed.baseScore} severity={parsed.baseSeverity} t={t} />
              {parsed.temporalScore !== null && parsed.temporalSeverity && (
                <ScoreCard label={t("scores.temporal")} score={parsed.temporalScore} severity={parsed.temporalSeverity} t={t} />
              )}
              {parsed.environmentalScore !== null && parsed.environmentalSeverity && (
                <ScoreCard label={t("scores.environmental")} score={parsed.environmentalScore} severity={parsed.environmentalSeverity} t={t} />
              )}
            </div>
          )}

          {/* Version + scope + sub-scores. */}
          <div className="jwt-panel cvss-sub-panel">
            <div className="cvss-sub-grid">
              <div className="cvss-sub">
                <span className="cvss-sub-label">{t("meta.version")}</span>
                <span className="cvss-sub-value dig-mono">{parsed.version}</span>
              </div>
              {parsed.scopeChanged !== null && (
                <div className="cvss-sub">
                  <span className="cvss-sub-label">{t("meta.scope")}</span>
                  <span className="cvss-sub-value">{t(parsed.scopeChanged ? "meta.scopeChanged" : "meta.scopeUnchanged")}</span>
                </div>
              )}
              {parsed.impactSubScore !== null && (
                <div className="cvss-sub">
                  <span className="cvss-sub-label">{t("subScores.impact")}</span>
                  <span className="cvss-sub-value dig-mono">{parsed.impactSubScore.toFixed(1)}</span>
                </div>
              )}
              {parsed.exploitabilitySubScore !== null && (
                <div className="cvss-sub">
                  <span className="cvss-sub-label">{t("subScores.exploitability")}</span>
                  <span className="cvss-sub-value dig-mono">{parsed.exploitabilitySubScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Decoded metrics, grouped. */}
          <Group title={t("groups.base")} metrics={base} t={t} />
          <Group title={t("groups.temporal")} metrics={temporal} t={t} />
          <Group title={t("groups.environmental")} metrics={environmental} t={t} />
        </div>
      )}
    </div>
  );
}
