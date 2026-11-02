"use client";

// ============================================================================
// src/components/LbMethodChooserTool.tsx
// ----------------------------------------------------------------------------
// THE LIVE LB-METHOD CHOOSER.
//
// Two ways in, both computed in the browser as you type:
//   * the textarea: paste an ltm pool (mode explained + deterministic
//     cross-checks), a method name (that method in full), or the word
//     "methods" (the 19-token catalogue); and
//   * the chooser panel: two selects (how capacity differs; what to react to)
//     feeding the exported recommend() table directly.
//
// The engine throws on bad input (the worker-compatible contract), so the
// live run is wrapped and errors render in the shared error box. All chrome
// strings come from the tools.f5-lb-method-chooser namespace.
//
// PAGE LANGUAGE (2026-11-02, batch H6): the engine's texts (the method cards,
// the catalogue's one-liners, the settings notes, the observations, the
// recommendation, the notes and the errors) come from runLocalisable() and
// recommendLocalisable() as EngineTexts and are shown through engineTexts(t):
// the pack's message under tools.f5-lb-method-chooser.engine.<id> when it has
// one, else the engine's English. The en pack says exactly what the engine
// says, so the English page reads as before.
//
// SHARE RESULTS (2026-10-27): two ways in, two answers, so two buttons, each
// carrying its own part (spec: src/lib/tools/f5-lb-method-chooser/share.ts):
// one at the head of the box's answer (the box as typed, with a caution line:
// pool and member names identify infrastructure), one under the chooser
// panel's recommendation (its two answers). An arriving link (useShareArrival) fills
// what it carries (the box as a paste would, the two selects as chosen); the
// address loses the values at once.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  runLocalisable,
  recommendLocalisable,
  type LbResult,
  type MethodExplain,
  type Recommendation,
  type CapacityAnswer,
  type ReactAnswer,
} from "@/lib/tools/f5-lb-method-chooser/compute"; // the engine itself, with text ids (2026-11-02); not the index, which carries the manifest and vectors
import { engineTexts, type EngineText, type EngineTexts } from "@/lib/tools/engine-text"; // engine texts in the page's language (2026-11-02)
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what a spec encodes
import { LB_METHOD_SHARE } from "@/lib/tools/f5-lb-method-chooser/share"; // this tool's share spec: the box, or the two answers

/** The live-run result, with thrown errors folded into an error envelope (shown through tx.error, in the page's language). */
type LiveResult = { ok: true; value: LbResult<EngineText> } | { ok: false; error: unknown };

