"use client";

// ============================================================================
// src/components/IrulesVsLtmPolicyTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE iRULES-vs-LTM-POLICY CLASSIFIER. Paste an iRule: each when block
// gets one of three honest verdicts - policy-expressible (with a sketch in
// the vendor's example grammar), verify-on-version (plausible, not
// demonstrated in the verified sources), or iRule-required (blockers named).
// The strategies keyword renders the three matching strategies verbatim.
//
// Share results (2026-10-27): a button builds a link that carries the box as
// pasted, after the iRule secrets check (src/lib/tcl84/irule-secrets.ts): a
// key or credential written out blocks the link and the popover names its
// line; a value whose name looks like a secret is named in the caution line.
// An arriving link fills the box as a paste would and leaves the address.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type PolicyCompareResult, type Verdict } from "@/lib/tools/f5-irules-vs-ltm-policy";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { findIruleSecrets, firstPlace } from "@/lib/tcl84/irule-secrets"; // the iRule secrets check
import { IRULES_VS_LTM_POLICY_SHARE, encodeIrulesVsLtmPolicy } from "@/lib/tools/f5-irules-vs-ltm-policy/share"; // this tool's share spec: the box, after the secrets check

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

type LiveResult = { ok: true; value: PolicyCompareResult } | { ok: false; message: string };

// D-83 example: one clean migration, one verify bucket, one keeper.
const EXAMPLE = `when HTTP_REQUEST {
    if { [HTTP::uri] contains "cmd.exe" } {
        reject
    }
    if { [HTTP::uri] starts_with "/api" } {
        pool api_pool
    }
}
when HTTP_REQUEST {
    HTTP::redirect "https://www.example.com/"
}
when CLIENT_ACCEPTED {
    table set -subtable conns [IP::client_addr] 1
}`;

const VERDICT_CLASS: Record<Verdict, string> = {
  "policy-expressible": "ivp-good",
  "verify-on-version": "ivp-verify",
  "irule-required": "ivp-keep",
};

export default function IrulesVsLtmPolicyTool() {
  const t = useTranslations("tools.f5-irules-vs-ltm-policy");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  // An arriving share link (2026-10-27): the box fills as a paste would, and the page reads it as usual.
  useShareArrival(IRULES_VS_LTM_POLICY_SHARE, (s) => setInput(s.input)); // the link's text
  // The iRule secrets check, once per change of the box: it decides the button and the caution line.
  const secrets = useMemo(() => (live && live.ok ? findIruleSecrets(input) : null), [live, input]); // null while there is no reading
  // What Share results may carry: the box as pasted, unless it holds a key or credential (memoised).
  const share = useMemo<ShareEncoding>(() => (secrets ? encodeIrulesVsLtmPolicy({ input }, secrets) : NOTHING), [secrets, input]); // the encoding
  // The first value whose name looks like a secret, for the caution line.
  const maybe = useMemo(() => (secrets ? firstPlace(secrets.maybe) : null), [secrets]); // or null

  const verdictLabel = (v: Verdict) =>
    v === "policy-expressible" ? t("verdictExpressible") : v === "verify-on-version" ? t("verdictVerify") : t("verdictIrule");

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool ivp-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="ivp-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="ivp-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={12} aria-describedby="ivp-privacy" />
        <p id="ivp-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results ivp-results">
          {/* Share results (2026-10-27): first in the reading, at the start of its own row (the verdicts can run long). */}
          <div className="rdap-ask-row">
            <ShareResultsButton
              encoding={share}
              carries={t("share.carries")}
              details={[maybe ? t("share.maybeSecret", { line: maybe.line, label: maybe.label, more: maybe.more }) : t("share.caution")]}
              blockedMessage={!share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""}
              title={t("name")}
            />
          </div>
          {live.value.mode === "strategies" && (
            <>
              {live.value.strategies!.map((s) => (
                <article className="tmsh-object" key={s.name}>
                  <header className="tmsh-object-head"><span className="tmsh-type-badge mono">{s.name}</span></header>
                  <p className="gdf-step-behavior">{s.semantics}</p>
                </article>
              ))}
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("precedenceTitle")}</div>
                <ul className="dig-warning-list mono">{live.value.precedenceHead!.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              {live.value.notes.map((n, i) => <p className="gdf-step-behavior" key={i}>{n}</p>)}
            </>
          )}

          {live.value.mode === "rule" && (
            <>
              {live.value.blocks!.map((b, i) => (
                <article className={`tmsh-object ivp-block ${VERDICT_CLASS[b.verdict]}`} key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">when {b.event}</span>
                    <span className="lbm-chip mono">line {b.line}</span>
                    <span className={`lbm-chip ivp-verdict ${VERDICT_CLASS[b.verdict]}`}>{verdictLabel(b.verdict)}</span>
                  </header>
                  {b.reasons.length > 0 && (
                    <ul className="dig-warning-list">{b.reasons.map((r, k) => <li key={k}>{r}</li>)}</ul>
                  )}
                  {b.blockers.length > 0 && (
                    <div className="jwt-panel dig-warnings gdf-obs">
                      <div className="jwt-panel-title">{t("blockersTitle")}</div>
                      <ul className="dig-warning-list">{b.blockers.map((x, k) => <li key={k}>{x}</li>)}</ul>
                    </div>
                  )}
                  {b.policySketch && (
                    <>
                      <p className="lbm-subhead">{t("sketchTitle")}</p>
                      <pre className="tmsh-input mono ivp-sketch">{b.policySketch}</pre>
                    </>
                  )}
                </article>
              ))}
              <div className="jwt-panel">
                <div className="jwt-panel-title">{t("summaryTitle")}</div>
                <ul className="dig-warning-list">{live.value.summary!.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
