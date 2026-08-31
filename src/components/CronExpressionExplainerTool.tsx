// ============================================================================
// src/components/CronExpressionExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the cron expression explainer (standing tools queue, rank 1). One
// input: a five-field crontab schedule or an @macro. The engine in
// src/lib/tools/cron-expression-explainer parses, warns, and projects; this
// component only renders it.
//
// Layout: one panel per time field (the raw token, the resolved matching
// values, and a localized reading of each part), a warnings panel for the
// dialect's footguns (the DOM/DOW OR rule above all), and the next
// occurrences computed live from the visitor's own "now" - the vectors pin
// the same math against a frozen instant, so the clock here cannot drift the
// truth. Styling reuses the established tool vocabulary (cidr-* input stack,
// jwt-results panels, cipher-note) - no new CSS classes.
// ============================================================================
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  CronError,
  type CronResult,
  type CronField,
  type CronPart,
} from "@/lib/tools/cron-expression-explainer";

// D-83 Example sample - verbatim from this tool's golden vectors
// (weekday-night): the classic "02:00 on weekdays" backup line.
const EXAMPLE = "0 2 * * 1-5";

const FIELD_ORDER = ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const;

export default function CronExpressionExplainerTool() {
  const t = useTranslations("tools.cron-expression-explainer");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<CronResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        setResult(null);
        setError(null);
        return;
      }
      try {
        // The component projects from the visitor's real "now"; the golden
        // vectors exercise the identical engine from a frozen instant.
        setResult(run(trimmed, { count: 5 }));
        setError(null);
      } catch (e) {
        if (e instanceof CronError) {
          setError(t(`errors.${e.code}`, { token: e.token ?? "" }));
        } else {
          setError(t("errors.badToken", { token: "" }));
        }
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (raw: string) => {
      setValue(raw);
      compute(raw);
    },
    [compute],
  );

  /** One parsed part, read out in the visitor's language. */
  const partLine = (p: CronPart, field: string) => {
    if (p.kind === "every") return t("parts.every", { field: t(`fields.${field}`) });
    if (p.kind === "value") return t("parts.value", { value: p.value ?? 0 });
    if (p.kind === "range") return t("parts.range", { from: p.from ?? 0, to: p.to ?? 0 });
    return t("parts.step", { from: p.from ?? 0, to: p.to ?? 0, by: p.by ?? 1 });
  };

  /** One field panel: raw token, its reading, and the resolved value set. */
  const fieldPanel = (name: (typeof FIELD_ORDER)[number], f: CronField) => (
    <section className="jwt-panel" key={name}>
      <h4 className="jwt-panel-title">
        {t(`fields.${name}`)} · <span className="mono">{f.raw}</span>
      </h4>
      <ul>
        {f.parts.map((p, i) => (
          <li key={i}>
            <span className="mono">{p.raw}</span> — {partLine(p, name)}
          </li>
        ))}
      </ul>
      <p className="cipher-note">
        {f.unrestricted
          ? t("valuesEvery")
          : t("valuesLine", { count: f.values.length, list: f.values.join(", ") })}
      </p>
    </section>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="cronx-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="cronx-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-describedby="cronx-privacy"
          autoComplete="off"
          spellCheck={false}
        />
        <p id="cronx-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="jwt-results">
          {result.macro && (
            <p className="cipher-note">
              {result.macro === "@reboot"
                ? t("macroReboot")
                : t("macroLine", { macro: result.macro, expansion: result.expression && result.fields ? `${result.fields.minute.raw} ${result.fields.hour.raw} ${result.fields.dayOfMonth.raw} ${result.fields.month.raw} ${result.fields.dayOfWeek.raw}` : "" })}
            </p>
          )}

          {result.fields && FIELD_ORDER.map((n) => fieldPanel(n, result.fields![n]))}

          {/* The footgun panel: every non-trivial warning, spelled out. */}
          {result.warnings.filter((w) => w !== "localTime").length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("warningsTitle")}</h4>
              <ul>
                {result.warnings
                  .filter((w) => w !== "localTime")
                  .map((w) => (
                    <li key={w}>{t(`warnings.${w}`)}</li>
                  ))}
              </ul>
            </section>
          )}

          {result.nextRuns.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("nextTitle")}</h4>
              <ul>
                {result.nextRuns.map((n) => (
                  <li key={n}>
                    <span className="mono">{n}</span>
                  </li>
                ))}
              </ul>
              {/* Cron evaluates in the daemon's LOCAL time; this projection is
                  on the wall-clock of your browser's instant, no TZ database. */}
              <p className="cipher-note">{t("warnings.localTime")}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
