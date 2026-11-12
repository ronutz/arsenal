"use client";

// ============================================================================
// src/components/HomeContinue.tsx
// ----------------------------------------------------------------------------
// CONTINUE WHERE YOU LEFT OFF (2026-10-05, home page review item 19, PRIME's
// decision). The front door's one personal touch, built the only way this
// site builds such things: from the reader's own browser storage
// (RecentPagesRecorder), shown only when there is something to show, with
// the sentence that says where it lives ("Stored only in this browser. No
// account.") and a button that forgets it. The server render carries nothing
// (the list exists only after hydration, so there is no mismatch and a first
// visit sees no empty box); a reader who clears site data starts clean.
//
// MY DESK BESIDE IT (PRIME 12/11/2026 12:42, "a block on Home beside
// 'continue'"): the section now holds two blocks side by side on a wide screen
// (one above the other on a phone): the trail, when there is one, and the
// reader's desk (HomeDesk), which is always there once the browser has read
// it: a summary for a reader with a desk, one inviting sentence otherwise. The
// section is drawn only after hydration, as before, at the foot of the page.
// ============================================================================

import { useEffect, useState } from "react";
// The desk's block (src/components/desk/HomeDesk.tsx).
import HomeDesk from "./desk/HomeDesk";
// Whether this browser has been read yet (the section waits for it, so a server render carries nothing).
import { useDesk } from "@/lib/desk/useDesk";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RECENT_KEY, type RecentPage } from "./RecentPagesRecorder";

export default function HomeContinue() {
  const t = useTranslations("home.front");
  // The desk's state: the section is drawn once it has been read in the browser.
  const { ready } = useDesk();
  // The remembered pages; empty until read, and after "forget".
  const [pages, setPages] = useState<RecentPage[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      const list = raw ? (JSON.parse(raw) as RecentPage[]) : [];
      // Only well-formed entries, newest first as stored.
      setPages(list.filter((p) => p && typeof p.path === "string" && typeof p.title === "string").slice(0, 4));
    } catch {
      /* no storage: nothing to continue */
    }
  }, []);

  /** Forget the trail: the reader's control over the one thing the site remembers for them. */
  const forget = () => {
    try { window.localStorage.removeItem(RECENT_KEY); } catch { /* nothing to remove */ }
    setPages([]);
  };

  // Nothing until the browser has been read (the desk block is always there after that).
  if (!ready) return null;

  return (
    <section className="section continue-section" aria-label={pages.length > 0 ? t("continueTitle") : t("deskTitle")}>
      <div className="container section-narrow continue-grid">
        {/* The trail, when there is one. */}
        {pages.length > 0 && (
          <div className="continue-trail">
            <div className="continue-head">
              <h2 className="section-title continue-title">{t("continueTitle")}</h2>
              <button type="button" className="continue-forget" onClick={forget}>{t("continueForget")}</button>
            </div>
            <ul className="continue-list">
              {pages.map((p) => (
                <li key={p.path}><Link href={p.path} className="continue-link">{p.title} <span aria-hidden="true">&#8594;</span></Link></li>
              ))}
            </ul>
            <p className="continue-note">{t("continueNote")}</p>
          </div>
        )}
        {/* My desk, beside it. */}
        <HomeDesk />
      </div>
    </section>
  );
}
