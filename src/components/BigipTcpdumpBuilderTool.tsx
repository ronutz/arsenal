// ============================================================================
// src/components/BigipTcpdumpBuilderTool.tsx
// ----------------------------------------------------------------------------
// BIG-IP TCPDUMP BUILDER (UI) — assemble a BIG-IP-correct `tcpdump` command from
// structured choices, with live output and operational advisories.
//
// Unlike the decode tools (which take one pasted string), this is a *builder*:
// the whole UI is a form over a single TcpdumpOptions object. Every control
// edits one field; the command is recomputed synchronously on each change by the
// pure engine (src/lib/tools/bigip-tcpdump-builder). The engine FORMATS a string
// and runs nothing — there is no capture, no egress, nothing leaves the browser.
//
// The advisories come back from the engine as STABLE CODES (e.g. "unfiltered-
// all-tmm"); we localise each one here via tools.bigip-tcpdump-builder.warnings.
// ============================================================================

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildCommand,
  DEFAULT_OPTIONS,
  type TcpdumpOptions,
  type TmmDetail,
  type NameResolution,
  type Snaplen,
  type Verbosity,
} from "@/lib/tools/bigip-tcpdump-builder";

// ---------------------------------------------------------------------------
// A small segmented-button control. Defined outside the component so it does not
// re-create on every render; all of its text arrives already translated.
// ---------------------------------------------------------------------------
function Seg<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="tcpdump-field">
      <span className="cidr-label">{label}</span>
      <div className="seg tcpdump-seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`seg-btn${value === o.value ? " seg-btn--active" : ""}`}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="tcpdump-hint">{hint}</p>}
    </div>
  );
}

// A labelled checkbox row.
function Check({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="tcpdump-field">
      <label className="tcpdump-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {hint && <p className="tcpdump-hint tcpdump-hint--check">{hint}</p>}
    </div>
  );
}

