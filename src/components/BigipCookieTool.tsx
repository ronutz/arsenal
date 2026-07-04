"use client";

// ============================================================================
// src/components/BigipCookieTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE F5 BIG-IP PERSISTENCE COOKIE TOOL - decode and encode.
//
// DECODE: paste a BIGipServer cookie (a bare value, a name=value pair, or a
// whole Set-Cookie line) and read out the backend pool member's IP address and
// port, with the encoding named and an internal address flagged. An AES
// encrypted cookie is recognized and explained rather than decoded.
//
// ENCODE: enter a pool member address + port (+ optional route domain) and get
// the cookie value back - the inverse operation, useful for crafting or
// verifying a persistence value during development.
//
// Everything runs IN THE BROWSER via the local module - it never contacts a
// BIG-IP and never decrypts anything. All output is escaped through React.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  encodeBigipCookie,
  BigipParseError,
  BigipEncodeError,
  type BigipReport,
  type BigipEncodeResult,
} from "@/lib/tools/f5-bigip-persistence-cookie";

type Mode = "decode" | "encode";

const FORMAT_BADGE: Record<BigipReport["format"], string> = {
  ipv4: "ipv4",
  "ipv4-routedomain": "ipv4Rd",
  ipv6: "ipv6",
  "ipv6-routedomain": "ipv6Rd",
  encrypted: "encrypted",
};

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (value === undefined || value === "") return null;
  return (
    <div className="saml-field">
      <span className="saml-field-label">{label}</span>
      <span className={`saml-field-value${mono ? " mono" : ""}`}>{value}</span>
    </div>
  );
}

// D-83 Example samples — verbatim from this tool's golden vectors.
const EXAMPLE = "1677787402.20480.0000";

