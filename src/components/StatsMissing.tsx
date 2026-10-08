"use client";

/**
 * src/components/StatsMissing.tsx
 *
 * THE "REQUESTS FOR PAGES THAT DO NOT EXIST" PANEL (/stats, 2026-10-07).
 * PRIME, 21:06: "Can you categorize them, show the url and besides or below
 * explain what attack that is a scan for? They don't even belong in the
 * category they're being shown in now as they are NOT pages served to people".
 *
 * Reads /api/stats/missing (worker/stats.ts): every request that was answered
 * with a 404, from people and automation alike, grouped by what it was looking
 * for (worker/probes.ts), with the most-requested few addresses of each group.
 * Each group shows its explanation beside its addresses (above them on a
 * phone) and the sources the explanation rests on
 * (src/content/stats/probe-sources.ts).
 *
 * The addresses are TEXT, never links: they are what strangers asked for, and
 * a link would send a reader, or a crawler, to them.
 *
 * It fetches on its own, so a failure here never blanks the panels above, and
 * it shows nothing until those panels are ready, so it never appears first and
 * then jumps down the page. Its messages arrive through a MessageSlice of
 * stats_page.missing on the page, so its counts take real ICU plurals
 * ("1 request", "2 requests").
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PROBE_FAMILY_IDS, PROBE_SOURCES, type ProbeSource } from "@/content/stats/probe-sources";

/** A family id as the page knows them (the Worker's list, src/content/stats/probe-sources.ts). */
type FamilyId = (typeof PROBE_FAMILY_IDS)[number];

/** One group in the route's answer: its requests, its distinct addresses, and the most-requested few. */
type Family = { id: string; views: number; addresses: number; paths: Array<{ path: string; views: number }> };

/** The route's answer, the fields this panel reads. */
type Missing = { total: number; addresses: number; families: Family[] };

/** A response id as a family the page can explain; an unknown one reads as an honest miss (the Worker and the
 *  page deploy together, so this is a guard, not a path anyone should take). */
function familyOf(id: string): FamilyId {
  // A known id is itself.
  if ((PROBE_FAMILY_IDS as readonly string[]).includes(id)) return id as FamilyId;
  // Anything else is explained as a miss rather than left without a title.
  return "misses";
}

/** An ISO date the way the panel's own prose writes dates: "7 October 2026" in English (the house writes British
 *  English), "7 de outubro de 2026" in Portuguese. Fixed to UTC so the day never shifts with the reader's zone. */
