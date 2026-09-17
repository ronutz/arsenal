"use client";

// ============================================================================
// src/components/DhcpOption43Tool.tsx
// ----------------------------------------------------------------------------
// UI for the DHCP option 43 encoder.
//
// The design decision that matters: THE VENDOR PICKER COMES FIRST, above the
// address field. Option 43's whole difficulty is that the same input produces
// four different answers depending on who made the access point, so asking
// "whose AP is it" before "what is the address" matches the order the reader
// has to think in - and makes it impossible to read a hex string without
// having seen which vendor it belongs to.
//
// The tool also answers with a NON-ANSWER where that is correct: for Aruba it
// says a string rather than hex, and for FortiAP it says option 138. A
// generator that always returns a hex value is wrong for a third of the
// vendors here, and confidently so.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  Option43Error,
  VENDOR_PROFILES,
  type Option43Report,
} from "@/lib/tools/dhcp-option-43";
import { usePrefill } from "@/lib/use-prefill";

const EXAMPLE = "192.168.10.5";

export default function DhcpOption43Tool() {
  const t = useTranslations("tools.dhcp-option-43");
  const [vendorId, setVendorId] = useState<string>(VENDOR_PROFILES[0].id);
  const [value, setValue] = useState("");
  const [report, setReport] = useState<Option43Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback((vendor: string, input: string) => {
    if (!input.trim()) {
      setReport(null);
      setError(null);
      return;
    }
    try {
      setReport(run(vendor, input));
      setError(null);
    } catch (e) {
      setReport(null);
      setError(
        e instanceof Option43Error ? t(`errors.${e.code}`) : String((e as Error).message)
      );
    }
  }, [t]);

  usePrefill((v: string) => {
    setValue(v);
    compute(vendorId, v);
  });

  const onVendor = (id: string) => {
    setVendorId(id);
    compute(id, value);
  };
  const onValue = (v: string) => {
    setValue(v);
    compute(vendorId, v);
  };

  const profile = VENDOR_PROFILES.find((v) => v.id === vendorId)!;

  return (
    <div className="jwt-tool">
      {/* Vendor first: the same address means four different things. */}
      <div className="jwt-field">
        <label className="jwt-label" htmlFor="opt43-vendor">
          {t("vendorLabel")}
        </label>
        <select
          id="opt43-vendor"
          className="opt43-select"
          value={vendorId}
          onChange={(e) => onVendor(e.target.value)}
        >
          {VENDOR_PROFILES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        <p className="opt43-vendor-source">
          {t("sourceLabel")}:{" "}
          <a href={profile.source.url} target="_blank" rel="noopener noreferrer">
            {profile.source.label}
          </a>
        </p>
      </div>

      <div className="jwt-field">
        <div className="jwt-label-row">
          <label className="jwt-label" htmlFor="opt43-input">
            {profile.multiple ? t("inputLabelMulti") : t("inputLabel")}
          </label>
          <div className="jwt-label-actions">
            <button type="button" className="b64-copy" onClick={() => onValue(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onValue("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="opt43-input"
          className="jwt-input"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={profile.multiple ? t("placeholderMulti") : t("placeholder")}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="jwt-hint">{t("runsLocally")}</p>
      </div>

      {error && <p className="jwt-error">{error}</p>}

      {report && (
        <div className="jwt-results">
          {/* The answer, in whatever shape is correct for this vendor. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.value")}</h4>

            {report.encoding === "hex" && (
              <>
                <p className="opt43-value mono">{report.hex}</p>
                <ul className="opt43-breakdown">
                  {report.breakdown?.map((b, i) => (
                    <li key={i}>
                      <code className="opt43-bytes">{b.bytes}</code>
                      <span className="opt43-meaning">{b.meaning}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {report.encoding === "string" && (
              <>
                <p className="opt43-value mono">{report.text}</p>
                <p className="opt43-warn">{t("notes.string-not-hex")}</p>
              </>
            )}

            {report.encoding === "other-option" && (
              <p className="opt43-warn">
                {t("notes.not-option-43", { option: report.option })}
              </p>
            )}
          </section>

          {report.notes.includes("vendor-class-required") && profile.vendorClass && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.vendorClass")}</h4>
              <p>{t("notes.vendor-class-required", { vci: profile.vendorClass })}</p>
            </section>
          )}

          {report.notes.includes("ascii-not-binary") && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("panels.watchOut")}</h4>
              <p>{t("notes.ascii-not-binary")}</p>
            </section>
          )}

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("panels.servers")}</h4>
            <dl className="opt43-servers">
              {report.serverSnippets.map((s) => (
                <div key={s.server}>
                  <dt>{t(`servers.${s.server}`)}</dt>
                  <dd>
                    <code className="mono">{s.lines.join("\n")}</code>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
