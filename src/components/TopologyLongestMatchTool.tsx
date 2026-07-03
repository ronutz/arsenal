"use client";

// ============================================================================
// src/components/TopologyLongestMatchTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE TOPOLOGY LONGEST-MATCH SCORER.
//
// Paste gtm topology records (optionally gtm region stanzas), declare a
// source line, and watch the decision compute the way BIG-IP DNS computes
// it: the Longest Match sort renders as an ordered list with each record's
// rank rationale; the scoring walk annotates which record scored which
// candidate and which records were shadowed; the winner banner states the
// score and the round-robin tie rule when it applies.
//
// The engine throws on bad input (the worker-compatible contract), so the
// live run is wrapped and errors render in the shared error box. All chrome
// strings come from the tools.f5-topology-longest-match namespace; the
// engine's explanatory text is English by design, like its siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { run, type TopoResult, type TopoOperand } from "@/lib/tools/f5-topology-longest-match";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: TopoResult } | { ok: false; message: string };

// The one-click example (D-83): the golden-vector shadowing scenario - the
// region record scores POOL2 before the heavier wildcard can, so POOL1's 30
// beats POOL2's 20 even though a 40 sits in the list. The single best
// teaching case this tool has.
const EXAMPLE = `gtm topology ldns: subnet 192.168.0.0/24 server: pool /Common/POOL1 { score 30 }
gtm topology ldns: region /Common/REGION_A server: pool /Common/POOL2 { score 20 }
gtm topology ldns: subnet 0.0.0.0/0 server: pool /Common/POOL2 { score 40 }
gtm region /Common/REGION_A {
    region-members {
        subnet 192.168.0.0/16 { }
    }
}
source ip=192.168.0.5
candidates POOL1 POOL2`;

/** Render one record operand compactly: [not] kind value. */
function Operand({ op }: { op: TopoOperand }) {
  return (
    <span className="tlm-operand mono">
      {op.negated && <span className="tlm-not">not </span>}
      {op.wildcard ? "0.0.0.0/0" : `${op.kind} ${op.value}`}
    </span>
  );
}

export default function TopologyLongestMatchTool() {
  const t = useTranslations("tools.f5-topology-longest-match");
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
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool tlm-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="tlm-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="tlm-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="tlm-privacy"
        />
        <p id="tlm-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {live && !live.ok && (
        <p className="cidr-error" role="alert">
          {live.message}
        </p>
      )}

      {live && live.ok && (
        <div className="jwt-results tlm-results">
          {live.value.winner && (
            <div className={`jwt-panel tlm-winner ${live.value.winner.tie ? "tlm-winner-tie" : ""}`}>
              <div className="jwt-panel-title">{live.value.winner.tie ? t("winnerTieTitle") : t("winnerTitle")}</div>
              <p className="tlm-winner-line">
                {live.value.winner.names.map((n) => (
                  <span className="lbm-chip mono tlm-winner-chip" key={n}>
                    {n}
                  </span>
                ))}
                <span className="tlm-winner-score">{t("winnerScore", { score: live.value.winner.score })}</span>
              </p>
            </div>
          )}

          {live.value.candidates && live.value.candidates.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("candidatesTitle")}</div>
              <ul className="tlm-candidates">
                {live.value.candidates.map((c) => (
                  <li key={c.name}>
                    <span className="lbm-chip mono">{c.name}</span>
                    <span className="tlm-score mono">{c.score}</span>
                    <span className="tlm-cand-note">{c.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="jwt-panel">
            <div className="jwt-panel-title">{t("sortedTitle")}</div>
            <ol className="tlm-records">
              {live.value.records.map((r) => (
                <li className={`tlm-record ${r.matched === false ? "tlm-record-nomatch" : ""} ${r.shadowedBy !== undefined ? "tlm-record-shadowed" : ""}`} key={r.index}>
                  <div className="tlm-record-head">
                    <span className="tmsh-type-badge mono">#{r.index}</span>
                    <span className="tlm-ldns">ldns: <Operand op={r.ldns} /></span>
                    <span className="tlm-server">server: <Operand op={r.server} /></span>
                    <span className="lbm-chip mono">{t("scoreChip", { score: r.score })}</span>
                    <span className="lbm-chip tlm-bucket">{r.bucketLabel}</span>
                  </div>
                  <p className="tlm-sortnote">{r.sortNote}</p>
                  {r.matchNote && (
                    <p className={`tlm-matchnote ${r.matched ? "tlm-matched" : ""}`}>
                      {r.matched ? t("matchedPrefix") : t("notMatchedPrefix")} {r.matchNote}
                      {r.scored && <span className="tlm-scored"> · {t("scoredSuffix", { names: r.scored })}</span>}
                      {r.shadowedBy !== undefined && <span className="tlm-shadow"> · {t("shadowedSuffix", { by: r.shadowedBy })}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {live.value.regions.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("regionsTitle")}</div>
              <ul className="tlm-regions">
                {live.value.regions.map((r) => (
                  <li key={r.name}>
                    <span className="lbm-chip mono">{r.name}</span> <span className="mono tlm-region-members">{r.members.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {live.value.notes.length > 0 && (
            <div className="jwt-panel">
              <div className="jwt-panel-title">{t("notesTitle")}</div>
              <ul className="dig-warning-list">
                {live.value.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
