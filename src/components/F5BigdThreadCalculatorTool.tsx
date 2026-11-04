// ============================================================================
// src/components/F5BigdThreadCalculatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the BigD thread calculator (BIG-IP 21.1 multi-threaded bigd sizing).
// One input, two documented formulas: type a vCPU count with an optional
// "ht" / "normal" and see the automatic thread count F5's 21.1.0 release notes
// derive, plus the bigd.numprocs override cap and the 15,000-monitor ceiling.
// Where F5's formula yields a fraction, BOTH the exact value and its floor are
// shown, with an honest note that the docs state no rounding rule.
// Styling reuses the established tool vocabulary (cidr-* input stack,
// jwt-results panels, cipher-note) - no new CSS classes.
//
// SHARE RESULTS (2026-10-27): a button under the two formula panels builds,
// only when pressed, a link carrying the line as typed (spec:
// src/lib/tools/f5-bigd-thread-calculator/share.ts). An arriving link
// (useShareArrival) fills the field as typing would and computes; the
// address loses the value at once.
//
// UP AND DOWN ARROWS (03/11/2026, PRIME: values set "through the click of a
// mouse (or press of the touchscreen)"): the line's leading vCPU count steps
// by one between the engine's bounds (1 to 1024) from the buttons beside the
// field, or from Arrow Up / Down and Page Up / Down in it; the words after the
// count (ht, normal, a platform) are kept exactly as typed.
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  BigdCalcError,
  type BigdCalcResult,
} from "@/lib/tools/f5-bigd-thread-calculator";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { BIGD_SHARE } from "@/lib/tools/f5-bigd-thread-calculator/share"; // this tool's share spec: the line as typed
// Up and down arrows for the line's vCPU count (03/11/2026).
import { StepperField, stepperKeyDown } from "@/components/NumberStepper";

// D-83 Example sample - verbatim from this tool's golden vectors
// (platform-r10900): showcases the platform-to-hyperthreading map.
const EXAMPLE = "8 r10900";

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

/** The vCPU counts the engine accepts (compute.ts parseInput: "between 1 and 1024"), the arrows' bounds. */
const VCPU_MIN = 1;
// The largest count the engine accepts.
const VCPU_MAX = 1024;

/**
 * The vCPU count at the start of the line: the digits that open its first word, as the engine reads them.
 *
 * @param line the field's text
 * @returns those digits, or "" when the line does not start with a number
 */
function leadingCount(line: string): string {
  // Digits right after any leading space.
  const m = /^\s*(\d+)/.exec(line);
  // The digits, or nothing.
  return m ? m[1] : "";
}

/**
 * The line with its leading count replaced, everything after it kept as typed ("8 ht" stepped up is "9 ht").
 *
 * @param line the field's text
 * @param count the new count, as the arrows wrote it
 * @returns the new line (the count put in front when the line had none)
 */
function withCount(line: string, count: string): string {
  // The leading space and digits, if any.
  const m = /^(\s*)(\d+)/.exec(line);
  // A count already there: swap its digits only (a "vcpus" suffix and the words after stay).
  if (m) return m[1] + count + line.slice(m[0].length);
  // No count yet: it goes first, ahead of whatever words were typed.
  const rest = line.trim();
  // The count alone, or the count and the words.
  return rest === "" ? count : `${count} ${rest}`;
}