function readDate(iso: string, locale: string): string {
  // British English for "en"; every other locale formats in its own convention.
  const fmtLocale = locale === "en" ? "en-GB" : locale;
  // Midnight UTC of the day read, formatted in UTC.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(fmtLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** A family's sources grouped by the day they were read, so one date heads them all when they share it. */
function byReadDate(sources: readonly ProbeSource[]): Array<[string, ProbeSource[]]> {
  // Insertion order is the file's order, so the groups keep it.
  const groups = new Map<string, ProbeSource[]>();
  for (const s of sources) {
    // Start the day's list on first sight, then append.
    if (!groups.has(s.read)) groups.set(s.read, []);
    groups.get(s.read)!.push(s);
  }
  // As [date, sources] pairs for rendering.
  return [...groups.entries()];
}

export default function StatsMissing({
  win,
  ready,
  locale,
  labels,
}: {
  /** The window the panels above show ("24h", "7d", "30d", "90d"); this panel follows it. */
  win: string;
  /** Whether the panels above have loaded; until they have, this panel renders nothing. */
  ready: boolean;
  /** The page's locale, for numbers and the sources' dates. */
  locale: string;
  /** Labels the page already resolved for the other panels: the requests column and the empty window. */
  labels: { requests: string; noData: string };
}) {
  // The panel's messages: stats_page.missing, through the page's MessageSlice.
  const t = useTranslations("stats_page.missing");
  // Where the fetch stands: loading, loaded, not configured on this deployment (503), or failed.
  const [state, setState] = useState<"loading" | "ok" | "absent" | "error">("loading");
  // The route's answer, once loaded.
  const [data, setData] = useState<Missing | null>(null);

  // Fetch the window's groups whenever the window changes.
  useEffect(() => {
    // Set when the window changes again or the panel unmounts, so a late answer is dropped.
    let cancelled = false;
    // A new window starts from loading.
    setState("loading");
    fetch(`/api/stats/missing?window=${win}`)
      // The body is read only on a 200; any other status has nothing this panel can show.
      .then(async (r) => ({ status: r.status, body: r.status === 200 ? ((await r.json()) as Missing) : null }))
      .then(({ status, body }) => {
        // A superseded request changes nothing.
        if (cancelled) return;
        // 503: statistics are not configured here; the panels above already say so, so this one stays silent.
        if (status === 503) {
          setState("absent");
          return;
        }
        // Anything but a well-formed answer is a failure of this panel alone.
        if (!body || !Array.isArray(body.families)) {
          setState("error");
          return;
        }
        // Loaded.
        setData(body);
        setState("ok");
      })
      // A network failure is a failure of this panel alone.
      .catch(() => {
        if (!cancelled) setState("error");
      });
    // Drop the answer if the window changes before it arrives.
    return () => {
      cancelled = true;
    };
  }, [win]);

  // Nothing until the panels above are ready, and nothing while loading or where statistics are not configured.
  if (!ready || state === "loading" || state === "absent") return null;

  // A failed load: the title and one line saying so, never a wrong number.
  if (state === "error" || !data) {
    return (
      <section className="stats-panel stats-missing" aria-labelledby="stats-missing-title">
        <h3 id="stats-missing-title" className="stats-panel-title">{t("title")}</h3>
        <p className="stats-state">{t("error")}</p>
      </section>
    );
  }

  return (
    <section className="stats-panel stats-missing" aria-labelledby="stats-missing-title">
      {/* The panel's title, what it counts, and the window's totals over every address, listed or not. */}
      <h3 id="stats-missing-title" className="stats-panel-title">{t("title")}</h3>
      <p className="stats-panel-note">{t("note")}</p>
      <p className="stats-panel-total">{t("count", { requests: data.total, addresses: data.addresses })}</p>

      {data.families.length === 0 ? (
        // An empty window says so, like the other panels.
        <p className="stats-empty">{labels.noData}</p>
      ) : (
        <div className="stats-probes">
          {data.families.map((f) => {
            // The family the page explains this group as.
            const id = familyOf(f.id);
            // Its sources, one line per day read (an empty list where the explanation is the site's own reading).
            const sources = byReadDate(PROBE_SOURCES[id]);
            return (
              // One group: an anchor others can link to, the explanation, then its addresses.
              <article key={f.id} id={`probe-${f.id}`} className="stats-probe">
                <div className="stats-probe-text">
                  {/* What the group was looking for, how much of it there was, and why it matters. */}
                  <h4 className="stats-probe-title">{t(`families.${id}.title`)}</h4>
                  <p className="stats-probe-count">{t("count", { requests: f.views, addresses: f.addresses })}</p>
                  <p className="stats-probe-what">{t(`families.${id}.what`)}</p>
                  {sources.map(([date, list]) => (
                    // The sources the explanation rests on: the documents are links, the addresses never are.
                    <p key={date} className="stats-probe-sources">
                      {t("sourcesRead", { date: readDate(date, locale) })}{" "}
                      {list.map((s, i) => (
                        <span key={s.url}>
                          {/* A semicolon between sources, none before the first. */}
                          {i > 0 ? "; " : ""}
                          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
                <table className="stats-table stats-probe-table">
                  <thead>
                    <tr>
                      {/* The address as recorded, and how many times it was requested. */}
                      <th>{t("colAddress")}</th>
                      <th className="stats-num">{labels.requests}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f.paths.map((p, i) => (
                      // Keyed by position: two long addresses cut to the same text must not share a key.
                      <tr key={i}>
                        {/* Text in a code element, never a link (see the header). */}
                        <td className="stats-key"><code className="stats-probe-path">{p.path}</code></td>
                        <td className="stats-num">{p.views.toLocaleString(locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      )}

      {/* Why a few old requests may still sit in the panels above: the rows from before the status was recorded. */}
      <p className="stats-missing-legacy">{t("legacy")}</p>
    </section>
  );
}
