// ============================================================================
// src/components/RpkiOriginValidationTool.tsx
// ----------------------------------------------------------------------------
// UI for the route origin validation calculator. Two inputs: the Route (a
// prefix and its origin AS) and the VRP list the reader supplies, one per line
// or as SLURM JSON. The engine in src/lib/tools/rpki-origin-validation does all
// the work; this component only renders the verdict, the VRP-by-VRP reasoning
// in RFC 6811's terms, the notes and the RFC 9319 maxLength notes.
//
// Nothing is fetched: no RPKI repository, no validator. The panel says so,
// because the verdict holds for the pasted list and for no other.
//
// Styling reuses the established vocabulary (cidr-* inputs, tcl-* verdict,
// table and pills, jwt-* panels, cipher-note): no new CSS classes.
// ============================================================================
"use client";

import { useCallback, useMemo, useState } from "react"; // React state and memo
import { useTranslations } from "next-intl"; // the tools.rpki-origin-validation strings
import { run, RovError, ROV_GOLDEN_VECTORS, type RovResult, type VrpRelation } from "@/lib/tools/rpki-origin-validation"; // the engine and its vectors
import { TclPresets } from "@/components/TclTeachParts"; // the shared, wrapping preset row

// D-83 presets: each button loads a golden vector verbatim, by id, so the page
// can never show an example the vectors do not pin. The first is the Example.
const PRESET_IDS = [
  "rfc6811-one-match-wins", // two VRPs, one Matches: Valid (the Example)
  "rfc6811-invalid-as", // Covered by another AS: Invalid
  "rfc6811-invalid-length", // longer than maxLength: Invalid
  "rfc6811-notfound", // nothing Covers: NotFound
  "as0-overridden", // AS 0 plus a real ROA (RFC 6483 s4)
  "rfc9582-range-26", // RFC 9582's maxLength example, with the RFC 9319 note
  "rfc9582-appendix-a", // IPv6, AS 65536 (asdot 1.0)
  "rfc8416-fig7-filters", // a full SLURM file
] as const; // fixed list

/** Text of a VRP input as the textarea shows it (SLURM objects as JSON text). */
function vrpText(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v, null, 2); // strings stay verbatim
}

/** CSS class for a relation pill: green for a match, red for a failing cover, muted otherwise. */
function relationClass(r: VrpRelation): string {
  if (r === "match") return "tcl-pill tcl-pill-true"; // Matched
  if (r === "not-covering" || r === "other-family") return "tcl-pill tcl-pill-muted"; // irrelevant to the verdict
  return "tcl-pill tcl-pill-bad"; // Covers but does not Match
}

/** CSS class for the verdict box. */
function verdictClass(state: RovResult["state"]): string {
  if (state === "Valid") return "tcl-verdict tcl-verdict-ok"; // green
  if (state === "Invalid") return "tcl-verdict tcl-verdict-bad"; // red
  return "tcl-verdict tcl-verdict-warn"; // NotFound: amber, nothing vouches either way
}

