"use client";

// ============================================================================
// F5OS tenant config explainer - the UI.
// Paste the block; get it read back, with the memory arithmetic checked.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { decodeTenant, TenantConfigError, type TenantDecode } from "@/lib/tools/f5os-tenant-config-explainer";

const EXAMPLE = `tenants tenant bigip
 config type BIG-IP
 config image BIGIP-15.1.5-0.0.222.ALL-F5OS.qcow2.zip.bundle
 config nodes [ 1 2 ]
 config mgmt-ip 192.0.2.59
 config prefix-length 24
 config gateway 192.0.2.254
 config vlans [ 444 500 555 ]
 config cryptos enabled
 config vcpu-cores-per-node 2
 config memory 7680
 config storage size 76
 config running-state deployed
 config appliance-mode disabled`;

export default function F5osTenantConfigExplainerTool() {
  const t = useTranslations("tools.f5os-tenant-config-explainer");
  const [input, setInput] = useState("");

  const result = useMemo<{ ok: true; data: TenantDecode } | { ok: false; message: string } | null>(() => {
    if (!input.trim()) return null;
    try { return { ok: true, data: decodeTenant(input) }; }
    catch (e) {
      if (e instanceof TenantConfigError) return { ok: false, message: e.message };
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="tool-panel">
      <div className="dig-input-head">
        <label htmlFor="f5ot-in" className="cidr-label">{t("inputLabel")}</label>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
        </div>
      </div>
      <textarea
        id="f5ot-in" className="cidr-input mono saml-textarea json-input tmsh-input"
        value={input} onChange={(e) => setInput(e.target.value)}
        placeholder={t("placeholder")} spellCheck={false} rows={13}
      />

      {result && !result.ok && <p className="cidr-error">{result.message}</p>}

      {result && result.ok && (
        <div className="dig-result">
          <section className="dig-section">
            <h3 className="dig-section-title">{t("summary.title")}</h3>
            <dl className="dig-kv">
              {result.data.name && (<><dt>{t("summary.name")}</dt><dd className="mono">{result.data.name}</dd></>)}
              <dt>{t("summary.state")}</dt>
              <dd className="mono">{result.data.runningState}</dd>
              {result.data.vcpu !== undefined && (<><dt>{t("summary.vcpu")}</dt><dd className="mono">{result.data.vcpu}</dd></>)}
              {result.data.memory !== undefined && (<><dt>{t("summary.memory")}</dt><dd className="mono">{result.data.memory} MB</dd></>)}
              {/* The published minimum shown BESIDE the configured value, so the
                  comparison is visible rather than only described in a note. */}
              {result.data.minMemory !== undefined && (<><dt>{t("summary.minMemory")}</dt><dd className="mono">{result.data.minMemory} MB</dd></>)}
            </dl>
          </section>

          {result.data.warnings.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("warnings.title")}</h3>
              <ul className="dig-notes">{result.data.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </section>
          )}

          {result.data.fields.length > 0 && (
            <section className="dig-section">
              <h3 className="dig-section-title">{t("fields.title")}</h3>
              <ol className="dig-records">
                {result.data.fields.map((f, i) => (
                  <li key={`${f.key}-${i}`} className="dig-record">
                    <code className="mono">{f.key}: {f.value}</code>
                    <p className="dig-record-explain">{f.explain}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="dig-section">
            <h3 className="dig-section-title">{t("notes.title")}</h3>
            <ul className="dig-notes">{result.data.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </section>
        </div>
      )}
    </div>
  );
}
