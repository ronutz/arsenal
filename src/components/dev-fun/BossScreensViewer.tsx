"use client";

// ============================================================================
// src/components/dev-fun/BossScreensViewer.tsx
// ----------------------------------------------------------------------------
// THE BOSS-SCREENS VIEWER (client island for /dev/fun/boss-screens).
//
// Browse every boss-key screen: a grid of cards, each with the screen's NAME,
// era, a short BLURB, and a live THUMBNAIL (a real, scaled-down render of the
// screen via BossScreenThumb — faithful, not a static image). Selecting a card
// opens that screen FULLSCREEN using the same BossApp overlay the boss key uses,
// so the preview and the real thing are identical; inside, the LEFT/RIGHT arrows
// browse the whole set alphabetically and Esc/any-key/click returns to the grid.
//
// Names and blurbs are provided already localized by the server page (keyed by
// screen id), so this component carries no English strings of its own.
// ============================================================================

import { useState } from "react";
import BossApp, { BossScreenThumb } from "@/components/dev-fun/BossApp";
import { BOSS_SCREEN_META, type BossScreenKind } from "@/components/dev-fun/boss-screens";

export interface BossViewerLabels {
  /** Localized screen name per screen id. */
  names: Record<string, string>;
  /** Localized screen blurb per screen id. */
  blurbs: Record<string, string>;
  /** Boss overlay "press any key" hint. */
  bossHint: string;
  /** Boss overlay dismiss aria-label. */
  bossDismiss: string;
  /** aria-label prefix for a thumbnail button, e.g. "Open {name}". */
  openLabel: string;
}

export default function BossScreensViewer({ labels }: { labels: BossViewerLabels }) {
  const [active, setActive] = useState<BossScreenKind | null>(null);

  return (
    <>
      <div className="boss-viewer-grid">
        {BOSS_SCREEN_META.map((meta) => (
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
              <span className="boss-viewer-blurb">{labels.blurbs[meta.kind] ?? meta.blurb}</span>
            </span>
          </button>
        ))}
      </div>
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
