"use client";

// ============================================================================
// src/components/RoutingTableExplainerTool.tsx
// ----------------------------------------------------------------------------
// Paste `ip route`, `netstat -rn` or `route print` output: the engine
// (src/lib/tools/routing-table-explainer) detects the command, parses every
// route, finds the default routes and answers "which route does this
// destination use?". This component only renders; every reading of a field is
// a localised message keyed by the engine's stable codes, so English and
// Portuguese say the same thing about the same field.
// Styling reuses the established vocabulary (cidr-* input, jwt-* panels,
// dig-* input head and rows, tcl-* tables and notes): no new CSS classes.
// ============================================================================

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  parseRoutingTable, // the parser
  lookupRoute, // the lookup
  RouteLookupError, // the lookup's typed error
  ROUTING_VECTORS, // the golden vectors, for the Example button (D-83)
  type ParsedRoute, // one route
  type RouteFormat, // format names
  type LookupResult, // a lookup
} from "@/lib/tools/routing-table-explainer";
import ShareResultsButton from "@/components/ShareResultsButton"; // the site's Share results button (2026-10-27)
import { useShareArrival } from "@/lib/share/use-share-arrival"; // an arriving share link, applied once
import type { ShareEncoding } from "@/lib/share/spec"; // what the button is handed
import { ROUTING_TABLE_SHARE } from "@/lib/tools/routing-table-explainer/share"; // this tool's share spec: the table and the destination as typed

/** Nothing to share: a constant, so the button sees no change between renders. */
const NOTHING: ShareEncoding = { ok: false, reason: "empty" }; // the disabled state

// D-83 Example: the golden vector "sandbox-ip-route-show", byte for byte (a real `ip route show` captured in the build
// sandbox on 2026-10-19), and a destination from that vector's lookups.
const EXAMPLE_VECTOR = ROUTING_VECTORS.find((v) => v.id === "sandbox-ip-route-show"); // the vector
const EXAMPLE = EXAMPLE_VECTOR?.input ?? ""; // its text
const EXAMPLE_DEST = EXAMPLE_VECTOR?.lookups?.[1]?.destination ?? ""; // 192.0.2.77, decided by longest match

/** The iproute2 tables whose meaning ip-route(8) fixes; any other table is a policy-routing table. */
const KNOWN_TABLES = new Set(["main", "local", "default"]); // reserved names
/** Protocol values with a fixed reading in ip-route(8). */
const KNOWN_PROTOCOLS = new Set(["kernel", "boot", "static", "ra", "redirect"]); // the fixed ones
/** Scope values rtnetlink(7) names. */
const KNOWN_SCOPES = new Set(["host", "link", "global", "site", "nowhere"]); // the named ones
/** Attributes with their own reading; the rest read as a documented option. */
const KNOWN_ATTRS = new Set(["pref", "mtu", "nhid", "expires", "advmss", "Refs", "Use", "Expire", "Ref", "MSS", "Window", "irtt"]); // read individually

/** A label/value row (reuses the dig explainer's row classes). */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="dig-row">
      <span className="dig-row-label">{label}</span>
      <span className={mono ? "dig-row-value dig-mono" : "dig-row-value"}>{value}</span>
    </div>
  );
}