export default function F5BigdThreadCalculatorTool() {
  const t = useTranslations("tools.f5-bigd-thread-calculator");

  const [value, setValue] = useState("");
  const [result, setResult] = useState<BigdCalcResult | null>(null);
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
        const code = e instanceof BigdCalcError ? e.code : "format";
        setError(t(`errors.${code}`));
        setResult(null);
      }
    },
    [t],
  );

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      compute(next);
    },
    [compute],
  );

  // An arriving share link: the line fills the field as typing would, and the page computes.
  useShareArrival(BIGD_SHARE, (state) => onChange(state.input)); // the line
  // What Share results may carry: the line as typed, only while it gives a result.
  const share = useMemo<ShareEncoding>(() => (result ? BIGD_SHARE.encode({ input: value }) : NOTHING), [result, value]); // memoised

  /** Render one formula panel (ht or normal). */
  const formulaPanel = (kind: "ht" | "normal", r: BigdCalcResult) => {
    const f = kind === "ht" ? r.ht : r.normal;
    const emphasized = r.requested === null || r.requested === kind;
    return (
      <section className="jwt-panel" style={emphasized ? undefined : { opacity: 0.75 }}>
        <h4 className="jwt-panel-title">{t(`${kind}.heading`)}</h4>
        <p className="jwt-claim-value mono">{t(`${kind}.formula`)}</p>
        <div className="jwt-badges" style={{ marginTop: "0.5rem" }}>
          <span className="jwt-badge jwt-badge--ok mono">
            {f.isInteger
              ? t("threadsExact", { n: f.exactDisplay })
              : t("threadsFloor", { floor: f.floor, exact: f.exactDisplay })}
          </span>
        </div>
        {!f.isInteger && <p className="cipher-note">{t("fractionNote")}</p>}
        {kind === "normal" && f.floor === 0 && (
          <p className="cipher-note">{t("zeroNote")}</p>
        )}
      </section>
    );
  };

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="bigd-input">
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
        {/* Up and down arrows for the vCPU count at the start of the line; the rest of the line is kept as typed. */}
        <StepperField value={leadingCount(value)} onValue={(n) => onChange(withCount(value, n))} min={VCPU_MIN} max={VCPU_MAX} integer label={t("inputLabel")} inputId="bigd-input">
          <input
            id="bigd-input"
            className="cidr-input mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            // Arrow Up and Down (Page Up and Down: ten) step the count from the keyboard, as the buttons do.
            onKeyDown={stepperKeyDown({ value: leadingCount(value), onValue: (n) => onChange(withCount(value, n)), min: VCPU_MIN, max: VCPU_MAX, integer: true })}
            placeholder={t("inputPlaceholder")}
            aria-describedby="bigd-privacy"
            autoComplete="off"
            spellCheck={false}
          />
        </StepperField>
        <p id="bigd-privacy" className="cidr-privacy">
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
          {/* Platform verdict first: which formula this platform selects (or
              why it selects none), plus the 21.x-applicability caveat for the
              hyperthreaded museum pieces. All mappings are sourced (rSeries/
              VELOS clouddocs, K15003); the honest cases stay honest. */}
          {result.platform && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">
                {t("platform.heading")}{" "}
                <span className="mono">{t(`platform.labels.${result.platform.id}`)}</span>
              </h4>
              {!result.platform.appliesTo21x && (
                <p className="cipher-note">{t("platform.not21x")}</p>
              )}
              {result.platform.ht === "ht" && (
                <p className="cipher-note">{t("platform.htNote")}</p>
              )}
              {result.platform.ht === "normal" && (
                <p className="cipher-note">{t("platform.normalNote")}</p>
              )}
              {result.platform.id === "ve" && (
                <p className="cipher-note">{t("platform.veNote")}</p>
              )}
              {result.platform.id === "rseries-ambiguous" && (
                <p className="cipher-note">{t("platform.rseriesAmbiguous")}</p>
              )}
              {result.modeSource === "explicit" && result.platform.ht !== "depends" &&
                result.requested !== result.platform.ht && (
                  <p className="cipher-note">{t("platform.overridden")}</p>
                )}
            </section>
          )}
          {formulaPanel("ht", result)}
          {formulaPanel("normal", result)}

          {/* Share results: under the two formulas (the answer), at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
          </div>

          {/* The override and the ceiling: the two facts around the formulas. */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("config.heading")}</h4>
            <dl className="jwt-claims">
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("config.capLabel")}</dt>
                <dd className="jwt-claim-value mono">{result.numprocsCap}</dd>
              </div>
              <div className="jwt-claim-row">
                <dt className="jwt-claim-label">{t("config.ceilingLabel")}</dt>
                <dd className="jwt-claim-value mono">15,000</dd>
              </div>
            </dl>
            <p className="cipher-note">{t("config.numprocsNote")}</p>
            <p className="cipher-note">{t("verifyNote")}</p>
          </section>
        </div>
      )}
    </div>
  );
}
