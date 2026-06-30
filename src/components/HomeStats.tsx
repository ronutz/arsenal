// ============================================================================
// src/components/HomeStats.tsx
// ----------------------------------------------------------------------------
// TOOLBOX TOTALS — a small "by the numbers" band shown on the home page, just
// below the hero. It displays two figures: how many tools are live and how many
// Learn articles exist.
//
// WHERE THE NUMBERS COME FROM (important): this component does NOT know the
// totals itself. They are computed on the server (in page.tsx) from the single
// sources of truth — live tools from the catalogue, articles from the EN Learn
// corpus — and handed in as props. That is canon rule D-63: the counters are
// derived at build time and never hand-written, so adding or removing a tool or
// an article updates them automatically on the next build. This component only
// presents those numbers and animates them.
//
// THE ANIMATION (count-up): when the band scrolls into view, each number counts
// up from zero to its real value with an ease-out curve. This is a progressive
// enhancement and is implemented carefully so it is safe in three ways:
//
//   1. No-JS / pre-render safe — the initial state shows the REAL totals (not
//      zero), so the statically exported HTML and any visitor without
//      JavaScript see the correct figures. The reset-to-zero happens only later,
//      inside an effect that runs in the browser.
//   2. Hydration safe — because the first client render also shows the real
//      totals (matching the server HTML), there is no hydration mismatch. Only
//      after hydration, when the element enters the viewport, do we drop to zero
//      and animate up.
//   3. Reduced-motion safe — if the visitor prefers reduced motion, we skip the
//      animation entirely and leave the real totals in place.
//
// ACCESSIBILITY: the animating digits are decorative (aria-hidden). A visually
// hidden span carries the true, final figure (e.g. "27 Tools") so assistive
// technology announces the real number regardless of the animation frame.
//
// This is a client component ("use client") because it uses browser-only APIs
// (IntersectionObserver, requestAnimationFrame, matchMedia). It is the only new
// client island on the home page; everything around it stays server-rendered.
// ============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface HomeStatsProps {
  /** Number of live tools — derived in page.tsx from the catalogue. */
  tools: number;
  /** Number of Learn articles — derived in page.tsx from the EN corpus. */
  articles: number;
}

export default function HomeStats({ tools, articles }: HomeStatsProps) {
  const t = useTranslations("home");

  // Ref to the band, so the IntersectionObserver can watch it.
  const ref = useRef<HTMLElement | null>(null);

  // Animation progress, 0..1. It STARTS at 1 on purpose: that way the very first
  // render (server-side export and the first client render) shows the full,
  // real totals — correct for no-JS visitors and free of hydration mismatch.
  const [progress, setProgress] = useState(1);

  // Guard so the count-up runs at most once, even if the band re-enters view.
  const hasRun = useRef(false);

  useEffect(() => {
    // Honour the visitor's motion preference. If they ask for reduced motion,
    // leave the real totals in place and never animate.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const el = ref.current;
    if (!el) return;

    // Drive the count-up with requestAnimationFrame and an ease-out cubic curve,
    // so it starts fast and gently settles on the final figure.
    const runCountUp = () => {
      const durationMs = 1100;
      const startedAt = performance.now();

      const step = (now: number) => {
        const linear = Math.min((now - startedAt) / durationMs, 1);
        const eased = 1 - Math.pow(1 - linear, 3); // ease-out cubic
        setProgress(eased);
        if (linear < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    // Only begin once the band is actually on screen — the count-up should be
    // something the visitor sees happen, not something already finished above
    // the fold by the time they scroll down.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasRun.current) {
            hasRun.current = true;
            setProgress(0); // drop to zero, then count up to the real totals
            runCountUp();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The figures shown this frame. round() keeps them whole as they climb.
  const shownTools = Math.round(progress * tools);
  const shownArticles = Math.round(progress * articles);

  return (
    <section
      ref={ref}
      className="stats-band"
      aria-label={t("stats.sectionLabel")}
    >
      <div className="container stats-band-inner">
        {/* Tools */}
        <div className="stat">
          {/* True value for assistive tech — announced regardless of animation. */}
          <span className="sr-only">
            {tools} {t("stats.tools")}
          </span>
          <span className="stat-value" aria-hidden="true">
            {shownTools}
          </span>
          <span className="stat-label" aria-hidden="true">
            {t("stats.tools")}
          </span>
        </div>

        {/* Visual divider between the two figures. */}
        <span className="stat-sep" aria-hidden="true" />

        {/* Articles */}
        <div className="stat">
          <span className="sr-only">
            {articles} {t("stats.articles")}
          </span>
          <span className="stat-value" aria-hidden="true">
            {shownArticles}
          </span>
          <span className="stat-label" aria-hidden="true">
            {t("stats.articles")}
          </span>
        </div>
      </div>
    </section>
  );
}
