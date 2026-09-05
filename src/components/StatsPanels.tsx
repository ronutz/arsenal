"use client";

/**
 * src/components/StatsPanels.tsx
 *
 * Client-side fetch of the site's own aggregate request counts.
 *
 * WHY CLIENT-SIDE: the site is a static export, so there is no server render
 * to fetch during. The numbers come from /api/stats/*, served by the same
 * Worker that counts the requests in the first place - so nothing third-party
 * is contacted, and no script here reports anything about the reader. This
 * component only READS.
 *
 * WHAT IT DELIBERATELY DOES NOT SHOW: full referring URLs. The endpoint
 * aggregates those to the host for public consumption, and this component
 * would have nothing to render even if it asked. See worker/stats.ts for why
 * that line is drawn there rather than here.
 */

import { useEffect, useState } from "react";

type Row = Record<string, string | number>;
type Panel = {
  route: string;
  titleKey: string;
  cols: [string, string];
  noteKey?: string;
};

const PANELS: Panel[] = [
  { route: "pages", titleKey: "panelPages", cols: ["path", "views"] },
  { route: "clients", titleKey: "panelClients", cols: ["client", "views"] },
  {
    route: "referrers",
    titleKey: "panelReferrers",
    cols: ["host", "views"],
    noteKey: "referrerNote",
  },
  { route: "countries", titleKey: "panelCountries", cols: ["country", "views"] },
  { route: "locales", titleKey: "panelLocales", cols: ["locale", "views"] },
];

const WINDOWS = ["24h", "7d", "30d", "90d"];

export default function StatsPanels({
  strings,
}: {
  /** Pre-resolved copy, passed from the server component so this stays a leaf
   *  client component without pulling the whole message pack into the bundle. */
  strings: Record<string, string>;
}) {
  const [win, setWin] = useState("30d");
  const [data, setData] = useState<Record<string, Row[] | null>>({});
  const [state, setState] = useState<"loading" | "ok" | "unconfigured" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    Promise.all(
      PANELS.map((p) =>
        fetch(`/api/stats/${p.route}?window=${win}`)
          .then(async (r) => ({ route: p.route, status: r.status, body: await r.json() }))
          .catch(() => ({ route: p.route, status: 0, body: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      // 503 from the endpoint means the deployment has no secrets bound, which
      // is a configuration state rather than a fault, and is reported as such.
      if (results.some((r) => r.status === 503)) {
        setState("unconfigured");
        return;
      }
      if (results.every((r) => r.status !== 200)) {
        setState("error");
        return;
      }
      const next: Record<string, Row[] | null> = {};
      for (const r of results) {
        next[r.route] =
          r.status === 200 && r.body && Array.isArray(r.body.rows) ? r.body.rows : null;
      }
      setData(next);
      setState("ok");
    });

    return () => {
      cancelled = true;
    };
  }, [win]);

  return (
    <div className="stats-wrap">
      <div className="stats-controls" role="group" aria-label={strings.windowLabel}>
        {WINDOWS.map((w) => (
          <button
            key={w}
            type="button"
            className={`stats-window${w === win ? " stats-window--on" : ""}`}
            aria-pressed={w === win}
            onClick={() => setWin(w)}
          >
            {strings[`window_${w}`] ?? w}
          </button>
        ))}
      </div>

      {state === "loading" && <p className="stats-state">{strings.loading}</p>}
      {state === "unconfigured" && (
        <p className="stats-state">{strings.unconfigured}</p>
      )}
      {state === "error" && <p className="stats-state">{strings.error}</p>}

      {state === "ok" && (
        <div className="stats-grid">
          {PANELS.map((p) => {
            const rows = data[p.route];
            return (
              <section key={p.route} className="stats-panel">
                <h3 className="stats-panel-title">{strings[p.titleKey]}</h3>
                {p.noteKey && <p className="stats-panel-note">{strings[p.noteKey]}</p>}
                {!rows || rows.length === 0 ? (
                  <p className="stats-empty">{strings.noData}</p>
                ) : (
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>{strings[`col_${p.cols[0]}`] ?? p.cols[0]}</th>
                        <th className="stats-num">
                          {strings.col_views ?? p.cols[1]}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Bars are scaled against the largest value in THIS
                        // panel, not across panels: a bar comparing page views
                        // to country counts would imply a relationship that
                        // does not exist. Each table is its own scale.
                        const top = Math.max(
                          1,
                          ...rows.slice(0, 25).map((r) => Number(r[p.cols[1]] ?? 0))
                        );
                        return rows.slice(0, 25).map((row, i) => {
                          const n = Number(row[p.cols[1]] ?? 0);
                          return (
                            <tr key={i}>
                              <td className="stats-key">
                                {String(row[p.cols[0]] ?? "-")}
                                {/* The bar is decoration over the number that
                                    is already stated, so it is hidden from
                                    assistive technology rather than read out
                                    as a meaningless element. */}
                                <span
                                  className="stats-bar"
                                  aria-hidden="true"
                                  style={{ width: `${Math.round((n / top) * 100)}%` }}
                                />
                              </td>
                              <td className="stats-num">{n.toLocaleString()}</td>
                            </tr>
                          );
                        });
                      })()}
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