export default function BigipTcpdumpBuilderTool() {
  const t = useTranslations("tools.bigip-tcpdump-builder");

  // The whole form is one options object, seeded from the engine's canonical
  // default (a sensible, filtered, written-to-file capture).
  const [opts, setOpts] = useState<TcpdumpOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);

  // Update exactly one field and reset the "copied" flash so it never lies.
  function set<K extends keyof TcpdumpOptions>(key: K, value: TcpdumpOptions[K]) {
    setOpts((o) => ({ ...o, [key]: value }));
    setCopied(false);
  }

  // Recompute the command + advisories on every change. The engine is pure and
  // synchronous, so this is cheap and deterministic.
  const result = useMemo(() => buildCommand(opts), [opts]);

  async function onCopy() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(result.command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore, the command is visible to select manually */
    }
  }

  // Parse a number input, mapping blank/invalid to undefined.
  function toNum(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : undefined;
  }

  return (
    <div className="cidr-tool jwt-tool tcpdump-tool">
      {/* ---- Interface & flow ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupInterface")}</legend>

        <div className="tcpdump-field">
          <label className="cidr-label" htmlFor="tcp-iface">
            {t("ifaceLabel")}
          </label>
          <input
            id="tcp-iface"
            className="cidr-input mono"
            type="text"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            value={opts.iface}
            placeholder={t("ifacePlaceholder")}
            onChange={(e) => set("iface", e.target.value)}
          />
          <p className="tcpdump-hint">{t("ifaceHint")}</p>
        </div>

        <Seg<TmmDetail>
          label={t("detailLabel")}
          hint={t("detailHint")}
          value={opts.detail}
          onChange={(v) => set("detail", v)}
          options={[
            { value: "", label: t("detailNone") },
            { value: "n", label: t("detailLow") },
            { value: "nn", label: t("detailMed") },
            { value: "nnn", label: t("detailHigh") },
          ]}
        />

        <Check
          label={t("bothSidesLabel")}
          hint={t("bothSidesHint")}
          checked={opts.bothSides}
          onChange={(v) => set("bothSides", v)}
        />
      </fieldset>

      {/* ---- Name resolution ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupResolution")}</legend>
        <Seg<NameResolution>
          label={t("nameResLabel")}
          hint={t("nameResHint")}
          value={opts.nameResolution}
          onChange={(v) => set("nameResolution", v)}
          options={[
            { value: "default", label: t("nameResDefault") },
            { value: "no-dns", label: t("nameResNoDns") },
            { value: "no-dns-port", label: t("nameResNoDnsPort") },
          ]}
        />
      </fieldset>

      {/* ---- Snap length & limits ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupCapture")}</legend>
        <Seg<Snaplen>
          label={t("snaplenLabel")}
          value={opts.snaplen}
          onChange={(v) => set("snaplen", v)}
          options={[
            { value: "default", label: t("snaplenDefault") },
            { value: "full", label: t("snaplenFull") },
            { value: "custom", label: t("snaplenCustom") },
          ]}
        />

        {opts.snaplen === "custom" && (
          <div className="tcpdump-field">
            <label className="cidr-label" htmlFor="tcp-snap">
              {t("snaplenValueLabel")}
            </label>
            <input
              id="tcp-snap"
              className="cidr-input mono tcpdump-num"
              type="number"
              min={0}
              value={opts.snaplenValue ?? ""}
              placeholder={t("snaplenValuePlaceholder")}
              onChange={(e) => set("snaplenValue", toNum(e.target.value))}
            />
          </div>
        )}

        <div className="tcpdump-field">
          <label className="cidr-label" htmlFor="tcp-count">
            {t("countLabel")}
          </label>
          <input
            id="tcp-count"
            className="cidr-input mono tcpdump-num"
            type="number"
            min={1}
            value={opts.count ?? ""}
            placeholder={t("countPlaceholder")}
            onChange={(e) => set("count", toNum(e.target.value))}
          />
          <p className="tcpdump-hint">{t("countHint")}</p>
        </div>
      </fieldset>

      {/* ---- Output format ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupFormat")}</legend>
        <Seg<Verbosity>
          label={t("verbosityLabel")}
          value={opts.verbosity}
          onChange={(v) => set("verbosity", v)}
          options={[
            { value: "", label: t("verbNone") },
            { value: "v", label: t("verbV") },
            { value: "vv", label: t("verbVv") },
            { value: "vvv", label: t("verbVvv") },
          ]}
        />
        <Check
          label={t("etherLabel")}
          checked={opts.etherHeader}
          onChange={(v) => set("etherHeader", v)}
        />
        <Check
          label={t("hexLabel")}
          checked={opts.hexAscii}
          onChange={(v) => set("hexAscii", v)}
        />
      </fieldset>

      {/* ---- Write to file ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupFile")}</legend>
        <Check
          label={t("writeFileLabel")}
          checked={opts.writeFile}
          onChange={(v) => set("writeFile", v)}
        />
        {opts.writeFile && (
          <div className="tcpdump-field">
            <label className="cidr-label" htmlFor="tcp-file">
              {t("fileNameLabel")}
            </label>
            <input
              id="tcp-file"
              className="cidr-input mono"
              type="text"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              value={opts.fileName}
              placeholder={t("fileNamePlaceholder")}
              onChange={(e) => set("fileName", e.target.value)}
            />
            <p className="tcpdump-hint">{t("fileNameHint")}</p>
          </div>
        )}
      </fieldset>

      {/* ---- Filter ---- */}
      <fieldset className="tcpdump-group">
        <legend className="tcpdump-legend">{t("groupFilter")}</legend>
        <div className="tcpdump-field">
          <label className="cidr-label" htmlFor="tcp-filter">
            {t("filterLabel")}
          </label>
          <input
            id="tcp-filter"
            className="cidr-input mono"
            type="text"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            value={opts.filter}
            placeholder={t("filterPlaceholder")}
            onChange={(e) => set("filter", e.target.value)}
          />
          <p className="tcpdump-hint">{t("filterHint")}</p>
        </div>
      </fieldset>

      {/* ---- Privacy reassurance ---- */}
      <p className="cidr-privacy">
        <span className="cidr-lock" aria-hidden="true">
          {"\u25CF"}
        </span>
        {t("runsLocally")}
      </p>

      {/* ---- Generated command ---- */}
      <div className="jwt-results">
        <section className="jwt-panel">
          <div className="b64-output-head">
            <h4 className="jwt-panel-title">{t("commandHeading")}</h4>
            <button type="button" className="b64-copy" onClick={onCopy}>
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <pre className="jwt-json tcpdump-command">{result.command}</pre>
        </section>

        {/* ---- Advisories (codes -> localised text). Not errors. ---- */}
        {result.warnings.length > 0 && (
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("warningsHeading")}</h4>
            <ul className="tcpdump-warnings">
              {result.warnings.map((code) => (
                <li key={code} className="tcpdump-warning">
                  <span className="tcpdump-warning-mark" aria-hidden="true">
                    {"\u26A0"}
                  </span>
                  <span>{t(`warnings.${code}`)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
