"use client";

// ============================================================================
// src/components/OuiLookupTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE OUI / MAC LOOKUP. Type a MAC address (any common format) or a bare
// OUI and see the registered organization plus the unicast/multicast and
// universal/local classification. Everything runs in the browser.
//
// The IEEE MA-L snapshot is ~1.2 MB, so it is NOT imported statically. This
// component imports only the pure compute module and lazy-loads the snapshot
// with a dynamic import the first time a lookup-able value is entered - so the
// page shell stays light and the data arrives only when it is actually needed.
// ============================================================================

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { normalizeMac, analyzeMac, type OuiResult } from "@/lib/tools/oui-lookup/compute";
import { usePrefill } from "@/lib/use-prefill";

// D-83 Example - a Cisco OUI, from the same assignment family as the golden
// vectors.
const EXAMPLE = "00:1b:54:11:22:33";

function Field({ head, code, desc }: { head: string; code?: string; desc?: string }) {
  return (
    <div className="ja4-part">
      <span className="ja4-part-head">{head}</span>
      <span className="ja4-part-code mono">{code}</span>
      <span className="ja4-part-desc">{desc}</span>
    </div>
  );
}

export default function OuiLookupTool() {
  const t = useTranslations("tools.oui-lookup");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<OuiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<Map<string, string> | null>(null);

  const run = useCallback(async (value: string) => {
    const v = value.trim();
    if (!v) {
      setResult(null);
      return;
    }
    // A pure parse first: format/length errors surface instantly, and we never
    // pay to load the snapshot for input that cannot be looked up.
    const base = normalizeMac(v);
    if (!base.ok) {
      setResult(base);
      return;
    }
    // Lazy-load the OUI snapshot once, on the first lookup-able value.
    if (!mapRef.current) {
      setLoading(true);
      try {
        const mod = await import("@/lib/tools/oui-lookup/oui-data");
        mapRef.current = mod.getOuiMap();
      } finally {
        setLoading(false);
      }
    }
    const map = mapRef.current;
    setResult(analyzeMac(v, (oui) => map?.get(oui) ?? null));
  }, []);

  const onChange = useCallback(
    (value: string) => {
      setInput(value);
      void run(value);
    },
    [run],
  );

  usePrefill(onChange);

  return (
    <div className="cidr-tool jwt-tool oui-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="oui-input">
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
          id="oui-input"
          className="cidr-input mono"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-hint">{t("runsLocally")}</p>
      </div>

      {loading && <p className="oui-loading">{t("loading")}</p>}

      {result && !result.ok && <p className="ja4-error">{result.error?.message}</p>}

      {result && result.ok && (
        <div className="ja4-result">
          <div className="oui-headline">
            <span className="oui-vendor">{result.vendor ?? t("noVendor")}</span>
            <span className="oui-address mono">{result.formatted}</span>
          </div>
          <div className="ja4-parts">
            <Field
              head={t("ouiLabel")}
              code={result.ouiFormatted}
              desc={result.isOuiOnly ? t("ouiOnlyDesc") : t("ouiDesc")}
            />
            <Field
              head={t("castLabel")}
              code={result.multicast ? t("multicast") : t("unicast")}
              desc={result.multicast ? t("multicastDesc") : t("unicastDesc")}
            />
            <Field
              head={t("adminLabel")}
              code={result.local ? t("local") : t("universal")}
              desc={result.local ? t("localDesc") : t("universalDesc")}
            />
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
