"use client";

// ============================================================================
// UI for the Check Point NAT black-hole predictor. The verdict is a single
// sentence - will traffic arrive - followed by the ordered reasoning, because
// the value is understanding WHY, not being told yes or no.
// House CSS classes only (verified); D-83 Example/Clear.
// Share results (2026-11-01): a button under the verdict builds a link that
// carries every field of the form; an arriving link replaces the whole form
// and the page evaluates it (subnet arithmetic; nothing is sent).
// No keyboard needed (03/11/2026): the prefix length has up and down arrows,
// 0 to 32 as the engine reads it; the two addresses stay typed.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { CHECKPOINT_NAT_PROXY_ARP_SHARE, encodeNat } from "@/lib/tools/checkpoint-nat-proxy-arp/share"; // this tool's share spec
import { evaluateNatLocalisable, type NatVerdict } from "@/lib/tools/checkpoint-nat-proxy-arp/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language
import { StepperField, stepperKeyDown } from "@/components/NumberStepper"; // up and down arrows for the prefix length (03/11/2026)
// PAGE LANGUAGE (02/11/2026): the checks, results, remedy, findings and errors arrive as EngineTexts from
// evaluateNatLocalisable() and are shown through engineTexts(t) (keys under engine.* in the pack).

/** Golden-vector-faithful sample: the classic manual-NAT black hole. */
const EXAMPLE = {
  method: "manual" as const,
  type: "static" as const,
  natIp: "203.0.113.50",
  gatewayIp: "203.0.113.1",
  gatewayPrefix: "24",
  autoArp: true,
};

