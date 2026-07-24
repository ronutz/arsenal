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
  /** Precomputed "N articles" badge. */
  countBadge: string;
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
        <div key={g.key} id={`paths-${g.key}`}>
          <h3 className="certs-group-title">{g.label}</h3>

          <div className="reading-path-list">
            {g.paths.map((path) => {
              const isOpen = !!open[path.id];
              return (
                <div
                  className="certhub-note"
                  id={path.id}
                  key={path.id}
                  style={{ "--note-accent": path.color } as CSSProperties}
                >
                  <h4 className="certhub-note-title">
                    <span
                      className="category-dot"
                      style={{ background: path.color }}
                      aria-hidden
                    />{" "}
                    {path.title}{" "}
                    <span className="certhub-guide-code mono">{path.countBadge}</span>
                  </h4>
                  <p className="certhub-note-body">{path.lede}</p>

                  {/* The toggle: title, badge and lede stay visible; the
                      syllabus and practice bench hide behind this. */}
                  <button
                    type="button"
                    className="certhub-cert-row"
                    aria-expanded={isOpen}
                    aria-controls={`${path.id}-contents`}
                    onClick={() => setOpen((o) => ({ ...o, [path.id]: !o[path.id] }))}
                  >
                    <span className="certhub-guide-cta" aria-hidden="true">
                      {isOpen ? "\u25be" : "\u25b8"}
                    </span>
                    <span className="certhub-guide-name">
                      {isOpen ? hideContentsLabel : seeContentsLabel}
                    </span>
                  </button>

                  {isOpen && (
                    <div id={`${path.id}-contents`}>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