export default function BigipCookieTool() {
  const t = useTranslations("tools.f5-bigip-persistence-cookie");
  const [mode, setMode] = useState<Mode>("decode");

  // -- decode state --
  const [value, setValue] = useState("");
  const [report, setReport] = useState<BigipReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -- encode state --
  const [encAddr, setEncAddr] = useState("");
  const [encPort, setEncPort] = useState("");
  const [encRd, setEncRd] = useState("");
  const [encResult, setEncResult] = useState<BigipEncodeResult | null>(null);
  const [encError, setEncError] = useState<string | null>(null);

  const decode = useCallback(
    (raw: string) => {
      if (!raw.trim()) {
        setReport(null);
        setError(null);
        return;
      }
      try {
        setReport(run(raw));
        setError(null);
      } catch (e) {
        const code = e instanceof BigipParseError ? e.code : "unrecognized";
        setError(t(`errors.${code}`));
        setReport(null);
      }
    },
    [t],
  );

  const encode = useCallback(
    (addr: string, port: string, rd: string) => {
      if (!addr.trim() || !port.trim()) {
        setEncResult(null);
        setEncError(null);
        return;
      }
      const portNum = Number(port);
      const rdNum = rd.trim() ? Number(rd) : undefined;
      if (!Number.isInteger(portNum)) {
        setEncError(t("encodeErrors.port"));
        setEncResult(null);
        return;
      }
      try {
        setEncResult(encodeBigipCookie({ address: addr.trim(), port: portNum, routeDomain: rdNum }));
        setEncError(null);
      } catch (e) {
        const code = e instanceof BigipEncodeError ? e.code : "address";
        setEncError(t(`encodeErrors.${code}`));
        setEncResult(null);
      }
    },
    [t],
  );

  function onDecodeChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    decode(e.target.value);
  }
  function onAddr(e: React.ChangeEvent<HTMLInputElement>) {
    setEncAddr(e.target.value);
    encode(e.target.value, encPort, encRd);
  }
  function onPort(e: React.ChangeEvent<HTMLInputElement>) {
    setEncPort(e.target.value);
    encode(encAddr, e.target.value, encRd);
  }
  function onRd(e: React.ChangeEvent<HTMLInputElement>) {
    setEncRd(e.target.value);
    encode(encAddr, encPort, e.target.value);
  }

  const reason = (r: { code: string; value?: string }) =>
    t(`reasons.${r.code}`, r.value !== undefined ? { value: r.value } : undefined);

  const isEncrypted = report?.format === "encrypted";

  return (
    <div className="cidr-tool jwt-tool saml-tool bigip-tool">
      <div className="bigip-mode" role="tablist" aria-label={t("mode.label")}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "decode"}
          className={`bigip-mode-btn${mode === "decode" ? " is-active" : ""}`}
          onClick={() => setMode("decode")}
        >
          {t("mode.decode")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "encode"}
          className={`bigip-mode-btn${mode === "encode" ? " is-active" : ""}`}
          onClick={() => setMode("encode")}
        >
          {t("mode.encode")}
        </button>
      </div>

      {mode === "decode" ? (
        <>
          <div className="cidr-input-row">
            <div className="dig-input-head">
              <label className="cidr-label" htmlFor="bigip-input">
                {t("inputLabel")}
              </label>
              <div className="dig-input-actions">
                <button type="button" className="b64-copy" onClick={() => setValue(EXAMPLE)}>{t("example")}</button>
                <button type="button" className="b64-copy" onClick={() => setValue("")}>{t("clear")}</button>
              </div>
            </div>
            <textarea
              id="bigip-input"
              className="cidr-input mono saml-textarea"
              rows={4}
              value={value}
              onChange={onDecodeChange}
              placeholder={t("inputPlaceholder")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-describedby="bigip-privacy"
            />
            <p id="bigip-privacy" className="cidr-privacy">
              <span className="cidr-lock" aria-hidden="true">
                ●
              </span>
              {t("runsLocally")}
            </p>
          </div>

          {error && (
            <p className="cidr-error" role="alert">
              {error}
            </p>
          )}

          {report && (
            <div className="jwt-results saml-results bigip-results">
              {report.endpoint && (
                <p className="bigip-endpoint mono" aria-label={t("fields.endpoint")}>
                  {report.endpoint}
                </p>
              )}

              <div className="jwt-badges saml-badges">
                <span className="jwt-badge saml-badge--type">{t(`badges.${FORMAT_BADGE[report.format]}`)}</span>
                {report.addressType && !isEncrypted && (
                  <span className={`jwt-badge saml-badge--${report.isInternal ? "bad" : "ok"}`}>
                    {report.isInternal ? t("badges.internal") : t("badges.public")}
                  </span>
                )}
              </div>

              {report.reasons.length > 0 && (
                <ul className="sh-overall-reasons saml-reasons">
                  {report.reasons.map((r, i) => (
                    <li key={`${r.code}-${i}`} className="sh-overall-reason">
                      {reason(r)}
                    </li>
                  ))}
                </ul>
              )}

              {!isEncrypted && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("panels.result")}</h4>
                  <Field label={t("fields.cookieName")} value={report.cookieName} mono />
                  <Field label={t("fields.address")} value={report.address} mono />
                  <Field label={t("fields.port")} value={report.port !== undefined ? String(report.port) : undefined} mono />
                  <Field
                    label={t("fields.routeDomain")}
                    value={report.routeDomain !== undefined ? String(report.routeDomain) : undefined}
                    mono
                  />
                  <Field
                    label={t("fields.addressType")}
                    value={report.addressType ? (report.addressType === "ipv4" ? "IPv4" : "IPv6") : undefined}
                    mono
                  />
                </section>
              )}

              {isEncrypted && report.cookieName && (
                <section className="jwt-panel">
                  <h4 className="jwt-panel-title">{t("panels.encrypted")}</h4>
                  <Field label={t("fields.cookieName")} value={report.cookieName} mono />
                </section>
              )}

              <p className="saml-note saml-note--verify">{isEncrypted ? t("encryptedNote") : t("disclosureNote")}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="cidr-input-row">
            <label className="cidr-label" htmlFor="bigip-enc-addr">
              {t("encode.addressLabel")}
            </label>
            <input
              id="bigip-enc-addr"
              className="cidr-input mono"
              value={encAddr}
              onChange={onAddr}
              placeholder={t("encode.addressPlaceholder")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
          <div className="bigip-enc-grid">
            <div className="cidr-input-row">
              <label className="cidr-label" htmlFor="bigip-enc-port">
                {t("encode.portLabel")}
              </label>
              <input
                id="bigip-enc-port"
                className="cidr-input mono"
                inputMode="numeric"
                value={encPort}
                onChange={onPort}
                placeholder="443"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="cidr-input-row">
              <label className="cidr-label" htmlFor="bigip-enc-rd">
                {t("encode.routeDomainLabel")}
              </label>
              <input
                id="bigip-enc-rd"
                className="cidr-input mono"
                inputMode="numeric"
                value={encRd}
                onChange={onRd}
                placeholder={t("encode.routeDomainPlaceholder")}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
          <p className="cidr-privacy">
            <span className="cidr-lock" aria-hidden="true">
              ●
            </span>
            {t("runsLocally")}
          </p>

          {encError && (
            <p className="cidr-error" role="alert">
              {encError}
            </p>
          )}

          {encResult && (
            <div className="jwt-results bigip-results">
              <p className="bigip-endpoint mono" aria-label={t("encode.resultLabel")}>
                {encResult.value}
              </p>
              <div className="jwt-badges saml-badges">
                <span className="jwt-badge saml-badge--type">{t(`badges.${FORMAT_BADGE[encResult.format]}`)}</span>
              </div>
              <p className="saml-note saml-note--verify">{t("encode.resultNote")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
