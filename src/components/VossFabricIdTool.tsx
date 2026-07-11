"use client";

// ============================================================================
// src/components/VossFabricIdTool.tsx
// ----------------------------------------------------------------------------
// Decode an Extreme SPBM fabric identifier - a 24-bit I-SID, a 20-bit nickname
// (X.XX.XX), or a system-id / B-MAC - auto-detected by shape. Pure, browser-only.
// ============================================================================

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { analyzeFabricId, type FabricIdResult } from "@/lib/tools/voss-fabric-id/compute";
import { usePrefill } from "@/lib/use-prefill";

const EXAMPLE = "C.30.00"; // a nickname (server-prefix example)

function Field({ head, code, desc }: { head: string; code?: string; desc?: string }) {
  return (
    <div className="ja4-part">
      <span className="ja4-part-head">{head}</span>
      <span className="ja4-part-code mono">{code}</span>
      {desc ? <span className="ja4-part-desc">{desc}</span> : null}
    </div>
  );
}

export default function VossFabricIdTool() {
  const t = useTranslations("tools.voss-fabric-id");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<FabricIdResult | null>(null);

  const onChange = useCallback((value: string) => {
    setInput(value);
    setResult(value.trim() ? analyzeFabricId(value) : null);
  }, []);

  usePrefill(onChange);

  const headline =
    result?.kind === "isid"
      ? { label: t("kindIsid"), addr: String(result.isid?.value) }
      : result?.kind === "nickname"
        ? { label: t("kindNickname"), addr: result.nickname?.formatted }
        : result?.kind === "bmac"
          ? { label: t("kindBmac"), addr: result.bmac?.formatted }
          : null;

  return (
    <div className="cidr-tool jwt-tool oui-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="voss-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="voss-input"
          className="cidr-input mono"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-hint">{t("runsLocally")}</p>
      </div>

      {result && !result.ok && <p className="ja4-error">{result.error?.message}</p>}

      {result && result.ok && headline && (
        <div className="ja4-result">
          <div className="oui-headline">
            <span className="oui-vendor">{headline.label}</span>
            <span className="oui-address mono">{headline.addr}</span>
          </div>

          <div className="ja4-parts">
            {result.kind === "isid" && (
              <>
                <Field head={t("decimal")} code={String(result.isid?.value)} />
                <Field head={t("hex")} code={result.isid?.hex} />
                <Field head={t("width")} code={t("width24")} />
              </>
            )}
            {result.kind === "nickname" && (
              <>
                <Field head={t("format")} code={result.nickname?.formatted} />
                <Field head={t("decimal")} code={String(result.nickname?.value)} />
                <Field head={t("hex")} code={result.nickname?.hex} />
                <Field head={t("width")} code={t("width20")} />
              </>
            )}
            {result.kind === "bmac" && (
              <>
                <Field head={t("firstOctet")} code={result.bmac?.firstOctet} />
                <Field
                  head={t("adminLabel")}
                  code={result.bmac?.local ? t("local") : t("universal")}
                />
                <Field
                  head={t("castLabel")}
                  code={result.bmac?.multicast ? t("multicast") : t("unicast")}
                />
              </>
            )}
          </div>

          {result.notes && result.notes.length > 0 && (
            <ul className="ja4-notes">
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
