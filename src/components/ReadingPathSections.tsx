"use client";

// ============================================================================
// src/components/ReadingPathSections.tsx
// ----------------------------------------------------------------------------
// COLLAPSIBLE READING PATHS for /study-guides (PRIME directive 2026-07-24).
//
// WHAT CHANGED AND WHY: the page previously rendered every path with its full
// syllabus expanded, so the index was a wall of numbered links and a reader
// could not scan what paths exist. Each path now shows only its title, badge
// and lede, with the steps and practice bench behind a "See contents" toggle -
// COLLAPSED by default - so the page reads as a menu first and a syllabus
// second.
//
// ORDERING (PRIME): paths are grouped, and the groups render in a fixed order
// with the vendor-agnostic group FIRST, then F5, Extreme, Fortinet, Netskope,
// Ping, Zscaler. Within a group, paths are sorted ALPHABETICALLY by their
// localized title, using localeCompare so accented titles sort correctly in
// pt-BR and every other locale.
//
// House rules honoured: every display string is resolved server-side and
// passed in as props (this component owns only open/closed state, so it needs
// no i18n namespace client-side); expand-all / collapse-all controls accompany
// every collapsible surface on the site; CSS classes are REUSED from the
// existing certhub/reading-path vocabulary - no new classes introduced. (D-19)
//
// THE CARD, LAID OUT 2026-10-27 (PRIME's UX rule of 11:07, finding R2): each
// card ran its lede and its "At the end" sentence as two paragraphs at some
// 130 characters a line, with the badge in the heading and the way in as a
// plain link. Now: the cards sit two to a row on a desktop with their text held
// near 70 characters a line; level and length are two chips under the title
// (the count chip carries reading-path-count, which check-hub-counts reads);
// the outcome is a labelled block of its own; "Start the path" is the primary
// button and "See contents" the secondary one beside it. The reading-path-*
// classes this needed are in components.css with the rest of the family.
// ============================================================================

import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";

/** One resolved step (article) in a path, already localized server-side. */
export interface PathStep {
  slug: string;
  title: string;
}

/** One resolved practice tool, already localized server-side. */
export interface PathTool {
  id: string;
  href: string;
  name: string;
}

/** One reading path with every display string precomputed. */
export interface PathItem {
  id: string;
  /** Group key this path belongs to, e.g. "general" | "f5" | "extreme". */
  group: string;
  /** Accent colour for the category dot. */
  color: string;
  title: string;
  lede: string;
  /** The level word alone ("Short", "Medium", "Deep"), the card's first chip. */
  depthLabel: string;
  /** The article count alone ("N articles"), the card's second chip. */
  countLabel: string;
  /** F5 (SCOUT, adopted 2026-10-05): the outcome sentence, "You will understand...", authored per path. */
  outcome: string;
  steps: PathStep[];
  tools: PathTool[];
}

export interface PathGroup {
  key: string;
  /** Localized group heading, e.g. "Vendor-agnostic" or "F5". */
  label: string;
  paths: PathItem[];
}

