"use client";

// ============================================================================
// src/components/HomePopular.tsx
// ----------------------------------------------------------------------------
// MOST READ THIS WEEK (2026-10-05, home page review item 17; PRIME: "Ok,
// good"). The site's own stats record what was read and never who read it
// (worker/analytics.ts, /stats), so a popularity list is the one kind of
// "recommendation" a privacy-first site can make without a profile: aggregate
// usefulness, same for every reader, no cookie, no account.
//
// Two lazy reads after the page is up: /api/stats/pages?window=7d (the Worker,
// same origin; paths and view counts for human readers; 100 rows) and
// /home-index.json (generated at prebuild: path to title for tools, articles,
// companies, people, lore terms and guides), joined here. Index pages (/tools/,
// /learn/, the home page itself) are skipped: the point is what people READ,
// not where they browsed. One item per kind first, so the list is varied
// (a tool, an article, a company...), then the remainder by views, five in
// all. When the stats are unconfigured, unreachable or empty, the whole block
// renders nothing: a front door should not show an error about itself.
// ============================================================================

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** One index entry, as gen-home-index writes it. */
interface Entry { k: string; p: string; t: { en: string; "pt-BR"?: string } }
/** One row the stats API returns. */
interface StatRow { path: string; views: number | string }
/** One list item after the join. */
interface Pick { kind: string; path: string; title: string; views: number }

/** The locale prefix a stats path carries, so "/en/tools/cidr/" matches the index's "/tools/cidr/". */
function stripLocale(path: string): string {
  return path.replace(/^\/[a-z]{2}(?:-[A-Za-z]{2,4})?(?=\/)/, "");
}

export default function HomePopular({ kinds, title, className }: {
  /** Learn P1 (L33, 2026-10-05): keep only these kinds of the index ("article", "guide", ...); absent means every kind. */
  kinds?: readonly string[];
  /** A heading in place of "Most read this week" (the hub's own words); absent keeps the home's. */
  title?: string;
  /** Extra classes on the column (the Learn hub lays it out as a row of its own). */
  className?: string;
}) {
  const t = useTranslations("home.front");
  const locale = useLocale();
  // The picks, or null until both reads are in; an empty list means "show nothing".
  const [picks, setPicks] = useState<Pick[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/stats/pages?window=7d").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/home-index.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([stats, index]) => {
      if (cancelled) return;
      const rows: StatRow[] = stats && Array.isArray(stats.rows) ? stats.rows : [];
      const entries: Entry[] = index && Array.isArray(index.entries) ? index.entries : [];
      if (!rows.length || !entries.length) return setPicks([]);
      // Title lookup by locale-free path.
      const byPath = new Map(entries.map((e) => [e.p, e]));
      const joined: Pick[] = [];
      for (const r of rows) {
        const e = byPath.get(stripLocale(String(r.path)));
        if (!e) continue;
        // A scoped list (the Learn hub asks for articles) drops the other kinds before ranking.
        if (kinds && !kinds.includes(e.k)) continue;
        joined.push({ kind: e.k, path: e.p, title: (locale === "pt-BR" && e.t["pt-BR"]) || e.t.en, views: Number(r.views) || 0 });
      }
      // Variety first: the top item of each kind in view order, then the rest by views, five in all.
      joined.sort((a, b) => b.views - a.views);
      const seenKinds = new Set<string>();
      const varied: Pick[] = [];
      for (const p of joined) if (!seenKinds.has(p.kind)) { seenKinds.add(p.kind); varied.push(p); }
      const rest = joined.filter((p) => !varied.includes(p));
      setPicks([...varied, ...rest].slice(0, 5));
    });
    return () => { cancelled = true; };
  }, [locale, kinds]);

  // Nothing yet, or nothing to say: no column at all. The heading lives here so it never stands over an empty list.
  if (!picks || picks.length === 0) return null;

  return (
    <div className={`happening-col happening-col--popular${className ? ` ${className}` : ""}`}>
      <h3 className="happening-title">{title ?? t("popularTitle")}</h3>
      <ol className="happening-list">
        {picks.map((p) => (
          <li key={p.path} className="happening-item">
            <span className={`happening-kind happening-kind--${p.kind}`}>{t(`kind.${p.kind}`)}</span>
            <Link href={p.path} className="happening-link">{p.title}</Link>
          </li>
        ))}
      </ol>
      <p className="happening-note">{t("popularNote")} <Link href="/stats">{t("popularStats")}</Link></p>
    </div>
  );
}
