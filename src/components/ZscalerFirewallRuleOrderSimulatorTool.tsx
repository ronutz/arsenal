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
//
// Share results (2026-11-01): a button under the verdict card builds a link
// that carries the box as pasted, with a caution line, unless the shared text
// check finds a credential in it; an arriving link fills the box as a paste
// would and the page reads it.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { findShareSecrets, firstSharePlace } from "@/lib/share/text-secrets"; // the shared text check
import { ZSCALER_FIREWALL_RULE_ORDER_SHARE, encodeShare } from "@/lib/tools/zscaler-firewall-rule-order-simulator/share"; // this tool's share spec
import { runLocalisable, type SimResult } from "@/lib/tools/zscaler-firewall-rule-order-simulator/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
// PAGE LANGUAGE (02/11/2026): the shadow reasons, notes and errors arrive as EngineTexts from runLocalisable() and are shown through
// engineTexts(t) (keys under engine.* in the pack), so the pt-BR page reads in Portuguese.

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
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SimResult<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Run the simulator over the current input (local, synchronous). */
  function simulate(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(runLocalisable(trimmed)); // the reading, sentences with ids
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  /** Action label for a verdict or trace row, localized. */
  function actionLabel(a: string): string {
    if (a === "allow") return t("actionAllow");
    if (a === "block") return t("actionBlock");
    if (a === "block-icmp") return t("actionBlockIcmp");
    return a;
  }

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it (nothing is contacted).
  useShareArrival(ZSCALER_FIREWALL_RULE_ORDER_SHARE, (s) => { setInput(s.input); simulate(s.input); }); // the link's text
  // The shared text check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (result ? findShareSecrets(input) : null), [result, input]); // the report, or null
  const share = useMemo(() => encodeShare(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

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
      {error != null && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!result && error == null && <p className="ztc-empty">{t("emptyState")}</p>}

      {/* ---- Results ---- */}
      {result && (
        <div className="ztc-result">
          {/* Verdict card: which rule (or the Default) decided the flow. */}
          {result.verdict && (
            <div className="tmsh-object">
              <div className="tmsh-object-head">
                <span className="tmsh-type-badge">{actionLabel(result.verdict.action)}</span>
                <span className="tmsh-object-name">
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

          {/* Share results (2026-11-01): under the verdict card (first when there is no flow line), before the trace, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

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
                  <p className="json-error-message">{tx.say(s.reason)}</p>
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
                </strong>
                : {actionLabel(r.action)}
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
                <li key={i}>{tx.say(n)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
