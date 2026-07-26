"use client";

// ============================================================================
// src/components/FortiosConfigDiffExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FORTIOS CONFIG DIFF EXPLAINER.
//
// Changes group by section, because that is how someone reviewing a change
// thinks: "what happened to the policies" rather than "what happened at line
// 4,312". An order change is styled distinctly because it is the finding a
// line diff buries and a reviewer misses — no setting differs, and the device
// behaves differently.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type DiffResult, type ChangeKind } from "@/lib/tools/fortios-config-diff-explainer";

/** D-83: golden-vector-faithful sample. Policies 1 and 2 swap places and no
 *  setting changes — the case the whole tool is built around. */
const EXAMPLE = `config firewall policy
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
end
---
config firewall policy
    edit 2
        set name "deny-guest"
        set srcintf "port1"
        set dstaddr "all"
        set action deny
    next
    edit 1
        set name "allow-web"
        set srcintf "port1"
        set dstaddr "WebSrv"
        set action accept
    next
end`;

function badgeClass(k: ChangeKind): string {
  return k === "object-moved" || k === "object-removed" || k === "section-removed"
    ? "certhub-guide-badge certhub-guide-badge--prep"
    : "certhub-guide-badge";
}

export default function FortiosConfigDiffExplainerTool() {
  const t = useTranslations("tools.fortios-config-diff-explainer");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: DiffResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  // Group by section so the output reads the way a change review does.
  const grouped = useMemo(() => {
    const m = new Map<string, DiffResult["changes"][number][]>();
    for (const c of result?.changes ?? []) {
      if (!m.has(c.section)) m.set(c.section, []);
      m.get(c.section)!.push(c);
    }
    return [...m.entries()];
  }, [result]);

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fcd-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fcd-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={14}
          aria-describedby="fcd-privacy"
        />
        <p id="fcd-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("howItWorks")}</h3>
          <ul className="cidr-list">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "diff" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {grouped.map(([section, changes]) => (
            <div key={section} className="cidr-result-block">
              <h3 className="cidr-result-title">{section}</h3>
              <table className="cidr-table">
                <thead>
                  <tr>
                    <th>{t("colChange")}</th>
                    <th>{t("colObject")}</th>
                    <th>{t("colDetail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c, i) => (
                    <tr key={i}>
                      <td><span className={badgeClass(c.kind)}>{t(`kind_${c.kind}`)}</span></td>
                      <td className="mono">{c.object ?? "-"}</td>
                      <td>
                        {c.detail}
                        {c.settings.length > 0 && (
                          <ul className="cidr-list">
                            {c.settings.map((s, j) => (
                              <li key={j} className="mono">
                                {s.key}: {s.before ?? t("absent")} &rarr; {s.after ?? t("absent")}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {result.notes.length > 0 && (
            <ul className="cidr-list">
              {result.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
