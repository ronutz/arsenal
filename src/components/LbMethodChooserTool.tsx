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
// strings come from the tools.f5-lb-method-chooser namespace; the engine's
// explanatory text is English by design, like its explainer siblings.
// ============================================================================

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  run,
  recommend,
  type LbResult,
  type MethodExplain,
  type CapacityAnswer,
  type ReactAnswer,
} from "@/lib/tools/f5-lb-method-chooser";

/** The live-run result, with thrown errors folded into an error envelope. */
type LiveResult = { ok: true; value: LbResult } | { ok: false; message: string };

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

function MethodCard({ m, t }: { m: MethodExplain; t: ReturnType<typeof useTranslations> }) {
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
        <dd>{m.weighs}</dd>
        <dt>{t("behaviorLabel")}</dt>
        <dd>{m.behavior}</dd>
        <dt>{t("chooseWhenLabel")}</dt>
        <dd>{m.chooseWhen}</dd>
      </dl>
      {m.caveats.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("caveatsHeading")}</p>
          <ul>
            {m.caveats.map((c, i) => (
              <li key={i}>{c}</li>
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
  const [input, setInput] = useState("");
  const [capacity, setCapacity] = useState<CapacityAnswer | "">("");
  const [react, setReact] = useState<ReactAnswer | "">("");

  // Live run of the textarea path; thrown errors become the error envelope.
  const result: LiveResult | null = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true, value: run(input) };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  }, [input]);

  // The chooser panel: both answers present -> the deterministic table speaks.
  const rec = useMemo(() => (capacity && react ? recommend(capacity, react) : null), [capacity, react]);

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
          <p className="json-error-message">{result.message}</p>
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
                          <span className="mono">{s.value}</span>
                          {s.note && <span className="lbm-setting-note">· {s.note}</span>}
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
                        <li key={j}>{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              <MethodCard m={p.method} t={t} />
            </section>
          ))}
        </div>
      )}

      {/* ---- single method --------------------------------------------------- */}
      {result?.ok && result.value.mode === "method" && (
        <div className="tmsh-results">
          <MethodCard m={result.value.method!} t={t} />
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
                  <td>{row.oneLiner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- DSL chooser result (when typed into the textarea) --------------- */}
      {result?.ok && result.value.mode === "choose" && result.value.recommendation && (
        <RecommendationCard rec={result.value.recommendation} t={t} />
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
        {rec && <RecommendationCard rec={rec} t={t} />}
      </section>
    </div>
  );
}

function RecommendationCard({
  rec,
  t,
}: {
  rec: { primary: string; why: string; alternatives: { token: string; when: string }[]; prereqs: string[] };
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <article className="tmsh-object lbm-recommendation">
      <header className="tmsh-object-head">
        <span className="tmsh-type-badge">{t("recommendHeading")}</span>
        <span className="tmsh-object-name mono">{rec.primary}</span>
      </header>
      <p className="lbm-why">{rec.why}</p>
      {rec.prereqs.length > 0 && (
        <div className="lbm-caveats">
          <p className="lbm-subhead">{t("prereqsHeading")}</p>
          <ul>
            {rec.prereqs.map((p, i) => (
              <li key={i}>{p}</li>
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
                <span className="lbm-chip mono">{a.token}</span> <span className="lbm-alt-when">{a.when}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
