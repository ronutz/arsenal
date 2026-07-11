"use client";

// ============================================================================
// src/components/Ja4FingerprintDecoderTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE JA4 / JA3 TLS FINGERPRINT TOOL. Paste a JA4 (the hashed a_b_c form,
// or a raw JA4_r) or a JA3 (the decimal field string, or a bare MD5). The tool
// auto-detects which it is - JA4 uses underscores, JA3 is decimal fields - and
// analyzes it: JA4 into transport/version/SNI/counts/ALPN (and computes the
// hashes from raw values); JA3 into its fields plus its MD5. All in the browser.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { analyze } from "@/lib/tools/ja4-fingerprint-decoder";

// D-83 Example - the canonical FoxIO JA4 worked example, which is a golden vector.
const EXAMPLE = "t13d1516h2_8daaf6152771_e5627efa2ab1";

function Field({ head, code, desc }: { head: string; code?: string; desc?: string }) {
  return (
    <div className="ja4-part">
      <span className="ja4-part-head">{head}</span>
      <span className="ja4-part-code mono">{code}</span>
      <span className="ja4-part-desc">{desc}</span>
    </div>
  );
}

export default function Ja4FingerprintDecoderTool() {
  const t = useTranslations("tools.ja4-fingerprint-decoder");
  const [input, setInput] = useState("");
  const result = useMemo(() => (input.trim() ? analyze(input) : null), [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool ja4-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ja4-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="ja4-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={2}
          spellCheck={false}
          placeholder={t("inputPlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <p className="cidr-hint">{t("runsLocally")}</p>
      </div>

      {/* ---- JA4 result ---- */}
      {result && result.kind === "ja4" && !result.ja4.ok && (
        <p className="ja4-error">{result.ja4.error?.message}</p>
      )}
      {result && result.kind === "ja4" && result.ja4.ok && (
        <div className="ja4-result">
          <div className="ja4-fp-row">
            <span className="ja4-fp-label">
              {result.ja4.mode === "computed" ? t("computedLabel") : t("fingerprintLabel")}
            </span>
            <span className="ja4-fp mono">{result.ja4.fingerprint}</span>
          </div>
          <div className="ja4-parts">
            <Field head={t("protocolLabel")} code={result.ja4.protocol?.code} desc={result.ja4.protocol?.label} />
            <Field head={t("versionLabel")} code={result.ja4.tlsVersion?.code} desc={result.ja4.tlsVersion?.label} />
            <Field head={t("sniLabel")} code={result.ja4.sni?.code} desc={result.ja4.sni?.label} />
            <Field head={t("cipherCountLabel")} code={String(result.ja4.cipherCount)} desc={t("cipherCountDesc")} />
            <Field head={t("extCountLabel")} code={String(result.ja4.extensionCount)} desc={t("extCountDesc")} />
            <Field head={t("alpnLabel")} code={result.ja4.alpn?.code} desc={result.ja4.alpn?.label} />
          </div>
          <div className="ja4-hashes">
            <div className="ja4-hash">
              <span className="ja4-hash-label">{t("cipherHashLabel")}</span>
              <span className="ja4-hash-value mono">{result.ja4.cipherHash}</span>
              <span className="ja4-hash-desc">{t("cipherHashDesc")}</span>
            </div>
            <div className="ja4-hash">
              <span className="ja4-hash-label">{t("extHashLabel")}</span>
              <span className="ja4-hash-value mono">{result.ja4.extensionHash}</span>
              <span className="ja4-hash-desc">{t("extHashDesc")}</span>
            </div>
          </div>
          {result.ja4.notes && result.ja4.notes.length > 0 && (
            <ul className="ja4-notes">
              {result.ja4.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ---- JA3 result ---- */}
      {result && result.kind === "ja3" && !result.ja3.ok && (
        <p className="ja4-error">{result.ja3.error?.message}</p>
      )}
      {result && result.kind === "ja3" && result.ja3.ok && (
        <div className="ja4-result">
          <div className="ja4-fp-row">
            <span className="ja4-fp-label">{t("ja3HashLabel")}</span>
            <span className="ja4-fp mono">{result.ja3.hash}</span>
          </div>
          {!result.ja3.opaque && (
            <div className="ja4-parts">
              <Field head={t("sslVersionLabel")} code={result.ja3.sslVersion?.code} desc={result.ja3.sslVersion?.label} />
              <Field head={t("cipherCountLabel")} code={String(result.ja3.cipherCount)} desc={t("cipherCountDesc")} />
              <Field head={t("extCountLabel")} code={String(result.ja3.extensionCount)} desc={t("ja3ExtCountDesc")} />
              <Field head={t("curveCountLabel")} code={String(result.ja3.curveCount)} desc={t("curveCountDesc")} />
              <Field head={t("pointFormatLabel")} code={String(result.ja3.pointFormatCount)} desc={t("pointFormatDesc")} />
            </div>
          )}
          {result.ja3.notes && result.ja3.notes.length > 0 && (
            <ul className="ja4-notes">
              {result.ja3.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="ja4-anatomy">
        <span className="ja4-anatomy-head">{t("anatomyHeading")}</span>
        <p className="ja4-anatomy-note">{t("anatomyNote")}</p>
      </div>
    </div>
  );
}
