"use client";

// ============================================================================
// src/components/dev/fun/BossScreensViewer.tsx
// ----------------------------------------------------------------------------
// THE BOSS-SCREENS VIEWER (client island for /dev/fun/boss-screens).
//
// Browse every boss-key screen, GROUPED BY FAMILY. A jump navigator on top (the
// same category-nav pattern the Tools and Learn indexes use) links to one
// section per group; each section is a grid of cards showing the screen's NAME,
// era, a short BLURB, and a live THUMBNAIL (a real, scaled-down render of the
// screen via BossScreenThumb — faithful, not a static image). Selecting a card
// opens that screen FULLSCREEN using the same BossApp overlay the boss key uses,
// so the preview and the real thing are identical; inside, the LEFT/RIGHT arrows
// browse the whole set alphabetically and Esc/any-key/click returns to the grid.
//
// The group ORDER (BOSS_GROUPS) and the per-screen group tag live in the shared
// boss-screen metadata. Names, blurbs, and group labels arrive already localized
// from the server page (keyed by id / group id), so this component carries no
// English strings of its own.
// ============================================================================

import { useState } from "react";
import BossApp, { BossScreenThumb } from "@/components/dev/fun/BossApp";
import {
  BOSS_SCREEN_META,
  BOSS_GROUPS,
  type BossScreenKind,
  type BossScreenGroup,
} from "@/components/dev/fun/boss-screens";

export interface BossViewerLabels {
  /** Localized screen name per screen id. */
  names: Record<string, string>;
  /** Localized screen blurb per screen id. */
  blurbs: Record<string, string>;
  /** Localized group label per group id. */
  groupLabels: Record<string, string>;
  /** "Jump to" label for the group navigator. */
  jumpTo: string;
  /** Boss overlay "press any key" hint. */
  bossHint: string;
  /** Boss overlay dismiss aria-label. */
  bossDismiss: string;
  /** aria-label prefix for a thumbnail button, e.g. "Open {name}". */
  openLabel: string;
}

// DOM id for a group's section (and the nav anchor that targets it). Prefixed
// so it can never collide with the tool/category ids used elsewhere on the site.
const sectionId = (group: BossScreenGroup) => `boss-${group}`;

export default function BossScreensViewer({ labels }: { labels: BossViewerLabels }) {
  const [active, setActive] = useState<BossScreenKind | null>(null);

  // Only render groups that actually have screens (defensive: an empty group
  // would otherwise print a heading with no cards under it).
  const groups = BOSS_GROUPS.filter((group) =>
    BOSS_SCREEN_META.some((meta) => meta.group === group),
  );

  return (
    <>
      {/* Group jump-nav — same pattern as the Tools and Learn indexes. */}
      {groups.length > 1 && (
        <nav className="category-nav boss-viewer-jumpnav" aria-label={labels.jumpTo}>
          <span className="category-nav-label">{labels.jumpTo}</span>
          <ul className="category-nav-list">
            {groups.map((group) => (
              <li key={group} data-jumpnav={group}>
                <a href={`#${sectionId(group)}`} className="category-nav-link">
                  {labels.groupLabels[group] ?? group}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* One section per group, in curated BOSS_GROUPS order. */}
      {groups.map((group) => (
        <section
          className="category-section boss-viewer-section"
          id={sectionId(group)}
          key={group}
        >
          <h2 className="boss-viewer-group-title">{labels.groupLabels[group] ?? group}</h2>
          <div className="boss-viewer-grid">
            {BOSS_SCREEN_META.filter((meta) => meta.group === group).map((meta) => (
              <button
                key={meta.kind}
                type="button"
                className="boss-viewer-card"
                onClick={() => setActive(meta.kind)}
                aria-label={`${labels.openLabel} ${labels.names[meta.kind] ?? meta.name}`}
              >
                <span className="boss-viewer-thumb" aria-hidden="true">
                  <BossScreenThumb kind={meta.kind} />
                </span>
                <span className="boss-viewer-meta">
                  <span className="boss-viewer-name">
                    {labels.names[meta.kind] ?? meta.name}
                    <span className="boss-viewer-year mono"> · {meta.year}</span>
                  </span>
                  <span className="boss-viewer-blurb">
                    {labels.blurbs[meta.kind] ?? meta.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {active && (
        <BossApp
          kind={active}
          onDismiss={() => setActive(null)}
          onNavigate={(k) => setActive(k)}
          hint={labels.bossHint}
          dismissLabel={labels.bossDismiss}
        />
      )}
    </>
  );
}