export default function ReadingPathSections({
  groups,
  expandAllLabel,
  collapseAllLabel,
  seeContentsLabel,
  hideContentsLabel,
  stepsLabel,
  practiceLabel,
  outcomeLabel,
  startLabel,
}: {
  groups: PathGroup[];
  expandAllLabel: string;
  collapseAllLabel: string;
  /** Toggle label when the path is collapsed. */
  seeContentsLabel: string;
  /** Toggle label when the path is expanded. */
  hideContentsLabel: string;
  stepsLabel: string;
  practiceLabel: string;
  /** The label before the outcome sentence ("You will understand"). */
  outcomeLabel: string;
  /** The start link's text ("Start the path"). */
  startLabel: string;
}) {
  // One open/closed flag per path id; every path starts COLLAPSED.
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const allIds = groups.flatMap((g) => g.paths.map((p) => p.id));
  const setAll = (value: boolean) =>
    setOpen(Object.fromEntries(allIds.map((id) => [id, value])));

  return (
    <>
      {/* ---- Expand / collapse all, required on every collapsible page ---- */}
      <div className="dig-input-actions">
        <button type="button" className="b64-copy" onClick={() => setAll(true)}>
          {expandAllLabel}
        </button>
        <button type="button" className="b64-copy" onClick={() => setAll(false)}>
          {collapseAllLabel}
        </button>
      </div>

      {/* ---- Groups in the fixed order supplied by the server ---- */}
      {groups.map((g) => (
        <div key={g.key} id={`paths-${g.key}`} className="certs-vendor-block">
          <h3 className="certs-group-title">{g.label}</h3>

          <div className="reading-path-list">
            {g.paths.map((path) => {
              const isOpen = !!open[path.id];
              return (
                <div
                  className="certhub-note reading-path-card"
                  id={path.id}
                  key={path.id}
                  style={{ "--note-accent": path.color } as CSSProperties}
                >
                  {/* The path's name beside its colour dot; the heading holds the name alone. */}
                  <h4 className="certhub-note-title">
                    <span
                      className="category-dot"
                      style={{ background: path.color }}
                      aria-hidden
                    />
                    {path.title}
                  </h4>
                  {/* Level and length, two chips. The count chip's class is what check-hub-counts reads. */}
                  <p className="reading-path-chips">
                    <span className="certhub-guide-badge">{path.depthLabel}</span>
                    <span className="certhub-guide-badge reading-path-count">{path.countLabel}</span>
                  </p>
                  {/* What the path covers. */}
                  <p className="certhub-note-body">{path.lede}</p>
                  {/* F5: the outcome, visible without expanding, as a labelled block apart from the lede. */}
                  <div className="reading-path-outcome">
                    <p className="reading-path-outcome-label">{outcomeLabel}</p>
                    <p className="reading-path-outcome-text">{path.outcome}</p>
                  </div>

                  {/* The two actions: the way in (primary: the path's first article; the syllabus below lists
                      them all), and the toggle (secondary) that shows the syllabus and the practice bench. */}
                  <div className="reading-path-actions">
                    {path.steps.length > 0 && (
                      <Link href={`/learn/${path.steps[0].slug}`} className="btn btn-primary reading-path-start-link">
                        {startLabel} <span aria-hidden="true">&#8594;</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary reading-path-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`${path.id}-contents`}
                      onClick={() => setOpen((o) => ({ ...o, [path.id]: !o[path.id] }))}
                    >
                      {/* The disclosure triangle, decoration only: aria-expanded carries the state. */}
                      <span className="reading-path-toggle-mark" aria-hidden="true">
                        {isOpen ? "\u25be" : "\u25b8"}
                      </span>
                      {/* The label, which also says the state in words. */}
                      {isOpen ? hideContentsLabel : seeContentsLabel}
                    </button>
                  </div>

                  {/* RENDER AND HIDE (LESSONS 19, 2026-08-16). This panel used
                      to be conditionally mounted, so the ordered list of
                      articles and tools that IS the reading path did not exist
                      in the document until a reader clicked. Same fault as the
                      certifications hub, same fix: `hidden` keeps the collapsed
                      appearance, keeps the steps crawlable and findable, and
                      makes `aria-controls` point at an element that exists. */}
                  <div id={`${path.id}-contents`} hidden={!isOpen}>
                      <p className="certhub-note-body">
                        <strong>{stepsLabel}:</strong>
                      </p>
                      <ol className="reading-path-steps">
                        {path.steps.map((a) => (
                          <li key={a.slug}>
                            <Link href={`/learn/${a.slug}`} className="certguide-resource-link">
                              {a.title}
                            </Link>
                          </li>
                        ))}
                      </ol>
                      {path.tools.length > 0 && (
                        <p className="certhub-note-body">
                          <strong>{practiceLabel}:</strong>{" "}
                          {path.tools.map((tl, i) => (
                            <span key={tl.id}>
                              {i > 0 && " \u00b7 "}
                              <Link href={tl.href} className="certguide-resource-link">
                                {tl.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
