"use client";

// ============================================================================
// src/components/F5xcHttpLbRouteExplainerTool.tsx
// ----------------------------------------------------------------------------
// UI for the F5XC HTTP LB route explainer. Paste an http_loadbalancer spec (or
// its routes array); each route is decoded in order (type, match, action,
// mutations, per-route WAF) with a first-match note. A small simulator predicts
// which route a test method + path would hit. Reuses cidr-* / jwt-* vocabulary.
//
// Share results (2026-11-01, wave 4B): a button under the request simulator
// builds a link, only when pressed, carrying a copy of the object with every
// SecretType secret and every added header or cookie value replaced, and the
// simulator's method and path (src/lib/tools/f5xc-http-lb-route-explainer/
// share.ts, posture derived). When only header or cookie values were replaced,
// the popover offers a switch to include them. An arriving link fills the box
// and the simulator, and the page reads it.
// ============================================================================

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  explainRoutes,
  simulateRequest,
  type RouteView,
  type WafMode,
} from "@/lib/tools/f5xc-http-lb-route-explainer/compute";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first maybe-secret, for the popover line
import { ROUTE_SHARE, encodeRouteRevealed, encodeRouteShare, routeObjectCopy, routeShareCopy } from "@/lib/tools/f5xc-http-lb-route-explainer/share"; // this tool's share spec: the copy, and the object as pasted for the reveal switch

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

const EXAMPLE = JSON.stringify(
  {
    metadata: { name: "shop-lb" },
    spec: {
      routes: [
        { simple_route: { http_method: "ANY", path: { regex: "/trading/.*" }, origin_pools: [{ pool: { name: "trading-pool" }, weight: 100 }], advanced_options: { app_firewall: { name: "blocking-waf" }, request_headers_to_add: [{ name: "X-Route", value: "trading" }] } } },
        { redirect_route: { http_method: "GET", path: { prefix: "/old" }, route_redirect: { host_redirect: "www.example.com", path_redirect: "/new", response_code: 301, proto_redirect: "https" } } },
        { direct_response_route: { path: { prefix: "/health" }, route_direct_response: { response_code: 200, response_body: "OK" } } },
        { simple_route: { path: { prefix: "/" }, origin_pools: [{ pool: { name: "default-pool" } }], advanced_options: { disable_waf: {} } } },
      ],
    },
  },
  null,
  2,
);

const wafBadge: Record<WafMode, string> = { inherit: "", app_firewall: "jwt-badge--ok", disabled: "jwt-badge--bad" };
const typeBadge: Record<string, string> = { simple: "jwt-badge--ok", redirect: "jwt-badge--warn", direct_response: "jwt-badge--warn", custom: "", unknown: "jwt-badge--bad" };