export default function RpkiOriginValidationTool() {
  const t = useTranslations("tools.rpki-origin-validation"); // this tool's strings

  const [route, setRoute] = useState(""); // the Route line
  const [vrps, setVrps] = useState(""); // the VRP list
  const [active, setActive] = useState<string | undefined>(undefined); // the preset currently loaded, if any

  // The engine runs on every change; an empty Route or list shows nothing yet.
  const outcome = useMemo((): { result?: RovResult; error?: string } => {
    if (route.trim() === "" || vrps.trim() === "") return {}; // wait for both inputs
    try {
      return { result: run({ route, vrps }) }; // the verdict
    } catch (e) {
      const code = e instanceof RovError ? e.code : "vrp-format"; // the stable code
      const where = e instanceof RovError && e.line !== undefined ? t("errorAt", { line: e.line }) + " " : ""; // the line at fault
      return { error: where + t(`errors.${code}`) }; // the localised message
    }
  }, [route, vrps, t]); // recompute on input or locale change

  // Load a preset (a golden vector) into both inputs.
  const load = useCallback((id: string) => {
    const v = ROV_GOLDEN_VECTORS.find((x) => x.id === id); // the vector
    if (!v) return; // cannot happen: the ids are the vectors' own
    setRoute(v.input.route); // its Route
    setVrps(vrpText(v.input.vrps)); // its VRPs, verbatim
    setActive(id); // mark it
  }, []); // stable

  // Clear both inputs.
  const clear = useCallback(() => {
    setRoute(""); // no Route
    setVrps(""); // no VRPs
    setActive(undefined); // no preset
  }, []); // stable

  const r = outcome.result; // shorthand

  return (
    <div className="cidr-tool jwt-tool tcl-tool">
      {/* The Route: one line. */}
      <div className="cidr-input-row">
        <div className="dig-input-head">
          <label className="cidr-label" htmlFor="rov-route">
            {t("routeLabel")}
          </label>
          <div className="dig-input-actions">
            {/* D-83 Example/Clear row: the Example is the first preset, a golden vector. */}
            <button type="button" className="b64-copy" onClick={() => load(PRESET_IDS[0])}>
              {t("example")}
            </button>
            <button type="button" className="b64-copy" onClick={clear}>
              {t("clear")}
            </button>
          </div>
        </div>
        <input
          id="rov-route"
          className="cidr-input mono"
          value={route}
          onChange={(e) => { setRoute(e.target.value); setActive(undefined); }}
          placeholder={t("routePlaceholder")}
          aria-describedby="rov-privacy"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* The VRPs: one per line, or SLURM JSON. */}
      <div className="cidr-input-row">
        <label className="cidr-label" htmlFor="rov-vrps">
          {t("vrpsLabel")}
        </label>
        <textarea
          id="rov-vrps"
          className="cidr-input mono json-input"
          rows={7}
          value={vrps}
          onChange={(e) => { setVrps(e.target.value); setActive(undefined); }}
          placeholder={t("vrpsPlaceholder")}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <p className="hmac-build-note">{t("formatHelp")}</p>
        {/* The presets: each loads one golden vector. */}
        <TclPresets items={PRESET_IDS.map((id) => ({ id, label: t(`presets.${id}`) }))} label={t("presetsLabel")} onPick={load} active={active} />
        <p id="rov-privacy" className="cidr-privacy">
          <span className="cidr-lock" aria-hidden="true">
            🔒
          </span>{" "}
          {t("runsLocally")}
        </p>
      </div>

      {outcome.error && (
        <p className="tcl-verdict tcl-verdict-bad" role="alert">
          {outcome.error}
        </p>
      )}

      {r && (
        <div className="jwt-results">
          {/* The verdict, with the rule that produced it. */}
          <div className={verdictClass(r.state)} role="status">
            <p>
              <span className="tcl-verdict-label">{t(`state.${r.state}.label`)}</span>
              {t(`state.${r.state}.why`, { covering: r.covering, matching: r.matching })}
            </p>
            <p className="tcl-muted">
              {t("routeLine", { prefix: r.route.prefix, origin: r.route.origin === "NONE" ? "NONE" : `AS${r.route.origin}` })}
              {r.route.originAsdot !== undefined && r.route.originAsdot.includes(".") && (
                <> {t("asdotLine", { asdot: r.route.originAsdot })}</>
              )}
            </p>
          </div>

          {/* VRP by VRP: Covers? Matches? Why not? */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("table.heading", { count: r.vrpCount })}</h4>
            <div className="tcl-table-wrap">
              <table className="tcl-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">{t("table.vrp")}</th>
                    <th scope="col">{t("table.covers")}</th>
                    <th scope="col">{t("table.result")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.vrps.map((v) => (
                    <tr key={v.index}>
                      <th scope="row">{v.index}</th>
                      <td>
                        <code>
                          {v.prefix} {t("table.maxLength", { maxLength: v.maxLength })} AS{v.asn}
                        </code>
                        {!v.maxLengthGiven && <span className="tcl-muted"> {t("table.implied")}</span>}
                        {v.comment !== undefined && <div className="tcl-muted">{v.comment}</div>}
                      </td>
                      <td>{v.covers ? t("table.yes") : t("table.no")}</td>
                      <td>
                        <span className={relationClass(v.relation)}>{t(`relations.${v.relation}.label`)}</span>{" "}
                        <span className="tcl-muted">
                          {t(`relations.${v.relation}.why`, { length: r.route.length, maxLength: v.maxLength, asn: v.asn })}
                        </span>
                        {v.viaMaxLength === true && <div className="tcl-muted">{t("table.viaMaxLength")}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="cipher-note">{t("table.rule")}</p>
          </section>

          {/* Notes tied to their documents. */}
          {r.notes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("notes.heading")}</h4>
              {r.notes.map((n) => (
                <p key={n} className="cipher-note">
                  {t(`notes.${n}`, { count: r.duplicatesRemoved, filters: r.slurmFiltersIgnored })}
                </p>
              ))}
            </section>
          )}

          {/* RFC 9319: VRPs whose maxLength reaches past their own prefix. */}
          {r.maxLengthNotes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("maxLength.heading")}</h4>
              <ul>
                {r.maxLengthNotes.map((m) => (
                  <li key={m.index}>
                    {t("maxLength.item", { index: m.index, prefix: m.prefix, maxLength: m.maxLength, asn: m.asn, count: m.authorisedPrefixes })}
                  </li>
                ))}
              </ul>
              <p className="cipher-note">{t("maxLength.rfc9319")}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