export default function CheckpointNatProxyArpTool() {
  const t = useTranslations("tools.checkpoint-nat-proxy-arp");
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [method, setMethod] = useState<"automatic" | "manual">("manual");
  const [type, setType] = useState<"static" | "hide">("static");
  const [natIp, setNatIp] = useState("");
  const [gatewayIp, setGatewayIp] = useState("");
  const [prefix, setPrefix] = useState("24");
  const [autoArp, setAutoArp] = useState(true);
  const [result, setResult] = useState<NatVerdict<EngineText> | null>(null);
  const [error, setError] = useState<unknown>(null); // the error kept, so it can be translated

  /** Evaluate whatever is currently entered. */
  function evaluate(next: Partial<Record<string, string | boolean>> = {}) {
    const n = (next.natIp as string) ?? natIp;
    const g = (next.gatewayIp as string) ?? gatewayIp;
    const p = (next.prefix as string) ?? prefix;
    if (!n.trim() || !g.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    try {
      setResult(
        evaluateNatLocalisable({ // the reading, sentences with ids
          method: (next.method as "automatic" | "manual") ?? method,
          type: (next.type as "static" | "hide") ?? type,
          natIp: n,
          gatewayIp: g,
          gatewayPrefix: Number(p),
          automaticArpConfiguration: (next.autoArp as boolean) ?? autoArp,
        }),
      );
      setError(null);
    } catch (e) {
      setResult(null);
      setError(e); // shown through tx.error
    }
  }

  /** Set the prefix length and evaluate again, as typing does (the arrows call this too). */
  function setPrefixText(v: string) {
    // The field's text.
    setPrefix(v);
    // The verdict for it.
    evaluate({ prefix: v });
  }

  // An arriving share link (2026-11-01): the whole form is replaced by the link's values, then evaluated as on typing.
  useShareArrival(CHECKPOINT_NAT_PROXY_ARP_SHARE, (s) => {
    setMethod(s.method); setType(s.type); setNatIp(s.natIp); setGatewayIp(s.gatewayIp); setPrefix(s.prefix); setAutoArp(s.autoArp); // the form
    evaluate({ method: s.method, type: s.type, natIp: s.natIp, gatewayIp: s.gatewayIp, prefix: s.prefix, autoArp: s.autoArp }); // the verdict
  });
  // What Share results may carry: every field, beside a verdict (memoised).
  const share = useMemo(() => encodeNat({ method, type, natIp, gatewayIp, prefix, autoArp }, result && plainText(result)), [method, type, natIp, gatewayIp, prefix, autoArp, result]); // the encoding (the share spec reads the API's reading)

  return (
    <>
      <div className="ztc-result">
        <label className="cidr-label" htmlFor="cp-method">
          {t("methodLabel")}
        </label>
        <select
          id="cp-method"
          className="cidr-input mono"
          value={method}
          onChange={(e) => {
            const v = e.target.value as "automatic" | "manual";
            setMethod(v);
            evaluate({ method: v });
          }}
        >
          <option value="manual">{t("methodManual")}</option>
          <option value="automatic">{t("methodAutomatic")}</option>
        </select>

        <label className="cidr-label" htmlFor="cp-type">
          {t("typeLabel")}
        </label>
        <select
          id="cp-type"
          className="cidr-input mono"
          value={type}
          onChange={(e) => {
            const v = e.target.value as "static" | "hide";
            setType(v);
            evaluate({ type: v });
          }}
        >
          <option value="static">{t("typeStatic")}</option>
          <option value="hide">{t("typeHide")}</option>
        </select>

        <label className="cidr-label" htmlFor="cp-nat">
          {t("natIpLabel")}
        </label>
        <input
          id="cp-nat"
          className="cidr-input mono"
          spellCheck={false}
          value={natIp}
          placeholder="203.0.113.50"
          onChange={(e) => {
            setNatIp(e.target.value);
            evaluate({ natIp: e.target.value });
          }}
        />

        <label className="cidr-label" htmlFor="cp-gw">
          {t("gatewayLabel")}
        </label>
        <input
          id="cp-gw"
          className="cidr-input mono"
          spellCheck={false}
          value={gatewayIp}
          placeholder="203.0.113.1"
          onChange={(e) => {
            setGatewayIp(e.target.value);
            evaluate({ gatewayIp: e.target.value });
          }}
        />

        <label className="cidr-label" htmlFor="cp-prefix">
          {t("prefixLabel")}
        </label>
        {/* Up and down arrows: a prefix length of 0 to 32 (err.prefix outside it). */}
        <StepperField value={prefix} onValue={setPrefixText} min={0} max={32} integer label={t("prefixLabel")} inputId="cp-prefix">
          <input
            id="cp-prefix"
            className="cidr-input mono"
            spellCheck={false}
            // A number: the phone shows its digit keys.
            inputMode="numeric"
            value={prefix}
            placeholder="24"
            onChange={(e) => {
              // The typed text, set and evaluated as the arrows do.
              setPrefixText(e.target.value);
            }}
            // Arrow Up and Down step the length from the keyboard.
            onKeyDown={stepperKeyDown({ value: prefix, onValue: setPrefixText, min: 0, max: 32, integer: true })}
          />
        </StepperField>

        <label className="cidr-label" htmlFor="cp-autoarp">
          {t("autoArpLabel")}
        </label>
        <select
          id="cp-autoarp"
          className="cidr-input mono"
          value={autoArp ? "on" : "off"}
          onChange={(e) => {
            const v = e.target.value === "on";
            setAutoArp(v);
            evaluate({ autoArp: v });
          }}
        >
          <option value="on">{t("autoArpOn")}</option>
          <option value="off">{t("autoArpOff")}</option>
        </select>

        <div className="dig-input-head">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMethod(EXAMPLE.method);
              setType(EXAMPLE.type);
              setNatIp(EXAMPLE.natIp);
              setGatewayIp(EXAMPLE.gatewayIp);
              setPrefix(EXAMPLE.gatewayPrefix);
              setAutoArp(EXAMPLE.autoArp);
              evaluate({
                method: EXAMPLE.method,
                type: EXAMPLE.type,
                natIp: EXAMPLE.natIp,
                gatewayIp: EXAMPLE.gatewayIp,
                prefix: EXAMPLE.gatewayPrefix,
                autoArp: EXAMPLE.autoArp,
              });
            }}
          >
            {t("example")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNatIp("");
              setGatewayIp("");
              setResult(null);
              setError(null);
            }}
          >
            {t("clear")}
          </button>
        </div>
        <p className="cidr-privacy">{t("privacy")}</p>
      </div>

      {error != null && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorHeadline")}</p>
          <p className="json-error-message">{tx.error(error)}</p>
        </div>
      )}

      {result && (
        <>
          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("verdictHeading")}</h2>
            <p className="tmsh-object-head mono">
              {result.willArrive ? t("verdictArrives") : t("verdictBlackHole")}
            </p>
            <p className="cidr-privacy">
              {t("subnetNote", { network: result.workings.network })}
            </p>
            {/* Share results (2026-11-01): under the verdict, before the reasoning, at the start of its own row. */}
            <div className="rdap-ask-row">
              <ShareResultsButton encoding={share} carries={t("share.carries")} title={t("name")} />
            </div>
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("reasoningHeading")}</h2>
            <ol className="ztc-steps">
              {result.steps.map((s, i) => (
                <li key={i} className="tmsh-object">
                  <p className="tmsh-object-head mono">{tx.say(s.check)}</p>
                  <p className="ztc-notes">{tx.say(s.result)}</p>
                </li>
              ))}
            </ol>
          </div>

          {result.remedy && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("remedyHeading")}</h2>
              <p className="ztc-notes">{tx.say(result.remedy)}</p>
            </div>
          )}

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsHeading")}</h2>
              <ul className="lbm-facts">
                {result.findings.map((f, i) => (
                  <li key={i} className="ztc-notes">
                    {tx.say(f)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
