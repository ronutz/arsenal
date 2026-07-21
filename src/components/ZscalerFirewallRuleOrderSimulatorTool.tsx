"use client";

// ============================================================================
// src/components/ZscalerFirewallRuleOrderSimulatorTool.tsx
// ----------------------------------------------------------------------------
// UI for the ZIA firewall rule-order simulator. Paste rules in the teaching
// grammar (one per line: <order> | <name> | allow|block|block-icmp |
// criteria), optionally a flow: line and a default: line, and read the
// documented semantics back: the ascending-order rule table, the
// first-match evaluation trace, the verdict (rule or the deny-by-default
// Default rule), and the pairwise shadow findings. All compute is local
// (D-19 comments throughout; house CSS classes; D-83 Example/Clear).
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { run, type SimResult } from "@/lib/tools/zscaler-firewall-rule-order-simulator";

/** Golden-vector-faithful sample: first-match + shadow + disabled + default. */
const EXAMPLE_INPUT = [
  "# ZIA style: default blocks, granular allows above it",
  "10 | allow-web | allow | proto=tcp port=443",
  "20 | block-bad-subnet | block | proto=tcp port=443 dest=203.0.113.0/24",
  "30 | dns-out | allow | proto=udp port=53",
  "40 | old-rule | block | proto=tcp port=8080 disabled",
  "flow: proto=tcp port=443 dest=203.0.113.7",
].join("\n");

export default function ZscalerFirewallRuleOrderSimulatorTool() {
  const t = useTranslations("tools.zscaler-firewall-rule-order-simulator");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Run the simulator over the current input (local, synchronous). */
  function simulate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(run(trimmed));
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /** Action label for a verdict or trace row, localized. */
  function actionLabel(a: string): string {
    if (a === "allow") return t("actionAllow");
    if (a === "block") return t("actionBlock");
    if (a === "block-icmp") return t("actionBlockIcmp");
    return a;
  }

  return (
    <div>
      {/* ---- Input: header row with Example / Clear (D-83), then the paste box ---- */}
      <div className="dig-input-head">
        <label className="cidr-label" htmlFor="zfw-input">
          {t("inputLabel")}
        </label>
        <div className="dig-input-actions">
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput(EXAMPLE_INPUT);
              simulate(EXAMPLE_INPUT);
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="b64-copy"
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
      </div>
      <textarea
        id="zfw-input"
        className="cidr-input mono saml-textarea json-input tmsh-input"
        rows={10}
        spellCheck={false}
        value={input}
        placeholder={t("placeholder")}
        onChange={(e) => {
          setInput(e.target.value);
          simulate(e.target.value);
        }}
      />

      {/* ---- Errors: helpful, line-anchored ---- */}
      {error && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{error}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && !error && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- Results ---- */}
      {result && (
        <div className="ztc-result">
          {/* Verdict card: which rule (or the Default) decided the flow. */}
          {result.verdict && (
            <div className="tmsh-object">
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{actionLabel(result.verdict.action)}</span>
                <span className="tmsh-name">
                  {result.verdict.source === "rule"
                    ? t("verdictRule", { order: result.verdict.order ?? 0, name: result.verdict.name })
                    : t("verdictDefault")}
                </span>
              </div>
              <ul className="lbm-facts">
                <li>
                  {t("defaultLabel")}: {actionLabel(result.defaultAction)}
                  {result.defaultActionExplicit ? ` (${t("defaultExplicit")})` : ` (${t("defaultImplicit")})`}
                </li>
              </ul>
            </div>
          )}

          {/* Evaluation trace, ascending, stopping at the first match. */}
          {result.trace && (
            <>
              <h3 className="ztc-section-title">{t("traceTitle")}</h3>
              <ol className="ztc-steps">
                {result.trace.map((row) => (
                  <li key={row.order}>
                    <strong>
                      {row.order} · {row.name}
                    </strong>{" "}
                    {row.outcome === "match" && t("traceMatch", { action: actionLabel(row.action ?? "") })}
                    {row.outcome === "skipped-disabled" && t("traceSkipped")}
                    {row.outcome === "no-match" && t("traceNoMatch", { criterion: row.failedOn ?? "" })}
                  </li>
                ))}
              </ol>
            </>
          )}

          {/* Shadow findings: the rules that can never fire, and why. */}
          {result.shadows.length > 0 && (
            <>
              <h3 className="ztc-section-title">{t("shadowsTitle")}</h3>
              {result.shadows.map((s) => (
                <div className="json-error-box" key={`${s.shadowed.order}-${s.by.order}`}>
                  <p className="json-error-headline">
                    {t("shadowHead", {
                      order: s.shadowed.order,
                      name: s.shadowed.name,
                      byOrder: s.by.order,
                      byName: s.by.name,
                    })}
                  </p>
                  <p className="json-error-message">{s.reason}</p>
                </div>
              ))}
            </>
          )}

          {/* The policy as sorted: ascending order IS the policy. */}
          <h3 className="ztc-section-title">{t("rulesTitle")}</h3>
          <ol className="ztc-steps">
            {result.rules.map((r) => (
              <li key={r.order}>
                <strong>
                  {r.order} · {r.name}
                </strong>{" "}
                — {actionLabel(r.action)}
                {r.disabled ? ` · ${t("ruleDisabled")}` : ""}
                {" · "}
                <span className="mono">{r.raw.split("|").slice(3).join("|").trim() || "any"}</span>
              </li>
            ))}
          </ol>

          {/* Standing notes: the documented context. */}
          <div className="ztc-notes">
            <h3 className="ztc-section-title">{t("notesTitle")}</h3>
            <ul>
              {result.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
