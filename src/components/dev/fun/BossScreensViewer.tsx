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
// THE THUMBNAILS SETTLE (review R4-11, 03/11/2026): every thumbnail is a live
// screen, and with some seventy of them the page ran about 340 animations at
// once. A few seconds after the page opens, once the typed lines and boot
// sequences have played, the grids are marked still and the thumbnails' CSS
// animations pause (components.css, .boss-viewer-grid.is-still). The full
// screen, opened from a card, keeps all of its motion.
//
// The group ORDER (BOSS_GROUPS) and the per-screen group tag live in the shared
// boss-screen metadata. Names, blurbs, and group labels arrive already localized
// from the server page (keyed by id / group id), so this component carries no
// English strings of its own.
//
// A SHARE LINE (PRIME 03/11/2026, "Yes on all your suggested ideas"): the
// screen last seen full screen offers its name and year to copy, with the
// page's address under it. The Copy button sits on that screen's card, over
// the top right of its thumbnail (at the end of the row in the list view), so
// the grid gains one control rather than one per screen, and nothing moves. Each card
// sits in a wrapper (boss-viewer-item) for that reason, since a button cannot
// hold another. When the screen was browsed to with the arrows, closing it
// brings that screen's card into view and focus, where its Copy button is;
// otherwise the overlay hands focus back to the card that opened it, as before.
// ============================================================================

// React state, the effects that still the thumbnails and place focus, and the cards' handles.
import { useEffect, useRef, useState } from "react";
import ViewToggle from "@/components/ViewToggle";
import BossApp, { BossScreenThumb } from "@/components/dev/fun/BossApp";
// The share card's text: the line, then the page's address with no query string.
import { shareText } from "@/lib/fun/share";
// The share line's Copy button, and the filler for its template.
import ToyShare, { fillTemplate, type ToyShareLabels } from "@/components/dev/fun/ToyShare";
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
  /** View toggle chrome (Cards/List density). */
  viewLegend: string;
  viewCards: string;
  viewList: string;
  /** The share line's template, raw: {name} and {year} are filled in the browser. */
  shareLine: string;
  /** The Copy button's words. */
  share: ToyShareLabels;
}

/** The page's path below /dev/fun, for the address in the share line. */
const SLUG = "boss-screens";

// DOM id for a group's section (and the nav anchor that targets it). Prefixed
// so it can never collide with the tool/category ids used elsewhere on the site.
const sectionId = (group: BossScreenGroup) => `boss-${group}`;

/** How long the thumbnails animate before they settle (ms): long enough for every typed line and boot count to land. */
const THUMBS_SETTLE_MS = 4000;

