"use client";

/**
 * src/components/StatsPanels.tsx
 *
 * Client-side fetch of the site's own aggregate request counts. Reads from
 * /api/stats/* - the same Worker that counts, same origin, no third party.
 * This component only READS; nothing here reports anything about the reader.
 *
 * REWORKED 2026-09-06 (PRIME):
 *  - every panel carries a short objective description under its title
 *  - countries render an SVG flag beside the code and name
 *  - languages render the code with the language's native name
 *  - referrers are grouped by source family (search, AI, social, other)
 *  - pages are grouped by locale: en variants, then pt variants, then the
 *    rest alphabetically; ranked by views within each group
 *  - a mobile-versus-desktop share, from the coarse device class the Worker
 *    derives from the User-Agent and never stores
 *
 * Full referring URLs are aggregated to the host by the endpoint; this
 * component has nothing finer to render even if it asked.
 */

import { useEffect, useMemo, useState } from "react";
import CountryFlag from "@/components/CountryFlag";

type Row = Record<string, string | number>;
type PanelKind = "ranked" | "timeline" | "countries" | "locales" | "referrers" | "pages" | "devices"
  | "aishare" | "sections" | "tail" | "hourofday" | "weekday" | "coverage";
type Panel = { route: string; titleKey: string; noteKey: string; cols: [string, string]; kind: PanelKind };

const PANELS: Panel[] = [
  { route: "timeline",  titleKey: "panelTimeline",  noteKey: "timelineNote",  cols: ["day", "views"],     kind: "timeline" },
  { route: "pages",     titleKey: "panelPages",     noteKey: "pagesNote",     cols: ["path", "views"],    kind: "pages" },
  { route: "clients",   titleKey: "panelClients",   noteKey: "clientsNote",   cols: ["client", "views"],  kind: "ranked" },
  { route: "devices",   titleKey: "panelDevices",   noteKey: "devicesNote",   cols: ["device", "views"],  kind: "devices" },
  { route: "referrers", titleKey: "panelReferrers", noteKey: "referrerNote",  cols: ["host", "views"],    kind: "referrers" },
  { route: "sources",   titleKey: "panelSources",   noteKey: "sourceNote",    cols: ["source", "views"],  kind: "ranked" },
  { route: "countries", titleKey: "panelCountries", noteKey: "countriesNote", cols: ["country", "views"], kind: "countries" },
  // ---- Derived panels (2026-09-06). Each reads a route that another panel
  //      may also read; the fetch is per route, not per panel. ----------
  { route: "crawlers",  titleKey: "panelAiShare",  noteKey: "aiShareNote",  cols: ["day", "views"],     kind: "aishare" },
  { route: "paths",     titleKey: "panelSections", noteKey: "sectionsNote", cols: ["section", "views"], kind: "sections" },
  { route: "paths",     titleKey: "panelTail",     noteKey: "tailNote",     cols: ["path", "views"],    kind: "tail" },
  { route: "paths",     titleKey: "panelCoverage", noteKey: "coverageNote", cols: ["measure", "views"], kind: "coverage" },
  { route: "hourly",    titleKey: "panelHour",     noteKey: "hourNote",     cols: ["hour", "views"],    kind: "hourofday" },
  { route: "hourly",    titleKey: "panelWeekday",  noteKey: "weekdayNote",  cols: ["weekday", "views"], kind: "weekday" },
  { route: "locales",   titleKey: "panelLocales",   noteKey: "localesNote",   cols: ["locale", "views"],  kind: "locales" },
];

const WINDOWS = ["24h", "7d", "30d", "90d"];

/** Locale prefix of a served path: "/pt-BR/learn/x/" -> "pt-BR". */
function localeOf(path: string): string {
  const m = /^\/([A-Za-z]{2}(?:-[A-Za-z]{2,4})?)(?:\/|$)/.exec(path);
  return m ? m[1] : "";
}

/** Group rank for the pages panel: en first, then pt, then everything else. */
function localeRank(loc: string): [number, string] {
  const l = loc.toLowerCase();
  if (l === "en" || l.startsWith("en-")) return [0, l];
  if (l === "pt" || l.startsWith("pt-")) return [1, l];
  return [2, l];
}

/** Source family of a referrer row -> group key for the referrers panel. */
function familyOf(source: string): "search" | "ai" | "social" | "other" {
  if (source.startsWith("search:")) return "search";
  if (source.startsWith("ai:")) return "ai";
  if (source.startsWith("social:")) return "social";
  return "other";
}

