"use client";

// ============================================================================
// src/components/ApmSessionVariableReferenceTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE SESSION-VARIABLE REFERENCE. Paste a variable name for its row
// (pattern-aware: session.ad.last.attr.memberOf resolves against the
// chapter's own $name/$attr_name template), an expression for every
// reference inside it explained with the secure audit riding along, a
// family name for its rows, or "variables" for the catalogue.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type SvarResult, type VarMatch, type SessionVar } from "@/lib/tools/f5-apm-session-variable-reference";

type LiveResult = { ok: true; value: SvarResult } | { ok: false; message: string };

// D-83 example: the classic empty-value trap, a secure variable read
// without -secure. The engine names exactly what happens.
const EXAMPLE = "mcget {session.logon.last.password}";

function RowCard({ row, t }: { row: SessionVar; t: ReturnType<typeof useTranslations> }) {
  return (
    <>
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{row.pattern}</span>
        <span className="lbm-chip">{row.family}</span>
        <span className="lbm-chip mono">{row.type}</span>
        {row.secure && <span className="lbm-chip ivp-verify">{t("secureChip")}</span>}
      </header>
      <p className="gdf-step-behavior">{row.meaning}</p>
      <p className="gdf-step-behavior"><strong>{t("populatedByLabel")}:</strong> {row.populatedBy}</p>
      {row.quirks && row.quirks.length > 0 && <ul className="dig-warning-list">{row.quirks.map((q, i) => <li key={i}>{q}</li>)}</ul>}
    </>
  );
}

function MatchCard({ m, t }: { m: VarMatch; t: ReturnType<typeof useTranslations> }) {
  return (
    <article className="tmsh-object svar-match">
      {m.row ? <RowCard row={m.row} t={t} /> : (
        <header className="tmsh-object-head">
          <span className="tmsh-type-badge mono">{m.input}</span>
          <span className="lbm-chip ivp-verify">{t("unknownChip")}</span>
        </header>
      )}
      {Object.keys(m.bindings).length > 0 && (
        <p className="gdf-step-behavior mono svar-bindings">{Object.entries(m.bindings).map(([k, v]) => `${k} = ${v}`).join(" · ")}</p>
      )}
      {m.notes.length > 0 && (
        <div className="jwt-panel dig-warnings gdf-obs">
          <ul className="dig-warning-list">{m.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}
    </article>
  );
}

export default function ApmSessionVariableReferenceTool() {
  const t = useTranslations("tools.f5-apm-session-variable-reference");
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
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool svar-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="svar-input">{t("inputLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea id="svar-input" className="cidr-input mono saml-textarea json-input tmsh-input" value={input}
          onChange={(e) => setInput(e.target.value)} placeholder={t.raw("inputPlaceholder")} spellCheck={false} rows={4} aria-describedby="svar-privacy" />
        <p id="svar-privacy" className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}</p>
      </div>

      {live && !live.ok && <p className="cidr-error" role="alert">{live.message}</p>}

      {live && live.ok && (
        <div className="jwt-results svar-results">
          {(live.value.mode === "lookup" || live.value.mode === "expression") && live.value.matches!.map((m, i) => <MatchCard m={m} t={t} key={i} />)}

          {live.value.mode === "family" && (
            <>
              <div className="jwt-panel"><div className="jwt-panel-title mono">{live.value.familyName}</div></div>
              {live.value.rows!.map((r, i) => <article className="tmsh-object" key={i}><RowCard row={r} t={t} /></article>)}
            </>
          )}

          {live.value.mode === "catalog" && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("familiesTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.families!.map((f) => <li key={f.name}><span className="mono">{f.name}</span> ({f.count}) — {f.blurb}</li>)}
              </ul>
            </div>
          )}

          {(live.value.observations.length > 0 || live.value.notes.length > 0) && (
            <div className="jwt-panel dig-warnings">
              <div className="jwt-panel-title">{t("observationsTitle")}</div>
              <ul className="dig-warning-list">{[...live.value.observations, ...live.value.notes].map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
