"use client";

// ============================================================================
// src/components/FortigateSessionTableExplainerTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE FORTIGATE SESSION TABLE EXPLAINER.
//
// Paste `diagnose sys session list` output and read it back. The findings are
// rendered ABOVE the field table on purpose: the raw fields are already on the
// user's screen in their terminal, so repeating them is not the value. The
// value is the conclusion drawn from them, and burying that under a field dump
// would reproduce the problem the tool exists to solve.
//
// Everything runs in the browser. The engine throws on oversized input, so the
// run is wrapped and errors render in the shared error box.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  explainStateFlag,
  type SessionResult,
} from "@/lib/tools/fortigate-session-table-explainer";

/** D-83: golden-vector-faithful sample. This is the one-way session, because
 *  that is the reading the tool exists to surface. */
const EXAMPLE = `session info: proto=6 proto_state=02 duration=31 expire=10 timeout=3600 flags=00000000
state=log may_dirty
statistic(bytes/packets/allow_err): org=240/4/0 reply=0/0/0 tuples=2
orgin->sink: org pre->post, reply pre->post dev=5->6/6->5 gwy=10.1.1.1/192.168.1.1
hook=post dir=org act=snat 192.168.1.10:52345->93.184.216.34:443(203.0.113.5:52345)
hook=pre dir=reply act=dnat 93.184.216.34:443->203.0.113.5:52345(192.168.1.10:52345)
misc=0 policy_id=7 auth_info=0 chk_client_info=0 vd=0`;

export default function FortigateSessionTableExplainerTool() {
  const t = useTranslations("tools.fortigate-session-table-explainer");
  const [input, setInput] = useState("");

  const { result, error } = useMemo((): { result: SessionResult | null; error: string | null } => {
    try {
      return { result: run(input).result, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  return (
    <div className="cidr-tool">
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="fst-input">{t("pasteLabel")}</label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="fst-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("pastePlaceholder")}
          spellCheck={false}
          rows={12}
          aria-describedby="fst-privacy"
        />
        <p id="fst-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">&#9679;</span> {t("runsLocally")}
        </p>
      </div>

      {error && <div className="cidr-error" role="alert">{error}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-result">
          <h3 className="cidr-result-title">{t("howToRead")}</h3>
          <ul className="cidr-list">
            {result.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "decode" && (
        <div className="cidr-result">
          {result.parseWarnings.length > 0 && (
            <ul className="cidr-list">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{w}</strong></li>)}
            </ul>
          )}

          {result.sessions.map((s) => (
            <div key={s.index} className="cidr-result-block">
              <h3 className="cidr-result-title">
                {t("sessionHeading", { n: s.index, proto: s.protoName })}
                {s.policyId !== null ? ` — policy_id ${s.policyId}` : ""}
              </h3>

              {/* Findings FIRST: the conclusion, not the field dump. */}
              {s.findings.length > 0 && (
                <ul className="cidr-list">
                  {s.findings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}

              <table className="cidr-table">
                <tbody>
                  {s.protoState && (
                    <tr>
                      <th>proto_state</th>
                      <td className="mono">{s.protoState}</td>
                      <td>{s.protoStateExplain ?? t("noDocumentedMeaning")}</td>
                    </tr>
                  )}
                  {s.org && s.reply && (
                    <tr>
                      <th>{t("traffic")}</th>
                      <td className="mono">
                        org {s.org.bytes}B/{s.org.packets}p · reply {s.reply.bytes}B/{s.reply.packets}p
                      </td>
                      <td>{t("trafficHint")}</td>
                    </tr>
                  )}
                  {(s.duration !== null || s.expire !== null) && (
                    <tr>
                      <th>{t("timers")}</th>
                      <td className="mono">
                        {s.duration !== null ? `duration ${s.duration}s` : ""}
                        {s.expire !== null ? ` · expire ${s.expire}s` : ""}
                        {s.timeout !== null ? ` · timeout ${s.timeout}s` : ""}
                      </td>
                      <td>{t("timersHint")}</td>
                    </tr>
                  )}
                  {s.stateFlags.length > 0 && (
                    <tr>
                      <th>state</th>
                      <td className="mono">{s.stateFlags.join(" ")}</td>
                      <td>
                        {s.stateFlags
                          .map((f) => {
                            const e = explainStateFlag(f);
                            return e ? `${f}: ${e}` : null;
                          })
                          .filter(Boolean)
                          .join("; ") || t("noDocumentedMeaning")}
                      </td>
                    </tr>
                  )}
                  {s.gwy && (
                    <tr><th>gwy</th><td className="mono">{s.gwy}</td><td>{t("gwyHint")}</td></tr>
                  )}
                </tbody>
              </table>

              {s.hooks.length > 0 && (
                <table className="cidr-table">
                  <thead>
                    <tr>
                      <th>{t("colLeg")}</th>
                      <th>{t("colTuple")}</th>
                      <th>{t("colMeaning")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.hooks.map((h, i) => (
                      <tr key={i}>
                        <td className="mono">{h.hook}/{h.dir}/{h.act}</td>
                        <td className="mono">
                          {h.src}&rarr;{h.dst}
                          {h.translated ? ` (${h.translated})` : ""}
                        </td>
                        <td>{h.explain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
