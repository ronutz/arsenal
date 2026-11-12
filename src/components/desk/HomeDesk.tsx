"use client";

// SPDX-FileCopyrightText: 2026 Rodolfo Nützmann <https://ronutz.com>
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// src/components/desk/HomeDesk.tsx
// ----------------------------------------------------------------------------
// MY DESK ON THE HOME PAGE, beside "Continue where you left off" (PRIME
// 12/11/2026 12:42: "a block on Home beside 'continue'"). For a reader with a
// desk: how much it holds and how far the path in progress has come, in words
// with a single-hue bar, and the way to the page. For a reader without one: one
// sentence on what it is and where it is kept. Light on purpose: no site index
// is fetched here (an adopted path with no typed name is called "your path in
// progress"); the desk page has the titles.
// ============================================================================

// The page's strings.
import { useTranslations } from "next-intl";
// Locale-aware links.
import { Link } from "@/i18n/navigation";
// The desk.
import { pathInProgress, pathProgress } from "@/lib/desk/store";
// The desk in a component.
import { useDesk } from "@/lib/desk/useDesk";

/**
 * The block.
 *
 * @returns the block, or nothing before the desk is read
 */
export default function HomeDesk() {
  // The words (the home page's own namespace).
  const t = useTranslations("home.front");
  // The desk.
  const { data, ready } = useDesk();
  // Nothing on the server or before the desk is read (the section is drawn only in the browser).
  if (!ready) return null;
  // How much it holds.
  const saved = Object.keys(data.saved).length;
  // Read marks.
  const read = Object.keys(data.read).length;
  // Paths.
  const paths = data.paths.length;
  // The path in progress, if any.
  const cur = pathInProgress(data);
  // That path and its progress.
  const path = cur ? data.paths[cur.path] : null;
  // Done of total.
  const prog = path ? pathProgress(path, data.read) : null;
  // The block.
  return (
    <div className="home-desk">
      <h2 className="section-title continue-title">{t("deskTitle")}</h2>
      {saved + read + paths === 0 ? (
        // A new reader: what it is, and where it is kept.
        <p className="continue-note home-desk-invite">{t("deskInvite")}</p>
      ) : (
        <>
          <p className="home-desk-summary mono">{t("deskSummary", { saved, paths, read })}</p>
          {path && prog && (
            <p className="desk-progress">
              <span className="desk-progress-text">{path.name ? t("deskPath", { name: path.name, done: prog.done, total: prog.total }) : t("deskPathUnnamed", { done: prog.done, total: prog.total })}</span>
              <span className="desk-bar" aria-hidden="true">
                <span className="desk-bar-fill" style={{ width: `${prog.total ? Math.round((prog.done / prog.total) * 100) : 0}%` }} />
              </span>
            </p>
          )}
        </>
      )}
      <p className="home-desk-open">
        <Link href="/desk" className="continue-link">{t("deskOpen")} <span aria-hidden="true">&#8594;</span></Link>
      </p>
    </div>
  );
}