export default function BossScreensViewer({ labels, locale }: { labels: BossViewerLabels; locale: string }) {
  const [active, setActive] = useState<BossScreenKind | null>(null);
  // The screen last seen full screen: its card carries the Copy button.
  const [lastSeen, setLastSeen] = useState<BossScreenKind | null>(null);
  // The card that opened the overlay (focus goes back to it unless the arrows moved elsewhere).
  const openerRef = useRef<BossScreenKind | null>(null);
  // A card to bring into view and focus once the overlay has gone, or null.
  const [focusKind, setFocusKind] = useState<BossScreenKind | null>(null);
  // Every card's button, by screen, to place that focus.
  const cardRefs = useRef(new Map<BossScreenKind, HTMLButtonElement>());
  // Whether the thumbnails have settled (their animations paused), a few seconds after the page opens.
  const [still, setStill] = useState(false);
  // The timer that settles them.
  useEffect(() => {
    // Settle once the opening sequences have played.
    const id = window.setTimeout(() => setStill(true), THUMBS_SETTLE_MS);
    // Leaving the page early cancels it.
    return () => window.clearTimeout(id);
  }, []);

  // Once the overlay has gone (its own clean-up has handed focus back to the opener), a screen reached with the arrows
  // gets its card focused and brought into view, so its Copy button is where the reader is.
  useEffect(() => {
    // Nothing to place.
    if (!focusKind) return;
    // The card's button.
    const el = cardRefs.current.get(focusKind);
    // Done either way.
    setFocusKind(null);
    // Not on the page (should not happen): leave focus where the overlay put it.
    if (!el) return;
    // Focus without the browser's own jump, then a scroll that respects a wish for less motion.
    el.focus({ preventScroll: true });
    // A reader who asked for less motion gets a jump, not a glide.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The card in the middle of the screen.
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [focusKind]);

  /**
   * Open a screen full screen from its card.
   *
   * @param kind the screen
   */
  const open = (kind: BossScreenKind) => {
    // The card that opened it.
    openerRef.current = kind;
    // The overlay.
    setActive(kind);
  };

  /** The overlay was dismissed: the screen it showed becomes the one to share. */
  const dismiss = () => {
    // The screen on show when it closed (the arrows may have moved it on from the opener).
    const seen = active;
    // Its card offers the share line.
    setLastSeen(seen);
    // Browsed elsewhere: that card takes focus once the overlay is gone.
    if (seen && seen !== openerRef.current) setFocusKind(seen);
    // The overlay goes.
    setActive(null);
  };

  // Only render groups that actually have screens (defensive: an empty group
  // would otherwise print a heading with no cards under it).
  const groups = BOSS_GROUPS.filter((group) =>
    BOSS_SCREEN_META.some((meta) => meta.group === group),
  );

  return (
    <>
      {/* Jump-nav + the Cards/List density toggle, same utilities as the
          Tools and Learn indexes. The toggle sets data-view on <main>. */}
      <div className="boss-viewer-controls">
        {/* Collapsed by default (QF-2): native <details>, no JS. */}
        {groups.length > 1 && (
          <details className="jumpnav boss-viewer-jumpnav">
            <summary className="jumpnav-summary" aria-label={labels.jumpTo}>
              <span className="jumpnav-chevron" aria-hidden="true">
                &#9656;
              </span>
              {labels.jumpTo}
            </summary>
            <ul className="category-nav-list">
              {groups.map((group) => (
                <li key={group} data-jumpnav={group}>
                  <a href={`#${sectionId(group)}`} className="category-nav-link">
                    {labels.groupLabels[group] ?? group}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
        <ViewToggle
          targetId="main"
          storageKey="ronutz:view:boss-screens"
          legend={labels.viewLegend}
          cardsLabel={labels.viewCards}
          listLabel={labels.viewList}
        />
      </div>

      {/* One section per group, in curated BOSS_GROUPS order. */}
      {groups.map((group) => (
        <section
          className="category-section boss-viewer-section"
          id={sectionId(group)}
          key={group}
        >
          <h2 className="boss-viewer-group-title">{labels.groupLabels[group] ?? group}</h2>
          {/* "is-still" pauses the thumbnails' animations once they have settled. */}
          <div className={`boss-viewer-grid${still ? " is-still" : ""}`}>
            {BOSS_SCREEN_META.filter((meta) => meta.group === group).map((meta) => {
              // The screen's name in this language.
              const name = labels.names[meta.kind] ?? meta.name;
              // Whether this is the screen last seen full screen, whose card offers the share line.
              const sharing = lastSeen === meta.kind;
              return (
                // The wrapper holds the card and, on one card at a time, the Copy button beside it.
                <div key={meta.kind} className={`boss-viewer-item${sharing ? " has-share" : ""}`}>
                  <button
                    // Kept by screen, so focus can come back to this card.
                    ref={(el) => {
                      // Registered while on the page.
                      if (el) cardRefs.current.set(meta.kind, el);
                      // Forgotten when it leaves.
                      else cardRefs.current.delete(meta.kind);
                    }}
                    type="button"
                    className="boss-viewer-card"
                    // Opens the screen, remembering which card did.
                    onClick={() => open(meta.kind)}
                    // "Open Apple II": what pressing it does, and to which screen.
                    aria-label={`${labels.openLabel} ${name}`}
                  >
                    {/* The live thumbnail, a real render of the screen, scaled down (decorative here). */}
                    <span className="boss-viewer-thumb" aria-hidden="true">
                      <BossScreenThumb kind={meta.kind} />
                    </span>
                    {/* Name and year, then the blurb. */}
                    <span className="boss-viewer-meta">
                      <span className="boss-viewer-name">
                        {name}
                        <span className="boss-viewer-year mono"> · {meta.year}</span>
                      </span>
                      <span className="boss-viewer-blurb">
                        {labels.blurbs[meta.kind] ?? meta.blurb}
                      </span>
                    </span>
                  </button>
                  {/* The share line of the screen last seen: its name and year, then the page's address. */}
                  {sharing && (
                    <ToyShare
                      className="boss-viewer-share"
                      text={shareText({ title: fillTemplate(labels.shareLine, { name, year: meta.year }), lines: [], locale, slug: SLUG })}
                      labels={labels.share}
                      // The button's name says which screen it copies ("Copy: Apple II · 1977").
                      subject={`${name} · ${meta.year}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {active && (
        <BossApp
          kind={active}
          // Closing makes the screen on show the one to share.
          onDismiss={dismiss}
          onNavigate={(k) => setActive(k)}
          hint={labels.bossHint}
          dismissLabel={labels.bossDismiss}
        />
      )}
    </>
  );
}
