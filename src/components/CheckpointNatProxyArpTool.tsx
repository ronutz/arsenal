"use client";

// ============================================================================
// UI for the Check Point NAT black-hole predictor. The verdict is a single
// sentence - will traffic arrive - followed by the ordered reasoning, because
// the value is understanding WHY, not being told yes or no.
// House CSS classes only (verified); D-83 Example/Clear.
// ============================================================================

import { useState } from "react";
import { useTranslations } from "next-intl";
import { evaluateNat, type NatVerdict } from "@/lib/tools/checkpoint-nat-proxy-arp";

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
  const [method, setMethod] = useState<"automatic" | "manual">("manual");
  const [type, setType] = useState<"static" | "hide">("static");
  const [natIp, setNatIp] = useState("");
  const [gatewayIp, setGatewayIp] = useState("");
  const [prefix, setPrefix] = useState("24");
  const [autoArp, setAutoArp] = useState(true);
  const [result, setResult] = useState<NatVerdict | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        evaluateNat({
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
      setError(e instanceof Error ? e.message : String(e));
    }
  }

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
        <input
          id="cp-prefix"
          className="cidr-input mono"
          spellCheck={false}
          value={prefix}
          placeholder="24"
          onChange={(e) => {
            setPrefix(e.target.value);
            evaluate({ prefix: e.target.value });
          }}
        />

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

      {error && (
        <div className="json-error-box">
          <p className="json-error-headline">{t("errorHeadline")}</p>
          <p className="json-error-message">{error}</p>
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
          </div>

          <div className="ztc-result">
            <h2 className="ztc-section-title">{t("reasoningHeading")}</h2>
            <ol className="ztc-steps">
              {result.steps.map((s, i) => (
                <li key={i} className="tmsh-object">
                  <p className="tmsh-object-head mono">{s.check}</p>
                  <p className="ztc-notes">{s.result}</p>
                </li>
              ))}
            </ol>
          </div>

          {result.remedy && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("remedyHeading")}</h2>
              <p className="ztc-notes">{result.remedy}</p>
            </div>
          )}

          {result.findings.length > 0 && (
            <div className="ztc-result">
              <h2 className="ztc-section-title">{t("findingsHeading")}</h2>
              <ul className="lbm-facts">
                {result.findings.map((f, i) => (
                  <li key={i} className="ztc-notes">
                    {f}
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
