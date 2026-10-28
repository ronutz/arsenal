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

import { useCallback, useMemo, useState } from "react"; // useMemo holds the Share results encoding (2026-10-27)
import { useTranslations } from "next-intl";
import {
  run,
  Option43Error,
  VENDOR_PROFILES,
  type Option43Report,
} from "@/lib/tools/dhcp-option-43";
import { usePrefill } from "@/lib/use-prefill";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { DHCP_OPTION_43_SHARE } from "@/lib/tools/dhcp-option-43/share"; // this tool's share spec: the addresses as #input=

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83: verbatim from a golden vector. Since 2026-10-19 it is Cisco 97066's own single-controller example
// (192.168.1.10 -> f104c0a8010a), for the profile the picker opens on (cisco-wlc, the first profile).
const EXAMPLE = "192.168.1.10";

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

  // The field's value goes to usePrefill too, so a Clear, an Example or an edit drops the handed-over value from the
  // address (#input=), and a share or reload no longer carries it (RT01, 2026-10-20).
  usePrefill((v: string) => {
    setValue(v);
    compute(vendorId, v);
  }, value);

  const onVendor = (id: string) => {
    setVendorId(id);
    compute(id, value);
  };
  const onValue = (v: string) => {
    setValue(v);
    compute(vendorId, v);
  };

  const profile = VENDOR_PROFILES.find((v) => v.id === vendorId)!;
  /** The label of byte group i of the breakdown, in the page's language (27/10/2026: the pt-BR page showed English). */
  const breakdownLabel = (i: number, b: { bytes: string; meaning: string }, all: readonly { bytes: string; meaning: string }[], addresses: readonly string[]): string => {
    // The engine's shape for this vendor: sub-option, length, then one group per address (binary) or one text group.
    const form = profile.addressForm;
    // The number of groups that shape has.
    const expected = form === "binary" ? 2 + addresses.length : 3;
    // Any other shape: the engine's own words.
    if (!form || all.length !== expected) return b.meaning;
    // The sub-option code.
    if (i === 0) return t("breakdown.subOption");
    // The length byte, read back from its hex.
    if (i === 1) return form === "binary" ? t("breakdown.lengthBinary") : t(form === "ascii-list" ? "breakdown.lengthList" : "breakdown.lengthText", { count: parseInt(b.bytes, 16) });
    // An address in binary needs no words.
    if (form === "binary") return b.meaning;
    // The text, one byte per character.
    return t("breakdown.textBytes", { text: form === "ascii-list" ? addresses.join(", ") : addresses[0] });
  };

  // What Share results may carry (2026-10-27): the addresses as typed, once they encode, as the same #input= the
  // handoff above reads (usePrefill is the arrival, unchanged; it carries one string, so a link opens on the first
  // vendor profile, and the popover says which vendor to pick when another one is chosen).
  const share = useMemo<ShareEncoding>(() => (report ? DHCP_OPTION_43_SHARE.encode({ input: value }) : NOTHING), [report, value]); // the encoding
  const shareDetails = [...(vendorId !== VENDOR_PROFILES[0].id ? [t("share.vendorNotCarried", { first: VENDOR_PROFILES[0].label, vendor: profile.label })] : []), t("share.caution")]; // what the popover adds

  return (
    <div className="cidr-tool jwt-tool">
      {/* Vendor first: the same address means four different things. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="opt43-vendor">
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

      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="opt43-input">
            {profile.multiple ? t("inputLabelMulti") : t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onValue(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onValue("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        {/* The site's single-line field (cidr-input), as the OUI lookup and the public suffix tool use. */}
        <input
          id="opt43-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={profile.multiple ? t("placeholderMulti") : t("placeholder")}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="cidr-privacy">{t("runsLocally")}</p>
      </div>

      {error && <p className="cidr-error">{error}</p>}

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
                      {/* What the bytes are, in the page's language. */}
                      <span className="opt43-meaning">{breakdownLabel(i, b, report.breakdown ?? [], report.addresses)}</span>
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
            {/* Share results (2026-10-27): under the value, the answer, at the start of its own row, so the popover opens
                below it. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} title={t("name")} />
            </div>
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
