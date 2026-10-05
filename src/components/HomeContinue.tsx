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
// ============================================================================

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RECENT_KEY, type RecentPage } from "./RecentPagesRecorder";

export default function HomeContinue() {
  const t = useTranslations("home.front");
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

  if (pages.length === 0) return null;

  return (
    <section className="section continue-section" aria-label={t("continueTitle")}>
      <div className="container section-narrow">
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
    </section>
  );
}