export default function F5xcHttpLbRouteExplainerTool() {
  const t = useTranslations("tools.f5xc-http-lb-route-explainer");

  const [text, setText] = useState("");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("");

  const result = useMemo(() => (text.trim() !== "" ? explainRoutes(text) : null), [text]);
  const sim = useMemo(() => {
    if (!result || !result.recognized || path.trim() === "") return null;
    return simulateRequest(result.routes, method, path.trim());
  }, [result, method, path]);

  const clearAll = useCallback(() => {
    setText("");
    setPath("");
  }, []);

  // An arriving share link (2026-11-01): the box and the simulator fill as a paste would, and the page reads them.
  useShareArrival(ROUTE_SHARE, (s) => { setText(s.input); setMethod(s.method); setPath(s.path); }); // the link's values
  // The object's copy, once per change of the box (only while there are routes to share).
  const objectCopy = useMemo(() => (result && result.recognized ? routeObjectCopy(text, result) : null), [result, text]); // or null
  // The simulator's path joins the check (one short line).
  const shareCopy = useMemo(() => (objectCopy ? routeShareCopy({ input: text, method, path }, objectCopy) : null), [objectCopy, text, method, path]); // or null
  // What Share results may carry: the copy, nothing, or blocked.
  const share = useMemo(() => encodeRouteShare({ input: text, method, path }, shareCopy), [shareCopy, text, method, path]); // the encoding
  // The reveal switch (PRIME 01/11/2026): the object as pasted, offered only beside a copy that replaced header or cookie values alone.
  const revealed = useMemo(() => encodeRouteRevealed({ input: text, method, path }, shareCopy), [shareCopy, text, method, path]); // or nothing
  const replaced = shareCopy && shareCopy.copy.ok ? shareCopy.copy.replaced : 0; // values the copy replaced
  const shareReveal = share.ok && shareCopy?.revealable ? { encoding: revealed, label: t("share.revealLabel", { n: replaced }), carries: t("share.carriesRevealed"), details: [t("share.revealedCaution")] } : undefined; // the switch, or none
  // The first secret-looking name with a value (the box first, then the path), named in place of the plain caution.
  const maybe = shareCopy && shareCopy.copy.ok ? firstSharePlace([...shareCopy.copy.report.maybe.map((f) => ({ ...f, field: "input" })), ...shareCopy.path.maybe]) : null; // or null
  // The popover's lines under the first: how many values were replaced, then the caution (or the maybe line).
  const shareDetails = shareCopy && shareCopy.copy.ok ? [t("share.replaced", { n: replaced }), maybe ? t("share.maybeSecret", { field: maybe.field, line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")] : []; // two lines
  // Why there is no link, when there is none.
  const shareBlocked = !share.ok && share.reason === "blocked" ? (share.code === "secret" ? t("share.blockedSecret", { field: String(share.values?.field ?? "input"), line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : t("share.blockedCopy")) : ""; // or nothing

  const renderRoute = (r: RouteView) => (
    <section className="jwt-panel" key={r.index}>
      <h4 className="jwt-panel-title">
        {t("routeN", { n: r.index + 1 })}{" "}
        <span className={`jwt-badge mono ${typeBadge[r.type] ?? ""}`}>{t(`types.${r.type}`)}</span>
        {r.disabled && <span className="jwt-badge mono jwt-badge--bad">{t("disabled")}</span>}
      </h4>

      {r.type === "custom" ? (
        <p className="cipher-note">
          {t("customRoute", { ref: r.customRef ?? "(ref)" })}
        </p>
      ) : (
        <>
          {/* match */}
          <div className="jwt-claim-row">
            <span className="jwt-claim-label">{t("match")}</span>
            <span className="jwt-claim-value mono">
              {r.method} · {t(`pathKind.${r.path.kind}`)}
              {r.path.kind !== "any" ? ` ${r.path.value}` : ""}
            </span>
          </div>
          {r.headers.length > 0 && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("headers")}</span>
              <span className="jwt-claim-value mono">
                {r.headers.map((h) => `${h.name} ${t(`headerOp.${h.op}`)}${h.value ? " " + h.value : ""}`).join("  •  ")}
              </span>
            </div>
          )}
          {r.queryParams > 0 && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("query")}</span>
              <span className="jwt-claim-value mono">{t("queryCount", { n: r.queryParams })}</span>
            </div>
          )}

          {/* action */}
          {r.type === "simple" && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("action")}</span>
              <span className="jwt-claim-value mono">
                {r.pools.length ? r.pools.map((p) => `${p.name}${p.weight != null ? ` (w${p.weight})` : ""}`).join(", ") : t("noPool")}
              </span>
            </div>
          )}
          {r.type === "redirect" && r.redirect && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("redirect")}</span>
              <span className="jwt-claim-value mono">
                {r.redirect.proto ? `${r.redirect.proto}://` : ""}
                {r.redirect.host ?? ""}
                {r.redirect.pathRewrite ?? ""} → {r.redirect.responseCode ?? 302}
              </span>
            </div>
          )}
          {r.type === "direct_response" && r.directResponse && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("directResponse")}</span>
              <span className="jwt-claim-value mono">
                {r.directResponse.responseCode ?? "(code)"} {r.directResponse.hasBody ? t("withBody") : t("noBody")}
              </span>
            </div>
          )}

          {/* modifiers */}
          {r.pathRewrite && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("pathRewrite")}</span>
              <span className="jwt-claim-value mono">
                {r.pathRewrite.kind}: {r.pathRewrite.value}
              </span>
            </div>
          )}
          {(r.requestHeadersAdd.length > 0 || r.requestHeadersRemove.length > 0) && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("reqHeaders")}</span>
              <span className="jwt-claim-value mono">
                {[...r.requestHeadersAdd.map((h) => `+${h.name}`), ...r.requestHeadersRemove.map((h) => `-${h}`)].join("  ")}
              </span>
            </div>
          )}
          {(r.responseHeadersAdd.length > 0 || r.responseHeadersRemove.length > 0) && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("respHeaders")}</span>
              <span className="jwt-claim-value mono">
                {[...r.responseHeadersAdd.map((h) => `+${h.name}`), ...r.responseHeadersRemove.map((h) => `-${h}`)].join("  ")}
              </span>
            </div>
          )}
          {r.hostRewrite !== "inherit" && (
            <div className="jwt-claim-row">
              <span className="jwt-claim-label">{t("hostRewrite")}</span>
              <span className="jwt-claim-value mono">{r.hostRewrite === "value" ? r.hostRewriteValue : t(`hostRw.${r.hostRewrite}`)}</span>
            </div>
          )}

          {/* per-route WAF */}
          <div className="jwt-claim-row">
            <span className="jwt-claim-label">{t("waf")}</span>
            <span className="jwt-badges">
              <span className={`jwt-badge mono ${wafBadge[r.waf]}`}>
                {r.waf === "app_firewall" ? `${t("wafApp")}: ${r.wafRef}` : t(`wafMode.${r.waf}`)}
              </span>
            </span>
          </div>
        </>
      )}
      {r.notes.map((n, i) => (
        <p className="cipher-note" key={i}>
          {n}
        </p>
      ))}
    </section>
  );

  return (
    <div className="cidr-tool jwt-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="route-json">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setText(EXAMPLE)}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clearAll}>
              {t("clear")}
            </button>
          </div>
        </div>
        <textarea
          id="route-json"
          className="cidr-input mono json-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          rows={8}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {result && !result.ok && (
        <p className="cidr-error" role="alert">
          {result.error}
        </p>
      )}
      {result && result.ok && !result.recognized && (
        <p className="cidr-error" role="alert">
          {result.warnings[0] ?? t("noRoutes")}
        </p>
      )}

      {result && result.recognized && (
        <div className="jwt-results">
          <p className="cipher-note">{t("firstMatchNote", { n: result.routes.length })}</p>

          {/* request simulator */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("simTitle")}</h4>
            <div className="cidr-input-row" style={{ flexDirection: "row", gap: "0.5rem", alignItems: "center" }}>
              <select className="cidr-input mono" value={method} onChange={(e) => setMethod(e.target.value)} style={{ maxWidth: "8rem" }} aria-label={t("methodLabel")}>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {/* flex 1 and min-width 0 (01/11/2026): the box's own 192 px minimum beside the method pushed the row 43 px past a
                  390 px screen; it now takes what the row has left, and shrinks with it. */}
              <input className="cidr-input mono" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/trading/AAPL" autoComplete="off" spellCheck={false} aria-label={t("pathLabel")} style={{ flex: "1 1 auto", minWidth: 0 }} />
            </div>
            {sim && (
              <div style={{ marginTop: "0.5rem" }}>
                {sim.matchedIndex !== null ? (
                  <p className="cipher-note">
                    <strong>{t("simHit", { n: sim.matchedIndex + 1 })}</strong> - {sim.note}
                  </p>
                ) : (
                  <p className="cipher-note">{sim.note}</p>
                )}
              </div>
            )}
          </section>

          {/* Share results (2026-11-01): under the simulator, before the routes, at the start of its own row. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} reveal={shareReveal} />
          </div>

          {result.routes.map(renderRoute)}

          {result.warnings.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("warnings")}</h4>
              {result.warnings.map((w, i) => (
                <p className="cipher-note" key={i}>
                  ⚠ {w}
                </p>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