export default function StatsPanels({
  strings,
  localeNames,
  countryNames,
}: {
  strings: Record<string, string>;
  /** code -> native name, resolved server-side from LIVE_LOCALES. */
  localeNames: Record<string, string>;
  /** ISO code -> country name, for the countries panel. */
  countryNames: Record<string, string>;
}) {
  const [win, setWin] = useState("30d");
  const [data, setData] = useState<Record<string, Row[] | null>>({});
  const [state, setState] = useState<"loading" | "ok" | "unconfigured" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const routes = [...new Set(PANELS.map((p) => p.route))];
    Promise.all(
      routes.map((route) =>
        fetch(`/api/stats/${route}?window=${win}`)
          .then(async (r) => ({ route, status: r.status, body: await r.json() }))
          .catch(() => ({ route, status: 0, body: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      if (results.some((r) => r.status === 503)) return setState("unconfigured");
      if (results.every((r) => r.status !== 200)) return setState("error");
      const next: Record<string, Row[] | null> = {};
      for (const r of results) {
        next[r.route] = r.status === 200 && r.body && Array.isArray(r.body.rows) ? r.body.rows : null;
      }
      setData(next);
      setState("ok");
    });
    return () => { cancelled = true; };
  }, [win]);

  /** Rows grouped for display, per panel kind. Each group: [label|null, rows]. */
  const key = (p: Panel) => `${p.route}:${p.kind}`;
  const grouped = useMemo(() => {
    const out: Record<string, Array<[string | null, Row[]]>> = {};
    for (const p of PANELS) {
      const rows = data[p.route] ?? [];
      if (p.kind === "pages") {
        const buckets = new Map<string, Row[]>();
        for (const r of rows) {
          const loc = localeOf(String(r.path ?? ""));
          if (!buckets.has(loc)) buckets.set(loc, []);
          buckets.get(loc)!.push(r);
        }
        const keys = [...buckets.keys()].sort((a, b) => {
          const [ra, la] = localeRank(a); const [rb, lb] = localeRank(b);
          return ra - rb || la.localeCompare(lb);
        });
        out[key(p)] = keys.map((k) => [
          k ? `${k} — ${localeNames[k] ?? k}` : strings.groupOther,
          buckets.get(k)!.sort((a, b) => Number(b.views) - Number(a.views)).slice(0, 15),
        ]);
      } else if (p.kind === "referrers") {
        const order: Array<["search" | "ai" | "social" | "other", string]> = [
          ["search", strings.groupSearch], ["ai", strings.groupAi],
          ["social", strings.groupSocial], ["other", strings.groupOtherSites],
        ];
        const buckets = new Map<string, Row[]>();
        for (const r of rows) {
          const f = familyOf(String(r.source ?? ""));
          if (!buckets.has(f)) buckets.set(f, []);
          buckets.get(f)!.push(r);
        }
        out[key(p)] = order
          .filter(([k]) => buckets.has(k))
          .map(([k, label]) => [label, buckets.get(k)!.sort((a, b) => Number(b.views) - Number(a.views))]);
      } else if (p.kind === "aishare") {
        // per day: AI-crawler share of all automation
        const byDay = new Map<string, { ai: number; all: number }>();
        for (const r of rows) {
          const d = String(r.day ?? "").slice(0, 10); const v = Number(r.views ?? 0);
          const e = byDay.get(d) ?? { ai: 0, all: 0 };
          e.all += v; if (String(r.client ?? "").startsWith("ai:")) e.ai += v;
          byDay.set(d, e);
        }
        out[key(p)] = [[null, [...byDay.entries()].sort().map(([d, e]) => ({
          day: d, views: e.all === 0 ? 0 : Math.round((e.ai / e.all) * 100), raw: e.ai, all: e.all,
        }))]];
      } else if (p.kind === "sections") {
        const bySec = new Map<string, number>();
        for (const r of rows) {
          const path = String(r.path ?? ""); const loc = localeOf(path);
          const rest = loc ? path.slice(loc.length + 1) : path;
          const seg = rest.split("/").filter(Boolean)[0] ?? "";
          const sec = seg ? `/${seg}` : "/";
          bySec.set(sec, (bySec.get(sec) ?? 0) + Number(r.views ?? 0));
        }
        const all = [...bySec.values()].reduce((a, b) => a + b, 0);
        out[key(p)] = [[null, [...bySec.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([sec, v]) => ({
          section: sec, views: all ? Math.round((v / all) * 100) : 0, raw: v,
        }))]];
      } else if (p.kind === "tail") {
        // pages read exactly once, twice, three times - and the least-read 25
        const c = { 1: 0, 2: 0, 3: 0 } as Record<number, number>;
        for (const r of rows) { const v = Number(r.views ?? 0); if (v >= 1 && v <= 3) c[v] += 1; }
        const least = [...rows].sort((a, b) => Number(a.views) - Number(b.views)).slice(0, 25);
        out[key(p)] = [
          [strings.tailCounts, [1, 2, 3].map((n) => ({ path: strings[`tail_${n}`] ?? String(n), views: c[n] }))],
          [strings.tailLeast, least],
        ];
      } else if (p.kind === "coverage") {
        const distinct = rows.length; const total = rows.reduce((a, r) => a + Number(r.views ?? 0), 0);
        const byLoc = new Map<string, number>();
        for (const r of rows) { const l = localeOf(String(r.path ?? "")) || "?"; byLoc.set(l, (byLoc.get(l) ?? 0) + 1); }
        out[key(p)] = [[null, [
          { measure: strings.coverageDistinct, views: distinct },
          { measure: strings.coverageRequests, views: total },
          ...[...byLoc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l, n]) => ({
            measure: `${strings.coveragePer} ${l} — ${localeNames[l] ?? l}`, views: n,
          })),
        ]]];
      } else if (p.kind === "hourofday" || p.kind === "weekday") {
        const acc = new Map<number, number>();
        for (const r of rows) {
          const d = new Date(String(r.hour ?? "")); if (isNaN(d.getTime())) continue;
          const k = p.kind === "hourofday" ? d.getUTCHours() : d.getUTCDay();
          acc.set(k, (acc.get(k) ?? 0) + Number(r.views ?? 0));
        }
        const keys = p.kind === "hourofday" ? [...Array(24).keys()] : [1, 2, 3, 4, 5, 6, 0];
        const labels = p.kind === "hourofday"
          ? (k: number) => `${String(k).padStart(2, "0")}:00 UTC`
          : (k: number) => strings[`wd_${k}`] ?? String(k);
        out[key(p)] = [[null, keys.map((k) => ({ [p.cols[0]]: labels(k), views: acc.get(k) ?? 0 }))]];
      } else if (p.kind === "timeline") {
        out[key(p)] = [[null, rows]];
      } else {
        out[key(p)] = [[null, rows.slice(0, 25)]];
      }
    }
    return out;
  }, [data, localeNames, strings]);

  const total = (rows: Row[]) => rows.reduce((a, r) => a + Number(r.views ?? 0), 0);

  const renderKey = (p: Panel, row: Row) => {
    const raw = String(row[p.cols[0]] ?? "-");
    if (p.kind === "timeline") return raw.slice(0, 10);
    if (p.kind === "countries") {
      const code = raw.toUpperCase();
      return (
        <span className="stats-country">
          <CountryFlag code={code} />
          <span className="stats-country-code">{code}</span>
          {countryNames[code] ? <span className="stats-country-name">{countryNames[code]}</span> : null}
        </span>
      );
    }
    if (p.kind === "locales") return `${raw} — ${localeNames[raw] ?? raw}`;
    if (p.kind === "devices") return strings[`device_${raw}`] ?? raw;
    return raw;
  };

  return (
    <div className="stats-wrap">
      <div className="stats-controls" role="group" aria-label={strings.windowLabel}>
        {WINDOWS.map((w) => (
          <button key={w} type="button" className={`stats-window${w === win ? " stats-window--on" : ""}`}
            aria-pressed={w === win} onClick={() => setWin(w)}>
            {strings[`window_${w}`] ?? w}
          </button>
        ))}
      </div>

      {state === "loading" && <p className="stats-state">{strings.loading}</p>}
      {state === "unconfigured" && <p className="stats-state">{strings.unconfigured}</p>}
      {state === "error" && <p className="stats-state">{strings.error}</p>}

      {state === "ok" && (
        <div className="stats-grid">
          {PANELS.map((p) => {
            const groups = grouped[key(p)] ?? [];
            const all = groups.flatMap(([, r]) => r);
            const grand = p.kind === "devices" ? total(all) : 0;
            return (
              <section key={key(p)} className={`stats-panel${p.kind === "timeline" ? " stats-panel--wide" : ""}`}>
                <h3 className="stats-panel-title">{strings[p.titleKey]}</h3>
                <p className="stats-panel-note">{strings[p.noteKey]}</p>
                {all.length === 0 ? (
                  <p className="stats-empty">{strings.noData}</p>
                ) : (
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>{strings[`col_${p.cols[0]}`] ?? p.cols[0]}</th>
                        <th className="stats-num">{strings.col_views}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map(([label, rows], gi) => {
                        const top = Math.max(1, ...rows.map((r) => Number(r.views ?? 0)));
                        return [
                          label ? (
                            <tr key={`g${gi}`} className="stats-group-row">
                              <td colSpan={2} className="stats-group-label">{label}</td>
                            </tr>
                          ) : null,
                          ...rows.map((row, i) => {
                            const n = Number(row.views ?? 0);
                            return (
                              <tr key={`${gi}-${i}`}>
                                <td className="stats-key">
                                  {renderKey(p, row)}
                                  <span className="stats-bar" aria-hidden="true"
                                    style={{ width: `${Math.round((n / top) * 100)}%` }} />
                                </td>
                                <td className="stats-num">
                                  {p.kind === "devices" && grand > 0
                                    ? `${Math.round((n / grand) * 100)}% · ${n.toLocaleString()}`
                                    : p.kind === "aishare"
                                    ? `${n}% · ${Number(row.raw ?? 0).toLocaleString()} / ${Number(row.all ?? 0).toLocaleString()}`
                                    : p.kind === "sections"
                                    ? `${n}% · ${Number(row.raw ?? 0).toLocaleString()}`
                                    : n.toLocaleString()}
                                </td>
                              </tr>
                            );
                          }),
                        ];
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="stats-sampled">{strings.sampledNote}</p>
    </div>
  );
}
