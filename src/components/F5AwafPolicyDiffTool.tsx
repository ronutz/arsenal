"use client";

// ============================================================================
// src/components/F5AwafPolicyDiffTool.tsx
// ----------------------------------------------------------------------------
// Paste a before and an after declarative WAF policy; the pure engine compares
// them and returns whether the change opened a hole (a policy-wide relaxation),
// stayed scoped to single entities, or tightened. Everything runs in the
// browser (D-49); nothing is fetched. Field paths and relaxation semantics come
// from F5's declarative WAF policy schema.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { diffPolicies, type Change } from "@/lib/tools/f5-awaf-policy-diff";

const EX_BEFORE = JSON.stringify({ policy: { enforcementMode: "blocking", "data-guard": { enabled: true }, urls: [{ name: "/app" }] } }, null, 2);
const EX_AFTER = JSON.stringify({ policy: { enforcementMode: "transparent", "data-guard": { enabled: false }, urls: [{ name: "/app" }, { name: "/reports" }] } }, null, 2);

const VERDICT_SEV: Record<string, "safe" | "info" | "danger" | "muted"> = {
  "opened-hole": "danger",
  "scoped-only": "info",
  "tightened-only": "safe",
  "mixed-scoped": "info",
  "no-change": "muted",
};

function parse(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false };
  }
}

export default function F5AwafPolicyDiffTool() {
  const t = useTranslations("tools.f5-awaf-policy-diff");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");

  const state = useMemo(() => {
    if (!before.trim() || !after.trim()) return { kind: "empty" as const };
    const pb = parse(before);
    const pa = parse(after);
    if (!pb.ok || !pa.ok) return { kind: "parse-error" as const };
    const r = diffPolicies(pb.value, pa.value);
    if (!r) return { kind: "not-policy" as const };
    return { kind: "ok" as const, r };
  }, [before, after]);

  const label = (c: Change): string => {
    const args: Record<string, string> = {};
    if (c.args) for (const [k, v] of Object.entries(c.args)) args[k] = k === "type" ? t(`dimType.${v}`) : v;
    return t(`label.${c.labelKey}`, args);
  };

  const loadExample = () => { setBefore(EX_BEFORE); setAfter(EX_AFTER); };
  const clearAll = () => { setBefore(""); setAfter(""); };

  const r = state.kind === "ok" ? state.r : null;
  const sev = r ? VERDICT_SEV[r.verdict] ?? "info" : "info";
  const policyWide = r ? r.changes.filter((c) => c.kind === "relaxation" && c.scope === "policy-wide") : [];
  const scoped = r ? r.changes.filter((c) => c.kind === "relaxation" && c.scope === "single-entity") : [];
  const tightenings = r ? r.changes.filter((c) => c.kind === "tightening") : [];

  const renderChange = (c: Change, i: number) => (
    <li key={i} className={`diff-change diff-change-${c.kind === "relaxation" ? (c.scope === "policy-wide" ? "relax-wide" : "relax-scoped") : "tighten"}`}>
      <span className={`diff-concern diff-concern-${c.concern}`}>{t(`concern.${c.concern}`)}</span>
      <span className="diff-change-text">{label(c)}</span>
    </li>
  );

  return (
    <div className="cidr-tool jwt-tool json-tool tmsh-tool fp-tool diff-tool">
      <div className="dig-input-head">
        <p className="cidr-label">{t("inputLabel")}</p>
        <div className="dig-input-actions">
          <button type="button" className="b64-copy" onClick={loadExample}>{t("example")}</button>
          <button type="button" className="b64-copy" onClick={clearAll}>{t("clear")}</button>
        </div>
      </div>

      <div className="cidr-input-row">
        <label className="cidr-label diff-sublabel" htmlFor="diff-before">{t("beforeLabel")}</label>
        <textarea id="diff-before" className="cidr-input mono saml-textarea json-input tmsh-input" value={before} onChange={(e) => setBefore(e.target.value)} placeholder={t.raw("beforePlaceholder")} spellCheck={false} rows={7} />
      </div>
      <div className="cidr-input-row">
        <label className="cidr-label diff-sublabel" htmlFor="diff-after">{t("afterLabel")}</label>
        <textarea id="diff-after" className="cidr-input mono saml-textarea json-input tmsh-input" value={after} onChange={(e) => setAfter(e.target.value)} placeholder={t.raw("afterPlaceholder")} spellCheck={false} rows={7} />
      </div>

      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      <p className="cipherstr-scope">{t("scopeNote")}</p>

      {state.kind === "empty" && <div className="awaf-empty">{t("empty")}</div>}
      {state.kind === "parse-error" && <p className="cidr-error" role="alert">{t("parseError")}</p>}
      {state.kind === "not-policy" && <p className="cidr-error" role="alert">{t("notPolicy")}</p>}

      {r && (
        <div className="tmsh-results poison-results">
          <section className={`poison-verdict poison-verdict-${sev === "muted" ? "info" : sev}`}>
            <h3 className="poison-verdict-head">{t(`verdict.${r.verdict}`)}</h3>
            <p className="poison-verdict-detail">{t("summary", { wide: r.policyWideRelaxations, scoped: r.singleEntityRelaxations, tight: r.tightenings })}</p>
          </section>

          {policyWide.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading diff-heading-danger">{t("policyWideHeading")} ({policyWide.length})</h3>
              <ul className="diff-changes">{policyWide.map(renderChange)}</ul>
            </section>
          )}
          {scoped.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("scopedHeading")} ({scoped.length})</h3>
              <ul className="diff-changes">{scoped.map(renderChange)}</ul>
            </section>
          )}
          {tightenings.length > 0 && (
            <section className="persist-section">
              <h3 className="persist-heading">{t("tighteningHeading")} ({tightenings.length})</h3>
              <ul className="diff-changes">{tightenings.map(renderChange)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
