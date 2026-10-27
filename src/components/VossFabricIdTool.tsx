"use client";

// ============================================================================
// src/components/VossFabricIdTool.tsx
// ----------------------------------------------------------------------------
// Decode an Extreme SPBM fabric identifier - a 24-bit I-SID, a 20-bit nickname
// (X.XX.XX), or a system-id / B-MAC - auto-detected by shape. Pure, browser-only.
// ============================================================================

import { useCallback, useMemo, useState } from "react"; // useMemo holds the Share results encoding (2026-10-27)
import { useTranslations } from "next-intl";
import { analyzeFabricId, type FabricIdResult } from "@/lib/tools/voss-fabric-id/compute";
import { usePrefill } from "@/lib/use-prefill";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { VOSS_FABRIC_ID_SHARE } from "@/lib/tools/voss-fabric-id/share"; // this tool's share spec: the field as #input=

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

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

  // The field's value goes to usePrefill too, so a Clear, an Example or an edit drops the handed-over value from the
  // address (#input=), and a share or reload no longer carries it (RT01, 2026-10-20).
  usePrefill(onChange, input);

  // What Share results may carry (2026-10-27): the field as typed, once it decodes, as the same #input= the handoff
  // above reads (no second arrival hook: usePrefill is the arrival, unchanged).
  const share = useMemo<ShareEncoding>(() => (result?.ok ? VOSS_FABRIC_ID_SHARE.encode({ input }) : NOTHING), [result, input]); // the encoding

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
        <p className="cidr-note">{t("runsLocally")}</p>
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
          {/* Share results (2026-10-27): under the reading, at the start of its own row, so the popover opens below it. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>
        </div>
      )}
    </div>
  );
}
