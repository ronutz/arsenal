// ============================================================================
// src/components/MtuMssTool.tsx
// ----------------------------------------------------------------------------
// UI for the MTU / MSS calculator. One input line: a link MTU plus optional
// stack tokens ("1500 vxlan vlan", "1500 gre v6", "1500 +57"). The engine in
// src/lib/tools/mtu-mss does all arithmetic; this component only renders.
//
// The layout teaches the tool's core lesson visually: encapsulations appear
// in the breakdown as "inside the MTU" (they shrink the inner MTU/MSS), while
// L2 shims appear as "on the frame" (they grow the frame, MTU untouched).
// Styling reuses the established tool vocabulary (cidr-* input stack,
// jwt-results panels, cipher-note) - no new CSS classes (D-19 / CSS rule).
// ============================================================================
"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { run, MtuCalcError, type MtuCalcResult } from "@/lib/tools/mtu-mss";

// D-83 Example sample - verbatim from this tool's golden vectors
// (vxlan-1500): the canonical overlay question, 1450 inner / 1550 underlay.
const EXAMPLE = "1500 vxlan";

export default function MtuMssTool() {
  const t = useTranslations("tools.mtu-mss");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<MtuCalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === "") {
        setResult(null);
        setError(null);
        return;
      }
      try {
        setResult(run(trimmed));
        setError(null);
      } catch (e) {
        const code = e instanceof MtuCalcError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (raw: string) => {
      setValue(raw);
      compute(raw);
    },
    [compute],
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="mtu-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the sample is golden-vector-faithful. */}
            <button type="button" className="b64-copy" onClick={() => onChange(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={() => onChange("")}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="mtu-input"
          className="cidr-input mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("inputPlaceholder")}
          aria-describedby="mtu-privacy"
          autoComplete="off"
          spellCheck={false}
        />
        <p id="mtu-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {error && (
        <p className="cidr-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="jwt-results">
          {/* Inner MTU + MSS: the headline numbers. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("inner.heading")}</h4>
            <p>
              {t("inner.mtu")} <span className="mono">{result.innerMtu}</span>
              {" · "}
              {t("inner.mssV4")} <span className="mono">{result.mssV4}</span>
              {" · "}
              {t("inner.mssV6")} <span className="mono">{result.mssV6}</span>
            </p>
            {result.encapTotal > 0 && (
              <p className="cipher-note">
                {t("inner.encapNote", { total: result.encapTotal, outer: result.outer })}
              </p>
            )}
            {result.innerIsV6Only && <p className="cipher-note">{t("inner.sixInFourNote")}</p>}
            {result.hasVariableLayer && <p className="cipher-note">{t("inner.variableNote")}</p>}
          </section>

          {/* The stack breakdown, split by which side of the MTU each layer is on. */}
          {result.layers.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("stack.heading")}</h4>
              <ul>
                {result.layers.map((l, i) => (
                  <li key={`${l.id}-${i}`}>
                    <span className="mono">{t(`stack.labels.${l.id}`)}</span>{" "}
                    <span className="mono">+{l.bytes} B</span>{" "}
                    {l.kind === "encap" ? t("stack.insideMtu") : t("stack.onFrame")}
                  </li>
                ))}
              </ul>
              <p className="cipher-note">{t("stack.lesson")}</p>
            </section>
          )}

          {/* Frame arithmetic at the link. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("frame.heading")}</h4>
            <p>
              {t("frame.maxFrame")} <span className="mono">{result.frame.maxFrame}</span>
              {" · "}
              {t("frame.onWire")} <span className="mono">{result.frame.onWire}</span>
            </p>
            {result.shimTotal > 0 && (
              <p className="cipher-note">{t("frame.shimNote", { shims: result.shimTotal })}</p>
            )}
          </section>

          {/* The overlay design answer: required underlay for a full 1500 inner. */}
          {result.underlay && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("underlay.heading")}</h4>
              <p>
                {t("underlay.requiredMtu")}{" "}
                <span className="mono">{result.underlay.requiredMtu}</span>
                {" · "}
                {t("underlay.requiredFrame")}{" "}
                <span className="mono">{result.underlay.requiredFrame}</span>
              </p>
              <p className="cipher-note">{t("underlay.note")}</p>
            </section>
          )}

          {/* Wire efficiency: this MTU against the two canonical references. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("efficiency.heading")}</h4>
            <p>
              <span className="mono">{result.efficiency.atMtu.mtu}</span>{" "}
              {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.atMtu.percent}%</span>
              {" · "}
              <span className="mono">1500</span> {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.ref1500.percent}%</span>
              {" · "}
              <span className="mono">9000</span> {t("efficiency.arrow")}{" "}
              <span className="mono">{result.efficiency.ref9000.percent}%</span>
            </p>
            <p className="cipher-note">{t("efficiency.note")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
