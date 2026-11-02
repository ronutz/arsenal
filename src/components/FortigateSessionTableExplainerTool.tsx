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
//
// Share results (2026-11-01): a button, first in the reading, builds a link
// that carries the sessions as pasted, with a caution line, unless the FortiOS
// check finds a credential in the box; an arriving link fills the box as a
// paste would.
//
// PAGE LANGUAGE (02/11/2026): the findings, explanations, notes, warnings and
// errors arrive as EngineTexts from runLocalisable(), and the state-flag
// meanings are looked up by flag name, all under engine.* in the pack, so the
// pt-BR page reads in Portuguese; a key the pack lacks shows the English.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-11-01)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import { firstSharePlace } from "@/lib/share/text-secrets"; // the first secret-looking name, for a popover line
import { checkFortiosText, encodeFortiosBox } from "@/lib/tools/fortios-cli-config-explainer/fortios-secrets"; // the FortiOS check and the box's encoding
import { FORTIGATE_SESSION_TABLE_SHARE, sessionTableExplainerHasReading } from "@/lib/tools/fortigate-session-table-explainer/share"; // this tool's share spec
import {
  runLocalisable,
  explainStateFlag,
  type SessionResult,
} from "@/lib/tools/fortigate-session-table-explainer/compute"; // the reading with sentence ids (02/11/2026)
import { engineTexts, plainText, type EngineText } from "@/lib/tools/engine-text"; // engine sentences in the page's language

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
  const tx = engineTexts(t); // the engine's sentences in the page's language
  const [input, setInput] = useState("");
  const { result, error } = useMemo((): { result: SessionResult<EngineText> | null; error: unknown } => {
    try {
      return { result: runLocalisable(input).result, error: null }; // the reading, sentences with ids
    } catch (e) {
      return { result: null, error: e }; // shown through tx.error
    }
  }, [input]);

  // An arriving share link (2026-11-01): the box fills as a paste would, and the page reads it.
  useShareArrival(FORTIGATE_SESSION_TABLE_SHARE, (s) => setInput(s.input)); // the link's text
  // The FortiOS check: once per change, only beside a reading; it feeds the button and its popover.
  const shareCheck = useMemo(() => (sessionTableExplainerHasReading(result && plainText(result)) ? checkFortiosText(input) : null), [result, input]); // the report, or null (the share check reads the API's shape)
  const share = useMemo(() => encodeFortiosBox(input, shareCheck), [input, shareCheck]); // what Share results may carry
  const shareMaybe = shareCheck ? firstSharePlace(shareCheck.maybe) : null; // the first secret-looking name, or null
  const shareDetails = [shareMaybe ? t("share.maybeSecret", { line: shareMaybe.line, label: shareMaybe.label, more: shareMaybe.more }) : t("share.caution")]; // the caution, or the name to check
  const shareBlocked = !share.ok && share.reason === "blocked" ? t("share.blockedSecret", { line: Number(share.values?.line ?? 0), label: String(share.values?.label ?? ""), more: Number(share.values?.more ?? 0) }) : ""; // why there is no link, or nothing

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

      {error != null && <div className="cidr-error" role="alert">{tx.error(error)}</div>}

      {result && result.mode === "reference" && (
        <div className="cidr-results">
          <h3 className="cidr-section-title">{t("howToRead")}</h3>
          <ul className="dig-notes">
            {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
          </ul>
        </div>
      )}

      {result && result.mode === "decode" && (
        <div className="cidr-results">
          {result.parseWarnings.length > 0 && (
            <ul className="dig-notes">
              {result.parseWarnings.map((w, i) => <li key={i}><strong>{tx.say(w)}</strong></li>)}
            </ul>
          )}

          {/* Share results (2026-11-01): first in the reading (the sessions run long), after any parse warnings, at the start of its own row, across the whole results grid (.cidr-results has two columns from 36rem). */}
          <div className="rdap-ask-row" style={{ gridColumn: "1 / -1" }}>
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={shareDetails} blockedMessage={shareBlocked} title={t("name")} />
          </div>

          {result.sessions.map((s) => (
            <div key={s.index} className="dig-record">
              <h3 className="cidr-section-title">
                {t("sessionHeading", { n: s.index, proto: tx.say(s.protoName) })}
                {s.policyId !== null ? ` - policy_id ${s.policyId}` : ""}
              </h3>

              {/* Findings FIRST: the conclusion, not the field dump. */}
              {s.findings.length > 0 && (
                <ul className="dig-notes">
                  {s.findings.map((f, i) => <li key={i}>{tx.say(f)}</li>)}
                </ul>
              )}

              <table className="cidr-table">
                <tbody>
                  {s.protoState && (
                    <tr>
                      <th>proto_state</th>
                      <td className="mono">{s.protoState}</td>
                      <td>{s.protoStateExplain ? tx.say(s.protoStateExplain) : t("noDocumentedMeaning")}</td>
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
                            return e ? `${f}: ${tx.key(`flag.${f}`, e)}` : null; // the flag's meaning in the page's language
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
                        <td>{tx.say(h.explain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          {result.notes.length > 0 && (
            <ul className="dig-notes">
              {result.notes.map((n, i) => <li key={i}>{tx.say(n)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