/** Nothing to share (the button is disabled): a constant, so the button sees no change. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" };

// The one-click example (D-83): the golden-vector pool that showcases the
// observation engine best - ratios under least-connections (the K6406 rule),
// the slow-ramp default note, and a members table worth reading.
const EXAMPLE = `ltm pool web_pool {
    load-balancing-mode least-connections-member
    members {
        10.1.1.1:http {
            address 10.1.1.1
            ratio 3
            priority-group 1
        }
        10.1.1.2:http {
            address 10.1.1.2
        }
    }
    monitor http
}`;

function MethodCard({ m, t, tx }: { m: MethodExplain<EngineText>; t: ReturnType<typeof useTranslations>; tx: EngineTexts }) {
  return (
    <article className="tmsh-object lbm-method">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge mono">{m.token}</span>
        <span className="tmsh-object-name">{m.gui}</span>
        <span className={`lbm-chip lbm-family-${m.family}`}>{t(m.family === "static" ? "familyStatic" : "familyDynamic")}</span>
        <span className="lbm-chip lbm-scope">{t(m.scope === "member" ? "scopeMember" : m.scope === "node" ? "scopeNode" : "scopePool")}</span>
      </header>
      <dl className="lbm-facts">
        <dt>{t("weighsLabel")}</dt>
        <dd>{tx.say(m.weighs)}</dd>
        <dt>{t("behaviorLabel")}</dt>
        <dd>{tx.say(m.behavior)}</dd>
        <dt>{t("chooseWhenLabel")}</dt>
        <dd>{tx.say(m.chooseWhen)}</dd>
      </dl>
      {m.caveats.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("caveatsHeading")}</p>
          <ul>
            {m.caveats.map((c, i) => (
              <li key={i}>{tx.say(c)}</li>
            ))}
          </ul>
        </div>
      )}
      {m.related.length > 0 && (
        <p className="lbm-related">
          <span className="lbm-subhead">{t("relatedHeading")}</span>{" "}
          {m.related.map((r) => (
            <span className="lbm-chip mono" key={r}>
              {r}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

export default function LbMethodChooserTool() {
  const t = useTranslations("tools.f5-lb-method-chooser");
  const tx = engineTexts(t); // the engine's texts in the page's language (2026-11-02)
  const [input, setInput] = useState("");
  const [capacity, setCapacity] = useState<CapacityAnswer | "">("");
  const [react, setReact] = useState<ReactAnswer | "">("");

  // Live run of the textarea path; thrown errors become the error envelope.
  const result: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: runLocalisable(input) }; // texts with ids
    } catch (e) {
      return { ok: false, error: e }; // shown through tx.error
    }
  }, [input]);

  // The chooser panel: both answers present -> the deterministic table speaks.
  const rec = useMemo(() => (capacity && react ? recommendLocalisable(capacity, react) : null), [capacity, react]); // texts with ids

  // An arriving share link: what it carries is filled in (the box as a paste would, the selects as chosen).
  useShareArrival(LB_METHOD_SHARE, (state) => {
    // The box, when carried.
    if (state.input !== null) setInput(state.input);
    // The two answers, when carried (always together).
    if (state.capacity !== null && state.react !== null) { setCapacity(state.capacity); setReact(state.react); }
  });
  // What the box's button may carry: the box as typed, while it gives an answer.
  const boxShare = useMemo<ShareEncoding>(() => (result?.ok ? LB_METHOD_SHARE.encode({ input, capacity: "", react: "" }) : NOTHING), [result, input]); // memoised
  // What the panel's button may carry: its two answers, while it recommends.
  const panelShare = useMemo<ShareEncoding>(() => (rec && capacity && react ? LB_METHOD_SHARE.encode({ input: "", capacity, react }) : NOTHING), [rec, capacity, react]); // memoised

  return (
    <div className="cidr-tool jwt-tool saml-tool json-tool tmsh-tool lbm-tool">
      {/* ---- input ---------------------------------------------------------- */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="lbm-input">
            {t("inputLabel")}
          </label>
          <div className="dig-input-actions">
            <button type="button" className="b64-copy" onClick={() => setInput(EXAMPLE)}>{t("example")}</button>
            <button type="button" className="b64-copy" onClick={() => setInput("")}>{t("clear")}</button>
          </div>
        </div>
        <textarea
          id="lbm-input"
          className="cidr-input mono saml-textarea json-input tmsh-input"
          rows={9}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.raw("inputPlaceholder") as string}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-describedby="lbm-privacy"
        />
        <p id="lbm-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            ●
          </span>
          {t("runsLocally")}
        </p>
      </div>

      {/* ---- errors ---------------------------------------------------------- */}
      {result && !result.ok && (
        <div className="json-error-box" role="alert">
          <p className="json-error-headline">{t("errorTitle")}</p>
          <p className="json-error-message">{tx.error(result.error)}</p>
        </div>
      )}

      {/* Share results for the box's answer: at its head, at the start of its own row (a pool's cards run long, and
          under them the button sat just above the chooser panel, as if it shared that; moved after looking). */}
      {result?.ok && (
        <div className="rdap-ask-row">
          <ShareResultsButton encoding={boxShare} carries={t("share.carries", { part: "box" })} details={[t("share.caution")]} title={t("name")} />
        </div>
      )}

      {/* ---- pools ----------------------------------------------------------- */}
      {result?.ok && result.value.mode === "pools" && (
        <div className="tmsh-results">
          {result.value.pools!.map((p, i) => (
            <section className="persist-section" key={i}>
              <article className="tmsh-object">
                <header className="tmsh-object-head">
                  <span className="tmsh-type-badge">ltm pool</span>
                  <span className="tmsh-object-name mono">{p.name}</span>
                  <span className="tmsh-object-line">{t("lineLabel", { line: p.line })}</span>
                </header>

                {p.settings.length > 0 && (
                  <dl className="lbm-settings">
                    {p.settings.map((s, j) => (
                      <div className="lbm-setting" key={j}>
                        <dt className="mono">{s.key}</dt>
                        <dd>
                          <span className="mono">{tx.say(s.value)}</span>
                          {s.note && <span className="lbm-setting-note">· {tx.say(s.note)}</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {p.members.length > 0 && (
                  <div className="lbm-members">
                    <p className="lbm-subhead">{t("membersHeading", { count: p.members.length })}</p>
                    <table className="lbm-table">
                      <thead>
                        <tr>
                          <th>{t("memberName")}</th>
                          <th>{t("memberRatio")}</th>
                          <th>{t("memberLimit")}</th>
                          <th>{t("memberPg")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.members.map((m, j) => (
                          <tr key={j}>
                            <td className="mono">{m.name}</td>
                            <td>{m.ratio ?? "·"}</td>
                            <td>{m.connectionLimit ?? "·"}</td>
                            <td>{m.priorityGroup ?? "·"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {p.observations.length > 0 && (
                  <div className="lbm-observations">
                    <p className="lbm-subhead">{t("observationsHeading")}</p>
                    <ul>
                      {p.observations.map((o, j) => (
                        <li key={j}>{tx.say(o)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              <MethodCard m={p.method} t={t} tx={tx} />
            </section>
          ))}
        </div>
      )}

      {/* ---- single method --------------------------------------------------- */}
      {result?.ok && result.value.mode === "method" && result.value.method && ( /* the engine always names one; a missing entry renders nothing rather than failing */
        <div className="tmsh-results">
          <MethodCard m={result.value.method} t={t} tx={tx} />
        </div>
      )}

      {/* ---- catalogue ------------------------------------------------------- */}
      {result?.ok && result.value.mode === "catalog" && (
        <div className="tmsh-results">
          <p className="lbm-subhead">{t("catalogHeading")}</p>
          <table className="lbm-table lbm-catalog">
            <thead>
              <tr>
                <th>{t("colToken")}</th>
                <th>{t("colName")}</th>
                <th>{t("colFamily")}</th>
                <th>{t("colScope")}</th>
                <th>{t("colWeighs")}</th>
              </tr>
            </thead>
            <tbody>
              {result.value.catalog!.map((row) => (
                <tr key={row.token}>
                  <td className="mono">{row.token}</td>
                  <td>{row.gui}</td>
                  <td>{t(row.family === "static" ? "familyStatic" : "familyDynamic")}</td>
                  <td>{t(row.scope === "member" ? "scopeMember" : row.scope === "node" ? "scopeNode" : "scopePool")}</td>
                  <td>{tx.say(row.oneLiner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- DSL chooser result (when typed into the textarea) --------------- */}
      {result?.ok && result.value.mode === "choose" && result.value.recommendation && (
        <RecommendationCard rec={result.value.recommendation} t={t} tx={tx} />
      )}

      {/* ---- the chooser panel ----------------------------------------------- */}
      <section className="lbm-chooser">
        <h3 className="persist-heading">{t("chooserHeading")}</h3>
        <div className="lbm-chooser-row">
          <label className="lbm-chooser-label">
            {t("capacityLabel")}
            <select className="lbm-select" value={capacity} onChange={(e) => setCapacity(e.target.value as CapacityAnswer | "")}>
              <option value="">…</option>
              <option value="equal">{t("capacityEqual")}</option>
              <option value="ratio">{t("capacityRatio")}</option>
              <option value="connlimit">{t("capacityConnlimit")}</option>
              <option value="measured">{t("capacityMeasured")}</option>
            </select>
          </label>
          <label className="lbm-chooser-label">
            {t("reactLabel")}
            <select className="lbm-select" value={react} onChange={(e) => setReact(e.target.value as ReactAnswer | "")}>
              <option value="">…</option>
              <option value="none">{t("reactNone")}</option>
              <option value="connections">{t("reactConnections")}</option>
              <option value="trend">{t("reactTrend")}</option>
              <option value="sessions">{t("reactSessions")}</option>
              <option value="response">{t("reactResponse")}</option>
            </select>
          </label>
        </div>
        {rec && <RecommendationCard rec={rec} t={t} tx={tx} />}
        {/* Share results for the panel's recommendation: under it, at the start of its own row. */}
        {rec && (
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={panelShare} carries={t("share.carries", { part: "panel" })} title={t("name")} />
          </div>
        )}
      </section>
    </div>
  );
}

function RecommendationCard({
  rec,
  t,
  tx,
}: {
  rec: Recommendation<EngineText>; // the chooser's answer, texts with ids
  t: ReturnType<typeof useTranslations>;
  tx: EngineTexts; // the engine's texts in the page's language
}) {
  return (
    <article className="tmsh-object lbm-recommendation">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge">{t("recommendHeading")}</span>
        <span className="tmsh-object-name mono">{rec.primary}</span>
      </header>
      <p className="lbm-why">{tx.say(rec.why)}</p>
      {rec.prereqs.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("prereqsHeading")}</p>
          <ul>
            {rec.prereqs.map((p, i) => (
              <li key={i}>{tx.say(p)}</li>
            ))}
          </ul>
        </div>
      )}
      {rec.alternatives.length > 0 && (
        <div className="lbm-alternatives">
          <p className="lbm-subhead">{t("alternativesHeading")}</p>
          <ul>
            {rec.alternatives.map((a, i) => (
              <li key={i}>
                <span className="lbm-chip mono">{a.token}</span> <span className="lbm-alt-when">{tx.say(a.when)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