export default function RoutingTableExplainerTool() {
  const t = useTranslations("tools.routing-table-explainer"); // this tool's messages
  const [input, setInput] = useState(""); // the pasted text
  const [dest, setDest] = useState(""); // the destination to look up
  const [selected, setSelected] = useState<number | null>(null); // the route whose reading is shown

  const parse = useMemo(() => parseRoutingTable(input), [input]); // pure: same text, same parse
  const lookup = useMemo((): { result: LookupResult | null; error: string | null } => { // the lookup, when asked
    if (dest.trim() === "" || parse.routes.length === 0) return { result: null, error: null }; // nothing to do
    try { return { result: lookupRoute(parse, dest), error: null }; } // decided
    catch (e) { return { result: null, error: e instanceof RouteLookupError ? e.code : "bad-address" }; } // refused
  }, [parse, dest]);

  const hasInput = input.trim() !== ""; // something pasted

  // An arriving share link (2026-10-27): the table fills the box as a paste would, the destination its field (cleared
  // when the link has none), and no route's reading is open; the page parses and looks up.
  useShareArrival(ROUTING_TABLE_SHARE, (state) => { setInput(state.input); setDest(state.destination); setSelected(null); }); // as typing would

  // What Share results may carry: the table and the destination as typed, once routes were read (memoised).
  const share = useMemo<ShareEncoding>(() => (parse.routes.length > 0 ? ROUTING_TABLE_SHARE.encode({ input, destination: dest }) : NOTHING), [parse, input, dest]); // the encoding
  const route = selected !== null ? parse.routes[selected] ?? null : null; // the selected route

  /** A table or section name, in words. */
  const sectionLabel = (s: string) => {
    if (parse.format === "iproute2") return KNOWN_TABLES.has(s) ? t(`sections.table-${s}`) : t("sections.table-other", { table: s }); // iproute2 tables
    return t(`sections.${s}`); // ipv4-active, inet, main, ...
  };
  /** The next hop, in the table's words. */
  const hopText = (r: ParsedRoute) => (r.nexthops.length > 0 ? t("table.multipath", { count: r.nexthops.length }) : r.gateway !== null ? r.gateway : r.onLink ? t("table.onLink") : t("table.none")); // via, on-link or none
  /** The format's label. */
  const formatName = (f: RouteFormat) => t(`formats.${f}.name`); // e.g. "Linux iproute2 (ip route)"

  return (
    <div className="cidr-tool jwt-tool dig-tool">
      {/* -- input -- */}
      <div className="dig-input-head">
        <label htmlFor="rte-in" className="cidr-label">{t("input.label")}</label>
        <div className="dig-input-actions">
          {/* D-83 Example/Clear row: the sample is a golden vector, byte for byte. */}
          <button type="button" className="b64-copy" onClick={() => { setInput(EXAMPLE); setDest(EXAMPLE_DEST); setSelected(null); }}>{t("input.example")}</button>
          <button type="button" className="b64-copy" onClick={() => { setInput(""); setDest(""); setSelected(null); }}>{t("input.clear")}</button>
        </div>
      </div>
      <textarea
        id="rte-in"
        className="cidr-input dig-textarea"
        value={input}
        onChange={(e) => { setInput(e.target.value); setSelected(null); }}
        placeholder={t("input.placeholder")}
        spellCheck={false}
        rows={10}
      />
      <p className="cidr-privacy"><span className="cidr-lock" aria-hidden="true">&#128274;</span> {t("privacy")}</p>

      {hasInput && (
        <div className="jwt-results dig-results">
          {/* Share results (2026-10-27): first in the reading, at the start of its own row, so it is in view without
              scrolling past the panels and its popover opens below it; the link carries the table and the destination. */}
          <div className="rdap-ask-row">
            <ShareResultsButton encoding={share} carries={t("share.carries")} details={[t("share.caution")]} title={t("name")} />
          </div>

          {/* -- what was recognised -- */}
          <section className="jwt-panel">
            <h4 className="jwt-panel-title">{t("summary.title")}</h4>
            <Row label={t("summary.format")} value={formatName(parse.format)} />
            <p className="dig-meaning">{t(`formats.${parse.format}.note`)}</p>
            <Row label={t("summary.routes")} value={String(parse.routes.length)} mono />
            <Row label={t("summary.unparsedLines")} value={String(parse.unparsedLines.length)} mono />
            {parse.warnings.length > 0 && (
              <ul className="tcl-notes">
                {parse.warnings.map((w) => <li key={w} className="tcl-note tcl-note-flag">{t(`warnings.${w}`)}</li>)}
              </ul>
            )}
          </section>

          {/* -- the default routes and which one wins -- */}
          {parse.routes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("defaults.title")}</h4>
              {parse.defaults.length === 0 && <p className="dig-meaning">{t("defaults.none")}</p>}
              {parse.defaults.map((g) => (
                <div key={g.section} className="tcl-card">
                  <p className="tcl-card-title">{sectionLabel(g.section)}</p>
                  <p className="dig-meaning">
                    {t("defaults.candidates", { list: g.candidates.map((i) => `#${i + 1}`).join(", ") })}{" "}
                    {g.winner !== null ? t("defaults.winner", { n: g.winner + 1, hop: hopText(parse.routes[g.winner]) }) : ""}
                  </p>
                  <p className="dig-meaning">{t(`defaults.reasons.${g.reason}`)}</p>
                  {!g.consulted && <p className="tcl-note tcl-note-flag">{t(parse.format === "windows" ? "defaults.notConsultedWindows" : "defaults.notConsulted")}</p>}
                </div>
              ))}
            </section>
          )}

          {/* -- every route -- */}
          {parse.routes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("table.title")}</h4>
              <p className="dig-meaning">{t("table.help")}</p>
              <div className="tcl-table-wrap">
                <table className="tcl-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t("table.destination")}</th>
                      <th>{t("table.nextHop")}</th>
                      <th>{t("table.interface")}</th>
                      <th>{t("table.metric")}</th>
                      <th>{t("table.type")}</th>
                      <th>{t("table.section")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parse.routes.map((r) => (
                      <tr key={r.index}>
                        <th>
                          {/* The button opens this route's field-by-field reading below. */}
                          <button type="button" className="b64-copy" aria-pressed={selected === r.index} onClick={() => setSelected(r.index)}>{r.index + 1}</button>
                        </th>
                        <td><code>{r.prefix ?? r.destination}</code>{r.isDefault ? ` ${t("table.defaultMark")}` : ""}</td>
                        <td><code>{hopText(r)}</code></td>
                        <td><code>{r.interface ?? ""}</code></td>
                        <td><code>{r.metric !== null ? String(r.metric) : r.metricText ?? ""}</code></td>
                        <td>{r.type}</td>
                        <td>{sectionLabel(r.section)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* -- one route, field by field -- */}
          {route && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("reading.title", { n: route.index + 1, line: route.line })}</h4>
              <pre className="dig-mono">{route.raw}</pre>
              <dl className="tcl-pairs">
                {/* Destination */}
                <dt className="tcl-pairs-name">{t("reading.destination")}</dt>
                <dd className="tcl-pairs-value">
                  <code>{route.destination}</code>{" "}
                  {route.isDefault ? t("reading.destDefault", { family: route.family ?? "" })
                    : route.prefixLength !== null && route.prefixLength === (route.family === "ipv6" ? 128 : 32) ? t("reading.destHost", { prefix: route.prefix ?? "" })
                    : route.prefixLength !== null ? t("reading.destNetwork", { prefix: route.prefix ?? "", len: route.prefixLength })
                    : t("reading.destUnparsed")}
                </dd>
                {/* Next hop */}
                <dt className="tcl-pairs-name">{t("reading.nextHop")}</dt>
                <dd className="tcl-pairs-value">
                  {route.nexthops.length > 0 ? t("reading.hopMultipath", { count: route.nexthops.length })
                    : route.type !== "unicast" ? t("reading.hopByType")
                    : route.gateway !== null && !route.onLink ? t("reading.hopVia", { gw: route.gateway })
                    : t("reading.hopOnLink", { iface: route.interface ?? "?" })}
                  {route.notes.includes("gateway-link") && ` ${t("notes.gateway-link", { gw: route.gateway ?? "" })}`}
                  {route.notes.includes("gateway-mac") && ` ${t("notes.gateway-mac", { gw: route.gateway ?? "" })}`}
                </dd>
                {/* Interface */}
                {route.interface !== null && (<>
                  <dt className="tcl-pairs-name">{t("reading.interface")}</dt>
                  <dd className="tcl-pairs-value"><code>{route.interface}</code> {t(`interfaces.${parse.format === "windows" ? (route.family === "ipv6" ? "windows-ipv6" : "windows-ipv4") : parse.format}`)}</dd>
                </>)}
                {/* Metric */}
                <dt className="tcl-pairs-name">{t("reading.metric")}</dt>
                <dd className="tcl-pairs-value">
                  {route.metric !== null ? <code>{route.metric}</code> : route.metricText !== null ? <code>{route.metricText}</code> : null}{" "}
                  {t(`metrics.${parse.format}${route.metric === null && route.metricText === null ? "-none" : ""}`)}
                </dd>
                {/* Type */}
                <dt className="tcl-pairs-name">{t("reading.type")}</dt>
                <dd className="tcl-pairs-value"><code>{route.type}</code> {t(`types.${route.type}`)}</dd>
                {/* Table or section */}
                <dt className="tcl-pairs-name">{t("reading.section")}</dt>
                <dd className="tcl-pairs-value">{sectionLabel(route.section)}{parse.format === "iproute2" ? ` ${t(KNOWN_TABLES.has(route.section) ? `tables.${route.section}` : "tables.other")}` : ""}</dd>
                {/* iproute2 protocol, scope, source */}
                {route.protocol !== null && (<>
                  <dt className="tcl-pairs-name">{t("reading.protocol")}</dt>
                  <dd className="tcl-pairs-value"><code>proto {route.protocol}</code> {t(`protocols.${KNOWN_PROTOCOLS.has(route.protocol) ? route.protocol : "other"}`)}</dd>
                </>)}
                {route.scope !== null && (<>
                  <dt className="tcl-pairs-name">{t("reading.scope")}</dt>
                  <dd className="tcl-pairs-value"><code>scope {route.scope}</code> {t(`scopes.${KNOWN_SCOPES.has(route.scope) ? route.scope : "other"}`)}</dd>
                </>)}
                {route.src !== null && (<>
                  <dt className="tcl-pairs-name">{t("reading.src")}</dt>
                  <dd className="tcl-pairs-value"><code>src {route.src}</code> {t("reading.srcHelp")}</dd>
                </>)}
                {/* netstat flags, letter by letter */}
                {route.flags.length > 0 && (<>
                  <dt className="tcl-pairs-name">{t("reading.flags")}</dt>
                  <dd className="tcl-pairs-value">
                    <ul className="tcl-notes">
                      {route.flags.map((f, i) => <li key={`${f.letter}-${i}`} className={f.id ? "tcl-note" : "tcl-note tcl-note-flag"}><code>{f.letter}</code> {f.id ? `${f.id.startsWith("RTF_") ? `${f.id}: ` : ""}${t(`flags.${f.id}`)}` : t("flags.unknown")}{f.source === "macos" ? ` ${t("flags.macosOnly")}` : ""}</li>)}
                    </ul>
                  </dd>
                </>)}
                {/* iproute2 next-hop flags */}
                {route.nhFlags.map((w) => (
                  <Fragment key={w}>
                    <dt className="tcl-pairs-name"><code>{w}</code></dt>
                    <dd className="tcl-pairs-value">{t(`nhflags.${w}`)}</dd>
                  </Fragment>
                ))}
                {/* Attributes and extra columns */}
                {route.attributes.map((a, i) => (
                  <Fragment key={`${a.key}-${i}`}>
                    <dt className="tcl-pairs-name"><code>{a.key}</code></dt>
                    <dd className="tcl-pairs-value"><code>{a.value}</code> {t(`attrs.${KNOWN_ATTRS.has(a.key) ? a.key : "other"}`)}</dd>
                  </Fragment>
                ))}
                {/* Multipath hops */}
                {route.nexthops.length > 0 && (<>
                  <dt className="tcl-pairs-name">{t("reading.nexthops")}</dt>
                  <dd className="tcl-pairs-value">
                    <ul className="tcl-notes">
                      {route.nexthops.map((h, i) => <li key={i} className="tcl-note"><code>{[h.gateway ? `via ${h.gateway}` : "", h.dev ? `dev ${h.dev}` : "", h.weight !== null ? `weight ${h.weight}` : "", ...h.flags, ...h.unparsed].filter(Boolean).join(" ")}</code></li>)}
                    </ul>
                    {t("reading.weightHelp")}
                  </dd>
                </>)}
                {/* Notes on parse decisions */}
                {route.notes.filter((n) => n !== "gateway-link" && n !== "gateway-mac").map((n) => (
                  <Fragment key={n}>
                    <dt className="tcl-pairs-name">{t("reading.note")}</dt>
                    <dd className="tcl-pairs-value">{t(`notes.${n}`)}</dd>
                  </Fragment>
                ))}
                {/* Unparsed tokens: shown, never dropped */}
                {route.unparsed.length > 0 && (<>
                  <dt className="tcl-pairs-name">{t("reading.unparsed")}</dt>
                  <dd className="tcl-pairs-value"><code>{route.unparsed.join(" ")}</code> {t("reading.unparsedHelp")}</dd>
                </>)}
              </dl>
            </section>
          )}

          {/* -- which route does this destination use? -- */}
          {parse.routes.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("lookup.title")}</h4>
              <label htmlFor="rte-dest" className="cidr-label">{t("lookup.label")}</label>
              <input
                id="rte-dest"
                className="cidr-input mono"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder={t("lookup.placeholder")}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="dig-meaning">{t("lookup.rules")}</p>
              {lookup.error && <p className="cidr-error" role="alert">{t(`lookup.errors.${lookup.error}`)}</p>}
              {lookup.result && (
                <div>
                  <p className="tcl-note">
                    {lookup.result.winner !== null
                      ? t("lookup.answer", { n: lookup.result.winner + 1, prefix: parse.routes[lookup.result.winner].prefix ?? "", action: t(`lookup.actions.${lookup.result.action}`, { hop: hopText(parse.routes[lookup.result.winner]), iface: parse.routes[lookup.result.winner].interface ?? "?" }) })
                      : lookup.result.stages.some((s) => s.outcome === "throw") ? t("lookup.throwNoRoute") // a throw route sent the lookup on and nothing later matched
                      : t(`lookup.actions.${lookup.result.action}`, { hop: "", iface: "" })}
                  </p>
                  {lookup.result.decidedBy && <p className="dig-meaning">{t(`lookup.decidedBy.${lookup.result.decidedBy}`)}</p>}
                  <ol className="tcl-notes">
                    {lookup.result.stages.map((s) => (
                      <li key={s.section} className="tcl-note">
                        <strong>{sectionLabel(s.section)}</strong>{": "}
                        {t("lookup.stage", { candidates: s.candidates.length === 0 ? t("lookup.noneMatch") : s.candidates.map((i) => `#${i + 1} ${parse.routes[i].prefix}`).join(", "), longest: s.longest ?? "-", survivors: s.survivors.map((i) => `#${i + 1}`).join(", ") || "-" })}{" "}
                        {t(`lookup.outcomes.${s.outcome}`)}
                      </li>
                    ))}
                  </ol>
                  {lookup.result.skipped.map((s) => <p key={s.section} className="tcl-note tcl-note-flag">{t(`lookup.skipped.${s.reason}`, { section: sectionLabel(s.section) })}</p>)}
                  {lookup.result.unusable.length > 0 && <p className="tcl-note tcl-note-flag">{t("lookup.unusable", { list: lookup.result.unusable.map((i) => `#${i + 1}`).join(", ") })}</p>}
                </div>
              )}
            </section>
          )}

          {/* -- the Windows Interface List -- */}
          {parse.interfaces.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("interfaceList.title")}</h4>
              <p className="dig-meaning">{t("interfaceList.help")}</p>
              {parse.interfaces.map((i) => <Row key={i.index} label={String(i.index)} value={`${i.description}${i.mac ? ` (${i.mac})` : ""}`} />)}
            </section>
          )}

          {/* -- lines not understood: shown, never dropped -- */}
          {parse.unparsedLines.length > 0 && (
            <section className="jwt-panel">
              <h4 className="jwt-panel-title">{t("unparsed.title")}</h4>
              <p className="dig-meaning">{t("unparsed.help")}</p>
              {parse.unparsedLines.map((u) => <Row key={u.line} label={t("unparsed.line", { line: u.line })} value={u.text} mono />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
