"use client";

// ============================================================================
// src/components/Ja3TlsFingerprintTool.tsx
// ----------------------------------------------------------------------------
// UI for the JA3 / JA3N passive TLS fingerprint. Paste a JA3 string; the JA3
// and JA3N MD5 hashes (copyable), the decoded fields, GREASE flags, and a
// permutation note are shown. Reuses cidr-/jwt- vocabulary.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { computeJa3 } from "@/lib/tools/ja3-tls-fingerprint/compute";

const EXAMPLE = "769,47-53-5-10-49161-49162-49171-49172-50-56-19-4,0-10-11,23-24-25,0";

export default function Ja3TlsFingerprintTool() {
  const t = useTranslations("tools.ja3-tls-fingerprint");
  const [text, setText] = useState("");
  const r = useMemo(() => (text.trim() !== "" ? computeJa3(text) : null), [text]);

  const copy = (value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(value).catch(() => {});
  };

  const list = (arr: number[]) => (arr.length ? arr.join(" ") : "-");

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ja3-in">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => setText("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea id="ja3-in" className="cidr-input mono json-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("placeholder")} rows={3} autoComplete="off" spellCheck={false} />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {r && !r.ok && (
        <p className="cidr-error" role="alert">
          {r.error}
        </p>
      )}

      {r && r.ok && (
        <div className="jwt-results">
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">
              <span className="jwt-badge mono">{r.versionName}</span>
            </h4>
            <div className="jwt-claim-row" style={{ alignItems: "center" }}>
              <span className="jwt-claim-label">{t("ja3Label")}</span>
              <span className="jwt-claim-value mono" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {r.ja3Hash}
                <button type="button" className="b64-copy" onClick={() => copy(r.ja3Hash)}>
                  {t("copy")}
                </button>
              </span>
            </div>
            <div className="jwt-claim-row" style={{ alignItems: "center" }}>
              <span className="jwt-claim-label">{t("ja3nLabel")}</span>
              <span className="jwt-claim-value mono" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                {r.ja3nHash}
                <button type="button" className="b64-copy" onClick={() => copy(r.ja3nHash)}>
                  {t("copy")}
                </button>
              </span>
            </div>
            <p className="cipher-note">{r.permuted ? t("permutedNote") : t("stableNote")}</p>
            {r.greaseFound.length > 0 && <p className="cipher-note">{t("greaseNote", { values: r.greaseFound.join(", ") })}</p>}
          </section>

          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("fieldsTitle")}</h4>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("ciphersLabel")} ({r.counts.ciphers})
              </span>
              <span className="jwt-claim-value mono">{list(r.ciphers)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("extensionsLabel")} ({r.counts.extensions})
              </span>
              <span className="jwt-claim-value mono">{list(r.extensions)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("curvesLabel")} ({r.counts.curves})
              </span>
              <span className="jwt-claim-value mono">{list(r.curves)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">
                {t("formatsLabel")} ({r.counts.formats})
              </span>
              <span className="jwt-claim-value mono">{list(r.formats)}</span>
            </div>
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("ja3StringLabel")}</span>
              <span className="jwt-claim-value mono">{r.ja3String}</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
