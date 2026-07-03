"use client";

// ============================================================================
// src/components/AfmRuleContextTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE AFM CONTEXT WALK. Paste contexts + policies + a packet and watch
// the documented order do its work: accept continues, accept-decisively ends
// the walk, ICMP rules at edge contexts get skipped with the manual's own
// note, staged policies log without enforcing. A lone policy gets the audit:
// redundant and conflicting rules per the system's own definitions.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type AfmResult } from "@/lib/tools/f5-afm-rule-context";

type LiveResult = { ok: true; value: AfmResult } | { ok: false; message: string };

// D-83 example: accept-decisively at global ends the walk before a vs drop
// ever sees the packet - the hierarchy's sharpest edge.
const EXAMPLE = `security firewall policy P_GLOBAL {
    rules {
        trusted_mgmt {
            action accept-decisively
            source {
                addresses {
                    10.66.0.0/16
                }
            }
        }
    }
}
security firewall policy P_VS {
    rules {
        drop_that_subnet {
            action drop
            source {
                addresses {
                    10.66.0.0/16
                }
            }
        }
    }
}
context global {
    policy P_GLOBAL
}
context virtual vs_web {
    policy P_VS
}
packet src 10.66.1.5:31337 dst 192.0.2.10:443 proto tcp`;

export default function AfmRuleContextTool() {
  const t = useTranslations("tools.f5-afm-rule-context");
  const [input, setInput] = useState("");

  const live: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  }, [input]);

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool afm-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="afm-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="afm-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={13} aria-describedby="afm-privacy" />
        <p id="afm-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
        <p className="dve-posture">{t("postureNote")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results afm-results">
          {(live.value.mode === "contexts" || live.value.mode === "actions") && live.value.cards!.map((c) => (
            <article className="tmsh-object" key={c.name}>
              <header className="tmsh-object-head"><span className="tmsh-type-badge mono">{c.name}</span></header>
              <p className="gdf-step-behavior">{c.text}</p>
            </article>
          ))}

          {live.value.mode === "walk" && (
            <>
              {live.value.steps!.map((s, i) => (
                <article className={`tmsh-object afm-step afm-${s.disposition}`} key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">{i + 1}. {s.context}</span>
                    <span className="lbm-chip mono">{s.policy}</span>
                    {s.staged && <span className="lbm-chip ivp-verify">{t("stagedChip")}</span>}
                    {s.matchedRule && <span className="lbm-chip mono">{s.matchedRule}{s.action ? ` → ${s.action}` : ""}</span>}
                  </header>
                  {s.notes.length > 0 && <ul className="dig-warning-list">{s.notes.map((n, k) => <li key={k}>{n}</li>)}</ul>}
                </article>
              ))}
              <div className="jwt-panel dig-warnings">
                <div className="jwt-panel-title">{t("dispositionTitle")}</div>
                <p className="gdf-step-behavior">{live.value.finalDisposition}</p>
              </div>
            </>
          )}

          {live.value.mode === "policy" && (
            <>
              <div className="jwt-panel"><div className="jwt-panel-title mono">{live.value.policyName}</div></div>
              {live.value.rules!.map((r, i) => (
                <article className="tmsh-object" key={i}>
                  <header className="tmsh-object-head">
                    <span className="tmsh-type-badge mono">{r.name}</span>
                    <span className="lbm-chip mono">{r.action}</span>
                    {r.protocol !== "any" && <span className="lbm-chip mono">{r.protocol}</span>}
                    {r.fromRuleList && <span className="lbm-chip">{t("fromRuleList")}: {r.fromRuleList}</span>}
                  </header>
                </article>
              ))}
              {live.value.findings!.length > 0 && (
                <div className="jwt-panel dig-warnings gdf-obs">
                  <div className="jwt-panel-title">{t("findingsTitle")}</div>
                  <ul className="dig-warning-list">{live.value.findings!.map((f, k) => <li key={k}><strong>{f.kind}</strong>: {f.note}</li>)}</ul>
                </div>
              )}
            </>
          )}

          {(live.value.observations.length > 0 || live.value.notes.length > 0) && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("observationsTitle")}</div>
              <ul className="dig-warning-list">{[...live.value.observations, ...live.value.notes].map((o, k) => <li key={k}>{o}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
