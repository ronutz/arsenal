"use client";

// ============================================================================
// src/components/SiteNav.tsx
// ----------------------------------------------------------------------------
// THE PRIMARY NAVIGATION, WITH A "YOU ARE HERE" (PRIME, 2026-10-04, adopting
// the independent review of the bar).
//
// What changed and why. Until today the six labels carried four colour tiers:
// cyan for the free material, Red Education's brand red for Training, amber
// for Advisory, grey for About. The review's diagnosis, which PRIME accepted:
// the bar was encoding free-versus-commercial, a partner's branding, section
// importance and the theme all at once, Training's partner red measured at
// 4.33:1 on the default canvas (below the 4.5:1 normal-text threshold, which is
// why it had been made bold), and the one thing a navigation bar is for, saying
// which section the reader is in, was missing: no aria-current, no active
// state. So the bar now says three things, in this order of importance:
//
//   1. WHERE YOU ARE. The link for the current section carries
//      aria-current="page", a heavier weight and a 2px rule in that section's
//      own accent: the theme accent for Tools, Learn and Industry, Red
//      Education's colour for Training, amber for Advisory, the neutral for
//      About. Colour is an accent on the current item, no longer the body
//      colour of every label, and it is never the only channel (weight and the
//      rule carry it too).
//   2. THE GROUPS. Knowledge (Tools, Learn, Industry), professional work
//      (Training, Advisory), the person (About): three groups, separated by a
//      hairline and a little space, so a reader decodes the architecture
//      without decoding colours.
//   3. THE SIX DESTINATIONS, all in the same calm, readable neutral at the same
//      weight, hover brightening the word and revealing its rule.
//
// This is a client component only because the current path is client state on
// a static export: the server cannot know which page a static HTML file will be
// served as. The labels are translated by the server Header and passed in, so
// no message namespace is loaded here. The match is by section prefix, so
// /tools/cidr lights Tools and /about/credentials lights About.
//
// Order, destinations and the "no hamburger, no dropdown, no CTA button, no
// icons" rules of 2026-08-06 are unchanged; the review endorsed every one.
// ============================================================================

import { Link, usePathname } from "@/i18n/navigation";

/** One destination in the bar. */
export interface SiteNavItem {
  /** Locale-agnostic href, e.g. "/tools". */
  href: string;
  /** The translated label. */
  label: string;
  /** The accent the item shows when hovered or current. */
  tone: "knowledge" | "training" | "advisory" | "about";
}

/** One group of destinations; groups are separated visually. */
export interface SiteNavGroup {
  /** A stable key for the group. */
  key: "knowledge" | "work" | "person";
  /** Its items, in order. */
  items: SiteNavItem[];
}

/** Props: the groups and the translated aria-label of the nav. */
export default function SiteNav({ groups, ariaLabel }: { groups: SiteNavGroup[]; ariaLabel: string }) {
  // The current path without its locale prefix ("/tools/cidr").
  const pathname = usePathname() ?? "";

  /** Is this item the section the reader is in? Exact match or a deeper path under it. */
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="site-nav" aria-label={ariaLabel}>
      {groups.map((g) => (
        <span key={g.key} className={`site-nav-group site-nav-group--${g.key}`}>
          {g.items.map((item) => {
            // aria-current marks the section for assistive technology; the CSS keys off the same attribute.
            const current = isCurrent(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav-link site-nav-link--${item.tone}`}
                aria-current={current ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </span>
      ))}
    </nav>
  );
}
