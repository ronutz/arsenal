"use client";
// ============================================================================
// src/components/SurpriseMe.tsx
// ----------------------------------------------------------------------------
// "SURPRISE ME WITH A COMPANY" (E16 of Round 1, SCOUT; adopted 2026-10-06).
//
// One button on the industry page that opens a random record. The list of
// slugs comes from the server page, which is the same list the timeline
// renders, so the button can never land on a page that does not exist; the
// choice is made in the browser at click time, so two clicks give two
// companies, which is the whole point. Nothing is stored and nothing is sent.
// Without JavaScript the button is a link to the timeline itself, which is the
// honest degradation: the reader still gets every company, in order.
// ============================================================================
export default function SurpriseMe({ slugs, locale, label, hint }: {
  /** Every slug the timeline renders. */
  slugs: readonly string[];
  /** The active locale, for the destination path. */
  locale: string;
  /** The button's text ("Surprise me with a company"). */
  label: string;
  /** The line under it ("One of 341, chosen when you click"). */
  hint: string;
}) {
  return (
    <a
      href="#timeline"
      className="industry-door industry-door--surprise"
      onClick={(e) => {
        // Pick at click time and go; the href above is only the no-script fallback.
        if (slugs.length === 0) return;
        e.preventDefault();
        const slug = slugs[Math.floor(Math.random() * slugs.length)];
        window.location.assign(`/${locale}/industry/${slug}/`);
      }}
    >
      <span className="industry-door-kicker">?</span>
      <span className="industry-door-name">{label}</span>
      <span className="industry-door-lede">{hint}</span>
    </a>
  );
}
