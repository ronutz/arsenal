"use client";

/**
 * src/components/ItemViews.tsx
 *
 * The count for one page, shown on that page.
 *
 * WHY IT IS ALLOWED TO SAY NOTHING
 * --------------------------------
 * This renders nothing at all until it has a number, and renders nothing ever
 * if the endpoint is unconfigured, errors, or reports zero. A counter that
 * announces "0 views" on a page somebody is currently reading is both wrong
 * and faintly sad, and a counter that shows a spinner draws the eye to the
 * least important thing on the page. Silence is the correct default for a
 * decoration that depends on a network call.
 *
 * WHAT IT SENDS: the pathname of the page it is on, and nothing else. It is a
 * read. It does not report the visit - that already happened at the server,
 * before this page was delivered, which is the whole point of counting there
 * rather than here.
 *
 * WHY IT LOCATES ITSELF
 * ---------------------
 * It is mounted once, in the site footer, so that EVERY page carries a counter
 * without eighty-seven routes each having to remember to add one. Wiring it
 * per page guarantees the set drifts: a route added next year gets no counter
 * and nobody notices, because a missing counter looks exactly like a page
 * nobody has read. Reading the path from the router removes that whole class
 * of omission.
 */

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

export default function ItemViews({
  path,
  label,
  locale,
}: {
  /** Optional override. Omitted, the component uses its own route. */
  path?: string;
  /** Pre-resolved label carrying a {n} placeholder. */
  label: string;
  /** Needed because the router path is locale-stripped, and the datasets
   *  record the full served path including the locale segment. */
  locale?: string;
}) {
  const routerPath = usePathname();
  const [views, setViews] = useState<number | null>(null);
  const [series, setSeries] = useState<Array<{ day: string; views: number }>>([]);
  // Normalise to the shape the Worker recorded: leading locale, trailing slash.
  const target =
    path ??
    (locale
      ? `/${locale}${routerPath === "/" ? "/" : routerPath}`.replace(/\/*$/, "/")
      : routerPath);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats/item?path=${encodeURIComponent(target)}&window=90d`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body || typeof body.views !== "number") return;
        if (body.views > 0) {
          setViews(body.views);
          if (Array.isArray(body.series)) setSeries(body.series);
        }
      })
      .catch(() => {
        /* silence is the documented default */
      });
    return () => {
      cancelled = true;
    };
  }, [target]);

  if (views === null) return null;

  return (
    <p className="item-views" title={label.replace("{n}", String(views))}>
      {label.replace("{n}", views.toLocaleString())}
      {/* SPARKLINE (2026-09-06). Daily reads for the window, as a small inline
          SVG beside the count. It fills the gap between "read 41 times" and
          "read 41 times last Tuesday when it was shared". Decorative and
          aria-hidden: the number beside it already says what it says.
          Only drawn with at least three days of data, because two points
          make a line and one point makes a dot, and neither is a trend. */}
      {series.length >= 3 && <Sparkline data={series.map((d) => d.views)} />}
    </p>
  );
}

/** A tiny inline SVG line, semantic tokens only, hidden from assistive tech. */
function Sparkline({ data }: { data: number[] }) {
  const w = 96, h = 18, pad = 1;
  const max = Math.max(1, ...data);
  const step = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - (v / max) * (h - pad * 2)).toFixed(1)}`);
  return (
    <svg className="item-views-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <polyline points={pts.join(" ")} />
    </svg>
  );
}
