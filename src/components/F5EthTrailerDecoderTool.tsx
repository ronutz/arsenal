"use client";

// ============================================================================
// F5 Ethernet trailer decoder - the UI.
// Paste the trailer; get the fields explained. The TLS provider section is
// reported and never decoded - see compute.ts for why that is the point.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decodeTrailer, TrailerError, type TrailerDecode } from "@/lib/tools/f5-eth-trailer-decoder";

const EXAMPLE = `F5 Ethernet Trailer Protocol
  Magic: 0xf5deb0f5
  Low Details
    Ingress: 0
    Slot: 1
    TMM: 3
    VIP: /Common/vs_api
  Medium Details
    Flow ID: 0x0000570075cfd200
    Peer ID: 0x0000570075cfd400
    RST cause: No local listener`;

export default function F5EthTrailerDecoderTool() {
  const t = useTranslations("tools.f5-eth-trailer-decoder");
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: TrailerDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeTrailer(input) }; }
    catch (e) {
      if (e instanceof TrailerError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="f5et-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="f5et-in"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")}
        spellCheck={false}
        rows={12}
      />

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("overview.title")}</h3>
            <dl className="dig-kv">
              {result.data.magic && (<><dt>{t("overview.magic")}</dt><dd className="mono">{result.data.magic}</dd></>)}
              {result.data.trailerLength !== undefined && (<><dt>{t("overview.length")}</dt><dd className="mono">{result.data.trailerLength}</dd></>)}
              {result.data.version !== undefined && (<><dt>{t("overview.version")}</dt><dd className="mono">{result.data.version}</dd></>)}
              <dt>{t("overview.noise")}</dt>
              <dd className="mono">{t(`noise.${result.data.noise}`)}</dd>
            </dl>
          </section>

          {result.data.fields.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("fields.title")}</h3>
              <ol className="dig-records">
                {result.data.fields.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="dig-record">
                    <code className="mono">{f.name}: {f.value}</code>
                    <span className="dig-record-type">{t(`noise.${f.level}`)}</span>
                    <p className="dig-record-explain">{f.explain}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* The refusal, stated where a reader will see it rather than buried
              in the notes: this is the most consequential thing the tool has to
              say about a capture. */}
          {result.data.tlsProviderPresent && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("tls.title")}</h3>
              <p className="dig-record-explain">{t("tls.body")}</p>
            </section>
          )}

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}
          {result.data.notes.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("notes.title")}</h3>
              <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
